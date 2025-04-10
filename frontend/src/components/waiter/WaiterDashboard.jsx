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
                
                const tables = formattedTables.map(table => ({
                    id: table.table_id,
                    number: table.table_id,
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
            const response = await axios.get('http://localhost:8000/api/orders/active', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            setActiveOrders(response.data);
        } catch (error) {
            console.error('Error fetching active orders:', error);
        }
    };

    const fetchMenuItems = async () => {
        try {
            const response = await axios.get('/api/kitchen/menu');
            setMenuItems(response.data);
        } catch (error) {
            console.error('Error fetching menu items:', error);
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
            await axios.post('http://localhost:8000/api/orders', 
                {
                    tableId: selectedTable.id,
                    items: orderData,
                    status: 'pending'
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            // Update table status
            await handleTableStatusChange(selectedTable.id, 'occupied');
            fetchActiveOrders();
            setShowOrderForm(false);
        } catch (error) {
            console.error('Error submitting order:', error);
        }
    };

    const handleOrderComplete = async (orderId) => {
        try {
            const token = sessionStorage.getItem('token');
            await axios.put(`http://localhost:8000/api/orders/${orderId}`,
                {
                    status: 'completed'
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            fetchActiveOrders();
        } catch (error) {
            console.error('Error completing order:', error);
        }
    };

    useEffect(() => {
        // Subscribe to real-time updates
        socketService.subscribeToOrders((update) => {
            setActiveOrders(prevOrders => {
                const orderIndex = prevOrders.findIndex(o => o.id === update.orderId);
                if (orderIndex >= 0) {
                    const newOrders = [...prevOrders];
                    newOrders[orderIndex] = { ...newOrders[orderIndex], ...update };
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
            socketService.unsubscribeFromOrders();
        };
    }, []);

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
                                <TableGrid 
                                    tables={tables}
                                    onTableSelect={(table) => {
                                        setSelectedTable(table);
                                        setShowOrderForm(true);
                                    }}
                                    onTableStatusChange={handleTableStatusChange}
                                />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card>
                            <Card.Header className="bg-primary text-white">
                                <h4 className="mb-0">Active Orders</h4>
                            </Card.Header>
                            <Card.Body>
                                <ActiveOrders 
                                    orders={activeOrders}
                                    onOrderUpdate={handleOrderComplete}
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
