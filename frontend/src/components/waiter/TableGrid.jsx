// Add this import at the top of the file
import '../../styles/TableGrid.css';
// import React, { useState } from 'react';
import { Card, Button, Badge, Modal, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useState, useEffect } from 'react';

const TableGrid = ({ tables, onTableSelect, onTableStatusChange, userName }) => {
    // Add this state with other states
    const [menuItems, setMenuItems] = useState([]);

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

    const handleCancelTable = () => {
        onTableStatusChange(selectedTable.id, 'available');
        handleCloseModal();
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
            <Modal show={showModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Table {selectedTable?.number}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedTable?.status === 'available' ? (
                        <div className="d-grid gap-2">
                            <Button variant="primary" onClick={handleUseTable}>
                                Use this table
                            </Button>
                        </div>
                    ) : (
                        <div className="d-grid gap-2">
                            <Button variant="primary" onClick={handleTakeOrder}>
                                Take Order
                            </Button>
                            <Button variant="success" onClick={handleMakePayment}>
                                Make Payment
                            </Button>
                            <Button variant="outline-danger" onClick={handleCancelTable}>
                                Cancel Table
                            </Button>
                        </div>
                    )}
                </Modal.Body>
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