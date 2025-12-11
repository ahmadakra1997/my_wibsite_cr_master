"""
خدمة إدارة المخاطر المتقدمة - الإصدار 3.0
نظام إدارة مخاطر شامل مع تحليلات آنية وحماية متقدمة
"""

import os
import logging
import asyncio
import json
import time
from typing import Dict, List, Optional, Any, Tuple
from decimal import Decimal, ROUND_DOWN
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
import statistics
from functools import wraps
import cachetools

# إعداد المسجل المتقدم
logger = logging.getLogger(__name__)

class RiskLevel(Enum):
    """مستويات المخاطر"""
    LOW = "low"
    MEDIUM = "medium" 
    HIGH = "high"
    CRITICAL = "critical"

class AlertType(Enum):
    """أنواع التنبيهات"""
    POSITION_SIZE = "position_size"
    LEVERAGE = "leverage"
    DRAWDOWN = "drawdown"
    LIQUIDATION = "liquidation"
    VOLATILITY = "volatility"

@dataclass
class RiskMetrics:
    """مقاييس المخاطر الشاملة"""
    total_exposure: Decimal
    max_position_size: Decimal
    current_leverage: Decimal
    daily_pnl: Decimal
    max_drawdown: Decimal
    volatility_score: Decimal
    risk_score: Decimal
    portfolio_beta: Decimal

@dataclass
class RiskAlert:
    """تنبيه المخاطر"""
    alert_id: str
    alert_type: AlertType
    level: RiskLevel
    message: str
    timestamp: datetime
    data: Dict[str, Any]
    is_acknowledged: bool = False

class RiskCacheManager:
    """مدير الذاكرة المؤقتة للمخاطر"""
    
    def __init__(self):
        self.position_cache = cachetools.TTLCache(maxsize=500, ttl=30)
        self.risk_cache = cachetools.TTLCache(maxsize=100, ttl=60)
        self.alert_cache = cachetools.TTLCache(maxsize=200, ttl=300)
    
    def cache_position_risk(self, position_id: str, risk_data: Dict) -> None:
        """تخزين بيانات مخاطر المركز"""
        self.position_cache[position_id] = risk_data
    
    def get_position_risk(self, position_id: str) -> Optional[Dict]:
        """الحصول على بيانات مخاطر المركز المخبأة"""
        return self.position_cache.get(position_id)
    
    def cache_portfolio_risk(self, portfolio_id: str, risk_metrics: RiskMetrics) -> None:
        """تخزين مقاييس مخاطر المحفظة"""
        self.risk_cache[portfolio_id] = risk_metrics
    
    def get_portfolio_risk(self, portfolio_id: str) -> Optional[RiskMetrics]:
        """الحصول على مقاييس مخاطر المحفظة المخبأة"""
        return self.risk_cache.get(portfolio_id)

