const { mkdir, writeFile } = require('node:fs/promises');
const path = require('node:path');

const AMAP_TEXT_SEARCH_ENDPOINT = 'https://restapi.amap.com/v3/place/text';
const AMAP_DISTRICT_ENDPOINT = 'https://restapi.amap.com/v3/config/district';
const DEFAULT_OFFSET = 20;
const DEFAULT_DELAY_MS = 1200;
const DEFAULT_MAX_PAGES = 3;
const DEFAULT_RATE_LIMIT_DELAY_MS = 2500;
const DEFAULT_RATE_LIMIT_RETRIES = 1;
const DEFAULT_MAX_DISTRICTS = 3;

const CSV_HEADERS = [
  'id',
  'name',
  'type',
  'typecode',
  'address',
  'tel',
  'location',
  'province',
  'city',
  'citycode',
  'district',
  'adcode',
  'businessArea',
  'parent',
  'website',
  'rating',
  'cost',
  'openTime',
  'openTimeDetail',
];

function scalar(value) {
  if (value === undefined || value === null || Array.isArray(value)) {
    return '';
  }
  return String(value);
}

function toPositiveInteger(value, fieldName) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`${fieldName} must be a positive integer`);
  }
  return number;
}

function toOptionalPositiveInteger(value, fieldName) {
  if (value === undefined || value === null || value === 0 || value === '0' || value === 'all') {
    return null;
  }
  return toPositiveInteger(value, fieldName);
}

function buildSearchUrl({
  key,
  keywords,
  city,
  types = '',
  page = 1,
  offset = DEFAULT_OFFSET,
  cityLimit = true,
  children = 1,
  extensions = 'all',
}) {
  if (!key) {
    throw new Error('AMap key is required');
  }
  if (!keywords) {
    throw new Error('keywords is required');
  }
  if (!city) {
    throw new Error('city is required');
  }

  const url = new URL(AMAP_TEXT_SEARCH_ENDPOINT);
  url.searchParams.set('key', key);
  url.searchParams.set('keywords', keywords);
  url.searchParams.set('types', types);
  url.searchParams.set('city', city);
  url.searchParams.set('citylimit', String(cityLimit));
  url.searchParams.set('children', String(children));
  url.searchParams.set('offset', String(offset));
  url.searchParams.set('page', String(page));
  url.searchParams.set('extensions', extensions);
  return url.toString();
}

