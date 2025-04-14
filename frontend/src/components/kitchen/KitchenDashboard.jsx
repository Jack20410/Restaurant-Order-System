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
    const [completedOrderIds, setCompletedOrderIds] = useState(new Set());
    const navigate = useNavigate();

    const fetchOrders = async () => {
        try {
            console.log('Fetching active orders...');
            const token = sessionStorage.getItem('token');
            
            // First try to get active orders from kitchen endpoint
            try {
                const response = await axios.get('/api/kitchen/orders', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log('Orders from kitchen API:', response.data);
                
                // Filter out orders that are marked to be hidden
                const filteredOrders = response.data.filter(
                    order => !completedOrderIds.has(order.order_id)
                );
                setOrders(filteredOrders);
            } catch (kitchenError) {
                console.error('Error fetching from kitchen API:', kitchenError);
                
                // Fall back to order service active orders endpoint
                console.log('Trying order service fallback...');
                const fallbackResponse = await axios.get('/api/orders/active', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log('Orders from order service API:', fallbackResponse.data);
                
                // Filter out orders that are marked to be hidden
                const filteredOrders = fallbackResponse.data.filter(
                    order => !completedOrderIds.has(order.order_id)
                );
                setOrders(filteredOrders);
            }
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
            
            // Handle new orders coming from both WebSocket and REST API paths
            if (update.type === 'new_order' || update.notification?.type === 'new_order') {
                const tableId = update.table_id || update.notification?.table_id || 'Unknown';
                const orderId = update.order_id || update.notification?.order_id;
                
                // Show flash message
                setFlashMessage({
                    text: `New order #${orderId} received from Table ${tableId}`,
                    type: 'info'
                });
                
                // Set new order ID for highlighting
                setNewOrderId(orderId);
                
                // Auto-dismiss flash message and highlighting after 5 seconds
                setTimeout(() => {
                    setFlashMessage(null);
                    setNewOrderId(null);
                }, 5000);
                
                // Refresh orders to get the latest from the server
                fetchOrders();
            } 
            // Handle order status updates
            else if (update.orderId || update.order_id) {
                const orderId = update.orderId || update.order_id;
                const status = update.status || update.order_status;
                
                // If the order is already marked as completed, ignore the update
                if (completedOrderIds.has(orderId)) {
                    return;
                }
                
                // If status is now 'completed', schedule it to be hidden after 5 seconds
                if (status === 'completed') {
                    setFlashMessage({
                        text: `Order #${orderId} is completed !`,
                        type: 'success'
                    });
                    
                    // Schedule the order to be hidden after 5 seconds
                    setTimeout(() => {
                        setCompletedOrderIds(prev => {
                            const newSet = new Set(prev);
                            newSet.add(orderId);
                            return newSet;
                        });
                        
                        // Remove the flash message
                        setFlashMessage(prev => 
                            prev?.text.includes(`Order #${orderId}`) ? null : prev
                        );
                        
                        // Filter out the completed order
                        setOrders(prevOrders => 
                            prevOrders.filter(order => order.order_id !== orderId)
                        );
                    }, 5000);
                }
                
                setOrders(prevOrders => {
                    const orderIndex = prevOrders.findIndex(o => o.order_id === orderId);
                    if (orderIndex >= 0) {
                        const newOrders = [...prevOrders];
                        newOrders[orderIndex] = { 
                            ...newOrders[orderIndex], 
                            order_status: update.status,
                            ...update,
                            // Preserve the creation timestamp
                            created_at: newOrders[orderIndex].created_at || 
                                        newOrders[orderIndex].createdAt
                        };
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
            console.log(`Updating order ${orderId} status to ${status}...`);
            const token = sessionStorage.getItem('token');
            
            // Try kitchen endpoint first
            try {
                await axios.put(`/api/kitchen/orders/${orderId}`, 
                    { status },
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
            } catch (kitchenError) {
                console.error('Error updating via kitchen API:', kitchenError);
                
                // Fall back to order service endpoint
                console.log('Trying order service fallback...');
                await axios.put(`/api/orders/${orderId}/status`, 
                    { status },
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
            }
            
            // Update WebSocket with the new format
            socketService.emitOrderUpdate({
                order_id: orderId, 
                status: status
            });
            
            // Update local state immediately for better UX
            setOrders(prevOrders => 
                prevOrders.map(order => 
                    order.order_id === orderId 
                        ? { ...order, status, order_status: status } 
                        : order
                )
            );
            
            // If order is completed, schedule it to be hidden after 5 seconds
            if (status === 'completed') {
                // Show a flash message
                setFlashMessage({
                    text: `Order #${orderId} marked as completed. It will be hidden in 5 seconds.`,
                    type: 'success'
                });
                
                // Schedule the order to be hidden after 5 seconds
                setTimeout(() => {
                    setCompletedOrderIds(prev => {
                        const newSet = new Set(prev);
                        newSet.add(orderId);
                        return newSet;
                    });
                    
                    // Remove the corresponding flash message if it's still showing
                    setFlashMessage(prev => 
                        prev?.text.includes(`Order #${orderId}`) ? null : prev
                    );
                    
                    // Also filter the orders list to remove the completed order
                    setOrders(prevOrders => 
                        prevOrders.filter(order => order.order_id !== orderId)
                    );
                }, 5000);
            }
            
            console.log(`Order ${orderId} status updated to ${status}`);
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
                        <Card className="mb-3" style={{ height: 'calc(100vh - 150px)' }}>
                            <Card.Header className="bg-success text-white">
                                <h4>Order Queue</h4>
                            </Card.Header>
                            <Card.Body style={{ padding: '10px', overflowY: 'hidden' }}>
                                <OrderQueue 
                                    orders={orders}
                                    onStatusUpdate={handleOrderStatusUpdate}
                                    newOrderId={newOrderId}
                                    menuItems={menuItems}
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

