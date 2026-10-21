const assert = require('node:assert/strict');
const { mkdtemp, readFile } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  buildSearchUrl,
  collectLeadsByStrategy,
  fetchAllPois,
  fetchDistricts,
  normalizePoi,
  parseArgs,
  writeOutputs,
} = require('../server/integrations/amapClient');

test('buildSearchUrl creates an encoded AMap text search URL', () => {
  const url = buildSearchUrl({
    key: 'test-key',
    keywords: '钢琴 培训',
    city: '上海',
    types: '141400',
    page: 2,
    offset: 20,
  });

  const parsed = new URL(url);
  assert.equal(parsed.origin, 'https://restapi.amap.com');
  assert.equal(parsed.pathname, '/v3/place/text');
  assert.equal(parsed.searchParams.get('key'), 'test-key');
  assert.equal(parsed.searchParams.get('keywords'), '钢琴 培训');
  assert.equal(parsed.searchParams.get('city'), '上海');
  assert.equal(parsed.searchParams.get('types'), '141400');
  assert.equal(parsed.searchParams.get('page'), '2');
  assert.equal(parsed.searchParams.get('offset'), '20');
  assert.equal(parsed.searchParams.get('citylimit'), 'true');
  assert.equal(parsed.searchParams.get('extensions'), 'all');
});

test('fetchAllPois follows AMap pagination and returns all pages', async () => {
  const requestedPages = [];
  const responses = {
    1: {
      status: '1',
      count: '3',
      pois: [
        { id: '1', name: '第一家', tel: '13800000000' },
        { id: '2', name: '第二家', tel: '13900000000' },
      ],
    },
    2: {
      status: '1',
      count: '3',
      pois: [{ id: '3', name: '第三家', tel: [] }],
    },
  };

  const fetchImpl = async (url) => {
    const page = Number(new URL(url).searchParams.get('page'));
    requestedPages.push(page);
    return {
      ok: true,
      status: 200,
      json: async () => responses[page],
    };
  };

  const result = await fetchAllPois({
    key: 'test-key',
    keywords: '钢琴',
    city: '上海',
    offset: 2,
    fetchImpl,
    delayMs: 0,
  });

  assert.deepEqual(requestedPages, [1, 2]);
  assert.equal(result.total, 3);
  assert.equal(result.pois.length, 3);
  assert.equal(result.pagesFetched, 2);
});

test('fetchAllPois throws a useful error when AMap returns an API error', async () => {
  const fetchImpl = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      status: '0',
      infocode: '10001',
      info: 'INVALID_USER_KEY',
    }),
  });

  await assert.rejects(
    () =>
      fetchAllPois({
        key: 'bad-key',
        keywords: '钢琴',
        city: '上海',
        fetchImpl,
        delayMs: 0,
      }),
    /AMap API error 10001: INVALID_USER_KEY/
  );
});

test('fetchAllPois throws a useful error when AMap is unreachable', async () => {
  const fetchImpl = async () => {
    const error = new Error('fetch failed');
    error.cause = {
      code: 'ENOTFOUND',
      hostname: 'restapi.amap.com',
    };
    throw error;
  };

  await assert.rejects(
    () =>
      fetchAllPois({
        key: 'test-key',
        keywords: '钢琴',
        city: '上海',
        fetchImpl,
        delayMs: 0,
      }),
    /AMap network error ENOTFOUND: unable to reach restapi\.amap\.com/
  );
});

test('fetchAllPois retries when AMap returns a rate-limit response and eventually succeeds', async () => {
  let callCount = 0;
  const fetchImpl = async () => {
    callCount += 1;
    if (callCount === 1) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: '0',
          infocode: '10021',
          info: 'CUQPS_HAS_EXCEEDED_THE_LIMIT',
        }),
      };
    }

    return {
      ok: true,
      status: 200,
      json: async () => ({
        status: '1',
        count: '1',
        pois: [{ id: 'A', name: '店A' }],
      }),
    };
  };

  const result = await fetchAllPois({
    key: 'test-key',
    keywords: '4S店',
    city: '上海',
    fetchImpl,
    delayMs: 0,
    rateLimitRetries: 1,
    rateLimitDelayMs: 0,
  });

  assert.equal(callCount, 2);
  assert.equal(result.total, 1);
  assert.equal(result.pois.length, 1);
});

test('fetchDistricts returns child districts for a city', async () => {
  const fetchImpl = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      status: '1',
      district_count: '1',
      districts: [
        {
          adcode: '310000',
          name: '上海市',
          districts: [
            { adcode: '310101', name: '黄浦区' },
            { adcode: '310104', name: '徐汇区' },
          ],
        },
      ],
    }),
  });

  const districts = await fetchDistricts({
    key: 'test-key',
    city: '上海',
    fetchImpl,
  });

  assert.deepEqual(districts, [
    { adcode: '310101', name: '黄浦区' },
    { adcode: '310104', name: '徐汇区' },
  ]);
});