function buildDistrictUrl({
  key,
  keywords,
  subdistrict = 1,
  extensions = 'base',
}) {
  if (!key) {
    throw new Error('AMap key is required');
  }
  if (!keywords) {
    throw new Error('district keywords is required');
  }

  const url = new URL(AMAP_DISTRICT_ENDPOINT);
  url.searchParams.set('key', key);
  url.searchParams.set('keywords', keywords);
  url.searchParams.set('subdistrict', String(subdistrict));
  url.searchParams.set('extensions', extensions);
  return url.toString();
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isRateLimitError(error) {
  return error?.code === 'AMAP_10021' || /10021/.test(error?.message || '');
}

async function fetchJson(fetchImpl, url) {
  const parsedUrl = new URL(url);
  const safeUrl = `${parsedUrl.origin}${parsedUrl.pathname}?${new URLSearchParams(
    [...parsedUrl.searchParams.entries()].filter(([key]) => key !== 'key')
  ).toString()}`;
  let response;
  try {
    if (globalThis.__amapLogger) {
      globalThis.__amapLogger.debug('amap request start', {
        url: safeUrl,
      });
    }
    response = await fetchImpl(url);
  } catch (error) {
    const code = error?.cause?.code || error?.code || 'UNKNOWN';
    const hostname = error?.cause?.hostname || new URL(url).hostname;
    if (globalThis.__amapLogger) {
      globalThis.__amapLogger.error('amap request network failure', {
        error,
        url: safeUrl,
      });
    }
    throw new Error(`AMap network error ${code}: unable to reach ${hostname}`);
  }

  if (!response.ok) {
    if (globalThis.__amapLogger) {
      globalThis.__amapLogger.error('amap http error', {
        url: safeUrl,
        statusCode: response.status,
      });
    }
    throw new Error(`AMap HTTP error ${response.status}`);
  }

  const data = await response.json();
  if (data.status !== '1') {
    if (globalThis.__amapLogger) {
      globalThis.__amapLogger.error('amap api error', {
        url: safeUrl,
        infocode: data.infocode || 'unknown',
        info: data.info || 'unknown error',
      });
    }
    const error = new Error(`AMap API error ${data.infocode || 'unknown'}: ${data.info || 'unknown error'}`);
    error.code = `AMAP_${data.infocode || 'UNKNOWN'}`;
    throw error;
  }

  if (globalThis.__amapLogger) {
    globalThis.__amapLogger.debug('amap request complete', {
      url: safeUrl,
      count: data.count || null,
    });
  }

  return data;
}

async function fetchAllPois({
  key,
  keywords,
  city,
  types = '',
  offset = DEFAULT_OFFSET,
  maxPages = DEFAULT_MAX_PAGES,
  fetchImpl = globalThis.fetch,
  delayMs = DEFAULT_DELAY_MS,
  rateLimitDelayMs = DEFAULT_RATE_LIMIT_DELAY_MS,
  rateLimitRetries = DEFAULT_RATE_LIMIT_RETRIES,
  logger = null,
} = {}) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('fetch is not available; use Node.js 20+ or pass fetchImpl');
  }

  const previousLogger = globalThis.__amapLogger;
  globalThis.__amapLogger = logger || previousLogger || null;

  const safeOffset = toPositiveInteger(offset, 'offset');
  const safeMaxPages = toPositiveInteger(maxPages, 'maxPages');
  const pois = [];
  let total = 0;
  let pagesFetched = 0;

  try {
    logger?.info('amap poi collection start', {
      city,
      keywords,
      types,
      offset: safeOffset,
      maxPages: safeMaxPages,
    });

    for (let page = 1; page <= safeMaxPages; page += 1) {
      if (page > 1 && delayMs > 0) {
        await sleep(delayMs);
      }

      const url = buildSearchUrl({
        key,
        keywords,
        city,
        types,
        offset: safeOffset,
        page,
      });
      let data;
      let attempt = 0;
      while (true) {
        try {
          data = await fetchJson(fetchImpl, url);
          break;
        } catch (error) {
          if (!isRateLimitError(error) || attempt >= rateLimitRetries) {
            throw error;
          }

          attempt += 1;
          logger?.warn('amap rate limit encountered; backing off before retry', {
            city,
            keywords,
            page,
            attempt,
            rateLimitDelayMs,
          });
          if (rateLimitDelayMs > 0) {
            await sleep(rateLimitDelayMs);
          }
        }
      }
      const pagePois = Array.isArray(data.pois) ? data.pois : [];

      if (page === 1) {
        total = Number.parseInt(data.count || '0', 10) || 0;
      }

      pois.push(...pagePois);
      pagesFetched = page;

      const expectedPages = total === 0 ? 1 : Math.ceil(total / safeOffset);
      if (page >= expectedPages || pagePois.length === 0) {
        break;
      }
    }
  } finally {
    globalThis.__amapLogger = previousLogger || null;
  }

  logger?.info('amap poi collection complete', {
    city,
    keywords,
    total,
    pagesFetched,
    collectedPois: pois.length,
  });

  return {
    total,
    pagesFetched,
    pois,
  };
}

async function fetchDistricts({
  key,
  city,
  fetchImpl = globalThis.fetch,
  logger = null,
} = {}) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('fetch is not available; use Node.js 20+ or pass fetchImpl');
  }

  const previousLogger = globalThis.__amapLogger;
  globalThis.__amapLogger = logger || previousLogger || null;
  let data;

  try {
    logger?.info('amap district lookup start', {
      city,
    });
    data = await fetchJson(
      fetchImpl,
      buildDistrictUrl({
        key,
        keywords: city,
      })
    );
  } finally {
    globalThis.__amapLogger = previousLogger || null;
  }

  const roots = Array.isArray(data.districts) ? data.districts : [];
  const candidates = roots
    .map((root) => ({
      root,
      children: root && Array.isArray(root.districts) ? root.districts : [],
    }))
    .filter(({ children }) => children.length > 0)
    .sort((left, right) => right.children.length - left.children.length);

  if (candidates.length > 0) {
    logger?.info('amap district lookup complete', {
      city,
      districtCount: candidates[0].children.length,
      rootName: candidates[0].root?.name || null,
    });
    return candidates[0].children.map((district) => ({
      adcode: scalar(district.adcode),
      name: scalar(district.name),
    }));
  }

  const root = roots[0] || null;
  if (root) {
    logger?.warn('amap district lookup returned fallback root only', {
      city,
      rootName: scalar(root.name),
    });
    return [{ adcode: scalar(root.adcode), name: scalar(root.name) }];
  }

  return [];
}

