const assert = require('node:assert/strict');
const test = require('node:test');

const { initDatabase, closeDatabase } = require('../server/db/sqlite');
const { createSessionStore } = require('../server/db/sessionStore');
const { validateAction } = require('../server/agent/actionSchema');
const { createToolExecutor } = require('../server/agent/toolExecutor');
const { createSessionOrchestrator } = require('../server/agent/sessionOrchestrator');

test('toolExecutor search_leads runs batch collection and returns summarized state', async () => {
  const executor = createToolExecutor({
    collectLeadsByStrategy: async () => ({
      total: 2,
      pagesFetched: 3,
      pois: [
        { id: 'A', name: '店A', adname: '浦东新区', biz_ext: { rating: '4.2' } },
        { id: 'B', name: '店B', adname: '徐汇区', biz_ext: { rating: '4.8' } },
      ],
      meta: { requests: 3, districts: [], subcategories: ['4S店'] },
    }),
  });

  const result = await executor.execute({
    action: 'search_leads',
    args: { city: '上海', category: 'automotive', subcategory: '4S店' },
    state: {},
  });

  assert.equal(result.summary.total, 2);
  assert.equal(result.summary.leadCount, 2);
  assert.equal(result.statePatch.category, 'automotive');
  assert.equal(result.rawPois.length, 2);
});

test('toolExecutor search_leads reports partial results when AMap rate limit is hit', async () => {
  const executor = createToolExecutor({
    collectLeadsByStrategy: async () => ({
      total: 1,
      pagesFetched: 1,
      pois: [{ id: 'A', name: '店A', adname: '浦东新区', biz_ext: { rating: '4.2' } }],
      meta: {
        requests: 2,
        districts: [{ adcode: '310115', name: '浦东新区' }],
        subcategories: ['4S店'],
        rateLimited: true,
      },
    }),
  });

  const result = await executor.execute({
    action: 'search_leads',
    args: { city: '上海', category: 'automotive', subcategory: '4S店' },
    state: {},
  });

  assert.match(result.assistantMessage, /高德限流/);
  assert.equal(result.summary.total, 1);
});

test('toolExecutor search_leads expands broad categories when no explicit subcategory is given', async () => {
  let capturedSubcategories;
  const executor = createToolExecutor({
    collectLeadsByStrategy: async ({ subcategories, maxDistricts, maxPagesPerSearch }) => {
      capturedSubcategories = {
        subcategories,
        maxDistricts,
        maxPagesPerSearch,
      };
      return {
        total: 1,
        pagesFetched: 1,
        pois: [{ id: 'A', name: '店A', adname: '浦东新区', biz_ext: { rating: '4.2' } }],
        meta: { requests: 1, districts: [], subcategories },
      };
    },
  });

  await executor.execute({
    action: 'search_leads',
    args: { city: '上海', category: 'restaurant' },
    state: {},
  });

  assert.deepEqual(capturedSubcategories.subcategories, ['火锅', '咖啡厅', '快餐', '烧烤', '面馆']);
  assert.equal(capturedSubcategories.maxDistricts, 0);
  assert.equal(capturedSubcategories.maxPagesPerSearch, 100);
});

test('toolExecutor does not expand subdistricts when an explicit district is provided', async () => {
  let capturedOptions;
  const executor = createToolExecutor({
    collectLeadsByStrategy: async (options) => {
      capturedOptions = options;
      return {
        total: 1,
        pagesFetched: 1,
        pois: [{ id: 'A', name: '新能源车门店', adname: '浦东新区', biz_ext: { rating: '4.2' } }],
        meta: { requests: 1, districts: [{ adcode: '浦东新区', name: '浦东新区' }], subcategories: options.subcategories },
      };
    },
  });

  await executor.execute({
    action: 'search_leads',
    args: { city: '上海', category: 'automotive', subcategory: '新能源车', district: '浦东新区' },
    state: {},
  });

  assert.equal(capturedOptions.city, '浦东新区');
  assert.equal(capturedOptions.expandDistricts, false);
  assert.deepEqual(capturedOptions.subcategories, ['新能源车']);
});

