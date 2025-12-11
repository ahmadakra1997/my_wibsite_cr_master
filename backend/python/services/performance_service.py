"""
خدمة الأداء والذاكرة المتقدمة - الإصدار 4.0
نظام شامل لتحسين الأداء وإدارة الذاكرة مع تحليلات متقدمة
"""

import os
import logging
import asyncio
import time
import psutil
import gc
from typing import Dict, List, Optional, Any, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
import threading
from concurrent.futures import ThreadPoolExecutor
from functools import wraps
import cachetools
import tracemalloc
import weakref

# إعداد المسجل المتقدم
logger = logging.getLogger(__name__)

class PerformanceLevel(Enum):
    """مستويات الأداء"""
    OPTIMAL = "optimal"
    GOOD = "good"
    WARNING = "warning"
    CRITICAL = "critical"

class MemoryProfile(Enum):
    """أنواع ملفات الذاكرة"""
    LOW_MEMORY = "low_memory"
    BALANCED = "balanced"
    HIGH_PERFORMANCE = "high_performance"

@dataclass
class PerformanceMetrics:
    """مقاييس الأداء الشاملة"""
    timestamp: datetime
    cpu_usage: float
    memory_usage: float
    memory_available: float
    disk_io: Dict[str, float]
    network_io: Dict[str, float]
    active_threads: int
    active_processes: int
    gc_stats: Dict[str, Any]
    performance_level: PerformanceLevel

@dataclass
class MemorySnapshot:
    """لقطة الذاكرة"""
    snapshot_id: str
    timestamp: datetime
    memory_info: Dict[str, Any]
    object_counts: Dict[str, int]
    memory_leaks: List[Dict[str, Any]]

