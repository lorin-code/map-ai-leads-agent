const { randomUUID } = require('node:crypto');

const { all, get, run } = require('./sqlite');

const STATE_COLUMNS = [
  'city',
  'category',
  'subcategory',
  'district',
  'phone_only',
  'sort_by',
  'last_result_count',
  'last_run_id',
  'pending_confirmation',
  'pending_plan_json',
];

function touchSession(db, sessionId) {
  return run(db, 'UPDATE sessions SET status = status WHERE id = ?', [sessionId]);
}

function defaultState(sessionId) {
  return {
    session_id: sessionId,
    city: null,
    category: null,
    subcategory: null,
    district: null,
    phone_only: 0,
    sort_by: 'rating-desc',
    last_result_count: 0,
    last_run_id: null,
    pending_confirmation: 0,
    pending_plan_json: null,
    updated_at: null,
  };
}

function parseJson(value, fallback) {
  if (value === null || value === undefined) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function parseState(row, sessionId) {
  const state = row ? { ...defaultState(sessionId), ...row } : defaultState(sessionId);

  if (state.pending_plan_json) {
    state.pending_plan_json = parseJson(state.pending_plan_json, null);
  }

  return state;
}

function parseRun(row) {
  if (!row) {
    return null;
  }

  return {
    ...row,
    query: parseJson(row.query_json, {}),
    result: parseJson(row.result_json, []),
  };
}

function createSessionStore(db) {
  return {
    async listSessions({ userId } = {}) {
      const userFilter = userId ? 'WHERE s.user_id = ?' : '';
      return all(
        db,
        `
          SELECT
            s.*,
            ss.city,
            ss.category,
            ss.subcategory,
            ss.district,
            ss.last_result_count,
            COUNT(m.id) AS message_count
          FROM sessions s
          LEFT JOIN session_state ss
            ON ss.session_id = s.id
          LEFT JOIN messages m
            ON m.session_id = s.id
          ${userFilter}
          GROUP BY s.id
          HAVING COUNT(m.id) > 0
          ORDER BY s.updated_at DESC, s.rowid DESC
        `,
        userId ? [userId] : []
      );
    },

    async deleteSession(sessionId, { userId } = {}) {
      const result = await run(
        db,
        userId ? 'DELETE FROM sessions WHERE id = ? AND user_id = ?' : 'DELETE FROM sessions WHERE id = ?',
        userId ? [sessionId, userId] : [sessionId]
      );
      return result.changes > 0;
    },

    async createSession({ title, userId = null }) {
      const id = randomUUID();
      await run(
        db,
        `
          INSERT INTO sessions (id, user_id, title, created_at, updated_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `,
        [id, userId, title]
      );

      return get(db, 'SELECT * FROM sessions WHERE id = ?', [id]);
    },

    async appendMessage(sessionId, message) {
      const id = randomUUID();
      await run(
        db,
        `
          INSERT INTO messages (
            id,
            session_id,
            role,
            content,
            tool_name,
            tool_call_id,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `,
        [
          id,
          sessionId,
          message.role,
          message.content,
          message.tool_name || null,
          message.tool_call_id || null,
        ]
      );
      await touchSession(db, sessionId);
      return get(db, 'SELECT * FROM messages WHERE id = ?', [id]);
    },

    async saveState(sessionId, partialState) {
      await run(
        db,
        `
          INSERT OR IGNORE INTO session_state (session_id, updated_at)
          VALUES (?, CURRENT_TIMESTAMP)
        `,
        [sessionId]
      );

      const entries = Object.entries(partialState).filter(([key]) => STATE_COLUMNS.includes(key));
      if (entries.length > 0) {
        const assignments = entries.map(([key]) => `${key} = ?`).join(', ');
        const params = entries.map(([key, value]) => {
          if (key === 'pending_plan_json' && value !== null && value !== undefined) {
            return JSON.stringify(value);
          }

          return value;
        });
        await run(
          db,
          `UPDATE session_state SET ${assignments} WHERE session_id = ?`,
          [...params, sessionId]
        );
      }

      await touchSession(db, sessionId);
      const row = await get(db, 'SELECT * FROM session_state WHERE session_id = ?', [sessionId]);
      return parseState(row, sessionId);
    },

    async saveSearchRun(sessionId, runRecord) {
      const id = runRecord.id || randomUUID();
      const resultCount =
        runRecord.result_count !== undefined
          ? runRecord.result_count
          : Array.isArray(runRecord.result)
            ? runRecord.result.length
            : 0;

      await run(
        db,
        `
          INSERT INTO search_runs (
            id,
            session_id,
            query_json,
            result_json,
            result_count,
            created_at
          ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(id) DO UPDATE SET
            query_json = excluded.query_json,
            result_json = excluded.result_json,
            result_count = excluded.result_count
        `,
        [
          id,
          sessionId,
          JSON.stringify(runRecord.query || {}),
          JSON.stringify(runRecord.result || []),
          resultCount,
        ]
      );

      await this.saveState(sessionId, {
        last_run_id: id,
        last_result_count: resultCount,
      });

      return parseRun(await get(db, 'SELECT * FROM search_runs WHERE id = ?', [id]));
    },

    async getSessionBundle(sessionId, { userId } = {}) {
      const session = await get(
        db,
        userId ? 'SELECT * FROM sessions WHERE id = ? AND user_id = ?' : 'SELECT * FROM sessions WHERE id = ?',
        userId ? [sessionId, userId] : [sessionId]
      );
      if (!session) {
        return {
          session: null,
          messages: [],
          state: defaultState(sessionId),
          latestRun: null,
          searchRuns: [],
        };
      }

      const messages = await all(
        db,
        'SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC, rowid ASC',
        [sessionId]
      );
      const stateRow = await get(db, 'SELECT * FROM session_state WHERE session_id = ?', [sessionId]);
      const state = parseState(stateRow, sessionId);

      let latestRunRow = null;
      if (state.last_run_id) {
        latestRunRow = await get(
          db,
          'SELECT * FROM search_runs WHERE session_id = ? AND id = ?',
          [sessionId, state.last_run_id]
        );
      }

      if (!latestRunRow) {
        latestRunRow = await get(
          db,
          `
            SELECT *
            FROM search_runs
            WHERE session_id = ?
            ORDER BY created_at DESC, rowid DESC
            LIMIT 1
          `,
          [sessionId]
        );
      }

      const runRows = await all(
        db,
        `
          SELECT *
          FROM search_runs
          WHERE session_id = ?
          ORDER BY created_at ASC, rowid ASC
        `,
        [sessionId]
      );

      return {
        session,
        messages,
        state,
        latestRun: parseRun(latestRunRow),
        searchRuns: runRows.map(parseRun),
      };
    },
  };
}

module.exports = {
  createSessionStore,
};
