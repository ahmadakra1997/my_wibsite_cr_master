// frontend/src/services/PerformanceMonitor.js

/**
 * PerformanceMonitor
 * خدمة لمراقبة أداء التطبيق ونظام البوت بشكل خفيف وغير متدخل.
 * حالياً تكتفي بتسجيل معلومات أساسية، ويمكن توسيعها لاحقاً لقياس FPS أو latency إلخ.
 */
class PerformanceMonitor {
  constructor() {
    this.isMonitoring = false;
    this.isBotMonitoring = false;
    this._metricsInterval = null;
  }

  /**
   * بدء مراقبة أداء التطبيق ككل
   */
  startMonitoring() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    console.log('[PerformanceMonitor] 🚀 Application monitoring started');

    // مثال بسيط لتسجيل بعض المعلومات الدورية عن الأداء
    if (typeof window !== 'undefined' && typeof window.setInterval === 'function') {
      this._metricsInterval = window.setInterval(() => {
        try {
          const memory =
            window.performance &&
            window.performance.memory &&
            window.performance.memory.usedJSHeapSize
              ? window.performance.memory.usedJSHeapSize
              : null;

          const timing = window.performance && window.performance.timing;

          console.debug('[PerformanceMonitor] Metrics snapshot:', {
            timestamp: new Date().toISOString(),
            memoryUsed: memory,
            domComplete: timing ? timing.domComplete : null,
          });
        } catch (error) {
          console.warn('[PerformanceMonitor] Failed to collect metrics:', error);
        }
      }, 15000); // كل 15 ثانية
    }
  }

  /**
   * إيقاف مراقبة أداء التطبيق
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;
    this.isMonitoring = false;

    if (this._metricsInterval) {
      clearInterval(this._metricsInterval);
      this._metricsInterval = null;
    }

    console.log('[PerformanceMonitor] 🛑 Application monitoring stopped');
  }

  /**
   * بدء مراقبة نظام البوت (مستقلة عن مراقبة التطبيق)
   */
  startBotMonitoring() {
    if (this.isBotMonitoring) return;
    this.isBotMonitoring = true;

    console.log('[PerformanceMonitor] 🤖 Bot monitoring started');
    // يمكنك لاحقاً إضافة منطق مخصص لمراقبة أداء البوت هنا
  }

  /**
   * إيقاف مراقبة نظام البوت
   */
  stopBotMonitoring() {
    if (!this.isBotMonitoring) return;
    this.isBotMonitoring = false;

    console.log('[PerformanceMonitor] 🤖 Bot monitoring stopped');
  }
}

export default PerformanceMonitor;
