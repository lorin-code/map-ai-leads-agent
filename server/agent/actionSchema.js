const ALLOWED_ACTIONS = new Set([
  'respond',
  'search_leads',
  'refine_search',
  'filter_results',
  'sort_results',
  'export_results',
  'summarize_results',
  'request_confirmation',
]);

function assertActionArgs(action, args) {
  if (action === 'search_leads') {
    if (!args.city || !args.category) {
      throw new Error('search_leads requires city and category');
    }
  }

  if (action === 'refine_search') {
    const hasAnyRefinement = Boolean(
      args.city || args.category || args.subcategory || args.district
    );
    if (!hasAnyRefinement) {
      throw new Error('refine_search requires at least one refinement field');
    }
  }
}

function validateAction(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Invalid action payload');
  }

  if (!ALLOWED_ACTIONS.has(payload.action)) {
    throw new Error(`Unsupported action: ${payload.action}`);
  }

  const action = {
    thought: typeof payload.thought === 'string' ? payload.thought : '',
    action: payload.action,
    args:
      payload.args && typeof payload.args === 'object' && !Array.isArray(payload.args)
        ? payload.args
        : {},
  };

  assertActionArgs(action.action, action.args);
  return action;
}

module.exports = {
  ALLOWED_ACTIONS,
  validateAction,
};