test('toolExecutor forwards normalized progress after each collection batch', async () => {
  const progressEvents = [];
  const executor = createToolExecutor({
    collectLeadsByStrategy: async ({ onProgress }) => {
      await onProgress({
        total: 1,
        pagesFetched: 1,
        pois: [{ id: 'A', name: '店A', adname: '浦东新区', biz_ext: { rating: '4.2' } }],
        meta: { requests: 1 },
      });
      return {
        total: 1,
        pagesFetched: 1,
        pois: [{ id: 'A', name: '店A', adname: '浦东新区', biz_ext: { rating: '4.2' } }],
        meta: { requests: 1, districts: [], subcategories: ['4S店'] },
      };
    },
  });

  await executor.execute({
    action: 'search_leads',
    args: { city: '上海', category: 'automotive', subcategory: '4S店' },
    state: {},
    onProgress: async (event) => {
      progressEvents.push(event);
    },
  });

  assert.equal(progressEvents.length, 1);
  assert.deepEqual(progressEvents[0].query, {
    city: '上海',
    category: 'automotive',
    subcategory: '4S店',
    district: null,
  });
  assert.equal(progressEvents[0].results[0].district, '浦东新区');
  assert.equal(progressEvents[0].summary.total, 1);
});

test('toolExecutor filter_results narrows the latest run without calling AMap', async () => {
  const executor = createToolExecutor({
    collectLeadsByStrategy: async () => {
      throw new Error('should not call AMap for local filtering');
    },
  });

  const result = await executor.execute({
    action: 'filter_results',
    args: { keyword: '米其林' },
    latestRun: {
      result: [
        { id: 'A', name: '米其林轮胎服务中心', type: '汽车服务', address: '上海市浦东新区' },
        { id: 'B', name: '普通轮胎店', type: '汽车服务', address: '上海市徐汇区' },
      ],
      result_count: 2,
    },
  });

  assert.equal(result.summary.leadCount, 1);
  assert.equal(result.results[0].name, '米其林轮胎服务中心');
  assert.match(result.assistantMessage, /米其林/);
});

test('sessionOrchestrator persists a user turn and executes a tool action', async () => {
  const db = await initDatabase(':memory:');
  const store = createSessionStore(db);
  const session = await store.createSession({ title: '上海汽车4S店' });

  try {
    const toolExecutor = createToolExecutor({
      collectLeadsByStrategy: async () => ({
        total: 1,
        pagesFetched: 2,
        pois: [
          {
            id: 'A',
            name: '门店A',
            adname: '浦东新区',
            pname: '上海市',
            cityname: '上海市',
            biz_ext: { rating: '4.6' },
          },
        ],
        meta: { requests: 2, districts: [], subcategories: ['4S店'] },
      }),
    });

    const orchestrator = createSessionOrchestrator({
      store,
      deepseekClient: {
        complete: async () => ({
          thought: 'x',
          action: 'search_leads',
          args: { city: '上海', category: 'automotive', subcategory: '4S店' },
        }),
      },
      validateAction,
      toolExecutor,
    });

    const response = await orchestrator.handleMessage({
      sessionId: session.id,
      message: '帮我查找上海的汽车4S店信息',
    });

    assert.equal(response.confirmationRequired, false);
    assert.equal(response.state.category, 'automotive');
    assert.equal(response.results.length, 1);
    assert.equal(response.messages.at(-1).role, 'assistant');
    assert.equal(response.messages.at(-1).tool_name, 'search_leads');

    const bundle = await store.getSessionBundle(session.id);
    assert.equal(bundle.messages.length, 2);
    assert.equal(bundle.state.category, 'automotive');
    assert.equal(bundle.latestRun.result.length, 1);
  } finally {
    await closeDatabase(db);
  }
});

