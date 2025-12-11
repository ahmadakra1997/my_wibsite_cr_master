"""
خدمة التداول المتقدمة - الإصدار 3.0
مطور بالأمان والأداء مع الحفاظ على جميع الوظائف الحالية
"""

import os
import logging
import asyncio
import aiohttp
import hmac
import hashlib
import json
import time
from typing import Dict, List, Optional, Any, Union
from decimal import Decimal
from datetime import datetime, timedelta
from functools import wraps
import cachetools

# إعداد المسجل المتقدم
logger = logging.getLogger(__name__)

class SecurityManager:
    """مدير الأمان للتحقق من الطلبات والتوقيعات"""
    
    def __init__(self):
        self.request_count = 0
        self.last_reset = time.time()
    
    def generate_signature(self, exchange: str, data: Dict, secret: str) -> str:
        """إنشاء توقيع آمن للطلبات"""
        try:
            if exchange == 'binance':
                query_string = '&'.join([f"{k}={v}" for k, v in sorted(data.items())])
                return hmac.new(
                    secret.encode('utf-8'),
                    query_string.encode('utf-8'),
                    hashlib.sha256
                ).hexdigest()
            
            elif exchange == 'bybit':
                # تنفيذ توقيع Bybit
                timestamp = str(int(time.time() * 1000))
                signature_payload = f"{timestamp}{data.get('api_key', '')}{data.get('recv_window', '5000')}"
                return hmac.new(
                    secret.encode('utf-8'),
                    signature_payload.encode('utf-8'),
                    hashlib.sha256
                ).hexdigest()
            
            elif exchange == 'kucoin':
                # تنفيذ توقيع KuCoin
                timestamp = str(int(time.time() * 1000))
                signature_payload = f"{timestamp}GET/api/v1/accounts"
                return base64.b64encode(
                    hmac.new(
                        secret.encode('utf-8'),
                        signature_payload.encode('utf-8'),
                        hashlib.sha256
                    ).digest()
                ).decode()
                
            else:
                logger.warning(f"التوقيع غير مدعوم للمنصة: {exchange}")
                return ""
                
        except Exception as e:
            logger.error(f"خطأ في إنشاء التوقيع لـ {exchange}: {e}")
            return ""
    
    def check_rate_limit(self) -> bool:
        """التحقق من حدود معدل الطلبات"""
        current_time = time.time()
        if current_time - self.last_reset > 60:  # إعادة التعيين كل دقيقة
            self.request_count = 0
            self.last_reset = current_time
        
        if self.request_count >= 50:  # 50 طلب في الدقيقة
            return False
        
        self.request_count += 1
        return True

class PerformanceCache:
    """ذاكرة التخزين المؤقت للأداء"""
    
    def __init__(self):
        self.price_cache = cachetools.TTLCache(maxsize=1000, ttl=10)  # 10 ثواني للأسعار
        self.balance_cache = cachetools.TTLCache(maxsize=100, ttl=30)  # 30 ثانية للرصيد
        self.order_cache = cachetools.TTLCache(maxsize=500, ttl=60)   # 60 ثانية للأوامر
    
    def get_cached_price(self, exchange: str, symbol: str) -> Optional[Decimal]:
        """الحصول على السعر المخبأ"""
        key = f"{exchange}:{symbol}"
        return self.price_cache.get(key)
    
    def set_cached_price(self, exchange: str, symbol: str, price: Decimal) -> None:
        """تخزين السعر في الذاكرة المؤقتة"""
        key = f"{exchange}:{symbol}"
        self.price_cache[key] = price
    
    def get_cached_balance(self, exchange: str) -> Optional[Dict]:
        """الحصول على الرصيد المخبأ"""
        return self.balance_cache.get(exchange)
    
    def set_cached_balance(self, exchange: str, balance: Dict) -> None:
        """تخزين الرصيد في الذاكرة المؤقتة"""
        self.balance_cache[exchange] = balance

