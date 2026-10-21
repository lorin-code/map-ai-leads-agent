const assert = require('node:assert/strict');
const { mkdtemp, rm } = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const sqlite3 = require('sqlite3');
const test = require('node:test');

function toColumnMap(columns) {
  return new Map(columns.map((column) => [column.name, column]));
}

test('initDatabase creates required tables, indexes, and schema shape', async () => {
  const { initDatabase, closeDatabase, all, get, run } = require('../server/db/sqlite');
  const db = await initDatabase(':memory:');

  try {
    const foreignKeys = await get(db, 'PRAGMA foreign_keys');
    assert.equal(foreignKeys.foreign_keys, 1);

    const tables = await all(
      db,
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('users', 'auth_sessions', 'sessions', 'messages', 'session_state', 'search_runs') ORDER BY name"
    );

    assert.deepEqual(
      tables.map((row) => row.name),
      ['auth_sessions', 'messages', 'search_runs', 'session_state', 'sessions', 'users']
    );

    const indexes = await all(
      db,
      "SELECT name FROM sqlite_master WHERE type = 'index' AND name IN ('idx_messages_session_created_at', 'idx_search_runs_session_created_at', 'idx_sessions_updated_at') ORDER BY name"
    );

    assert.deepEqual(
      indexes.map((row) => row.name),
      [
        'idx_messages_session_created_at',
        'idx_search_runs_session_created_at',
        'idx_sessions_updated_at',
      ]
    );

    const triggers = await all(
      db,
      "SELECT name FROM sqlite_master WHERE type = 'trigger' AND name IN ('trg_sessions_updated_at', 'trg_session_state_updated_at') ORDER BY name"
    );

    assert.deepEqual(
      triggers.map((row) => row.name),
      ['trg_session_state_updated_at', 'trg_sessions_updated_at']
    );

    const sessionColumns = toColumnMap(await all(db, 'PRAGMA table_info(sessions)'));
    assert.deepEqual([...sessionColumns.keys()], [
      'id',
      'user_id',
      'title',
      'status',
      'created_at',
      'updated_at',
    ]);
    assert.equal(sessionColumns.get('id').type, 'TEXT');
    assert.equal(sessionColumns.get('id').pk, 1);
    assert.equal(sessionColumns.get('user_id').type, 'TEXT');
    assert.equal(sessionColumns.get('title').type, 'TEXT');
    assert.equal(sessionColumns.get('title').notnull, 1);
    assert.equal(sessionColumns.get('status').dflt_value, "'active'");
    assert.equal(sessionColumns.get('status').notnull, 1);
    assert.equal(sessionColumns.get('created_at').notnull, 1);
    assert.equal(sessionColumns.get('updated_at').notnull, 1);

    const messageColumns = toColumnMap(await all(db, 'PRAGMA table_info(messages)'));
    assert.deepEqual([...messageColumns.keys()], [
      'id',
      'session_id',
      'role',
      'content',
      'tool_name',
      'tool_call_id',
      'created_at',
    ]);
    assert.equal(messageColumns.get('id').type, 'TEXT');
    assert.equal(messageColumns.get('id').pk, 1);
    assert.equal(messageColumns.get('session_id').type, 'TEXT');
    assert.equal(messageColumns.get('session_id').notnull, 1);
    assert.equal(messageColumns.get('role').notnull, 1);
    assert.equal(messageColumns.get('content').notnull, 1);
    assert.equal(messageColumns.get('created_at').notnull, 1);

    const stateColumns = toColumnMap(await all(db, 'PRAGMA table_info(session_state)'));
    assert.deepEqual([...stateColumns.keys()], [
      'session_id',
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
      'updated_at',
    ]);
    assert.equal(stateColumns.get('session_id').type, 'TEXT');
    assert.equal(stateColumns.get('session_id').pk, 1);
    assert.equal(stateColumns.get('phone_only').notnull, 1);
    assert.equal(stateColumns.get('phone_only').dflt_value, '0');
    assert.equal(stateColumns.get('sort_by').dflt_value, "'rating-desc'");
    assert.equal(stateColumns.get('last_result_count').notnull, 1);
    assert.equal(stateColumns.get('last_result_count').dflt_value, '0');
    assert.equal(stateColumns.get('pending_confirmation').notnull, 1);
    assert.equal(stateColumns.get('pending_confirmation').dflt_value, '0');
    assert.equal(stateColumns.get('updated_at').notnull, 1);

    const runColumns = toColumnMap(await all(db, 'PRAGMA table_info(search_runs)'));
    assert.deepEqual([...runColumns.keys()], [
      'id',
      'session_id',
      'query_json',
      'result_json',
      'result_count',
      'created_at',
    ]);
    assert.equal(runColumns.get('id').type, 'TEXT');
    assert.equal(runColumns.get('id').pk, 1);
    assert.equal(runColumns.get('session_id').type, 'TEXT');
    assert.equal(runColumns.get('session_id').notnull, 1);
    assert.equal(runColumns.get('query_json').notnull, 1);
    assert.equal(runColumns.get('result_json').notnull, 1);
    assert.equal(runColumns.get('result_count').notnull, 1);
    assert.equal(runColumns.get('created_at').notnull, 1);

    await run(
      db,
      `
        INSERT INTO sessions (id, title, created_at, updated_at)
        VALUES ($id, $title, $createdAt, $updatedAt)
      `,
      {
        $id: 'session-1',
        $title: 'Initial title',
        $createdAt: '2000-01-01 00:00:00',
        $updatedAt: '2000-01-01 00:00:00',
      }
    );

    await run(
      db,
      `
        INSERT INTO session_state (
          session_id,
          city,
          updated_at
        ) VALUES ($sessionId, $city, $updatedAt)
      `,
      {
        $sessionId: 'session-1',
        $city: 'Shanghai',
        $updatedAt: '2000-01-01 00:00:00',
      }
    );

    await assert.rejects(
      () =>
        run(
          db,
          `
            INSERT INTO messages (id, session_id, role, content, created_at)
            VALUES (?, ?, ?, ?, ?)
          `,
          ['message-1', 'missing-session', 'user', 'hello', '2000-01-01 00:00:00']
        ),
      /SQLITE_CONSTRAINT/
    );

    await run(db, 'UPDATE sessions SET title = ? WHERE id = ?', ['Updated title', 'session-1']);
    await run(db, 'UPDATE session_state SET city = ? WHERE session_id = ?', ['Beijing', 'session-1']);

    const sessionRow = await get(
      db,
      'SELECT title, updated_at FROM sessions WHERE id = ?',
      ['session-1']
    );
    assert.equal(sessionRow.title, 'Updated title');
    assert.notEqual(sessionRow.updated_at, '2000-01-01 00:00:00');

    const stateRow = await get(
      db,
      'SELECT city, updated_at FROM session_state WHERE session_id = ?',
      ['session-1']
    );
    assert.equal(stateRow.city, 'Beijing');
    assert.notEqual(stateRow.updated_at, '2000-01-01 00:00:00');
  } finally {
    await closeDatabase(db);
  }
});

