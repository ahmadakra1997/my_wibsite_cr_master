// frontend/src/services/ErrorTrackingService.js

/**
 * ErrorTrackingService
 * خدمة مركزية لتتبع الأخطاء في الواجهة الأمامية.
 * حالياً:
 *  - تقوم بتسجيل الأخطاء في console مع سياق إضافي.
 *  - يمكن ربطها لاحقاً بخدمات مثل Sentry أو LogRocket بسهولة.
 */
class ErrorTrackingService {
  constructor() {
    this._initialized = false;
  }

  /**
   * تهيئة نظام تتبع الأخطاء.
   * يمكن هنا لاحقاً تهيئة SDK خاص بسيرفر مراقبة.
   */
  initialize() {
    if (this._initialized) return;
    this._initialized = true;

    console.log('[ErrorTrackingService] 🧩 Error tracking initialized');
  }

  /**
   * تسجيل استثناء / خطأ مع سياق إضافي اختياري.
   * @param {Error|any} error - الخطأ أو الاستثناء الذي تم التقاطه
   * @param {{ extra?: any }} [context] - كائن يحتوي على معلومات إضافية
   */
  captureException(error, context = {}) {
    const payload = {
      error,
      extra: context.extra || null,
      timestamp: new Date().toISOString(),
    };

    // تسجيل مفصل في الـ console للمطور
    console.error('[ErrorTrackingService] Captured exception:', payload);

    // 👇 هنا يمكنك لاحقاً إرسال payload لسيرفر خاص بالمراقبة:
    // fetch('/logging-endpoint', { method: 'POST', body: JSON.stringify(payload) })
    // أو ربط مع Sentry:
    // Sentry.captureException(error, { extra: context.extra });
  }
}

export default ErrorTrackingService;