test('fetchDistricts prefers the deepest district list when AMap returns multiple Shanghai roots', async () => {
  const fetchImpl = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      status: '1',
      district_count: '2',
      districts: [
        {
          adcode: '310000',
          name: '上海市',
          districts: [{ adcode: '310100', name: '上海城区', districts: [] }],
        },
        {
          adcode: '310100',
          name: '上海城区',
          districts: [
            { adcode: '310115', name: '浦东新区', districts: [] },
            { adcode: '310101', name: '黄浦区', districts: [] },
          ],
        },
      ],
    }),
  });

  const districts = await fetchDistricts({
    key: 'test-key',
    city: '上海',
    fetchImpl,
  });

  assert.deepEqual(districts, [
    { adcode: '310115', name: '浦东新区' },
    { adcode: '310101', name: '黄浦区' },
  ]);
});

test('collectLeadsByStrategy batches by district and subcategory and deduplicates POIs', async () => {
  const requested = [];
  const districtFetchImpl = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      status: '1',
      district_count: '1',
      districts: [
        {
          adcode: '310000',
          name: '上海市',
          districts: [
            { adcode: '310101', name: '黄浦区' },
            { adcode: '310104', name: '徐汇区' },
          ],
        },
      ],
    }),
  });

  const fetchPois = async ({ city, keywords }) => {
    requested.push(`${city}:${keywords}`);
    const fixtures = {
      '310101:咖啡厅': [{ id: 'A', name: '店A' }, { id: 'B', name: '店B' }],
      '310101:火锅': [{ id: 'B', name: '店B' }, { id: 'C', name: '店C' }],
      '310104:咖啡厅': [{ id: 'D', name: '店D' }],
      '310104:火锅': [{ id: 'A', name: '店A' }, { id: 'E', name: '店E' }],
    };
    return {
      total: fixtures[`${city}:${keywords}`].length,
      pagesFetched: 1,
      pois: fixtures[`${city}:${keywords}`],
    };
  };

  const result = await collectLeadsByStrategy({
    key: 'test-key',
    city: '上海',
    categoryLabel: '餐饮',
    subcategories: ['咖啡厅', '火锅'],
    fetchDistrictsImpl: (options) => fetchDistricts({ ...options, fetchImpl: districtFetchImpl }),
    fetchPoisImpl: fetchPois,
  });

  assert.deepEqual(requested, [
    '310101:咖啡厅',
    '310101:火锅',
    '310104:咖啡厅',
    '310104:火锅',
  ]);
  assert.equal(result.pois.length, 5);
  assert.equal(result.total, 5);
  assert.equal(result.pagesFetched, 4);
  assert.equal(result.meta.requests, 4);
  assert.equal(result.meta.districts.length, 2);
  assert.equal(result.meta.subcategories.length, 2);
});

test('collectLeadsByStrategy can query an explicit district without expanding subdistricts', async () => {
  let districtLookupCalled = false;
  const requested = [];

  const result = await collectLeadsByStrategy({
    key: 'test-key',
    city: '浦东新区',
    categoryLabel: '汽车',
    subcategories: ['新能源车'],
    expandDistricts: false,
    fetchDistrictsImpl: async () => {
      districtLookupCalled = true;
      return [{ adcode: '310115001', name: '潍坊新村街道' }];
    },
    fetchPoisImpl: async ({ city, keywords }) => {
      requested.push({ city, keywords });
      return {
        total: 1,
        pagesFetched: 1,
        pois: [{ id: 'A', name: '新能源车门店' }],
      };
    },
  });

  assert.equal(districtLookupCalled, false);
  assert.deepEqual(requested, [{ city: '浦东新区', keywords: '新能源车' }]);
  assert.equal(result.pois.length, 1);
  assert.equal(result.meta.requests, 1);
});

test('collectLeadsByStrategy returns partial results when a later request hits AMap rate limit', async () => {
  const fetchPois = async ({ city }) => {
    if (city === '310101') {
      return {
        total: 2,
        pagesFetched: 1,
        pois: [{ id: 'A', name: '店A' }, { id: 'B', name: '店B' }],
      };
    }

    const error = new Error('AMap API error 10021: CUQPS_HAS_EXCEEDED_THE_LIMIT');
    error.code = 'AMAP_10021';
    throw error;
  };

  const result = await collectLeadsByStrategy({
    key: 'test-key',
    city: '上海',
    categoryLabel: '餐饮',
    subcategories: ['火锅'],
    fetchDistrictsImpl: async () => [
      { adcode: '310101', name: '黄浦区' },
      { adcode: '310104', name: '徐汇区' },
    ],
    fetchPoisImpl: fetchPois,
  });

  assert.equal(result.total, 2);
  assert.equal(result.pois.length, 2);
  assert.equal(result.meta.rateLimited, true);
  assert.deepEqual(result.meta.stoppedAt, {
    district: '徐汇区',
    districtAdcode: '310104',
    subcategory: '火锅',
  });
});

