# backend/python/monitoring/performance_auditor.py
import time
import statistics
from datetime import datetime, timedelta
from typing import Dict, List
import logging

class PerformanceAuditor:
    """مدقق أداء احترافي لمراقبة التحسينات"""
    
    def __init__(self):
        self.performance_log = []
        self.baseline_metrics = {}
    
    def track_performance(self, service_name: str, method_name: str, execution_time: float):
        """تتبع أداء الخدمات"""
        metric = {
            'timestamp': datetime.now(),
            'service': service_name,
            'method': method_name,
            'execution_time': execution_time
        }
        self.performance_log.append(metric)
        
        # الاحتفاظ بالسجل محدود الحجم
        if len(self.performance_log) > 1000:
            self.performance_log = self.performance_log[-1000:]
    
    def calculate_improvements(self) -> Dict:
        """حساب نسبة التحسين في الأداء"""
        if not self.performance_log:
            return {}
        
        # تحليل الأداء خلال آخر ساعة
        one_hour_ago = datetime.now() - timedelta(hours=1)
        recent_metrics = [m for m in self.performance_log if m['timestamp'] > one_hour_ago]
        
        if not recent_metrics:
            return {}
        
        improvements = {}
        services = set(m['service'] for m in recent_metrics)
        
        for service in services:
            service_metrics = [m for m in recent_metrics if m['service'] == service]
            avg_time = statistics.mean(m['execution_time'] for m in service_metrics)
            
            # مقارنة مع baseline إذا كان موجوداً
            if service in self.baseline_metrics:
                baseline = self.baseline_metrics[service]
                improvement = ((baseline - avg_time) / baseline) * 100
                improvements[service] = {
                    'baseline': baseline,
                    'current': avg_time,
                    'improvement_percent': improvement,
                    'status': 'IMPROVED' if improvement > 0 else 'REGRESSION'
                }
        
        return improvements

# استخدام المدقق
performance_auditor = PerformanceAuditor()
