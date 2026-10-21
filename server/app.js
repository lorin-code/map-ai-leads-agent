const { randomUUID } = require('node:crypto');

const { collectLeadsByStrategy, fetchAllPois, normalizePoi } = require('./integrations/amapClient');
const { toLeadTableCsv } = require('./agent/leadCsv');
const { getRuntimeConfig } = require('./config');
const { createAgentRoutes } = require('./routes/agent');

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

function send(res, statusCode, contentType, body) {
  res.statusCode = statusCode;
  res.setHeader('content-type', contentType);
  res.end(body);
}

function sendJson(res, statusCode, payload) {
  send(res, statusCode, 'application/json; charset=utf-8', `${JSON.stringify(payload)}\n`);
}

function sendWebShell(res) {
  send(
    res,
    200,
    'text/html; charset=utf-8',
    `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>门店线索助手</title>
  </head>
  <body>
    <main>
      <h1>门店线索助手</h1>
      <p>请启动 Next.js 前端工作台，或访问 /api/health 检查旧 API 服务状态。</p>
    </main>
  </body>
</html>
`
  );
}

async function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => {
      chunks.push(Buffer.from(chunk));
    });
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8').trim();
        resolve(text ? JSON.parse(text) : {});
      } catch (error) {
        reject(new Error('Invalid JSON request body'));
      }
    });
  });
}

function validateSearchPayload(payload) {
  for (const field of ['city']) {
    if (!payload[field] || !String(payload[field]).trim()) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  if (!payload.category && !payload.keywords) {
    throw new Error('Missing required field: category');
  }
}

function summarize(leads, total, pagesFetched) {
  return {
    total,
    pagesFetched,
    leadCount: leads.length,
    withPhone: leads.filter((lead) => lead.tel).length,
    withWebsite: leads.filter((lead) => lead.website).length,
    averageRating: leads.length
      ? (
          leads
            .map((lead) => Number.parseFloat(lead.rating))
            .filter((rating) => Number.isFinite(rating))
            .reduce((sum, rating) => sum + rating, 0) /
          Math.max(
            1,
            leads.filter((lead) => Number.isFinite(Number.parseFloat(lead.rating))).length
          )
        ).toFixed(1)
      : '0.0',
  };
}

function createApp({
  fetchAllPois: fetchAllPoisImpl = fetchAllPois,
  collectLeadsByStrategy: collectLeadsByStrategyImpl = collectLeadsByStrategy,
  agent = null,
  amapKey = getRuntimeConfig().amapKey,
  logger = null,
} = {}) {
  const agentRoutes = agent
    ? createAgentRoutes({
        store: agent.store,
        orchestrator: agent.orchestrator,
        sendJson,
      })
    : null;

  return {
    async handle(req, res) {
      const url = new URL(req.url, 'http://127.0.0.1');
      const { pathname } = url;
      const requestId = randomUUID();
      const requestLogger = logger?.child({
        requestId,
        method: req.method,
        path: pathname,
      });
      const startedAt = Date.now();
      req.requestId = requestId;
      req.logger = requestLogger;

      requestLogger?.info('http request start');

      if (req.method === 'GET' && pathname === '/') {
        sendWebShell(res);
        requestLogger?.info('http request complete', {
          statusCode: 200,
          durationMs: Date.now() - startedAt,
        });
        return;
      }

      if (req.method === 'GET' && pathname === '/api/health') {
        sendJson(res, 200, { ok: true });
        requestLogger?.info('http request complete', {
          statusCode: 200,
          durationMs: Date.now() - startedAt,
        });
        return;
      }

      if (req.method === 'POST' && pathname === '/api/leads/search') {
        try {
          const payload = await readJsonBody(req);
          validateSearchPayload(payload);
          let result;
          if (payload.category && CATEGORY_PRESETS[payload.category]) {
            const preset = CATEGORY_PRESETS[payload.category];
            result = await collectLeadsByStrategyImpl({
              key: amapKey,
              city: payload.city,
              categoryLabel: preset.label,
              subcategories: payload.subcategory ? [payload.subcategory] : preset.subcategories,
              logger: requestLogger,
            });
          } else {
            result = await fetchAllPoisImpl({
              ...payload,
              key: amapKey,
              logger: requestLogger,
            });
          }
          const leads = result.pois.map(normalizePoi);
          sendJson(res, 200, {
            summary: summarize(leads, result.total, result.pagesFetched),
            leads,
            rawPois: result.pois,
            meta: result.meta || null,
            downloads: {
              csv: toLeadTableCsv(leads),
              json: `${JSON.stringify(result.pois, null, 2)}\n`,
            },
          });
          requestLogger?.info('http request complete', {
            statusCode: 200,
            durationMs: Date.now() - startedAt,
            resultCount: leads.length,
          });
        } catch (error) {
          requestLogger?.error('lead search failed', {
            error,
            durationMs: Date.now() - startedAt,
          });
          sendJson(res, 400, { error: error.message });
        }
        return;
      }

      if (agentRoutes) {
        const messageMatch = pathname.match(/^\/api\/agent\/sessions\/([^/]+)\/messages$/);
        const confirmMatch = pathname.match(/^\/api\/agent\/sessions\/([^/]+)\/confirm$/);
        const sessionMatch = pathname.match(/^\/api\/agent\/sessions\/([^/]+)$/);

        if (req.method === 'GET' && pathname === '/api/agent/sessions') {
          await agentRoutes.listSessions(req, res);
          requestLogger?.info('http request complete', {
            statusCode: res.statusCode,
            durationMs: Date.now() - startedAt,
          });
          return;
        }

        if (req.method === 'POST' && pathname === '/api/agent/sessions') {
          await agentRoutes.createSession(req, res);
          requestLogger?.info('http request complete', {
            statusCode: res.statusCode,
            durationMs: Date.now() - startedAt,
          });
          return;
        }

        if (req.method === 'POST' && messageMatch) {
          await agentRoutes.postMessage(req, res, decodeURIComponent(messageMatch[1]));
          requestLogger?.info('http request complete', {
            statusCode: res.statusCode,
            durationMs: Date.now() - startedAt,
          });
          return;
        }

        if (req.method === 'POST' && confirmMatch) {
          try {
            await agentRoutes.confirm(req, res, decodeURIComponent(confirmMatch[1]));
            requestLogger?.info('http request complete', {
              statusCode: res.statusCode,
              durationMs: Date.now() - startedAt,
            });
          } catch (error) {
            requestLogger?.error('agent confirmation failed', {
              error,
              durationMs: Date.now() - startedAt,
            });
            sendJson(res, 400, { error: error.message || '确认执行失败。' });
          }
          return;
        }

        if (req.method === 'DELETE' && sessionMatch) {
          await agentRoutes.deleteSession(req, res, decodeURIComponent(sessionMatch[1]));
          requestLogger?.info('http request complete', {
            statusCode: res.statusCode,
            durationMs: Date.now() - startedAt,
          });
          return;
        }

        if (req.method === 'GET' && sessionMatch) {
          await agentRoutes.getSession(req, res, decodeURIComponent(sessionMatch[1]));
          requestLogger?.info('http request complete', {
            statusCode: res.statusCode,
            durationMs: Date.now() - startedAt,
          });
          return;
        }
      }

      sendJson(res, 404, { error: 'Not found' });
      requestLogger?.warn('http request complete', {
        statusCode: 404,
        durationMs: Date.now() - startedAt,
      });
    },
  };
}

module.exports = {
  CATEGORY_PRESETS,
  createApp,
};
