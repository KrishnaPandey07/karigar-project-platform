const path = require('path');
const fs = require('fs');
async function startDb() {
  const { default: EmbeddedPostgres } = await import('embedded-postgres');
  const dbDir = path.resolve(__dirname, '../.data/postgres');
  const isInitialized = fs.existsSync(path.join(dbDir, 'PG_VERSION'));

  console.log(`[Database] Initializing Embedded PostgreSQL at: ${dbDir}`);

  const pg = new EmbeddedPostgres({
    databaseDir: dbDir,
    user: 'postgres',
    password: 'postgres',
    port: 5432,
    persistent: true,
  });

  if (!isInitialized) {
    console.log('[Database] Running first-time cluster initdb...');
    await pg.initialise();
  }

  console.log('[Database] Starting PostgreSQL server on port 5432...');
  await pg.start();
  console.log('✅ [Database] PostgreSQL is listening on port 5432!');

  try {
    console.log('[Database] Ensuring "locallink" database exists...');
    await pg.createDatabase('locallink');
    console.log('✅ [Database] "locallink" database ready.');
  } catch (err) {
    if (err.message && err.message.includes('already exists')) {
      console.log('ℹ️ [Database] "locallink" database already exists.');
    } else {
      console.warn('⚠️ [Database] Notice when creating DB:', err.message);
    }
  }

  return pg;
}

if (require.main === module) {
  startDb()
    .then(() => {
      console.log('🚀 Embedded PostgreSQL running. Keep this process alive.');
    })
    .catch((err) => {
      console.error('❌ Failed to start embedded PostgreSQL:', err);
      process.exit(1);
    });
}

module.exports = { startDb };