class AdvancedCacheManager:
    """مدير الذاكرة المؤقتة المتقدم"""
    
    def __init__(self):
        self.caches = {}
        self.hit_rates = {}
        self.setup_caches()
    
    def setup_caches(self):
        """إعداد الذواكر المؤقتة المتخصصة"""
        try:
            # ذاكرة مؤقتة للبيانات الساخنة (5 دقائق)
            self.caches['hot_data'] = cachetools.TTLCache(
                maxsize=int(os.getenv('HOT_CACHE_SIZE', '1000')),
                ttl=int(os.getenv('HOT_CACHE_TTL', '300'))
            )
            
            # ذاكرة مؤقتة للبيانات الباردة (30 دقيقة)
            self.caches['cold_data'] = cachetools.TTLCache(
                maxsize=int(os.getenv('COLD_CACHE_SIZE', '500')),
                ttl=int(os.getenv('COLD_CACHE_TTL', '1800'))
            )
            
            # ذاكرة مؤقتة للاستعلامات (10 دقائق)
            self.caches['query_cache'] = cachetools.LRUCache(
                maxsize=int(os.getenv('QUERY_CACHE_SIZE', '2000'))
            )
            
            # ذاكرة مؤقتة للجلسات (1 ساعة)
            self.caches['session_cache'] = cachetools.TTLCache(
                maxsize=int(os.getenv('SESSION_CACHE_SIZE', '100')),
                ttl=int(os.getenv('SESSION_CACHE_TTL', '3600'))
            )
            
            # تهيئة معدلات الضرب
            for cache_name in self.caches:
                self.hit_rates[cache_name] = {'hits': 0, 'misses': 0}
                
            logger.info("✅ تم إعداد مدير الذاكرة المؤقتة المتقدم")
            
        except Exception as e:
            logger.error(f"❌ خطأ في إعداد الذواكر المؤقتة: {e}")
            raise
    
    def get(self, cache_name: str, key: str) -> Any:
        """الحصول على بيانات من الذاكرة المؤقتة"""
        try:
            if cache_name not in self.caches:
                self.hit_rates[cache_name]['misses'] += 1
                return None
            
            value = self.caches[cache_name].get(key)
            if value is not None:
                self.hit_rates[cache_name]['hits'] += 1
            else:
                self.hit_rates[cache_name]['misses'] += 1
                
            return value
        except Exception as e:
            logger.error(f"❌ خطأ في الحصول من الذاكرة المؤقتة {cache_name}: {e}")
            return None
    
    def set(self, cache_name: str, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """تخزين بيانات في الذاكرة المؤقتة"""
        try:
            if cache_name not in self.caches:
                return False
            
            if ttl and hasattr(self.caches[cache_name], 'ttl'):
                # إنشاء ذاكرة مؤقتة مؤقتة إذا تم توفير TTL مخصص
                temp_cache = cachetools.TTLCache(
                    maxsize=self.caches[cache_name].maxsize,
                    ttl=ttl
                )
                temp_cache[key] = value
                self.caches[cache_name][key] = value
            else:
                self.caches[cache_name][key] = value
                
            return True
        except Exception as e:
            logger.error(f"❌ خطأ في التخزين في الذاكرة المؤقتة {cache_name}: {e}")
            return False
    
    def get_hit_rate(self, cache_name: str) -> float:
        """الحصول على معدل الضرب للذاكرة المؤقتة"""
        if cache_name not in self.hit_rates:
            return 0.0
        
        stats = self.hit_rates[cache_name]
        total = stats['hits'] + stats['misses']
        return stats['hits'] / total if total > 0 else 0.0
    
    def clear_cache(self, cache_name: str) -> bool:
        """مسح ذاكرة تخزين مؤقت محددة"""
        try:
            if cache_name in self.caches:
                self.caches[cache_name].clear()
                self.hit_rates[cache_name] = {'hits': 0, 'misses': 0}
                return True
            return False
        except Exception as e:
            logger.error(f"❌ خطأ في مسح الذاكرة المؤقتة {cache_name}: {e}")
            return False
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """الحصول على إحصائيات جميع الذواكر المؤقتة"""
        stats = {}
        for cache_name, cache in self.caches.items():
            stats[cache_name] = {
                'size': len(cache),
                'max_size': cache.maxsize,
                'hit_rate': self.get_hit_rate(cache_name),
                'currsize': cache.currsize
            }
        return stats

class MemoryOptimizer:
    """محسن الذاكرة المتقدم"""
    
    def __init__(self):
        self.memory_threshold = float(os.getenv('MEMORY_THRESHOLD', '80.0'))
        self.cleanup_interval = int(os.getenv('MEMORY_CLEANUP_INTERVAL', '60'))
        self.performance_mode = os.getenv('PERFORMANCE_MODE', 'balanced')
        self.setup_memory_profiling()
    
    def setup_memory_profiling(self):
        """إعداد تحليل الذاكرة"""
        try:
            tracemalloc.start()
            self.snapshots = []
            self.leak_detector = MemoryLeakDetector()
            logger.info("✅ تم إعداد محسن الذاكرة المتقدم")
        except Exception as e:
            logger.error(f"❌ خطأ في إعداد تحليل الذاكرة: {e}")
    
    def optimize_memory_usage(self) -> Dict[str, Any]:
        """تحسين استخدام الذاكرة"""
        try:
            optimization_report = {
                'timestamp': datetime.now(),
                'actions_taken': [],
                'memory_freed': 0,
                'optimization_level': 'none'
            }
            
            # جمع القمامة القسرية
            freed_objects = gc.collect()
            if freed_objects > 0:
                optimization_report['actions_taken'].append('forced_garbage_collection')
                optimization_report['memory_freed'] += freed_objects
            
            # تحليل استخدام الذاكرة الحالي
            memory_info = self.analyze_memory_usage()
            
            # تطبيق استراتيجيات التحسين بناءً على نمط الأداء
            if self.performance_mode == 'low_memory':
                optimization_report.update(self._apply_low_memory_optimizations(memory_info))
            elif self.performance_mode == 'high_performance':
                optimization_report.update(self._apply_high_performance_optimizations(memory_info))
            else:  # balanced
                optimization_report.update(self._apply_balanced_optimizations(memory_info))
            
            # تحديث مستوى التحسين
            optimization_report['optimization_level'] = self._calculate_optimization_level(
                optimization_report['memory_freed']
            )
            
            logger.info(f"🎯 تم تحسين الذاكرة: {optimization_report}")
            return optimization_report
            
        except Exception as e:
            logger.error(f"❌ خطأ في تحسين الذاكرة: {e}")
            return {'error': str(e)}
    
    def analyze_memory_usage(self) -> Dict[str, Any]:
        """تحليل استخدام الذاكرة الحالي"""
        try:
            process = psutil.Process()
            memory_info = process.memory_info()
            memory_percent = process.memory_percent()
            
            # تحليل كائنات الذاكرة
            object_analysis = self._analyze_objects()
            
            # اكتشاف تسريبات الذاكرة
            memory_leaks = self.leak_detector.detect_leaks()
            
            return {
                'rss': memory_info.rss,  # Resident Set Size
                'vms': memory_info.vms,  # Virtual Memory Size
                'percent': memory_percent,
                'available_memory': psutil.virtual_memory().available,
                'object_counts': object_analysis,
                'memory_leaks': memory_leaks,
                'timestamp': datetime.now()
            }
        except Exception as e:
            logger.error(f"❌ خطأ في تحليل الذاكرة: {e}")
            return {}
    
    def _analyze_objects(self) -> Dict[str, int]:
        """تحليل الكائنات في الذاكرة"""
        try:
            objects = gc.get_objects()
            object_counts = {}
            
            for obj in objects:
                obj_type = type(obj).__name__
                object_counts[obj_type] = object_counts.get(obj_type, 0) + 1
            
            return dict(sorted(object_counts.items(), key=lambda x: x[1], reverse=True)[:10])
        except Exception as e:
            logger.error(f"❌ خطأ في تحليل الكائنات: {e}")
            return {}
    
    def _apply_low_memory_optimizations(self, memory_info: Dict) -> Dict:
        """تطبيق تحسينات وضع الذاكرة المنخفضة"""
        optimizations = {'actions_taken': [], 'memory_freed': 0}
        
        # تنظيف ذاكرة التخزين المؤقت
        cache_manager = AdvancedCacheManager()
        for cache_name in cache_manager.caches:
            old_size = len(cache_manager.caches[cache_name])
            cache_manager.clear_cache(cache_name)
            optimizations['memory_freed'] += old_size
            optimizations['actions_taken'].append(f'cleared_cache_{cache_name}')
        
        # تنظيف ذاكرة النظام
        if hasattr(gc, 'free'):
            gc.free()
            optimizations['actions_taken'].append('system_memory_free')
        
        return optimizations
    
    def _apply_high_performance_optimizations(self, memory_info: Dict) -> Dict:
        """تطبيق تحسينات وضع الأداء العالي"""
        optimizations = {'actions_taken': [], 'memory_freed': 0}
        
        # تحسين ذاكرة التخزين المؤقت للوصول السريع
        cache_manager = AdvancedCacheManager()
        for cache_name in ['hot_data', 'query_cache']:
            cache_manager.caches[cache_name].maxsize = min(
                cache_manager.caches[cache_name].maxsize * 2,
                10000  # حد أقصى
            )
            optimizations['actions_taken'].append(f'optimized_cache_{cache_name}')
        
        return optimizations
    
    def _apply_balanced_optimizations(self, memory_info: Dict) -> Dict:
        """تطبيق تحسينات الوضع المتوازن"""
        optimizations = {'actions_taken': [], 'memory_freed': 0}
        
        # تنظيف انتقائي للذاكرة المؤقتة
        cache_manager = AdvancedCacheManager()
        cache_stats = cache_manager.get_cache_stats()
        
        for cache_name, stats in cache_stats.items():
            if stats['hit_rate'] < 0.3:  # معدل ضرب منخفض
                cache_manager.clear_cache(cache_name)
                optimizations['actions_taken'].append(f'cleaned_low_hit_cache_{cache_name}')
        
        return optimizations
    
    def _calculate_optimization_level(self, memory_freed: int) -> str:
        """حساب مستوى التحسين"""
        if memory_freed > 1000000:  # 1MB
            return 'high'
        elif memory_freed > 100000:  # 100KB
            return 'medium'
        else:
            return 'low'
    
    def create_memory_snapshot(self) -> MemorySnapshot:
        """إنشاء لقطة للذاكرة"""
        try:
            snapshot_id = f"snapshot_{int(time.time())}"
            memory_info = self.analyze_memory_usage()
            object_counts = self._analyze_objects()
            memory_leaks = self.leak_detector.detect_leaks()
            
            snapshot = MemorySnapshot(
                snapshot_id=snapshot_id,
                timestamp=datetime.now(),
                memory_info=memory_info,
                object_counts=object_counts,
                memory_leaks=memory_leaks
            )
            
            self.snapshots.append(snapshot)
            # الاحتفاظ بآخر 10 لقطات فقط
            self.snapshots = self.snapshots[-10:]
            
            return snapshot
        except Exception as e:
            logger.error(f"❌ خطأ في إنشاء لقطة الذاكرة: {e}")
            return None
    
    def compare_snapshots(self, snapshot1: MemorySnapshot, snapshot2: MemorySnapshot) -> Dict[str, Any]:
        """مقارنة لقطتين للذاكرة"""
        try:
            memory_diff = snapshot2.memory_info['rss'] - snapshot1.memory_info['rss']
            object_diffs = {}
            
            # مقارنة عدد الكائنات
            for obj_type, count2 in snapshot2.object_counts.items():
                count1 = snapshot1.object_counts.get(obj_type, 0)
                object_diffs[obj_type] = count2 - count1
            
            return {
                'memory_difference_bytes': memory_diff,
                'object_differences': object_diffs,
                'new_memory_leaks': len(snapshot2.memory_leaks) - len(snapshot1.memory_leaks),
                'time_elapsed_seconds': (snapshot2.timestamp - snapshot1.timestamp).total_seconds()
            }
        except Exception as e:
            logger.error(f"❌ خطأ في مقارنة اللقطات: {e}")
            return {}

class MemoryLeakDetector:
    """كاشف تسريبات الذاكرة"""
    
    def __init__(self):
        self.object_references = weakref.WeakSet()
        self.reference_snapshots = []
    
    def track_object(self, obj: Any) -> None:
        """تتبع كائن لاكتشاف التسريبات"""
        self.object_references.add(obj)
    
    def detect_leaks(self) -> List[Dict[str, Any]]:
        """اكتشاف تسريبات الذاكرة"""
        try:
            leaks = []
            current_objects = set(gc.get_objects())
            
            # تحليل الكائنات التي يجب تنظيفها
            for obj in current_objects:
                if self._is_potential_leak(obj):
                    leaks.append({
                        'object_type': type(obj).__name__,
                        'object_size': self._estimate_object_size(obj),
                        'reference_count': sys.getrefcount(obj) - 1,  # طرح المرجع المؤقت
                        'creation_time': getattr(obj, '_creation_time', None)
                    })
            
            return leaks[:50]  # إرجاع أول 50 تسريب محتمل فقط
        except Exception as e:
            logger.error(f"❌ خطأ في اكتشاف التسريبات: {e}")
            return []
    
    def _is_potential_leak(self, obj: Any) -> bool:
        """التحقق إذا كان الكائن تسريب محتمل"""
        try:
            # استبعاد الأنواع المضمنة
            if type(obj).__module__ == 'builtins':
                return False
            
            # التحقق من عدد المراجع
            ref_count = sys.getrefcount(obj) - 1
            if ref_count > 100:  # عدد مراجع كبير
                return True
            
            # التحقق من حجم الكائن
            obj_size = self._estimate_object_size(obj)
            if obj_size > 1000000:  # كائن كبير (>1MB)
                return True
            
            return False
        except:
            return False
    
    def _estimate_object_size(self, obj: Any) -> int:
        """تقدير حجم الكائن"""
        try:
            return sys.getsizeof(obj)
        except:
            return 0

class PerformanceMonitor:
    """مراقب الأداء المتقدم"""
    
    def __init__(self):
        self.metrics_history = []
        self.alert_thresholds = self._load_alert_thresholds()
        self.monitoring_interval = int(os.getenv('PERF_MONITOR_INTERVAL', '30'))
        self.is_monitoring = False
        self.monitor_thread = None
        
    def _load_alert_thresholds(self) -> Dict[str, float]:
        """تحميل عتبات التنبيه"""
        return {
            'cpu_usage': float(os.getenv('CPU_ALERT_THRESHOLD', '80.0')),
            'memory_usage': float(os.getenv('MEMORY_ALERT_THRESHOLD', '85.0')),
            'memory_available': float(os.getenv('MEMORY_AVAILABLE_THRESHOLD', '1073741824')),  # 1GB
            'disk_io_wait': float(os.getenv('DISK_IO_THRESHOLD', '50.0')),
            'response_time': float(os.getenv('RESPONSE_TIME_THRESHOLD', '5.0'))
        }
    
    def start_monitoring(self) -> None:
        """بدء مراقبة الأداء"""
        if self.is_monitoring:
            return
        
        self.is_monitoring = True
        self.monitor_thread = threading.Thread(target=self._monitoring_loop, daemon=True)
        self.monitor_thread.start()
        logger.info("🎯 بدء مراقبة الأداء المتقدمة")
    
    def stop_monitoring(self) -> None:
        """إيقاف مراقبة الأداء"""
        self.is_monitoring = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=5.0)
        logger.info("🛑 إيقاف مراقبة الأداء")
    
    def _monitoring_loop(self) -> None:
        """حلقة المراقبة الرئيسية"""
        while self.is_monitoring:
            try:
                metrics = self.capture_performance_metrics()
                self.metrics_history.append(metrics)
                
                # الاحتفاظ بسجل آخر 1000 قياس
                self.metrics_history = self.metrics_history[-1000:]
                
                # التحقق من التنبيهات
                alerts = self.check_alerts(metrics)
                if alerts:
                    self.handle_alerts(alerts, metrics)
                
                time.sleep(self.monitoring_interval)
                
            except Exception as e:
                logger.error(f"❌ خطأ في حلقة المراقبة: {e}")
                time.sleep(self.monitoring_interval)
    
    def capture_performance_metrics(self) -> PerformanceMetrics:
        """تقاط مقاييس الأداء"""
        try:
            # استخدام وحدة المعالجة المركزية
            cpu_usage = psutil.cpu_percent(interval=1)
            
            # استخدام الذاكرة
            memory = psutil.virtual_memory()
            memory_usage = memory.percent
            memory_available = memory.available
            
            # إدخال/إخراج القرص
            disk_io = psutil.disk_io_counters()
            disk_io_data = {
                'read_bytes': disk_io.read_bytes if disk_io else 0,
                'write_bytes': disk_io.write_bytes if disk_io else 0,
                'read_time': disk_io.read_time if disk_io else 0,
                'write_time': disk_io.write_time if disk_io else 0
            }
            
            # إدخال/إخراج الشبكة
            network_io = psutil.net_io_counters()
            network_io_data = {
                'bytes_sent': network_io.bytes_sent if network_io else 0,
                'bytes_recv': network_io.bytes_recv if network_io else 0,
                'packets_sent': network_io.packets_sent if network_io else 0,
                'packets_recv': network_io.packets_recv if network_io else 0
            }
            
            # إحصاءات الخيوط والعمليات
            active_threads = threading.active_count()
            active_processes = len(psutil.pids())
            
            # إحصاءات جامع القمامة
            gc_stats = {
                'collections': gc.get_count(),
                'thresholds': gc.get_threshold(),
                'enabled': gc.isenabled()
            }
            
            # تحديد مستوى الأداء
            performance_level = self._determine_performance_level(
                cpu_usage, memory_usage, memory_available
            )
            
            return PerformanceMetrics(
                timestamp=datetime.now(),
                cpu_usage=cpu_usage,
                memory_usage=memory_usage,
                memory_available=memory_available,
                disk_io=disk_io_data,
                network_io=network_io_data,
                active_threads=active_threads,
                active_processes=active_processes,
                gc_stats=gc_stats,
                performance_level=performance_level
            )
            
        except Exception as e:
            logger.error(f"❌ خطأ في تقاط مقاييس الأداء: {e}")
            return PerformanceMetrics(
                timestamp=datetime.now(),
                cpu_usage=0,
                memory_usage=0,
                memory_available=0,
                disk_io={},
                network_io={},
                active_threads=0,
                active_processes=0,
                gc_stats={},
                performance_level=PerformanceLevel.CRITICAL
            )
    
    def _determine_performance_level(self, cpu_usage: float, memory_usage: float, memory_available: float) -> PerformanceLevel:
        """تحديد مستوى الأداء"""
        if cpu_usage > 90 or memory_usage > 90 or memory_available < 536870912:  # 512MB
            return PerformanceLevel.CRITICAL
        elif cpu_usage > 75 or memory_usage > 80 or memory_available < 1073741824:  # 1GB
            return PerformanceLevel.WARNING
        elif cpu_usage > 50 or memory_usage > 65:
            return PerformanceLevel.GOOD
        else:
            return PerformanceLevel.OPTIMAL
    
    def check_alerts(self, metrics: PerformanceMetrics) -> List[Dict[str, Any]]:
        """التحقق من التنبيهات"""
        alerts = []
        
        # تنبيهات استخدام وحدة المعالجة المركزية
        if metrics.cpu_usage > self.alert_thresholds['cpu_usage']:
            alerts.append({
                'type': 'high_cpu_usage',
                'level': 'warning',
                'value': metrics.cpu_usage,
                'threshold': self.alert_thresholds['cpu_usage'],
                'message': f'استخدام عالي لوحدة المعالجة المركزية: {metrics.cpu_usage}%'
            })
        
        # تنبيهات استخدام الذاكرة
        if metrics.memory_usage > self.alert_thresholds['memory_usage']:
            alerts.append({
                'type': 'high_memory_usage',
                'level': 'warning',
                'value': metrics.memory_usage,
                'threshold': self.alert_thresholds['memory_usage'],
                'message': f'استخدام عالي للذاكرة: {metrics.memory_usage}%'
            })
        
        # تنبيهات الذاكرة المتاحة
        if metrics.memory_available < self.alert_thresholds['memory_available']:
            alerts.append({
                'type': 'low_available_memory',
                'level': 'critical',
                'value': metrics.memory_available,
                'threshold': self.alert_thresholds['memory_available'],
                'message': f'ذاكرة متاحة منخفضة: {metrics.memory_available / 1024/1024/1024:.2f}GB'
            })
        
        return alerts
    
    def handle_alerts(self, alerts: List[Dict], metrics: PerformanceMetrics) -> None:
        """معالجة التنبيهات"""
        for alert in alerts:
            logger.warning(f"⚠️  تنبيه أداء: {alert['message']}")
            
            # اتخاذ إجراءات تلقائية للتنبيهات الحرجة
            if alert['level'] == 'critical':
                self._handle_critical_alert(alert, metrics)
    
    def _handle_critical_alert(self, alert: Dict, metrics: PerformanceMetrics) -> None:
        """معالجة التنبيهات الحرجة"""
        try:
            if alert['type'] == 'low_available_memory':
                # تحسين الذاكرة تلقائياً
                optimizer = MemoryOptimizer()
                optimizer.optimize_memory_usage()
                logger.info("🔄 تم تشغيل تحسين الذاكرة التلقائي بسبب تنبيه حرج")
                
        except Exception as e:
            logger.error(f"❌ خطأ في معالجة التنبيه الحرج: {e}")
    
    def get_performance_report(self, hours: int = 24) -> Dict[str, Any]:
        """الحصول على تقرير الأداء"""
        try:
            cutoff_time = datetime.now() - timedelta(hours=hours)
            recent_metrics = [m for m in self.metrics_history if m.timestamp > cutoff_time]
            
            if not recent_metrics:
                return {'error': 'لا توجد بيانات كافية'}
            
            # حساب المتوسطات
            avg_cpu = sum(m.cpu_usage for m in recent_metrics) / len(recent_metrics)
            avg_memory = sum(m.memory_usage for m in recent_metrics) / len(recent_metrics)
            
            # توزيع مستويات الأداء
            performance_distribution = {}
            for level in PerformanceLevel:
                performance_distribution[level.value] = len(
                    [m for m in recent_metrics if m.performance_level == level]
                )
            
            return {
                'report_period_hours': hours,
                'metrics_analyzed': len(recent_metrics),
                'average_cpu_usage': round(avg_cpu, 2),
                'average_memory_usage': round(avg_memory, 2),
                'performance_distribution': performance_distribution,
                'current_performance_level': self.metrics_history[-1].performance_level.value if self.metrics_history else 'unknown',
                'alerts_last_24h': len([m for m in recent_metrics if any(self.check_alerts(m))]),
                'recommendations': self._generate_recommendations(recent_metrics)
            }
            
        except Exception as e:
            logger.error(f"❌ خطأ في إنشاء تقرير الأداء: {e}")
            return {'error': str(e)}
    
    def _generate_recommendations(self, metrics: List[PerformanceMetrics]) -> List[str]:
        """توليد توصيات الأداء"""
        recommendations = []
        
        # تحليل استخدام وحدة المعالجة المركزية
        high_cpu_periods = len([m for m in metrics if m.cpu_usage > 80])
        if high_cpu_periods > len(metrics) * 0.3:  # 30% من الوقت
            recommendations.append("تفكر في تحسين كفاءة الخوارزميات أو زيادة موارد وحدة المعالجة المركزية")
        
        # تحليل استخدام الذاكرة
        high_memory_periods = len([m for m in metrics if m.memory_usage > 85])
        if high_memory_periods > len(metrics) * 0.2:  # 20% من الوقت
            recommendations.append("تفكر في تحسين إدارة الذاكرة أو زيادة الذاكرة المتاحة")
        
        # تحليل مستوى الأداء العام
        critical_periods = len([m for m in metrics if m.performance_level == PerformanceLevel.CRITICAL])
        if critical_periods > 0:
            recommendations.append("هناك فترات حرجة تحتاج مراجعة عاجلة")
        
        return recommendations

