import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Container } from 'react-bootstrap';
import axios from 'axios';

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
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

        fetchUsers();
    }, [navigate]);

    return (
        <Container>
            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Shifts</th>
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
                        </tr>
                    ))}
                </tbody>
            </Table>
        </Container>
    );
};

export default UserList; 