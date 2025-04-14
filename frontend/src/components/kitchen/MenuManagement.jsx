import React from 'react';
import { Card, Form, ListGroup } from 'react-bootstrap';

const MenuManagement = ({ menuItems, onAvailabilityUpdate }) => {
    return (
        <Card>
            <Card.Header className="bg-warning text-black">
                <h4>Menu Management</h4>
            </Card.Header>
            <Card.Body>
                <ListGroup style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                    {menuItems.map(item => (
                        <ListGroup.Item key={item.food_id}>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6>{item.name}</h6>
                                    <small className="text-muted">
                                        {item.category}
                                    </small>
                                </div>
                                <Form.Check 
                                    type="switch"
                                    checked={item.availability}
                                    onChange={(e) => onAvailabilityUpdate(item.food_id, e.target.checked)}
                                    label="Available"
                                />
                            </div>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </Card.Body>
        </Card>
    );
};

export default MenuManagement;

