function createDeepSeekClient({
  apiKey,
  baseUrl = 'https://api.deepseek.com',
  model,
  fetchImpl = globalThis.fetch,
} = {}) {
  if (!apiKey) {
    throw new Error('DeepSeek API key is required');
  }

  if (typeof fetchImpl !== 'function') {
    throw new Error('A fetch implementation is required');
  }

  return {
    async complete({ messages }) {
      const response = await fetchImpl(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: Array.isArray(messages) ? messages : [],
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const body = typeof response.text === 'function' ? await response.text() : '';
        throw new Error(`DeepSeek request failed with status ${response.status}: ${body}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('DeepSeek response did not include message content');
      }

      return JSON.parse(content);
    },
  };
}

module.exports = {
  createDeepSeekClient,
};