class RiskAnalyzer:
    """محلل المخاطر المتقدم"""
    
    def __init__(self):
        self.risk_history = []
        self.volatility_window = 20  # نافذة التقلب
    
    def calculate_position_risk(self, position: Dict, market_data: Dict) -> Dict[str, Any]:
        """حساب مخاطر المركز الفردي"""
        try:
            position_size = Decimal(str(position.get('size', 0)))
            entry_price = Decimal(str(position.get('entry_price', 0)))
            current_price = Decimal(str(market_data.get('price', 0)))
            leverage = Decimal(str(position.get('leverage', 1)))
            
            # حساب القيمة الحالية
            current_value = position_size * current_price
            
            # حساب الربح/الخسارة
            unrealized_pnl = (current_price - entry_price) * position_size
            if position.get('side', 'long').lower() == 'short':
                unrealized_pnl = -unrealized_pnl
            
            # حساب نسبة الربح/الخسارة
            pnl_percentage = (unrealized_pnl / (position_size * entry_price)) * 100
            
            # حساب مسافة التصفية
            liquidation_distance = self._calculate_liquidation_distance(
                position, current_price, leverage
            )
            
            # حساب درجة المخاطرة
            risk_score = self._calculate_position_risk_score(
                position_size, leverage, pnl_percentage, liquidation_distance
            )
            
            return {
                'position_id': position.get('id'),
                'symbol': position.get('symbol'),
                'current_value': float(current_value),
                'unrealized_pnl': float(unrealized_pnl),
                'pnl_percentage': float(pnl_percentage),
                'liquidation_distance': float(liquidation_distance),
                'risk_score': float(risk_score),
                'leverage': float(leverage),
                'margin_usage': float(self._calculate_margin_usage(position, current_value)),
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"خطأ في حساب مخاطر المركز: {e}")
            return {}
    
    def _calculate_liquidation_distance(self, position: Dict, current_price: Decimal, 
                                      leverage: Decimal) -> Decimal:
        """حساب مسافة سعر التصفية"""
        try:
            entry_price = Decimal(str(position.get('entry_price', 0)))
            side = position.get('side', 'long').lower()
            
            if side == 'long':
                liquidation_price = entry_price * (1 - 1/leverage)
                distance = ((current_price - liquidation_price) / current_price) * 100
            else:
                liquidation_price = entry_price * (1 + 1/leverage)
                distance = ((liquidation_price - current_price) / current_price) * 100
            
            return max(distance, Decimal('0'))
        except:
            return Decimal('0')
    
    def _calculate_margin_usage(self, position: Dict, current_value: Decimal) -> Decimal:
        """حساب استخدام الهامش"""
        try:
            position_size = Decimal(str(position.get('size', 0)))
            entry_price = Decimal(str(position.get('entry_price', 0)))
            leverage = Decimal(str(position.get('leverage', 1)))
            
            initial_margin = (position_size * entry_price) / leverage
            margin_usage = (current_value / initial_margin) * 100
            
            return margin_usage
        except:
            return Decimal('0')
    
    def _calculate_position_risk_score(self, position_size: Decimal, leverage: Decimal,
                                     pnl_percentage: Decimal, liquidation_distance: Decimal) -> Decimal:
        """حساب درجة مخاطر المركز"""
        try:
            # عوامل المخاطرة (0-1)
            size_factor = min(position_size / Decimal('100000'), Decimal('1'))  # حجم المركز
            leverage_factor = min(leverage / Decimal('20'), Decimal('1'))  # الرافعة
            pnl_factor = min(abs(pnl_percentage) / Decimal('50'), Decimal('1'))  # الربح/الخسارة
            liquidation_factor = max(Decimal('1') - (liquidation_distance / Decimal('50')), Decimal('0'))  # مسافة التصفية
            
            # وزن العوامل
            weights = {
                'size': Decimal('0.3'),
                'leverage': Decimal('0.3'),
                'pnl': Decimal('0.2'),
                'liquidation': Decimal('0.2')
            }
            
            # حساب الدرجة النهائية (0-100)
            risk_score = (
                size_factor * weights['size'] +
                leverage_factor * weights['leverage'] +
                pnl_factor * weights['pnl'] +
                liquidation_factor * weights['liquidation']
            ) * 100
            
            return min(risk_score, Decimal('100'))
        except:
            return Decimal('0')
    
    def analyze_portfolio_risk(self, positions: List[Dict], 
                             market_data: Dict) -> RiskMetrics:
        """تحليل مخاطر المحفظة الشاملة"""
        try:
            total_exposure = Decimal('0')
            max_position_size = Decimal('0')
            total_leverage = Decimal('0')
            daily_pnl = Decimal('0')
            position_risks = []
            
            for position in positions:
                position_risk = self.calculate_position_risk(position, market_data)
                position_value = Decimal(str(position_risk.get('current_value', 0)))
                
                total_exposure += position_value
                max_position_size = max(max_position_size, position_value)
                total_leverage += Decimal(str(position_risk.get('leverage', 0)))
                daily_pnl += Decimal(str(position_risk.get('unrealized_pnl', 0)))
                position_risks.append(position_risk.get('risk_score', 0))
            
            # حساب متوسط الرافعة
            avg_leverage = total_leverage / len(positions) if positions else Decimal('0')
            
            # حساب أقصى انخفاض
            max_drawdown = self._calculate_max_drawdown(position_risks)
            
            # حساب درجة التقلب
            volatility_score = self._calculate_volatility_score(position_risks)
            
            # حساب درجة المخاطرة الإجمالية
            overall_risk_score = self._calculate_overall_risk_score(
                total_exposure, avg_leverage, max_drawdown, volatility_score
            )
            
            # حساب بيتا المحفظة (التزامن مع السوق)
            portfolio_beta = self._calculate_portfolio_beta(positions, market_data)
            
            return RiskMetrics(
                total_exposure=total_exposure,
                max_position_size=max_position_size,
                current_leverage=avg_leverage,
                daily_pnl=daily_pnl,
                max_drawdown=max_drawdown,
                volatility_score=volatility_score,
                risk_score=overall_risk_score,
                portfolio_beta=portfolio_beta
            )
            
        except Exception as e:
            logger.error(f"خطأ في تحليل مخاطر المحفظة: {e}")
            return RiskMetrics(
                total_exposure=Decimal('0'),
                max_position_size=Decimal('0'),
                current_leverage=Decimal('0'),
                daily_pnl=Decimal('0'),
                max_drawdown=Decimal('0'),
                volatility_score=Decimal('0'),
                risk_score=Decimal('0'),
                portfolio_beta=Decimal('0')
            )
    
    def _calculate_max_drawdown(self, risk_scores: List[float]) -> Decimal:
        """حساب أقصى انخفاض"""
        try:
            if len(risk_scores) < 2:
                return Decimal('0')
            
            peak = risk_scores[0]
            max_dd = Decimal('0')
            
            for score in risk_scores[1:]:
                if score > peak:
                    peak = score
                dd = (peak - score) / peak
                max_dd = max(max_dd, Decimal(str(dd)))
            
            return max_dd * 100  # كنسبة مئوية
        except:
            return Decimal('0')
    
    def _calculate_volatility_score(self, risk_scores: List[float]) -> Decimal:
        """حساب درجة التقلب"""
        try:
            if len(risk_scores) < 2:
                return Decimal('0')
            
            volatility = statistics.stdev(risk_scores)
            return Decimal(str(volatility))
        except:
            return Decimal('0')
    
    def _calculate_overall_risk_score(self, exposure: Decimal, leverage: Decimal,
                                   drawdown: Decimal, volatility: Decimal) -> Decimal:
        """حساب درجة المخاطرة الإجمالية"""
        try:
            # تطبيع القيم
            exposure_score = min(exposure / Decimal('1000000'), Decimal('1'))
            leverage_score = min(leverage / Decimal('10'), Decimal('1'))
            drawdown_score = min(drawdown / Decimal('50'), Decimal('1'))
            volatility_score = min(volatility / Decimal('20'), Decimal('1'))
            
            # الأوزان
            weights = {
                'exposure': Decimal('0.4'),
                'leverage': Decimal('0.3'),
                'drawdown': Decimal('0.2'),
                'volatility': Decimal('0.1')
            }
            
            overall_score = (
                exposure_score * weights['exposure'] +
                leverage_score * weights['leverage'] +
                drawdown_score * weights['drawdown'] +
                volatility_score * weights['volatility']
            ) * 100
            
            return min(overall_score, Decimal('100'))
        except:
            return Decimal('0')
    
    def _calculate_portfolio_beta(self, positions: List[Dict], 
                                market_data: Dict) -> Decimal:
        """حساب بيتا المحفظة (حساسية اتجاه السوق)"""
        # تنفيذ مبسط - في الواقع يحتاج بيانات السوق التاريخية
        try:
            if not positions:
                return Decimal('1')
            
            total_beta = Decimal('0')
            for position in positions:
                # بيتا تقريبية بناءً على نوع الأصل
                symbol = position.get('symbol', '').upper()
                if 'BTC' in symbol:
                    beta = Decimal('1.2')
                elif 'ETH' in symbol:
                    beta = Decimal('1.1')
                else:
                    beta = Decimal('1.0')
                
                total_beta += beta
            
            return total_beta / len(positions)
        except:
            return Decimal('1')

