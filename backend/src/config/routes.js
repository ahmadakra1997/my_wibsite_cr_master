// backend/src/config/routes.js
// إعداد مركزي لمسارات الـ API الحديثة والـ legacy

module.exports = {
  // البادئة العامة لجميع REST APIs
  apiPrefix: process.env.API_PREFIX || '/api',

  // مسارات الروترات "الجديدة" تحت src/routes
  routes: {
    bot: '/bot',
    engine: '/engine',
    legacy: '/legacy',
  },

  // مسارات الـ legacy الفرعية (تُستخدم داخل legacyRouter)
  legacy: {
    auth: '/auth',
    users: '/users',
    products: '/products',
    orders: '/orders',
    payments: '/payments',
    clients: '/clients',
  },
};
