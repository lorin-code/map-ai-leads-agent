const { createDeepSeekClient } = require("./agent/deepseekClient");
const { createSessionOrchestrator } = require("./agent/sessionOrchestrator");
const { createToolExecutor } = require("./agent/toolExecutor");
const { validateAction } = require("./agent/actionSchema");
const { createAuthService } = require("./auth/service");
const { getRuntimeConfig } = require("./config");
const { resolveDbPath } = require("./dbPath");
const { createSessionStore } = require("./db/sessionStore");
const { initDatabase } = require("./db/sqlite");
const { createLogger } = require("./logger");

let runtimePromise = null;

async function createRuntime({
  dbPath = process.env.SQLITE_PATH,
  deepseekApiKey,
  deepseekBaseUrl,
  deepseekModel,
  deepseekFetch = globalThis.fetch,
  amapKey,
  logger = createLogger(),
} = {}) {
  const runtimeConfig = getRuntimeConfig({
    amapKey,
    deepseekApiKey,
    deepseekBaseUrl,
    deepseekModel,
  });
  const resolvedDbPath = resolveDbPath(dbPath);
  const db = await initDatabase(resolvedDbPath);
  const store = createSessionStore(db);
  const auth = createAuthService(db);
  const deepseekClient = runtimeConfig.deepseekApiKey
    ? createDeepSeekClient({
        apiKey: runtimeConfig.deepseekApiKey,
        baseUrl: runtimeConfig.deepseekBaseUrl || undefined,
        model: runtimeConfig.deepseekModel || undefined,
        fetchImpl: deepseekFetch,
      })
    : {
        async complete() {
          throw new Error("DeepSeek API key is not configured");
        },
      };
  const toolExecutor = createToolExecutor({
    amapKey: runtimeConfig.amapKey,
    logger,
  });
  const orchestrator = createSessionOrchestrator({
    store,
    deepseekClient,
    validateAction,
    toolExecutor,
    logger,
  });

  logger.info("shared runtime initialized", {
    dbPath: resolvedDbPath,
    hasAmapKey: Boolean(runtimeConfig.amapKey),
    hasDeepseekApiKey: Boolean(runtimeConfig.deepseekApiKey),
    deepseekBaseUrl: runtimeConfig.deepseekBaseUrl || null,
    deepseekModel: runtimeConfig.deepseekModel || null,
  });

  return {
    db,
    auth,
    logger,
    orchestrator,
    store,
  };
}

function getAgentRuntime(options = {}) {
  if (!runtimePromise) {
    runtimePromise = createRuntime(options);
  }

  return runtimePromise;
}

module.exports = {
  getAgentRuntime,
};
