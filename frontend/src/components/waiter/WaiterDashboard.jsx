import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Navbar, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { socketService } from '../../services/socketService';
import axios from 'axios';
import TableGrid from './TableGrid';
import OrderForm from './OrderForm';
import ActiveOrders from './ActiveOrders';

const WaiterDashboard = () => {
    const navigate = useNavigate();
    const [tables, setTables] = useState([]);
    const [activeOrders, setActiveOrders] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [showOrderForm, setShowOrderForm] = useState(false);
    const [menuItems, setMenuItems] = useState([]);
    const userName = sessionStorage.getItem('userName') || 'Waiter';

    const handleLogout = () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('userRole');
        sessionStorage.removeItem('userName');
        navigate('/');
    };

    const fetchTables = async () => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) {
                console.error('No authentication token found');
                return;
            }

            const response = await axios.get('http://localhost:8000/api/orders/tables', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data) {
                // Transform the data to match our component's needs
                const formattedTables = Array.isArray(response.data) ? response.data : 
                    Array.isArray(response.data.tables) ? response.data.tables : [];
                
                const tables = formattedTables.map((table, index) => ({
                    id: table.table_id,
                    number: index + 1,  // Use index + 1 for table numbers
                    status: table.table_status
                }));
                setTables(tables);
            }
        } catch (error) {
            console.error('Error fetching tables:', error);
            if (error.response) {
                console.error('Error status:', error.response.status);
                console.error('Error data:', error.response.data);
                console.error('Error headers:', error.response.headers);
            }
        }
    };

    const fetchActiveOrders = async () => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) {
                console.error('No authentication token found');
                navigate('/');
                return;
            }

            const response = await axios.get('/api/orders/active', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data) {
                // Transform the data to match the component's needs
                const formattedOrders = Array.isArray(response.data) ? response.data.map(order => ({
                    id: order.order_id,
                    table_number: order.table_id,
                    status: order.order_status,
                    created_at: order.created_at, // Include the creation timestamp for sorting
                    items: order.items.map(item => ({
                        id: item.food_id,
                        food_id: item.food_id,
                        quantity: item.quantity,
                        price: 0 // Prices will be fetched from menu items
                    })),
                    total: order.total_price
                })) : [];
                
                setActiveOrders(formattedOrders);
            }
        } catch (error) {
            console.error('Error fetching active orders:', error);
            if (error.response?.status === 401) {
                navigate('/');
            }
        }
    };

    const fetchMenuItems = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await axios.get('http://localhost:8000/api/kitchen/menu', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            // Transform menu data to expected format if needed
            const formattedMenuItems = Array.isArray(response.data) ? response.data : [];
            
            // Ensure each item has the expected properties
            const processedItems = formattedMenuItems.map(item => ({
                id: item.food_id || item.id,
                name: item.name || 'Unknown Item',
                price: item.price || 0,
                description: item.description || '',
                category: item.category || 'Other',
                is_available: item.is_available !== false
            }));
            
            setMenuItems(processedItems);
        } catch (error) {
            console.error('Error fetching menu items:', error);
            setMenuItems([]); // Set empty array on error
        }
    };

    const handleTableStatusChange = async (tableId, status) => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await axios.put(`http://localhost:8000/api/orders/tables/${tableId}`, 
                { table_status: status },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            if (response.data) {
                setTables(prevTables =>
                    prevTables.map(table =>
                        table.id === tableId ? { ...table, status: response.data.table_status } : table
                    )
                );
            }
        } catch (error) {
            console.error('Error updating table status:', error);
        }
    };

    const handleOrderSubmit = async (orderData) => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) {
                console.error('No authentication token found');
                alert('Authentication error: Please log in again');
                return;
            }
            
            // Log the order data received from the form
            console.log('Order data from form:', orderData);
            
            if (!selectedTable) {
                console.error('No table selected');
                alert('Please select a table first');
                return;
            }
            
            if (!orderData || orderData.length === 0) {
                console.error('No items selected');
                alert('Please add items to the order');
                return;
            }
            
            // Prepare the order data
            const orderPayload = {
                tableId: selectedTable.id,
                items: orderData.map(item => ({
                    food_id: item.id,
                    quantity: item.quantity,
                    note: item.note || ""
                })),
                status: 'pending',
                // Include user info for audit
                employeeId: sessionStorage.getItem('userId') || '0'
            };
            
            console.log('Prepared order payload:', orderPayload);
            
            // Try WebSocket first, then fall back to REST API
            let orderPlaced = false;
            
            // Use socket service for real-time order submission
            try {
                console.log('Attempting to send order via WebSocket...');
                const result = await socketService.sendOrderToKitchen(orderPayload);
                console.log('WebSocket order result:', result);
                
                // Update table status
                await handleTableStatusChange(selectedTable.id, 'occupied');
                
                // Show success notification
                alert('Order sent to kitchen successfully!');
                
                // Close the form
                setShowOrderForm(false);
                orderPlaced = true;
                
                // Refresh orders after successful submission
                fetchActiveOrders();
            } catch (socketError) {
                console.error('WebSocket order submission failed:', socketError);
                
                // Fallback to REST API if WebSocket fails
                if (!orderPlaced) {
                    console.log('Falling back to REST API for order submission');
                    try {
                        const response = await axios.post('http://localhost:8000/api/orders', 
                            orderPayload,
                            {
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                }
                            }
                        );
                        
                        console.log('REST API order response:', response.data);
                        
                        if (response.status === 200) {
                            // Update table status
                            await handleTableStatusChange(selectedTable.id, 'occupied');
                            fetchActiveOrders();
                            setShowOrderForm(false);
                            alert('Order sent successfully via REST API!');
                        }
                    } catch (restError) {
                        console.error('REST API order submission failed:', restError);
                        throw new Error('Both WebSocket and REST API order submission failed');
                    }
                }
            }
        } catch (error) {
            console.error('Error submitting order:', error);
            alert('Failed to submit order. Please try again.');
        }
    };

    const handleOrderComplete = async (orderId, status) => {
        try {
            console.log(`Updating order ${orderId} to status: ${status}`);
            const token = sessionStorage.getItem('token');
            
            // Use the correct endpoint for status updates
            await axios.put(`/api/orders/${orderId}/status`,
                {
                    status: status
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            // Emit the update via WebSocket
            socketService.emitOrderUpdate({
                order_id: orderId,
                status: status
            });
            
            // Update local state immediately for better UX
            setActiveOrders(prevOrders => 
                prevOrders.map(order => 
                    order.id === orderId 
                        ? { ...order, status: status } 
                        : order
                )
            );
            
            // Refresh data to ensure consistency
            fetchActiveOrders();
            fetchTables();
            
            console.log(`Order ${orderId} updated to ${status} successfully`);
        } catch (error) {
            console.error('Error updating order:', error);
            alert(`Failed to update order: ${error.message}`);
        }
    };

    useEffect(() => {
        console.log('Initializing WaiterDashboard...');
        const token = sessionStorage.getItem('token');
        
        if (!token) {
            console.error('No authentication token found');
            navigate('/');
            return;
        }
        
        // Check socket connection
        if (!socketService.isConnected()) {
            console.log('Socket not connected, attempting to reconnect...');
            socketService.reconnect();
        }
        
        // Subscribe to real-time updates
        socketService.subscribeToOrders((update) => {
            console.log('Received order update:', update);
            setActiveOrders(prevOrders => {
                const orderIndex = prevOrders.findIndex(o => o.id === update.orderId);
                if (orderIndex >= 0) {
                    const newOrders = [...prevOrders];
                    // Preserve the created_at timestamp when updating
                    newOrders[orderIndex] = { 
                        ...newOrders[orderIndex], 
                        ...update,
                        created_at: newOrders[orderIndex].created_at // Keep the original timestamp
                    };
                    return newOrders;
                }
                return prevOrders;
            });
        });

        // Fetch initial data
        fetchTables();
        fetchActiveOrders();
        fetchMenuItems();

        // Cleanup socket subscription
        return () => {
            console.log('Cleaning up WaiterDashboard...');
            socketService.unsubscribeFromOrders();
        };
    }, [navigate]);

    return (
        <>
            <Navbar bg="dark" variant="dark" className="mb-3">
                <Container fluid>
                    <Navbar.Brand>Restaurant Management</Navbar.Brand>
                    <Navbar.Toggle />
                    <Navbar.Collapse className="justify-content-end">
                        <Navbar.Text className="me-3">
                            Signed in as: <span className="text-white">{userName}</span>
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
                        <Card>
                            <Card.Header className="bg-primary text-white">
                                <h4 className="mb-0">Table Layout</h4>
                            </Card.Header>
                            <Card.Body>
                                // In the return section, update the TableGrid component
                                <TableGrid 
                                    tables={tables}
                                    onTableSelect={(table) => {
                                        setSelectedTable(table);
                                        setShowOrderForm(true);
                                    }}
                                    onTableStatusChange={handleTableStatusChange}
                                    userName={userName}  // Add this line
                                />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card style={{ height: 'calc(100vh - 150px)' }}>
                            <Card.Header className="bg-success text-white">
                                <h4 className="mb-0">Active Orders</h4>
                            </Card.Header>
                            <Card.Body style={{ padding: '10px', overflowY: 'hidden' }}>
                                <ActiveOrders 
                                    orders={activeOrders}
                                    onOrderUpdate={handleOrderComplete}
                                    menuItems={menuItems}
                                />
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <OrderForm 
                    show={showOrderForm}
                    handleClose={() => setShowOrderForm(false)}
                    table={selectedTable}
                    menuItems={menuItems}
                    onSubmit={handleOrderSubmit}
                />
            </Container>
        </>
    );
};

export default WaiterDashboard;
