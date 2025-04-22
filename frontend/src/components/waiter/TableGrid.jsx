// Add this import at the top of the file
import '../../styles/TableGrid.css';
// import React, { useState } from 'react';
import { Card, Button, Badge, Modal, Form, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useState, useEffect } from 'react';

const TableGrid = ({ tables, onTableSelect, onTableStatusChange, userName }) => {
    // Add this state with other states
    const [menuItems, setMenuItems] = useState([]);
    const [showCurrentOrdersModal, setShowCurrentOrdersModal] = useState(false);
    const [currentTableOrders, setCurrentTableOrders] = useState([]);

    // Add this useEffect after other useEffects
    useEffect(() => {
        fetchMenuItems();
    }, []);

    // Add this function with other functions
    const fetchMenuItems = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await axios.get('/api/kitchen/menu', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.data) {
                setMenuItems(response.data);
            }
        } catch (error) {
            console.error('Error fetching menu items:', error);
        }
    };

    // Add this function to fetch current orders for a table
    const fetchCurrentOrders = async (tableId) => {
        try {
            const token = sessionStorage.getItem('token');
            console.log('Fetching orders for table:', tableId);
            
            const response = await axios.get(`/api/orders/table/${tableId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.data) {
                // Filter only active orders (pending, preparing, ready_to_serve, completed)
                const activeOrders = response.data.filter(order => 
                    ['pending', 'preparing', 'ready_to_serve', 'completed'].includes(order.order_status)
                );

                // Sort orders by created_at date, most recent first
                const sortedOrders = activeOrders.sort((a, b) => 
                    new Date(b.created_at) - new Date(a.created_at)
                );
                
                setCurrentTableOrders(sortedOrders);
                setShowCurrentOrdersModal(true);
            }
        } catch (error) {
            console.error('Error fetching current orders:', error);
            alert('Failed to fetch orders. Please try again.');
        }
    };

    // Update combineOrderItems to include price
    const combineOrderItems = (orders) => {
        const combinedItems = new Map();
        let totalAmount = 0;

        orders.forEach(order => {
            totalAmount += order.total_price || 0;
            order.items.forEach(item => {
                const key = `${item.food_id}-${item.note || ''}`;
                const menuItem = menuItems.find(m => m.food_id === item.food_id || m.id === item.food_id);
                const price = menuItem ? menuItem.price : 0;
                
                if (combinedItems.has(key)) {
                    combinedItems.get(key).quantity += item.quantity;
                } else {
                    combinedItems.set(key, {
                        food_id: item.food_id,
                        quantity: item.quantity,
                        note: item.note || '',
                        price: price
                    });
                }
            });
        });

        return {
            items: Array.from(combinedItems.values()),
            totalAmount
        };
    };

    // Add helper function to get food name from food_id
    const getFoodNameById = (food_id) => {
        if (!menuItems || menuItems.length === 0) {
            return `Item #${food_id}`;
        }
        
        const menuItem = menuItems.find(item => 
            item.food_id === food_id || item.id === food_id
        );
        
        return menuItem ? menuItem.name : `Item #${food_id}`;
    };

    // Add helper function to format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { 
            style: 'currency', 
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Update status badge function to include all statuses
    const getOrderStatusBadge = (status) => {
        const variants = {
            'pending': 'warning',
            'preparing': 'info',
            'ready_to_serve': 'success',
            'completed': 'primary',
            'cancelled': 'danger',
            'paid': 'secondary'
        };
        return <Badge bg={variants[status] || 'secondary'}>{status.replace('_', ' ').toUpperCase()}</Badge>;
    };

    // Add helper function to determine card style based on status
    const getCardStyle = (status) => {
        if (status === 'cancelled') {
            return 'bg-light text-muted';
        } else if (status === 'paid') {
            return 'bg-success bg-opacity-10';
        } else if (status === 'completed') {
            return 'bg-primary bg-opacity-10';
        }
        return '';
    };

    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedTable, setSelectedTable] = useState(null);
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        phone: ''
    });
    const [receipt, setReceipt] = useState(null);

    const getStatusBadge = (status) => {
        const variants = {
            'available': 'success',
            'occupied': 'danger'
        };
        return (
            <Badge bg={variants[status] || 'secondary'} className="mb-2">
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    const handleTableClick = (table) => {
        setSelectedTable(table);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setShowPaymentModal(false);
        setSelectedTable(null);
        setCustomerInfo({ name: '', phone: '' });
        setReceipt(null);
    };

    const handleUseTable = () => {
        onTableStatusChange(selectedTable.id, 'occupied');
        handleCloseModal();
    };

    const handleTakeOrder = () => {
        navigate(`/waiter/menu/${selectedTable.id}`);
        handleCloseModal();
    };

    const handleMakePayment = () => {
        setShowModal(false);
        setShowPaymentModal(true);
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = sessionStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:8000/api/orders/payments',
                {
                    table_id: parseInt(selectedTable.id),
                    phone_number: customerInfo.phone,
                    customer_name: customerInfo.name
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data) {
                setReceipt(response.data.receipt);
                // Update table status to available
                onTableStatusChange(selectedTable.id, 'available');
            }
        } catch (error) {
            console.error('Payment error:', error);
            alert('Failed to process payment. Please try again.');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCustomerInfo(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCancelTable = async () => {
        try {
            const token = sessionStorage.getItem('token');
            
            // Get current orders for the table
            const response = await axios.get(`/api/orders/table/${selectedTable.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Filter active orders (pending, preparing, ready_to_serve)
            const activeOrders = response.data.filter(order => 
                ['pending', 'preparing', 'ready_to_serve'].includes(order.order_status)
            );

            // Cancel all active orders
            for (const order of activeOrders) {
                await axios.put(
                    `/api/orders/${order.order_id}/status`,
                    { status: 'cancelled' },
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
            }

            // Update table status to available
            onTableStatusChange(selectedTable.id, 'available');
            handleCloseModal();

        } catch (error) {
            console.error('Error canceling table:', error);
            alert('Failed to cancel table and orders. Please try again.');
        }
    };

    return (
        <>
            <div className="table-grid">
                <div className="row g-3">
                    {tables.map((table) => (
                        <div key={table.id} className="col-md-4 col-sm-6">
                            <Card className="h-100 shadow-sm">
                                <Card.Body className="d-flex flex-column">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <Card.Title className="mb-0">Table {table.number}</Card.Title>
                                        {getStatusBadge(table.status)}
                                    </div>
                                    <Card.Text className="text-muted mb-3">
                                        Capacity: {table.capacity} people
                                    </Card.Text>
                                    <Button 
                                        variant={table.status === 'occupied' ? 'outline-danger' : 'outline-success'}
                                        onClick={() => handleTableClick(table)}
                                        className="mt-auto"
                                    >
                                        {table.status === 'occupied' ? 'Manage Table' : 'Use Table'}
                                    </Button>
                                </Card.Body>
                            </Card>
                        </div>
                    ))}
                </div>
            </div>

            {/* Table Management Modal */}
            <Modal 
                show={showModal} 
                onHide={handleCloseModal} 
                centered
                className="modern-modal"
            >
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="w-100">
                        <div className="text-center">
                            <h4 className="mb-0">Table {selectedTable?.number}</h4>
                            {selectedTable?.status === 'occupied' && (
                                <Badge 
                                    bg="danger" 
                                    className="mt-2 px-3 py-2 rounded-pill"
                                >
                                    Occupied
                                </Badge>
                            )}
                            {selectedTable?.status === 'available' && (
                                <Badge 
                                    bg="success" 
                                    className="mt-2 px-3 py-2 rounded-pill"
                                >
                                    Available
                                </Badge>
                            )}
                        </div>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-4">
                    {selectedTable?.status === 'available' ? (
                        <div className="d-grid gap-3 p-2">
                            <Button 
                                variant="primary" 
                                size="lg"
                                className="rounded-3 shadow-sm hover-scale py-4"
                                onClick={handleUseTable}
                            >
                                <i className="bi bi-check-circle-fill mb-2 d-block" style={{ fontSize: '1.5rem' }}></i>
                                Use this table
                            </Button>
                        </div>
                    ) : (
                        <div className="grid-buttons p-2">
                            <Button 
                                variant="info" 
                                className="rounded-3 shadow-sm hover-scale py-4"
                                onClick={() => fetchCurrentOrders(selectedTable.id)}
                            >
                                <i className="bi bi-list-ul mb-2 d-block" style={{ fontSize: '1.5rem' }}></i>
                                View Orders
                            </Button>
                            <Button 
                                variant="primary" 
                                className="rounded-3 shadow-sm hover-scale py-4"
                                onClick={handleTakeOrder}
                            >
                                <i className="bi bi-plus-circle-fill mb-2 d-block" style={{ fontSize: '1.5rem' }}></i>
                                Take Order
                            </Button>
                            <Button 
                                variant="success" 
                                className="rounded-3 shadow-sm hover-scale py-4"
                                onClick={handleMakePayment}
                            >
                                <i className="bi bi-cash-coin mb-2 d-block" style={{ fontSize: '1.5rem' }}></i>
                                Payment
                            </Button>
                            <Button 
                                variant="outline-danger" 
                                className="rounded-3 hover-scale py-4"
                                onClick={handleCancelTable}
                            >
                                <i className="bi bi-x-circle-fill mb-2 d-block" style={{ fontSize: '1.5rem' }}></i>
                                Cancel
                            </Button>
                        </div>
                    )}
                </Modal.Body>
            </Modal>

            {/* Current Orders Modal */}
            <Modal 
                show={showCurrentOrdersModal} 
                onHide={() => setShowCurrentOrdersModal(false)}
                size="lg"
                centered
                className="modern-modal"
            >
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="w-100">
                        <div className="text-center">
                            <h4 className="mb-0">Current Orders</h4>
                            <div className="text-muted small mt-1">Table {selectedTable?.number}</div>
                        </div>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-4">
                    {currentTableOrders.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="bi bi-inbox text-muted" style={{ fontSize: '2rem' }}></i>
                            <p className="text-muted mt-3 mb-0">No active orders for this table</p>
                        </div>
                    ) : (
                        <Card className="receipt-card border-0 shadow-sm">
                            <Card.Header className="text-center bg-transparent pt-3">
                                <h5 className="mb-1">Current Orders Summary</h5>
                                <small className="text-muted">
                                    Last updated: {new Date().toLocaleString()}
                                </small>
                            </Card.Header>
                            <Card.Body>
                                {(() => {
                                    const { items, totalAmount } = combineOrderItems(currentTableOrders);
                                    return (
                                        <>
                                            <ListGroup variant="flush">
                                                {items.map((item, index) => (
                                                    <ListGroup.Item 
                                                        key={`${item.food_id}-${index}`}
                                                        className="d-flex justify-content-between align-items-center"
                                                    >
                                                        <div className="d-flex align-items-center gap-3">
                                                            <span className="fw-bold">
                                                                {getFoodNameById(item.food_id)}
                                                            </span>
                                                            <Badge bg="info" className="me-2">
                                                                x{item.quantity}
                                                            </Badge>
                                                            {item.note && (
                                                                <small className="text-muted">
                                                                    ({item.note})
                                                                </small>
                                                            )}
                                                        </div>
                                                        <div className="text-end">
                                                            <div>{formatCurrency(item.price)}</div>
                                                            <small className="text-muted">
                                                                Total: {formatCurrency(item.price * item.quantity)}
                                                            </small>
                                                        </div>
                                                    </ListGroup.Item>
                                                ))}
                                            </ListGroup>
                                            <div className="mt-3 border-top pt-3">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <h5 className="mb-0">Total Amount:</h5>
                                                    <h5 className="mb-0">{formatCurrency(totalAmount)}</h5>
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </Card.Body>
                        </Card>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button 
                        variant="secondary" 
                        className="rounded-pill px-4"
                        onClick={() => setShowCurrentOrdersModal(false)}
                    >
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Payment Modal */}
            <Modal show={showPaymentModal} onHide={handleCloseModal} centered dialogClassName="wide-payment-modal">
                <Modal.Header closeButton>
                    <Modal.Title>Payment for Table {selectedTable?.number}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {receipt ? (
                        <div className="receipt">
                            <div className="receipt-header">
                                <h5>RESTAURANT</h5>
                                <p>19 Đ. Nguyễn Hữu Thọ, Tân Phong, Quận 7, Hồ Chí Minh</p>
                                <p>ĐT:  028 3775 5052 -  028 3775 5052</p>
                            </div>
                            
                            <div className="receipt-title">
                                RECEIPT
                            </div>

                            <div className="receipt-info">
                                <span>Số HĐ: {receipt.receipt_id}</span>
                                <span>Bàn {selectedTable?.number}</span>
                            </div>
                            <div className="receipt-info">
                                <span>Ngày in: {new Date(receipt.payment_date).toLocaleString('vi-VN', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                })}</span>
                           
                            </div>
                            
                            <div className="receipt-info">
                                <span>Thu ngân: {userName} (#{receipt.employee_info.employee_id})</span>
                            </div>

                            
                            <div className="receipt-info">
                                <span>Khách hàng: {receipt.customer_info.name}</span>
                            </div>

                            <table className="receipt-table">
                                <thead>
                                    <tr>
                                        <th>TÊN HÀNG</th>
                                        <th>SL</th>
                                        <th>Đơn Giá</th>
                                        <th>T.TIỀN</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {receipt.order_details.orders[0].items.map((item, index) => {
                                        const menuItem = menuItems.find(m => m.food_id === item.food_id);
                                        return (
                                            <tr key={index}>
                                                <td>{index + 1}) {menuItem ? menuItem.name : item.food_id}</td>
                                                <td>{item.quantity}</td>
                                                <td>{menuItem ? menuItem.price.toLocaleString('vi-VN') : item.price?.toLocaleString('vi-VN')}đ</td>
                                                <td>{(item.quantity * (menuItem ? menuItem.price : item.price))?.toLocaleString('vi-VN')}đ</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            <div className="receipt-info" style={{borderTop: '1px dashed #000', paddingTop: '10px'}}>
                                <strong>T.Cộng</strong>
                                <strong>{receipt.total_amount.toLocaleString('vi-VN')}đ</strong>
                            </div>
                            <div className="receipt-info">
                                <strong>CASH</strong>
                                <strong>{receipt.total_amount.toLocaleString('vi-VN')}đ</strong>
                            </div>

                            <div className="receipt-footer">
                                SEE YOU SOON!
                            </div>

                            <div className="mt-3 d-flex gap-2">
                                <Button variant="success" onClick={handleCloseModal}>
                                    Close
                                </Button>
                                <Button variant="primary" onClick={() => window.print()}>
                                    Print Receipt
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Form onSubmit={handlePaymentSubmit}>
                            <Form.Group className="mb-3">
                                <Form.Label>Customer Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="name"
                                    value={customerInfo.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Phone Number</Form.Label>
                                <Form.Control
                                    type="tel"
                                    name="phone"
                                    value={customerInfo.phone}
                                    onChange={handleInputChange}
                                    required
                                />
                            </Form.Group>
                            <div className="d-grid gap-2">
                                <Button variant="primary" type="submit">
                                    Process Payment
                                </Button>
                            </div>
                        </Form>
                    )}
                </Modal.Body>
            </Modal>
        </>
    );
};

export default TableGrid;