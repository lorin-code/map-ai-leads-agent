const assert = require('node:assert/strict');
const test = require('node:test');

test('authService registers a password user and logs in with an opaque token', async () => {
  const { initDatabase, closeDatabase } = require('../server/db/sqlite');
  const { createAuthService } = require('../server/auth/service');
  const db = await initDatabase(':memory:');
  const auth = createAuthService(db);

  try {
    const created = await auth.registerPasswordUser({
      username: 'alice@example.com',
      password: 'correct horse battery staple',
      displayName: 'Alice',
    });

    assert.equal(created.username, 'alice@example.com');
    assert.equal(created.display_name, 'Alice');
    assert.ok(created.id);
    assert.equal(created.password_hash, undefined);

    const login = await auth.loginWithPassword({
      username: 'alice@example.com',
      password: 'correct horse battery staple',
    });

    assert.equal(login.user.id, created.id);
    assert.equal(login.user.username, 'alice@example.com');
    assert.match(login.token, /^[a-f0-9]{64}$/);

    const sessionUser = await auth.getUserByToken(login.token);
    assert.equal(sessionUser.id, created.id);
    assert.equal(sessionUser.username, 'alice@example.com');
  } finally {
    await closeDatabase(db);
  }
});

test('authService rejects invalid account password logins', async () => {
  const { initDatabase, closeDatabase } = require('../server/db/sqlite');
  const { createAuthService } = require('../server/auth/service');
  const db = await initDatabase(':memory:');
  const auth = createAuthService(db);

  try {
    await auth.registerPasswordUser({
      username: 'bob@example.com',
      password: 's3cret-password',
    });

    await assert.rejects(
      () =>
        auth.loginWithPassword({
          username: 'bob@example.com',
          password: 'wrong-password',
        }),
      /Invalid username or password/
    );
  } finally {
    await closeDatabase(db);
  }
});
