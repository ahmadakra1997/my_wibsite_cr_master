// AuthContext.jsx - النسخة المتقدمة والمؤمنة
import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { encryptionService } from '../services/EncryptionService';
import { cyberSecurityMonitor } from '../services/cyberSecurityMonitor';
import { quantumLogger } from '../services/QuantumLogger';
import './AuthContext.css';

// إنشاء Context المتقدم
const AuthContext = createContext();

/**
 * فئة خطأ مخصصة للمصادقة
 */
class AuthError extends Error {
  constructor(code, message, details = null, severity = 'medium') {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.details = details;
    this.severity = severity;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Hook لاستخدام نظام المصادقة المتقدم
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new AuthError('CONTEXT_ERROR', 'useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * مكون مزود المصادقة المتقدم
 */
export const AuthProvider = ({ children, config = {} }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    lastLogin: null,
    failedAttempts: 0,
    ipAddress: null,
    userAgent: null,
    securityLevel: 'high',
    sessionTimeout: null,
    riskScore: 0
  });

  const refreshIntervalRef = useRef(null);
  const sessionTimeoutRef = useRef(null);
  const securityCheckRef = useRef(null);

  // التهيئة المتقدمة
  const INIT_CONFIG = {
    sessionTimeout: 30 * 60 * 1000, // 30 دقيقة
    refreshInterval: 14 * 60 * 1000, // 14 دقيقة
    maxFailedAttempts: 5,
    securityCheckInterval: 5 * 60 * 1000, // 5 دقائق
    encryptionLevel: 'quantum',
    ...config
  };

  // مفاتيح التخزين المشفرة المتقدمة
  const STORAGE_KEYS = {
    TOKEN: 'akraa_quantum_token',
    REFRESH_TOKEN: 'akraa_quantum_refresh',
    SESSION_DATA: 'akraa_quantum_session',
    USER_DATA: 'akraa_quantum_user',
    SECURITY_CONTEXT: 'akraa_quantum_security',
    DEVICE_FINGERPRINT: 'akraa_quantum_device'
  };

  /**
   * إنشاء بصمة جهاز فريدة
   */
  const generateDeviceFingerprint = useCallback(() => {
    try {
      const components = [
        navigator.userAgent,
        navigator.language,
        navigator.hardwareConcurrency,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset()
      ].join('|');
      
      return encryptionService.hashData(components);
    } catch (error) {
      quantumLogger.warn('Failed to generate device fingerprint', error);
      return 'unknown_device';
    }
  }, []);

  /**
   * تشفير البيانات المتقدم قبل التخزين
   */
  const encryptAndStore = useCallback((key, data, metadata = {}) => {
    try {
      const encryptedData = encryptionService.quantumEncrypt(
        JSON.stringify(data), 
        INIT_CONFIG.encryptionLevel
      );
      
      const storageItem = {
        data: encryptedData,
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        metadata
      };
      
      localStorage.setItem(key, JSON.stringify(storageItem));
      return true;
    } catch (error) {
      quantumLogger.error('Encryption storage error', { key, error });
      cyberSecurityMonitor.logSecurityEvent('ENCRYPTION_STORAGE_FAILED', { 
        key, 
        error: error.message 
      });
      return false;
    }
  }, [INIT_CONFIG.encryptionLevel]);

  /**
   * فك تشفير البيانات المتقدم بعد الاسترجاع
   */
  const decryptAndRetrieve = useCallback((key) => {
    try {
      const storedItem = localStorage.getItem(key);
      if (!storedItem) return null;
      
      const { data: encryptedData, timestamp, version } = JSON.parse(storedItem);
      
      // التحقق من صلاحية البيانات
      const storageTime = new Date(timestamp);
      const currentTime = new Date();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // أسبوع واحد
      
      if (currentTime - storageTime > maxAge) {
        quantumLogger.warn('Stored data expired', { key, timestamp });
        localStorage.removeItem(key);
        return null;
      }
      
      const decryptedData = encryptionService.quantumDecrypt(
        encryptedData, 
        INIT_CONFIG.encryptionLevel
      );
      
      return JSON.parse(decryptedData);
    } catch (error) {
      quantumLogger.error('Decryption retrieval error', { key, error });
      cyberSecurityMonitor.logSecurityEvent('DECRYPTION_RETRIEVAL_FAILED', { 
        key, 
        error: error.message 
      });
      
      // تنظيف البيانات التالفة
      localStorage.removeItem(key);
      return null;
    }
  }, [INIT_CONFIG.encryptionLevel]);

  /**
   * تنظيف جميع بيانات المصادقة المتقدمة
   */
  const clearAuthData = useCallback((reason = 'manual') => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      
      setUser(null);
      setSession(null);
      
      // إلغاء جميع الفواصل الزمنية
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
        sessionTimeoutRef.current = null;
      }
      
      if (securityCheckRef.current) {
        clearInterval(securityCheckRef.current);
        securityCheckRef.current = null;
      }
      
      quantumLogger.info('Auth data cleared', { reason });
      cyberSecurityMonitor.logSecurityEvent('AUTH_DATA_CLEARED', { reason });
      
    } catch (error) {
      quantumLogger.error('Error clearing auth data', error);
    }
  }, []);

  /**
   * التحقق من صحة التوكن المتقدم
   */
  const validateToken = useCallback((token) => {
    if (!token) return { valid: false, reason: 'NO_TOKEN' };
    
    try {
      // فك تشفير التوكن للتحقق من الصلاحية
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      // التحقق من انتهاء الصلاحية
      if (payload.exp && payload.exp < currentTime) {
        cyberSecurityMonitor.logSecurityEvent('TOKEN_EXPIRED', { 
          userId: payload.userId,
          expiredAt: new Date(payload.exp * 1000).toISOString()
        });
        return { valid: false, reason: 'TOKEN_EXPIRED' };
      }
      
      // التحقق من إصدار التوكن
      if (payload.version !== '2.0.0') {
        cyberSecurityMonitor.logSecurityEvent('TOKEN_VERSION_MISMATCH', { 
          expected: '2.0.0', 
          actual: payload.version 
        });
        return { valid: false, reason: 'VERSION_MISMATCH' };
      }
      
      // التحقق من بصمة الجهاز
      const deviceFingerprint = decryptAndRetrieve(STORAGE_KEYS.DEVICE_FINGERPRINT);
      if (payload.deviceFingerprint !== deviceFingerprint) {
        cyberSecurityMonitor.logSecurityEvent('DEVICE_MISMATCH', { 
          expected: payload.deviceFingerprint,
          actual: deviceFingerprint
        });
        return { valid: false, reason: 'DEVICE_MISMATCH' };
      }
      
      return { valid: true, payload };
      
    } catch (error) {
      cyberSecurityMonitor.logSecurityEvent('TOKEN_VALIDATION_ERROR', { 
        error: error.message 
      });
      return { valid: false, reason: 'VALIDATION_ERROR' };
    }
  }, [decryptAndRetrieve]);

  /**
   * جلب بيانات المستخدم المتقدمة من الخادم
   */
  const fetchUserData = useCallback(async (token) => {
    try {
      setLoading(true);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 ثواني
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Client-Version': process.env.REACT_APP_VERSION || '2.0.0',
          'X-Device-Fingerprint': decryptAndRetrieve(STORAGE_KEYS.DEVICE_FINGERPRINT),
          'X-Security-Level': security.securityLevel
        },
        credentials: 'include',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const userData = await response.json();
        
        // تحديث بيانات الأمان المتقدمة
        const securityUpdate = {
          twoFactorEnabled: userData.twoFactorEnabled || false,
          lastLogin: new Date().toISOString(),
          failedAttempts: 0,
          ipAddress: userData.ipAddress || await getClientIP(),
          userAgent: navigator.userAgent,
          securityLevel: userData.securityLevel || 'high',
          sessionTimeout: new Date(Date.now() + INIT_CONFIG.sessionTimeout),
          riskScore: userData.riskScore || 0
        };

        setUser(userData);
        setSecurity(securityUpdate);
        
        // تخزين البيانات المشفرة المتقدمة
        encryptAndStore(STORAGE_KEYS.USER_DATA, userData, { 
          fetchTime: new Date().toISOString() 
        });
        
        encryptAndStore(STORAGE_KEYS.SESSION_DATA, {
          ...securityUpdate,
          loginTime: new Date().toISOString(),
          sessionId: generateSessionId()
        });

        cyberSecurityMonitor.logSecurityEvent('LOGIN_SUCCESS', { 
          userId: userData.id, 
          email: userData.email,
          securityLevel: securityUpdate.securityLevel
        });

        return { success: true, user: userData };
      } else {
        const errorData = await response.json();
        cyberSecurityMonitor.logSecurityEvent('FETCH_USER_FAILED', { 
          status: response.status,
          error: errorData.message,
          userId: user?.id
        });
        
        clearAuthData('fetch_failed');
        return { success: false, message: errorData.message || 'فشل في جلب بيانات المستخدم' };
      }
    } catch (error) {
      quantumLogger.error('Failed to fetch user data', error);
      cyberSecurityMonitor.logSecurityEvent('NETWORK_ERROR', { 
        error: error.message,
        endpoint: '/auth/me',
        userId: user?.id
      });
      
      clearAuthData('network_error');
      return { success: false, message: 'فشل في الاتصال بالخادم' };
    } finally {
      setLoading(false);
    }
  }, [encryptAndStore, clearAuthData, decryptAndRetrieve, security.securityLevel, INIT_CONFIG.sessionTimeout]);

  /**
   * إنشاء معرف جلسة فريد
   */
  const generateSessionId = () => {
    return `sess_${Date.now()}_${crypto.randomUUID()}`;
  };

  /**
   * الحصول على IP العميل المتقدم
   */
  const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  };

  /**
   * تحديث التوكن تلقائياً المتقدم
   */
  const refreshToken = useCallback(async () => {
    try {
      const refreshTokenData = decryptAndRetrieve(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshTokenData) {
        throw new AuthError('NO_REFRESH_TOKEN', 'No refresh token available');
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Fingerprint': decryptAndRetrieve(STORAGE_KEYS.DEVICE_FINGERPRINT)
        },
        body: JSON.stringify({ 
          refreshToken: refreshTokenData,
          deviceFingerprint: decryptAndRetrieve(STORAGE_KEYS.DEVICE_FINGERPRINT)
        }),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        
        // تخزين التوكنات الجديدة
        encryptAndStore(STORAGE_KEYS.TOKEN, data.token);
        encryptAndStore(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
        
        cyberSecurityMonitor.logSecurityEvent('TOKEN_REFRESHED', { 
          userId: user?.id,
          refreshTime: new Date().toISOString()
        });
        
        return data.token;
      } else {
        throw new AuthError('REFRESH_FAILED', 'Failed to refresh token');
      }
    } catch (error) {
      cyberSecurityMonitor.logSecurityEvent('TOKEN_REFRESH_FAILED', { 
        error: error.message,
        userId: user?.id
      });
      clearAuthData('refresh_failed');
      return null;
    }
  }, [user, encryptAndStore, decryptAndRetrieve, clearAuthData]);

  /**
   * إدارة مهلة الجلسة
   */
  const setupSessionTimeout = useCallback(() => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }

    sessionTimeoutRef.current = setTimeout(() => {
      quantumLogger.warn('Session timeout reached');
      cyberSecurityMonitor.logSecurityEvent('SESSION_TIMEOUT', { 
        userId: user?.id 
      });
      logout(false, 'session_timeout');
    }, INIT_CONFIG.sessionTimeout);
  }, [user, INIT_CONFIG.sessionTimeout]);

  /**
   * التحقق الدوري من الأمان
   */
  const setupSecurityChecks = useCallback(() => {
    if (securityCheckRef.current) {
      clearInterval(securityCheckRef.current);
    }

    securityCheckRef.current = setInterval(async () => {
      try {
        // التحقق من صلاحية التوكن
        const token = decryptAndRetrieve(STORAGE_KEYS.TOKEN);
        const validation = validateToken(token);
        
        if (!validation.valid) {
          quantumLogger.warn('Security check failed', { reason: validation.reason });
          await refreshToken();
        }

        // تحديث درجة المخاطرة
        const riskScore = await calculateRiskScore();
        setSecurity(prev => ({ ...prev, riskScore }));

      } catch (error) {
        quantumLogger.error('Security check error', error);
      }
    }, INIT_CONFIG.securityCheckInterval);
  }, [validateToken, refreshToken, decryptAndRetrieve, INIT_CONFIG.securityCheckInterval]);

  /**
   * حساب درجة المخاطرة
   */
  const calculateRiskScore = async () => {
    let score = 0;
    
    // زيادة الدرجة بناءً على عدد المحاولات الفاشلة
    score += security.failedAttempts * 10;
    
    // زيادة الدرجة بناءً على وقت الجلسة
    if (security.sessionTimeout && new Date(security.sessionTimeout) < new Date()) {
      score += 20;
    }
    
    // التحقق من عنوان IP
    const currentIP = await getClientIP();
    if (security.ipAddress !== currentIP) {
      score += 30;
    }
    
    return Math.min(score, 100);
  };

  /**
   * التحقق الأولي من المصادقة المتقدم
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        
        // استرجاع البيانات المشفرة
        const token = decryptAndRetrieve(STORAGE_KEYS.TOKEN);
        const userData = decryptAndRetrieve(STORAGE_KEYS.USER_DATA);
        const sessionData = decryptAndRetrieve(STORAGE_KEYS.SESSION_DATA);

        // تهيئة بصمة الجهاز إذا لم تكن موجودة
        let deviceFingerprint = decryptAndRetrieve(STORAGE_KEYS.DEVICE_FINGERPRINT);
        if (!deviceFingerprint) {
          deviceFingerprint = generateDeviceFingerprint();
          encryptAndStore(STORAGE_KEYS.DEVICE_FINGERPRINT, deviceFingerprint);
        }

        if (token) {
          const validation = validateToken(token);
          
          if (validation.valid) {
            // تحميل بيانات المستخدم المخزنة مؤقتاً
            if (userData) {
              setUser(userData);
              setSecurity(prev => ({ ...prev, ...sessionData }));
            }

            // تحديث بيانات المستخدم من الخادم
            await fetchUserData(token);
            
            // إعداد الفواصل الزمنية
            setupSessionTimeout();
            setupSecurityChecks();
            
          } else {
            // التوكن غير صالح
            quantumLogger.warn('Token validation failed', { reason: validation.reason });
            clearAuthData('token_validation_failed');
          }
        } else {
          // لا يوجد توكن
          clearAuthData('no_token');
        }
      } catch (error) {
        quantumLogger.error('Auth initialization error', error);
        cyberSecurityMonitor.logSecurityEvent('INITIALIZATION_ERROR', { 
          error: error.message 
        });
        clearAuthData('initialization_error');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // تنظيف عند إلغاء التثبيت
    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
      if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
      if (securityCheckRef.current) clearInterval(securityCheckRef.current);
    };
  }, [validateToken, fetchUserData, clearAuthData, decryptAndRetrieve, encryptAndStore, generateDeviceFingerprint, setupSessionTimeout, setupSecurityChecks]);

  /**
   * تسجيل الدخول المتقدم
   */
  const login = async (email, password, twoFactorCode = null, rememberMe = false) => {
    try {
      setLoading(true);
      
      // تسجيل حدث محاولة الدخول المتقدم
      cyberSecurityMonitor.logSecurityEvent('LOGIN_ATTEMPT', { 
        email,
        timestamp: new Date().toISOString()
      });

      const loginData = {
        email: email.toLowerCase().trim(),
        password: encryptionService.quantumHash(password),
        twoFactorCode,
        rememberMe,
        clientInfo: {
          ip: await getClientIP(),
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          deviceFingerprint: decryptAndRetrieve(STORAGE_KEYS.DEVICE_FINGERPRINT),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      };

      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Version': process.env.REACT_APP_VERSION || '2.0.0',
          'X-Security-Context': 'quantum_auth'
        },
        body: JSON.stringify(loginData),
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        // تخزين التوكنات المشفرة المتقدمة
        encryptAndStore(STORAGE_KEYS.TOKEN, data.token, { 
          loginTime: new Date().toISOString() 
        });
        
        encryptAndStore(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken, {
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 يوم
        });

        // جلب بيانات المستخدم
        const userResult = await fetchUserData(data.token);
        
        if (userResult.success) {
          // إعداد الفواصل الزمنية
          setupSessionTimeout();
          setupSecurityChecks();
          
          cyberSecurityMonitor.logSecurityEvent('LOGIN_SUCCESS', { 
            userId: userResult.user.id, 
            email: userResult.user.email,
            securityLevel: security.securityLevel
          });
          
          return { 
            success: true, 
            requiresTwoFactor: false,
            user: userResult.user,
            session: {
              id: generateSessionId(),
              expiresAt: new Date(Date.now() + INIT_CONFIG.sessionTimeout)
            }
          };
        } else {
          return userResult;
        }
      } else {
        // زيادة عدد المحاولات الفاشلة
        setSecurity(prev => ({
          ...prev,
          failedAttempts: prev.failedAttempts + 1
        }));

        cyberSecurityMonitor.logSecurityEvent('LOGIN_FAILED', { 
          email, 
          reason: data.message,
          failedAttempts: security.failedAttempts + 1
        });

        // التحقق من تجاوز الحد المسموح
        if (security.failedAttempts + 1 >= INIT_CONFIG.maxFailedAttempts) {
          cyberSecurityMonitor.logSecurityEvent('ACCOUNT_LOCKOUT_THRESHOLD', { email });
        }

        return { 
          success: false, 
          message: data.message,
          requiresTwoFactor: data.requiresTwoFactor || false,
          failedAttempts: security.failedAttempts + 1
        };
      }
    } catch (error) {
      quantumLogger.error('Login error', error);
      cyberSecurityMonitor.logSecurityEvent('LOGIN_ERROR', { 
        email, 
        error: error.message 
      });
      
      return { 
        success: false, 
        message: 'فشل في الاتصال بالخادم' 
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * تسجيل الخروج المتقدم
   */
  const logout = useCallback(async (manual = true, reason = 'user_initiated') => {
    try {
      const token = decryptAndRetrieve(STORAGE_KEYS.TOKEN);
      
      if (token && manual) {
        // إعلام الخادم بتسجيل الخروج المتقدم
        await fetch(`${process.env.REACT_APP_API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Logout-Reason': reason
          },
          body: JSON.stringify({ 
            logoutTime: new Date().toISOString(),
            sessionId: session?.id,
            reason
          })
        });
      }

      // تسجيل حدث تسجيل الخروج المتقدم
      cyberSecurityMonitor.logSecurityEvent('LOGOUT', { 
        userId: user?.id,
        manual,
        reason,
        logoutTime: new Date().toISOString()
      });

    } catch (error) {
      quantumLogger.error('Logout error', error);
    } finally {
      // تنظيف البيانات المحلية المتقدمة
      clearAuthData(reason);
    }
  }, [user, session, clearAuthData, decryptAndRetrieve]);

  /**
   * التسجيل المتقدم كمستخدم جديد
   */
  const register = async (userData) => {
    try {
      setLoading(true);
      
      cyberSecurityMonitor.logSecurityEvent('REGISTER_ATTEMPT', { 
        email: userData.email,
        timestamp: new Date().toISOString()
      });

      // تشفير البيانات الحساسة المتقدمة
      const encryptedData = {
        ...userData,
        password: encryptionService.quantumHash(userData.password),
        apiKeys: userData.apiKeys ? encryptionService.quantumEncryptApiKeys(userData.apiKeys) : null,
        phone: encryptionService.quantumEncrypt(userData.phone),
        clientInfo: {
          ip: await getClientIP(),
          userAgent: navigator.userAgent,
          deviceFingerprint: generateDeviceFingerprint(),
          registrationTime: new Date().toISOString()
        }
      };

      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Version': process.env.REACT_APP_VERSION || '2.0.0',
          'X-Security-Context': 'quantum_registration'
        },
        body: JSON.stringify(encryptedData),
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        cyberSecurityMonitor.logSecurityEvent('REGISTER_SUCCESS', { 
          userId: data.user.id, 
          email: data.user.email,
          securityLevel: data.user.securityLevel
        });

        return { success: true, user: data.user };
      } else {
        cyberSecurityMonitor.logSecurityEvent('REGISTER_FAILED', { 
          email: userData.email, 
          reason: data.message 
        });

        return { success: false, message: data.message };
      }
    } catch (error) {
      quantumLogger.error('Registration error', error);
      cyberSecurityMonitor.logSecurityEvent('REGISTER_ERROR', { 
        email: userData.email, 
        error: error.message 
      });
      
      return { 
        success: false, 
        message: 'فشل في الاتصال بالخادم' 
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * تحديث بيانات المستخدم المتقدم
   */
  const updateProfile = async (updates) => {
    try {
      const token = decryptAndRetrieve(STORAGE_KEYS.TOKEN);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Update-Type': 'profile'
        },
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      if (data.success) {
        setUser(prev => ({ ...prev, ...data.user }));
        encryptAndStore(STORAGE_KEYS.USER_DATA, data.user, {
          updateTime: new Date().toISOString()
        });
        
        cyberSecurityMonitor.logSecurityEvent('PROFILE_UPDATED', { 
          userId: user?.id,
          updateFields: Object.keys(updates)
        });
        
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      quantumLogger.error('Profile update error', error);
      return { success: false, message: 'فشل في تحديث الملف الشخصي' };
    }
  };

  /**
   * تغيير كلمة المرور المتقدم
   */
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const token = decryptAndRetrieve(STORAGE_KEYS.TOKEN);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Security-Context': 'password_change'
        },
        body: JSON.stringify({
          currentPassword: encryptionService.quantumHash(currentPassword),
          newPassword: encryptionService.quantumHash(newPassword),
          deviceFingerprint: decryptAndRetrieve(STORAGE_KEYS.DEVICE_FINGERPRINT)
        })
      });

      const data = await response.json();

      if (data.success) {
        cyberSecurityMonitor.logSecurityEvent('PASSWORD_CHANGED', { 
          userId: user?.id,
          changeTime: new Date().toISOString()
        });
        
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      quantumLogger.error('Password change error', error);
      return { success: false, message: 'فشل في تغيير كلمة المرور' };
    }
  };

  /**
   * تفعيل المصادقة الثنائية المتقدمة
   */
  const enableTwoFactor = async () => {
    try {
      const token = decryptAndRetrieve(STORAGE_KEYS.TOKEN);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/enable-2fa`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Security-Level': 'enhanced'
        }
      });

      const data = await response.json();

      if (data.success) {
        setSecurity(prev => ({ ...prev, twoFactorEnabled: true }));
        
        cyberSecurityMonitor.logSecurityEvent('2FA_ENABLED', { 
          userId: user?.id,
          enableTime: new Date().toISOString()
        });
        
        return { success: true, secret: data.secret, qrCode: data.qrCode, backupCodes: data.backupCodes };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      quantumLogger.error('2FA enable error', error);
      return { success: false, message: 'فشل في تفعيل المصادقة الثنائية' };
    }
  };

  /**
   * تعطيل المصادقة الثنائية المتقدم
   */
  const disableTwoFactor = async (code, backupCode = null) => {
    try {
      const token = decryptAndRetrieve(STORAGE_KEYS.TOKEN);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/disable-2fa`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code, backupCode })
      });

      const data = await response.json();

      if (data.success) {
        setSecurity(prev => ({ ...prev, twoFactorEnabled: false }));
        
        cyberSecurityMonitor.logSecurityEvent('2FA_DISABLED', { 
          userId: user?.id,
          disableTime: new Date().toISOString()
        });
        
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      quantumLogger.error('2FA disable error', error);
      return { success: false, message: 'فشل في تعطيل المصادقة الثنائية' };
    }
  };

  /**
   * التحقق من صلاحية الجلسة المتقدم
   */
  const isAuthenticated = useCallback(() => {
    const token = decryptAndRetrieve(STORAGE_KEYS.TOKEN);
    const validation = validateToken(token);
    return validation.valid && user;
  }, [user, validateToken, decryptAndRetrieve]);

  /**
   * الحصول على التوكن الحالي المتقدم
   */
  const getCurrentToken = useCallback(() => {
    return decryptAndRetrieve(STORAGE_KEYS.TOKEN);
  }, [decryptAndRetrieve]);

  /**
   * تجديد الجلسة يدوياً
   */
  const renewSession = useCallback(async () => {
    try {
      setupSessionTimeout();
      const newToken = await refreshToken();
      
      if (newToken) {
        cyberSecurityMonitor.logSecurityEvent('SESSION_RENEWED', { 
          userId: user?.id,
          renewTime: new Date().toISOString()
        });
        return true;
      }
      return false;
    } catch (error) {
      quantumLogger.error('Session renewal error', error);
      return false;
    }
  }, [user, refreshToken, setupSessionTimeout]);

  /**
   * الحصول على حالة الأمان الحالية
   */
  const getSecurityStatus = useCallback(() => {
    return {
      level: security.securityLevel,
      riskScore: security.riskScore,
      twoFactorEnabled: security.twoFactorEnabled,
      failedAttempts: security.failedAttempts,
      lastLogin: security.lastLogin,
      sessionExpires: security.sessionTimeout
    };
  }, [security]);

  // قيمة الـ Context المتقدمة
  const value = {
    // الحالة المتقدمة
    user,
    loading,
    security,
    session,
    
    // التوابع الأساسية المتقدمة
    login,
    logout,
    register,
    isAuthenticated,
    getCurrentToken,
    refreshToken,
    renewSession,
    
    // إدارة الملف الشخصي المتقدم
    updateProfile,
    changePassword,
    
    // المصادقة الثنائية المتقدمة
    enableTwoFactor,
    disableTwoFactor,
    
    // الأمان المتقدم
    clearAuthData,
    getSecurityStatus,
    
    // المعلومات المتقدمة
    deviceFingerprint: decryptAndRetrieve(STORAGE_KEYS.DEVICE_FINGERPRINT),
    securityConfig: INIT_CONFIG
  };

  // تحديد حالة التحميل بناءً على درجة المخاطرة
  const getLoadingStatusClass = () => {
    if (security.riskScore > 70) return 'auth-status-critical';
    if (security.riskScore > 30) return 'auth-status-warning';
    return 'auth-status-secure';
  };

  return (
    <AuthContext.Provider value={value}>
      <div className={`auth-provider ${loading ? 'auth-loading' : ''}`}>
        {children}
        
        {/* مؤشر التحميل المتقدم أثناء المصادقة */}
        {loading && (
          <div className="auth-loading-overlay">
            <div className={`auth-loading-spinner ${getLoadingStatusClass()}`}>
              <div className="spinner-icon">🔐</div>
              <div className="spinner-text">
                {security.riskScore > 70 ? 'جاري التحقق الأمني المتقدم...' : 
                 security.riskScore > 30 ? 'جاري التحقق الأمني الإضافي...' : 
                 'جاري التحقق من المصادقة...'}
              </div>
              <div className="spinner-subtext">
                {security.riskScore > 70 ? 'تم اكتشاف نشاط غير عادي' : 
                 'نظام الأمان الكمي يعمل لحمايتك'}
              </div>
              
              <div className="quantum-progress">
                <div className="quantum-progress-bar"></div>
              </div>
              
              <div className="security-indicators">
                <div className="security-indicator"></div>
                <div className="security-indicator"></div>
                <div className="security-indicator"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthContext.Provider>
  );
};

export default AuthContext;