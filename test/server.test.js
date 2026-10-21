const assert = require('node:assert/strict');
const test = require('node:test');

const { CATEGORY_PRESETS, createApp } = require('../server/app');
const { getRuntimeConfig } = require('../server/config');
const { DEFAULT_SQLITE_PATH, resolveDbPath } = require('../server/dbPath');
const { initDatabase, closeDatabase } = require('../server/db/sqlite');
const { createSessionStore } = require('../server/db/sessionStore');

function makeRequest({ method = 'GET', url = '/', body, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const req = {
      method,
      url,
      headers,
      on(event, handler) {
        if (event === 'data' && body !== undefined) {
          const payload = typeof body === 'string' ? body : JSON.stringify(body);
          handler(Buffer.from(payload));
        }
        if (event === 'end') {
          handler();
        }
      },
    };

    const responseHeaders = {};
    const chunks = [];
    const res = {
      statusCode: 200,
      setHeader(name, value) {
        responseHeaders[String(name).toLowerCase()] = value;
      },
      end(chunk) {
        if (chunk) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
        }
        resolve({
          statusCode: this.statusCode,
          headers: responseHeaders,
          body: Buffer.concat(chunks).toString('utf8'),
        });
      },
    };

    Promise.resolve()
      .then(() => createApp().handle(req, res))
      .catch(reject);
  });
}

test('GET /api/health returns ok', async () => {
  const response = await makeRequest({ url: '/api/health' });
  assert.equal(response.statusCode, 200);
  assert.equal(response.headers['content-type'], 'application/json; charset=utf-8');
  assert.deepEqual(JSON.parse(response.body), { ok: true });
});

test('runtime config resolves explicit overrides before environment config', () => {
  const originalAmapKey = process.env.AMAP_KEY;
  const originalDeepseekKey = process.env.DEEPSEEK_API_KEY;
  const originalDeepseekBaseUrl = process.env.DEEPSEEK_BASE_URL;
  const originalDeepseekModel = process.env.DEEPSEEK_MODEL;

  process.env.AMAP_KEY = 'env-amap-key';
  process.env.DEEPSEEK_API_KEY = 'env-deepseek-key';
  process.env.DEEPSEEK_BASE_URL = 'https://env.example.com';
  process.env.DEEPSEEK_MODEL = 'env-deepseek-model';

  try {
    const config = getRuntimeConfig({
      amapKey: 'override-amap-key',
      deepseekApiKey: 'override-deepseek-key',
      deepseekBaseUrl: 'https://override.example.com',
      deepseekModel: 'override-deepseek-model',
    });

    assert.equal(config.amapKey, 'override-amap-key');
    assert.equal(config.deepseekApiKey, 'override-deepseek-key');
    assert.equal(config.deepseekBaseUrl, 'https://override.example.com');
    assert.equal(config.deepseekModel, 'override-deepseek-model');
  } finally {
    if (originalAmapKey === undefined) {
      delete process.env.AMAP_KEY;
    } else {
      process.env.AMAP_KEY = originalAmapKey;
    }

    if (originalDeepseekKey === undefined) {
      delete process.env.DEEPSEEK_API_KEY;
    } else {
      process.env.DEEPSEEK_API_KEY = originalDeepseekKey;
    }

    if (originalDeepseekBaseUrl === undefined) {
      delete process.env.DEEPSEEK_BASE_URL;
    } else {
      process.env.DEEPSEEK_BASE_URL = originalDeepseekBaseUrl;
    }

    if (originalDeepseekModel === undefined) {
      delete process.env.DEEPSEEK_MODEL;
    } else {
      process.env.DEEPSEEK_MODEL = originalDeepseekModel;
    }
  }
});

