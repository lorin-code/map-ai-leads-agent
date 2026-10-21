const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const USER_FACING_FILES = [
  'web/components/workbench/conversation-pane.tsx',
  'web/components/workbench/session-sidebar.tsx',
  'web/components/workbench/inline-results-panel.tsx',
  'web/components/workbench/chat-workspace.tsx',
  'web/lib/agent-client.ts',
];

const INTERNAL_COPY = [
  'chat workspace',
  '当前会话',
  '任务摘要',
  '当前结果',
  '会话工作台',
  '当前草稿',
  '未保存草稿',
  '正式会话',
  '真实会话',
  '真实消息',
  'draft',
  'live',
  '结构化结果',
  '检索结果',
  '下载 CSV',
  '下载 JSON',
  '执行检索',
  '继续细化',
  '准备导出',
  '本轮消息',
  '工作台初始化失败',
  '门店',
  '门店线索助手',
  '找门店',
  '门店助手',
  '哪类门店',
  '找到的门店',
  '门店数',
  '家门店',
];

function containsUserFacingPhrase(source, phrase) {
  if (/^[a-z ]+$/i.test(phrase)) {
    return source.includes(`"${phrase}"`) || source.includes(`>${phrase}<`);
  }

  return source.includes(phrase);
}

test('workbench user-facing copy avoids internal product and system terms', () => {
  const offenders = [];

  for (const file of USER_FACING_FILES) {
    const fullPath = path.join(__dirname, '..', file);
    const source = readFileSync(fullPath, 'utf8');
    for (const phrase of INTERNAL_COPY) {
      if (containsUserFacingPhrase(source, phrase)) {
        offenders.push(`${file}: ${phrase}`);
      }
    }
  }

  assert.deepEqual(offenders, []);
});
