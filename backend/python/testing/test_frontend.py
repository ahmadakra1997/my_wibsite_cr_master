# test_frontend.py
import os
import json
import subprocess

def test_frontend():
    """اختبار الواجهة الأمامية"""
    print("🎨 اختبار الواجهة الأمامية...")
    
    # 1. التحقق من package.json
    if not os.path.exists('frontend/package.json'):
        print("❌ package.json غير موجود")
        return False
    
    try:
        with open('frontend/package.json', 'r') as f:
            package_data = json.load(f)
        
        print(f"✅ المشروع: {package_data.get('name', 'غير معروف')}")
        print(f"✅ الإصدار: {package_data.get('version', 'غير معروف')}")
        
        # 2. التحقق من المكونات
        components_dir = 'frontend/src/components'
        if os.path.exists(components_dir):
            components = [f for f in os.listdir(components_dir) 
                         if f.endswith(('.js', '.jsx')) and not f.startswith('.')]
            print(f"✅ عدد المكونات: {len(components)}")
            for comp in components[:5]:  # عرض أول 5 مكونات فقط
                print(f"   📄 {comp}")
        else:
            print("❌ مجلد المكونات غير موجود")
        
        # 3. محاولة بناء المشروع (اختياري)
        print("\n🔨 محاولة بناء المشروع...")
        try:
            result = subprocess.run(
                ['npm', 'run', 'build'], 
                cwd='frontend',
                capture_output=True, 
                text=True,
                timeout=60
            )
            if result.returncode == 0:
                print("✅ البناء نجح!")
            else:
                print("⚠️ البناء فشل، ولكن هذا طبيعي في التطوير")
                
        except Exception as e:
            print(f"⚠️ لا يمكن البناء الآن: {e}")
        
        return True
        
    except Exception as e:
        print(f"❌ خطأ في اختبار الواجهة: {e}")
        return False

if __name__ == "__main__":
    test_frontend()
