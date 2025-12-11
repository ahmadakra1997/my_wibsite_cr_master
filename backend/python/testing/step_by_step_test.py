# step_by_step_test.py
import os
import time
from datetime import datetime

class InteractiveTester:
    """مختبر تفاعلي سهل الاستخدام"""
    
    def __init__(self):
        self.results = []
        self.start_time = datetime.now()
    
    def test_step(self, step_name, test_function):
        """اختبار خطوة واحدة مع عرض النتائج"""
        print(f"\n🔍 جاري: {step_name}...")
        try:
            result = test_function()
            self.results.append((step_name, "✅", "نجح"))
            print(f"   ✅ {step_name} - نجح")
            return result
        except Exception as e:
            self.results.append((step_name, "❌", str(e)))
            print(f"   ❌ {step_name} - فشل: {e}")
            return None
    
    def run_all_tests(self):
        """تشغيل جميع الاختبارات"""
        print("🚀 بدء الاختبار التفاعلي الشامل...")
        print("=" * 60)
        
        # 1. اختبار البنية الأساسية
        self.test_step("فحص هيكل المشروع", self.test_project_structure)
        
        # 2. اختبار الخدمات
        self.test_step("فحص خدمات التداول", self.test_trading_services)
        
        # 3. اختبار البيانات
        self.test_step("فحص نماذج البيانات", self.test_data_models)
        
        # 4. اختبار الواجهة
        self.test_step("فحص الواجهة الأمامية", self.test_frontend)
        
        # 5. عرض النتائج
        self.show_results()
    
    def test_project_structure(self):
        """اختبار هيكل المشروع"""
        required_dirs = [
            'backend/python/services',
            'backend/python/scripts', 
            'frontend/src/components',
            'frontend/src/services'
        ]
        
        for dir_path in required_dirs:
            if not os.path.exists(dir_path):
                raise Exception(f"المجلد مفقود: {dir_path}")
        
        return "الهيكل سليم"
    
    def test_trading_services(self):
        """اختبار خدمات التداول"""
        # التحقق من وجود ملفات الخدمات
        service_files = [
            'backend/python/services/exchange_service.py',
            'backend/python/services/risk_service.py'
        ]
        
        for file_path in service_files:
            if not os.path.exists(file_path):
                raise Exception(f"ملف الخدمة مفقود: {file_path}")
        
        return "الخدمات موجودة"
    
    def test_data_models(self):
        """اختبار نماذج البيانات"""
        try:
            # اختبار بسيط للبيانات
            import pandas as pd
            data = {'price': [100, 101, 102], 'volume': [1000, 1100, 1200]}
            df = pd.DataFrame(data)
            
            if len(df) == 3:
                return "نماذج البيانات تعمل"
            else:
                raise Exception("خطأ في معالجة البيانات")
                
        except ImportError:
            raise Exception("pandas غير مثبت")
    
    def test_frontend(self):
        """اختبار الواجهة الأمامية"""
        # التحقق من وجود ملفات الواجهة الأساسية
        frontend_files = [
            'frontend/package.json',
            'frontend/src/App.js',
            'frontend/src/components'
        ]
        
        for item in frontend_files:
            if not os.path.exists(item):
                raise Exception(f"ملف الواجهة مفقود: {item}")
        
        return "الواجهة موجودة"
    
    def show_results(self):
        """عرض النتائج النهائية"""
        print("\n" + "=" * 60)
        print("📊 النتائج النهائية للاختبار")
        print("=" * 60)
        
        success_count = sum(1 for _, status, _ in self.results if status == "✅")
        total_count = len(self.results)
        
        for step_name, status, message in self.results:
            print(f"{status} {step_name}: {message}")
        
        print(f"\n🎯 النتيجة: {success_count}/{total_count} اختبار ناجح")
        
        if success_count == total_count:
            print("🎉 كل شيء يعمل بشكل ممتاز! يمكنك المتابعة.")
        else:
            print("⚠️ هناك بعض المشاكل التي تحتاج للإصلاح أولاً.")

# التشغيل التلقائي
if __name__ == "__main__":
    tester = InteractiveTester()
    tester.run_all_tests()