class RiskMonitor:
    """مراقب المخاطر الآني"""
    
    def __init__(self):
        self.active_alerts = {}
        self.alert_history = []
        self.risk_analyzer = RiskAnalyzer()
        self.cache_manager = RiskCacheManager()
    
    async def monitor_position_risk(self, position: Dict, 
                                  market_data: Dict) -> List[RiskAlert]:
        """مراقبة مخاطر المركز وإنشاء التنبيهات"""
        alerts = []
        
        try:
            position_risk = self.risk_analyzer.calculate_position_risk(position, market_data)
            
            # فحص حجم المركز
            if self._check_position_size_risk(position, position_risk):
                alert = self._create_alert(
                    AlertType.POSITION_SIZE,
                    RiskLevel.MEDIUM,
                    f"حجم المركز كبير للرمز {position.get('symbol')}",
                    position_risk
                )
                alerts.append(alert)
            
            # فحص الرافعة المالية
            if self._check_leverage_risk(position, position_risk):
                alert = self._create_alert(
                    AlertType.LEVERAGE,
                    RiskLevel.HIGH,
                    f"الرافعة المالية مرتفعة للرمز {position.get('symbol')}",
                    position_risk
                )
                alerts.append(alert)
            
            # فحص مسافة التصفية
            if self._check_liquidation_risk(position_risk):
                alert = self._create_alert(
                    AlertType.LIQUIDATION,
                    RiskLevel.CRITICAL,
                    f"مسافة التصفية قريبة للرمز {position.get('symbol')}",
                    position_risk
                )
                alerts.append(alert)
            
            # تحديث التنبيهات النشطة
            for alert in alerts:
                self.active_alerts[alert.alert_id] = alert
                self.alert_history.append(alert)
            
            return alerts
            
        except Exception as e:
            logger.error(f"خطأ في مراقبة مخاطر المركز: {e}")
            return []
    
    def _check_position_size_risk(self, position: Dict, risk_data: Dict) -> bool:
        """فحص مخاطر حجم المركز"""
        position_size = Decimal(str(risk_data.get('current_value', 0)))
        max_allowed = Decimal(os.getenv('MAX_POSITION_SIZE', '10000'))
        
        return position_size > max_allowed
    
    def _check_leverage_risk(self, position: Dict, risk_data: Dict) -> bool:
        """فحص مخاطر الرافعة المالية"""
        leverage = Decimal(str(risk_data.get('leverage', 1)))
        max_leverage = Decimal(os.getenv('MAX_LEVERAGE', '10'))
        
        return leverage > max_leverage
    
    def _check_liquidation_risk(self, risk_data: Dict) -> bool:
        """فحص مخاطر التصفية الوشيكة"""
        liquidation_distance = Decimal(str(risk_data.get('liquidation_distance', 100)))
        
        return liquidation_distance < Decimal('5')  # أقل من 5%
    
    def _create_alert(self, alert_type: AlertType, level: RiskLevel, 
                     message: str, data: Dict) -> RiskAlert:
        """إنشاء تنبيه مخاطر جديد"""
        alert_id = f"alert_{alert_type.value}_{int(time.time())}"
        
        return RiskAlert(
            alert_id=alert_id,
            alert_type=alert_type,
            level=level,
            message=message,
            timestamp=datetime.now(),
            data=data
        )
    
    def get_active_alerts(self) -> List[RiskAlert]:
        """الحصول على التنبيهات النشطة"""
        return list(self.active_alerts.values())
    
    def acknowledge_alert(self, alert_id: str) -> bool:
        """التأشير على تنبيه كمقروء"""
        if alert_id in self.active_alerts:
            self.active_alerts[alert_id].is_acknowledged = True
            return True
        return False

