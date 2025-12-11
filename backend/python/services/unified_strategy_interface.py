# backend/python/services/unified_strategy_interface.py
from typing import Dict, List, Optional, Any
import pandas as pd
from datetime import datetime
import logging
import asyncio

from .advanced_strategy_engine import AdvancedStrategyEngine, StrategyType
from .strategy_performance_tracker import StrategyPerformanceTracker

class UnifiedStrategyInterface:
    """
    واجهة موحدة لجميع استراتيجيات التداول مع الحفاظ على التوافق مع النظام الحالي
    """
    
    def __init__(self, project_root: str = "/workspaces/my_wibsite_cr"):
        self.strategy_engine = AdvancedStrategyEngine(project_root)
        self.performance_tracker = StrategyPerformanceTracker()
        self.active_strategies = {}
        self.logger = logging.getLogger(__name__)
        
        self.logger.info("🚀 واجهة الاستراتيجيات الموحدة - جاهزة للتشغيل")
    
    async def get_trading_signals(self, symbol: str, market_data: pd.DataFrame,
                                strategy_name: Optional[str] = None) -> Dict[str, Any]:
        """
        واجهة موحدة للحصول على إشارات التداول - متوافقة مع النظام الحالي
        """
        try:
            # تحديد نوع الاستراتيجية المفضل
            strategy_type = None
            if strategy_name:
                strategy_type = self._map_strategy_name_to_type(strategy_name)
            
            # الحصول على الإشارات من المحرك المتقدم
            signals = await self.strategy_engine.generate_trading_signals(
                symbol, market_data, strategy_type
            )
            
            # تسجيل استخدام الاستراتيجية للأداء
            self._record_strategy_usage(signals)
            
            return signals
            
        except Exception as e:
            self.logger.error(f"❌ خطأ في واجهة الاستراتيجيات: {e}")
            return self._get_fallback_signals(symbol)
    
    def _map_strategy_name_to_type(self, strategy_name: str) -> StrategyType:
        """تعيين اسم الاستراتيجية إلى نوعها"""
        mapping = {
            'mean_reversion': StrategyType.MEAN_REVERSION,
            'trend_following': StrategyType.TREND_FOLLOWING,
            'breakout': StrategyType.BREAKOUT,
            'momentum': StrategyType.MOMENTUM,
            'arbitrage': StrategyType.ARBITRAGE
        }
        return mapping.get(strategy_name.lower(), StrategyType.MEAN_REVERSION)
    
    def _record_strategy_usage(self, signals: Dict) -> None:
        """تسجيل استخدام الاستراتيجية للأداء"""
        for signal in signals.get('signals', []):
            strategy_name = signal.get('strategy', 'unknown')
            # تسجيل إشارة كصفقة مفتوحة (سيتم تحديثها لاحقاً)
            self.performance_tracker.record_trade(
                strategy_name=strategy_name,
                symbol=signals['symbol'],
                signal=signal.get('signal', 'HOLD'),
                entry_price=0.0,  # سيتم تحديثه عند التنفيذ الفعلي
                quantity=1.0
            )
    
    def _get_fallback_signals(self, symbol: str) -> Dict[str, Any]:
        """إشارات احتياطية في حالة الخطأ"""
        return {
            'symbol': symbol,
            'timestamp': datetime.now().isoformat(),
            'market_regime': 'unknown',
            'signals': [{
                'strategy': 'fallback',
                'signal': 'HOLD',
                'confidence': 0.1,
                'reason': 'System error'
            }],
            'confidence': 0.1
        }
    
    def get_strategy_performance(self, days: int = 30) -> List[Dict]:
        """الحصول على أداء جميع الاستراتيجيات"""
        return self.performance_tracker.get_strategy_recommendations()
    
    def get_performance_report(self, strategy_name: str = None) -> Dict:
        """الحصول على تقرير أداء مفصل"""
        return self.performance_tracker.generate_performance_report(strategy_name)
    
    def update_trade_result(self, strategy_name: str, symbol: str, 
                          exit_price: float, timestamp: datetime = None) -> bool:
        """تحديث نتيجة الصفقة (للاستخدام من قبل أنظمة التنفيذ)"""
        return self.performance_tracker.update_trade_exit(
            strategy_name, symbol, exit_price, timestamp
        )
    
    def get_recommended_strategies(self, market_regime: str) -> List[str]:
        """الحصول على الاستراتيجيات الموصى بها لنظام سوق معين"""
        performance_data = self.get_strategy_performance()
        
        # تصفية الاستراتيجيات ذات الأداء الجيد
        recommended = [
            rec['strategy'] for rec in performance_data 
            if rec['recommendation'] in ['RECOMMENDED', 'HIGHLY_RECOMMENDED']
        ]
        
        return recommended[:3]  # أفضل 3 استراتيجيات

# إنشاء واجهة عالمية للاستخدام
strategy_interface = UnifiedStrategyInterface()