test('orchestrator stores pending plan when action requires confirmation', async () => {
  const db = await initDatabase(':memory:');
  const store = createSessionStore(db);
  const session = await store.createSession({ title: '上海餐饮' });

  try {
    const orchestrator = createSessionOrchestrator({
      store,
      deepseekClient: {
        complete: async () => ({
          thought: 'too many tasks',
          action: 'request_confirmation',
          args: {
            estimatedTasks: 28,
            message: '预计需要执行 28 次采集，是否继续？',
            plan: { city: '上海', category: 'restaurant' },
          },
        }),
      },
      validateAction,
      toolExecutor: createToolExecutor({
        collectLeadsByStrategy: async () => {
          throw new Error('should not run');
        },
      }),
    });

    const response = await orchestrator.handleMessage({
      sessionId: session.id,
      message: '帮我查上海餐饮门店',
    });

    assert.equal(response.confirmationRequired, true);
    assert.equal(response.confirmation.estimatedTasks, 28);

    const bundle = await store.getSessionBundle(session.id);
    assert.equal(bundle.state.pending_confirmation, 1);
    assert.equal(bundle.state.pending_plan_json.plan.category, 'restaurant');
  } finally {
    await closeDatabase(db);
  }
});

test('confirmPendingPlan executes confirmed filter against existing results', async () => {
  const db = await initDatabase(':memory:');
  const store = createSessionStore(db);
  const session = await store.createSession({ title: '上海轮胎' });

  try {
    await store.saveSearchRun(session.id, {
      id: 'initial-run',
      query: { city: '上海', category: 'automotive', subcategory: '轮胎' },
      result: [
        { id: 'A', name: '米其林轮胎服务中心', type: '汽车服务', address: '上海市浦东新区' },
        { id: 'B', name: '普通轮胎店', type: '汽车服务', address: '上海市徐汇区' },
      ],
      result_count: 2,
    });
    await store.saveState(session.id, {
      city: '上海',
      category: 'automotive',
      subcategory: '轮胎',
      pending_confirmation: 1,
      pending_plan_json: {
        action: 'filter_results',
        message: '是否筛选米其林品牌？',
        plan: { keyword: '米其林' },
      },
    });

    const orchestrator = createSessionOrchestrator({
      store,
      deepseekClient: {
        complete: async () => {
          throw new Error('should not ask model during confirmation');
        },
      },
      validateAction,
      toolExecutor: createToolExecutor({
        collectLeadsByStrategy: async () => {
          throw new Error('should not call AMap for confirmed filter');
        },
      }),
    });

    const response = await orchestrator.confirmPendingPlan({ sessionId: session.id });

    assert.equal(response.confirmationRequired, false);
    assert.equal(response.results.length, 1);
    assert.equal(response.results[0].name, '米其林轮胎服务中心');
    assert.equal(response.messages.at(-1).tool_name, 'filter_results');

    const bundle = await store.getSessionBundle(session.id);
    assert.equal(bundle.latestRun.result.length, 1);
    assert.equal(bundle.state.pending_confirmation, 0);
  } finally {
    await closeDatabase(db);
  }
});

test('confirmPendingPlan rejects confirmations without a DeepSeek plan', async () => {
  const db = await initDatabase(':memory:');
  const store = createSessionStore(db);
  const session = await store.createSession({ title: '上海轮胎' });

  try {
    await store.saveSearchRun(session.id, {
      id: 'initial-run',
      query: { city: '上海', category: 'automotive', subcategory: '轮胎' },
      result: [
        { id: 'A', name: '米其林轮胎服务中心', type: '汽车服务', address: '上海市浦东新区' },
        { id: 'B', name: '普通轮胎店', type: '汽车服务', address: '上海市徐汇区' },
      ],
      result_count: 2,
    });
    await store.saveState(session.id, {
      city: '上海',
      category: 'automotive',
      subcategory: '轮胎',
      pending_confirmation: 1,
      pending_plan_json: {
        message: '您是要筛选出米其林品牌的轮胎店吗？请确认，我将为您筛选。',
      },
    });
    await store.appendMessage(session.id, {
      role: 'user',
      content: '米其林',
    });

    const orchestrator = createSessionOrchestrator({
      store,
      deepseekClient: {
        complete: async () => {
          throw new Error('should not ask model during confirmation');
        },
      },
      validateAction,
      toolExecutor: createToolExecutor({
        collectLeadsByStrategy: async () => {
          throw new Error('should not call AMap for inferred filter');
        },
      }),
    });

    await assert.rejects(
      () => orchestrator.confirmPendingPlan({ sessionId: session.id }),
      /missing an executable plan/
    );
  } finally {
    await closeDatabase(db);
  }
});

