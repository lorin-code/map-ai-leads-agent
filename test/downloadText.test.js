const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ts = require('../web/node_modules/typescript');

function loadAgentClient() {
  const sourcePath = path.join(__dirname, '..', 'web', 'lib', 'agent-client.ts');
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

test('prepareDownloadText adds a UTF-8 BOM for CSV downloads opened by Excel', () => {
  const { prepareDownloadText } = loadAgentClient();

  assert.equal(prepareDownloadText('姓名\n张三\n', 'text/csv;charset=utf-8'), '\ufeff姓名\n张三\n');
  assert.equal(prepareDownloadText('\ufeff姓名\n张三\n', 'text/csv;charset=utf-8'), '\ufeff姓名\n张三\n');
});

test('prepareDownloadText leaves non-CSV downloads untouched', () => {
  const { prepareDownloadText } = loadAgentClient();

  assert.equal(prepareDownloadText('{"姓名":"张三"}', 'application/json;charset=utf-8'), '{"姓名":"张三"}');
});
