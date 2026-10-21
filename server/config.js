function pickDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return '';
}

function getRuntimeConfig(overrides = {}) {
  return {
    amapKey: pickDefined(overrides.amapKey, process.env.AMAP_KEY),
    deepseekApiKey: pickDefined(
      overrides.deepseekApiKey,
      process.env.DEEPSEEK_API_KEY
    ),
    deepseekBaseUrl: pickDefined(
      overrides.deepseekBaseUrl,
      process.env.DEEPSEEK_BASE_URL,
      'https://api.deepseek.com'
    ),
    deepseekModel: pickDefined(
      overrides.deepseekModel,
      process.env.DEEPSEEK_MODEL
    ),
  };
}

module.exports = {
  getRuntimeConfig,
};
