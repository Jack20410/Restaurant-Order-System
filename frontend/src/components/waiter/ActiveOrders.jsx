import React, { useState } from 'react';
import { Card, ListGroup, Badge, Button, Modal, Form, Row, Col } from 'react-bootstrap';

const ActiveOrders = ({ orders, onOrderUpdate, onPayment }) => {
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedTableOrders, setSelectedTableOrders] = useState(null);

    const formatVND = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    // Group orders by table
    const groupedOrders = orders.reduce((acc, order) => {
        if (!acc[order.table_number]) {
            acc[order.table_number] = [];
        }
        acc[order.table_number].push(order);
        return acc;
    }, {});

    const calculateTableTotal = (tableOrders) => {
        return tableOrders.reduce((sum, order) => sum + order.total, 0);
    };

    const getTableStatus = (tableOrders) => {
        const allCompleted = tableOrders.every(order => order.status === 'completed');
        const hasCancelled = tableOrders.some(order => order.status === 'cancelled');
        
        if (hasCancelled) return 'cancelled';
        if (allCompleted) return 'ready_to_pay';
        return 'in_progress';
    };

    const getStatusBadge = (status) => {
        const variants = {
            'in_progress': 'warning',
            'ready_to_pay': 'success',
            'cancelled': 'danger',
            'completed': 'primary',
            'preparing': 'info',
            'pending': 'secondary',
            'served': 'success',  // Add variant for served status
            'ready_to_serve': 'info'  // Add variant for ready_to_serve status
        };
        const labels = {
            'in_progress': 'In Progress',
            'ready_to_pay': 'Ready to Pay',
            'cancelled': 'Cancelled',
            'completed': 'Completed',
            'preparing': 'Preparing',
            'pending': 'Pending',
            'served': 'Served',  // Add label for served status
            'ready_to_serve': 'Ready to Serve'  // Add label for ready_to_serve status
        };
        return <Badge bg={variants[status]}>{labels[status]}</Badge>;
    };

    const handleViewDetails = (tableNumber) => {
        setSelectedTableOrders(groupedOrders[tableNumber]);
        setShowDetailsModal(true);
    };

    const handleCancelOrder = (orderId) => {
        onOrderUpdate(orderId, 'cancelled');
    };

    const handlePayment = (tableNumber) => {
        const tableOrders = groupedOrders[tableNumber];
        if (getTableStatus(tableOrders) === 'ready_to_pay') {
            onPayment(tableNumber, tableOrders);
        }
    };

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentInfo, setPaymentInfo] = useState({
        customerName: '',
        age: '',
        birthDate: '',
        membershipCard: 'no',
        membershipId: '',
        paymentMethod: 'cash',
        note: '',
        cashReceived: 0
    });
    const [currentTableData, setCurrentTableData] = useState(null);

    const handlePaymentClick = (tableNumber, tableOrders) => {
        setCurrentTableData({ tableNumber, orders: tableOrders });
        setShowPaymentModal(true);
    };




    // Modify the existing payment button to use the new handler
    return (
        <div className="active-orders">
            <h3>Active Orders</h3>
            <div className="row">
                {Object.entries(groupedOrders).map(([tableNumber, tableOrders]) => {
                    const tableStatus = getTableStatus(tableOrders);
                    const tableTotal = calculateTableTotal(tableOrders);

                    return (
                        <div key={tableNumber} className="col-12 mb-3">
                            <Card>
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h5 className="mb-0">Table {tableNumber}</h5>
                                        {getStatusBadge(tableStatus)}
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <strong>Total: {formatVND(tableTotal)}</strong>
                                        <div className="d-flex gap-2">
                                            <Button
                                                variant="primary"
                                                onClick={() => handleViewDetails(tableNumber)}
                                            >
                                                View Details
                                            </Button>
                                            <Button
                                                variant="success"
                                                disabled={tableStatus !== 'ready_to_pay'}
                                                onClick={() => handlePaymentClick(tableNumber, tableOrders)}
                                            >
                                                Payment
                                            </Button>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </div>
                    );
                })}
            </div>

            <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        Order Details - Table {selectedTableOrders?.[0]?.table_number}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedTableOrders?.map((order) => (
                        <Card key={order.id} className="mb-3">
                            <Card.Header className="d-flex justify-content-between align-items-center">
                                <span>Order #{order.id}</span>
                                <div className="d-flex gap-2 align-items-center">
                                    {getStatusBadge(order.status)}
                                    {order.status !== 'cancelled' && (
                                        <Button 
                                            variant="danger" 
                                            size="sm"
                                            onClick={() => handleCancelOrder(order.id)}
                                            disabled={order.status !== 'pending'}
                                        >
                                            Cancel Order
                                        </Button>
                                    )}
                                </div>
                            </Card.Header>
                            <ListGroup variant="flush">
                                {order.items?.map((item, index) => (
                                    <ListGroup.Item 
                                        key={index}
                                    >
                                        <div className="d-flex justify-content-between mb-1">
                                            <span>{item.name} x {item.quantity}</span>
                                            <span>{formatVND(item.price * item.quantity)}</span>
                                        </div>
                                        {item.note && (
                                            <small className="text-muted">Note: {item.note}</small>
                                        )}
                                    </ListGroup.Item>
                                ))}
                                <ListGroup.Item className="d-flex justify-content-between">
                                    <strong>Order Total:</strong>
                                    <strong>{formatVND(order.total)}</strong>
                                </ListGroup.Item>
                            </ListGroup>
                        </Card>
                    ))}
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default ActiveOrders;