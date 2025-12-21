// frontend/src/components/MonitoringDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Alert, Table, Tag, Progress } from 'antd';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import './MonitoringDashboard.css';

const MonitoringDashboard = () => {
  const [healthData, setHealthData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [systemMetrics, setSystemMetrics] = useState({});
  const [loading, setLoading] = useState(true);

  // جلب بيانات الصحة والأداء من الـ Backend (نفس المسارات الموجودة)
  useEffect(() => {
    let alive = true;

    const fetchMonitoringData = async () => {
      try {
        setLoading(true);

        const healthResponse = await fetch('/api/health/status');
        const healthJson = await healthResponse.json();
        if (!alive) return;

        setHealthData(healthJson);

        if (healthJson && healthJson.system_metrics) {
          setSystemMetrics(healthJson.system_metrics);
        }

        const performanceResponse = await fetch('/api/performance/summary');
        const performanceJson = await performanceResponse.json();
        if (!alive) return;

        setPerformanceData(performanceJson);
      } catch (error) {
        console.error('Error fetching monitoring data:', error);
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchMonitoringData();
    const interval = setInterval(fetchMonitoringData, 30000); // كل 30 ثانية

    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  // services: دعم Array أو Object
  const servicesRaw = healthData?.services || [];
  const services = Array.isArray(servicesRaw)
    ? servicesRaw
    : servicesRaw && typeof servicesRaw === 'object'
      ? Object.entries(servicesRaw).map(([name, v]) => ({ name, ...(v || {}) }))
      : [];

  // دعم شكل Array أو Object كما في الكود الأصلي (operation => metrics)
  const normalizedPerformance = Array.isArray(performanceData)
    ? performanceData
    : performanceData
      ? Object.entries(performanceData).map(([key, value]) => ({
          key,
          operation: key,
          ...(value || {}),
        }))
      : [];

  const serviceColumns = [
    { title: 'الخدمة', dataIndex: 'name', key: 'name' },
    {
      title: 'الحالة',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        let label = 'خطأ';

        if (status === 'healthy') {
          color = 'green';
          label = 'سليم';
        } else if (status === 'degraded') {
          color = 'orange';
          label = 'متدني';
        } else if (status === 'unknown') {
          color = 'default';
          label = 'غير معروف';
        } else if (status === 'unhealthy') {
          color = 'red';
          label = 'غير سليم';
        }

        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: 'وقت الاستجابة (ثانية)',
      dataIndex: 'response_time',
      key: 'response_time',
      render: (time) => (typeof time === 'number' ? time.toFixed(3) : 'N/A'),
    },
    {
      title: 'آخر فحص',
      dataIndex: 'last_check',
      key: 'last_check',
      render: (time) => (time ? new Date(time).toLocaleString('ar-EG') : 'N/A'),
    },
  ];

  const performanceColumns = [
    { title: 'العملية', dataIndex: 'operation', key: 'operation' },
    {
      title: 'متوسط الوقت (ثانية)',
      dataIndex: 'avg_time',
      key: 'avg_time',
      render: (time) => (typeof time === 'number' ? time.toFixed(3) : 'N/A'),
    },
    {
      title: 'أقصى وقت (ثانية)',
      dataIndex: 'max_time',
      key: 'max_time',
      render: (time) => (typeof time === 'number' ? time.toFixed(3) : 'N/A'),
    },
    {
      title: 'معدل الخطأ',
      dataIndex: 'error_rate',
      key: 'error_rate',
      render: (rate) => (typeof rate === 'number' ? `${(rate * 100).toFixed(1)}%` : '0%'),
    },
  ];

  const clampPercent = (v) => {
    const n = Number(v);
    if (Number.isNaN(n)) return 0;
    return Math.max(0, Math.min(100, n));
  };

  const renderUsageProgress = (percent = 0, threshold = 80) => {
    const p = clampPercent(percent);
    const isOver = p >= threshold;
    return (
      <Progress
        percent={p}
        showInfo
        status={isOver ? 'exception' : 'active'}
        strokeColor={isOver ? 'rgba(255,59,92,0.95)' : 'rgba(0,255,136,0.95)'}
      />
    );
  };

  const cpu = clampPercent(systemMetrics?.cpu_percent || 0);
  const mem = clampPercent(systemMetrics?.memory_usage || 0);
  const disk = clampPercent(systemMetrics?.disk_usage || 0);

  const overallStatus = healthData?.status || healthData?.overall_status || null;
  const showAlert =
    overallStatus && String(overallStatus).toLowerCase() !== 'healthy' && String(overallStatus).toLowerCase() !== 'ok';

  if (loading) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 14 }}>
        <Card loading bordered style={{ borderRadius: 18 }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 14 }}>
      <div
        style={{
          borderRadius: 22,
          padding: 16,
          border: '1px solid rgba(56,189,248,0.18)',
          background: 'linear-gradient(135deg, rgba(2,6,23,0.95), rgba(8,47,73,0.70))',
          boxShadow: '0 20px 60px rgba(2,6,23,0.72)',
        }}
      >
        <div style={{ color: 'rgba(226,232,240,0.98)', fontWeight: 950, fontSize: 20 }}>Monitoring Dashboard</div>
        <div style={{ marginTop: 6, color: 'rgba(148,163,184,0.95)' }}>
          مراقبة صحة النظام، المقاييس والعمليات — بدون تغيير أي منطق للباك-إند.
        </div>
      </div>

      {showAlert ? (
        <div style={{ marginTop: 12 }}>
          <Alert
            message="تحذير"
            description={`حالة النظام الحالية: ${String(overallStatus)}`}
            type="warning"
            showIcon
          />
        </div>
      ) : null}

      {/* مؤشرات الموارد */}
      <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
        <Col xs={24} md={8}>
          <Card bordered style={{ borderRadius: 18 }}>
            <Statistic title="CPU %" value={cpu} suffix="%" />
            <div style={{ marginTop: 10 }}>{renderUsageProgress(cpu, 80)}</div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card bordered style={{ borderRadius: 18 }}>
            <Statistic title="Memory %" value={mem} suffix="%" />
            <div style={{ marginTop: 10 }}>{renderUsageProgress(mem, 80)}</div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card bordered style={{ borderRadius: 18 }}>
            <Statistic title="Disk %" value={disk} suffix="%" />
            <div style={{ marginTop: 10 }}>{renderUsageProgress(disk, 90)}</div>
          </Card>
        </Col>
      </Row>

      {/* جدول خدمات النظام */}
      <div style={{ marginTop: 12 }}>
        <Card title="خدمات النظام" bordered style={{ borderRadius: 18 }}>
          <Table
            columns={serviceColumns}
            dataSource={services}
            rowKey={(row) => row?.id || row?.name || `${row?.status}-${row?.last_check}`}
            pagination={false}
            size="small"
          />
        </Card>
      </div>

      {/* جدول أداء العمليات */}
      <div style={{ marginTop: 12 }}>
        <Card title="أداء العمليات" bordered style={{ borderRadius: 18 }}>
          <Table
            columns={performanceColumns}
            dataSource={normalizedPerformance}
            rowKey={(row) => row?.key || row?.operation}
            pagination={false}
            size="small"
          />
        </Card>
      </div>

      {/* مخطط Recharts لأداء العمليات */}
      <div style={{ marginTop: 12 }}>
        <Card title="Performance Chart" bordered style={{ borderRadius: 18 }}>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={normalizedPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="operation" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="avg_time" name="Avg Time" dot={false} />
                <Line type="monotone" dataKey="max_time" name="Max Time" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MonitoringDashboard;
