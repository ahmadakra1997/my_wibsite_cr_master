"""
ملف الإعدادات الآمن والمطور - الإصدار 2.0
يحافظ على جميع الوظائف مع تعزيز الأمان والأداء
"""

import os
import logging
from typing import Dict, Any
from pathlib import Path

# إعداد المسجل
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SecureConfig:
    """
    فئة الإعدادات الآمنة مع الحفاظ على التوافق الكامل
    """
    
    def __init__(self):
        self._validate_environment()
        self._setup_defaults()
    
    def _validate_environment(self) -> None:
        """التحقق من وجود المتغيرات البيئية الضرورية"""
        required_vars = ['SECRET_KEY']
        missing_vars = [var for var in required_vars if not os.getenv(var)]
        
        if missing_vars:
            logger.warning(f"⚠️  متغيرات بيئية مفقودة: {missing_vars}")
            logger.info("💡 استخدم ملف .env للتطوير المحلي")
    
    def _setup_defaults(self) -> None:
        """إعداد القيم الافتراضية الآمنة"""
        # === إعدادات الأمان الأساسية ===
        self.SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
        self.DEBUG = os.getenv('DEBUG', 'false').lower() == 'true'
        
        # === إعدادات قاعدة البيانات ===
        self.DATABASE_CONFIG = {
            'url': os.getenv('DATABASE_URL', 'sqlite:///trading.db'),
            'pool_size': int(os.getenv('DB_POOL_SIZE', '10')),
            'max_overflow': int(os.getenv('DB_MAX_OVERFLOW', '20')),
            'echo': os.getenv('DB_ECHO', 'false').lower() == 'true'
        }
        
        # === إعدادات منصات التداول (محسنة) ===
        self.EXCHANGES = {
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
        
        # === إعدادات إدارة المخاطر (محسنة) ===
        self.RISK_MANAGEMENT = {
            'max_position_size': float(os.getenv('MAX_POSITION_SIZE', '1000')),
            'daily_loss_limit': float(os.getenv('DAILY_LOSS_LIMIT', '500')),
            'max_leverage': int(os.getenv('MAX_LEVERAGE', '10')),
            'auto_risk_management': os.getenv('AUTO_RISK_MANAGEMENT', 'true').lower() == 'true',
            'risk_check_interval': int(os.getenv('RISK_CHECK_INTERVAL', '60'))
        }
        
        # === إعدادات الذكاء الاصطناعي ===
        self.AI_CONFIG = {
            'model_path': os.getenv('AI_MODEL_PATH', 'models/trading_model.h5'),
            'confidence_threshold': float(os.getenv('AI_CONFIDENCE_THRESHOLD', '0.7')),
            'retrain_interval': int(os.getenv('AI_RETRAIN_INTERVAL', '24')),
            'prediction_timeout': int(os.getenv('AI_PREDICTION_TIMEOUT', '10'))
        }
        
        # === إعدادات الأداء والذاكرة ===
        self.PERFORMANCE = {
            'cache_timeout': int(os.getenv('CACHE_TIMEOUT', '300')),
            'max_workers': int(os.getenv('MAX_WORKERS', '5')),
            'request_timeout': int(os.getenv('REQUEST_TIMEOUT', '30')),
            'rate_limit_per_minute': int(os.getenv('RATE_LIMIT_PER_MINUTE', '60')),
            'enable_compression': os.getenv('ENABLE_COMPRESSION', 'true').lower() == 'true'
        }
        
        # === إعدادات المراقبة والتحليل ===
        self.MONITORING = {
            'enable_health_checks': os.getenv('ENABLE_HEALTH_CHECKS', 'true').lower() == 'true',
            'log_level': os.getenv('LOG_LEVEL', 'INFO'),
            'metrics_port': int(os.getenv('METRICS_PORT', '9090')),
            'enable_tracing': os.getenv('ENABLE_TRACING', 'false').lower() == 'true'
        }
    
    def _get_binance_url(self) -> str:
        """الحصول على URL بينانس المناسب"""
        testnet = os.getenv('BINANCE_TESTNET', 'true').lower() == 'true'
        return 'https://testnet.binance.vision' if testnet else 'https://api.binance.com'
    
    def _get_bybit_url(self) -> str:
        """الحصول على URL بايبت المناسب"""
        testnet = os.getenv('BYBIT_TESTNET', 'true').lower() == 'true'
        return 'https://api-testnet.bybit.com' if testnet else 'https://api.bybit.com'
    
    def validate_config(self) -> Dict[str, Any]:
        """
        التحقق من صحة الإعدادات وإرجاع تقرير
        يحافظ على التوافق مع الكود الحالي
        """
        report = {
            'valid': True,
            'warnings': [],
            'errors': []
        }
        
        # التحقق من المفاتيح الأساسية
        if not self.SECRET_KEY or self.SECRET_KEY == 'dev-secret-key-change-in-production':
            report['warnings'].append('SECRET_KEY يستخدم القيمة الافتراضية - غير آمن للإنتاج')
        
        # التحقق من اتصالات المنصات
        for exchange, config in self.EXCHANGES.items():
            if not config['api_key']:
                report['warnings'].append(f'{exchange}: مفتاح API غير مضبوط')
            if not config['api_secret']:
                report['warnings'].append(f'{exchange}: سر API غير مضبوط')
        
        # التحقق من إعدادات المخاطر
        if self.RISK_MANAGEMENT['max_position_size'] <= 0:
            report['errors'].append('MAX_POSITION_SIZE يجب أن يكون أكبر من الصفر')
        
        report['valid'] = len(report['errors']) == 0
        return report
    
    def get_exchange_config(self, exchange_name: str) -> Dict[str, Any]:
        """الحصول على إعدادات منصة محددة - للتوافق مع الكود الحالي"""
        return self.EXCHANGES.get(exchange_name, {})
    
    def get_database_url(self) -> str:
        """الحصول على رابط قاعدة البيانات - للتوافق مع الكود الحالي"""
        return self.DATABASE_CONFIG['url']

# نسخة عالمية للحفاظ على التوافق
config = SecureConfig()

# دوال التوافق للكود الحالي
def get_config():
    """دالة التوافق للحفاظ على الكود الحالي"""
    return config

def get_exchange_config(exchange_name: str):
    """دالة التوافق للحفاظ على الكود الحالي"""
    return config.get_exchange_config(exchange_name)

if __name__ == "__main__":
    # اختبار الإعدادات عند التشغيل المباشر
    validation_report = config.validate_config()
    
    print("🔍 تقرير التحقق من الإعدادات:")
    print(f"✅ الحالة: {'صحيحة' if validation_report['valid'] else 'غير صحيحة'}")
    
    if validation_report['warnings']:
        print("⚠️  تحذيرات:")
        for warning in validation_report['warnings']:
            print(f"   • {warning}")
    
    if validation_report['errors']:
        print("❌ أخطاء:")
        for error in validation_report['errors']:
            print(f"   • {error}")
    
    if validation_report['valid']:
        print("🎯 الإعدادات جاهزة للاستخدام!")
