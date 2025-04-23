import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, ButtonGroup, Button, Table, Form, InputGroup, Modal } from 'react-bootstrap';
import { Line, Pie } from 'react-chartjs-2';
import axios from 'axios';
import { API_ENDPOINTS, STORAGE_KEYS } from '../../constants';
import { FaChartLine, FaUsers, FaShoppingCart, FaUserTie, FaHistory, FaSearch, FaSort, FaReceipt } from 'react-icons/fa';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

// Cache for menu items
let menuItemsCache = [];

// Cache for user data
let userDataCache = new Map();

// Function to fetch menu items
const fetchMenuItems = async () => {
    try {
        const token = sessionStorage.getItem(STORAGE_KEYS.TOKEN);
        const response = await axios.get(`/api/kitchen/menu`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.data) {
            // Keep array for pie chart
            menuItemsCache = response.data;
            
            // Create map for quick price lookups
            const menuMap = response.data.reduce((acc, item) => {
                acc[item.food_id] = item;
                return acc;
            }, {});
            userDataCache.set('menuItemsMap', menuMap);
        }
    } catch (error) {
        console.error('Error fetching menu items:', error);
    }
};

// Function to get food details by ID
const getFoodDetails = (foodId) => {
    return userDataCache.get('menuItemsMap')[foodId] || { name: `Food ${foodId}`, price: 0 };
};

// Function to get food name by ID
const getFoodNameById = (foodId) => {
    const item = menuItemsCache.find(item => item.food_id === foodId);
    return item ? item.name : `Food ${foodId}`;
};