test('sessionOrchestrator saves search progress before the full search completes', async () => {
  const db = await initDatabase(':memory:');
  const store = createSessionStore(db);
  const session = await store.createSession({ title: 'incremental search' });

  try {
    let persistedDuringSearch = null;
    const toolExecutor = createToolExecutor({
      collectLeadsByStrategy: async ({ onProgress }) => {
        await onProgress({
          total: 1,
          pagesFetched: 1,
          pois: [
            {
              id: 'A',
              name: '店A',
              adname: '浦东新区',
              pname: '上海市',
              cityname: '上海市',
              biz_ext: { rating: '4.2' },
            },
          ],
          meta: { requests: 1 },
        });
        persistedDuringSearch = await store.getSessionBundle(session.id);

        return {
          total: 2,
          pagesFetched: 2,
          pois: [
            {
              id: 'A',
              name: '店A',
              adname: '浦东新区',
              pname: '上海市',
              cityname: '上海市',
              biz_ext: { rating: '4.2' },
            },
            {
              id: 'B',
              name: '店B',
              adname: '徐汇区',
              pname: '上海市',
              cityname: '上海市',
              biz_ext: { rating: '4.8' },
            },
          ],
          meta: { requests: 2, districts: [], subcategories: ['4S店'] },
        };
      },
    });

    const orchestrator = createSessionOrchestrator({
      store,
      deepseekClient: {
        complete: async () => ({
          thought: 'x',
          action: 'search_leads',
          args: { city: '上海', category: 'automotive', subcategory: '4S店' },
        }),
      },
      validateAction,
      toolExecutor,
    });

    await orchestrator.handleMessage({
      sessionId: session.id,
      message: '帮我查找上海的汽车4S店信息',
    });

    assert.equal(persistedDuringSearch.latestRun.result.length, 1);
    assert.equal(persistedDuringSearch.state.last_result_count, 1);

    const finalBundle = await store.getSessionBundle(session.id);
    assert.equal(finalBundle.latestRun.id, persistedDuringSearch.latestRun.id);
    assert.equal(finalBundle.latestRun.result.length, 2);
    assert.equal(finalBundle.state.last_result_count, 2);
  } finally {
    await closeDatabase(db);
  }
});

test('toolExecutor export_results returns current CSV payload', async () => {
  const executor = createToolExecutor();

  const result = await executor.execute({
    action: 'export_results',
    args: { format: 'csv' },
    latestRun: {
      result: [
        {
          id: 'A',
          name: '门店A',
          type: '餐饮服务',
          address: '上海市浦东新区',
          tel: '13800000000',
          location: '121.5,31.2',
          province: '上海市',
          city: '上海市',
          district: '浦东新区',
          businessArea: '陆家嘴',
          website: '',
          rating: '4.6',
          openTime: '10:00-22:00',
          openTimeDetail: '',
        },
      ],
      result_count: 1,
    },
  });

  assert.match(result.downloads.csv, /^名称,分类,区域,地址,电话,评分\/消费,营业时间\n/);
  assert.match(result.downloads.csv, /门店A/);
  assert.match(result.downloads.csv, /评分 4\.6/);
  assert.doesNotMatch(result.downloads.csv, /121\.5,31\.2/);
});

