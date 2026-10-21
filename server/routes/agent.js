async function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => {
      chunks.push(Buffer.from(chunk));
    });
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8').trim();
        resolve(text ? JSON.parse(text) : {});
      } catch {
        reject(new Error('Invalid JSON request body'));
      }
    });
  });
}

function createAgentRoutes({ store, orchestrator, sendJson }) {
  if (!store || !orchestrator || !sendJson) {
    throw new Error('Agent routes require store, orchestrator, and sendJson');
  }

  return {
    async listSessions(_req, res) {
      const sessions = await store.listSessions();
      sendJson(res, 200, {
        sessions: sessions.map((session) => ({
          id: session.id,
          title: session.title,
          status: session.status,
          created_at: session.created_at,
          updated_at: session.updated_at,
          city: session.city || null,
          category: session.category || null,
          subcategory: session.subcategory || null,
          district: session.district || null,
          last_result_count: session.last_result_count || 0,
        })),
      });
    },

    async deleteSession(req, res, sessionId) {
      req.logger?.info('agent session delete start', {
        sessionId,
      });
      const deleted = await store.deleteSession(sessionId);
      if (!deleted) {
        sendJson(res, 404, { error: 'Session not found' });
        return;
      }

      req.logger?.info('agent session deleted', {
        sessionId,
      });
      sendJson(res, 200, { deleted: true, sessionId });
    },

    async createSession(req, res) {
      req.logger?.info('agent session create start');
      const payload = await readJsonBody(req);
      const title = String(payload.title || '新建线索会话').trim() || '新建线索会话';
      const session = await store.createSession({ title });
      const bundle = await store.getSessionBundle(session.id);
      req.logger?.info('agent session created', {
        sessionId: session.id,
        title,
      });
      sendJson(res, 200, {
        sessionId: session.id,
        session: bundle.session,
        messages: bundle.messages,
        state: bundle.state,
        results: [],
      });
    },

    async getSession(_req, res, sessionId) {
      _req.logger?.info('agent session fetch start', {
        sessionId,
      });
      const bundle = await store.getSessionBundle(sessionId);
      if (!bundle.session) {
        sendJson(res, 404, { error: 'Session not found' });
        return;
      }

      sendJson(res, 200, {
        sessionId,
        session: bundle.session,
        messages: bundle.messages,
        state: bundle.state,
        results: bundle.latestRun?.result || [],
      });
    },

    async postMessage(req, res, sessionId) {
      const payload = await readJsonBody(req);
      if (!payload.message || !String(payload.message).trim()) {
        sendJson(res, 400, { error: 'Missing required field: message' });
        return;
      }

      req.logger?.info('agent message start', {
        sessionId,
        message: String(payload.message).trim(),
      });
      const response = await orchestrator.handleMessage({
        sessionId,
        message: String(payload.message).trim(),
      });
      req.logger?.info('agent message complete', {
        sessionId,
        messageCount: response.messages.length,
        resultCount: response.results.length,
        confirmationRequired: response.confirmationRequired,
      });
      sendJson(res, 200, response);
    },

    async confirm(req, res, sessionId) {
      await readJsonBody(req);
      req.logger?.info('agent confirmation start', {
        sessionId,
      });
      const response = await orchestrator.confirmPendingPlan({ sessionId });
      req.logger?.info('agent confirmation complete', {
        sessionId,
        resultCount: response.results.length,
      });
      sendJson(res, 200, response);
    },
  };
}

module.exports = {
  createAgentRoutes,
};
