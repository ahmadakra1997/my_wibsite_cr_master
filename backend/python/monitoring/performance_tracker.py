import time
import statistics
from functools import wraps
from typing import Dict, List, Any
import logging
from datetime import datetime, timedelta
import psutil

class PerformanceTracker:
    def __init__(self):
        self.metrics = {}
        self.performance_log = []
        self.setup_logging()
    
    def setup_logging(self):
        self.logger = logging.getLogger('performance_tracker')
        handler = logging.FileHandler('logs/performance.log')
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)
    
    def track_performance(self, operation_name: str):
        """ديكوراتور لتتبع أداء الوظائف"""
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                start_time = time.time()
                start_memory = psutil.Process().memory_info().rss
                
                try:
                    result = func(*args, **kwargs)
                    execution_time = time.time() - start_time
                    end_memory = psutil.Process().memory_info().rss
                    memory_used = end_memory - start_memory
                    
                    self.record_metric(
                        operation_name,
                        execution_time,
                        memory_used,
                        "success"
                    )
                    
                    return result
                    
                except Exception as e:
                    execution_time = time.time() - start_time
                    self.record_metric(
                        operation_name,
                        execution_time,
                        0,
                        "error"
                    )
                    self.logger.error(f"Error in {operation_name}: {str(e)}")
                    raise e
                    
            return wrapper
        return decorator
    
    def record_metric(self, operation: str, execution_time: float, memory_used: int, status: str):
        """تسجيل مقاييس الأداء"""
        metric = {
            'operation': operation,
            'execution_time': execution_time,
            'memory_used': memory_used,
            'status': status,
            'timestamp': datetime.now()
        }
        
        self.performance_log.append(metric)
        
        # تحديث الإحصائيات
        if operation not in self.metrics:
            self.metrics[operation] = []
        
        self.metrics[operation].append(metric)
        self._cleanup_old_metrics()
        
        self.logger.info(f"Performance metric recorded: {operation} - {execution_time:.3f}s - {status}")
    
    def _cleanup_old_metrics(self):
        """تنظيف المقاييس القديمة"""
        cutoff_time = datetime.now() - timedelta(hours=1)
        self.performance_log = [
            m for m in self.performance_log 
            if m['timestamp'] > cutoff_time
        ]
        
        # تنظيف metrics القديمة أيضاً
        for operation in list(self.metrics.keys()):
            self.metrics[operation] = [
                m for m in self.metrics[operation]
                if m['timestamp'] > cutoff_time
            ]
    
    def get_performance_summary(self) -> Dict[str, Any]:
        """ملخص أداء شامل"""
        summary = {}
        
        for operation, metrics in self.metrics.items():
            if not metrics:
                continue
                
            times = [m['execution_time'] for m in metrics if m['status'] == 'success']
            error_count = sum(1 for m in metrics if m['status'] == 'error')
            
            if times:
                try:
                    quantiles = statistics.quantiles(times, n=20) if len(times) >= 20 else []
                    p95_time = quantiles[18] if quantiles else max(times)
                except:
                    p95_time = max(times)
                
                summary[operation] = {
                    'call_count': len(metrics),
                    'error_count': error_count,
                    'error_rate': error_count / len(metrics) if metrics else 0,
                    'avg_time': statistics.mean(times),
                    'min_time': min(times),
                    'max_time': max(times),
                    'p95_time': p95_time
                }
        
        return summary

# مثال للاستخدام
if __name__ == "__main__":
    tracker = PerformanceTracker()
    
    @tracker.track_performance("test_operation")
    def test_function():
        time.sleep(0.1)
        return "success"
    
    test_function()
    print("Performance Tracker tested successfully!")