class AdvancedRiskService:
    """
    خدمة إدارة المخاطر المتقدمة مع الحفاظ الكامل على التوافق
    """
    
    def __init__(self):
        self.risk_monitor = RiskMonitor()
        self.risk_analyzer = RiskAnalyzer()
        self.cache_manager = RiskCacheManager()
        self.setup_risk_config()
        logger.info("✅ تم تهيئة خدمة إدارة المخاطر المتقدمة")
    
    def setup_risk_config(self):
        """إعداد التكوين الآمن للمخاطر"""
        self.risk_config = {
            'max_position_size': Decimal(os.getenv('MAX_POSITION_SIZE', '10000')),
            'max_leverage': Decimal(os.getenv('MAX_LEVERAGE', '10')),
            'daily_loss_limit': Decimal(os.getenv('DAILY_LOSS_LIMIT', '1000')),
            'risk_check_interval': int(os.getenv('RISK_CHECK_INTERVAL', '60')),
            'enable_real_time_monitoring': os.getenv('ENABLE_RISK_MONITORING', 'true').lower() == 'true',
            'auto_risk_management': os.getenv('AUTO_RISK_MANAGEMENT', 'true').lower() == 'true'
        }
    
    async def validate_position(self, position_data: Dict, market_data: Dict) -> Dict:
        """التحقق من صحة المركز مع تحليلات المخاطر"""
        try:
            # حساب مخاطر المركز
            position_risk = self.risk_analyzer.calculate_position_risk(position_data, market_data)
            
            # فحص حدود المخاطر
            risk_checks = self._perform_risk_checks(position_data, position_risk)
            
            # مراقبة المخاطر الآنية
            alerts = await self.risk_monitor.monitor_position_risk(position_data, market_data)
            
            return {
                'is_valid': risk_checks['passed'],
                'risk_score': position_risk.get('risk_score', 0),
                'risk_level': self._get_risk_level(position_risk.get('risk_score', 0)),
                'checks': risk_checks,
                'alerts': [alert.__dict__ for alert in alerts],
                'position_analysis': position_risk,
                'timestamp': datetime.now().isoformat(),
                'success': True
            }
            
        except Exception as e:
            logger.error(f"❌ خطأ في التحقق من صحة المركز: {e}")
            return {
                'is_valid': False,
                'error': str(e),
                'success': False
            }
    
    def _perform_risk_checks(self, position: Dict, risk_data: Dict) -> Dict:
        """إجراء فحوصات المخاطر"""
        checks = {
            'position_size': {'passed': True, 'message': ''},
            'leverage': {'passed': True, 'message': ''},
            'liquidation_risk': {'passed': True, 'message': ''},
            'margin_usage': {'passed': True, 'message': ''}
        }
        
        # فحص حجم المركز
        position_size = Decimal(str(risk_data.get('current_value', 0)))
        if position_size > self.risk_config['max_position_size']:
            checks['position_size'] = {
                'passed': False,
                'message': f"حجم المركز ({position_size}) يتجاوز الحد المسموح ({self.risk_config['max_position_size']})"
            }
        
        # فحص الرافعة المالية
        leverage = Decimal(str(risk_data.get('leverage', 1)))
        if leverage > self.risk_config['max_leverage']:
            checks['leverage'] = {
                'passed': False,
                'message': f"الرافعة ({leverage}) تتجاوز الحد المسموح ({self.risk_config['max_leverage']})"
            }
        
        # فحص مخاطر التصفية
        liquidation_distance = Decimal(str(risk_data.get('liquidation_distance', 100)))
        if liquidation_distance < Decimal('10'):
            checks['liquidation_risk'] = {
                'passed': False,
                'message': f"مسافة التصفية قريبة ({liquidation_distance}%)"
            }
        
        # فحص استخدام الهامش
        margin_usage = Decimal(str(risk_data.get('margin_usage', 0)))
        if margin_usage > Decimal('80'):
            checks['margin_usage'] = {
                'passed': False,
                'message': f"استخدام الهامش مرتفع ({margin_usage}%)"
            }
        
        # النتيجة الإجمالية
        checks['passed'] = all(check['passed'] for check in checks.values())
        
        return checks
    
    def _get_risk_level(self, risk_score: float) -> str:
        """تحديد مستوى المخاطرة"""
        if risk_score < 30:
            return "low"
        elif risk_score < 60:
            return "medium"
        elif risk_score < 80:
            return "high"
        else:
            return "critical"
    
    async def analyze_portfolio_risk(self, positions: List[Dict], 
                                   market_data: Dict) -> Dict:
        """تحليل مخاطر المحفظة الشاملة"""
        try:
            # استخدام الذاكرة المؤقتة إذا متاحة
            portfolio_id = "current_portfolio"
            cached_risk = self.cache_manager.get_portfolio_risk(portfolio_id)
            
            if cached_risk:
                logger.debug("📊 استخدام مخاطر المحفظة المخبأة")
                risk_metrics = cached_risk
            else:
                risk_metrics = self.risk_analyzer.analyze_portfolio_risk(positions, market_data)
                self.cache_manager.cache_portfolio_risk(portfolio_id, risk_metrics)
            
            # إنشاء تقرير المخاطر
            risk_report = {
                'total_exposure': float(risk_metrics.total_exposure),
                'max_position_size': float(risk_metrics.max_position_size),
                'average_leverage': float(risk_metrics.current_leverage),
                'daily_pnl': float(risk_metrics.daily_pnl),
                'max_drawdown': float(risk_metrics.max_drawdown),
                'volatility_score': float(risk_metrics.volatility_score),
                'overall_risk_score': float(risk_metrics.risk_score),
                'portfolio_beta': float(risk_metrics.portfolio_beta),
                'risk_level': self._get_risk_level(float(risk_metrics.risk_score)),
                'timestamp': datetime.now().isoformat(),
                'success': True
            }
            
            return risk_report
            
        except Exception as e:
            logger.error(f"❌ خطأ في تحليل مخاطر المحفظة: {e}")
            return {
                'error': str(e),
                'success': False
            }
    
    async def get_risk_alerts(self) -> Dict:
        """الحصول على تنبيهات المخاطر الحالية"""
        try:
            active_alerts = self.risk_monitor.get_active_alerts()
            
            return {
                'active_alerts': [alert.__dict__ for alert in active_alerts],
                'total_alerts': len(active_alerts),
                'critical_alerts': len([a for a in active_alerts if a.level == RiskLevel.CRITICAL]),
                'timestamp': datetime.now().isoformat(),
                'success': True
            }
        except Exception as e:
            logger.error(f"❌ خطأ في الحصول على تنبيهات المخاطر: {e}")
            return {
                'error': str(e),
                'success': False
            }
    
    async def acknowledge_risk_alert(self, alert_id: str) -> Dict:
        """التأشير على تنبيه مخاطر كمقروء"""
        try:
            success = self.risk_monitor.acknowledge_alert(alert_id)
            
            return {
                'alert_id': alert_id,
                'acknowledged': success,
                'timestamp': datetime.now().isoformat(),
                'success': success
            }
        except Exception as e:
            logger.error(f"❌ خطأ في التأشير على التنبيه: {e}")
            return {
                'error': str(e),
                'success': False
            }

    # === دوال التوافق للحفاظ على الكود الحالي ===
    
    async def check_position_risk(self, position: Dict, market_data: Dict) -> Dict:
        """دالة التوافق - اسم بديل لـ validate_position"""
        return await self.validate_position(position, market_data)
    
    async def get_portfolio_analysis(self, positions: List[Dict], market_data: Dict) -> Dict:
        """دالة التوافق - اسم بديل لـ analyze_portfolio_risk"""
        return await self.analyze_portfolio_risk(positions, market_data)

