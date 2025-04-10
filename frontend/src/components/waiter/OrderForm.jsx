import React, { useState, useEffect } from 'react';
import { Form, Button, Modal, ListGroup } from 'react-bootstrap';

const OrderForm = ({ show, handleClose, table, menuItems, onSubmit }) => {
    const [selectedItems, setSelectedItems] = useState([]);
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        setSelectedItems([]);
        setQuantity(1);
    }, [show]);

    const handleAddItem = (item) => {
        const existingItem = selectedItems.find(i => i.id === item.id);
        if (existingItem) {
            setSelectedItems(selectedItems.map(i => 
                i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i
            ));
        } else {
            setSelectedItems([...selectedItems, { ...item, quantity }]);
        }
        setQuantity(1);
    };

    const handleRemoveItem = (itemId) => {
        setSelectedItems(selectedItems.filter(item => item.id !== itemId));
    };

    const handleSubmit = () => {
        onSubmit(selectedItems);
        handleClose();
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Order for Table {table?.number}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="row">
                    <div className="col-md-6">
                        <h4>Menu Items</h4>
                        <Form.Group className="mb-3">
                            <Form.Label>Quantity</Form.Label>
                            <Form.Control
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value))}
                            />
                        </Form.Group>
                        <ListGroup>
                            {menuItems.map(item => (
                                <ListGroup.Item key={item.id} className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <strong>{item.name}</strong>
                                        <br />
                                        <small>${item.price}</small>
                                    </div>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => handleAddItem(item)}
                                    >
                                        Add
                                    </Button>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    </div>
                    <div className="col-md-6">
                        <h4>Current Order</h4>
                        <ListGroup>
                            {selectedItems.map(item => (
                                <ListGroup.Item key={item.id} className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <strong>{item.name}</strong>
                                        <br />
                                        <small>Quantity: {item.quantity}</small>
                                    </div>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => handleRemoveItem(item.id)}
                                    >
                                        Remove
                                    </Button>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
                <Button variant="primary" onClick={handleSubmit} disabled={selectedItems.length === 0}>
                    Submit Order
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default OrderForm;
