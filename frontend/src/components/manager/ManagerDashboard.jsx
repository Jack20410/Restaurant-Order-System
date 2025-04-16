import React, { useState } from 'react';
import { Container, Row, Col, Navbar, Button, Nav } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import UserList from './UserList';
import Dashboard from './Dashboard';
import { FaUsers, FaHome, FaChartBar, FaClipboardList, FaSignOutAlt, FaTools } from 'react-icons/fa';
import '../../styles/UserList.css';

// Placeholder components
const Overview = () => (
    <div className="text-center p-5">
        <FaTools size={50} className="text-muted mb-3" />
        <h3 className="text-muted">Overview Coming Soon</h3>
        <p className="text-muted">This feature is under development.</p>
    </div>
);

const ActiveOrders = () => (
    <div className="text-center p-5">
        <FaTools size={50} className="text-muted mb-3" />
        <h3 className="text-muted">Active Orders Coming Soon</h3>
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
    const [activeTab, setActiveTab] = useState('dashboard');

    const handleLogout = () => {
        sessionStorage.clear();
        navigate('/', { replace: true });
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'main':
                return <Overview />;
            case 'userlist':
                return <UserList />;
            case 'dashboard':
                return <Dashboard />;
            case 'activeOrder':
                return <ActiveOrders />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <div className="d-flex">
            {/* Sidebar */}
            <div 
                className="bg-dark text-white shadow-lg" 
                style={{ 
                    width: '250px', 
                    minHeight: '100vh',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    zIndex: 1000
                }}
            >
                <div className="p-4">
                    <h5 className="text-center mb-4 fw-bold">
                        Restaurant Manager
                    </h5>
                    <Nav className="flex-column gap-2">
                        {MENU_ITEMS.map(item => (
                            <Nav.Link 
                                key={item.id}
                                className={`
                                    text-white rounded-3 p-3
                                    d-flex align-items-center
                                    ${activeTab === item.id ? 'active bg-primary' : 'hover-effect'}
                                `}
                                onClick={() => setActiveTab(item.id)}
                                style={{
                                    transition: 'all 0.3s ease',
                                    backgroundColor: activeTab === item.id ? '#4CAF50' : 'transparent'
                                }}
                            >
                                <item.icon className="me-3" />
                                {item.label}
                            </Nav.Link>
                        ))}
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
                <Container fluid className="p-4">
                    {renderContent()}
                </Container>
            </div>
        </div>
    );
};

export default ManagerDashboard;