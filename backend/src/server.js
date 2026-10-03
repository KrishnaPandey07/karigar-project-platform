const app = require('./app');
const config = require('./config');
const prisma = require('./utils/prisma');

const PORT = config.PORT || 5000;

async function startServer() {
  try {
    const server = app.listen(PORT, () => {
      console.log(`🚀 LocalLink Backend running on http://localhost:${PORT}`);
      console.log(`📡 API Base: http://localhost:${PORT}/api/v1`);
      console.log(`🛡️  Environment: ${config.NODE_ENV}`);

      if (config.NODE_ENV !== 'test') {
        const { startExpireRequestsJob } = require('./jobs/expireRequests');
        startExpireRequestsJob();
      }
    });

    // Attempt database connection asynchronously
    if (config.DATABASE_URL) {
      prisma.$connect()
        .then(() => {
          console.log('✅ Connected to PostgreSQL via Prisma');
        })
        .catch((dbErr) => {
          console.warn('⚠️  Could not connect to PostgreSQL database:', dbErr.message);
          console.warn('ℹ️   Backend API server is operational; ensure PostgreSQL is running at DATABASE_URL for full DB persistence.');
        });
    } else {
      console.warn('⚠️  DATABASE_URL not set. Running without direct DB connection.');
    }

    // Graceful Shutdown
    const shutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        try {
          await prisma.$disconnect();
          console.log('🔌 Database disconnected. Process terminated.');
          process.exit(0);
        } catch (err) {
          console.error('Error during shutdown:', err);
          process.exit(1);
        }
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
