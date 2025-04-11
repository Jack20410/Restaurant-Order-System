import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/LoginPage.css';

const LoginPage = () => {
    const [loginData, setLoginData] = useState({
        mail: '',
        password: ''
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            // First, clear any existing session data and error
            sessionStorage.clear();
            setError('');
            
            // Check if user exists first
            try {
                const checkUserResponse = await axios.get('/api/users/users');
                const userExists = checkUserResponse.data.some(user => user.mail === loginData.mail);
                if (!userExists) {
                    setError('Account does not exist. Please contact manager.');
                    return;
                }
            } catch (checkError) {
                console.error('Error checking user existence:', checkError);
            }
            
            // Login request
            const response = await axios.post('/api/users/login', loginData);
            const { access_token } = response.data;
            
            // Get user info with the new token
            const userInfoResponse = await axios.get('/api/users/users', {
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            });

            // Find the current user in the list
            const currentUser = userInfoResponse.data.find(user => user.mail === loginData.mail);
            
            if (!currentUser) {
                throw new Error('User not found');
            }

            // Store session data
            sessionStorage.setItem('token', access_token);
            sessionStorage.setItem('userRole', currentUser.role);
            sessionStorage.setItem('userId', currentUser.user_id.toString());
            sessionStorage.setItem('userName', currentUser.name);
            setError('');

            // Redirect based on role
            let redirectPath = '/';
            switch (currentUser.role) {
                case 'manager':
                    redirectPath = '/dashboard';
                    break;
                case 'waiter':
                    redirectPath = '/waiter';
                    break;
                case 'kitchen':
                    redirectPath = '/kitchen';
                    break;
                default:
                    setError('Invalid role');
                    sessionStorage.clear();
                    return;
            }
            
            // Force navigation to the new path
            navigate(redirectPath, { replace: true });
            
        } catch (err) {
            console.error('Login error:', err);
            sessionStorage.clear();
            
            // Handle different error cases
            if (err.response) {
                switch (err.response.status) {
                    case 401:
                        setError('Incorrect password. Please try again.');
                        break;
                    case 404:
                        setError('Account does not exist. Please contact manager.');
                        break;
                    default:
                        setError(err.response.data?.detail || 'Login failed. Please try again.');
                }
            } else if (err.message === 'User not found') {
                setError('Account does not exist. Please contact manager.');
            } else {
                setError('Login failed. Please try again later.');
            }
        }
    };

    return (
        <div className="container">
            <div className="row justify-content-center min-vh-100 align-items-center">
                <div className="col-12 col-sm-8 col-md-6 col-lg-8">
                    <div className="card shadow-lg">
                        <div className="card-body p-0">
                            <div className="row g-0">
                                <div className="col-lg-6 d-none d-lg-block">
                                    <img src="/hotpot.jpg" className="img-fluid h-100 rounded-start" style={{ objectFit: 'cover' }} alt="Hotpot" />
                                </div>
                                <div className="col-lg-6 p-5">
                                    <div className="text-center">
                                        <i className="fas fa-user-circle login-icon"></i>
                                        <h2 className="mb-4 fw-bold">Welcome Back</h2>
                                    </div>
                                    <form onSubmit={handleLogin}>
                                        <div className="mb-4">
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-0">
                                                    <i className="fas fa-envelope text-muted"></i>
                                                </span>
                                                <input
                                                    type="email"
                                                    className="form-control"
                                                    id="email"
                                                    placeholder="Email address"
                                                    value={loginData.mail}
                                                    onChange={(e) => {
                                                        setLoginData({...loginData, mail: e.target.value});
                                                        setError(''); // Clear error when user types
                                                    }}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="mb-4">
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-0">
                                                    <i className="fas fa-lock text-muted"></i>
                                                </span>
                                                <input
                                                    type="password"
                                                    className="form-control"
                                                    id="password"
                                                    placeholder="Password"
                                                    value={loginData.password}
                                                    onChange={(e) => {
                                                        setLoginData({...loginData, password: e.target.value});
                                                        setError(''); // Clear error when user types
                                                    }}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        {error && (
                                            <div className="alert alert-danger" role="alert">
                                                {error}
                                            </div>
                                        )}
                                        <button type="submit" className="btn btn-primary w-100 mb-3">Sign in</button>
                                        <div className="text-center">
                                            <a href="#" className="text-decoration-none text-muted">Forgot password?</a>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage; 