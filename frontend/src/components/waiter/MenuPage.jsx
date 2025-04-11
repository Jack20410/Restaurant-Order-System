import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, ListGroup, Modal, Badge, Form, Nav } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BsCart3 } from 'react-icons/bs';
import { socketService } from '../../services/socketService';

// Define category order
const CATEGORY_ORDER = [
    'SoupBase',
    'SignatureFood',
    'Meat',
    'SideDish',
    'Beverages&Desserts'
];

const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
};

const MenuPage = () => {
    const { tableId } = useParams();
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [cart, setCart] = useState([]);
    const [showCart, setShowCart] = useState(false);

    useEffect(() => {
        // Check if user is authenticated
        const token = sessionStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchMenuItems();
    }, [navigate]);

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
                // Extract unique categories from menu items
                const uniqueCategories = [...new Set(response.data.map(item => item.category))];
                // Create formatted categories with proper ordering
                const formattedCategories = CATEGORY_ORDER
                    .filter(category => uniqueCategories.includes(category))
                    .map((category, index) => ({
                        id: index + 1,
                        name: category
                    }));
                setCategories(formattedCategories);
                if (formattedCategories.length > 0) {
                    setSelectedCategory(formattedCategories[0].name);
                }
            }
        } catch (error) {
            console.error('Error fetching menu items:', error);
            if (error.response?.status === 401) {
                navigate('/login');
            }
        }
    };

    const handleAddToCart = (item) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(i => i.food_id === item.food_id);
            if (existingItem) {
                return prevCart.map(i =>
                    i.food_id === item.food_id ? { ...i, quantity: i.quantity + 1 } : i
                );
            }
            return [...prevCart, { ...item, quantity: 1 }];
        });
    };

    const handleUpdateQuantity = (itemId, newQuantity) => {
        if (newQuantity === 0) {
            setCart(prevCart => prevCart.filter(item => item.food_id !== itemId));
        } else {
            setCart(prevCart =>
                prevCart.map(item =>
                    item.food_id === itemId ? { ...item, quantity: newQuantity } : item
                )
            );
        }
    };

    const handlePlaceOrder = async () => {
        try {
            // Step 1: Basic validation
            if (!cart.length) {
                alert('Your cart is empty. Please add some items first.');
                return;
            }
            
            // Step 2: Get token
            const token = sessionStorage.getItem('token');
            if (!token) {
                alert('Authentication token not found. Please log in again.');
                navigate('/login');
                return;
            }
            
            // Step 3: Log cart data for inspection
            console.log('Current cart data:', JSON.stringify(cart, null, 2));
            
            // Step 4: Create minimal payload with validated food_ids
            const orderPayload = {
                employee_id: parseInt(sessionStorage.getItem('userId')),
                table_id: parseInt(tableId, 10),
                total_price: cartTotal,
                items: cart.map(item => ({
                    food_id: item.food_id,  // Send as is, without parsing
                    quantity: parseInt(item.quantity || 1),
                    note: ""
                }))
            };
            
            console.log('ORDER PAYLOAD:', JSON.stringify(orderPayload, null, 2));
            
            // Step 5: Make a simple API call to the API gateway
            const response = await axios.post(
                'http://localhost:8000/api/orders',
                orderPayload,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            // Step 6: Handle success
            console.log('Order created successfully:', response.data);
            alert('Order placed successfully!');
            
            // Clear cart and close modal
            setCart([]);
            setShowCart(false);
            
            // Navigate back to waiter dashboard
            navigate('/waiter');
        } catch (error) {
            // Step 7: Basic error handling 
            console.error('Error placing order:', error);
            
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
                alert(`Order failed: ${error.response.status} ${JSON.stringify(error.response.data)}`);
            } else {
                alert('Failed to place order. Check console for details.');
            }
        }
    };

    // Test function to try direct order service access
    const testDirectOrderService = async () => {
        try {
            // Check if cart is empty
            if (!cart.length) {
                alert('Your cart is empty. Please add some items first.');
                return;
            }
            
            // Get token
            const token = sessionStorage.getItem('token');
            if (!token) {
                alert('Authentication token not found. Please log in again.');
                navigate('/login');
                return;
            }
            
            // Log the raw cart items to inspect their structure
            console.log('Raw cart items for inspection:', JSON.stringify(cart, null, 2));
            
            // Create minimal payload with validated food_ids
            const orderPayload = {
                employee_id: parseInt(sessionStorage.getItem('userId')),
                table_id: parseInt(tableId, 10),
                total_price: cartTotal,
                items: cart.map(item => ({
                    food_id: item.food_id,  // Send as is, without parsing
                    quantity: parseInt(item.quantity || 1),
                    note: ""
                }))
            };
            
            console.log('TEST - DIRECT ORDER PAYLOAD:', JSON.stringify(orderPayload, null, 2));
            
            // Try direct access to order service
            const directResponse = await fetch('http://localhost:8002/orders', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderPayload)
            });
            
            console.log('Direct service status:', directResponse.status);
            
            if (!directResponse.ok) {
                const errorText = await directResponse.text();
                console.error('Direct service error:', errorText);
                
                // Show more user-friendly error message
                if (errorText.includes('value is not a valid integer')) {
                    alert('Error: Invalid food item ID in your order. Please try again or contact support.');
                } else {
                    alert(`Error placing order: ${errorText}`);
                }
            } else {
                const responseData = await directResponse.json();
                console.log('Direct service success:', responseData);
                alert('Order placed successfully!');
                
                // On success, clear cart and navigate
                setCart([]);
                setShowCart(false);
                navigate('/waiter');
            }
        } catch (error) {
            console.error('Direct service test error:', error);
            alert(`Direct service test failed: ${error.message}`);
        }
    };

    const filteredItems = selectedCategory
        ? menuItems.filter(item => item.category === selectedCategory)
        : menuItems;

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <Container fluid className="py-3">
            <Row>
                <Col md={3}>
                    <Card className="mb-3 sticky-top" style={{ top: '1rem' }}>
                        <Card.Header className="bg-primary text-white">
                            <h5 className="mb-0">Categories</h5>
                        </Card.Header>
                        <Nav className="flex-column">
                            {categories.map(category => (
                                <Nav.Link
                                    key={category.id}
                                    className={`px-3 py-2 ${selectedCategory === category.name ? 'bg-light' : ''}`}
                                    onClick={() => setSelectedCategory(category.name)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {category.name}
                                </Nav.Link>
                            ))}
                        </Nav>
                    </Card>
                </Col>
                <Col md={9}>
                    <Row className="g-3">
                        {filteredItems.map(item => (
                            <Col key={item._id} md={4}>
                                <Card className="h-100 shadow-sm">
                                    <Card.Img 
                                        variant="top" 
                                        src={item.image} 
                                        style={{ height: '200px', objectFit: 'cover' }}
                                    />
                                    <Card.Body className="d-flex flex-column">
                                        <Card.Title>{item.name}</Card.Title>
                                        <Card.Text className="text-muted">
                                            {item.description}
                                        </Card.Text>
                                        <div className="mt-auto d-flex justify-content-between align-items-center">
                                            <span className="h5 mb-0 text-primary">
                                                {formatPrice(item.price)}
                                            </span>
                                            <Button 
                                                variant="outline-primary"
                                                onClick={() => handleAddToCart(item)}
                                                disabled={!item.availability}
                                            >
                                                {item.availability ? 'Add to Cart' : 'Unavailable'}
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Col>
            </Row>

            {/* Floating Cart Button */}
            <Button
                className="position-fixed bottom-0 end-0 mb-4 me-4 rounded-circle p-3"
                style={{ width: '60px', height: '60px', zIndex: 1050 }}
                variant="primary"
                onClick={() => setShowCart(true)}
            >
                <BsCart3 size={24} />
                {cart.length > 0 && (
                    <Badge 
                        bg="danger" 
                        className="position-absolute top-0 start-100 translate-middle"
                    >
                        {cart.length}
                    </Badge>
                )}
            </Button>

            {/* Cart Modal */}
            <Modal show={showCart} onHide={() => setShowCart(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Order Cart - Table {tableId}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {cart.length === 0 ? (
                        <p className="text-center text-muted">Cart is empty</p>
                    ) : (
                        <ListGroup variant="flush">
                            {cart.map(item => (
                                <ListGroup.Item key={item.food_id}>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 className="mb-0">{item.name}</h6>
                                            <small className="text-muted">
                                                {formatPrice(item.price)} × {item.quantity}
                                            </small>
                                        </div>
                                        <div className="d-flex align-items-center">
                                            <Button
                                                size="sm"
                                                variant="outline-secondary"
                                                onClick={() => handleUpdateQuantity(item.food_id, item.quantity - 1)}
                                            >
                                                -
                                            </Button>
                                            <span className="mx-2">{item.quantity}</span>
                                            <Button
                                                size="sm"
                                                variant="outline-secondary"
                                                onClick={() => handleUpdateQuantity(item.food_id, item.quantity + 1)}
                                            >
                                                +
                                            </Button>
                                        </div>
                                    </div>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    )}
                </Modal.Body>
                <Modal.Footer className="d-flex justify-content-between">
                    <h5>Total: {formatPrice(cartTotal)}</h5>
                    <div>
                        <Button 
                            variant="secondary" 
                            onClick={() => setShowCart(false)}
                            className="me-2"
                        >
                            Continue Shopping
                        </Button>
                        <Button 
                            variant="primary" 
                            onClick={handlePlaceOrder}
                            disabled={cart.length === 0}
                            className="me-2"
                        >
                            Place Order
                        </Button>
                        {/* Test button for direct service access */}
                        <Button 
                            variant="info" 
                            onClick={testDirectOrderService}
                            disabled={cart.length === 0}
                        >
                            Test Direct
                        </Button>
                    </div>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default MenuPage; 