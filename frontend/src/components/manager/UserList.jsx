import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Container, Button, Modal, Form, Alert } from 'react-bootstrap';
import axios from 'axios';

const ROLES = ['waiter', 'kitchen', 'manager'];
const SHIFTS = ['day', 'night'];

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [formErrors, setFormErrors] = useState({});
    const navigate = useNavigate();

    // Auto-dismiss success message after 5 seconds
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => {
                setSuccess('');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    const [formData, setFormData] = useState({
        name: '',
        mail: '',
        password: '',
        role: ROLES[0],
        shifts: SHIFTS[0]
    });

    const validateForm = () => {
        const errors = {};
        
        // Name validation
        if (!formData.name.trim()) {
            errors.name = 'Name is required';
        } else if (formData.name.length < 2) {
            errors.name = 'Name must be at least 2 characters long';
        } else if (formData.name.length > 50) {
            errors.name = 'Name must be less than 50 characters';
        }

        // Email validation
        if (!formData.mail) {
            errors.mail = 'Email is required';
        } else if (!EMAIL_REGEX.test(formData.mail)) {
            errors.mail = 'Please enter a valid email address';
        } else if (formData.mail.length > 50) {
            errors.mail = 'Email must be less than 50 characters';
        }

        // Password validation
        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters long';
        } else if (formData.password.length > 50) {
            errors.password = 'Password must be less than 50 characters';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const resetForm = () => {
        setFormData({
            name: '',
            mail: '',
            password: '',
            role: ROLES[0],
            shifts: SHIFTS[0]
        });
        setError('');
        setSuccess('');
        setFormErrors({});
    };

    const fetchUsers = async () => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) {
                navigate('/', { replace: true });
                return;
            }

            const response = await axios.get('/api/users/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setUsers(response.data);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError(err.response?.data?.detail || 'Failed to fetch users');
            if (err.response?.status === 401) {
                sessionStorage.clear();
                navigate('/', { replace: true });
            }
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        // Validate form before submission
        if (!validateForm()) {
            return;
        }

        try {
            const token = sessionStorage.getItem('token');
            if (!token) {
                setError('You must be logged in to perform this action');
                return;
            }

            // Create new user
            const response = await axios.post('/api/users/users/create', {
                name: formData.name.trim(),
                mail: formData.mail.trim().toLowerCase(),
                password: formData.password,
                role: formData.role.toLowerCase(),
                shifts: formData.shifts.toLowerCase()
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // First close modal and reset form
            setShowModal(false);
            resetForm();
            // Then fetch updated list
            await fetchUsers();
            // Finally show success message
            setSuccess(`Successfully created user: ${formData.name}`);
        } catch (err) {
            console.error('Error creating user:', err);
            if (err.response?.status === 401) {
                setError('You are not authorized to create users');
                sessionStorage.clear();
                navigate('/', { replace: true });
            } else if (err.response?.status === 400) {
                if (err.response.data?.detail?.includes('Email already registered')) {
                    setFormErrors({ ...formErrors, mail: 'This email is already registered' });
                } else {
                    setError(err.response.data?.detail || 'Invalid input data');
                }
            } else {
                setError('Failed to create user. Please try again later.');
            }
        }
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const token = sessionStorage.getItem('token');
            const updateData = {
                role: formData.role.toLowerCase(),
                shifts: formData.shifts.toLowerCase()
            };

            await axios.put(`/api/users/users/${selectedUser.user_id}`, updateData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // First close modal and reset form
            setShowEditModal(false);
            resetForm();
            // Then fetch updated list
            await fetchUsers();
            // Finally show success message
            setSuccess(`Successfully updated user: ${selectedUser.name}`);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to update user');
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) {
            return;
        }

        try {
            const token = sessionStorage.getItem('token');
            const userToDelete = users.find(u => u.user_id === userId);
            const userName = userToDelete.name; // Store name before deletion

            await axios.delete(`/api/users/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // First fetch updated list
            await fetchUsers();
            // Then show success message
            setSuccess(`Successfully deleted user: ${userName}`);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to delete user');
        }
    };

    const openEditModal = (user) => {
        setSelectedUser(user);
        setFormData({
            ...formData,
            role: user.role.toLowerCase(),
            shifts: user.shifts.toLowerCase()
        });
        setShowEditModal(true);
    };

    return (
        <Container>
            {error && (
                <Alert variant="danger" onClose={() => setError('')} dismissible>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert variant="success" onClose={() => setSuccess('')} dismissible>
                    {success}
                </Alert>
            )}

            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>User Management</h2>
                <Button variant="primary" onClick={() => setShowModal(true)}>
                    Add New User
                </Button>
            </div>

            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Shifts</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.user_id}>
                            <td>{user.user_id}</td>
                            <td>{user.name}</td>
                            <td>{user.mail}</td>
                            <td>{user.role}</td>
                            <td>{user.shifts}</td>
                            <td>
                                <Button 
                                    variant="info" 
                                    size="sm" 
                                    className="me-2"
                                    onClick={() => openEditModal(user)}
                                >
                                    Edit
                                </Button>
                                <Button 
                                    variant="danger" 
                                    size="sm"
                                    onClick={() => handleDelete(user.user_id)}
                                >
                                    Delete
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            {/* Add User Modal */}
            <Modal show={showModal} onHide={() => {
                resetForm();
                setShowModal(false);
            }}>
                <Modal.Header closeButton>
                    <Modal.Title>Add New User</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.name}
                                onChange={(e) => {
                                    setFormData({...formData, name: e.target.value});
                                    setFormErrors({...formErrors, name: ''});
                                }}
                                isInvalid={!!formErrors.name}
                                required
                            />
                            <Form.Control.Feedback type="invalid">
                                {formErrors.name}
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                                type="email"
                                value={formData.mail}
                                onChange={(e) => {
                                    setFormData({...formData, mail: e.target.value});
                                    setFormErrors({...formErrors, mail: ''});
                                }}
                                isInvalid={!!formErrors.mail}
                                required
                            />
                            <Form.Control.Feedback type="invalid">
                                {formErrors.mail}
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type="password"
                                value={formData.password}
                                onChange={(e) => {
                                    setFormData({...formData, password: e.target.value});
                                    setFormErrors({...formErrors, password: ''});
                                }}
                                isInvalid={!!formErrors.password}
                                required
                            />
                            <Form.Control.Feedback type="invalid">
                                {formErrors.password}
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Role</Form.Label>
                            <Form.Select
                                value={formData.role}
                                onChange={(e) => setFormData({...formData, role: e.target.value})}
                            >
                                {ROLES.map(role => (
                                    <option key={role} value={role}>
                                        {role.charAt(0).toUpperCase() + role.slice(1)}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Shift</Form.Label>
                            <Form.Select
                                value={formData.shifts}
                                onChange={(e) => setFormData({...formData, shifts: e.target.value})}
                            >
                                {SHIFTS.map(shift => (
                                    <option key={shift} value={shift}>
                                        {shift.charAt(0).toUpperCase() + shift.slice(1)}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <div className="d-flex justify-content-end">
                            <Button variant="secondary" className="me-2" onClick={() => {
                                resetForm();
                                setShowModal(false);
                            }}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit">
                                Add User
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Edit User Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Edit User</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleEdit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Role</Form.Label>
                            <Form.Select
                                value={formData.role}
                                onChange={(e) => setFormData({...formData, role: e.target.value})}
                            >
                                {ROLES.map(role => (
                                    <option key={role} value={role}>
                                        {role.charAt(0).toUpperCase() + role.slice(1)}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Shift</Form.Label>
                            <Form.Select
                                value={formData.shifts}
                                onChange={(e) => setFormData({...formData, shifts: e.target.value})}
                            >
                                {SHIFTS.map(shift => (
                                    <option key={shift} value={shift}>
                                        {shift.charAt(0).toUpperCase() + shift.slice(1)}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <div className="d-flex justify-content-end">
                            <Button variant="secondary" className="me-2" onClick={() => setShowEditModal(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit">
                                Save Changes
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default UserList; 