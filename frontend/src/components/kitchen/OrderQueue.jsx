import React from 'react';
import { Card, Badge, Button, ListGroup } from 'react-bootstrap';

const OrderQueue = ({ orders, onStatusUpdate, newOrderId }) => {
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
            {orders.map(order => {
                // Check if this is the highlighted new order
                const isNewOrder = order.order_id === newOrderId;
                
                return (
                    <Card 
                        key={order.order_id} 
                        className={`mb-3 ${isNewOrder ? 'new-order-highlight' : ''}`}
                        style={isNewOrder ? {
                            borderColor: '#28a745',
                            boxShadow: '0 0 10px rgba(40, 167, 69, 0.5)',
                            animation: 'flashAnimation 1s infinite alternate'
                        } : {}}
                    >
                        <Card.Header style={isNewOrder ? { backgroundColor: '#d4edda' } : {}}>
                            <div className="d-flex justify-content-between align-items-center">
                                <h5>Table {order.tableId || order.table_id}</h5>
                                <Badge bg={getStatusColor(order.status)}>
                                    {order.status}
                                </Badge>
                            </div>
                            {isNewOrder && <span className="text-success font-weight-bold">New Order!</span>}
                        </Card.Header>
                        <Card.Body>
                            <ListGroup>
                                {order.items && order.items.map((item, index) => (
                                    <ListGroup.Item key={`${order.order_id}-item-${index}`}>
                                        {item.name || `Item #${item.food_id}`} x {item.quantity}
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
                );
            })}
        </div>
    );
};

export default OrderQueue;

