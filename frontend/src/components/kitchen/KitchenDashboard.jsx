import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Navbar } from 'react-bootstrap';
import { socketService } from '../../services/socketService';
import MenuManagement from './MenuManagement';
import OrderQueue from './OrderQueue';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const KitchenDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
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
            setOrders(prevOrders => {
                const orderIndex = prevOrders.findIndex(o => o.id === update.orderId);
                if (orderIndex >= 0) {
                    const newOrders = [...prevOrders];
                    newOrders[orderIndex] = { ...newOrders[orderIndex], ...update };
                    return newOrders;
                }
                return [...prevOrders, update];
            });
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
            await axios.patch(`/api/kitchen/orders/${orderId}`, 
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

