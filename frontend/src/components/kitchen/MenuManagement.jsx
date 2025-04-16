import React, { useState, useMemo } from 'react';
import { Card, Form, ListGroup, Spinner, Alert, Accordion } from 'react-bootstrap';

const MenuManagement = ({ menuItems, onAvailabilityUpdate }) => {
    const [loadingItems, setLoadingItems] = useState(new Set());
    const [error, setError] = useState(null);

    // Group menu items by category
    const menuByCategory = useMemo(() => {
        const grouped = menuItems.reduce((acc, item) => {
            if (!acc[item.category]) {
                acc[item.category] = [];
            }
            acc[item.category].push(item);
            return acc;
        }, {});

        // Sort items within each category by name
        Object.keys(grouped).forEach(category => {
            grouped[category].sort((a, b) => a.name.localeCompare(b.name));
        });

        return grouped;
    }, [menuItems]);

    const handleAvailabilityChange = async (itemId, availability) => {
        try {
            setLoadingItems(prev => new Set(prev).add(itemId));
            setError(null);
            await onAvailabilityUpdate(itemId, availability);
        } catch (err) {
            setError(err.message || 'Failed to update availability');
        } finally {
            setLoadingItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(itemId);
                return newSet;
            });
        }
    };

    // Get category status (all available, some available, none available)
    const getCategoryStatus = (items) => {
        const availableCount = items.filter(item => item.availability).length;
        if (availableCount === 0) return 'text-danger';
        if (availableCount === items.length) return 'text-success';
        return 'text-warning';
    };

    // Get category availability text
    const getCategoryAvailabilityText = (items) => {
        const availableCount = items.filter(item => item.availability).length;
        return `${availableCount}/${items.length} available`;
    };

    return (
        <Card>
            <Card.Header className="bg-warning text-black">
                <h4>Menu Management</h4>
            </Card.Header>
            <Card.Body>
                {error && (
                    <Alert variant="danger" onClose={() => setError(null)} dismissible>
                        {error}
                    </Alert>
                )}
                <Accordion>
                    {Object.entries(menuByCategory).map(([category, items], index) => (
                        <Accordion.Item key={category} eventKey={index.toString()}>
                            <Accordion.Header>
                                <div className="d-flex justify-content-between align-items-center w-100">
                                    <span>{category}</span>
                                    <span className={`${getCategoryStatus(items)} me-3`} style={{ fontSize: '0.9em' }}>
                                        {getCategoryAvailabilityText(items)}
                                    </span>
                                </div>
                            </Accordion.Header>
                            <Accordion.Body className="p-0">
                                <ListGroup variant="flush">
                                    {items.map(item => (
                                        <ListGroup.Item key={item.food_id}>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div style={{ flex: 1 }}>
                                                    <h6 className="mb-0">{item.name}</h6>
                                                    {/* <small className="text-muted">
                                                        ${item.price}
                                                    </small> */}
                                                </div>
                                                <div className="d-flex align-items-center" style={{ width: '140px', justifyContent: 'flex-end' }}>
                                                    {loadingItems.has(item.food_id) ? (
                                                        <Spinner animation="border" size="sm" />
                                                    ) : (
                                                        <div className="d-flex align-items-center">
                                                            <Form.Check 
                                                                type="switch"
                                                                id={`availability-${item.food_id}`}
                                                                checked={item.availability}
                                                                onChange={(e) => handleAvailabilityChange(item.food_id, e.target.checked)}
                                                                style={{ marginRight: '8px' }}
                                                            />
                                                            <span 
                                                                className={item.availability ? 'text-success' : 'text-danger'}
                                                                style={{ width: '90px' }}
                                                            >
                                                                {item.availability ? 'Available' : 'Unavailable'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            </Accordion.Body>
                        </Accordion.Item>
                    ))}
                </Accordion>
            </Card.Body>
        </Card>
    );
};

export default MenuManagement;

