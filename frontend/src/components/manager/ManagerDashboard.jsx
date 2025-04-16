import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Navbar, Button, Nav, Card } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import UserList from './UserList';
import ActiveOrders from '../waiter/ActiveOrders';
import Dashboard from './Dashboard';
import AddFoodForm from './AddFoodForm';
import axios from 'axios';
import styles from '../../styles/ManagerDashboard.module.css'; // 
import { FaUsers, FaHome, FaChartBar, FaClipboardList, FaSignOutAlt, FaTools, FaUtensils, FaPlusCircle } from 'react-icons/fa';
import '../../styles/UserList.css';

// Placeholder components
const Overview = () => (
    <div className="text-center p-5">
        <FaTools size={50} className="text-muted mb-3" />
        <h3 className="text-muted">Overview Coming Soon</h3>
        <p className="text-muted">This feature is under development.</p>
    </div>
);

const MENU_ITEMS = [
    { id: 'main', label: 'Overview', icon: FaHome },
    { id: 'userlist', label: 'User Management', icon: FaUsers },
    { id: 'dashboard', label: 'Statistics', icon: FaChartBar },
    { id: 'activeOrder', label: 'Active Orders', icon: FaClipboardList }
];

const ManagerDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('main');
    const [staffCounts, setStaffCounts] = useState({
        waiters: 0,
        kitchen: 0,
        dayShift: 0,    // Add this
        nightShift: 0   // Add this
    });
    const [completedOrders, setCompletedOrders] = useState(0);

    // Add function to fetch completed orders
    const fetchCompletedOrders = async () => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) {
                navigate('/', { replace: true });
                return;
            }

            const response = await axios.get('/api/orders/completed/today', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setCompletedOrders(response.data.count);
        } catch (err) {
            console.error('Error fetching completed orders:', err);
        }
    };

    // Update useEffect
    useEffect(() => {
        fetchStaffCounts();
        fetchCompletedOrders();
    }, []);

    // Update fetchStaffCounts function
    const fetchStaffCounts = async () => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) {
                navigate('/', { replace: true });
                return;
            }

            const response = await axios.get('/api/users/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const counts = response.data.reduce((acc, user) => {
                // Count by role
                if (user.role === 'waiter') acc.waiters++;
                if (user.role === 'kitchen') acc.kitchen++;
                
                // Count by shift
                if (user.shifts === 'day') acc.dayShift++;
                if (user.shifts === 'night') acc.nightShift++;
                
                return acc;
            }, { waiters: 0, kitchen: 0, dayShift: 0, nightShift: 0 });

            setStaffCounts(counts);
        } catch (err) {
            console.error('Error fetching staff counts:', err);
        }
    };

    // Add useEffect to fetch counts when component mounts
    useEffect(() => {
        fetchStaffCounts();
    }, []);

    // Add this useEffect to set up the global update function
    useEffect(() => {
        window.updateManagerDashboard = fetchStaffCounts;
        
        // Cleanup function to remove the global function when component unmounts
        return () => {
            delete window.updateManagerDashboard;
        };
    }, []);

    const switchToWaiterMode = () => {
        // Store the manager role to allow switching back
        sessionStorage.setItem('previousRole', 'manager');
        navigate('/manager-waiter');
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'main':
                return (
                    <div>
                        <h2 className="mb-4">Dashboard Overview</h2>
                        <Row className="g-4">
                            <Col md={3}>
                                <Card className={`h-100 shadow-sm ${styles.cardHover}`}>
                                    <Card.Body className="text-center">
                                        <div className="display-4 text-primary mb-3">
                                            <FaUsers />
                                        </div>
                                        <Card.Title>Waiters</Card.Title>
                                        <h2 className="display-4 mb-3">{staffCounts.waiters}</h2>
                                        <Card.Text className="text-muted">
                                            Active Staff Members
                                        </Card.Text>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className={`h-100 shadow-sm ${styles.cardHover}`}>
                                    <Card.Body className="text-center">
                                        <div className="display-4 text-success mb-3">
                                            <FaUtensils />
                                        </div>
                                        <Card.Title>Kitchen Staff</Card.Title>
                                        <h2 className="display-4 mb-3">{staffCounts.kitchen}</h2>
                                        <Card.Text className="text-muted">
                                            Active Kitchen Members
                                        </Card.Text>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className={`h-100 shadow-sm ${styles.cardHover}`}>
                                    <Card.Body className="text-center">
                                        <div className="display-4 text-info mb-3">
                                            <FaUsers />
                                        </div>
                                        <Card.Title>Day Shift</Card.Title>
                                        <h2 className="display-4 mb-3">{staffCounts.dayShift}</h2>
                                        <Card.Text className="text-muted">
                                            Day Shift Staff
                                        </Card.Text>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className={`h-100 shadow-sm ${styles.cardHover}`}>
                                    <Card.Body className="text-center">
                                        <div className="display-4 text-secondary mb-3">
                                            <FaUsers />
                                        </div>
                                        <Card.Title>Night Shift</Card.Title>
                                        <h2 className="display-4 mb-3">{staffCounts.nightShift}</h2>
                                        <Card.Text className="text-muted">
                                            Night Shift Staff
                                        </Card.Text>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                            {/* <Row  className={`h-100 shadow-sm mt-4 ${styles.cardHover}`}>
                                    <Col>
                                        <Card className="h-100 shadow-sm">
                                            <Card.Body className="text-center">
                                                <div className="display-4 text-warning mb-3">
                                                    <FaClipboardList />
                                                </div>
                                                <Card.Title>Completed Orders</Card.Title>
                                                <h2 className="display-4 mb-3">{completedOrders}</h2>
                                                <Card.Text className="text-muted">
                                                    Orders Completed Today
                                                </Card.Text>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row> */}
                    </div>
                );
            case 'userlist':
                return <UserList />;
            case 'dashboard':
                return <Dashboard />;
            // case 'activeOrder':
            //     return <ActiveOrders />;
            case 'addFood':
                return <AddFoodForm />;
            default:
                return <UserList />;
        }
    };


    const handleLogout = () => {
        sessionStorage.clear();
        navigate('/', { replace: true });
    };

    return (
        <div className="d-flex">
            {/* Sidebar */}
            <div 
                className="bg-dark text-white" 
                style={{ 
                    width: '250px', 
                    minHeight: '100vh',
                    position: 'fixed',
                    left: 0,
                    top: 0
                }}
            >
                <div className="p-3">
                    <h5 className="text-center mb-4">Manager Menu</h5>
                    <Nav className="flex-column">
                        <Nav.Link 
                            className={`text-white mb-2 ${activeTab === 'main' ? 'active bg-primary' : ''}`}
                            onClick={() => setActiveTab('main')}
                        >
                            <FaHome className="me-2" /> Main
                        </Nav.Link>
                        <Nav.Link 
                            className={`text-white mb-2 ${activeTab === 'userlist' ? 'active bg-primary' : ''}`}
                            onClick={() => setActiveTab('userlist')}
                        >
                            <FaUsers className="me-2" /> User List
                        </Nav.Link>
                        <Nav.Link 
                            className={`text-white mb-2 ${activeTab === 'dashboard' ? 'active bg-primary' : ''}`}
                            onClick={() => setActiveTab('dashboard')}
                        >
                            <FaChartBar className="me-2" /> Dashboard
                        </Nav.Link>
                        {/* <Nav.Link 
                            className={`text-white mb-2 ${activeTab === 'activeOrder' ? 'active bg-primary' : ''}`}
                            onClick={() => setActiveTab('activeOrder')}
                        >
                            <FaClipboardList className="me-2" /> Active Order
                        </Nav.Link> */}
                        <Nav.Link 
                            className={`text-white mb-2 ${activeTab === 'addFood' ? 'active bg-primary' : ''}`}
                            onClick={() => setActiveTab('addFood')}
                        >
                            <FaPlusCircle className="me-2" /> Add New Food
                        </Nav.Link>
                    </Nav>
                </div>
            </div>

            {/* Main Content */}
            <div 
                style={{ 
                    marginLeft: '250px', 
                    width: 'calc(100% - 250px)',
                    minHeight: '100vh',
                    backgroundColor: '#f8f9fa'
                }}
            >
                <Navbar 
                    bg="white" 
                    className="border-bottom shadow-sm py-3 px-4 mb-4"
                    style={{ height: '70px' }}
                >
                    <Container fluid className="px-0">
                        <Navbar.Brand className="fw-bold" style={{ color: '#2c3e50' }}>
                            {MENU_ITEMS.find(item => item.id === activeTab)?.label || 'Dashboard'}
                        </Navbar.Brand>
                        <div className="d-flex align-items-center gap-3">
                            <Button
                                variant="success"
                                onClick={switchToWaiterMode}
                                className="d-flex align-items-center gap-2 rounded-pill px-3 me-2"
                            >
                                <FaUtensils />
                                Switch to Waiter Mode
                            </Button>
                            <div className="d-flex align-items-center">
                                <div 
                                    className="rounded-circle bg-light p-2 me-2"
                                    style={{ width: '40px', height: '40px' }}
                                >
                                    <FaUsers className="text-primary" size={20} />
                                </div>
                                <div>
                                    <small className="text-muted">Signed in as</small>
                                    <div className="fw-bold" style={{ color: '#2c3e50' }}>Manager</div>
                                </div>
                            </div>
                            <Button 
                                variant="outline-danger" 
                                onClick={handleLogout}
                                className="d-flex align-items-center gap-2 rounded-pill px-3"
                            >
                                <FaSignOutAlt />
                                Logout
                            </Button>
                        </div>    
                    </Container>
                </Navbar>
                <Container fluid className="p-3">
                    <Row>
                        <Col>
                            {renderContent()}
                        </Col>
                    </Row>
                </Container>
            </div>
        </div>
    );
};

export default ManagerDashboard;