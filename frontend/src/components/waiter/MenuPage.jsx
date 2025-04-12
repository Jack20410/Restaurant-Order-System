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
            return [...prevCart, { ...item, quantity: 1, note: '' }];  // Initialize note as empty string
        });
    };

    const handleUpdateNote = (itemId, note) => {
        setCart(prevCart =>
            prevCart.map(item =>
                item.food_id === itemId ? { ...item, note } : item
            )
        );
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
            // 1. Check if cart is empty
            if (!cart.length) {
                alert('Your cart is empty. Please add some items first.');
                return;
            }
            
            // 2. Get authentication data
            const token = sessionStorage.getItem('token');
            const userId = sessionStorage.getItem('userId');
            if (!token || !userId) {
                alert('Authentication token not found. Please log in again.');
                navigate('/login');
                return;
            }
            
            // 3. Create order payload
            const orderPayload = {
                employee_id: parseInt(userId),
                table_id: parseInt(tableId),
                total_price: cartTotal,
                order_status: "pending",
                // In the handlePlaceOrder function, update the items mapping:
                items: cart.map(item => ({
                    food_id: String(item.food_id),
                    quantity: parseInt(item.quantity || 1),
                    note: item.note || ''  // Include the note in the order payload
                }))
            };
            
            console.log('Order payload:', JSON.stringify(orderPayload, null, 2));
            
            // 4. Place order directly to order service using REST API
            // Use the direct service URL that has been confirmed to work
            const response = await fetch('http://localhost:8002/orders/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderPayload)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to place order');
            }
            
            const responseData = await response.json();
            console.log('Order placed successfully:', responseData);
            
            // 5. Emit WebSocket event to notify kitchen about the new order
            // Even though we placed the order via REST, we can still notify other services via WebSocket
            try {
                socketService.emitOrderUpdate({
                    type: 'new_order',
                    order_id: responseData.order_id,
                    table_id: parseInt(tableId),
                    status: 'pending',
                    items: orderPayload.items
                });
                console.log('WebSocket notification sent to kitchen');
            } catch (socketError) {
                console.warn('Could not send WebSocket notification:', socketError.message);
                // Continue anyway since the order was placed successfully
            }
            
            // 6. Handle success
            setCart([]);
            setShowCart(false);
            alert('Order placed successfully!');
            navigate('/waiter');
            
        } catch (error) {
            console.error('Error placing order:', error);
            alert(`Failed to place order: ${error.message}`);
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
                                    <div className="d-flex flex-column">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
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
                                        <Form.Group>
                                            <Form.Control
                                                as="textarea"
                                                rows={2}
                                                placeholder="Thêm ghi chú cho món ăn..."
                                                value={item.note || ''}
                                                onChange={(e) => handleUpdateNote(item.food_id, e.target.value)}
                                                className="mt-2"
                                            />
                                        </Form.Group>
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
                        
                    </div>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default MenuPage;