test('collectLeadsByStrategy limits district breadth in lightweight mode', async () => {
  const requested = [];
  const result = await collectLeadsByStrategy({
    key: 'test-key',
    city: '上海',
    categoryLabel: '餐饮',
    subcategories: ['餐饮'],
    maxDistricts: 2,
    fetchDistrictsImpl: async () => [
      { adcode: '310101', name: '黄浦区' },
      { adcode: '310104', name: '徐汇区' },
      { adcode: '310115', name: '浦东新区' },
    ],
    fetchPoisImpl: async ({ city, keywords, maxPages }) => {
      requested.push({ city, keywords, maxPages });
      return {
        total: 1,
        pagesFetched: 1,
        pois: [{ id: `${city}-${keywords}`, name: `${city}-${keywords}` }],
      };
    },
  });

  assert.equal(result.meta.districts.length, 2);
  assert.deepEqual(
    requested.map((entry) => entry.city),
    ['310101', '310104']
  );
});

test('collectLeadsByStrategy uses all districts when maxDistricts is 0', async () => {
  const requested = [];
  const result = await collectLeadsByStrategy({
    key: 'test-key',
    city: '上海',
    categoryLabel: '餐饮',
    subcategories: ['餐饮'],
    maxDistricts: 0,
    fetchDistrictsImpl: async () => [
      { adcode: '310101', name: '黄浦区' },
      { adcode: '310104', name: '徐汇区' },
      { adcode: '310115', name: '浦东新区' },
    ],
    fetchPoisImpl: async ({ city, keywords }) => {
      requested.push({ city, keywords });
      return {
        total: 1,
        pagesFetched: 1,
        pois: [{ id: `${city}-${keywords}`, name: `${city}-${keywords}` }],
      };
    },
  });

  assert.equal(result.meta.districts.length, 3);
  assert.deepEqual(
    requested.map((entry) => entry.city),
    ['310101', '310104', '310115']
  );
});

test('normalizePoi keeps lead fields useful for a sales workflow', () => {
  const lead = normalizePoi({
    id: 'B001',
    name: '示例琴行（测试数据）',
    type: '购物服务;专卖店;专营店',
    typecode: '061200',
    address: '示例路1号',
    tel: '00000000000',
    location: '121.5,31.2',
    pname: '上海市',
    cityname: '上海市',
    citycode: '021',
    adname: '黄浦区',
    adcode: '310101',
    business_area: [],
    parent: 'B000_PARENT',
    website: [],
    biz_ext: {
      rating: '4.6',
      cost: '128.00',
      open_time: '09:00-20:00',
      opentime2: '周一至周日 09:00-20:00',
    },
  });

  assert.deepEqual(lead, {
    id: 'B001',
    name: '示例琴行（测试数据）',
    type: '购物服务;专卖店;专营店',
    typecode: '061200',
    address: '示例路1号',
    tel: '00000000000',
    location: '121.5,31.2',
    province: '上海市',
    city: '上海市',
    citycode: '021',
    district: '黄浦区',
    adcode: '310101',
    businessArea: '',
    parent: 'B000_PARENT',
    website: '',
    rating: '4.6',
    cost: '128.00',
    openTime: '09:00-20:00',
    openTimeDetail: '周一至周日 09:00-20:00',
  });
});

test('parseArgs reads CLI options and AMAP_KEY from the environment', () => {
  const options = parseArgs(
    [
      '--city',
      '上海',
      '--keywords',
      '钢琴',
      '--types',
      '141400',
      '--csv',
      'leads.csv',
      '--json',
      'leads.json',
      '--max-pages',
      '3',
    ],
    { AMAP_KEY: 'env-key' }
  );

  assert.equal(options.key, 'env-key');
  assert.equal(options.city, '上海');
  assert.equal(options.keywords, '钢琴');
  assert.equal(options.types, '141400');
  assert.equal(options.csv, 'leads.csv');
  assert.equal(options.json, 'leads.json');
  assert.equal(options.maxPages, 3);
});

test('writeOutputs writes raw JSON and normalized CSV', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'amap-client-'));
  const jsonPath = path.join(dir, 'leads.json');
  const csvPath = path.join(dir, 'leads.csv');

  await writeOutputs({
    pois: [
      {
        id: 'B001',
        name: '带,逗号的店',
        type: '购物服务',
        typecode: '061200',
        address: '第一行\n第二行',
        tel: '00000000000',
        location: '121.5,31.2',
        pname: '上海市',
        cityname: '上海市',
        citycode: '021',
        adname: '黄浦区',
        adcode: '310101',
        parent: 'B000_PARENT',
        biz_ext: { rating: '4.6', cost: '128.00', open_time: '09:00-20:00' },
      },
    ],
    jsonPath,
    csvPath,
  });

  const json = JSON.parse(await readFile(jsonPath, 'utf8'));
  const csv = await readFile(csvPath, 'utf8');

  assert.equal(json.length, 1);
  assert.match(csv, /^id,name,type,typecode,address,tel,location,province,city,citycode,district,adcode,businessArea,parent,website,rating,cost,openTime,openTimeDetail\n/);
  assert.match(csv, /"带,逗号的店"/);
  assert.match(csv, /"第一行\n第二行"/);
});
