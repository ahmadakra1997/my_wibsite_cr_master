# backend/python/services/strategy_performance_tracker.py
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import logging
from enum import Enum

class PerformanceMetric(Enum):
    """مقاييس أداء الاستراتيجيات"""
    WIN_RATE = "win_rate"
    PROFIT_LOSS = "profit_loss" 
    SHARPE_RATIO = "sharpe_ratio"
    MAX_DRAWDOWN = "max_drawdown"
    TOTAL_TRADES = "total_trades"

class StrategyPerformanceTracker:
    """متتبع أداء احترافي للاستراتيجيات"""
    
    def __init__(self):
        self.performance_data = {}
        self.trade_history = []
        self.logger = logging.getLogger(__name__)
    
    def record_trade(self, strategy_name: str, symbol: str, signal: str, 
                   entry_price: float, exit_price: Optional[float] = None,
                   quantity: float = 1.0, timestamp: datetime = None) -> None:
        """تسجيل صفقة جديدة في السجل"""
        trade = {
            'strategy': strategy_name,
            'symbol': symbol,
            'signal': signal,
            'entry_price': entry_price,
            'exit_price': exit_price,
            'quantity': quantity,
            'entry_time': timestamp or datetime.now(),
            'exit_time': None,
            'profit_loss': None,
            'status': 'open' if exit_price is None else 'closed'
        }
        
        self.trade_history.append(trade)
        self.logger.info(f"📊 تم تسجيل صفقة: {strategy_name} - {symbol} - {signal}")
    
    def update_trade_exit(self, strategy_name: str, symbol: str, exit_price: float, 
                         timestamp: datetime = None) -> bool:
        """تحديث سعر الخروج للصفقة"""
        for trade in reversed(self.trade_history):
            if (trade['strategy'] == strategy_name and 
                trade['symbol'] == symbol and 
                trade['status'] == 'open'):
                
                trade['exit_price'] = exit_price
                trade['exit_time'] = timestamp or datetime.now()
                trade['status'] = 'closed'
                
                # حساب الربح/الخسارة
                if trade['signal'].upper() == 'BUY':
                    trade['profit_loss'] = (exit_price - trade['entry_price']) * trade['quantity']
                elif trade['signal'].upper() == 'SELL':
                    trade['profit_loss'] = (trade['entry_price'] - exit_price) * trade['quantity']
                
                self.logger.info(f"✅ تم إغلاق صفقة: {strategy_name} - P/L: {trade['profit_loss']:.2f}")
                return True
        
        return False
    
    def calculate_strategy_performance(self, strategy_name: str, days: int = 30) -> Dict[str, float]:
        """حساب أداء الاستراتيجية خلال فترة محددة"""
        cutoff_date = datetime.now() - timedelta(days=days)
        
        # تصفية الصفقات حسب الاستراتيجية والفترة
        strategy_trades = [
            t for t in self.trade_history 
            if (t['strategy'] == strategy_name and 
                t['entry_time'] >= cutoff_date and
                t['status'] == 'closed')
        ]
        
        if not strategy_trades:
            return {}
        
        # حساب المقاييس
        winning_trades = [t for t in strategy_trades if t['profit_loss'] > 0]
        losing_trades = [t for t in strategy_trades if t['profit_loss'] < 0]
        
        total_pl = sum(t['profit_loss'] for t in strategy_trades)
        win_rate = len(winning_trades) / len(strategy_trades) if strategy_trades else 0
        
        # حساب أقصى خسارة ومقاييس متقدمة
        max_drawdown = self._calculate_max_drawdown(strategy_trades)
        sharpe_ratio = self._calculate_sharpe_ratio(strategy_trades)
        
        return {
            'total_trades': len(strategy_trades),
            'winning_trades': len(winning_trades),
            'losing_trades': len(losing_trades),
            'win_rate': win_rate,
            'total_profit_loss': total_pl,
            'average_profit': total_pl / len(strategy_trades) if strategy_trades else 0,
            'max_drawdown': max_drawdown,
            'sharpe_ratio': sharpe_ratio,
            'profit_factor': abs(sum(t['profit_loss'] for t in winning_trades)) / 
                           abs(sum(t['profit_loss'] for t in losing_trades)) if losing_trades else float('inf')
        }
    
    def _calculate_max_drawdown(self, trades: List[Dict]) -> float:
        """حساب أقصى خسارة من سلسلة الصفقات"""
        if not trades:
            return 0.0
        
        # ترتيب الصفقات حسب الوقت
        sorted_trades = sorted(trades, key=lambda x: x['exit_time'])
        
        equity_curve = []
        current_equity = 0
        
        for trade in sorted_trades:
            current_equity += trade['profit_loss']
            equity_curve.append(current_equity)
        
        # حساب أقصى خسارة
        peak = equity_curve[0]
        max_dd = 0.0
        
        for value in equity_curve:
            if value > peak:
                peak = value
            dd = (peak - value) / peak if peak != 0 else 0
            if dd > max_dd:
                max_dd = dd
        
        return max_dd
    
    def _calculate_sharpe_ratio(self, trades: List[Dict], risk_free_rate: float = 0.02) -> float:
        """حساب نسبة شارب (مبسطة)"""
        if len(trades) < 2:
            return 0.0
        
        returns = [t['profit_loss'] for t in trades]
        
        # افتراض أن الصفقات يومية (لحساب العائد السنوي)
        avg_return = sum(returns) / len(returns)
        std_return = np.std(returns)
        
        if std_return == 0:
            return 0.0
        
        # نسبة شارب سنوية
        sharpe = (avg_return - risk_free_rate/252) / std_return * np.sqrt(252)
        return float(sharpe)
    
    def get_strategy_recommendations(self, min_trades: int = 10) -> List[Dict]:
        """الحصول على توصيات الاستراتيجيات بناءً على الأداء"""
        strategies = set(t['strategy'] for t in self.trade_history)
        recommendations = []
        
        for strategy in strategies:
            performance = self.calculate_strategy_performance(strategy)
            
            if not performance or performance['total_trades'] < min_trades:
                continue
            
            # تقييم الاستراتيجية
            score = self._calculate_strategy_score(performance)
            recommendation = self._generate_recommendation(performance, score)
            
            recommendations.append({
                'strategy': strategy,
                'performance': performance,
                'score': score,
                'recommendation': recommendation,
                'last_updated': datetime.now()
            })
        
        # ترتيب حسب الأداء
        return sorted(recommendations, key=lambda x: x['score'], reverse=True)
    
    def _calculate_strategy_score(self, performance: Dict) -> float:
        """حساب درجة الاستراتيجية (0-1)"""
        win_rate = performance.get('win_rate', 0)
        profit_factor = performance.get('profit_factor', 0)
        sharpe_ratio = performance.get('sharpe_ratio', 0)
        max_drawdown = performance.get('max_drawdown', 1)
        
        # حساب مرجح
        score = (
            win_rate * 0.3 +
            min(profit_factor, 5) * 0.2 +
            min(sharpe_ratio, 3) * 0.3 +
            (1 - min(max_drawdown, 1)) * 0.2
        )
        
        return max(0.0, min(1.0, score))
    
    def _generate_recommendation(self, performance: Dict, score: float) -> str:
        """توليد توصية بناءً على الأداء"""
        if score >= 0.7:
            return "HIGHLY_RECOMMENDED"
        elif score >= 0.5:
            return "RECOMMENDED" 
        elif score >= 0.3:
            return "NEUTRAL"
        else:
            return "NOT_RECOMMENDED"
    
    def generate_performance_report(self, strategy_name: str = None) -> Dict:
        """توليد تقرير أداء مفصل"""
        if strategy_name:
            strategies = [strategy_name]
        else:
            strategies = set(t['strategy'] for t in self.trade_history)
        
        report = {
            'generated_at': datetime.now().isoformat(),
            'strategies': {},
            'overall_metrics': {},
            'recommendations': self.get_strategy_recommendations()
        }
        
        for strategy in strategies:
            report['strategies'][strategy] = self.calculate_strategy_performance(strategy)
        
        # حساب المقاييس العامة
        if report['strategies']:
            all_trades = [t for t in self.trade_history if t['strategy'] in strategies and t['status'] == 'closed']
            if all_trades:
                total_pl = sum(t['profit_loss'] for t in all_trades)
                report['overall_metrics'] = {
                    'total_strategies': len(strategies),
                    'total_trades': len(all_trades),
                    'total_profit_loss': total_pl,
                    'avg_daily_trades': len(all_trades) / 30  # افتراض 30 يوم
                }
        
        return report
