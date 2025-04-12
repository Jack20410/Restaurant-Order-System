import React from 'react';
import { Card, ListGroup, Badge, Button } from 'react-bootstrap';

const ActiveOrders = ({ orders, onOrderUpdate }) => {
    console.log('Orders in ActiveOrders component:', orders);
    
    const getStatusBadge = (status) => {
        const variants = {
            'pending': 'warning',
            'preparing': 'info',
            'ready_to_serve': 'success',
            'completed': 'primary',
            'cancelled': 'danger'
        };
        return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
    };

    const handleStatusUpdate = (orderId, newStatus) => {
        console.log(`Calling order update for order ${orderId} with status ${newStatus}`);
        onOrderUpdate(orderId, newStatus);
    };

    // Handle empty orders array
    if (!orders || orders.length === 0) {
        return (
            <div className="active-orders">
                <h3>Active Orders</h3>
                <Card>
                    <Card.Body className="text-center text-muted">
                        No active orders available
                    </Card.Body>
                </Card>
            </div>
        );
    }

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
                                    {order.items && order.items.map((item, index) => (
                                        <ListGroup.Item key={`${order.id}-item-${index}`} className="d-flex justify-content-between">
                                            <span>{item.name || `Item #${item.id || item.food_id}`} x {item.quantity}</span>
                                            <span>{(item.price * item.quantity).toFixed(2) || 'N/A'}</span>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                                <div className="mt-3">
                                    <strong>Total: ${order.total.toFixed(2)}</strong>
                                </div>
                                <div className="mt-3 d-flex gap-2">
                                    {order.status === 'ready_to_serve' && (
                                        <Button
                                            variant="success"
                                            onClick={() => handleStatusUpdate(order.id, 'completed')}
                                        >
                                            Mark as Served
                                        </Button>
                                    )}
                                    {order.status === 'pending' && (
                                        <Button
                                            variant="danger"
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