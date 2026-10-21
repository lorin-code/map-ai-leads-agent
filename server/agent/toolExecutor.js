const { collectLeadsByStrategy, normalizePoi } = require('../integrations/amapClient');
const { toLeadTableCsv } = require('./leadCsv');

const CATEGORY_PRESETS = {
  automotive: { label: '汽车', subcategories: ['4S店', '汽车维修', '洗车', '汽车配件'] },
  restaurant: { label: '餐饮', subcategories: ['火锅', '咖啡厅', '快餐', '烧烤', '面馆'] },
  hotel: { label: '酒店', subcategories: ['酒店', '快捷酒店', '民宿'] },
  education: { label: '教育培训', subcategories: ['教育培训', '英语培训', '艺术培训', '职业培训'] },
  fitness: { label: '健身', subcategories: ['健身房', '瑜伽', '游泳馆'] },
  beauty: { label: '美容美发', subcategories: ['美容', '美发', '美甲'] },
  medical: { label: '医疗', subcategories: ['医院', '诊所', '口腔'] },
  retail: { label: '零售', subcategories: ['超市', '便利店', '商场', '专卖店'] },
};
const DEFAULT_AGENT_MAX_DISTRICTS = 0;
const DEFAULT_AGENT_MAX_PAGES = 100;

function readPositiveIntegerEnv(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === '') {
    return fallback;
  }
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function readDistrictLimitEnv() {
  const value = process.env.AMAP_AGENT_MAX_DISTRICTS;
  if (value === undefined || value === '' || value === '0' || value === 'all') {
    return DEFAULT_AGENT_MAX_DISTRICTS;
  }
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : DEFAULT_AGENT_MAX_DISTRICTS;
}

const AGENT_MAX_DISTRICTS = readDistrictLimitEnv();
const AGENT_MAX_PAGES = readPositiveIntegerEnv('AMAP_AGENT_MAX_PAGES', DEFAULT_AGENT_MAX_PAGES);

function summarize(leads, total, pagesFetched) {
  const ratings = leads
    .map((lead) => Number.parseFloat(lead.rating))
    .filter((rating) => Number.isFinite(rating));

  return {
    total,
    pagesFetched,
    leadCount: leads.length,
    withPhone: leads.filter((lead) => lead.tel).length,
    withWebsite: leads.filter((lead) => lead.website).length,
    averageRating: ratings.length
      ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1)
      : '0.0',
  };
}

