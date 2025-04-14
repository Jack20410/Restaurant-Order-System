import React from 'react';
import { Card, ListGroup, Badge, Button } from 'react-bootstrap';

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

const ActiveOrders = ({ orders, onOrderUpdate, menuItems = [] }) => {
    // Function to get food name from food_id using the menuItems
    const getFoodNameById = (food_id) => {
        if (!menuItems || menuItems.length === 0) {
            return `Item #${food_id}`;
        }
        
        // First try exact match on food_id
        const menuItem = menuItems.find(item => 
            item.food_id === food_id || item.id === food_id
        );
        
        if (menuItem) {
            return menuItem.name;
        }
        
        // If not found and food_id looks like a name (e.g., "Water"), return it
        if (typeof food_id === 'string' && food_id.length > 3 && !/^[A-Z0-9]+$/.test(food_id)) {
            return food_id;
        }
        
        return `Item #${food_id}`;
    };
    
    // Function to get food price from food_id
    const getFoodPriceById = (food_id) => {
        if (!menuItems || menuItems.length === 0) {
            return 10000; // Default price for testing if menu isn't loaded
        }
        
        const menuItem = menuItems.find(item => 
            item.food_id === food_id || item.id === food_id
        );
        
        return menuItem ? menuItem.price : 10000; // Default to 10,000 VND if not found
    };
    
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
    
    // Format price to Vietnamese currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { 
            style: 'currency', 
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Handle empty orders array
    if (!orders || orders.length === 0) {
        return (
            <div className="active-orders">
                <Card>
                    <Card.Body className="text-center text-muted">
                        No active orders available
                    </Card.Body>
                </Card>
            </div>
        );
    }
    
    // Sort orders: oldest first (by creation time)
    const sortedOrders = [...orders].sort((a, b) => {
        // If created_at doesn't exist, use current time
        const dateA = new Date(a.created_at || Date.now());
        const dateB = new Date(b.created_at || Date.now());
        
        // Sort ascending - oldest date (smaller value) first
        return dateA - dateB; 
    });

    return (
        <div className="active-orders">
            <div 
                className="orders-list" 
                style={scrollableStyle}
            >
                {sortedOrders.map(order => (
                    <Card key={order.id} className="mb-3">
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <div>
                                <span>Table {order.table_number}</span>
                                {order.created_at && 
                                    <small className="d-block text-muted">
                                        {new Date(order.created_at).toLocaleString()}
                                    </small>
                                }
                            </div>
                            {getStatusBadge(order.status)}
                        </Card.Header>
                        <Card.Body>
                            <ListGroup variant="flush">
                                {order.items && order.items.map((item, index) => {
                                    // Determine the food_id to use - it could be in different properties
                                    const foodId = item.food_id || item.id;
                                    // Get the price or use the one in the item if it exists
                                    const price = item.price || getFoodPriceById(foodId);
                                    
                                    return (
                                        <ListGroup.Item key={`${order.id}-item-${index}`} className="d-flex justify-content-between">
                                            <div>
                                                <span>
                                                    {getFoodNameById(foodId)} x {item.quantity}
                                                </span>
                                            </div>
                                            <span className='text-end'> {formatCurrency(price * item.quantity)}</span>
                                        </ListGroup.Item>
                                    );
                                })}
                            </ListGroup>
                            <div className="mt-3 d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>Total: {formatCurrency(order.total)}</strong>
                                </div>
                                <div className="d-flex gap-2">
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
                            </div>
                        </Card.Body>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default ActiveOrders; 