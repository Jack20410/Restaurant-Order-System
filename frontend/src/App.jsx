import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import UserList from './components/UserList';
import WaiterPage from './components/WaiterPage';
import KitchenPage from './components/KitchenPage';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Protected Route component with role check
const ProtectedRoute = ({ children, allowedRoles }) => {
    const location = useLocation();
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    if (!token) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        // Redirect to appropriate dashboard based on role
        switch (userRole) {
            case 'manager':
                return <Navigate to="/dashboard" replace />;
            case 'waiter':
                return <Navigate to="/waiter" replace />;
            case 'kitchen':
                return <Navigate to="/kitchen" replace />;
            default:
                return <Navigate to="/" replace />;
        }
    }

    return children;
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute allowedRoles={['manager']}>
                            <UserList />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/waiter"
                    element={
                        <ProtectedRoute allowedRoles={['waiter']}>
                            <WaiterPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/kitchen"
                    element={
                        <ProtectedRoute allowedRoles={['kitchen']}>
                            <KitchenPage />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App; 