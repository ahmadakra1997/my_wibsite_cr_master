import time
import logging
import asyncio
from dataclasses import dataclass
from typing import Dict, List, Optional
import psutil
import requests
from datetime import datetime, timedelta

@dataclass
class ServiceHealth:
    name: str
    status: str
    response_time: float
    last_check: datetime
    error_count: int = 0

class AdvancedHealthMonitor:
    def __init__(self, config: Dict):
        self.config = config
        self.services = {}
        self.health_history = []
        self.setup_logging()
        
    def setup_logging(self):
        """إعداد نظام التسجيل المتقدم"""
        self.logger = logging.getLogger('health_monitor')
        handler = logging.FileHandler('logs/health_monitor.log')
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)
        
    async def check_service_health(self, service_name: str, endpoint: str) -> ServiceHealth:
        """فحص صحة الخدمة مع معالجة الأخطاء المحسنة"""
        start_time = time.time()
        try:
            response = requests.get(
                endpoint, 
                timeout=10,
                headers={'User-Agent': 'TradingPlatform/1.0'}
            )
            response_time = time.time() - start_time
            
            status = "healthy" if response.status_code == 200 else "unhealthy"
            
            health = ServiceHealth(
                name=service_name,
                status=status,
                response_time=response_time,
                last_check=datetime.now()
            )
            
            self.logger.info(f"Service {service_name} status: {status}, response time: {response_time:.2f}s")
            
        except Exception as e:
            response_time = time.time() - start_time
            health = ServiceHealth(
                name=service_name,
                status="error",
                response_time=response_time,
                last_check=datetime.now(),
                error_count=1
            )
            self.logger.error(f"Service {service_name} error: {str(e)}")
            
        self.services[service_name] = health
        self.health_history.append(health)
        
        # الحفاظ على تاريخ الصحة لمدة 24 ساعة فقط
        self._cleanup_old_records()
        
        return health
    
    def _cleanup_old_records(self):
        """تنظيف السجلات القديمة"""
        cutoff_time = datetime.now() - timedelta(hours=24)
        self.health_history = [
            record for record in self.health_history 
            if record.last_check > cutoff_time
        ]
    
    def get_system_metrics(self) -> Dict:
        """الحصول على مقاييس النظام الشاملة"""
        try:
            return {
                "cpu_percent": psutil.cpu_percent(interval=1),
                "memory_usage": psutil.virtual_memory().percent,
                "disk_usage": psutil.disk_usage('/').percent,
                "active_connections": len(psutil.net_connections()),
                "boot_time": psutil.boot_time(),
                "system_uptime": time.time() - psutil.boot_time()
            }
        except Exception as e:
            self.logger.error(f"Error getting system metrics: {str(e)}")
            return {}
    
    def generate_health_report(self) -> Dict:
        """تقرير صحة شامل"""
        total_services = len(self.services)
        healthy_services = sum(1 for s in self.services.values() if s.status == "healthy")
        
        overall_status = "healthy" if total_services > 0 and (healthy_services / total_services > 0.8) else "degraded"
        
        return {
            "overall_status": overall_status,
            "services_health": {name: {
                'name': health.name,
                'status': health.status,
                'response_time': health.response_time,
                'last_check': health.last_check.isoformat(),
                'error_count': health.error_count
            } for name, health in self.services.items()},
            "system_metrics": self.get_system_metrics(),
            "timestamp": datetime.now().isoformat()
        }

# مثال للاستخدام
if __name__ == "__main__":
    monitor = AdvancedHealthMonitor({})
    print("Health Monitor initialized successfully!")