test('runtime config reads secrets only from environment variables', () => {
  const originalAmapKey = process.env.AMAP_KEY;
  const originalDeepseekKey = process.env.DEEPSEEK_API_KEY;
  const originalDeepseekBaseUrl = process.env.DEEPSEEK_BASE_URL;
  const originalDeepseekModel = process.env.DEEPSEEK_MODEL;

  process.env.AMAP_KEY = 'env-amap-key';
  process.env.DEEPSEEK_API_KEY = 'env-deepseek-key';
  delete process.env.DEEPSEEK_BASE_URL;
  delete process.env.DEEPSEEK_MODEL;

  try {
    const config = getRuntimeConfig();

    assert.equal(config.amapKey, 'env-amap-key');
    assert.equal(config.deepseekApiKey, 'env-deepseek-key');
    assert.equal(config.deepseekBaseUrl, 'https://api.deepseek.com');
    assert.equal(config.deepseekModel, '');
  } finally {
    if (originalAmapKey === undefined) {
      delete process.env.AMAP_KEY;
    } else {
      process.env.AMAP_KEY = originalAmapKey;
    }

    if (originalDeepseekKey === undefined) {
      delete process.env.DEEPSEEK_API_KEY;
    } else {
      process.env.DEEPSEEK_API_KEY = originalDeepseekKey;
    }

    if (originalDeepseekBaseUrl === undefined) {
      delete process.env.DEEPSEEK_BASE_URL;
    } else {
      process.env.DEEPSEEK_BASE_URL = originalDeepseekBaseUrl;
    }

    if (originalDeepseekModel === undefined) {
      delete process.env.DEEPSEEK_MODEL;
    } else {
      process.env.DEEPSEEK_MODEL = originalDeepseekModel;
    }
  }
});

test('default sqlite path resolves to repo data directory from any current working directory', () => {
  const originalCwd = process.cwd();

  try {
    process.chdir('web');
    assert.equal(resolveDbPath(), DEFAULT_SQLITE_PATH);
    assert.equal(resolveDbPath(':memory:'), ':memory:');
  } finally {
    process.chdir(originalCwd);
  }
});

test('POST /api/leads/search returns normalized leads, raw pois, and downloads', async () => {
  let capturedOptions;
  const app = createApp({
    amapKey: 'config-amap-key',
    collectLeadsByStrategy: async (options) => {
      capturedOptions = options;
      return {
        total: 1,
        pagesFetched: 4,
        meta: {
          requests: 4,
          districts: [{ adcode: '310101', name: '黄浦区' }],
          subcategories: ['火锅'],
        },
        pois: [
          {
            id: 'B001',
            name: '示例琴行（测试数据）',
            type: '购物服务;专卖店;专营店',
            address: '示例路1号',
            tel: '00000000000',
            location: '121.5,31.2',
            pname: '上海市',
            cityname: '上海市',
            adname: '黄浦区',
            business_area: [],
            website: [],
            biz_ext: {
              rating: '4.6',
              open_time: '09:00-20:00',
              opentime2: '周一至周日 09:00-20:00',
            },
          },
        ],
      };
    },
  });

  const response = await new Promise((resolve, reject) => {
    const req = {
      method: 'POST',
      url: '/api/leads/search',
      headers: { 'content-type': 'application/json' },
      on(event, handler) {
        if (event === 'data') {
          handler(Buffer.from(JSON.stringify({
            city: '上海',
            category: 'restaurant',
            subcategory: '火锅',
          })));
        }
        if (event === 'end') {
          handler();
        }
      },
    };

    const responseHeaders = {};
    const chunks = [];
    const res = {
      statusCode: 200,
      setHeader(name, value) {
        responseHeaders[String(name).toLowerCase()] = value;
      },
      end(chunk) {
        if (chunk) {
          chunks.push(Buffer.from(String(chunk)));
        }
        resolve({
          statusCode: this.statusCode,
          headers: responseHeaders,
          body: Buffer.concat(chunks).toString('utf8'),
        });
      },
    };

    Promise.resolve()
      .then(() => app.handle(req, res))
      .catch(reject);
  });

  const payload = JSON.parse(response.body);
  assert.equal(response.statusCode, 200);
  assert.equal(payload.summary.total, 1);
  assert.equal(payload.summary.pagesFetched, 4);
  assert.equal(payload.leads[0].district, '黄浦区');
  assert.match(payload.downloads.csv, /^名称,分类,区域,地址,电话,评分\/消费,营业时间\n/);
  assert.match(payload.downloads.csv, /示例琴行（测试数据）/);
  assert.doesNotMatch(payload.downloads.csv, /121\.506172,31\.212428/);
  assert.equal(payload.rawPois.length, 1);
  assert.equal(capturedOptions.key, 'config-amap-key');
  assert.equal(capturedOptions.city, '上海');
  assert.deepEqual(capturedOptions.subcategories, ['火锅']);
});

