import React from 'react';
import { Container, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const WaiterPage = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        navigate('/');
    };

    return (
        <Container className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Waiter Dashboard</h1>
                <Button variant="secondary" onClick={handleLogout}>
                    Logout
                </Button>
            </div>
            <div className="alert alert-info">
                This is the waiter page. You can customize this page later with waiter-specific functionality.
            </div>
        </Container>
    );
};

export default WaiterPage; 