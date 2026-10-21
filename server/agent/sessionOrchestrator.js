const { randomUUID } = require('node:crypto');

const { buildPrompt } = require('./promptBuilder');
const { toLeadTableCsv } = require('./leadCsv');

function isSearchAction(action) {
  return action === 'search_leads' || action === 'refine_search' || action === 'filter_results';
}

function supportsProgress(action) {
  return action === 'search_leads' || action === 'refine_search';
}

function resolvePendingAction(pending) {
  const plan = pending?.plan || {};
  if (pending?.action) {
    return pending.action;
  }

  if (plan.action) {
    return plan.action;
  }

  if ((plan.keyword || plan.brand || plan.query || plan.name) && !plan.city && !plan.category) {
    return 'filter_results';
  }

  return 'search_leads';
}

function resolvePendingArgs(pending) {
  const plan = { ...(pending?.plan || {}) };
  if (plan.args && typeof plan.args === 'object') {
    return plan.args;
  }

  delete plan.action;
  return plan;
}

function buildDeepseekErrorAction(error) {
  return {
    thought: 'deepseek unavailable or returned invalid action',
    action: 'respond',
    args: {
      message: error?.message?.includes('requires')
        ? '我没有拿到完整的检索条件，请再补充城市、行业或范围。'
        : 'AI 助手暂时没有成功理解这条消息，请稍后重试或换一种说法。',
    },
  };
}