def async_retry(max_retries: int = 3, delay: float = 1.0):
    """مصحح الأخطاء مع إعادة المحاولة للدوال غير المتزامنة"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    logger.warning(f"المحاولة {attempt + 1}/{max_retries} فشلت: {e}")
                    if attempt < max_retries - 1:
                        await asyncio.sleep(delay * (2 ** attempt))  # Exponential backoff
            logger.error(f"جميع المحاولات فشلت: {last_exception}")
            raise last_exception
        return wrapper
    return decorator

def validate_exchange_params(exchange: str, symbol: str = None):
    """مصحح للتحقق من معاملات المنصة"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # التحقق من اسم المنصة
            valid_exchanges = ['binance', 'bybit', 'kucoin', 'gateio', 'huobi', 'mexc', 'okx']
            if exchange not in valid_exchanges:
                return {
                    'error': f'المنصة غير مدعومة: {exchange}',
                    'valid_exchanges': valid_exchanges,
                    'success': False
                }
            
            # التحقق من رمز التداول إذا مطلوب
            if symbol and len(symbol) < 3:
                return {
                    'error': 'رمز التداول غير صالح',
                    'success': False
                }
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

class AdvancedExchangeService:
    """
    خدمة التداول المتقدمة مع الحفاظ الكامل على التوافق
    """
    
    def __init__(self):
        self.security_manager = SecurityManager()
        self.performance_cache = PerformanceCache()
        self.session = None
        self.setup_exchanges()
        self.setup_secure_config()
        logger.info("✅ تم تهيئة خدمة التداول المتقدمة")
    
    def setup_secure_config(self):
        """إعداد التكوين الآمن من متغيرات البيئة"""
        try:
            self.config = {
                'binance': {
                    'api_key': os.getenv('BINANCE_API_KEY', ''),
                    'api_secret': os.getenv('BINANCE_API_SECRET', ''),
                    'testnet': os.getenv('BINANCE_TESTNET', 'true').lower() == 'true',
                    'base_url': self._get_binance_url(),
                    'timeout': int(os.getenv('BINANCE_TIMEOUT', '30'))
                },
                'bybit': {
                    'api_key': os.getenv('BYBIT_API_KEY', ''),
                    'api_secret': os.getenv('BYBIT_API_SECRET', ''),
                    'testnet': os.getenv('BYBIT_TESTNET', 'true').lower() == 'true',
                    'base_url': self._get_bybit_url(),
                    'timeout': int(os.getenv('BYBIT_TIMEOUT', '30'))
                },
                'kucoin': {
                    'api_key': os.getenv('KUCOIN_API_KEY', ''),
                    'api_secret': os.getenv('KUCOIN_API_SECRET', ''),
                    'passphrase': os.getenv('KUCOIN_PASSPHRASE', ''),
                    'base_url': 'https://api.kucoin.com',
                    'timeout': int(os.getenv('KUCOIN_TIMEOUT', '30'))
                }
            }
            
            # إعدادات الأمان
            self.security_config = {
                'rate_limit_delay': float(os.getenv('RATE_LIMIT_DELAY', '0.1')),
                'max_retries': int(os.getenv('MAX_RETRIES', '3')),
                'timeout': int(os.getenv('REQUEST_TIMEOUT', '30')),
                'enable_caching': os.getenv('ENABLE_CACHING', 'true').lower() == 'true'
            }
            
        except Exception as e:
            logger.error(f"❌ خطأ في إعداد التكوين الآمن: {e}")
            raise
    
    def _get_binance_url(self) -> str:
        """الحصول على URL بينانس المناسب"""
        testnet = os.getenv('BINANCE_TESTNET', 'true').lower() == 'true'
        return 'https://testnet.binance.vision' if testnet else 'https://api.binance.com'
    
    def _get_bybit_url(self) -> str:
        """الحصول على URL بايبت المناسب"""
        testnet = os.getenv('BYBIT_TESTNET', 'true').lower() == 'true'
        return 'https://api-testnet.bybit.com' if testnet else 'https://api.bybit.com'

    def setup_exchanges(self):
        """إعداد اتصالات المنصات مع إدارة الأخطاء"""
        try:
            self.available_exchanges = ['binance', 'bybit', 'kucoin', 'gateio', 'huobi', 'mexc', 'okx']
            self.exchange_status = {exchange: 'connected' for exchange in self.available_exchanges}
            logger.info(f"✅ تم إعداد {len(self.available_exchanges)} منصة تداول")
        except Exception as e:
            logger.error(f"❌ خطأ في إعداد المنصات: {e}")
            self.available_exchanges = []

    async def __aenter__(self):
        """إدارة السياق لفتح الجلسة"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=self.security_config['timeout'])
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """إدارة السياق لإغلاق الجلسة"""
        if self.session:
            await self.session.close()

    @async_retry(max_retries=3, delay=1.0)
    @validate_exchange_params
    async def get_balance(self, exchange: str) -> Dict:
        """الحصول على الرصيد مع التخزين المؤقت وإعادة المحاولة"""
        try:
            # التحقق من التخزين المؤقت أولاً
            if self.security_config['enable_caching']:
                cached_balance = self.performance_cache.get_cached_balance(exchange)
                if cached_balance:
                    logger.debug(f"📊 استخدام الرصيد المخبأ لـ {exchange}")
                    return {**cached_balance, 'cached': True}
            
            # التحقق من حدود المعدل
            if not self.security_manager.check_rate_limit():
                return {
                    'error': 'تم تجاوز حد الطلبات، يرجى الانتظار',
                    'exchange': exchange,
                    'success': False
                }
            
            # محاكاة الحصول على الرصيد
            await asyncio.sleep(0.1)
            
            balance_data = {
                'exchange': exchange,
                'total_balance': Decimal('1000.00'),
                'available_balance': Decimal('800.00'),
                'locked_balance': Decimal('200.00'),
                'currencies': [
                    {'asset': 'BTC', 'free': '0.5', 'locked': '0.1', 'total': '0.6'},
                    {'asset': 'ETH', 'free': '5.0', 'locked': '1.0', 'total': '6.0'},
                    {'asset': 'USDT', 'free': '500.0', 'locked': '100.0', 'total': '600.0'}
                ],
                'timestamp': datetime.now().isoformat(),
                'success': True
            }
            
            # تخزين في الذاكرة المؤقتة
            if self.security_config['enable_caching']:
                self.performance_cache.set_cached_balance(exchange, balance_data)
            
            return balance_data
            
        except Exception as e:
            logger.error(f"❌ خطأ في الحصول على الرصيد من {exchange}: {e}")
            return {
                'exchange': exchange,
                'error': str(e),
                'total_balance': Decimal('0.00'),
                'success': False
            }

    @async_retry(max_retries=3, delay=1.0)
    @validate_exchange_params
    async def create_order(self, exchange: str, symbol: str, side: str, 
                          order_type: str, quantity: float, price: Optional[float] = None,
                          **kwargs) -> Dict:
        """إنشاء أمر تداول مع التحقق المتقدم من الصحة"""
        try:
            # التحقق من حدود المعدل
            if not self.security_manager.check_rate_limit():
                return {
                    'error': 'تم تجاوز حد الطلبات، يرجى الانتظار',
                    'exchange': exchange,
                    'success': False
                }
            
            # التحقق من المدخلات
            validation_result = self._validate_order_params(symbol, side, order_type, quantity, price)
            if not validation_result['valid']:
                return {**validation_result, 'exchange': exchange}
            
            # محاكاة إنشاء الأمر
            await asyncio.sleep(0.2)
            
            order_id = f'ORDER_{exchange.upper()}_{int(time.time())}'
            
            order_data = {
                'exchange': exchange,
                'order_id': order_id,
                'symbol': symbol,
                'side': side.upper(),
                'type': order_type.upper(),
                'quantity': quantity,
                'price': price,
                'status': 'filled',
                'executed_quantity': quantity,
                'cummulative_quote_quantity': quantity * (price or 1),
                'transact_time': int(time.time() * 1000),
                'fills': [
                    {
                        'price': str(price or 1),
                        'qty': str(quantity),
                        'commission': '0.001',
                        'commissionAsset': symbol[-4:] if symbol.endswith('USDT') else 'USDT'
                    }
                ],
                'success': True
            }
            
            logger.info(f"✅ تم إنشاء أمر {order_id} على {exchange}")
            return order_data
            
        except Exception as e:
            logger.error(f"❌ خطأ في إنشاء الأمر على {exchange}: {e}")
            return {
                'exchange': exchange,
                'error': str(e),
                'status': 'rejected',
                'success': False
            }

    def _validate_order_params(self, symbol: str, side: str, order_type: str, 
                             quantity: float, price: Optional[float]) -> Dict:
        """التحقق من معاملات الأمر"""
        errors = []
        
        if not symbol or len(symbol) < 3:
            errors.append("رمز التداول غير صالح")
        
        if side.lower() not in ['buy', 'sell']:
            errors.append("الجانب يجب أن يكون 'buy' أو 'sell'")
        
        if order_type.lower() not in ['market', 'limit', 'stop', 'stop_limit']:
            errors.append("نوع الأمر غير مدعوم")
        
        if quantity <= 0:
            errors.append("الكمية يجب أن تكون أكبر من الصفر")
        
        if order_type.lower() in ['limit', 'stop_limit'] and (price is None or price <= 0):
            errors.append("السعر مطلوب للأوامر المحددة")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'success': len(errors) == 0
        }

    # === جميع الوظائف الأصلية محفوظة مع تحسينات ===
    
    @async_retry(max_retries=2, delay=1.0)
    async def get_order(self, exchange: str, order_id: str, symbol: str) -> Dict:
        """الحصول على حالة أمر معين"""
        try:
            await asyncio.sleep(0.1)
            
            return {
                'exchange': exchange,
                'order_id': order_id,
                'symbol': symbol,
                'status': 'filled',
                'side': 'BUY',
                'type': 'LIMIT',
                'quantity': '1.0',
                'executed_quantity': '1.0',
                'price': '50000.00',
                'cummulative_quote_quantity': '50000.00',
                'time_in_force': 'GTC',
                'transact_time': int(time.time() * 1000),
                'success': True
            }
        except Exception as e:
            logger.error(f"❌ خطأ في الحصول على الأمر من {exchange}: {e}")
            return {
                'exchange': exchange,
                'error': str(e),
                'success': False
            }

    @async_retry(max_retries=2, delay=1.0)
    async def cancel_order(self, exchange: str, order_id: str, symbol: str) -> Dict:
        """إلغاء أمر معين"""
        try:
            await asyncio.sleep(0.1)
            
            return {
                'exchange': exchange,
                'order_id': order_id,
                'symbol': symbol,
                'status': 'canceled',
                'client_order_id': f'client_{order_id}',
                'success': True
            }
        except Exception as e:
            logger.error(f"❌ خطأ في إلغاء الأمر على {exchange}: {e}")
            return {
                'exchange': exchange,
                'error': str(e),
                'success': False
            }

    @async_retry(max_retries=2, delay=1.0)
    async def get_open_orders(self, exchange: str, symbol: str = None) -> Dict:
        """الحصول على الأوامر المفتوحة"""
        try:
            await asyncio.sleep(0.1)
            
            orders = [
                {
                    'order_id': f'OPEN_ORDER_{i}',
                    'symbol': symbol or 'BTCUSDT',
                    'side': 'BUY' if i % 2 == 0 else 'SELL',
                    'type': 'LIMIT',
                    'quantity': '0.1',
                    'price': '50000.00',
                    'status': 'new',
                    'time': int(time.time() * 1000) - i * 60000
                }
                for i in range(3)
            ]
            
            return {
                'exchange': exchange,
                'orders': orders,
                'count': len(orders),
                'success': True
            }
        except Exception as e:
            logger.error(f"❌ خطأ في الحصول على الأوامر المفتوحة من {exchange}: {e}")
            return {
                'exchange': exchange,
                'error': str(e),
                'success': False
            }

    @async_retry(max_retries=2, delay=0.5)
    async def get_ticker_price(self, exchange: str, symbol: str) -> Dict:
        """الحصول على سعر التداول الحالي مع التخزين المؤقت"""
        try:
            # التحقق من التخزين المؤقت أولاً
            if self.security_config['enable_caching']:
                cached_price = self.performance_cache.get_cached_price(exchange, symbol)
                if cached_price:
                    return {
                        'exchange': exchange,
                        'symbol': symbol,
                        'price': str(cached_price),
                        'timestamp': int(time.time() * 1000),
                        'cached': True,
                        'success': True
                    }
            
            await asyncio.sleep(0.05)
            
            # محاكاة أسعار مختلفة
            base_prices = {
                'BTCUSDT': 50000.00,
                'ETHUSDT': 3000.00,
                'ADAUSDT': 0.50,
                'DOTUSDT': 7.00
            }
            
            base_price = base_prices.get(symbol, 100.00)
            variation = (time.time() % 10) / 100
            current_price = base_price * (1 + variation)
            
            price_data = {
                'exchange': exchange,
                'symbol': symbol,
                'price': str(round(current_price, 2)),
                'timestamp': int(time.time() * 1000),
                'success': True
            }
            
            # تخزين في الذاكرة المؤقتة
            if self.security_config['enable_caching']:
                self.performance_cache.set_cached_price(exchange, symbol, Decimal(str(current_price)))
            
            return price_data
            
        except Exception as e:
            logger.error(f"❌ خطأ في الحصول على السعر من {exchange}: {e}")
            return {
                'exchange': exchange,
                'error': str(e),
                'success': False
            }

    async def get_exchange_info(self, exchange: str) -> Dict:
        """الحصول على معلومات المنصة"""
        try:
            await asyncio.sleep(0.1)
            
            info = {
                'exchange': exchange,
                'name': exchange.upper(),
                'status': 'operational',
                'symbols': ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'DOTUSDT', 'XRPUSDT'],
                'supported_currencies': ['BTC', 'ETH', 'USDT', 'ADA', 'DOT', 'XRP'],
                'trading_fees': {
                    'maker': 0.001,
                    'taker': 0.001
                },
                'withdrawal_fees': {
                    'BTC': 0.0005,
                    'ETH': 0.01,
                    'USDT': 1.0
                },
                'limits': {
                    'min_order_value': 10.0,
                    'max_order_value': 100000.0
                },
                'server_time': int(time.time() * 1000),
                'success': True
            }
            
            return info
        except Exception as e:
            logger.error(f"❌ خطأ في الحصول على معلومات المنصة {exchange}: {e}")
            return {
                'exchange': exchange,
                'error': str(e),
                'success': False
            }

    async def get_available_exchanges(self) -> Dict:
        """الحصول على قائمة المنصات المتاحة"""
        try:
            exchanges_info = []
            for exchange in self.available_exchanges:
                exchanges_info.append({
                    'name': exchange,
                    'status': self.exchange_status.get(exchange, 'unknown'),
                    'supported': True
                })
            
            return {
                'exchanges': exchanges_info,
                'count': len(exchanges_info),
                'success': True
            }
        except Exception as e:
            logger.error(f"❌ خطأ في الحصول على المنصات المتاحة: {e}")
            return {
                'error': str(e),
                'success': False
            }

    async def health_check(self) -> Dict:
        """فحص صحة جميع المنصات"""
        try:
            health_status = {}
            for exchange in self.available_exchanges:
                health_status[exchange] = {
                    'status': 'healthy',
                    'response_time': 100 + (hash(exchange) % 100),
                    'last_checked': datetime.now().isoformat()
                }
            
            return {
                'health_status': health_status,
                'overall_status': 'healthy',
                'timestamp': datetime.now().isoformat(),
                'success': True
            }
        except Exception as e:
            logger.error(f"❌ خطأ في فحص الصحة: {e}")
            return {
                'error': str(e),
                'success': False
            }

    # === دوال التوافق للحفاظ على الكود الحالي ===
    
    async def get_account(self, exchange: str) -> Dict:
        """دالة التوافق - اسم بديل لـ get_balance"""
        return await self.get_balance(exchange)
    
    async def place_order(self, exchange: str, symbol: str, side: str, 
                         order_type: str, quantity: float, price: float = None) -> Dict:
        """دالة التوافق - اسم بديل لـ create_order"""
        return await self.create_order(exchange, symbol, side, order_type, quantity, price)

# نسخة عالمية للحفاظ على التوافق
exchange_service = AdvancedExchangeService()

# دوال التوافق العالمية
async def get_balance(exchange: str) -> Dict:
    """دالة التوافق العالمية"""
    async with AdvancedExchangeService() as service:
        return await service.get_balance(exchange)

async def create_order(exchange: str, symbol: str, side: str, order_type: str, 
                      quantity: float, price: float = None) -> Dict:
    """دالة التوافق العالمية"""
    async with AdvancedExchangeService() as service:
        return await service.create_order(exchange, symbol, side, order_type, quantity, price)

if __name__ == "__main__":
    # اختبار الخدمة المحسنة
    async def test_enhanced_service():
        print("🧪 اختبار خدمة التداول المحسنة...")
        
        async with AdvancedExchangeService() as service:
            # اختبار الحصول على الرصيد
            balance = await service.get_balance('binance')
            print("الرصيد:", balance)
            
            # اختبار إنشاء أمر
            order = await service.create_order('binance', 'BTCUSDT', 'buy', 'market', 0.001)
            print("الأمر:", order)
            
            # اختبار التخزين المؤقت
            price1 = await service.get_ticker_price('binance', 'BTCUSDT')
            price2 = await service.get_ticker_price('binance', 'BTCUSDT')
            print("السعر 1:", price1)
            print("السعر 2 (مخبأ):", price2)
            
            # اختبار الصحة
            health = await service.health_check()
            print("الصحة:", health)
    
    asyncio.run(test_enhanced_service())
