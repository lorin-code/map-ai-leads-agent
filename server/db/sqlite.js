const { mkdir } = require('node:fs/promises');
const path = require('node:path');
const sqlite3 = require('sqlite3');

function normalizeParams(params) {
  if (params === undefined) {
    return [];
  }

  if (Array.isArray(params)) {
    return params;
  }

  if (params !== null && typeof params === 'object') {
    return params;
  }

  return [params];
}

function createDatabase(filename) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(filename, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(db);
    });
  });
}

function exec(db, sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function initDatabase(filename) {
  if (filename !== ':memory:') {
    await mkdir(path.dirname(path.resolve(filename)), { recursive: true });
  }

  const db = await createDatabase(filename);

  try {
    await exec(
      db,
      `
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          display_name TEXT,
          password_hash TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS auth_sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          token_hash TEXT NOT NULL UNIQUE,
          created_at TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          title TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'active',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          tool_name TEXT,
          tool_call_id TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS session_state (
          session_id TEXT PRIMARY KEY,
          city TEXT,
          category TEXT,
          subcategory TEXT,
          district TEXT,
          phone_only INTEGER NOT NULL DEFAULT 0,
          sort_by TEXT DEFAULT 'rating-desc',
          last_result_count INTEGER NOT NULL DEFAULT 0,
          last_run_id TEXT,
          pending_confirmation INTEGER NOT NULL DEFAULT 0,
          pending_plan_json TEXT,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS search_runs (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          query_json TEXT NOT NULL,
          result_json TEXT NOT NULL,
          result_count INTEGER NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
        );
      `
    );
    const sessionColumns = await all(db, 'PRAGMA table_info(sessions)');
    if (!sessionColumns.some((column) => column.name === 'user_id')) {
      await exec(db, 'ALTER TABLE sessions ADD COLUMN user_id TEXT');
    }

    await exec(
      db,
      `
        CREATE INDEX IF NOT EXISTS idx_messages_session_created_at
          ON messages(session_id, created_at);

        CREATE INDEX IF NOT EXISTS idx_search_runs_session_created_at
          ON search_runs(session_id, created_at);

        CREATE INDEX IF NOT EXISTS idx_sessions_updated_at
          ON sessions(updated_at);

        CREATE INDEX IF NOT EXISTS idx_sessions_user_updated_at
          ON sessions(user_id, updated_at);

        CREATE INDEX IF NOT EXISTS idx_auth_sessions_token_hash
          ON auth_sessions(token_hash);

        CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id
          ON auth_sessions(user_id);

        CREATE TRIGGER IF NOT EXISTS trg_sessions_updated_at
        AFTER UPDATE ON sessions
        FOR EACH ROW
        BEGIN
          UPDATE sessions
          SET updated_at = CURRENT_TIMESTAMP
          WHERE id = NEW.id;
        END;

        CREATE TRIGGER IF NOT EXISTS trg_session_state_updated_at
        AFTER UPDATE ON session_state
        FOR EACH ROW
        BEGIN
          UPDATE session_state
          SET updated_at = CURRENT_TIMESTAMP
          WHERE session_id = NEW.session_id;
        END;
      `
    );
  } catch (error) {
    await closeDatabase(db);
    throw error;
  }

  return db;
}

function closeDatabase(db) {
  return new Promise((resolve, reject) => {
    db.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function get(db, sql, params) {
  return new Promise((resolve, reject) => {
    db.get(sql, normalizeParams(params), (error, row) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(row);
    });
  });
}

function all(db, sql, params) {
  return new Promise((resolve, reject) => {
    db.all(sql, normalizeParams(params), (error, rows) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(rows);
    });
  });
}

function run(db, sql, params) {
  return new Promise((resolve, reject) => {
    db.run(sql, normalizeParams(params), function onRun(error) {
      if (error) {
        reject(error);
        return;
      }

      resolve({
        lastID: this.lastID,
        changes: this.changes,
      });
    });
  });
}

module.exports = {
  initDatabase,
  closeDatabase,
  get,
  all,
  run,
};