function createSessionOrchestrator({
  store,
  deepseekClient,
  validateAction,
  toolExecutor,
  logger = null,
} = {}) {
  if (!store || !deepseekClient || !validateAction || !toolExecutor) {
    throw new Error('Session orchestrator requires store, deepseekClient, validateAction, and toolExecutor');
  }

  async function buildResponse(sessionId) {
    const bundle = await store.getSessionBundle(sessionId);
    const latestRun = bundle.latestRun;

    return {
      sessionId,
      session: bundle.session,
      confirmationRequired: Boolean(bundle.state.pending_confirmation),
      confirmation: bundle.state.pending_confirmation
        ? bundle.state.pending_plan_json
        : null,
      messages: bundle.messages,
      state: bundle.state,
      results: latestRun?.result || [],
      searchRuns: (bundle.searchRuns || []).map((run) => ({
        id: run.id,
        query: run.query,
        result: run.result || [],
        result_count: run.result_count || (run.result || []).length,
      })),
      summary: latestRun
        ? {
            total: latestRun.result_count,
            leadCount: latestRun.result.length,
            pagesFetched: 0,
            withPhone: latestRun.result.filter((lead) => lead.tel).length,
            withWebsite: latestRun.result.filter((lead) => lead.website).length,
            averageRating: latestRun.result.length
              ? (
                  latestRun.result
                    .map((lead) => Number.parseFloat(lead.rating))
                    .filter((rating) => Number.isFinite(rating))
                    .reduce((sum, rating) => sum + rating, 0) /
                  Math.max(
                    1,
                    latestRun.result.filter((lead) => Number.isFinite(Number.parseFloat(lead.rating))).length
                  )
                ).toFixed(1)
              : '0.0',
          }
        : {
            total: 0,
            leadCount: 0,
            pagesFetched: 0,
            withPhone: 0,
            withWebsite: 0,
            averageRating: '0.0',
          },
      downloads: latestRun
        ? {
            csv: toLeadTableCsv(latestRun.result || []),
            json: `${JSON.stringify(latestRun.result || [], null, 2)}\n`,
          }
        : { csv: '', json: '' },
    };
  }

  return {
    async handleMessage({ sessionId, message }) {
      const log = logger?.child({ sessionId });
      await store.appendMessage(sessionId, {
        role: 'user',
        content: message,
      });
      log?.info('orchestrator user message appended', {
        message,
      });

      const bundle = await store.getSessionBundle(sessionId);
      const prompt = buildPrompt({
        state: bundle.state,
        messages: bundle.messages,
      });
      let action;
      try {
        action = validateAction(await deepseekClient.complete(prompt));
        log?.info('orchestrator deepseek action selected', {
          action: action.action,
          args: action.args,
        });
      } catch (error) {
        log?.warn('orchestrator deepseek failed; returning error response', {
          error,
        });
        action = buildDeepseekErrorAction(error);
      }

      if (action.action === 'request_confirmation') {
        await store.saveState(sessionId, {
          pending_confirmation: 1,
          pending_plan_json: action.args,
        });
        await store.appendMessage(sessionId, {
          role: 'assistant',
          content: action.args.message || '需要确认后继续执行。',
          tool_name: 'request_confirmation',
        });
        return buildResponse(sessionId);
      }

      const runId = isSearchAction(action.action) ? randomUUID() : null;
      if (runId) {
        await store.saveSearchRun(sessionId, {
          id: runId,
          query: action.args,
          result: [],
          result_count: 0,
        });
      }

      const toolResult = await toolExecutor.execute({
        action: action.action,
        args: action.args,
        state: bundle.state,
        latestRun: bundle.latestRun,
        onProgress: runId && supportsProgress(action.action)
          ? async (progress) => {
              await store.saveSearchRun(sessionId, {
                id: runId,
                query: progress.query || action.args,
                result: progress.results || [],
                result_count: progress.summary?.total || (progress.results || []).length,
              });
            }
          : null,
      });
      log?.info('orchestrator tool execution complete', {
        action: action.action,
        resultCount: toolResult.results?.length || 0,
        summary: toolResult.summary || null,
      });

      if (toolResult.statePatch) {
        await store.saveState(sessionId, toolResult.statePatch);
      }

      if (runId && toolResult.results) {
        await store.saveSearchRun(sessionId, {
          id: runId,
          query: toolResult.query || action.args,
          result: toolResult.results || [],
          result_count: toolResult.summary?.total || (toolResult.results || []).length,
        });
      }

      await store.appendMessage(sessionId, {
        role: 'assistant',
        content: toolResult.assistantMessage || '我需要更多条件才能继续。',
        tool_name: action.action,
        tool_call_id: runId,
      });

      const response = await buildResponse(sessionId);
      response.summary = toolResult.summary || response.summary;
      response.results = toolResult.results || response.results;
      response.downloads = toolResult.downloads || response.downloads;
      response.meta = toolResult.meta || null;
      return response;
    },

    async confirmPendingPlan({ sessionId }) {
      const log = logger?.child({ sessionId });
      const bundle = await store.getSessionBundle(sessionId);
      const pending = bundle.state.pending_plan_json;
      if (!bundle.state.pending_confirmation) {
        throw new Error('No pending confirmation for this session');
      }
      if (!pending || (!pending.action && !pending.plan)) {
        throw new Error('Pending confirmation is missing an executable plan');
      }

      const pendingAction = resolvePendingAction(pending);
      const pendingArgs = resolvePendingArgs(pending);
      const validatedPendingAction = validateAction({
        thought: 'confirmed pending plan',
        action: pendingAction,
        args: pendingArgs,
      });
      const action = validatedPendingAction.action;
      const args = validatedPendingAction.args;
      if (action === 'filter_results' && !args.keyword && !args.brand && !args.query && !args.name) {
        throw new Error('No pending confirmation for this session');
      }

      await store.saveState(sessionId, {
        pending_confirmation: 0,
        pending_plan_json: null,
      });

      const runId = isSearchAction(action) ? randomUUID() : null;
      if (runId) {
        await store.saveSearchRun(sessionId, {
          id: runId,
          query: args,
          result: [],
          result_count: 0,
        });
      }

      const toolResult = await toolExecutor.execute({
        action,
        args,
        state: bundle.state,
        latestRun: bundle.latestRun,
        onProgress: runId && supportsProgress(action)
          ? async (progress) => {
              await store.saveSearchRun(sessionId, {
                id: runId,
                query: progress.query || args,
                result: progress.results || [],
                result_count: progress.summary?.total || (progress.results || []).length,
              });
            }
          : null,
      });
      log?.info('orchestrator pending plan executed', {
        action,
        plan: args,
        resultCount: toolResult.results?.length || 0,
      });

      await store.saveState(sessionId, toolResult.statePatch || {});
      if (runId && toolResult.results) {
        await store.saveSearchRun(sessionId, {
          id: runId,
          query: toolResult.query || args,
          result: toolResult.results || [],
          result_count: toolResult.summary?.total || (toolResult.results || []).length,
        });
      }
      await store.appendMessage(sessionId, {
        role: 'assistant',
        content: toolResult.assistantMessage || '已按确认继续执行。',
        tool_name: action,
        tool_call_id: runId,
      });

      const response = await buildResponse(sessionId);
      response.summary = toolResult.summary || response.summary;
      response.results = toolResult.results || response.results;
      response.downloads = toolResult.downloads || response.downloads;
      response.meta = toolResult.meta || null;
      return response;
    },
  };
}

module.exports = {
  createSessionOrchestrator,
};
