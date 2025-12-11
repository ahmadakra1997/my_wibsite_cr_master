# auto_monitor.py
import time
import os
from datetime import datetime

class ProjectMonitor:
    """مراقب آلي للمشروع"""
    
    def __init__(self):
        self.checks = [
            self.check_backend_services,
            self.check_frontend,
            self.check_dependencies,
            self.check_configs
        ]
    
    def run_monitoring(self):
        """تشغيل المراقبة المستمرة"""
        print("👁️ بدء المراقبة الآلية للمشروع...")
        print("اضغط Ctrl+C لإيقاف المراقبة")
        
        try:
            while True:
                self.run_single_check()
                time.sleep(30)  # فحص كل 30 ثانية
        except KeyboardInterrupt:
            print("\n🛑 تم إيقاف المراقبة")
    
    def run_single_check(self):
        """تشغيل فحص واحد"""
        print(f"\n⏰ {datetime.now().strftime('%H:%M:%S')} - فحص المشروع...")
        
        all_ok = True
        for check in self.checks:
            if not check():
                all_ok = False
        
        if all_ok:
            print("✅ جميع الأنظمة تعمل بشكل طبيعي")
        else:
            print("⚠️ هناك مشاكل تحتاج للانتباه")
    
    def check_backend_services(self):
        """فحص خدمات الباكند"""
        services = os.listdir('backend/python/services') if os.path.exists('backend/python/services') else []
        python_services = [s for s in services if s.endswith('.py') and s != '__init__.py']
        
        if python_services:
            print(f"✅ الباكند: {len(python_services)} خدمة")
            return True
        else:
            print("❌ الباكند: لا توجد خدمات")
            return False
    
    def check_frontend(self):
        """فحص الفرونتند"""
        if os.path.exists('frontend/package.json'):
            print("✅ الفرونتند: package.json موجود")
            return True
        else:
            print("❌ الفرونتند: package.json مفقود")
            return False
    
    def check_dependencies(self):
        """فحص التبعيات"""
        try:
            import pandas
            import numpy
            print("✅ التبعيات: المكتبات الأساسية مثبتة")
            return True
        except ImportError:
            print("❌ التبعيات: مكتبات مفقودة")
            return False
    
    def check_configs(self):
        """فحص الإعدادات"""
        configs = [
            '.env.example',
            'backend/python/config'
        ]
        
        existing_configs = [c for c in configs if os.path.exists(c)]
        if existing_configs:
            print(f"✅ الإعدادات: {len(existing_configs)} ملف إعدادات")
            return True
        else:
            print("❌ الإعدادات: لا توجد ملفات إعدادات")
            return False

if __name__ == "__main__":
    monitor = ProjectMonitor()
    monitor.run_monitoring()
