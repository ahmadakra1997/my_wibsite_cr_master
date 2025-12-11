import CryptoJS from 'crypto-js';

class EncryptionService {
  constructor() {
    // مفتاح التشفير الرئيسي - في بيئة الإنتاج سيتم تخزينه بشكل آمن
    this.encryptionKey = process.env.REACT_APP_ENCRYPTION_KEY || 'akraa-trade-secure-key-2024';
  }

  // تشفير البيانات باستخدام AES-256
  encryptData(data) {
    try {
      const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), this.encryptionKey).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('فشل في تشفير البيانات');
    }
  }

  // فك تشفير البيانات
  decryptData(encryptedData) {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      const decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('فشل في فك تشفير البيانات');
    }
  }

  // تشفير مفاتيح API بشكل منفصل
  encryptApiKeys(apiKeys) {
    const keysToEncrypt = {
      mexc: {
        apiKey: apiKeys.mexcApiKey,
        secret: apiKeys.mexcSecret
      },
      binance: {
        apiKey: apiKeys.binanceApiKey,
        secret: apiKeys.binanceSecret
      }
    };

    return this.encryptData(keysToEncrypt);
  }
}

export default new EncryptionService();