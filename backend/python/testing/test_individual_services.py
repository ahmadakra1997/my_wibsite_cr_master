# test_individual_services.py
import os
import importlib.util
import sys

def test_service(service_name, service_path):
    """اختبار خدمة فردية"""
    print(f"🧪 اختبار {service_name}...")
    
    if not os.path.exists(service_path):
        print(f"   ❌ الملف غير موجود: {service_path}")
        return False
    
    try:
        # تحميل الخدمة
        spec = importlib.util.spec_from_file_location(service_name, service_path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        
        print(f"   ✅ تم تحميل {service_name} بنجاح")
        
        # اختبار الدوال الأساسية إذا كانت موجودة
        if hasattr(module, 'ExchangeService'):
            print("   ✅ يوجد ExchangeService")
        if hasattr(module, 'RiskService'):
            print("   ✅ يوجد RiskService")
            
        return True
        
    except Exception as e:
        print(f"   ❌ خطأ في {service_name}: {e}")
        return False

def main():
    """اختبار جميع الخدمات"""
    print("🔧 اختبار الخدمات الفردية")
    print("=" * 50)
    
    services_to_test = [
        ("Exchange Service", "backend/python/services/exchange_service.py"),
        ("Risk Service", "backend/python/services/risk_service.py"),
        ("Cache Service", "backend/python/services/cache_service.py"),
    ]
    
    results = []
    for service_name, service_path in services_to_test:
        success = test_service(service_name, service_path)
        results.append((service_name, success))
    
    # عرض الملخص
    print("\n📊 ملخص اختبار الخدمات:")
    successful = sum(1 for _, success in results if success)
    print(f"✅ الخدمات الناجحة: {successful}/{len(results)}")
    
    for service_name, success in results:
        status = "✅" if success else "❌"
        print(f"   {status} {service_name}")

if __name__ == "__main__":
    main()