test('POST /api/leads/search validates required fields before calling AMap', async () => {
  const app = createApp({
    fetchAllPois: async () => {
      throw new Error('should not run');
    },
  });

  const response = await new Promise((resolve, reject) => {
    const req = {
      method: 'POST',
      url: '/api/leads/search',
      headers: { 'content-type': 'application/json' },
      on(event, handler) {
        if (event === 'data') {
          handler(Buffer.from(JSON.stringify({ city: '上海' })));
        }
        if (event === 'end') {
          handler();
        }
      },
    };

    const responseHeaders = {};
    const res = {
      statusCode: 200,
      setHeader(name, value) {
        responseHeaders[String(name).toLowerCase()] = value;
      },
      end(chunk) {
        resolve({
          statusCode: this.statusCode,
          headers: responseHeaders,
          body: String(chunk || ''),
        });
      },
    };

    Promise.resolve()
      .then(() => app.handle(req, res))
      .catch(reject);
  });

  assert.equal(response.statusCode, 400);
  assert.match(response.body, /Missing required field: category/);
});

test('GET / serves the web app shell', async () => {
  const app = createApp();
  const response = await new Promise((resolve, reject) => {
    const req = {
      method: 'GET',
      url: '/',
      headers: {},
      on() {},
    };
    const responseHeaders = {};
    const chunks = [];
    const res = {
      statusCode: 200,
      setHeader(name, value) {
        responseHeaders[String(name).toLowerCase()] = value;
      },
      end(chunk) {
        if (chunk) {
          chunks.push(Buffer.from(String(chunk)));
        }
        resolve({
          statusCode: this.statusCode,
          headers: responseHeaders,
          body: Buffer.concat(chunks).toString('utf8'),
        });
      },
    };

    Promise.resolve()
      .then(() => app.handle(req, res))
      .catch(reject);
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.headers['content-type'], 'text/html; charset=utf-8');
  assert.match(response.body, /门店线索助手/);
});

test('POST /api/agent/sessions creates a session', async () => {
  const db = await initDatabase(':memory:');
  const store = createSessionStore(db);
  const app = createApp({
    agent: {
      store,
      orchestrator: {
        handleMessage: async () => {
          throw new Error('should not run');
        },
        confirmPendingPlan: async () => {
          throw new Error('should not run');
        },
      },
    },
  });

  try {
    const response = await new Promise((resolve, reject) => {
      const req = {
        method: 'POST',
        url: '/api/agent/sessions',
        headers: { 'content-type': 'application/json' },
        on(event, handler) {
          if (event === 'data') {
            handler(Buffer.from(JSON.stringify({ title: '上海汽车4S店' })));
          }
          if (event === 'end') {
            handler();
          }
        },
      };
      const responseHeaders = {};
      const chunks = [];
      const res = {
        statusCode: 200,
        setHeader(name, value) {
          responseHeaders[String(name).toLowerCase()] = value;
        },
        end(chunk) {
          if (chunk) {
            chunks.push(Buffer.from(String(chunk)));
          }
          resolve({
            statusCode: this.statusCode,
            headers: responseHeaders,
            body: Buffer.concat(chunks).toString('utf8'),
          });
        },
      };

      Promise.resolve()
        .then(() => app.handle(req, res))
        .catch(reject);
    });

    const payload = JSON.parse(response.body);
    assert.equal(response.statusCode, 200);
    assert.equal(typeof payload.sessionId, 'string');
    assert.equal(payload.session.title, '上海汽车4S店');
  } finally {
    await closeDatabase(db);
  }
});

test('GET /api/agent/sessions returns historical sessions ordered by updated time', async () => {
  const db = await initDatabase(':memory:');
  const store = createSessionStore(db);
  const older = await store.createSession({ title: '较早会话' });
  const newer = await store.createSession({ title: '最近会话' });
  await store.appendMessage(older.id, {
    role: 'user',
    content: 'older',
  });
  await store.appendMessage(newer.id, {
    role: 'user',
    content: 'newer',
  });
  await store.saveState(newer.id, {
    city: '上海',
    category: 'automotive',
    subcategory: '4S店',
    last_result_count: 91,
  });

  const app = createApp({
    agent: {
      store,
      orchestrator: {
        handleMessage: async () => {
          throw new Error('should not run');
        },
        confirmPendingPlan: async () => {
          throw new Error('should not run');
        },
      },
    },
  });

  try {
    const response = await new Promise((resolve, reject) => {
      const req = {
        method: 'GET',
        url: '/api/agent/sessions',
        headers: {},
        on() {},
      };
      const responseHeaders = {};
      const chunks = [];
      const res = {
        statusCode: 200,
        setHeader(name, value) {
          responseHeaders[String(name).toLowerCase()] = value;
        },
        end(chunk) {
          if (chunk) {
            chunks.push(Buffer.from(String(chunk)));
          }
          resolve({
            statusCode: this.statusCode,
            headers: responseHeaders,
            body: Buffer.concat(chunks).toString('utf8'),
          });
        },
      };

      Promise.resolve()
        .then(() => app.handle(req, res))
        .catch(reject);
    });

    const payload = JSON.parse(response.body);
    assert.equal(response.statusCode, 200);
    assert.equal(payload.sessions.length, 2);
    assert.equal(payload.sessions[0].id, newer.id);
    assert.equal(payload.sessions[0].city, '上海');
    assert.equal(payload.sessions[0].last_result_count, 91);
    assert.equal(payload.sessions[1].id, older.id);
  } finally {
    await closeDatabase(db);
  }
});

test('DELETE /api/agent/sessions/:id removes a stored session', async () => {
  const db = await initDatabase(':memory:');
  const store = createSessionStore(db);
  const session = await store.createSession({ title: '待删除会话' });
  await store.appendMessage(session.id, {
    role: 'user',
    content: 'message',
  });

  const app = createApp({
    agent: {
      store,
      orchestrator: {
        handleMessage: async () => {
          throw new Error('should not run');
        },
        confirmPendingPlan: async () => {
          throw new Error('should not run');
        },
      },
    },
  });

  try {
    const response = await new Promise((resolve, reject) => {
      const req = {
        method: 'DELETE',
        url: `/api/agent/sessions/${session.id}`,
        headers: {},
        on() {},
      };
      const responseHeaders = {};
      const chunks = [];
      const res = {
        statusCode: 200,
        setHeader(name, value) {
          responseHeaders[String(name).toLowerCase()] = value;
        },
        end(chunk) {
          if (chunk) {
            chunks.push(Buffer.from(String(chunk)));
          }
          resolve({
            statusCode: this.statusCode,
            headers: responseHeaders,
            body: Buffer.concat(chunks).toString('utf8'),
          });
        },
      };

      Promise.resolve()
        .then(() => app.handle(req, res))
        .catch(reject);
    });

    const payload = JSON.parse(response.body);
    assert.equal(response.statusCode, 200);
    assert.equal(payload.deleted, true);

    const sessions = await store.listSessions();
    assert.equal(sessions.length, 0);
  } finally {
    await closeDatabase(db);
  }
});

test('POST /api/agent/sessions/:id/messages runs the orchestrator and returns session payload', async () => {
  const db = await initDatabase(':memory:');
  const store = createSessionStore(db);
  const session = await store.createSession({ title: '测试会话' });
  const app = createApp({
    agent: {
      store,
      orchestrator: {
        handleMessage: async ({ sessionId, message }) => ({
          sessionId,
          message,
          confirmationRequired: false,
          messages: [
            { role: 'user', content: message },
            { role: 'assistant', content: '已执行搜索', tool_name: 'search_leads' },
          ],
          state: { city: '上海', category: 'automotive', subcategory: '4S店' },
          results: [{ id: 'A', name: '门店A' }],
          summary: { total: 1, leadCount: 1, pagesFetched: 1, withPhone: 0, withWebsite: 0, averageRating: '0.0' },
          downloads: { csv: 'id,name\nA,门店A\n', json: '[{"id":"A","name":"门店A"}]\n' },
        }),
        confirmPendingPlan: async () => {
          throw new Error('should not run');
        },
      },
    },
  });

  try {
    const response = await new Promise((resolve, reject) => {
      const req = {
        method: 'POST',
        url: `/api/agent/sessions/${session.id}/messages`,
        headers: { 'content-type': 'application/json' },
        on(event, handler) {
          if (event === 'data') {
            handler(Buffer.from(JSON.stringify({ message: '帮我查找上海的汽车4S店信息' })));
          }
          if (event === 'end') {
            handler();
          }
        },
      };
      const responseHeaders = {};
      const chunks = [];
      const res = {
        statusCode: 200,
        setHeader(name, value) {
          responseHeaders[String(name).toLowerCase()] = value;
        },
        end(chunk) {
          if (chunk) {
            chunks.push(Buffer.from(String(chunk)));
          }
          resolve({
            statusCode: this.statusCode,
            headers: responseHeaders,
            body: Buffer.concat(chunks).toString('utf8'),
          });
        },
      };

      Promise.resolve()
        .then(() => app.handle(req, res))
        .catch(reject);
    });

    const payload = JSON.parse(response.body);
    assert.equal(response.statusCode, 200);
    assert.equal(payload.sessionId, session.id);
    assert.equal(payload.messages.length, 2);
    assert.equal(payload.state.category, 'automotive');
    assert.equal(payload.results.length, 1);
  } finally {
    await closeDatabase(db);
  }
});
