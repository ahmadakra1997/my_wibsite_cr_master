// backend/src/legacy/legacyRouter.js
// راوتر يلفّ جميع REST APIs القديمة الموجودة في backend/routes/*
// ويعرضها تحت /api/legacy/... بدون لمس ملفاتها أو منطقها

const express = require('express');
const routesConfig = require('../config/routes');

let logger;
try {
  logger = require('../utils/logger');
} catch (e) {
  logger = console;
}

const router = express.Router();

// Helper لتحميل راوتر legacy بأمان
function attachLegacyRoute(pathSegment, loaderFn, label) {
  try {
    const legacyRouter = loaderFn();
    if (legacyRouter) {
      router.use(pathSegment, legacyRouter);
      logger.info?.(
        `[legacyRouter] Mounted legacy route "${label}" at ${routesConfig.routes.legacy}${pathSegment}`,
      );
    }
  } catch (error) {
    logger.warn?.(
      `[legacyRouter] Skipped legacy route "${label}" at ${pathSegment}: ${error.message}`,
    );
  }
}

// هنا نفترض أن legacy routes موجودة في backend/routes/*.js
// يمكنك تعديل الأسماء حسب ملفاتك الحالية

attachLegacyRoute(
  routesConfig.legacy.auth,
  () => require('../../routes/auth'),
  'auth',
);

attachLegacyRoute(
  routesConfig.legacy.users,
  () => require('../../routes/users'),
  'users',
);

attachLegacyRoute(
  routesConfig.legacy.products,
  () => require('../../routes/products'),
  'products',
);

attachLegacyRoute(
  routesConfig.legacy.orders,
  () => require('../../routes/orders'),
  'orders',
);

attachLegacyRoute(
  routesConfig.legacy.payments,
  () => require('../../routes/payment'),
  'payments',
);

attachLegacyRoute(
  routesConfig.legacy.clients,
  () => require('../../routes/clients'),
  'clients',
);

module.exports = router;