test('sessionOrchestrator never exposes model thought as assistant content', async () => {
  const db = await initDatabase(':memory:');
  const store = createSessionStore(db);
  const session = await store.createSession({ title: 'phone filter without results' });

  try {
    const internalThought =
      'The user wants to filter leads to only those with phone numbers, but no search has been performed yet in this session.';
    const orchestrator = createSessionOrchestrator({
      store,
      deepseekClient: {
        complete: async () => ({
          thought: internalThought,
          action: 'respond',
          args: {},
        }),
      },
      validateAction,
      toolExecutor: createToolExecutor({
        collectLeadsByStrategy: async () => {
          throw new Error('should not run');
        },
      }),
    });

    const response = await orchestrator.handleMessage({
      sessionId: session.id,
      message: '只看有电话的线索',
    });

    const lastMessage = response.messages.at(-1);
    assert.equal(lastMessage.role, 'assistant');
    assert.equal(lastMessage.tool_name, 'respond');
    assert.doesNotMatch(lastMessage.content, /The user wants/);
    assert.match(lastMessage.content, /先告诉我/);
  } finally {
    await closeDatabase(db);
  }
});

test('multi-turn refine keeps previous search context', async () => {
  const db = await initDatabase(':memory:');
  const store = createSessionStore(db);
  const session = await store.createSession({ title: '上海汽车' });
  let callCount = 0;

  try {
    const toolExecutor = createToolExecutor({
      collectLeadsByStrategy: async ({ city, subcategories }) => {
        callCount += 1;
        return {
          total: 1,
          pagesFetched: 1,
          pois: [
            {
              id: `A-${callCount}`,
              name: `门店${callCount}`,
              adname: city === '浦东新区' ? '浦东新区' : '黄浦区',
              pname: '上海市',
              cityname: '上海市',
              biz_ext: { rating: '4.6' },
              type: subcategories[0] || '4S店',
            },
          ],
          meta: { requests: 1, districts: [], subcategories },
        };
      },
    });

    const actions = [
      {
        thought: 'initial search',
        action: 'search_leads',
        args: { city: '上海', category: 'automotive', subcategory: '4S店' },
      },
      {
        thought: 'refine to district',
        action: 'refine_search',
        args: { district: '浦东新区' },
      },
    ];

    const orchestrator = createSessionOrchestrator({
      store,
      deepseekClient: {
        complete: async () => actions.shift(),
      },
      validateAction,
      toolExecutor,
    });

    await orchestrator.handleMessage({
      sessionId: session.id,
      message: '帮我查找上海的汽车4S店信息',
    });
    const response = await orchestrator.handleMessage({
      sessionId: session.id,
      message: '只看浦东',
    });

    assert.equal(response.state.city, '上海');
    assert.equal(response.state.category, 'automotive');
    assert.equal(response.state.subcategory, '4S店');
    assert.equal(response.state.district, '浦东新区');
    assert.equal(response.results[0].district, '浦东新区');
  } finally {
    await closeDatabase(db);
  }
});

test('new search_leads request does not inherit stale district from previous session state', async () => {
  const db = await initDatabase(':memory:');
  const store = createSessionStore(db);
  const session = await store.createSession({ title: 'stale district guard' });

  try {
    let lastInvocation;
    const toolExecutor = createToolExecutor({
      collectLeadsByStrategy: async ({ city, subcategories }) => {
        lastInvocation = { city, subcategories };
        return {
          total: 1,
          pagesFetched: 1,
          pois: [
            {
              id: 'bj-1',
              name: '北京火锅店',
              adname: '朝阳区',
              pname: '北京市',
              cityname: '北京市',
              type: subcategories[0] || '火锅',
              biz_ext: { rating: '4.6' },
            },
          ],
          meta: { requests: 1, districts: [], subcategories },
        };
      },
    });

    await store.saveState(session.id, {
      city: '上海',
      category: 'automotive',
      subcategory: '4S店',
      district: '黄浦区',
    });

    const orchestrator = createSessionOrchestrator({
      store,
      deepseekClient: {
        complete: async () => ({
          thought: 'search beijing hotpot',
          action: 'search_leads',
          args: { city: '北京', category: 'restaurant', subcategory: '火锅' },
        }),
      },
      validateAction,
      toolExecutor,
    });

    const response = await orchestrator.handleMessage({
      sessionId: session.id,
      message: '帮我查找北京火锅门店信息',
    });

    assert.equal(lastInvocation.city, '北京');
    assert.equal(response.state.city, '北京');
    assert.equal(response.state.category, 'restaurant');
    assert.equal(response.state.subcategory, '火锅');
    assert.equal(response.state.district, null);
    assert.equal(response.results[0].city, '北京市');
  } finally {
    await closeDatabase(db);
  }
});

