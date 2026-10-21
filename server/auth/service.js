const { randomBytes, randomUUID, scrypt, timingSafeEqual, createHash } = require('node:crypto');
const { promisify } = require('node:util');

const { get, run } = require('../db/sqlite');

const scryptAsync = promisify(scrypt);
const PASSWORD_KEY_LENGTH = 64;
const DEFAULT_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function normalizeUsername(username) {
  return String(username || '').trim().toLowerCase();
}

function publicUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    username: row.username,
    display_name: row.display_name || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(String(password), salt, PASSWORD_KEY_LENGTH);
  return `scrypt:${salt}:${derivedKey.toString('hex')}`;
}

async function verifyPassword(password, encodedHash) {
  const [algorithm, salt, expectedHex] = String(encodedHash || '').split(':');
  if (algorithm !== 'scrypt' || !salt || !expectedHex) {
    return false;
  }

  const actual = await scryptAsync(String(password), salt, PASSWORD_KEY_LENGTH);
  const expected = Buffer.from(expectedHex, 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function createAuthService(db, { sessionTtlMs = DEFAULT_SESSION_TTL_MS } = {}) {
  async function createAuthSession(userId) {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + sessionTtlMs).toISOString();
    await run(
      db,
      `
        INSERT INTO auth_sessions (id, user_id, token_hash, created_at, expires_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)
      `,
      [randomUUID(), userId, hashToken(token), expiresAt]
    );

    return token;
  }

  return {
    async registerPasswordUser({ username, password, displayName = null }) {
      const normalizedUsername = normalizeUsername(username);
      if (!normalizedUsername) {
        throw new Error('Username is required');
      }

      if (!String(password || '').trim()) {
        throw new Error('Password is required');
      }

      const id = randomUUID();
      await run(
        db,
        `
          INSERT INTO users (
            id,
            username,
            display_name,
            password_hash,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `,
        [id, normalizedUsername, displayName || null, await hashPassword(password)]
      );

      return publicUser(await get(db, 'SELECT * FROM users WHERE id = ?', [id]));
    },

    async loginWithPassword({ username, password }) {
      const normalizedUsername = normalizeUsername(username);
      const user = await get(db, 'SELECT * FROM users WHERE username = ?', [normalizedUsername]);

      if (!user || !(await verifyPassword(password, user.password_hash))) {
        throw new Error('Invalid username or password');
      }

      const token = await createAuthSession(user.id);
      return {
        token,
        user: publicUser(user),
      };
    },

    async loginOrRegisterWithPassword({ username, password }) {
      const normalizedUsername = normalizeUsername(username);
      let user = await get(db, 'SELECT * FROM users WHERE username = ?', [normalizedUsername]);
      if (!user) {
        await this.registerPasswordUser({
          username: normalizedUsername,
          password,
          displayName: normalizedUsername,
        });
        user = await get(db, 'SELECT * FROM users WHERE username = ?', [normalizedUsername]);
      }

      return this.loginWithPassword({ username: normalizedUsername, password });
    },

    async getUserByToken(token) {
      if (!token) {
        return null;
      }

      const row = await get(
        db,
        `
          SELECT u.*
          FROM auth_sessions a
          JOIN users u
            ON u.id = a.user_id
          WHERE a.token_hash = ?
            AND a.expires_at > ?
          LIMIT 1
        `,
        [hashToken(token), new Date().toISOString()]
      );

      return publicUser(row);
    },

    async logout(token) {
      if (!token) {
        return false;
      }

      const result = await run(db, 'DELETE FROM auth_sessions WHERE token_hash = ?', [hashToken(token)]);
      return result.changes > 0;
    },
  };
}

module.exports = {
  createAuthService,
};
