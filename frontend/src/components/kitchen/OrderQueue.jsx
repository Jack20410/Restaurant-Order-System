import React from 'react';
import { Card, Badge, Button, ListGroup } from 'react-bootstrap';

const OrderQueue = ({ orders, onStatusUpdate }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'warning';
            case 'cooking': return 'info';
            case 'ready': return 'success';
            case 'served': return 'secondary';
            default: return 'primary';
        }
    };

    return (
        <div className="order-queue">
            {orders.map(order => (
                <Card key={order.order_id} className="mb-3">
                    <Card.Header>
                        <div className="d-flex justify-content-between align-items-center">
                            <h5>Table {order.tableId}</h5>
                            <Badge bg={getStatusColor(order.status)}>
                                {order.status}
                            </Badge>
                        </div>
                    </Card.Header>
                    <Card.Body>
                        <ListGroup>
                            {order.items.map(item => (
                                <ListGroup.Item key={item.food_id}>
                                    {item.name} x {item.quantity}
                                    {item.notes && (
                                        <small className="text-muted d-block">
                                            Note: {item.notes}
                                        </small>
                                    )}
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                        <div className="mt-3">
                            {order.status === 'pending' && (
                                <Button 
                                    variant="primary"
                                    onClick={() => onStatusUpdate(order.order_id, 'cooking')}
                                >
                                    Start Cooking
                                </Button>
                            )}
                            {order.status === 'cooking' && (
                                <Button 
                                    variant="success"
                                    onClick={() => onStatusUpdate(order.order_id, 'ready')}
                                >
                                    Mark as Ready
                                </Button>
                            )}
                        </div>
                    </Card.Body>
                </Card>
            ))}
        </div>
    );
};

export default OrderQueue;