// Function to fetch user data
const fetchUserData = async (userId, token) => {
    try {
        if (userDataCache.has(userId)) {
            return userDataCache.get(userId);
        }

        const response = await axios.get(`/api/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.data) {
            userDataCache.set(userId, response.data);
            return response.data;
        }
        return null;
    } catch (error) {
        console.error(`Error fetching user data for ID ${userId}:`, error);
        return null;
    }
};

const Dashboard = () => {
    const [timeRange, setTimeRange] = useState('week');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [revenueData, setRevenueData] = useState({
        week: { labels: [], data: [] },
        month: { labels: [], data: [] },
        year: { labels: [], data: [] }
    });
    const [statistics, setStatistics] = useState({
        total_sales: 0,
        total_customers: 0,
        total_orders: 0
    });
    const [topFoods, setTopFoods] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [employeeSummary, setEmployeeSummary] = useState([]);
    const [usersData, setUsersData] = useState([]);
    const [purchaseHistory, setPurchaseHistory] = useState([]);
    const [filteredPurchaseHistory, setFilteredPurchaseHistory] = useState([]);
    const [searchPhone, setSearchPhone] = useState('');
    const [sortConfig, setSortConfig] = useState({
        key: 'payment_date',
        direction: 'desc'
    });
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderDetails, setOrderDetails] = useState(null);
    const [menuItemsCache, setMenuItemsCache] = useState([]);
    const [menuItemsMap, setMenuItemsMap] = useState({});

    // Helper function to format currency in VND
    const formatVND = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const fetchStatistics = async () => {
        try {
            const token = sessionStorage.getItem(STORAGE_KEYS.TOKEN);
            if (!token) {
                throw new Error('No authentication token found');
            }

            // First fetch menu items to populate the cache
            await fetchMenuItems();

            const response = await axios.get(`${API_ENDPOINTS.REPORTS}/statistics/dashboard-summary`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            // Map food names to the top foods data
            const topFoodsWithNames = response.data.top_foods.map(food => ({
                ...food,
                food_name: getFoodNameById(food.food_id)
            }));
            
            setStatistics(response.data.statistics);
            setTopFoods(topFoodsWithNames);
        } catch (error) {
            console.error('Error fetching statistics:', error);
        }
    };

    const fetchRevenueData = async (range) => {
        try {
            const token = sessionStorage.getItem(STORAGE_KEYS.TOKEN);
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await axios.get(`${API_ENDPOINTS.REPORTS}/revenue/${range}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = response.data;
            
            setRevenueData(prev => ({
                ...prev,
                [range]: {
                    labels: data.map(item => item.date),
                    data: data.map(item => item.revenue)
                }
            }));
        } catch (error) {
            console.error('Error fetching revenue data:', error);
            // Add error handling UI feedback here if needed
        }
    };

    const fetchUsersData = async () => {
        try {
            const token = sessionStorage.getItem(STORAGE_KEYS.TOKEN);
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await axios.get('/api/users/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setUsersData(response.data);
        } catch (error) {
            console.error('Error fetching users data:', error);
        }
    };

    const fetchEmployeeSummary = async () => {
        try {
            const token = sessionStorage.getItem(STORAGE_KEYS.TOKEN);
            if (!token) {
                throw new Error('No authentication token found');
            }

            const [summaryResponse] = await Promise.all([
                axios.get(`${API_ENDPOINTS.REPORTS}/statistics/employee-summary`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }),
                fetchUsersData()
            ]);
            
            setEmployeeSummary(summaryResponse.data.employee_summaries);
        } catch (error) {
            console.error('Error fetching employee summary:', error);
        }
    };

    const fetchPurchaseHistory = async (phoneNumber = '') => {
        try {
            const token = sessionStorage.getItem(STORAGE_KEYS.TOKEN);
            if (!token) {
                throw new Error('No authentication token found');
            }

            const endpoint = phoneNumber 
                ? `${API_ENDPOINTS.REPORTS}/payments/customer/${phoneNumber}`
                : `${API_ENDPOINTS.REPORTS}/payments/history`;

            const response = await axios.get(endpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = response.data;
            setPurchaseHistory(data);
            setFilteredPurchaseHistory(data);
        } catch (error) {
            console.error('Error fetching purchase history:', error);
        }
    };

    // Handle search
    const handleSearch = (value) => {
        setSearchPhone(value);
        if (value.trim() === '') {
            setFilteredPurchaseHistory(purchaseHistory);
        } else {
            const filtered = purchaseHistory.filter(purchase => 
                purchase.customer_phone.includes(value.trim())
            );
            setFilteredPurchaseHistory(filtered);
        }
    };

    // Handle sorting
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });

        const sortedData = [...filteredPurchaseHistory].sort((a, b) => {
            if (key === 'payment_date') {
                return direction === 'asc' 
                    ? new Date(a[key]) - new Date(b[key])
                    : new Date(b[key]) - new Date(a[key]);
            }
            if (key === 'amount') {
                return direction === 'asc' 
                    ? a[key] - b[key]
                    : b[key] - a[key];
            }
            return 0;
        });

        setFilteredPurchaseHistory(sortedData);
    };

    // Get sort icon
    const getSortIcon = (key) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'asc' ? '↑' : '↓';
        }
        return '↕';
    };

    const handleOrderClick = async (order) => {
        try {
            setSelectedOrder(order);
            setShowOrderModal(true);
            setOrderDetails(null);

            const token = sessionStorage.getItem(STORAGE_KEYS.TOKEN);
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Ensure menu items are loaded first
            await fetchMenuItems();

            // Fetch order details
            const response = await axios.get(`/api/orders/${order.order_completed_id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            // Calculate item totals using menu items prices and include customer info from purchase history
            const orderDetailsWithPrices = {
                ...response.data,
                customer_name: order.customer_name,
                customer_phone: order.customer_phone || order.phone_number, // Try both possible property names
                payment_date: order.payment_date,
                payment_id: order.payment_id,
                amount_paid: order.amount,
                items: response.data.items.map(item => {
                    const foodDetails = getFoodDetails(item.food_id);
                    return {
                        ...item,
                        name: foodDetails.name,
                        price: foodDetails.price,
                        total: foodDetails.price * item.quantity
                    };
                })
            };
            
            setOrderDetails(orderDetailsWithPrices);
        } catch (error) {
            console.error('Error fetching order details:', error);
            setOrderDetails({ error: 'Failed to load order details' });
        }
    };

    const handleCloseModal = () => {
        setShowOrderModal(false);
        setSelectedOrder(null);
        setOrderDetails(null);
    };

    useEffect(() => {
        const fetchAllData = async () => {
            setIsLoading(true);
            await Promise.all([
                fetchRevenueData('week'),
                fetchRevenueData('month'),
                fetchRevenueData('year'),
                fetchStatistics(),
                fetchEmployeeSummary(),
                fetchPurchaseHistory(),
                fetchMenuItems() // Add menu items fetch
            ]);
            setIsLoading(false);
        };

        fetchAllData();
    }, [currentDate]);

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

    // Enhanced chart styles
    const chartData = {
        labels: revenueData[timeRange].labels,
        datasets: [{
            label: 'Doanh thu',
            data: revenueData[timeRange].data,
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#4CAF50',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#4CAF50',
            pointRadius: 4,
            pointHoverRadius: 6
        }]
    };

    const topFoodsChartData = {
        labels: topFoods.map(food => food.food_name),
        datasets: [{
            data: topFoods.map(food => food.total_quantity),
            backgroundColor: [
                'rgba(255, 99, 132, 0.8)',
                'rgba(54, 162, 235, 0.8)',
                'rgba(255, 206, 86, 0.8)',
                'rgba(75, 192, 192, 0.8)',
                'rgba(153, 102, 255, 0.8)'
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)'
            ],
            borderWidth: 2
        }]
    };

    return (
        <Container fluid className="p-4" style={{ background: '#f8f9fa' }}>
            <h2 className="mb-4 fw-bold" style={{ color: '#2c3e50' }}>Dashboard Overview</h2>
            <Row className="g-4 mb-4">
                {/* Enhanced Statistics Cards */}
                <Col md={4}>
                    <Card className="h-100 border-0 shadow-sm" 
                          style={{ 
                              background: 'linear-gradient(135deg, #6B8DD6 0%, #8E37D7 100%)',
                              borderRadius: '15px' 
                          }}>
                        <Card.Body className="d-flex flex-column">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <div>
                                    <h6 className="text-white-50 mb-2">Total Sales</h6>
                                    <h3 className="text-white mb-0">{formatVND(statistics.total_sales)}</h3>
                                </div>
                                <div className="rounded-circle bg-white bg-opacity-25 p-3">
                                    <FaChartLine size={24} color="white" />
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="h-100 border-0 shadow-sm" 
                          style={{ 
                              background: 'linear-gradient(135deg, #42E695 0%, #3BB2B8 100%)',
                              borderRadius: '15px'
                          }}>
                        <Card.Body className="d-flex flex-column">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <div>
                                    <h6 className="text-white-50 mb-2">Total Customers</h6>
                                    <h3 className="text-white mb-0">{statistics.total_customers.toLocaleString()}</h3>
                                </div>
                                <div className="rounded-circle bg-white bg-opacity-25 p-3">
                                    <FaUsers size={24} color="white" />
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="h-100 border-0 shadow-sm" 
                          style={{ 
                              background: 'linear-gradient(135deg, #FF9F43 0%, #FF5E62 100%)',
                              borderRadius: '15px'
                          }}>
                        <Card.Body className="d-flex flex-column">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <div>
                                    <h6 className="text-white-50 mb-2">Total Orders</h6>
                                    <h3 className="text-white mb-0">{statistics.total_orders.toLocaleString()}</h3>
                                </div>
                                <div className="rounded-circle bg-white bg-opacity-25 p-3">
                                    <FaShoppingCart size={24} color="white" />
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            <Row className="g-4">
                {/* Enhanced Revenue Chart */}
                <Col md={8}>
                    <Card className="border-0 shadow-sm" style={{ borderRadius: '15px' }}>
                        <Card.Body className="p-4">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <Card.Title className="fw-bold" style={{ color: '#2c3e50' }}>Revenue Overview</Card.Title>
                                <ButtonGroup className="shadow-sm">
                                    {['Week', 'Month', 'Year'].map((range) => (
                                        <Button 
                                            key={range.toLowerCase()}
                                            variant={timeRange === range.toLowerCase() ? 'primary' : 'light'}
                                            onClick={() => setTimeRange(range.toLowerCase())}
                                            className="px-4"
                                            style={{
                                                borderRadius: range === 'Week' ? '20px 0 0 20px' : 
                                                           range === 'Year' ? '0 20px 20px 0' : '0',
                                                border: 'none'
                                            }}
                                        >
                                            {range}
                                        </Button>
                                    ))}
                                </ButtonGroup>
                            </div>
                            {isLoading ? (
                                <div className="text-center p-5">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : (
                                <Line 
                                    data={chartData}
                                    options={{
                                        responsive: true,
                                        plugins: {
                                            legend: { 
                                                position: 'top',
                                                labels: {
                                                    usePointStyle: true,
                                                    font: {
                                                        size: 12,
                                                        family: "'Segoe UI', sans-serif"
                                                    }
                                                }
                                            },
                                            tooltip: {
                                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                titleColor: '#2c3e50',
                                                bodyColor: '#2c3e50',
                                                borderColor: '#e9ecef',
                                                borderWidth: 1,
                                                padding: 12,
                                                boxPadding: 6,
                                                usePointStyle: true,
                                                callbacks: {
                                                    label: (context) => {
                                                        let label = context.dataset.label || '';
                                                        if (label) label += ': ';
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
                                                beginAtZero: true,
                                                grid: {
                                                    drawBorder: false,
                                                    color: 'rgba(0, 0, 0, 0.05)'
                                                },
                                                ticks: {
                                                    callback: value => formatVND(value),
                                                    font: {
                                                        size: 11
                                                    }
                                                }
                                            },
                                            x: {
                                                grid: {
                                                    display: false
                                                },
                                                ticks: {
                                                    font: {
                                                        size: 11
                                                    }
                                                }
                                            }
                                        },
                                        elements: {
                                            line: {
                                                borderWidth: 2
                                            }
                                        }
                                    }}
                                />
                            )}
                        </Card.Body>
                    </Card>
                </Col>
                {/* Enhanced Top Foods Pie Chart */}
                <Col md={4}>
                    <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '15px' }}>
                        <Card.Body className="p-4">
                            <Card.Title className="fw-bold mb-4" style={{ color: '#2c3e50' }}>
                                Top 5 Most Ordered Foods
                            </Card.Title>
                            {isLoading ? (
                                <div className="text-center p-5">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <Pie 
                                        data={topFoodsChartData}
                                        options={{
                                            responsive: true,
                                            plugins: {
                                                legend: {
                                                    position: 'bottom',
                                                    labels: {
                                                        usePointStyle: true,
                                                        padding: 20,
                                                        font: {
                                                            size: 11,
                                                            family: "'Segoe UI', sans-serif"
                                                        }
                                                    }
                                                },
                                                tooltip: {
                                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                    titleColor: '#2c3e50',
                                                    bodyColor: '#2c3e50',
                                                    borderColor: '#e9ecef',
                                                    borderWidth: 1,
                                                    padding: 12,
                                                    boxPadding: 6,
                                                    usePointStyle: true,
                                                    callbacks: {
                                                        label: (context) => {
                                                            const food = topFoods[context.dataIndex];
                                                            return [
                                                                `${food.food_name}`,
                                                                `Quantity: ${food.total_quantity}`,
                                                                `Orders: ${food.order_count}`
                                                            ];
                                                        }
                                                    }
                                                }
                                            },
                                            cutout: '60%',
                                            radius: '90%'
                                        }}
                                    />
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            <Row className="mt-4">
                <Col xs={12}>
                    <Card className="border-0 shadow-sm" style={{ borderRadius: '15px' }}>
                        <Card.Body className="p-4">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <Card.Title className="fw-bold" style={{ color: '#2c3e50' }}>
                                    <FaUserTie className="me-2" />
                                    Employee Performance Summary
                                </Card.Title>
                            </div>
                            {isLoading ? (
                                <div className="text-center p-5">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <Table hover className="align-middle">
                                        <thead className="bg-light">
                                            <tr>
                                                <th>Employee</th>
                                                <th>Role</th>
                                                <th>Total Orders</th>
                                                <th>Total Revenue</th>
                                                <th>Average Order Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {employeeSummary.map((employee) => {
                                                const userData = usersData.find(user => user.user_id === employee.employee_id);
                                                return (
                                                    <tr key={employee.employee_id}>
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <div className="ms-2">
                                                                    <div className="fw-bold">
                                                                        {userData ? userData.name : `Employee #${employee.employee_id}`}
                                                                    </div>
                                                                    <div className="text-muted small">
                                                                        {userData?.mail}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className="badge bg-info">
                                                                {userData?.role || 'N/A'}
                                                            </span>
                                                        </td>
                                                        <td>{employee.total_orders.toLocaleString()}</td>
                                                        <td>{formatVND(employee.total_revenue)}</td>
                                                        <td>{formatVND(employee.average_order_value)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </Table>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            <Row className="mt-4">
                <Col xs={12}>
                    <Card className="border-0 shadow-sm" style={{ borderRadius: '15px' }}>
                        <Card.Body className="p-4">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <Card.Title className="fw-bold" style={{ color: '#2c3e50' }}>
                                    <FaHistory className="me-2" />
                                    Purchase History
                                </Card.Title>
                                {/* Search and Sort Controls */}
                                <Row className="mb-8">
                                    <Col md={6}>
                                        <InputGroup>
                                            <InputGroup.Text>
                                                <FaSearch />
                                            </InputGroup.Text>
                                            <Form.Control
                                                placeholder="Phone number..."
                                                value={searchPhone}
                                                onChange={(e) => handleSearch(e.target.value)}
                                            />
                                        </InputGroup>
                                    </Col>
                                    <Col md={6} className="d-flex justify-content-end">
                                        <ButtonGroup>
                                            <Button 
                                                variant="outline-secondary"
                                                onClick={() => handleSort('amount')}
                                            >
                                                Amount {getSortIcon('amount')}
                                            </Button>
                                            <Button 
                                                variant="outline-secondary"
                                                onClick={() => handleSort('payment_date')}
                                            >
                                                Date {getSortIcon('payment_date')}
                                            </Button>
                                        </ButtonGroup>
                                    </Col>
                                </Row>
                            </div>

                            {isLoading ? (
                                <div className="text-center p-5">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                    <Table hover className="align-middle">
                                        <thead className="bg-light sticky-top">
                                            <tr>
                                                <th>Order ID</th>
                                                <th>Customer Name</th>
                                                <th>Phone Number</th>
                                                <th>Amount</th>
                                                <th>Payment Date</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredPurchaseHistory && filteredPurchaseHistory.length > 0 ? (
                                                filteredPurchaseHistory.map((purchase) => (
                                                    <tr 
                                                        key={purchase.payment_id}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <td>#{purchase.order_completed_id}</td>
                                                        <td>{purchase.customer_name}</td>
                                                        <td>{purchase.customer_phone}</td>
                                                        <td>{formatVND(purchase.amount)}</td>
                                                        <td>
                                                            {new Date(purchase.payment_date).toLocaleString('vi-VN')}
                                                        </td>
                                                        <td>
                                                            <Button
                                                                variant="outline-info"
                                                                size="sm"
                                                                onClick={() => handleOrderClick(purchase)}
                                                            >
                                                                <FaReceipt /> View Details
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="6" className="text-center">
                                                        No purchase history found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Order Details Modal */}
            <Modal
                show={showOrderModal}
                onHide={handleCloseModal}
                size="lg"
                centered
            >
                <Modal.Header closeButton className="border-bottom">
                    <Modal.Title>
                        <FaReceipt className="me-2" />
                        Order Details #{selectedOrder?.order_completed_id}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {!orderDetails ? (
                        <div className="text-center p-4">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : orderDetails.error ? (
                        <div className="text-center text-danger">
                            {orderDetails.error}
                        </div>
                    ) : (
                        <div>
                            <div className="mb-4">
                                <h5 className="mb-3 border-bottom pb-2">Customer Information</h5>
                                <Row>
                                    <Col md={6}>
                                        <Table borderless>
                                            <tbody>
                                                <tr>
                                                    <td className="fw-bold text-muted" width="150">Name:</td>
                                                    <td>{orderDetails.customer_name || 'N/A'}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-bold text-muted">Phone:</td>
                                                    <td>{orderDetails.customer_phone || 'N/A'}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-bold text-muted">Table:</td>
                                                    <td>#{orderDetails.table_id}</td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                    </Col>
                                    <Col md={6}>
                                        <Table borderless>
                                            <tbody>
                                                <tr>
                                                    <td className="fw-bold text-muted">Payment Date:</td>
                                                    <td>{new Date(orderDetails.payment_date).toLocaleString('vi-VN')}</td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                    </Col>
                                </Row>
                            </div>

                            <div className="mb-4">
                                <h5 className="mb-3 border-bottom pb-2">Order Items</h5>
                                <Table bordered hover>
                                    <thead className="bg-light">
                                        <tr>
                                            <th>Item</th>
                                            <th className="text-center" width="100">Quantity</th>
                                            <th className="text-end" width="150">Price</th>
                                            <th className="text-end" width="150">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orderDetails.items && orderDetails.items.map((item, index) => (
                                            <tr key={index}>
                                                <td>{item.name}</td>
                                                <td className="text-center">{item.quantity}</td>
                                                <td className="text-end">{formatVND(item.price)}</td>
                                                <td className="text-end">{formatVND(item.total)}</td>
                                            </tr>
                                        ))}
                                        <tr className="fw-bold">
                                            <td colSpan="3" className="text-end">Total Amount:</td>
                                            <td className="text-end">{formatVND(orderDetails.amount_paid)}</td>
                                        </tr>
                                    </tbody>
                                </Table>
                            </div>

                            <div className="text-end text-muted">
                                <small>Payment ID: #{orderDetails.payment_id}</small>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-top">
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
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