# نسخة عالمية للحفاظ على التوافق
risk_service = AdvancedRiskService()

# دوال التوافق العالمية
async def validate_position_risk(position: Dict, market_data: Dict) -> Dict:
    """دالة التوافق العالمية"""
    return await risk_service.validate_position(position, market_data)

async def analyze_portfolio_risk(positions: List[Dict], market_data: Dict) -> Dict:
    """دالة التوافق العالمية"""
    return await risk_service.analyze_portfolio_risk(positions, market_data)

if __name__ == "__main__":
    # اختبار خدمة المخاطر المحسنة
    async def test_enhanced_risk_service():
        print("🧪 اختبار خدمة إدارة المخاطر المحسنة...")
        
        # بيانات اختبار
        test_position = {
            'id': 'test_1',
            'symbol': 'BTCUSDT',
            'size': 1.0,
            'entry_price': 50000,
            'side': 'long',
            'leverage': 5
        }
        
        test_market_data = {
            'price': 51000,
            'volume': 1000000,
            'change_24h': 2.5
        }
        
        test_positions = [test_position]
        
        # اختبار التحقق من المركز
        position_validation = await risk_service.validate_position(test_position, test_market_data)
        print("التحقق من المركز:", position_validation)
        
        # اختبار تحليل المحفظة
        portfolio_analysis = await risk_service.analyze_portfolio_risk(test_positions, test_market_data)
        print("تحليل المحفظة:", portfolio_analysis)
        
        # اختبار التنبيهات
        risk_alerts = await risk_service.get_risk_alerts()
        print("تنبيهات المخاطر:", risk_alerts)
    
    asyncio.run(test_enhanced_risk_service())