function dedupePois(pois) {
  const byId = new Map();
  for (const poi of pois) {
    const key = scalar(poi.id) || `${scalar(poi.name)}-${scalar(poi.address)}-${scalar(poi.location)}`;
    if (!byId.has(key)) {
      byId.set(key, poi);
    }
  }
  return [...byId.values()];
}

async function collectLeadsByStrategy({
  key,
  city,
  categoryLabel = '',
  subcategories = [],
  maxDistricts = DEFAULT_MAX_DISTRICTS,
  maxPagesPerSearch = DEFAULT_MAX_PAGES,
  expandDistricts = true,
  fetchDistrictsImpl = fetchDistricts,
  fetchPoisImpl = fetchAllPois,
  logger = null,
  onProgress = null,
} = {}) {
  const districts = expandDistricts ? await fetchDistrictsImpl({ key, city, logger }) : [];
  const districtLimit = toOptionalPositiveInteger(maxDistricts, 'maxDistricts');
  const availableDistricts = districts.length > 0 ? districts : [{ adcode: city, name: city }];
  const effectiveDistricts = districtLimit ? availableDistricts.slice(0, districtLimit) : availableDistricts;
  const effectiveSubcategories = subcategories.length > 0 ? subcategories : [categoryLabel || city];
  const collected = [];
  let pagesFetched = 0;
  let requests = 0;

  logger?.info('amap strategy collection start', {
    city,
    categoryLabel,
    districtCount: effectiveDistricts.length,
    subcategories: effectiveSubcategories,
    maxPagesPerSearch,
  });

  for (const district of effectiveDistricts) {
    for (const subcategory of effectiveSubcategories) {
      let result;
      try {
        result = await fetchPoisImpl({
          key,
          city: district.adcode || city,
          keywords: subcategory,
          offset: DEFAULT_OFFSET,
          maxPages: maxPagesPerSearch,
          delayMs: DEFAULT_DELAY_MS,
          rateLimitDelayMs: DEFAULT_RATE_LIMIT_DELAY_MS,
          rateLimitRetries: DEFAULT_RATE_LIMIT_RETRIES,
          logger: logger?.child({
            district: district.name,
            districtAdcode: district.adcode,
            subcategory,
          }),
        });
      } catch (error) {
        if (!isRateLimitError(error)) {
          throw error;
        }

        logger?.warn('amap strategy collection stopped by rate limit', {
          city,
          district: district.name,
          districtAdcode: district.adcode,
          subcategory,
          requests,
          collectedPois: collected.length,
        });

        const partialPois = dedupePois(collected);
        return {
          total: partialPois.length,
          pagesFetched,
          pois: partialPois,
          meta: {
            requests,
            districts: effectiveDistricts,
            subcategories: effectiveSubcategories,
            rateLimited: true,
            partial: true,
            stoppedAt: {
              district: district.name,
              districtAdcode: district.adcode,
              subcategory,
            },
          },
        };
      }
      collected.push(...result.pois);
      pagesFetched += result.pagesFetched;
      requests += 1;

      if (onProgress) {
        const partialPois = dedupePois(collected);
        await onProgress({
          total: partialPois.length,
          pagesFetched,
          pois: partialPois,
          meta: {
            requests,
            districts: effectiveDistricts,
            subcategories: effectiveSubcategories,
            current: {
              district: district.name,
              districtAdcode: district.adcode,
              subcategory,
            },
          },
        });
      }
    }
  }

  const pois = dedupePois(collected);
  logger?.info('amap strategy collection complete', {
    city,
    requests,
    pagesFetched,
    rawPois: collected.length,
    dedupedPois: pois.length,
  });
  return {
    total: pois.length,
    pagesFetched,
    pois,
    meta: {
      requests,
      districts: effectiveDistricts,
      subcategories: effectiveSubcategories,
    },
  };
}

