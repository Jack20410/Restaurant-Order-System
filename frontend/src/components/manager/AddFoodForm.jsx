import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Alert, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaPlus, FaTrash, FaUpload } from 'react-icons/fa';

const FOOD_CATEGORIES = {
    SOUP_BASE: "SoupBase",
    SIGNATURE_FOOD: "SignatureFood",
    SIDE_DISH: "SideDish",
    MEAT: "Meat",
    BEVERAGES_DESSERTS: "Beverages&Desserts"
};

const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
};

const AddFoodForm = () => {
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [menuItems, setMenuItems] = useState([]);
    const [message, setMessage] = useState({ type: '', content: '' });
    const [selectedFile, setSelectedFile] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        availability: true,
        image: '',
        category: 'SoupBase',
        description: '',
        price: '',
        food_id: ''
    });

    useEffect(() => {
        fetchMenuItems();
    }, []);

    const fetchMenuItems = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await axios.get('http://localhost:8000/api/kitchen/menu/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.data) {
                setMenuItems(response.data);
            }
        } catch (error) {
            console.error('Error fetching menu items:', error);
            if (error.response?.status === 401) {
                navigate('/login');
            }
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const uploadImage = async () => {
        if (!selectedFile) {
            setMessage({ type: 'danger', content: 'Please select an image file' });
            return null;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('category', formData.category);

        try {
            const token = sessionStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:8000/api/kitchen/menu/upload-image',
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            return response.data.image_url;
        } catch (error) {
            console.error('Error uploading image:', error);
            setMessage({ 
                type: 'danger', 
                content: error.response?.data?.detail || 'Error uploading image' 
            });
            return null;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Upload image first if a file is selected
            let imageUrl = formData.image;
            if (selectedFile) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', selectedFile);
                uploadFormData.append('category', formData.category);
                
                const token = sessionStorage.getItem('token');
                const uploadResponse = await axios.post(
                    'http://localhost:8000/api/kitchen/menu/upload-image',
                    uploadFormData,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );
                imageUrl = uploadResponse.data.image_url;
            }

            const token = sessionStorage.getItem('token');
            if (!token) {
                setMessage({ type: 'danger', content: 'You are not logged in or your session has expired!' });
                return;
            }

            const response = await axios.post('http://localhost:8000/api/kitchen/menu/', {
                ...formData,
                image: imageUrl,
                price: parseFloat(formData.price)
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data && response.data.message) {
                setMessage({ type: 'success', content: response.data.message });
                // Reset form
                setFormData({
                    name: '',
                    availability: true,
                    image: '',
                    category: 'SoupBase',
                    description: '',
                    price: '',
                    food_id: ''
                });
                setSelectedFile(null);
                // Close modal and refresh menu items
                setShowModal(false);
                fetchMenuItems();
            }
        } catch (error) {
            console.error('Error adding food item:', error);
            if (error.response) {
                setMessage({ 
                    type: 'danger', 
                    content: error.response.data?.detail || 'Error adding food item.' 
                });
            } else if (error.request) {
                setMessage({ 
                    type: 'danger', 
                    content: 'Cannot connect to server. Please check your connection.' 
                });
            } else {
                setMessage({ 
                    type: 'danger', 
                    content: 'Error sending request.' 
                });
            }
        }
    };

    const handleDelete = async (foodId, foodName) => {
        if (window.confirm(`Are you sure you want to delete "${foodName}"?`)) {
            try {
                const token = sessionStorage.getItem('token');
                if (!token) {
                    setMessage({ type: 'danger', content: 'You are not logged in or your session has expired!' });
                    return;
                }

                await axios.delete(`http://localhost:8000/api/kitchen/menu/${foodId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                setMessage({ type: 'success', content: `Successfully deleted ${foodName}` });
                fetchMenuItems(); // Refresh the list
            } catch (error) {
                console.error('Error deleting food item:', error);
                setMessage({ 
                    type: 'danger', 
                    content: error.response?.data?.detail || 'Error deleting food item.' 
                });
            }
        }
    };

    return (
        <Container fluid className="py-3">
            {/* Menu Items Grid */}
            <Row className="mb-3">
                <Col className="d-flex justify-content-between align-items-center">
                    <h2>Menu Management</h2>
                    <Button variant="primary" onClick={() => setShowModal(true)}>
                        <FaPlus className="me-2" /> Add New Food Item
                    </Button>
                </Col>
            </Row>

            {message.content && (
                <Alert variant={message.type} className="mb-3">
                    {message.content}
                </Alert>
            )}

            <Row className="g-3">
                {menuItems.map(item => (
                    <Col key={item.food_id} md={4}>
                        <Card className="h-100 shadow-sm">
                            <Card.Img 
                                variant="top" 
                                src={item.image} 
                                style={{ height: '200px', objectFit: 'cover' }}
                            />
                            <Card.Body>
                                <Card.Title className="d-flex justify-content-between align-items-start">
                                    <span>{item.name}</span>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => handleDelete(item.food_id, item.name)}
                                    >
                                        <FaTrash />
                                    </Button>
                                </Card.Title>
                                <Card.Text className="text-muted">{item.description}</Card.Text>
                                <div className="d-flex justify-content-between align-items-center">
                                    <span className="h5 mb-0 text-primary">{formatPrice(item.price)}</span>
                                    <Badge bg={item.availability ? 'success' : 'danger'}>
                                        {item.availability ? 'Available' : 'Unavailable'}
                                    </Badge>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Add Food Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Add New Food Item</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {message.content && (
                        <Alert variant={message.type} className="mb-3">
                            {message.content}
                        </Alert>
                    )}
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Food Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Check
                                type="checkbox"
                                label="Available"
                                name="availability"
                                checked={formData.availability}
                                onChange={handleChange}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Image</Form.Label>
                            <div className="d-flex align-items-center">
                                <Form.Control
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="me-2"
                                />
                                {selectedFile && (
                                    <span className="text-muted">
                                        {selectedFile.name}
                                    </span>
                                )}
                            </div>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Category</Form.Label>
                            <Form.Select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                            >
                                {Object.values(FOOD_CATEGORIES).map(category => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Price (VND)</Form.Label>
                            <Form.Control
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Food ID</Form.Label>
                            <Form.Control
                                type="text"
                                name="food_id"
                                value={formData.food_id}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSubmit}>
                        Add Food Item
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default AddFoodForm; 