function leadMatchesKeyword(lead, keyword) {
  const normalizedKeyword = String(keyword || '').trim().toLowerCase();
  if (!normalizedKeyword) {
    return true;
  }

  const searchable = [
    lead.name,
    lead.type,
    lead.typecode,
    lead.address,
    lead.tel,
    lead.district,
    lead.businessArea,
    lead.website,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return searchable.includes(normalizedKeyword);
}

function filterResults(results, args = {}) {
  const keyword = args.keyword || args.brand || args.query || args.name || '';
  const district = args.district || '';
  const phoneOnly = Boolean(args.phoneOnly || args.withPhone);

  return results.filter((lead) => {
    if (!leadMatchesKeyword(lead, keyword)) {
      return false;
    }

    if (district && lead.district !== district) {
      return false;
    }

    if (phoneOnly && !lead.tel) {
      return false;
    }

    return true;
  });
}

function resolveSearchArgs(action, args = {}, state = {}) {
  const inheritDistrict = action === 'refine_search';
  const inheritSubcategory = action === 'refine_search';
  return {
    city: args.city || state.city || '',
    category: args.category || state.category || '',
    subcategory:
      args.subcategory !== undefined
        ? args.subcategory
        : inheritSubcategory
          ? (state.subcategory ?? '')
          : '',
    district:
      args.district !== undefined
        ? args.district
        : inheritDistrict
          ? (state.district ?? null)
          : null,
  };
}

function createToolExecutor({
  collectLeadsByStrategy: collectLeadsByStrategyImpl = collectLeadsByStrategy,
  amapKey = process.env.AMAP_KEY || '',
  logger = null,
} = {}) {
  return {
    async execute({ action, args = {}, state = {}, latestRun = null, onProgress = null }) {
      if (action === 'export_results') {
        const currentResults = latestRun?.result || [];
        return {
          assistantMessage:
            args.message ||
            `已准备 ${args.format === 'json' ? 'JSON' : 'CSV'} 导出内容。`,
          statePatch: {},
          results: currentResults,
          summary: summarize(currentResults, latestRun?.result_count || currentResults.length, 0),
          downloads: {
            csv: toLeadTableCsv(currentResults),
            json: `${JSON.stringify(currentResults, null, 2)}\n`,
          },
          downloadFormat: args.format || 'csv',
        };
      }

      if (action === 'respond') {
        return {
          assistantMessage:
            args.message ||
            '先告诉我你想找的城市、行业或范围，我再帮你筛选有电话的线索。',
          statePatch: {},
          results: latestRun?.result || [],
          summary: summarize(latestRun?.result || [], latestRun?.result_count || 0, 0),
          downloads: latestRun
            ? {
              csv: toLeadTableCsv(latestRun.result || []),
              json: `${JSON.stringify(latestRun.result || [], null, 2)}\n`,
              }
            : { csv: '', json: '' },
        };
      }

      if (action === 'filter_results') {
        const currentResults = latestRun?.result || [];
        if (currentResults.length === 0) {
          return {
            assistantMessage: '当前还没有可筛选的线索。请先说明城市和行业，我会先帮你查找。',
            statePatch: {},
            results: [],
            summary: summarize([], 0, 0),
            downloads: { csv: '', json: '' },
          };
        }

        const filteredResults = filterResults(currentResults, args);
        const keyword = args.keyword || args.brand || args.query || args.name || '';
        const summary = summarize(filteredResults, filteredResults.length, 0);
        return {
          assistantMessage: keyword
            ? `已从当前名单中筛选出 ${filteredResults.length} 条包含“${keyword}”的线索。`
            : `已按你的条件筛选出 ${filteredResults.length} 条线索。`,
          statePatch: {
            pending_confirmation: 0,
            pending_plan_json: null,
          },
          results: filteredResults,
          summary,
          downloads: {
            csv: toLeadTableCsv(filteredResults),
            json: `${JSON.stringify(filteredResults, null, 2)}\n`,
          },
          query: {
            ...(latestRun?.query || {}),
            filter: args,
          },
        };
      }

      if (action !== 'search_leads' && action !== 'refine_search') {
        throw new Error(`Unsupported tool action: ${action}`);
      }

      const effectiveArgs = resolveSearchArgs(action, args, state);
      logger?.info('tool executor search start', {
        action,
        city: effectiveArgs.city,
        district: effectiveArgs.district,
        category: effectiveArgs.category,
        subcategory: effectiveArgs.subcategory || null,
      });
      const preset = CATEGORY_PRESETS[effectiveArgs.category];
      if (!effectiveArgs.city) {
        throw new Error('search requires a city');
      }
      if (!preset) {
        throw new Error(`Unsupported category: ${effectiveArgs.category}`);
      }

      const result = await collectLeadsByStrategyImpl({
        key: args.key || amapKey,
        city: effectiveArgs.district || effectiveArgs.city,
        categoryLabel: preset.label,
        subcategories: effectiveArgs.subcategory ? [effectiveArgs.subcategory] : preset.subcategories,
        expandDistricts: !effectiveArgs.district,
        maxDistricts: AGENT_MAX_DISTRICTS,
        maxPagesPerSearch: AGENT_MAX_PAGES,
        logger,
        onProgress: onProgress
          ? async (progress) => {
              const progressLeads = progress.pois.map(normalizePoi);
              await onProgress({
                ...progress,
                query: effectiveArgs,
                rawPois: progress.pois,
                results: progressLeads,
                summary: summarize(progressLeads, progress.total, progress.pagesFetched),
                downloads: {
                  csv: toLeadTableCsv(progressLeads),
                  json: `${JSON.stringify(progress.pois, null, 2)}\n`,
                },
              });
            }
          : null,
      });

      const leads = result.pois.map(normalizePoi);
      const summary = summarize(leads, result.total, result.pagesFetched);
      const downloads = {
        csv: toLeadTableCsv(leads),
        json: `${JSON.stringify(result.pois, null, 2)}\n`,
      };
      const assistantMessage = result.meta?.rateLimited
        ? `已返回当前已采集的 ${leads.length} 条线索，但请求命中了高德限流。建议缩小范围后重试。`
        : (
            args.message ||
            `已完成 ${effectiveArgs.city}${effectiveArgs.subcategory ? ` ${effectiveArgs.subcategory}` : ''} 线索采集。`
          );

      return {
        assistantMessage,
        statePatch: {
          city: effectiveArgs.city,
          category: effectiveArgs.category,
          subcategory: effectiveArgs.subcategory || null,
          district: effectiveArgs.district,
          pending_confirmation: 0,
          pending_plan_json: null,
        },
        rawPois: result.pois,
        results: leads,
        summary,
        meta: result.meta || null,
        downloads,
        query: effectiveArgs,
      };
    },
  };
}

module.exports = {
  CATEGORY_PRESETS,
  createToolExecutor,
};
