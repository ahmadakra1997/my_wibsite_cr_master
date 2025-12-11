# backend/python/services/performance_enhancer.py
import functools
import logging
from datetime import datetime

def safe_performance_enhancement(original_class):
    """
    ديكورator آمن لتحسين الأداء بدون تغيير السلوك
    """
    class EnhancedClass(original_class):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)
            self.performance_cache = {}
            self.last_performance_log = datetime.now()
        
        def __getattribute__(self, name):
            attr = super().__getattribute__(name)
            
            # تطبيق التحسينات فقط على طرق الخدمة
            if callable(attr) and not name.startswith('_'):
                return enhanced_method(attr)
            return attr
    
    def enhanced_method(method):
        @functools.wraps(method)
        def wrapper(self, *args, **kwargs):
            # الحفاظ على السلوك الأصلي مع إضافة المراقبة فقط
            start_time = datetime.now()
            result = method(self, *args, **kwargs)
            execution_time = (datetime.now() - start_time).total_seconds()
            
            # تسجيل الأداء فقط (بدون تغيير النتائج)
            if execution_time > 1.0:  # إذا تجاوزت الثانية
                logging.info(f"🐢 Slow method {method.__name__}: {execution_time:.2f}s")
            
            return result  # إرجاع النتيجة الأصلية دون تعديل
        return wrapper
    
    return EnhancedClass

# تطبيق آمن على الخدمات الحالية
from backend.python.services.exchange_service import ExchangeService
from backend.python.services.risk_service import RiskService

# تحسين الأداء بدون تغيير الوظائف
EnhancedExchangeService = safe_performance_enhancement(ExchangeService)
EnhancedRiskService = safe_performance_enhancement(RiskService)
