import React, { useState } from 'react';
import { Card, Button, Badge, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const TableGrid = ({ tables, onTableSelect, onTableStatusChange }) => {
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [selectedTable, setSelectedTable] = useState(null);

    const getStatusBadge = (status) => {
        const variants = {
            'available': 'success',
            'occupied': 'danger'
        };
        return (
            <Badge bg={variants[status] || 'secondary'} className="mb-2">
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    const handleTableClick = (table) => {
        setSelectedTable(table);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedTable(null);
    };

    const handleUseTable = () => {
        onTableStatusChange(selectedTable.id, 'occupied');
        handleCloseModal();
    };

    const handleTakeOrder = () => {
        navigate(`/waiter/menu/${selectedTable.id}`);
        handleCloseModal();
    };

    const handleMakePayment = () => {
        // Will implement payment logic later
        onTableStatusChange(selectedTable.id, 'available');
        handleCloseModal();
    };

    const handleCancelTable = () => {
        onTableStatusChange(selectedTable.id, 'available');
        handleCloseModal();
    };

    return (
        <>
            <div className="table-grid">
                <div className="row g-3">
                    {tables.map((table) => (
                        <div key={table.id} className="col-md-4 col-sm-6">
                            <Card className="h-100 shadow-sm">
                                <Card.Body className="d-flex flex-column">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <Card.Title className="mb-0">Table {table.number}</Card.Title>
                                        {getStatusBadge(table.status)}
                                    </div>
                                    <Card.Text className="text-muted mb-3">
                                        Capacity: {table.capacity} people
                                    </Card.Text>
                                    <Button 
                                        variant={table.status === 'occupied' ? 'outline-danger' : 'outline-success'}
                                        onClick={() => handleTableClick(table)}
                                        className="mt-auto"
                                    >
                                        {table.status === 'occupied' ? 'Manage Table' : 'Use Table'}
                                    </Button>
                                </Card.Body>
                            </Card>
                        </div>
                    ))}
                </div>
            </div>

            <Modal show={showModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Table {selectedTable?.number}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedTable?.status === 'available' ? (
                        <div className="d-grid gap-2">
                            <Button variant="primary" onClick={handleUseTable}>
                                Use this table
                            </Button>
                        </div>
                    ) : (
                        <div className="d-grid gap-2">
                            <Button variant="primary" onClick={handleTakeOrder}>
                                Take Order
                            </Button>
                            <Button variant="success" onClick={handleMakePayment}>
                                Make Payment
                            </Button>
                            <Button variant="outline-danger" onClick={handleCancelTable}>
                                Cancel Table
                            </Button>
                        </div>
                    )}
                </Modal.Body>
            </Modal>
        </>
    );
};

export default TableGrid;