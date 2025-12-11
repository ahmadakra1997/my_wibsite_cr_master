import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Alert, Table, Tag, Progress } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MonitoringDashboard = () => {
    const [healthData, setHealthData] = useState({});
    const [performanceData, setPerformanceData] = useState([]);
    const [systemMetrics, setSystemMetrics] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMonitoringData = async () => {
            try {
                setLoading(true);
                
                // جلب بيانات الصحة
                const healthResponse = await fetch('/api/health/status');
                const healthData = await healthResponse.json();
                setHealthData(healthData);
                
                // جلب بيانات الأداء
                const performanceResponse = await fetch('/api/performance/summary');
                const performanceData = await performanceResponse.json();
                setPerformanceData(performanceData);
                
                // تحديث مقاييس النظام من بيانات الصحة
                if (healthData.system_metrics) {
                    setSystemMetrics(healthData.system_metrics);
                }
                
            } catch (error) {
                console.error('Error fetching monitoring data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMonitoringData();
        
        const interval = setInterval(fetchMonitoringData, 30000); // تحديث كل 30 ثانية

        return () => clearInterval(interval);
    }, []);

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
            render: (status) => (
                <Tag color={status === 'healthy' ? 'green' : status === 'degraded' ? 'orange' : 'red'}>
                    {status === 'healthy' ? 'سليم' : status === 'degraded' ? 'متدني' : 'خطأ'}
                </Tag>
            ),
        },
        {
            title: 'وقت الاستجابة (ثانية)',
            dataIndex: 'response_time',
            key: 'response_time',
            render: (time) => time ? time.toFixed(3) : 'N/A',
        },
        {
            title: 'آخر فحص',
            dataIndex: 'last_check',
            key: 'last_check',
            render: (time) => time ? new Date(time).toLocaleString('ar-EG') : 'N/A',
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
            render: (time) => time ? time.toFixed(3) : 'N/A',
        },
        {
            title: 'أقصى وقت (ثانية)',
            dataIndex: 'max_time',
            key: 'max_time',
            render: (time) => time ? time.toFixed(3) : 'N/A',
        },
        {
            title: 'معدل الخطأ',
            dataIndex: 'error_rate',
            key: 'error_rate',
            render: (rate) => rate ? `${(rate * 100).toFixed(1)}%` : '0%',
        },
    ];

    if (loading) {
        return (
            <div style={{ padding: '24px', textAlign: 'center' }}>
                <Alert message="جاري تحميل بيانات المراقبة..." type="info" />
            </div>
        );
    }

    return (
        <div style={{ padding: '24px' }}>
            <Row gutter={[16, 16]}>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="الحالة العامة"
                            value={healthData.overall_status === 'healthy' ? 'سليم' : 'متدني'}
                            valueStyle={{ 
                                color: healthData.overall_status === 'healthy' ? '#3f8600' : '#cf1322' 
                            }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="استخدام CPU"
                            value={systemMetrics.cpu_percent || 0}
                            suffix="%"
                            valueStyle={{ 
                                color: (systemMetrics.cpu_percent || 0) > 80 ? '#cf1322' : '#3f8600' 
                            }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="استخدام الذاكرة"
                            value={systemMetrics.memory_usage || 0}
                            suffix="%"
                            valueStyle={{ 
                                color: (systemMetrics.memory_usage || 0) > 80 ? '#cf1322' : '#3f8600' 
                            }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="الخدمات النشطة"
                            value={Object.keys(healthData.services_health || {}).length}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
                <Col span={12}>
                    <Card title="أداء النظام" bordered={false}>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={performanceData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="timestamp" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line 
                                    type="monotone" 
                                    dataKey="execution_time" 
                                    stroke="#8884d8" 
                                    name="وقت التنفيذ (ثانية)"
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="memory_used" 
                                    stroke="#82ca9d" 
                                    name="الذاكرة المستخدمة (بايت)"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
                <Col span={12}>
                    <Card title="صحة الخدمات" bordered={false}>
                        <Table 
                            columns={serviceColumns} 
                            dataSource={Object.values(healthData.services_health || {})}
                            pagination={false}
                            size="small"
                            scroll={{ y: 240 }}
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
                <Col span={24}>
                    <Card title="مقاييس النظام" bordered={false}>
                        <Row gutter={[16, 16]}>
                            <Col span={8}>
                                <Progress 
                                    type="circle" 
                                    percent={systemMetrics.cpu_percent || 0} 
                                    format={percent => `CPU: ${percent}%`}
                                    status={(systemMetrics.cpu_percent || 0) > 80 ? 'exception' : 'normal'}
                                />
                            </Col>
                            <Col span={8}>
                                <Progress 
                                    type="circle" 
                                    percent={systemMetrics.memory_usage || 0} 
                                    format={percent => `Memory: ${percent}%`}
                                    status={(systemMetrics.memory_usage || 0) > 80 ? 'exception' : 'normal'}
                                />
                            </Col>
                            <Col span={8}>
                                <Progress 
                                    type="circle" 
                                    percent={systemMetrics.disk_usage || 0} 
                                    format={percent => `Disk: ${percent}%`}
                                    status={(systemMetrics.disk_usage || 0) > 90 ? 'exception' : 'normal'}
                                />
                            </Col>
                        </Row>
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
                <Col span={24}>
                    <Card title="ملخص الأداء" bordered={false}>
                        <Table 
                            columns={performanceColumns} 
                            dataSource={Object.entries(performanceData).map(([key, value]) => ({
                                key,
                                operation: key,
                                ...value
                            }))}
                            pagination={false}
                            size="small"
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default MonitoringDashboard;
