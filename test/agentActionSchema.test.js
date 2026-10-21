const assert = require('node:assert/strict');
const test = require('node:test');

const { validateAction } = require('../server/agent/actionSchema');
const { createDeepSeekClient } = require('../server/agent/deepseekClient');
const { buildPrompt } = require('../server/agent/promptBuilder');

test('validateAction accepts a supported action with object args', () => {
  const action = validateAction({
    thought: 'search automotive dealers',
    action: 'search_leads',
    args: { city: '上海', category: 'automotive', subcategory: '4S店' },
  });

  assert.equal(action.action, 'search_leads');
  assert.deepEqual(action.args, {
    city: '上海',
    category: 'automotive',
    subcategory: '4S店',
  });
});

test('validateAction rejects unknown actions', () => {
  assert.throws(
    () =>
      validateAction({
        thought: 'bad',
        action: 'delete_db',
        args: {},
      }),
    /Unsupported action: delete_db/
  );
});

test('validateAction normalizes missing args to an empty object', () => {
  const action = validateAction({
    thought: 'respond to the user',
    action: 'respond',
  });

  assert.deepEqual(action.args, {});
});

test('validateAction rejects search_leads without required city and category args', () => {
  assert.throws(
    () =>
      validateAction({
        thought: 'bad search',
        action: 'search_leads',
        args: {},
      }),
    /search_leads requires city and category/
  );
});

test('deepseek client parses JSON action responses', async () => {
  let capturedRequestBody;
  const client = createDeepSeekClient({
    apiKey: 'test',
    baseUrl: 'https://example.invalid',
    model: 'deepseek-reasoner',
    fetchImpl: async (_url, options) => {
      capturedRequestBody = JSON.parse(options.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: '{"thought":"x","action":"respond","args":{"message":"ok"}}',
              },
            },
          ],
        }),
      };
    },
  });

  const result = await client.complete({ messages: [] });
  assert.equal(result.action, 'respond');
  assert.deepEqual(result.args, { message: 'ok' });
  assert.equal(capturedRequestBody.model, 'deepseek-reasoner');
});

test('deepseek client surfaces HTTP failures with status context', async () => {
  const client = createDeepSeekClient({
    apiKey: 'test',
    baseUrl: 'https://example.invalid',
    fetchImpl: async () => ({
      ok: false,
      status: 401,
      text: async () => 'unauthorized',
    }),
  });

  await assert.rejects(
    () => client.complete({ messages: [] }),
    /DeepSeek request failed with status 401/
  );
});

test('buildPrompt includes current session state and recent messages', () => {
  const prompt = buildPrompt({
    state: { city: '上海', category: 'automotive', subcategory: '4S店' },
    messages: [{ role: 'user', content: '帮我查找上海的汽车4S店信息' }],
  });

  assert.match(prompt.system, /search_leads/);
  assert.match(prompt.system, /Return exactly one JSON object/);
  assert.match(prompt.system, /city.*category.*subcategory/);
  assert.match(prompt.userContext, /上海/);
  assert.equal(prompt.messages.length, 2);
  assert.equal(prompt.messages[0].role, 'system');
  assert.equal(prompt.messages[1].role, 'user');
});