test('new search_leads request does not inherit stale subcategory from previous session state', async () => {
  const db = await initDatabase(':memory:');
  const store = createSessionStore(db);
  const session = await store.createSession({ title: 'stale subcategory guard' });

  try {
    let lastInvocation;
    const toolExecutor = createToolExecutor({
      collectLeadsByStrategy: async ({ city, subcategories }) => {
        lastInvocation = { city, subcategories };
        return {
          total: 1,
          pagesFetched: 1,
          pois: [
            {
              id: 'bj-restaurant-1',
              name: '北京餐饮门店',
              adname: '朝阳区',
              pname: '北京市',
              cityname: '北京市',
              type: subcategories[0] || '餐饮',
              biz_ext: { rating: '4.3' },
            },
          ],
          meta: { requests: 1, districts: [], subcategories },
        };
      },
    });

    await store.saveState(session.id, {
      city: '上海',
      category: 'restaurant',
      subcategory: '火锅',
      district: null,
    });

    const orchestrator = createSessionOrchestrator({
      store,
      deepseekClient: {
        complete: async () => ({
          thought: 'search beijing restaurants',
          action: 'search_leads',
          args: { city: '北京', category: 'restaurant' },
        }),
      },
      validateAction,
      toolExecutor,
    });

    const response = await orchestrator.handleMessage({
      sessionId: session.id,
      message: '帮我查找北京的餐饮门店信息',
    });

    assert.deepEqual(lastInvocation.subcategories, ['火锅', '咖啡厅', '快餐', '烧烤', '面馆']);
    assert.equal(response.state.city, '北京');
    assert.equal(response.state.category, 'restaurant');
    assert.equal(response.state.subcategory, null);
    assert.equal(response.results[0].type, '火锅');
  } finally {
    await closeDatabase(db);
  }
});

test('sessionOrchestrator does not execute local intent parsing when deepseek fails', async () => {
  const db = await initDatabase(':memory:');
  const store = createSessionStore(db);
  const session = await store.createSession({ title: 'fallback session' });

  try {
    const toolExecutor = createToolExecutor({
      collectLeadsByStrategy: async ({ city, subcategories }) => ({
        total: 1,
        pagesFetched: 1,
        pois: [
          {
            id: 'fallback-1',
            name: '门店A',
            adname: '浦东新区',
            pname: city,
            cityname: city,
            type: subcategories[0] || '4S店',
            biz_ext: { rating: '4.8' },
          },
        ],
        meta: { requests: 1, districts: [], subcategories },
      }),
    });

    const orchestrator = createSessionOrchestrator({
      store,
      deepseekClient: {
        complete: async () => {
          throw new Error('DeepSeek request failed with status 400');
        },
      },
      validateAction,
      toolExecutor,
    });

    const response = await orchestrator.handleMessage({
      sessionId: session.id,
      message: '帮我查找上海的汽车4S店信息',
    });

    assert.equal(response.results.length, 0);
    assert.equal(response.messages.at(-1).tool_name, 'respond');
    assert.match(response.messages.at(-1).content, /AI 助手暂时没有成功理解/);
  } finally {
    await closeDatabase(db);
  }
});

