/**
 * مدير المراكز المتقدم - الإصدار 3.0
 * إدارة متقدمة للمراكز مع تحليلات المخاطر والتحكم الذكي
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
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
} from '../../store/tradingSlice';

/**
 * مكون مدير المراكز المتقدم
 */
const PositionManager = ({
  showClosed = false,
  autoRefresh = true,
  refreshInterval = 10000,
  showRiskAnalysis = true,
  theme = 'dark',
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // الحالة
  const [activeTab, setActiveTab] = useState('open');
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [positionStats, setPositionStats] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);

  // الخدمات
  const tradingService = useMemo(
    () => new TradingService(),
    [],
  );
  const riskService = useMemo(() => new RiskService(), []);
  const positionAnalyzer = useMemo(
    () => new PositionAnalyzer(),
    [],
  );

  // البيانات من Redux
  const { positions, isLoading, marketData } = useSelector(
    (state) => state.trading,
  );

  /**
   * حساب الحقول الإضافية للمركز
   */
  const calculatePositionFields = useCallback(
    (position, market) => {
      const currentPrice =
        market[position.symbol]?.price || position.entryPrice;
      const size = parseFloat(position.size);
      const entryPrice = parseFloat(position.entryPrice);
      const leverage = parseFloat(position.leverage || 1);

      // حساب الربح/الخسارة غير المحققة
      const priceDifference = currentPrice - entryPrice;
      const unrealizedPnl =
        position.side === 'long'
          ? priceDifference * size
          : -priceDifference * size;

      // حساب النسبة المئوية
      const pnlPercentage =
        (unrealizedPnl / (size * entryPrice || 1)) * 100;

      // حساب مسافة التصفية
      const liquidationDistance = calculateLiquidationDistance(
        position,
        currentPrice,
      );

      return {
        unrealizedPnl,
        pnlPercentage,
        liquidationDistance,
        currentPrice,
        positionValue: size * currentPrice,
        marginUsed: (size * entryPrice) / leverage || 0,
      };
    },
    [],
  );

  /**
   * حساب مسافة التصفية
   */
  const calculateLiquidationDistance = useCallback(
    (position, currentPrice) => {
      const leverage = parseFloat(position.leverage || 1);
      const entryPrice = parseFloat(position.entryPrice);

      if (!leverage || !entryPrice || !currentPrice) return 0;

      if (position.side === 'long') {
        const liquidationPrice = entryPrice * (1 - 1 / leverage);
        return (
          ((currentPrice - liquidationPrice) / currentPrice) *
          100
        );
      }

      const liquidationPrice = entryPrice * (1 + 1 / leverage);
      return (
        ((liquidationPrice - currentPrice) / currentPrice) *
        100
      );
    },
    [],
  );

  /**
   * تعزيز المراكز بتحليلات المخاطر
   */
  const enhancePositionsWithRisk = useCallback(
    async (rawPositions) => {
      const enhancedPositions = [];

      // eslint-disable-next-line no-restricted-syntax
      for (const position of rawPositions) {
        try {
          // تحليل المخاطر من RiskService
          const riskAnalysis =
            await riskService.analyzePositionRisk(
              position,
              marketData,
            );

          enhancedPositions.push({
            ...position,
            riskAnalysis,
            calculatedFields: calculatePositionFields(
              position,
              marketData,
            ),
          });
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(
            `❌ خطأ في تحليل مخاطر المركز ${position.id}:`,
            error,
          );
          enhancedPositions.push(position);
        }
      }

      return enhancedPositions;
    },
    [riskService, marketData, calculatePositionFields],
  );

  /**
   * تحميل المراكز
   */
  const loadPositions = useCallback(async () => {
    try {
      dispatch(setPositionsLoading(true));

      const positionsData =
        await tradingService.getPositions();

      // تحليل المخاطر للمراكز
      const enhanced = await enhancePositionsWithRisk(
        positionsData,
      );

      dispatch(updatePositions(enhanced));

      // حساب الإحصائيات
      const stats =
        positionAnalyzer.calculatePositionStats(enhanced);
      setPositionStats(stats);
      setLastUpdated(new Date());
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ خطأ في تحميل المراكز:', error);
    } finally {
      dispatch(setPositionsLoading(false));
    }
  }, [
    dispatch,
    tradingService,
    enhancePositionsWithRisk,
    positionAnalyzer,
  ]);

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
  const handleClosePosition = useCallback(
    async (positionId, closeData) => {
      try {
        await tradingService.closePosition(
          positionId,
          closeData,
        );
        await loadPositions();
        // eslint-disable-next-line no-console
        console.log('✅ تم إغلاق المركز بنجاح');
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('❌ خطأ في إغلاق المركز:', error);
        throw error;
      }
    },
    [tradingService, loadPositions],
  );

  /**
   * معالج تعديل المركز
   */
  const handleModifyPosition = useCallback(
    async (positionId, modificationData) => {
      try {
        await tradingService.modifyPosition(
          positionId,
          modificationData,
        );
        await loadPositions();
        // eslint-disable-next-line no-console
        console.log('✅ تم تعديل المركز بنجاح');
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('❌ خطأ في تعديل المركز:', error);
        throw error;
      }
    },
    [tradingService, loadPositions],
  );

  /**
   * تصفية المراكز حسب النوع
   */
  const filteredPositions = useMemo(() => {
    if (activeTab === 'open') {
      return positions.filter((p) => p.status === 'open');
    }
    if (activeTab === 'closed') {
      return positions.filter((p) => p.status === 'closed');
    }
    return positions;
  }, [positions, activeTab]);

  /**
   * تجميع المراكز حسب الرمز
   */
  const groupedPositions = useMemo(() => {
    const groups = {};
    filteredPositions.forEach((position) => {
      if (!groups[position.symbol]) {
        groups[position.symbol] = [];
      }
      groups[position.symbol].push(position);
    });
    return groups;
  }, [filteredPositions]);

  const containerStyle = {
    borderRadius: 22,
    padding: 12,
    border: '1px solid rgba(30,64,175,0.6)',
    background:
      'radial-gradient(circle at top, rgba(56,189,248,0.08), rgba(15,23,42,0.98))',
    boxShadow: '0 16px 36px rgba(15,23,42,0.9)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  };

  // عرض حالة التحميل (عند عدم وجود أي مراكز بعد)
  if (isLoading && positions.length === 0) {
    return (
      <section style={containerStyle}>
        <LoadingState
          title={t('positions.loadingTitle', 'جاري تحميل المراكز')}
          description={t(
            'positions.loadingSubtitle',
            'نقوم بجلب أحدث المراكز من محرك التداول.',
          )}
        />
      </section>
    );
  }

  // عرض حالة عدم وجود مراكز
  if (!isLoading && filteredPositions.length === 0) {
    return (
      <section style={containerStyle}>
        <EmptyState
          title={t(
            'positions.emptyTitle',
            'لا توجد مراكز حالياً',
          )}
          description={t(
            'positions.emptySubtitle',
            'ابدأ بتنفيذ أول صفقة لتظهر هنا إدارة المراكز المباشرة.',
          )}
          primaryActionLabel={t(
            'positions.emptyAction',
            'ابدأ التداول',
          )}
          onPrimaryAction={() =>
            // eslint-disable-next-line no-console
            console.log('Start trading clicked')
          }
        />
      </section>
    );
  }

  const openCount = positions.filter(
    (p) => p.status === 'open',
  ).length;
  const closedCount = positions.filter(
    (p) => p.status === 'closed',
  ).length;

  return (
    <section className="position-manager" style={containerStyle}>
      {/* رأس المدير */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 8,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <h3
            style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#e5e7eb',
            }}
          >
            {t('positions.title', 'إدارة المراكز')}
          </h3>
          <p
            style={{
              fontSize: 11,
              color: 'var(--qa-text-muted)',
              maxWidth: 420,
            }}
          >
            {t(
              'positions.subtitle',
              'راقب مراكزك المفتوحة والمغلقة، وتحكّم في المخاطر من مكان واحد.',
            )}
          </p>
        </div>

        {lastUpdated && (
          <div
            style={{
              fontSize: 11,
              color: 'var(--qa-text-soft)',
              textAlign: 'end',
            }}
          >
            {t('common.lastUpdated', 'آخر تحديث')}:{' '}
            {lastUpdated.toLocaleTimeString()}
            {isLoading && (
              <span style={{ marginInlineStart: 6 }}>
                · {t('common.refreshing', 'تحديث...')}
              </span>
            )}
          </div>
        )}
      </header>

      {/* علامات التبويب */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          marginTop: 4,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('open')}
          style={{
            padding: '4px 10px',
            borderRadius: 999,
            border:
              activeTab === 'open'
                ? '1px solid rgba(56,189,248,0.95)'
                : '1px solid rgba(30,64,175,0.7)',
            background:
              activeTab === 'open'
                ? 'linear-gradient(135deg, rgba(34,211,238,0.95), rgba(56,189,248,0.95))'
                : 'rgba(15,23,42,0.98)',
            color:
              activeTab === 'open' ? '#020617' : '#e5e7eb',
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          {t('positions.open', 'مراكز مفتوحة')} ({openCount})
        </button>

        {showClosed && (
          <button
            type="button"
            onClick={() => setActiveTab('closed')}
            style={{
              padding: '4px 10px',
              borderRadius: 999,
              border:
                activeTab === 'closed'
                  ? '1px solid rgba(148,163,184,0.95)'
                  : '1px solid rgba(30,64,175,0.7)',
              background:
                activeTab === 'closed'
                  ? 'linear-gradient(135deg, rgba(148,163,184,0.95), rgba(100,116,139,0.95))'
                  : 'rgba(15,23,42,0.98)',
              color:
                activeTab === 'closed' ? '#020617' : '#e5e7eb',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            {t('positions.closed', 'مراكز مغلقة')} (
            {closedCount})
          </button>
        )}
      </div>

      {/* إحصائيات سريعة */}
      {positionStats && (
        <div style={{ marginTop: 8 }}>
          <PositionStats stats={positionStats} />
        </div>
      )}

      {/* تحليل المخاطر العام للمحفظة */}
      {showRiskAnalysis &&
        positionStats &&
        positionStats.riskLevel && (
          <div style={{ marginTop: 6 }}>
            <RiskIndicator stats={positionStats} theme={theme} />
          </div>
        )}

      {/* قائمة المراكز مجمّعة حسب الرمز */}
      <div
        style={{
          marginTop: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {Object.entries(groupedPositions).map(
          ([symbol, symbolPositions]) => (
            <div
              key={symbol}
              style={{
                borderRadius: 18,
                padding: '8px 9px',
                border:
                  '1px solid rgba(30,64,175,0.65)',
                background:
                  'linear-gradient(145deg, rgba(15,23,42,0.98), rgba(15,23,42,1))',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#e5e7eb',
                  }}
                >
                  {symbol}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--qa-text-soft)',
                  }}
                >
                  {symbolPositions.length}{' '}
                  {t('positions.positions', 'مركز')}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                {symbolPositions.map((position) => (
                  <PositionCard
                    key={
                      position.id ||
                      position.positionId ||
                      `${symbol}-${position.openedAt}`
                    }
                    position={position}
                    onSelect={() =>
                      setSelectedPosition(position)
                    }
                    theme={theme}
                  />
                ))}
              </div>
            </div>
          ),
        )}
      </div>

      {/* إجراءات المركز المحدد */}
      {selectedPosition && (
        <div style={{ marginTop: 10 }}>
          <PositionActions
            position={selectedPosition}
            onClose={handleClosePosition}
            onModify={handleModifyPosition}
            onDismiss={() => setSelectedPosition(null)}
            theme={theme}
          />
        </div>
      )}

      {/* حالة التحديث التلقائي */}
      {autoRefresh && (
        <div
          style={{
            marginTop: 8,
            fontSize: 11,
            color: 'var(--qa-text-soft)',
            textAlign: 'left',
          }}
        >
          {t('common.autoRefresh', 'تحديث تلقائي')} (
          {refreshInterval / 1000}
          s)
        </div>
      )}
    </section>
  );
};

// أنواع مخصصة للاستخدام السريع
PositionManager.Advanced = (props) => (
  <PositionManager
    showClosed
    autoRefresh
    showRiskAnalysis
    {...props}
  />
);

PositionManager.Simple = (props) => (
  <PositionManager
    showClosed={false}
    autoRefresh={false}
    showRiskAnalysis={false}
    {...props}
  />
);

export default React.memo(PositionManager);
