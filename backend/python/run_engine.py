#!/usr/bin/env python3
"""
سكريبت تشغيل محرك التداول مع معالجة الأخطاء
"""

import os
import sys
import logging
from pathlib import Path

# إعداد المسار
current_dir = Path(__file__).parent
sys.path.append(str(current_dir))

def setup_environment():
    """إعداد بيئة التشغيل"""
    # إنشاء المجلدات المطلوبة
    folders = ['logs', 'ai_models', 'data']
    for folder in folders:
        (current_dir / folder).mkdir(exist_ok=True)
    
    # التحقق من المتغيرات البيئية
    required_vars = ['MEXC_API_KEY', 'MEXC_SECRET']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print(f"❌ متغيرات بيئية مفقودة: {missing_vars}")
        print("📝 يرجى إعداد ملف .env بالمحتوى التالي:")
        print("MEXC_API_KEY=your_api_key_here")
        print("MEXC_SECRET=your_secret_here")
        print("PYTHON_PORT=8000")
        sys.exit(1)

def main():
    """الدالة الرئيسية"""
    try:
        setup_environment()
        
        print("🚀 بدء تشغيل محرك التداول Quantum AI...")
        
        from trading_engine import QuantumTradingEngine
        
        # إنشاء وتشغيل المحرك
        engine = QuantumTradingEngine()
        engine.run()
        
    except KeyboardInterrupt:
        print("\n⏹️ تم إيقاف المحرك بواسطة المستخدم")
    except Exception as e:
        print(f"❌ خطأ فادح: {e}")
        logging.error(f"خطأ فادح: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    main()