test('sessionOrchestrator does not locally filter when deepseek fails during a follow-up keyword turn', async () => {
  const db = await initDatabase(':memory:');
  const store = createSessionStore(db);
  const session = await store.createSession({ title: 'fallback local filter' });

  try {
    await store.saveState(session.id, {
      city: '上海',
      category: 'automotive',
      subcategory: '轮胎',
    });
    await store.saveSearchRun(session.id, {
      id: 'initial-run',
      query: { city: '上海', category: 'automotive', subcategory: '轮胎' },
      result: [
        { id: 'A', name: '米其林轮胎服务中心', type: '汽车服务', address: '上海市浦东新区' },
        { id: 'B', name: '普通轮胎店', type: '汽车服务', address: '上海市徐汇区' },
      ],
      result_count: 2,
    });

    const orchestrator = createSessionOrchestrator({
      store,
      deepseekClient: {
        complete: async () => {
          throw new Error('DeepSeek unavailable');
        },
      },
      validateAction,
      toolExecutor: createToolExecutor({
        collectLeadsByStrategy: async () => {
          throw new Error('should not call AMap for fallback local filter');
        },
      }),
    });

    const response = await orchestrator.handleMessage({
      sessionId: session.id,
      message: '米其林',
    });

    assert.equal(response.results.length, 2);
    assert.equal(response.messages.at(-1).tool_name, 'respond');
    assert.match(response.messages.at(-1).content, /AI 助手暂时没有成功理解/);
  } finally {
    await closeDatabase(db);
  }
});

test('sessionOrchestrator does not locally phone-filter when deepseek fails during a follow-up turn', async () => {
  const db = await initDatabase(':memory:');
  const store = createSessionStore(db);
  const session = await store.createSession({ title: 'fallback phone filter' });

  try {
    await store.saveState(session.id, {
      city: '上海',
      category: 'automotive',
      subcategory: '轮胎',
    });
    await store.saveSearchRun(session.id, {
      id: 'initial-run',
      query: { city: '上海', category: 'automotive', subcategory: '轮胎' },
      result: [
        { id: 'A', name: '有电话轮胎店', tel: '13800000000', type: '汽车服务' },
        { id: 'B', name: '无电话轮胎店', tel: '', type: '汽车服务' },
      ],
      result_count: 2,
    });

    const orchestrator = createSessionOrchestrator({
      store,
      deepseekClient: {
        complete: async () => {
          throw new Error('DeepSeek unavailable');
        },
      },
      validateAction,
      toolExecutor: createToolExecutor({
        collectLeadsByStrategy: async () => {
          throw new Error('should not call AMap for fallback phone filter');
        },
      }),
    });

    const response = await orchestrator.handleMessage({
      sessionId: session.id,
      message: '只看有电话的',
    });

    assert.equal(response.results.length, 2);
    assert.equal(response.messages.at(-1).tool_name, 'respond');
    assert.match(response.messages.at(-1).content, /AI 助手暂时没有成功理解/);
  } finally {
    await closeDatabase(db);
  }
});

test('sessionOrchestrator binds each result message to its own saved run', async () => {
  const db = await initDatabase(':memory:');
  const store = createSessionStore(db);
  const session = await store.createSession({ title: 'run history binding' });
  let callCount = 0;

  try {
    const toolExecutor = createToolExecutor({
      collectLeadsByStrategy: async () => {
        callCount += 1;
        return {
          total: 2,
          pagesFetched: 1,
          pois: [
            { id: `A-${callCount}`, name: '米其林轮胎服务中心', type: '汽车服务' },
            { id: `B-${callCount}`, name: '普通轮胎店', type: '汽车服务' },
          ],
          meta: { requests: 1, districts: [], subcategories: ['轮胎'] },
        };
      },
    });

    const actions = [
      {
        thought: 'initial search',
        action: 'search_leads',
        args: { city: '上海', category: 'automotive', subcategory: '轮胎' },
      },
      {
        thought: 'filter brand',
        action: 'filter_results',
        args: { keyword: '米其林' },
      },
    ];

    const orchestrator = createSessionOrchestrator({
      store,
      deepseekClient: {
        complete: async () => actions.shift(),
      },
      validateAction,
      toolExecutor,
    });

    await orchestrator.handleMessage({
      sessionId: session.id,
      message: '上海轮胎行业',
    });
    const response = await orchestrator.handleMessage({
      sessionId: session.id,
      message: '米其林',
    });

    const resultMessages = response.messages.filter(
      (message) => message.role === 'assistant' && ['search_leads', 'filter_results'].includes(message.tool_name)
    );

    assert.equal(resultMessages.length, 2);
    assert.ok(resultMessages[0].tool_call_id);
    assert.ok(resultMessages[1].tool_call_id);
    assert.notEqual(resultMessages[0].tool_call_id, resultMessages[1].tool_call_id);
    assert.equal(response.searchRuns.length, 2);

    const firstRun = response.searchRuns.find((run) => run.id === resultMessages[0].tool_call_id);
    const secondRun = response.searchRuns.find((run) => run.id === resultMessages[1].tool_call_id);
    assert.equal(firstRun.result.length, 2);
    assert.equal(secondRun.result.length, 1);
    assert.equal(secondRun.result[0].name, '米其林轮胎服务中心');
  } finally {
    await closeDatabase(db);
  }
});

