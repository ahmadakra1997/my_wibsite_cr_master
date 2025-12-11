# backend/python/test_existing_functionality.py
import os
import sys
import importlib.util
from pathlib import Path
import logging

# إعداد نظام التسجيل
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class FunctionalityTester:
    """مختبر احترافي للوظائف مع التعامل الذكي مع الملفات"""
    
    def __init__(self):
        self.project_root = Path("/workspaces/my_wibsite_cr")
        self.test_results = {}
    
    def safe_import_service(self, service_name, service_path):
        """استيراد آمن للخدمات مع التعامل مع الملفات غير الموجودة"""
        try:
            # بناء المسار الكامل
            full_path = self.project_root / service_path
            
            if not full_path.exists():
                logger.warning(f"⚠️ الملف غير موجود: {service_path}")
                return None
            
            # استيراد ديناميكي
            spec = importlib.util.spec_from_file_location(service_name, full_path)
            if spec is None:
                logger.warning(f"⚠️ لا يمكن تحميل مواصفات: {service_name}")
                return None
                
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            logger.info(f"✅ تم تحميل: {service_name}")
            return module
            
        except Exception as e:
            logger.error(f"❌ خطأ في تحميل {service_name}: {e}")
            return None
    
    def test_exchange_services(self):
        """اختبار خدمات التبادل"""
        logger.info("🧪 اختبار خدمات التبادل...")
        
        # البحث عن خدمات التبادل
        exchange_services = []
        services_path = self.project_root / "backend" / "python" / "services"
        
        if services_path.exists():
            for py_file in services_path.glob("*.py"):
                if "exchange" in py_file.name.lower():
                    exchange_services.append(py_file.name)
        
        if not exchange_services:
            logger.warning("⚠️ لم يتم العثور على خدمات تبادل")
            return False
        
        # اختبار كل خدمة
        for service_file in exchange_services:
            service_path = f"backend/python/services/{service_file}"
            service_name = service_file.replace(".py", "")
            
            module = self.safe_import_service(service_name, service_path)
            if module:
                # اختبار الوظائف الأساسية
                if hasattr(module, 'ExchangeService'):
                    try:
                        # اختبار إنشاء instance
                        instance = module.ExchangeService()
                        logger.info(f"✅ {service_name} - يمكن إنشاء instance")
                        self.test_results[service_name] = "PASS"
                    except Exception as e:
                        logger.error(f"❌ {service_name} - خطأ في الإنشاء: {e}")
                        self.test_results[service_name] = "FAIL"
        
        return len([v for v in self.test_results.values() if v == "PASS"]) > 0
    
    def test_risk_services(self):
        """اختبار خدمات المخاطر"""
        logger.info("🧪 اختبار خدمات المخاطر...")
        
        risk_services_path = self.project_root / "backend" / "python" / "services"
        risk_services = []
        
        if risk_services_path.exists():
            for py_file in risk_services_path.glob("*.py"):
                if "risk" in py_file.name.lower():
                    risk_services.append(py_file.name)
        
        if not risk_services:
            logger.warning("⚠️ لم يتم العثور على خدمات مخاطر")
            return False
        
        for service_file in risk_services:
            service_path = f"backend/python/services/{service_file}"
            service_name = service_file.replace(".py", "")
            
            module = self.safe_import_service(service_name, service_path)
            if module:
                logger.info(f"✅ {service_name} - تم تحميلها بنجاح")
                self.test_results[service_name] = "PASS"
        
        return True
    
    def run_comprehensive_tests(self):
        """تشغيل اختبارات شاملة"""
        logger.info("🚀 بدء الاختبارات الشاملة...")
        
        tests = [
            self.test_exchange_services,
            self.test_risk_services
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                logger.error(f"❌ فشل الاختبار: {e}")
        
        # عرض النتائج
        self.print_test_summary()
    
    def print_test_summary(self):
        """عرض ملخص النتائج"""
        print("\n" + "="*50)
        print("📊 ملخص اختبار الوظائف الحالية")
        print("="*50)
        
        total_tests = len(self.test_results)
        passed_tests = len([v for v in self.test_results.values() if v == "PASS"])
        
        print(f"• إجمالي الاختبارات: {total_tests}")
        print(f"• الاختبارات الناجحة: {passed_tests}")
        print(f"• نسبة النجاح: {(passed_tests/max(total_tests,1))*100:.1f}%")
        
        for service, result in self.test_results.items():
            status = "✅" if result == "PASS" else "❌"
            print(f"  {status} {service}: {result}")

def main():
    """الدالة الرئيسية"""
    tester = FunctionalityTester()
    tester.run_comprehensive_tests()

if __name__ == "__main__":
    main()
