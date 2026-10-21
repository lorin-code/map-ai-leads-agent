const { ALLOWED_ACTIONS } = require('./actionSchema');

function buildPrompt({ state = {}, messages = [] } = {}) {
  const system = [
    'You are a lead-search agent for an AMap sales workbench.',
    'Return exactly one JSON object and no markdown, prose, arrays, or code fences.',
    `Allowed actions: ${[...ALLOWED_ACTIONS].join(', ')}.`,
    'Use existing session state when the user asks for refinements.',
    'Preserve every explicit constraint from the user message, including city, district, business category, subcategory, brand, phone availability, and export format.',
    'The required output schema is {"thought":"string","action":"allowed_action","args":{...}}.',
    'The thought field is internal and must never contain text intended for the user.',
    'For respond, args.message must be a concise Chinese user-facing reply.',
    'If the user asks to filter or export but there are no current results, use respond and ask for city, industry, or range first.',
    'For search_leads, args must include city and category, and should include subcategory when present.',
    'If the user names a district or administrative area, include it as args.district exactly as an explicit search constraint.',
    'For refine_search, args must include at least one of city, category, subcategory, or district.',
    'For filtering the current result list by brand, name, phone availability, or keyword, use filter_results instead of search_leads.',
    'For filter_results, use args like {"keyword":"米其林"} or {"phoneOnly":true}. Do not request confirmation for simple local filtering.',
    'Map Chinese business intents to stable categories like automotive, restaurant, hotel, education, fitness, beauty, medical, retail.',
    'Example: user asks for a city, industry, and subcategory -> use search_leads with city, category, and subcategory.',
    'Example: user asks to narrow to a district already named in the message -> use refine_search with that exact district.',
    'Example: after existing results, user provides a brand or keyword -> use filter_results with that keyword.',
  ].join(' ');

  const userContext = JSON.stringify(
    {
      state,
      recentMessages: messages.slice(-10).map((message) => ({
        role: message.role,
        content: message.content,
      })),
    },
    null,
    2
  );

  return {
    system,
    userContext,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userContext },
    ],
  };
}

module.exports = {
  buildPrompt,
};