test('sessionOrchestrator does not locally repair incomplete deepseek search args', async () => {
  const db = await initDatabase(':memory:');
  const store = createSessionStore(db);
  const session = await store.createSession({ title: 'fallback invalid schema' });

  try {
    const toolExecutor = createToolExecutor({
      collectLeadsByStrategy: async ({ city, subcategories }) => ({
        total: 1,
        pagesFetched: 1,
        pois: [
          {
            id: 'fallback-invalid-1',
            name: '门店B',
            adname: '黄浦区',
            pname: city,
            cityname: city,
            type: subcategories[0] || '4S店',
            biz_ext: { rating: '4.5' },
          },
        ],
        meta: { requests: 1, districts: [], subcategories },
      }),
    });

    const orchestrator = createSessionOrchestrator({
      store,
      deepseekClient: {
        complete: async () => ({
          thought: 'search',
          action: 'search_leads',
          args: {},
        }),
      },
      validateAction,
      toolExecutor,
    });

    const response = await orchestrator.handleMessage({
      sessionId: session.id,
      message: '帮我查找上海的汽车4S店信息',
    });

    assert.equal(response.results.length, 0);
    assert.equal(response.messages.at(-1).tool_name, 'respond');
    assert.match(response.messages.at(-1).content, /没有拿到完整的检索条件/);
  } finally {
    await closeDatabase(db);
  }
});

test('sessionOrchestrator uses district only when DeepSeek includes it in search args', async () => {
  const db = await initDatabase(':memory:');
  const store = createSessionStore(db);
  const session = await store.createSession({ title: 'district guard' });
  let capturedOptions;

  try {
    const toolExecutor = createToolExecutor({
      collectLeadsByStrategy: async (options) => {
        capturedOptions = options;
        return {
          total: 1,
          pagesFetched: 1,
          pois: [
            {
              id: 'minhang-coffee-1',
              name: '闵行咖啡店',
              adname: '闵行区',
              pname: '上海市',
              cityname: '上海市',
              type: '餐饮服务;咖啡厅;咖啡厅',
              biz_ext: { rating: '4.6' },
            },
          ],
          meta: { requests: 1, districts: [{ adcode: '闵行区', name: '闵行区' }], subcategories: options.subcategories },
        };
      },
    });

    const orchestrator = createSessionOrchestrator({
      store,
      deepseekClient: {
        complete: async () => ({
          thought: 'search coffee with explicit district',
          action: 'search_leads',
          args: { city: '上海', district: '闵行区', category: 'restaurant', subcategory: '咖啡店' },
        }),
      },
      validateAction,
      toolExecutor,
    });

    const response = await orchestrator.handleMessage({
      sessionId: session.id,
      message: '查找闵行区的咖啡店',
    });

    assert.equal(response.state.district, '闵行区');
    assert.equal(response.state.subcategory, '咖啡店');
    assert.equal(capturedOptions.city, '闵行区');
    assert.equal(capturedOptions.expandDistricts, false);
  } finally {
    await closeDatabase(db);
  }
});
