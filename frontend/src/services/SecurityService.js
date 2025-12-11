// frontend/src/services/SecurityService.js

import { authAPI } from './api';

/**
 * SecurityService
 * طبقة أمان خفيفة فوق نظام المصادقة الحالي.
 * لا تستبدل AuthContext، بل تكمله وتقدّم نقطة مركزية لفحوصات الأمان العامة.
 */
class SecurityService {
  constructor() {
    this._initialized = false;
    this._listeners = [];
  }

  /**
   * تهيئة فحوصات الأمان العامة
   * يمكن هنا مستقبلاً إضافة:
   * - مراقبة تغيّر التوكن
   * - مراقبة محاولات الدخول المتكررة
   * - حماية إضافية ضد XSS / CSRF على مستوى الواجهة
   */
  initializeSecurityChecks() {
    if (this._initialized) return;
    this._initialized = true;

    console.log('[SecurityService] 🔐 Security checks initialized');

    // مثال: مراقبة تغيّر token في localStorage (يمكن توسيعه لاحقاً)
    if (typeof window !== 'undefined') {
      const handler = (event) => {
        if (event.key === 'token') {
          console.log('[SecurityService] Token changed in storage');
        }
      };
      window.addEventListener('storage', handler);
      this._listeners.push({ type: 'storage', handler });
    }
  }

  /**
   * التحقق من صلاحية الجلسة.
   * حالياً:
   * - إذا لم يوجد token → نرجع false
   * - إذا وُجد → نحاول استدعاء /auth/me بشكل اختياري للتأكد، مع عدم كسر التطبيق لو فشل.
   */
  async validateSession() {
    try {
      const token =
        (typeof window !== 'undefined' && (localStorage.getItem('token') || sessionStorage.getItem('token'))) ||
        null;

      if (!token) {
        console.warn('[SecurityService] No auth token found');
        return false;
      }

      // محاولة تحقق خفيفة من الـ backend (بدون رمي خطأ قاتل إذا فشل)
      try {
        await authAPI.getMe();
        console.log('[SecurityService] ✅ Session validated with backend');
      } catch (error) {
        console.warn('[SecurityService] Backend session validation failed:', error);
        // لا نكسر التطبيق هنا، نرجع true بناءً على وجود token فقط
      }

      return true;
    } catch (error) {
      console.error('[SecurityService] Error while validating session:', error);
      return false;
    }
  }

  /**
   * تنظيف أي listeners أو موارد تم إنشاؤها من هذه الخدمة
   */
  cleanup() {
    if (typeof window !== 'undefined') {
      this._listeners.forEach(({ type, handler }) => {
        window.removeEventListener(type, handler);
      });
    }
    this._listeners = [];
    this._initialized = false;

    console.log('[SecurityService] 🧹 Cleanup completed');
  }
}

export default SecurityService;
