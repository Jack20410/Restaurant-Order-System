import React from 'react';
import { Container, Row, Col, Navbar, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import UserList from './UserList';

const ManagerDashboard = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        // Clear session storage
        sessionStorage.clear();
        // Navigate to login page
        navigate('/', { replace: true });
    };

    return (
        <>
            <Navbar bg="dark" variant="dark" className="mb-3">
                <Container fluid>
                    <Navbar.Brand>Restaurant Management</Navbar.Brand>
                    <Navbar.Toggle />
                    <Navbar.Collapse className="justify-content-end">
                        <Navbar.Text className="me-3">
                            Signed in as: <span className="text-white">Manager</span>
                        </Navbar.Text>
                        <Button variant="outline-light" onClick={handleLogout}>
                            Logout
                        </Button>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
            <Container fluid>
                <Row>
                    <Col>
                        <UserList />
                    </Col>
                </Row>
            </Container>
        </>
    );
};

export default ManagerDashboard; 