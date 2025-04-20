import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/LoginPage.css'; // Reusing the same styles

const RegisterPage = () => {
    const [registerData, setRegisterData] = useState({
        name: '',
        mail: '',
        password: '',
        confirmPassword: '',
        role: 'waiter', // Changed from 'WAITER' to 'waiter'
        shifts: 'day'   // Changed from 'DAY' to 'day'
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        
        // Validate passwords match
        if (registerData.password !== registerData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            // Remove confirmPassword before sending to API
            const { confirmPassword, ...registrationData } = registerData;
            
            // Register request
            const response = await axios.post('/api/users/register', registrationData);
            
            if (response.status === 200 || response.status === 201) {
                // Registration successful - redirect to login with success message
                navigate('/login', { 
                    state: { 
                        message: '✅ Registration successful! Please login with your new account.' 
                    },
                    replace: true
                });
            }
        } catch (err) {
            console.error('Registration error:', err);
            
            if (err.response) {
                switch (err.response.status) {
                    case 400:
                        if (err.response.data?.detail?.includes('Email already registered')) {
                            setError('This email is already registered. Please use a different email.');
                        } else {
                            setError(err.response.data?.detail || 'Invalid registration data. Please check your inputs.');
                        }
                        break;
                    case 422:
                        setError('Invalid input data. Please check all fields are filled correctly.');
                        break;
                    case 409:
                        setError('This email is already registered. Please use a different email.');
                        break;
                    case 500:
                        setError('Server error. Please try again later.');
                        break;
                    default:
                        setError('Registration failed. Please try again.');
                }
            } else {
                setError('Unable to connect to the server. Please try again later.');
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
                                        <i className="fas fa-user-plus login-icon"></i>
                                        <h2 className="mb-4 fw-bold">Create Account</h2>
                                        <p>Can create a new account for waiter, kitchen staff or manager, will implement this feature in the future !</p>
                                    </div>
                                    <form onSubmit={handleRegister}>
                                        <div className="mb-3">
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-0">
                                                    <i className="fas fa-user text-muted"></i>
                                                </span>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Full Name"
                                                    value={registerData.name}
                                                    onChange={(e) => {
                                                        setRegisterData({...registerData, name: e.target.value});
                                                        setError('');
                                                    }}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-0">
                                                    <i className="fas fa-envelope text-muted"></i>
                                                </span>
                                                <input
                                                    type="email"
                                                    className="form-control"
                                                    placeholder="Email address"
                                                    value={registerData.mail}
                                                    onChange={(e) => {
                                                        setRegisterData({...registerData, mail: e.target.value});
                                                        setError('');
                                                    }}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-0">
                                                    <i className="fas fa-lock text-muted"></i>
                                                </span>
                                                <input
                                                    type="password"
                                                    className="form-control"
                                                    placeholder="Password"
                                                    value={registerData.password}
                                                    onChange={(e) => {
                                                        setRegisterData({...registerData, password: e.target.value});
                                                        setError('');
                                                    }}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-0">
                                                    <i className="fas fa-lock text-muted"></i>
                                                </span>
                                                <input
                                                    type="password"
                                                    className="form-control"
                                                    placeholder="Confirm Password"
                                                    value={registerData.confirmPassword}
                                                    onChange={(e) => {
                                                        setRegisterData({...registerData, confirmPassword: e.target.value});
                                                        setError('');
                                                    }}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-0">
                                                    <i className="fas fa-user-tag text-muted"></i>
                                                </span>
                                                <select
                                                    className="form-select"
                                                    value={registerData.role}
                                                    onChange={(e) => {
                                                        setRegisterData({...registerData, role: e.target.value});
                                                        setError('');
                                                    }}
                                                    required
                                                >
                                                    <option value="waiter">Waiter</option>
                                                    <option value="kitchen">Kitchen Staff</option>
                                                    <option value="manager">Manager</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="mb-4">
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-0">
                                                    <i className="fas fa-clock text-muted"></i>
                                                </span>
                                                <select
                                                    className="form-select"
                                                    value={registerData.shifts}
                                                    onChange={(e) => {
                                                        setRegisterData({...registerData, shifts: e.target.value});
                                                        setError('');
                                                    }}
                                                    required
                                                >
                                                    <option value="day">Day Shift</option>
                                                    <option value="night">Night Shift</option>
                                                </select>
                                            </div>
                                        </div>
                                        {error && (
                                            <div className="alert alert-danger" role="alert">
                                                {error}
                                            </div>
                                        )}
                                        <button type="submit" className="btn btn-primary w-100 mb-3">Register</button>
                                        <div className="text-center">
                                            <Link to="/login" className="text-decoration-none text-muted">
                                                Already have an account? Sign in
                                            </Link>
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

export default RegisterPage; 