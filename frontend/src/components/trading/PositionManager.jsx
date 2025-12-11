/**
 * مدير المراكز المتقدم - الإصدار 3.0
 * إدارة متقدمة للمراكز مع تحليلات المخاطر والتحكم الذكي
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

// الخدمات
import TradingService from '../../services/tradingService';
import RiskService from '../../services/riskService';
import PositionAnalyzer from '../../services/positionAnalyzer';

// المكونات
import PositionCard from './PositionCard';
import PositionActions from './PositionActions';
import PositionStats from './PositionStats';
import RiskIndicator from './RiskIndicator';
import LoadingState from '../common/LoadingState';
import EmptyState from '../common/EmptyState';

// الإجراءات
import { 
  updatePositions, 
  setPositionsLoading,
  closePosition 
} from '../../store/tradingSlice';

/**
 * مكون مدير المراكز المتقدم
 */
const PositionManager = ({ 
  showClosed = false,
  autoRefresh = true,
  refreshInterval = 10000,
  showRiskAnalysis = true,
  theme = 'dark'
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  
  // الحالة
  const [activeTab, setActiveTab] = useState('open');
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [positionStats, setPositionStats] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // الخدمات
  const tradingService = useMemo(() => new TradingService(), []);
  const riskService = useMemo(() => new RiskService(), []);
  const positionAnalyzer = useMemo(() => new PositionAnalyzer(), []);

  // البيانات من Redux
  const { positions, isLoading, marketData } = useSelector(state => state.trading);

  /**
   * تحميل المراكز
   */
  const loadPositions = useCallback(async () => {
    try {
      dispatch(setPositionsLoading(true));
      
      const positionsData = await tradingService.getPositions();
      
      // تحليل المخاطر للمراكز
      const enhancedPositions = await enhancePositionsWithRisk(positionsData);
      
      dispatch(updatePositions(enhancedPositions));
      
      // حساب الإحصائيات
      const stats = positionAnalyzer.calculatePositionStats(enhancedPositions);
      setPositionStats(stats);
      
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('❌ خطأ في تحميل المراكز:', error);
    } finally {
      dispatch(setPositionsLoading(false));
    }
  }, [dispatch, tradingService, positionAnalyzer]);

  /**
   * تعزيز المراكز بتحليلات المخاطر
   */
  const enhancePositionsWithRisk = useCallback(async (positions) => {
    const enhancedPositions = [];
    
    for (const position of positions) {
      try {
        const riskAnalysis = await riskService.analyzePositionRisk(position, marketData);
        enhancedPositions.push({
          ...position,
          riskAnalysis,
          calculatedFields: calculatePositionFields(position, marketData)
        });
      } catch (error) {
        console.error(`❌ خطأ في تحليل مخاطر المركز ${position.id}:`, error);
        enhancedPositions.push(position);
      }
    }
    
    return enhancedPositions;
  }, [riskService, marketData]);

  /**
   * حساب الحقول الإضافية للمركز
   */
  const calculatePositionFields = useCallback((position, marketData) => {
    const currentPrice = marketData[position.symbol]?.price || position.entryPrice;
    const size = parseFloat(position.size);
    const entryPrice = parseFloat(position.entryPrice);
    const leverage = parseFloat(position.leverage || 1);
    
    // حساب الربح/الخسارة غير المحققة
    const priceDifference = currentPrice - entryPrice;
    const unrealizedPnl = position.side === 'long' 
      ? priceDifference * size
      : -priceDifference * size;
    
    // حساب النسبة المئوية
    const pnlPercentage = (unrealizedPnl / (size * entryPrice)) * 100;
    
    // حساب مسافة التصفية
    const liquidationDistance = calculateLiquidationDistance(position, currentPrice);
    
    return {
      unrealizedPnl,
      pnlPercentage,
      liquidationDistance,
      currentPrice,
      positionValue: size * currentPrice,
      marginUsed: (size * entryPrice) / leverage
    };
  }, []);

  /**
   * حساب مسافة التصفية
   */
  const calculateLiquidationDistance = useCallback((position, currentPrice) => {
    const leverage = parseFloat(position.leverage || 1);
    const entryPrice = parseFloat(position.entryPrice);
    
    if (position.side === 'long') {
      const liquidationPrice = entryPrice * (1 - 1/leverage);
      return ((currentPrice - liquidationPrice) / currentPrice) * 100;
    } else {
      const liquidationPrice = entryPrice * (1 + 1/leverage);
      return ((liquidationPrice - currentPrice) / currentPrice) * 100;
    }
  }, []);

  /**
   * تأثير التحميل الأولي
   */
  useEffect(() => {
    loadPositions();
  }, [loadPositions]);

  /**
   * تأثير التحديث التلقائي
   */
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      loadPositions();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadPositions]);

  /**
   * معالج إغلاق المركز
   */
  const handleClosePosition = useCallback(async (positionId, closeData) => {
    try {
      await tradingService.closePosition(positionId, closeData);
      
      // إعادة تحميل المراكز
      await loadPositions();
      
      // إظهار رسالة نجاح
      console.log('✅ تم إغلاق المركز بنجاح');
      
    } catch (error) {
      console.error('❌ خطأ في إغلاق المركز:', error);
      throw error;
    }
  }, [tradingService, loadPositions]);

  /**
   * معالج تعديل المركز
   */
  const handleModifyPosition = useCallback(async (positionId, modificationData) => {
    try {
      await tradingService.modifyPosition(positionId, modificationData);
      
      // إعادة تحميل المراكز
      await loadPositions();
      
      console.log('✅ تم تعديل المركز بنجاح');
      
    } catch (error) {
      console.error('❌ خطأ في تعديل المركز:', error);
      throw error;
    }
  }, [tradingService, loadPositions]);

  /**
   * تصفية المراكز حسب النوع
   */
  const filteredPositions = useMemo(() => {
    if (activeTab === 'open') {
      return positions.filter(p => p.status === 'open');
    } else if (activeTab === 'closed') {
      return positions.filter(p => p.status === 'closed');
    }
    return positions;
  }, [positions, activeTab]);

  /**
   * تجميع المراكز حسب الرمز
   */
  const groupedPositions = useMemo(() => {
    const groups = {};
    
    filteredPositions.forEach(position => {
      if (!groups[position.symbol]) {
        groups[position.symbol] = [];
      }
      groups[position.symbol].push(position);
    });
    
    return groups;
  }, [filteredPositions]);

  // عرض حالة التحميل
  if (isLoading && positions.length === 0) {
    return (
      <LoadingState 
        type="positions" 
        message={t('positions.loading')}
        height={500}
      />
    );
  }

  // عرض حالة عدم وجود مراكز
  if (filteredPositions.length === 0) {
    return (
      <EmptyState
        type="positions"
        message={t('positions.empty')}
        actionText={t('positions.startTrading')}
        onAction={() => console.log('Start trading clicked')}
      />
    );
  }

  return (
    <div className={`position-manager ${theme}`} data-testid="position-manager">
      {/* رأس المدير */}
      <div className="position-manager-header">
        <div className="header-left">
          <h2>{t('positions.title')}</h2>
          {lastUpdated && (
            <span className="last-updated">
              {t('common.lastUpdated')}: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
        
        <div className="header-right">
          {/* علامات التبويب */}
          <div className="position-tabs">
            <button
              className={`tab ${activeTab === 'open' ? 'active' : ''}`}
              onClick={() => setActiveTab('open')}
            >
              {t('positions.open')} ({positions.filter(p => p.status === 'open').length})
            </button>
            
            {showClosed && (
              <button
                className={`tab ${activeTab === 'closed' ? 'active' : ''}`}
                onClick={() => setActiveTab('closed')}
              >
                {t('positions.closed')} ({positions.filter(p => p.status === 'closed').length})
              </button>
            )}
          </div>
          
          {/* إحصائيات سريعة */}
          {positionStats && (
            <PositionStats
              stats={positionStats}
              compact={true}
            />
          )}
        </div>
      </div>

      {/* تحليل المخاطر */}
      {showRiskAnalysis && positionStats.riskLevel && (
        <RiskIndicator
          riskLevel={positionStats.riskLevel}
          message={positionStats.riskMessage}
          suggestions={positionStats.riskSuggestions}
        />
      )}

      {/* قائمة المراكز */}
      <div className="positions-list">
        {Object.entries(groupedPositions).map(([symbol, symbolPositions]) => (
          <div key={symbol} className="symbol-group">
            <div className="symbol-header">
              <h3>{symbol}</h3>
              <span className="position-count">
                {symbolPositions.length} {t('positions.positions')}
              </span>
            </div>
            
            <div className="positions-grid">
              {symbolPositions.map(position => (
                <PositionCard
                  key={position.id}
                  position={position}
                  marketData={marketData}
                  isSelected={selectedPosition?.id === position.id}
                  onSelect={setSelectedPosition}
                  onClose={handleClosePosition}
                  onModify={handleModifyPosition}
                  theme={theme}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* إجراءات المركز المحدد */}
      {selectedPosition && (
        <PositionActions
          position={selectedPosition}
          onClose={handleClosePosition}
          onModify={handleModifyPosition}
          onDeselect={() => setSelectedPosition(null)}
          theme={theme}
        />
      )}

      {/* تحديث تلقائي */}
      {autoRefresh && (
        <div className="auto-refresh-indicator">
          <span className="indicator-dot"></span>
          {t('common.autoRefresh')} ({refreshInterval / 1000}s)
        </div>
      )}
    </div>
  );
};

// أنواع مخصصة للاستخدام السريع
PositionManager.Advanced = (props) => (
  <PositionManager
    showClosed={true}
    showRiskAnalysis={true}
    autoRefresh={true}
    {...props}
  />
);

PositionManager.Simple = (props) => (
  <PositionManager
    showClosed={false}
    showRiskAnalysis={false}
    autoRefresh={false}
    {...props}
  />
);

export default React.memo(PositionManager);
