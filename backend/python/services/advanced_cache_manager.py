# backend/python/services/advanced_cache_manager.py
import os
import json
import pickle
import asyncio
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union
import logging
from pathlib import Path

class AdvancedCacheManager:
    """
    مدير تخزين مؤقت احترافي مع اكتشاف تلقائي للهيكل الحالي
    ودعم كامل للوظائف الموجودة
    """
    
    def __init__(self, project_root: str = "/workspaces/my_wibsite_cr"):
        self.project_root = Path(project_root)
        self.cache_dir = self.project_root / "cache"
        self.cache_dir.mkdir(exist_ok=True)
        
        # اكتشاف تلقائي للخدمات الحالية
        self.existing_services = self.discover_existing_services()
        self.cache_strategies = self.define_cache_strategies()
        
        logging.info(f"🎯 تم اكتشاف {len(self.existing_services)} خدمة حالية")
    
    def discover_existing_services(self) -> Dict[str, Path]:
        """اكتشاف تلقائي للخدمات الحالية في المشروع"""
        services = {}
        services_path = self.project_root / "backend" / "python" / "services"
        
        if services_path.exists():
            for py_file in services_path.glob("*.py"):
                if py_file.name != "__init__.py":
                    service_name = py_file.stem
                    services[service_name] = py_file
        
        return services
    
    def define_cache_strategies(self) -> Dict[str, Dict]:
        """تحديد استراتيجيات التخزين المؤقت بناءً على الخدمات المكتشفة"""
        strategies = {
            "default": {"ttl": 300, "strategy": "aggressive"},
            "exchange": {"ttl": 60, "strategy": "moderate"}, 
            "risk": {"ttl": 600, "strategy": "conservative"},
            "market": {"ttl": 30, "strategy": "aggressive"},
            "performance": {"ttl": 120, "strategy": "moderate"}
        }
        
        # تطابق ذكي مع الخدمات المكتشفة
        custom_strategies = {}
        for service_name in self.existing_services.keys():
            service_lower = service_name.lower()
            
            if "exchange" in service_lower:
                custom_strategies[service_name] = strategies["exchange"]
            elif "risk" in service_lower:
                custom_strategies[service_name] = strategies["risk"]
            elif "market" in service_lower:
                custom_strategies[service_name] = strategies["market"]
            elif "performance" in service_lower:
                custom_strategies[service_name] = strategies["performance"]
            else:
                custom_strategies[service_name] = strategies["default"]
        
        return custom_strategies
    
    def get_cache_key(self, service_name: str, method_name: str, *args, **kwargs) -> str:
        """إنشاء مفتاح تخزين مؤقت فريد وذكي"""
        # تجنب المفاتيح الطويلة جداً
        args_str = str(args)[:100] if args else ""
        kwargs_str = str(kwargs)[:100] if kwargs else ""
        
        key = f"{service_name}:{method_name}:{hash(args_str + kwargs_str)}"
        return key
    
    def safe_cache_operation(self, operation: callable, fallback_value: Any = None) -> Any:
        """تنفيذ آمن لعمليات التخزين المؤقت مع التعامل مع الأخطاء"""
        try:
            return operation()
        except Exception as e:
            logging.warning(f"⚠️ Cache operation failed, using fallback: {e}")
            return fallback_value
    
    def cache_method(self, service_name: str = None, ttl: int = None):
        """
        ديكوراتور احترافي للتخزين المؤقت مع التكيف التلقائي
        """
        def decorator(func):
            # استخدام اسم الخدمة المكتشفة أو اسم الدالة
            actual_service_name = service_name or func.__module__
            strategy = self.cache_strategies.get(actual_service_name, self.cache_strategies["default"])
            actual_ttl = ttl or strategy["ttl"]
            
            @wraps(func)
            def wrapper(*args, **kwargs):
                # إنشاء المفتاح
                cache_key = self.get_cache_key(actual_service_name, func.__name__, *args, **kwargs)
                cache_file = self.cache_dir / f"{cache_key}.pkl"
                
                # التحقق من التخزين المؤقت أولاً
                if cache_file.exists():
                    cache_age = datetime.now().timestamp() - cache_file.stat().st_mtime
                    if cache_age < actual_ttl:
                        try:
                            with open(cache_file, 'rb') as f:
                                cached_result = pickle.load(f)
                            logging.debug(f"📦 Cache HIT: {actual_service_name}.{func.__name__}")
                            return cached_result
                        except Exception as e:
                            logging.warning(f"⚠️ Cache read error: {e}")
                
                # تنفيذ الدالة الأصلية
                logging.debug(f"🔄 Cache MISS: {actual_service_name}.{func.__name__}")
                result = func(*args, **kwargs)
                
                # تخزين النتيجة
                try:
                    with open(cache_file, 'wb') as f:
                        pickle.dump(result, f)
                except Exception as e:
                    logging.warning(f"⚠️ Cache write error: {e}")
                
                return result
            
            return wrapper
        return decorator
    
    async def async_cache_method(self, service_name: str = None, ttl: int = None):
        """نسخة غير متزامنة من الديكوراتور"""
        def decorator(func):
            actual_service_name = service_name or func.__module__
            strategy = self.cache_strategies.get(actual_service_name, self.cache_strategies["default"])
            actual_ttl = ttl or strategy["ttl"]
            
            @wraps(func)
            async def wrapper(*args, **kwargs):
                cache_key = self.get_cache_key(actual_service_name, func.__name__, *args, **kwargs)
                cache_file = self.cache_dir / f"{cache_key}.pkl"
                
                # التحقق من التخزين المؤقت
                if cache_file.exists():
                    cache_age = datetime.now().timestamp() - cache_file.stat().st_mtime
                    if cache_age < actual_ttl:
                        try:
                            with open(cache_file, 'rb') as f:
                                cached_result = pickle.load(f)
                            logging.debug(f"📦 Async Cache HIT: {actual_service_name}.{func.__name__}")
                            return cached_result
                        except Exception as e:
                            logging.warning(f"⚠️ Async cache read error: {e}")
                
                # تنفيذ الدالة الأصلية
                logging.debug(f"🔄 Async Cache MISS: {actual_service_name}.{func.__name__}")
                result = await func(*args, **kwargs)
                
                # تخزين النتيجة
                try:
                    with open(cache_file, 'wb') as f:
                        pickle.dump(result, f)
                except Exception as e:
                    logging.warning(f"⚠️ Async cache write error: {e}")
                
                return result
            
            return wrapper
        return decorator

# إنشاء instance عالمي
cache_manager = AdvancedCacheManager()

# ديكوراتور مبسط للاستخدام
def cached(ttl: int = None, service_name: str = None):
    return cache_manager.cache_method(service_name=service_name, ttl=ttl)

def async_cached(ttl: int = None, service_name: str = None):
    return cache_manager.async_cache_method(service_name=service_name, ttl=ttl)