function normalizePoi(poi) {
  const bizExt = poi.biz_ext && typeof poi.biz_ext === 'object' ? poi.biz_ext : {};

  return {
    id: scalar(poi.id),
    name: scalar(poi.name),
    type: scalar(poi.type),
    typecode: scalar(poi.typecode),
    address: scalar(poi.address),
    tel: scalar(poi.tel),
    location: scalar(poi.location),
    province: scalar(poi.pname),
    city: scalar(poi.cityname),
    citycode: scalar(poi.citycode),
    district: scalar(poi.adname),
    adcode: scalar(poi.adcode),
    businessArea: scalar(poi.business_area),
    parent: scalar(poi.parent),
    website: scalar(poi.website),
    rating: scalar(bizExt.rating),
    cost: scalar(bizExt.cost),
    openTime: scalar(bizExt.open_time),
    openTimeDetail: scalar(bizExt.opentime2),
  };
}

function escapeCsv(value) {
  const text = scalar(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function toCsv(pois) {
  const rows = pois.map(normalizePoi);
  const lines = [CSV_HEADERS.join(',')];
  for (const row of rows) {
    lines.push(CSV_HEADERS.map((header) => escapeCsv(row[header])).join(','));
  }
  return `${lines.join('\n')}\n`;
}

async function ensureParentDir(filePath) {
  const dir = path.dirname(filePath);
  if (dir && dir !== '.') {
    await mkdir(dir, { recursive: true });
  }
}

async function writeOutputs({ pois, jsonPath, csvPath }) {
  if (jsonPath) {
    await ensureParentDir(jsonPath);
    await writeFile(jsonPath, `${JSON.stringify(pois, null, 2)}\n`, 'utf8');
  }

  if (csvPath) {
    await ensureParentDir(csvPath);
    await writeFile(csvPath, toCsv(pois), 'utf8');
  }
}

function readOption(argv, name) {
  const index = argv.indexOf(name);
  if (index === -1) {
    return undefined;
  }
  if (index === argv.length - 1 || argv[index + 1].startsWith('--')) {
    throw new Error(`${name} requires a value`);
  }
  return argv[index + 1];
}

function hasFlag(argv, name) {
  return argv.includes(name);
}

function parseArgs(argv = process.argv.slice(2), env = process.env) {
  if (hasFlag(argv, '--help') || hasFlag(argv, '-h')) {
    return { help: true };
  }

  const options = {
    key: readOption(argv, '--key') || env.AMAP_KEY,
    city: readOption(argv, '--city'),
    keywords: readOption(argv, '--keywords'),
    types: readOption(argv, '--types') || '',
    json: readOption(argv, '--json') || 'data_amap.json',
    csv: readOption(argv, '--csv'),
    offset: readOption(argv, '--offset') ? toPositiveInteger(readOption(argv, '--offset'), 'offset') : DEFAULT_OFFSET,
    maxPages: readOption(argv, '--max-pages')
      ? toPositiveInteger(readOption(argv, '--max-pages'), 'maxPages')
      : DEFAULT_MAX_PAGES,
    delayMs: readOption(argv, '--delay-ms')
      ? toPositiveInteger(readOption(argv, '--delay-ms'), 'delayMs')
      : DEFAULT_DELAY_MS,
  };

  if (!options.key) {
    throw new Error('Missing AMap key. Pass --key or set AMAP_KEY.');
  }
  if (!options.city) {
    throw new Error('Missing --city.');
  }
  if (!options.keywords) {
    throw new Error('Missing --keywords.');
  }

  return options;
}

module.exports = {
  CSV_HEADERS,
  buildSearchUrl,
  collectLeadsByStrategy,
  fetchAllPois,
  fetchDistricts,
  normalizePoi,
  parseArgs,
  scalar,
  toCsv,
  writeOutputs,
};
