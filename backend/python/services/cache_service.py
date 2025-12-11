# backend/python/services/cache_service.py
import redis
import json
import pickle
from functools import wraps
from datetime import datetime, timedelta
import logging
from typing import Any, Callable, Optional

class AdvancedCacheService:
    """
    خدمة تخزين مؤقت متقدمة مع دعم التداول الآلي
    الحفاظ الكامل على الوظائف الحالية مع تحسين الأداء
    """
    
    def __init__(self, host='localhost', port=6379, db=0):
        try:
            self.redis_client = redis.Redis(
                host=host, 
                port=port, 
                db=db,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )
            # اختبار الاتصال
            self.redis_client.ping()
            self.is_active = True
            logging.info("✅ Redis cache connected successfully")
        except Exception as e:
            self.is_active = False
            logging.warning(f"⚠️ Redis not available, using memory cache: {e}")
            self.memory_cache = {}
    
    def cache_strategy(
        self, 
        ttl: int = 300,
        key_prefix: str = "cache",
        fallback: bool = True
    ):
        """
        ديكورator للتخزين المؤقت مع الحفاظ على سلوك الوظائف الحالية
        """
        def decorator(func: Callable) -> Callable:
            @wraps(func)  # الحفاظ على metadata الدالة الأصلية
            def wrapper(*args, **kwargs):
                # إنشاء مفتاح فريد بناءً على المعطيات
                cache_key = f"{key_prefix}:{func.__name__}:{str(args)}:{str(kwargs)}"
                cache_key = cache_key.replace(" ", "")[:250]
                
                # محاولة جلب البيانات من التخزين المؤقت
                if self.is_active:
                    try:
                        cached_result = self.redis_client.get(cache_key)
                        if cached_result:
                            logging.debug(f"📦 Cache HIT for {func.__name__}")
                            return json.loads(cached_result)
                    except Exception as e:
                        logging.warning(f"Cache read error: {e}")
                
                # إذا لم توجد في التخزين، تشغيل الدالة الأصلية
                logging.debug(f"🔄 Cache MISS for {func.__name__}, executing function")
                result = func(*args, **kwargs)
                
                # تخزين النتيجة
                if self.is_active and result is not None:
                    try:
                        self.redis_client.setex(
                            cache_key, 
                            ttl, 
                            json.dumps(result, default=str)
                        )
                    except Exception as e:
                        logging.warning(f"Cache write error: {e}")
                elif not self.is_active and fallback:
                    self.memory_cache[cache_key] = {
                        'data': result,
                        'expiry': datetime.now() + timedelta(seconds=ttl)
                    }
                
                return result  # إرجاع النتيجة الأصلية دون تعديل
            return wrapper
        return decorator
    
    def batch_cache_operations(self, operations: list):
        """
        معالجة دُفعات للتخزين المؤقت - تحسين أداء العمليات المجمعة
        """
        if not self.is_active:
            return
            
        pipe = self.redis_client.pipeline()
        for op_type, key, value, ttl in operations:
            if op_type == 'set':
                pipe.setex(key, ttl, json.dumps(value, default=str))
            elif op_type == 'get':
                pipe.get(key)
            elif op_type == 'delete':
                pipe.delete(key)
        
        return pipe.execute()

# تطبيق الخدمة على الوظائف الحالية مع الحفاظ على السلوك
cache_service = AdvancedCacheService()

# استخدام الخدمة في وظائف التداول الحالية مع تحسين الأداء فقط
@cache_service.cache_strategy(ttl=60, key_prefix="exchange_data")
def get_cached_market_data(self, symbol: str, timeframe: str = '1h'):
    """
    الحفاظ على الوظيفة الأصلية مع إضافة التخزين المؤقت
    """
    # الكود الأصلي يبقى كما هو بدون تعديل
    return self.get_market_data_original(symbol, timeframe)