test('initDatabase creates missing parent directories for file-backed databases', async () => {
  const { initDatabase, closeDatabase } = require('../server/db/sqlite');
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'g-map-sqlite-'));
  const dbPath = path.join(tempDir, 'nested', 'app.db');

  let db;
  try {
    db = await initDatabase(dbPath);
    assert.ok(db);
  } finally {
    if (db) {
      await closeDatabase(db);
    }
    await rm(tempDir, { recursive: true, force: true });
  }
});

test('initDatabase migrates existing session databases with user ownership columns', async () => {
  const { initDatabase, closeDatabase, all } = require('../server/db/sqlite');
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'g-map-sqlite-migration-'));
  const dbPath = path.join(tempDir, 'legacy.db');

  try {
    const legacyDb = new sqlite3.Database(dbPath);
    await new Promise((resolve, reject) => {
      legacyDb.exec(
      `
        PRAGMA foreign_keys = ON;
        CREATE TABLE sessions (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'active',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE INDEX idx_sessions_updated_at ON sessions(updated_at);
        INSERT INTO sessions (id, title, status, created_at, updated_at)
        VALUES ('legacy-session', 'Legacy', 'active', '2026-01-01 00:00:00', '2026-01-01 00:00:00');
      `,
        (error) => {
          legacyDb.close();
          error ? reject(error) : resolve();
        }
      );
    });

    const migratedDb = await initDatabase(dbPath);
    const sessionColumns = toColumnMap(await all(migratedDb, 'PRAGMA table_info(sessions)'));
    assert.equal(sessionColumns.has('user_id'), true);
    const indexes = await all(
      migratedDb,
      "SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_sessions_user_updated_at'"
    );
    assert.equal(indexes.length, 1);
    await closeDatabase(migratedDb);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test('sessionStore creates and loads a session with merged state', async () => {
  const { initDatabase, closeDatabase } = require('../server/db/sqlite');
  const { createSessionStore } = require('../server/db/sessionStore');
  const db = await initDatabase(':memory:');
  const store = createSessionStore(db);

  try {
    const session = await store.createSession({ title: 'Shanghai auto dealers' });

    await store.saveState(session.id, {
      city: 'Shanghai',
      category: 'automotive',
      subcategory: '4S',
      district: null,
      phone_only: 0,
      sort_by: 'rating-desc',
    });

    await store.saveState(session.id, {
      district: 'Pudong',
      phone_only: 1,
    });

    const loaded = await store.getSessionBundle(session.id);

    assert.equal(loaded.session.id, session.id);
    assert.equal(loaded.session.title, 'Shanghai auto dealers');
    assert.deepEqual(loaded.messages, []);
    assert.equal(loaded.state.city, 'Shanghai');
    assert.equal(loaded.state.category, 'automotive');
    assert.equal(loaded.state.subcategory, '4S');
    assert.equal(loaded.state.district, 'Pudong');
    assert.equal(loaded.state.phone_only, 1);
    assert.equal(loaded.state.sort_by, 'rating-desc');
    assert.equal(loaded.state.last_result_count, 0);
    assert.equal(loaded.state.last_run_id, null);
    assert.equal(loaded.state.pending_confirmation, 0);
    assert.equal(loaded.state.pending_plan_json, null);
    assert.equal(loaded.latestRun, null);
  } finally {
    await closeDatabase(db);
  }
});

test('sessionStore scopes session lists and bundles by user id', async () => {
  const { initDatabase, closeDatabase } = require('../server/db/sqlite');
  const { createAuthService } = require('../server/auth/service');
  const { createSessionStore } = require('../server/db/sessionStore');
  const db = await initDatabase(':memory:');
  const auth = createAuthService(db);
  const store = createSessionStore(db);

  try {
    const alice = await auth.registerPasswordUser({
      username: 'alice@example.com',
      password: 'alice-password',
    });
    const bob = await auth.registerPasswordUser({
      username: 'bob@example.com',
      password: 'bob-password',
    });
    const aliceSession = await store.createSession({
      title: 'Alice search',
      userId: alice.id,
    });
    const bobSession = await store.createSession({
      title: 'Bob search',
      userId: bob.id,
    });

    await store.appendMessage(aliceSession.id, {
      role: 'user',
      content: 'Alice message',
    });
    await store.appendMessage(bobSession.id, {
      role: 'user',
      content: 'Bob message',
    });

    const aliceSessions = await store.listSessions({ userId: alice.id });
    assert.deepEqual(
      aliceSessions.map((session) => session.id),
      [aliceSession.id]
    );

    const aliceBundle = await store.getSessionBundle(aliceSession.id, { userId: alice.id });
    assert.equal(aliceBundle.session.id, aliceSession.id);

    const crossUserBundle = await store.getSessionBundle(bobSession.id, { userId: alice.id });
    assert.equal(crossUserBundle.session, null);
    assert.deepEqual(crossUserBundle.messages, []);
    assert.equal(crossUserBundle.latestRun, null);

    const crossUserDeleted = await store.deleteSession(bobSession.id, { userId: alice.id });
    assert.equal(crossUserDeleted, false);

    const bobBundle = await store.getSessionBundle(bobSession.id, { userId: bob.id });
    assert.equal(bobBundle.session.id, bobSession.id);
  } finally {
    await closeDatabase(db);
  }
});

test('sessionStore appends messages and returns the latest search run', async () => {
  const { initDatabase, closeDatabase } = require('../server/db/sqlite');
  const { createSessionStore } = require('../server/db/sessionStore');
  const db = await initDatabase(':memory:');
  const store = createSessionStore(db);

  try {
    const session = await store.createSession({ title: 'Shanghai restaurants' });

    await store.appendMessage(session.id, {
      role: 'user',
      content: 'Find restaurants in Shanghai',
    });
    await store.appendMessage(session.id, {
      role: 'assistant',
      content: 'Searching now',
      tool_name: 'search_leads',
      tool_call_id: 'tool-call-1',
    });

    await store.saveSearchRun(session.id, {
      id: 'run-1',
      query: { city: 'Shanghai', category: 'food' },
      result: [{ id: 'lead-1', name: 'Cafe 1' }],
      result_count: 1,
    });
    await store.saveSearchRun(session.id, {
      id: 'run-2',
      query: { city: 'Shanghai', category: 'food', district: 'Pudong' },
      result: [{ id: 'lead-2', name: 'Cafe 2' }, { id: 'lead-3', name: 'Cafe 3' }],
      result_count: 2,
    });

    const loaded = await store.getSessionBundle(session.id);

    assert.equal(loaded.messages.length, 2);
    assert.equal(loaded.messages[0].role, 'user');
    assert.equal(loaded.messages[0].content, 'Find restaurants in Shanghai');
    assert.equal(loaded.messages[1].role, 'assistant');
    assert.equal(loaded.messages[1].tool_name, 'search_leads');
    assert.equal(loaded.messages[1].tool_call_id, 'tool-call-1');

    assert.equal(loaded.state.last_run_id, 'run-2');
    assert.equal(loaded.state.last_result_count, 2);

    assert.equal(loaded.latestRun.id, 'run-2');
    assert.deepEqual(loaded.latestRun.query, {
      city: 'Shanghai',
      category: 'food',
      district: 'Pudong',
    });
    assert.deepEqual(loaded.latestRun.result, [
      { id: 'lead-2', name: 'Cafe 2' },
      { id: 'lead-3', name: 'Cafe 3' },
    ]);
    assert.equal(loaded.latestRun.result_count, 2);
  } finally {
    await closeDatabase(db);
  }
});

test('sessionStore updates an existing search run when the same id is saved again', async () => {
  const { initDatabase, closeDatabase } = require('../server/db/sqlite');
  const { createSessionStore } = require('../server/db/sessionStore');
  const db = await initDatabase(':memory:');
  const store = createSessionStore(db);

  try {
    const session = await store.createSession({ title: 'Incremental run' });

    await store.saveSearchRun(session.id, {
      id: 'run-1',
      query: { city: 'Shanghai', category: 'food' },
      result: [{ id: 'lead-1', name: 'Cafe 1' }],
      result_count: 1,
    });
    await store.saveSearchRun(session.id, {
      id: 'run-1',
      query: { city: 'Shanghai', category: 'food', progress: 2 },
      result: [{ id: 'lead-1', name: 'Cafe 1' }, { id: 'lead-2', name: 'Cafe 2' }],
      result_count: 2,
    });

    const loaded = await store.getSessionBundle(session.id);

    assert.equal(loaded.state.last_run_id, 'run-1');
    assert.equal(loaded.state.last_result_count, 2);
    assert.deepEqual(loaded.latestRun.query, {
      city: 'Shanghai',
      category: 'food',
      progress: 2,
    });
    assert.deepEqual(loaded.latestRun.result, [
      { id: 'lead-1', name: 'Cafe 1' },
      { id: 'lead-2', name: 'Cafe 2' },
    ]);
  } finally {
    await closeDatabase(db);
  }
});

test('sessionStore returns messages in insertion order when timestamps match', async () => {
  const { initDatabase, closeDatabase, run } = require('../server/db/sqlite');
  const { createSessionStore } = require('../server/db/sessionStore');
  const db = await initDatabase(':memory:');
  const store = createSessionStore(db);

  try {
    const session = await store.createSession({ title: 'Ordering check' });

    await run(
      db,
      `
        INSERT INTO messages (id, session_id, role, content, created_at)
        VALUES (?, ?, ?, ?, ?)
      `,
      ['z-message', session.id, 'user', 'first message', '2026-04-30 12:00:00']
    );
    await run(
      db,
      `
        INSERT INTO messages (id, session_id, role, content, created_at)
        VALUES (?, ?, ?, ?, ?)
      `,
      ['a-message', session.id, 'assistant', 'second message', '2026-04-30 12:00:00']
    );

    const loaded = await store.getSessionBundle(session.id);

    assert.deepEqual(
      loaded.messages.map((message) => message.id),
      ['z-message', 'a-message']
    );
    assert.deepEqual(
      loaded.messages.map((message) => message.content),
      ['first message', 'second message']
    );
  } finally {
    await closeDatabase(db);
  }
});

test('sessionStore returns the latest run deterministically when timestamps match', async () => {
  const { initDatabase, closeDatabase, run } = require('../server/db/sqlite');
  const { createSessionStore } = require('../server/db/sessionStore');
  const db = await initDatabase(':memory:');
  const store = createSessionStore(db);

  try {
    const session = await store.createSession({ title: 'Latest run ordering check' });

    await run(
      db,
      `
        INSERT INTO search_runs (id, session_id, query_json, result_json, result_count, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      ['z-run', session.id, '{"step":1}', '[{"id":"lead-1"}]', 1, '2026-04-30 12:00:00']
    );
    await run(
      db,
      `
        INSERT INTO search_runs (id, session_id, query_json, result_json, result_count, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      ['a-run', session.id, '{"step":2}', '[{"id":"lead-2"}]', 1, '2026-04-30 12:00:00']
    );

    const fallbackLoaded = await store.getSessionBundle(session.id);
    assert.equal(fallbackLoaded.latestRun.id, 'a-run');
    assert.deepEqual(fallbackLoaded.latestRun.query, { step: 2 });

    await run(
      db,
      `
        INSERT INTO session_state (session_id, last_run_id, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `,
      [session.id, 'z-run']
    );

    const statePreferredLoaded = await store.getSessionBundle(session.id);
    assert.equal(statePreferredLoaded.state.last_run_id, 'z-run');
    assert.equal(statePreferredLoaded.latestRun.id, 'z-run');
    assert.deepEqual(statePreferredLoaded.latestRun.query, { step: 1 });
  } finally {
    await closeDatabase(db);
  }
});

test('sessionStore tolerates malformed persisted JSON', async () => {
  const { initDatabase, closeDatabase, run } = require('../server/db/sqlite');
  const { createSessionStore } = require('../server/db/sessionStore');
  const db = await initDatabase(':memory:');
  const store = createSessionStore(db);

  try {
    const session = await store.createSession({ title: 'Malformed JSON check' });

    await run(
      db,
      `
        INSERT INTO session_state (
          session_id,
          pending_plan_json,
          last_run_id,
          updated_at
        ) VALUES (?, ?, ?, ?)
      `,
      [session.id, '{bad-json', 'run-1', '2026-04-30 12:00:00']
    );

    await run(
      db,
      `
        INSERT INTO search_runs (id, session_id, query_json, result_json, result_count, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      ['run-1', session.id, '{bad-json', 'not-json', 3, '2026-04-30 12:00:00']
    );

    const loaded = await store.getSessionBundle(session.id);

    assert.equal(loaded.session.id, session.id);
    assert.equal(loaded.state.pending_plan_json, null);
    assert.equal(loaded.state.last_run_id, 'run-1');
    assert.equal(loaded.latestRun.id, 'run-1');
    assert.deepEqual(loaded.latestRun.query, {});
    assert.deepEqual(loaded.latestRun.result, []);
    assert.equal(loaded.latestRun.result_count, 3);
  } finally {
    await closeDatabase(db);
  }
});
