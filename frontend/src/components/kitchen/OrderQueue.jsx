import React from 'react';
import { Card, Badge, Button, ListGroup } from 'react-bootstrap';

const scrollableStyle = {
    maxHeight: 'calc(100vh - 200px)',
    overflowY: 'auto',
    paddingRight: '5px',
    scrollbarWidth: 'thin',
    scrollbarColor: '#6c757d #f8f9fa',
    // For WebKit browsers (Chrome, Safari)
    WebkitScrollbarWidth: 'thin',
    WebkitScrollbarTrack: {
        background: '#f8f9fa',
    },
    WebkitScrollbarThumb: {
        background: '#6c757d',
        borderRadius: '4px',
    }
};

// Keyframes for fade-out animation
const fadeOutStyle = {
    animation: 'fadeOut 5s',
    opacity: 0.7
};

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
    
    // Sort orders: oldest first (by creation time)
    const sortedOrders = [...orders].sort((a, b) => {
        // If created_at doesn't exist, use current time
        const dateA = new Date(a.created_at || a.createdAt || Date.now());
        const dateB = new Date(b.created_at || b.createdAt || Date.now());
        
        // Sort ascending - oldest date (smaller value) first
        return dateA - dateB; 
    });

    return (
        <div className="order-queue" style={scrollableStyle}>
            {sortedOrders.map(order => {
                // Extract order status - handle different field names
                const orderStatus = order.status || order.order_status || 'pending';
                
                // Check if this is the highlighted new order
                const isNewOrder = order.order_id === newOrderId;
                
                return (
                    <Card 
                        key={order.order_id} 
                        className={`mb-3 ${isNewOrder ? 'new-order-highlight' : ''} ${orderStatus === 'completed' ? 'fade-out' : ''}`}
                        style={isNewOrder ? {
                            borderColor: '#28a745',
                            boxShadow: '0 0 10px rgba(40, 167, 69, 0.5)',
                            animation: 'flashAnimation 1s infinite alternate'
                        } : {}}
                    >
                        <Card.Header style={isNewOrder ? { backgroundColor: '#d4edda' } : {}}>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="mb-0">Table {order.tableId || order.table_id}</h5>
                                    {(order.created_at || order.createdAt) && 
                                        <small className="text-muted">
                                            {new Date(order.created_at || order.createdAt).toLocaleString()}
                                        </small>
                                    }
                                </div>
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
                            <div className="mt-3 d-flex justify-content-between align-items-center">
                                <small className="text-muted">Order #{order.order_id}</small>
                                <div>
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
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                );
            })}
        </div>
    );
};

export default OrderQueue;

