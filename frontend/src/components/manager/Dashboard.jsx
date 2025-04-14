import React, { useState } from 'react';
import { Container, Row, Col, Card, ButtonGroup, Button } from 'react-bootstrap';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const Dashboard = () => {
    const [timeRange, setTimeRange] = useState('week');
    const [currentDate, setCurrentDate] = useState(new Date());

    // Helper function to format currency in VND
    const formatVND = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const handleDateChange = (direction) => {
        const newDate = new Date(currentDate);
        switch (timeRange) {
            case 'week':
                newDate.setDate(currentDate.getDate() + (direction * 7));
                break;
            case 'month':
                newDate.setMonth(currentDate.getMonth() + direction);
                break;
            case 'year':
                newDate.setFullYear(currentDate.getFullYear() + direction);
                break;
        }
        setCurrentDate(newDate);
    };

    const getDates = (range) => {
        const dates = {
            labels: [],
            data: []
        };

        const startOfPeriod = new Date(currentDate);

        switch (range) {
            case 'week':
                startOfPeriod.setDate(currentDate.getDate() - currentDate.getDay());
                for (let i = 0; i < 7; i++) {
                    const date = new Date(startOfPeriod);
                    date.setDate(startOfPeriod.getDate() + i);
                    dates.labels.push(date.toLocaleDateString('vi-VN', { 
                        weekday: 'short', 
                        day: 'numeric', 
                        month: 'numeric' 
                    }));
                    dates.data.push(Math.floor(Math.random() * 2000000) + 1000000);
                }
                break;

            case 'month':
                startOfPeriod.setDate(1);
                const daysInMonth = new Date(startOfPeriod.getFullYear(), startOfPeriod.getMonth() + 1, 0).getDate();
                const weeksInMonth = Math.ceil(daysInMonth / 7);
                
                for (let i = 0; i < weeksInMonth; i++) {
                    const weekStart = new Date(startOfPeriod.getFullYear(), startOfPeriod.getMonth(), i * 7 + 1);
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(Math.min(weekStart.getDate() + 6, daysInMonth));

                    dates.labels.push(
                        `${weekStart.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })} - ` +
                        `${weekEnd.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })}`
                    );
                    dates.data.push(Math.floor(Math.random() * 5000000) + 10000000);
                }
                break;

            case 'year':
                startOfPeriod.setMonth(0, 1);
                for (let i = 0; i < 12; i++) {
                    const date = new Date(startOfPeriod.getFullYear(), i, 1);
                    dates.labels.push(date.toLocaleDateString('vi-VN', { 
                        month: 'numeric', 
                        year: 'numeric' 
                    }));
                    dates.data.push(Math.floor(Math.random() * 20000000) + 40000000);
                }
                break;
        }
        return dates;
    };

    // Update revenueData to use the new getDates function
    const revenueData = {
        week: getDates('week'),
        month: getDates('month'),
        year: getDates('year')
    };

    // Top Ordered Items Data
    const topItemsData = {
        labels: ['Soup Base', 'Signature Food', 'Meat', 'Side Dish', 'Beverages & Dessert'],
        datasets: [{
            label: 'Món ăn được gọi nhiều nhất',
            data: [150, 120, 100, 80, 60],
            backgroundColor: [
                'rgba(255, 99, 132, 0.7)',    // Đỏ nhạt cho Soup Base
                'rgba(255, 159, 64, 0.7)',    // Cam cho Signature Food
                'rgba(153, 102, 255, 0.7)',   // Tím cho Meat
                'rgba(75, 192, 192, 0.7)',    // Xanh ngọc cho Side Dish
                'rgba(255, 205, 86, 0.7)',    // Vàng cho Beverages & Dessert
            ],
        }]
    };

    const revenueChartData = {
        labels: revenueData[timeRange].labels,
        datasets: [{
            label: 'Doanh thu',
            data: revenueData[timeRange].data,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        }]
    };

    return (
        <Container fluid>
            <h2 className="mb-4">Dashboard</h2>
            <Row className="g-4">
                {/* Revenue Chart */}
                <Col md={8}>
                    <Card>
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <Card.Title>Revenue Overview</Card.Title>
                                <div className="d-flex align-items-center">
                                    <Button 
                                        variant="outline-secondary" 
                                        className="me-2"
                                        onClick={() => handleDateChange(-1)}
                                    >
                                        Previous
                                    </Button>
                                    <ButtonGroup className="mx-2">
                                        <Button 
                                            variant={timeRange === 'week' ? 'primary' : 'outline-primary'}
                                            onClick={() => setTimeRange('week')}
                                        >
                                            Week
                                        </Button>
                                        <Button 
                                            variant={timeRange === 'month' ? 'primary' : 'outline-primary'}
                                            onClick={() => setTimeRange('month')}
                                        >
                                            Month
                                        </Button>
                                        <Button 
                                            variant={timeRange === 'year' ? 'primary' : 'outline-primary'}
                                            onClick={() => setTimeRange('year')}
                                        >
                                            Year
                                        </Button>
                                    </ButtonGroup>
                                    <Button 
                                        variant="outline-secondary" 
                                        className="ms-2"
                                        onClick={() => handleDateChange(1)}
                                    >
                                        Next
                                    </Button>
                                    <Button 
                                        variant="outline-secondary" 
                                        className="ms-2"
                                        onClick={() => setCurrentDate(new Date())}
                                    >
                                        Today
                                    </Button>
                                </div>
                            </div>
                            <Line 
                                data={revenueChartData}
                                options={{
                                    responsive: true,
                                    plugins: {
                                        legend: { position: 'top' },
                                        tooltip: {
                                            callbacks: {
                                                label: (context) => {
                                                    let label = context.dataset.label || '';
                                                    if (label) {
                                                        label += ': ';
                                                    }
                                                    if (context.parsed.y !== null) {
                                                        label += formatVND(context.parsed.y);
                                                    }
                                                    return label;
                                                }
                                            }
                                        }
                                    },
                                    scales: {
                                        y: {
                                            ticks: {
                                                callback: (value) => {
                                                    return formatVND(value);
                                                }
                                            }
                                        }
                                    }
                                }}
                            />
                        </Card.Body>
                    </Card>
                </Col>

                {/* Average Revenue per Customer KPI */}
                <Col md={4}>
                    <Card className="h-100">
                        <Card.Body className="d-flex flex-column justify-content-center align-items-center">
                            <Card.Title>Average Revenue per Customer</Card.Title>
                            <div className="text-center mt-4">
                                <h2 className="display-4 mb-0">{formatVND(45000)}</h2>
                                <p className="text-muted">mỗi khách hàng</p>
                                <div className="mt-3">
                                    <span className="text-success">
                                        <i className="fas fa-arrow-up"></i> 12%
                                    </span>
                                    <span className="text-muted ms-2">so với tháng trước</span>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Most Ordered Items */}
                <Col md={12}>
                    <Card>
                        <Card.Body>
                            <Card.Title>Thống kê món ăn</Card.Title>
                            <Bar 
                                data={topItemsData}
                                options={{
                                    responsive: true,
                                    plugins: {
                                        legend: { position: 'top' },
                                        tooltip: {
                                            callbacks: {
                                                label: (context) => {
                                                    return `Số lượng: ${context.parsed.y} món`;
                                                }
                                            }
                                        }
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            title: {
                                                display: true,
                                                text: 'Số lượng đã bán'
                                            }
                                        }
                                    }
                                }}
                            />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Dashboard;

// Add this function after getDates
    const getAverageRevenue = (range) => {
        const averages = {
            value: 0,
            percentage: 0
        };

        switch (range) {
            case 'week':
                averages.value = Math.floor(Math.random() * 100000) + 200000; // 200k-300k VND
                break;
            case 'month':
                averages.value = Math.floor(Math.random() * 200000) + 400000; // 400k-600k VND
                break;
            case 'year':
                averages.value = Math.floor(Math.random() * 500000) + 1000000; // 1M-1.5M VND
                break;
        }
        
        averages.percentage = Math.floor(Math.random() * 30) - 10; // -10% to +20%
        return averages;
    };