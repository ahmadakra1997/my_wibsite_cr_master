import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Alert,
  Table,
  Tag,
  Progress,
} from 'antd';
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

  // جلب بيانات الصحة والأداء من الـ Backend (نفس المسارات الموجودة في الكود الأصلي) :contentReference[oaicite:6]{index=6}
  useEffect(() => {
    const fetchMonitoringData = async () => {
      try {
        setLoading(true);

        const healthResponse = await fetch('/api/health/status');
        const healthJson = await healthResponse.json();
        setHealthData(healthJson);

        if (healthJson && healthJson.system_metrics) {
          setSystemMetrics(healthJson.system_metrics);
        }

        const performanceResponse = await fetch(
          '/api/performance/summary'
        );
        const performanceJson = await performanceResponse.json();
        setPerformanceData(performanceJson);
      } catch (error) {
        console.error('Error fetching monitoring data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMonitoringData();
    const interval = setInterval(fetchMonitoringData, 30000); // كل 30 ثانية
    return () => clearInterval(interval);
  }, []);

  const services = healthData?.services || [];

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
    {
      title: 'الخدمة',
      dataIndex: 'name',
      key: 'name',
    },
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
        }

        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: 'وقت الاستجابة (ثانية)',
      dataIndex: 'response_time',
      key: 'response_time',
      render: (time) =>
        typeof time === 'number' ? time.toFixed(3) : 'N/A',
    },
    {
      title: 'آخر فحص',
      dataIndex: 'last_check',
      key: 'last_check',
      render: (time) =>
        time ? new Date(time).toLocaleString('ar-EG') : 'N/A',
    },
  ];

  const performanceColumns = [
    {
      title: 'العملية',
      dataIndex: 'operation',
      key: 'operation',
    },
    {
      title: 'متوسط الوقت (ثانية)',
      dataIndex: 'avg_time',
      key: 'avg_time',
      render: (time) =>
        typeof time === 'number' ? time.toFixed(3) : 'N/A',
    },
    {
      title: 'أقصى وقت (ثانية)',
      dataIndex: 'max_time',
      key: 'max_time',
      render: (time) =>
        typeof time === 'number' ? time.toFixed(3) : 'N/A',
    },
    {
      title: 'معدل الخطأ',
      dataIndex: 'error_rate',
      key: 'error_rate',
      render: (rate) =>
        typeof rate === 'number'
          ? `${(rate * 100).toFixed(1)}%`
          : '0%',
    },
  ];

  const renderUsageProgress = (percent = 0, threshold) => (
    <Progress
      percent={Math.round(percent)}
      strokeColor={percent > threshold ? '#cf1322' : '#3f8600'}
    />
  );

  if (loading) {
    return (
      <div className="monitoring-dashboard">
        <Card>
          <Statistic
            title="تحميل لوحة المراقبة"
            value="جارٍ تحديث بيانات النظام..."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="monitoring-dashboard">
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Alert
            type={
              healthData?.status === 'healthy' ? 'success' : 'warning'
            }
            message={
              healthData?.status === 'healthy'
                ? 'النظام يعمل بشكل سليم'
                : 'تحذير في صحة النظام'
            }
            description={healthData?.message}
            showIcon
          />
        </Col>

        {/* مؤشرات الموارد */}
        <Col xs={24} md={8}>
          <Card title="استخدام المعالج (CPU)">
            {renderUsageProgress(systemMetrics.cpu_percent || 0, 80)}
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="استخدام الذاكرة (RAM)">
            {renderUsageProgress(systemMetrics.memory_usage || 0, 80)}
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="استخدام القرص (Disk)">
            {renderUsageProgress(systemMetrics.disk_usage || 0, 90)}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* جدول خدمات النظام */}
        <Col xs={24} md={12}>
          <Card title="خدمات النظام">
            <Table
              dataSource={services}
              columns={serviceColumns}
              rowKey="name"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        {/* جدول أداء العمليات */}
        <Col xs={24} md={12}>
          <Card title="أداء العمليات الحرجة">
            <Table
              dataSource={normalizedPerformance}
              columns={performanceColumns}
              rowKey={(row) => row.key || row.operation}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* مخطط Recharts لأداء العمليات */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card title="تطوّر زمن التنفيذ ومعدل الخطأ">
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <LineChart data={normalizedPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="operation" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="avg_time"
                    name="متوسط الوقت"
                    stroke="#00a3ff"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="max_time"
                    name="أقصى وقت"
                    stroke="#ff4d4f"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default MonitoringDashboard;
