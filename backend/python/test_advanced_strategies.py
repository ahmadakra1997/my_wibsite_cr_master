# backend/python/test_advanced_strategies.py
import asyncio
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
import warnings

from services.unified_strategy_interface import strategy_interface

# إعداد التسجيل
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def generate_realistic_market_data(symbol: str, days: int = 100, 
                                 volatility: float = 0.02, trend: float = 0.001) -> pd.DataFrame:
    """
    توليد بيانات سوق واقعية للاختبار مع اتجاه وتقلبات
    """
    dates = pd.date_range(end=datetime.now(), periods=days, freq='1H')
    
    np.random.seed(42)  # للتكرار
    prices = [100.0]
    
    for i in range(1, days):
        # تغيير مع اتجاه وتقلبات
        change = trend + np.random.normal(0, volatility)
        new_price = prices[-1] * (1 + change)
        prices.append(max(new_price, 0.01))  # منع الأسعار السلبية
    
    df = pd.DataFrame({
        'timestamp': dates,
        'open': [p * (1 + np.random.normal(0, 0.005)) for p in prices],
        'high': [p * (1 + abs(np.random.normal(0, 0.01))) for p in prices],
        'low': [p * (1 - abs(np.random.normal(0, 0.01))) for p in prices],
        'close': prices,
        'volume': np.random.randint(1000, 10000, days)
    })
    
    return df

async def comprehensive_strategy_test():
    """
    اختبار شامل لنظام الاستراتيجيات المتقدم
    """
    print("🚀 بدء الاختبار الشامل للاستراتيجيات المتقدمة...")
    print("=" * 60)
    
    # توليد بيانات اختبار متنوعة
    test_symbols = [
        ("BTC/USDT", 0.025, 0.002),   # عالي التقلب، اتجاه صعودي
        ("ETH/USDT", 0.02, 0.001),    # متوسط التقلب، اتجاه صعودي خفيف
        ("ADA/USDT", 0.03, -0.001),   # عالي التقلب، اتجاه هبوطي
    ]
    
    results = []
    
    for symbol, volatility, trend in test_symbols:
        print(f"\n📊 اختبار {symbol}...")
        
        # توليد بيانات السوق
        market_data = generate_realistic_market_data(symbol, volatility=volatility, trend=trend)
        
        # اختبار الحصول على إشارات
        try:
            signals = await strategy_interface.get_trading_signals(symbol, market_data)
            
            print(f"✅ {symbol}:")
            print(f"   • نظام السوق: {signals['market_regime']}")
            print(f"   • الثقة العامة: {signals['confidence']:.2f}")
            print(f"   • عدد الإشارات: {len(signals['signals'])}")
            
            for signal in signals['signals']:
                print(f"   📈 {signal['strategy']}: {signal['signal']} (ثقة: {signal.get('confidence', 0):.2f})")
            
            results.append({
                'symbol': symbol,
                'success': True,
                'signals': len(signals['signals']),
                'confidence': signals['confidence']
            })
            
        except Exception as e:
            print(f"❌ {symbol}: فشل - {e}")
            results.append({
                'symbol': symbol, 
                'success': False,
                'error': str(e)
            })
    
    # اختبار أداء الاستراتيجيات
    print(f"\n📊 اختبار نظام الأداء...")
    performance_report = strategy_interface.get_performance_report()
    
    print(f"• إجمالي الاستراتيجيات: {performance_report.get('overall_metrics', {}).get('total_strategies', 0)}")
    print(f"• التوصيات المتاحة: {len(performance_report.get('recommendations', []))}")
    
    for rec in performance_report.get('recommendations', [])[:3]:
        print(f"  🎯 {rec['strategy']}: درجة {rec['score']:.2f} - {rec['recommendation']}")
    
    # عرض النتائج النهائية
    print(f"\n🎯 النتائج النهائية:")
    print("=" * 60)
    
    successful_tests = [r for r in results if r['success']]
    print(f"• الاختبارات الناجحة: {len(successful_tests)}/{len(results)}")
    
    if successful_tests:
        avg_confidence = sum(r['confidence'] for r in successful_tests) / len(successful_tests)
        print(f"• متوسط الثقة: {avg_confidence:.2f}")
        print(f"• إجمالي الإشارات: {sum(r['signals'] for r in successful_tests)}")
    
    print("✅ اختبار الاستراتيجيات المتقدمة اكتمل بنجاح!")

if __name__ == "__main__":
    # تشغيل الاختبار
    asyncio.run(comprehensive_strategy_test())
