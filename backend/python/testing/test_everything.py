# test_everything.py
import os
import sys
import importlib
from pathlib import Path

def simple_test():
    """أسهل اختبار يمكنك تشغيله"""
    print("🎯 بدء الاختبار السهل للمشروع...")
    print("=" * 50)
    
    # 1. اختبار الملفات الأساسية
    print("\n1. 🔍 فحص الملفات الأساسية...")
    essential_files = [
        'backend/python/services/exchange_service.py',
        'backend/python/services/risk_service.py', 
        'frontend/src/components',
        'backend/python/scripts'
    ]
    
    for file_path in essential_files:
        if os.path.exists(file_path):
            print(f"   ✅ {file_path} - موجود")
        else:
            print(f"   ❌ {file_path} - مفقود")
    
    # 2. اختبار استيراد المكتبات
    print("\n2. 📦 فحص المكتبات...")
    libraries = ['pandas', 'numpy', 'requests', 'logging']
    for lib in libraries:
        try:
            __import__(lib)
            print(f"   ✅ {lib} - مثبتة")
        except ImportError:
            print(f"   ❌ {lib} - غير مثبتة")
    
    # 3. اختبار الخدمات الأساسية
    print("\n3. 🔧 فحص الخدمات...")
    try:
        # محاولة استيراد خدمات التداول
        sys.path.append('backend/python')
        from services.exchange_service import ExchangeService
        print("   ✅ خدمات التبادل - تعمل")
    except Exception as e:
        print(f"   ❌ خدمات التبادل - خطأ: {e}")
    
    # 4. النتيجة النهائية
    print("\n" + "=" * 50)
    print("🎊 الاختبار اكتمل!")
    print("💡 إذا رأيت ✅ فالمشروع يعمل بشكل جيد")
    print("🔧 إذا رأيت ❌ فهناك مشاكل تحتاج للإصلاح")

if __name__ == "__main__":
    simple_test()
