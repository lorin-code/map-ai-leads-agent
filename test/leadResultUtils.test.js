const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ts = require('../web/node_modules/typescript');

function loadLeadResultUtils() {
  const sourcePath = path.join(__dirname, '..', 'web', 'lib', 'lead-result-utils.ts');
  const source = readFileSync(sourcePath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const module = { exports: {} };
  const context = vm.createContext({
    exports: module.exports,
    module,
    require,
  });
  vm.runInContext(transpiled.outputText, context, { filename: sourcePath });
  return module.exports;
}

test('filterAndSortLeads filters by phone, district, and search text before sorting by rating', () => {
  const { filterAndSortLeads } = loadLeadResultUtils();
  const leads = [
    { name: '浦东低分店', district: '浦东新区', address: '世纪大道', tel: '13800000000', rating: '3.9' },
    { name: '浦东高分店', district: '浦东新区', address: '陆家嘴', tel: '13900000000', rating: '4.8' },
    { name: '徐汇高分店', district: '徐汇区', address: '漕溪北路', tel: '13700000000', rating: '4.9' },
    { name: '浦东无电话店', district: '浦东新区', address: '张江', tel: '', rating: '4.7' },
  ];

  const result = filterAndSortLeads(leads, {
    district: '浦东新区',
    phoneOnly: true,
    query: '浦东',
    sortBy: 'rating-desc',
  });

  assert.equal(result.map((lead) => lead.name).join(','), '浦东高分店,浦东低分店');
});

test('buildLeadCsv exports the current filtered view with CSV escaping', () => {
  const { buildLeadCsv } = loadLeadResultUtils();

  const csv = buildLeadCsv([
    {
      id: 'B001',
      name: 'A,店',
      type: '餐饮服务;中餐厅',
      typecode: '050100',
      district: '浦东新区',
      adcode: '310115',
      businessArea: '陆家嘴',
      address: '上海市\n浦东新区',
      tel: '13800000000',
      location: '121.5,31.2',
      province: '上海市',
      city: '上海市',
      citycode: '021',
      parent: 'B000_PARENT',
      rating: '4.8',
      cost: '96.00',
      openTime: '10:00-22:00',
      openTimeDetail: '周一至周日 10:00-22:00',
      website: 'https://example.test',
    },
  ]);

  assert.match(csv, /^名称,分类,区域,地址,电话,评分\/消费,营业时间\n/);
  assert.match(csv, /"A,店"/);
  assert.match(csv, /"上海市\n浦东新区"/);
  assert.match(csv, /评分 4\.8 \/ 人均 96\.00/);
  assert.match(csv, /10:00-22:00 \/ 周一至周日 10:00-22:00/);
  assert.doesNotMatch(csv, /typecode/);
  assert.doesNotMatch(csv, /adcode/);
  assert.doesNotMatch(csv, /121\.5,31\.2/);
});

test('buildLeadDownloadFilename uses task context and sanitizes unsafe characters', () => {
  const { buildLeadDownloadFilename } = loadLeadResultUtils();

  const filename = buildLeadDownloadFilename({
    extension: 'csv',
    filtered: true,
    results: [{ name: 'A' }, { name: 'B' }],
    state: {
      city: '上海',
      district: '浦东新区',
      category: 'restaurant',
      subcategory: '咖啡/茶?店',
    },
  });

  assert.match(filename, /^AI线索助手-上海-浦东新区-咖啡茶店-筛选-2条-\d{8}\.csv$/);
});
