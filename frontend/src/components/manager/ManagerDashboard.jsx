import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Navbar, Button, Nav, Card } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import UserList from './UserList';
import ActiveOrders from '../waiter/ActiveOrders';
import { FaUsers, FaHome, FaChartBar, FaClipboardList, FaUtensils, FaPlusCircle } from 'react-icons/fa';
import Dashboard from './Dashboard';
import AddFoodForm from './AddFoodForm';

const ManagerDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('userlist');


  

    const renderContent = () => {
        switch (activeTab) {
            case 'main':
                return (
                    <div>
                        <h2 className="mb-4">Dashboard Overview</h2>
                        <Row className="g-4">
                            <Col md={4}>
                                <Card className="h-100 shadow-sm">
                                    <Card.Body className="text-center">
                                        <div className="display-4 text-primary mb-3">
                                            <FaUsers />
                                        </div>
                                        <Card.Title>Waiters</Card.Title>
                                        <h2 className="display-4 mb-3">0</h2>
                                        <Card.Text className="text-muted">
                                            Active Staff Members
                                        </Card.Text>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={4}>
                                <Card className="h-100 shadow-sm">
                                    <Card.Body className="text-center">
                                        <div className="display-4 text-success mb-3">
                                            <FaUtensils />
                                        </div>
                                        <Card.Title>Kitchen Staff</Card.Title>
                                        <h2 className="display-4 mb-3">0</h2>
                                        <Card.Text className="text-muted">
                                            Active Kitchen Members
                                        </Card.Text>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={4}>
                                <Card className="h-100 shadow-sm">
                                    <Card.Body className="text-center">
                                        <div className="display-4 text-warning mb-3">
                                            <FaClipboardList />
                                        </div>
                                        <Card.Title>Today's Orders</Card.Title>
                                        <h2 className="display-4 mb-3">25</h2>
                                        <Card.Text className="text-muted">
                                            Orders Processed Today
                                        </Card.Text>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </div>
                );
            case 'userlist':
                return <UserList />;
            case 'dashboard':
                return <Dashboard />;
            case 'activeOrder':
                return <ActiveOrders />;
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
                        <Nav.Link 
                            className={`text-white mb-2 ${activeTab === 'activeOrder' ? 'active bg-primary' : ''}`}
                            onClick={() => setActiveTab('activeOrder')}
                        >
                            <FaClipboardList className="me-2" /> Active Order
                        </Nav.Link>
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
            <div style={{ marginLeft: '250px', width: '100%' }}>
                <Navbar bg="dark" variant="dark" className="mb-3">
                    <Container fluid>
                        <Navbar.Brand>Restaurant Management</Navbar.Brand>
                        <Navbar.Toggle />
                        <Navbar.Collapse className="justify-content-end">
                            <Navbar.Text className="me-3">
                                Signed in as: <span className="text-white">Manager</span>
                            </Navbar.Text>
                            <Button variant="outline-light" onClick={handleLogout}>
                                Logout
                            </Button>
                        </Navbar.Collapse>
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