# دوال الأداء المساعدة
def performance_timer(func: Callable) -> Callable:
    """مصحح لقياس وقت تنفيذ الدوال"""
    @wraps(func)
    async def async_wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = await func(*args, **kwargs)
            return result
        finally:
            execution_time = time.time() - start_time
            logger.debug(f"⏱️  وقت تنفيذ {func.__name__}: {execution_time:.4f} ثانية")
    
    @wraps(func)
    def sync_wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            return result
        finally:
            execution_time = time.time() - start_time
            logger.debug(f"⏱️  وقت تنفيذ {func.__name__}: {execution_time:.4f} ثانية")
    
    return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper

def memory_intensive_task(func: Callable) -> Callable:
    """مصحح للمهام المكثفة ذاكرياً"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        # التحقق من الذاكرة المتاحة قبل التنفيذ
        memory = psutil.virtual_memory()
        if memory.available < 1073741824:  # 1GB
            logger.warning("⚠️  ذاكرة منخفضة قبل تنفيذ مهمة مكثفة")
        
        result = func(*args, **kwargs)
        
        # التحقق من الذاكرة بعد التنفيذ
        memory_after = psutil.virtual_memory()
        memory_used = memory_after.used - memory.used
        
        if memory_used > 536870912:  # 512MB
            logger.info(f"🧠 المهمة {func.__name__} استخدمت {memory_used / 1024/1024:.2f}MB")
        
        return result
    return wrapper

# النسخة العالمية للخدمة
performance_monitor = PerformanceMonitor()
cache_manager = AdvancedCacheManager()
memory_optimizer = MemoryOptimizer()

# دوال التوافق
def get_cache_manager() -> AdvancedCacheManager:
    """دالة التوافق للحصول على مدير الذاكرة المؤقتة"""
    return cache_manager

def get_performance_monitor() -> PerformanceMonitor:
    """دالة التوافق للحصول على مراقب الأداء"""
    return performance_monitor

def optimize_system_memory() -> Dict[str, Any]:
    """دالة التوافق لتحسين الذاكرة"""
    return memory_optimizer.optimize_memory_usage()

if __name__ == "__main__":
    # اختبار الخدمات
    async def test_performance_services():
        print("🧪 اختبار خدمات الأداء والذاكرة...")
        
        # اختبار الذاكرة المؤقتة
        cache_manager.set('hot_data', 'test_key', {'data': 'test_value'})
        cached_value = cache_manager.get('hot_data', 'test_key')
        print(f"✅ اختبار الذاكرة المؤقتة: {cached_value}")
        
        # اختبار تحسين الذاكرة
        optimization_report = memory_optimizer.optimize_memory_usage()
        print(f"✅ تقرير تحسين الذاكرة: {optimization_report}")
        
        # اختبار مراقب الأداء
        performance_monitor.start_monitoring()
        await asyncio.sleep(2)
        
        performance_report = performance_monitor.get_performance_report(1)
        print(f"✅ تقرير الأداء: {performance_report}")
        
        performance_monitor.stop_monitoring()
    
    asyncio.run(test_performance_services())
