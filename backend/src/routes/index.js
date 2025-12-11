// backend/src/routes/index.js
// نقطة تجميع واحدة لكل الراوترات (الجديدة + legacy)
// تُستدعى من app.js أو server.js لتسجيل المسارات على express app

const routesConfig = require('../config/routes');
const botRoutes = require('./bot');
const engineRoutes = require('./engine');
const legacyRouter = require('../legacy/legacyRouter');

let logger;
try {
  logger = require('../utils/logger');
} catch (e) {
  logger = console;
}

/**
 * registerRoutes(app)
 *
 * تُستدعى مرة واحدة من app.js أو server.js لتوصيل كل المسارات.
 */
function registerRoutes(app) {
  const apiBase = routesConfig.apiPrefix || '/api';

  // 🧠 مسارات البوت (مربوطة مع PythonEngine عبر botOrchestrator)
  app.use(`${apiBase}${routesConfig.routes.bot}`, botRoutes);
  logger.info?.(
    `[routes] Mounted bot routes at ${apiBase}${routesConfig.routes.bot}`,
  );

  // ⚙️ مسارات الـ Engine (health / backtest / signal-test)
  app.use(`${apiBase}${routesConfig.routes.engine}`, engineRoutes);
  logger.info?.(
    `[routes] Mounted engine routes at ${apiBase}${routesConfig.routes.engine}`,
  );

  // 🕰 مسارات legacy (auth, users, products... إلخ)
  app.use(`${apiBase}${routesConfig.routes.legacy}`, legacyRouter);
  logger.info?.(
    `[routes] Mounted legacy routes at ${apiBase}${routesConfig.routes.legacy}`,
  );
}

module.exports = registerRoutes;
