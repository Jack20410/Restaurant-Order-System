import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Navbar, Alert } from 'react-bootstrap';
import { socketService } from '../../services/socketService';
import MenuManagement from './MenuManagement';
import OrderQueue from './OrderQueue';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../styles/KitchenStyles.css'; // Updated path to styles folder

const KitchenDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [flashMessage, setFlashMessage] = useState(null);
    const [newOrderId, setNewOrderId] = useState(null);
    const navigate = useNavigate();

    const fetchOrders = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await axios.get('/api/kitchen/orders', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setOrders(response.data);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            if (error.response?.status === 401) {
                handleLogout();
            }
        }
    };

    const fetchMenu = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await axios.get('/api/kitchen/menu', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setMenuItems(response.data);
        } catch (error) {
            console.error('Failed to fetch menu:', error);
            if (error.response?.status === 401) {
                handleLogout();
            }
        }
    };

    useEffect(() => {
        const token = sessionStorage.getItem('token');
        const userRole = sessionStorage.getItem('userRole');

        if (!token || userRole !== 'kitchen') {
            handleLogout();
            return;
        }

        // Subscribe to real-time order updates
        socketService.subscribeToOrders((update) => {
            console.log('Received order update:', update);
            
            // Handle new orders
            if (update.notification?.type === 'new_order') {
                // Show flash message
                setFlashMessage({
                    text: `New order received from Table ${update.table_id || 'Unknown'}`,
                    type: 'info'
                });
                
                // Set new order ID for highlighting
                setNewOrderId(update.order_id);
                
                // Auto-dismiss flash message and highlighting after 5 seconds
                setTimeout(() => {
                    setFlashMessage(null);
                    setNewOrderId(null);
                }, 5000);
                
                // Add the new order to the list
                setOrders(prevOrders => {
                    // Check if order already exists
                    if (!prevOrders.some(o => o.order_id === update.order_id)) {
                        return [...prevOrders, update];
                    }
                    return prevOrders;
                });
            } 
            // Handle order status updates
            else if (update.orderId) {
                setOrders(prevOrders => {
                    const orderIndex = prevOrders.findIndex(o => o.order_id === update.orderId);
                    if (orderIndex >= 0) {
                        const newOrders = [...prevOrders];
                        newOrders[orderIndex] = { ...newOrders[orderIndex], ...update };
                        return newOrders;
                    }
                    return prevOrders;
                });
            }
        });
        
        // Fetch initial data
        fetchOrders();
        fetchMenu();

        // Cleanup socket subscription
        return () => {
            socketService.unsubscribeFromOrders();
        };
    }, []);

    const handleOrderStatusUpdate = async (orderId, status) => {
        try {
            const token = sessionStorage.getItem('token');
            await axios.put(`/api/kitchen/orders/${orderId}`, 
                { status },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            socketService.emitOrderUpdate(orderId, status);
        } catch (error) {
            console.error('Failed to update order status:', error);
            if (error.response?.status === 401) {
                handleLogout();
            }
        }
    };

    const handleMenuItemUpdate = async (itemId, availability) => {
        try {
            const token = sessionStorage.getItem('token');
            await axios.patch(`/api/kitchen/menu/${itemId}`, 
                { availability },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            socketService.emitMenuUpdate({ itemId, availability });
        } catch (error) {
            console.error('Failed to update menu item:', error);
            if (error.response?.status === 401) {
                handleLogout();
            }
        }
    };

    const handleLogout = () => {
        // Clear session storage
        sessionStorage.clear();
        // Unsubscribe from socket
        socketService.unsubscribeFromOrders();
        // Navigate to login page
        navigate('/', { replace: true });
    };

    return (
        <>
            <Navbar bg="dark" variant="dark" className="mb-3">
                <Container fluid>
                    <Navbar.Brand>Restaurant Management</Navbar.Brand>
                    <Navbar.Toggle />
                    <Navbar.Collapse className="justify-content-end">
                        <Navbar.Text className="me-3">
                            Signed in as: <span className="text-white">Kitchen Staff</span>
                        </Navbar.Text>
                        <Button variant="outline-light" onClick={handleLogout}>
                            Logout
                        </Button>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
            <Container fluid className="p-3">
                {flashMessage && (
                    <Alert 
                        variant={flashMessage.type} 
                        className="flash-message-alert"
                        style={{
                            animation: 'flashAnimation 1s infinite alternate',
                            fontWeight: 'bold',
                            fontSize: '1.2rem',
                            textAlign: 'center',
                            position: 'sticky',
                            top: 0,
                            zIndex: 1050,
                            marginBottom: '15px',
                            borderLeft: '5px solid #007bff',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                        }}
                    >
                        {flashMessage.text}
                    </Alert>
                )}
                <Row>
                    <Col md={8}>
                        <Card className="mb-3">
                            <Card.Header>
                                <h4>Order Queue</h4>
                            </Card.Header>
                            <Card.Body>
                                <OrderQueue 
                                    orders={orders}
                                    onStatusUpdate={handleOrderStatusUpdate}
                                    newOrderId={newOrderId}
                                />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <MenuManagement 
                            menuItems={menuItems}
                            onAvailabilityUpdate={handleMenuItemUpdate}
                        />
                    </Col>
                </Row>
            </Container>
        </>
    );
};

export default KitchenDashboard;

