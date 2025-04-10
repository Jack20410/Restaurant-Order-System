import React from 'react';
import { Card, ListGroup, Badge, Button } from 'react-bootstrap';

const ActiveOrders = ({ orders, onOrderUpdate }) => {
    const getStatusBadge = (status) => {
        const variants = {
            'pending': 'warning',
            'preparing': 'info',
            'ready': 'success',
            'served': 'primary',
            'cancelled': 'danger'
        };
        return <Badge bg={variants[status]}>{status}</Badge>;
    };

    const handleStatusUpdate = (orderId, newStatus) => {
        onOrderUpdate(orderId, newStatus);
    };

    return (
        <div className="active-orders">
            <h3>Active Orders</h3>
            <div className="row">
                {orders.map(order => (
                    <div key={order.id} className="col-md-6 mb-3">
                        <Card>
                            <Card.Header className="d-flex justify-content-between align-items-center">
                                <span>Table {order.table_number}</span>
                                {getStatusBadge(order.status)}
                            </Card.Header>
                            <Card.Body>
                                <ListGroup variant="flush">
                                    {order.items.map(item => (
                                        <ListGroup.Item key={item.id} className="d-flex justify-content-between">
                                            <span>{item.name} x {item.quantity}</span>
                                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                                <div className="mt-3">
                                    <strong>Total: ${order.total.toFixed(2)}</strong>
                                </div>
                                <div className="mt-3">
                                    {order.status === 'ready' && (
                                        <Button
                                            variant="success"
                                            size="sm"
                                            onClick={() => handleStatusUpdate(order.id, 'served')}
                                        >
                                            Mark as Served
                                        </Button>
                                    )}
                                    {order.status === 'pending' && (
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                                        >
                                            Cancel Order
                                        </Button>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActiveOrders; 