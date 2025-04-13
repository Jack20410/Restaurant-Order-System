import React from 'react';
import { Card, Badge, Button, ListGroup } from 'react-bootstrap';

const OrderQueue = ({ orders, onStatusUpdate, newOrderId, menuItems = [] }) => {
    // Debug log orders
    console.log('Orders in OrderQueue:', orders);
    
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'warning';
            case 'preparing': return 'info';  // Added 'preparing' status
            case 'cooking': return 'info';
            case 'ready': return 'success';
            case 'ready_to_serve': return 'success';  // Added 'ready_to_serve' status
            case 'served': return 'secondary';
            case 'completed': return 'secondary';  // Added 'completed' status
            default: return 'primary';
        }
    };

    // Function to get food name from food_id using the menuItems
    const getFoodNameById = (food_id) => {
        if (!menuItems || menuItems.length === 0) return `Item #${food_id}`;
        
        const menuItem = menuItems.find(item => 
            item.food_id === food_id || item.id === food_id
        );
        
        return menuItem ? menuItem.name : `Item #${food_id}`;
    };

    // Handle empty orders array
    if (!orders || orders.length === 0) {
        return (
            <div className="text-center p-4">
                <h5 className="text-muted">No active orders</h5>
                <p>New orders will appear here</p>
            </div>
        );
    }

    return (
        <div className="order-queue">
            {orders.map(order => {
                // Extract order status - handle different field names
                const orderStatus = order.status || order.order_status || 'pending';
                
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
                                <Badge bg={getStatusColor(orderStatus)}>
                                    {orderStatus}
                                </Badge>
                            </div>
                            {isNewOrder && <span className="text-success fw-bold">New Order!</span>}
                        </Card.Header>
                        <Card.Body>
                            <ListGroup>
                                {order.items && order.items.map((item, index) => (
                                    <ListGroup.Item key={`${order.order_id}-item-${index}`}>
                                        {item.name || getFoodNameById(item.food_id)} x {item.quantity}
                                        {(item.notes || item.note) && (
                                            <small className="text-muted d-block">
                                                Note: {item.notes || item.note}
                                            </small>
                                        )}
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                            <div className="mt-3">
                                {orderStatus === 'pending' && (
                                    <Button 
                                        variant="primary"
                                        onClick={() => onStatusUpdate(order.order_id, 'preparing')}
                                    >
                                        Start Preparing
                                    </Button>
                                )}
                                {orderStatus === 'preparing' && (
                                    <Button 
                                        variant="success"
                                        onClick={() => onStatusUpdate(order.order_id, 'ready_to_serve')}
                                    >
                                        Mark as Ready
                                    </Button>
                                )}
                                {orderStatus === 'ready_to_serve' && (
                                    <Button 
                                        variant="secondary"
                                        onClick={() => onStatusUpdate(order.order_id, 'completed')}
                                    >
                                        Mark as Served
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

