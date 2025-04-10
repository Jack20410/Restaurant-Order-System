import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import ManagerDashboard from './components/manager/ManagerDashboard';
import WaiterDashboard from './components/waiter/waiterDashboard';
import MenuPage from './components/waiter/MenuPage';
import KitchenDashboard from './components/kitchen/KitchenDashboard';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Protected Route component with role check
const ProtectedRoute = ({ children, allowedRoles }) => {
    const location = useLocation();
    const token = sessionStorage.getItem('token');
    const userRole = sessionStorage.getItem('userRole');

    if (!token) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    if (!allowedRoles.includes(userRole)) {
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

// Home route component to handle initial routing based on role
const Home = () => {
    const token = sessionStorage.getItem('token');
    const userRole = sessionStorage.getItem('userRole');

    if (!token) {
        return <LoginPage />;
    }

    // Redirect to appropriate dashboard based on role
    switch (userRole) {
        case 'manager':
            return <Navigate to="/dashboard" replace />;
        case 'waiter':
            return <Navigate to="/waiter" replace />;
        case 'kitchen':
            return <Navigate to="/kitchen" replace />;
        default:
            sessionStorage.clear();
            return <Navigate to="/" replace />;
    }
};

function App() {
    return (
        <Router>
            <Routes>
                {/* Home route that handles initial routing */}
                <Route path="/" element={<Home />} />

                {/* Manager routes */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute allowedRoles={['manager']}>
                            <ManagerDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Waiter routes */}
                <Route
                    path="/waiter"
                    element={
                        <ProtectedRoute allowedRoles={['waiter']}>
                            <WaiterDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/waiter/menu/:tableId"
                    element={
                        <ProtectedRoute allowedRoles={['waiter']}>
                            <MenuPage />
                        </ProtectedRoute>
                    }
                />

                {/* Kitchen routes */}
                <Route
                    path="/kitchen"
                    element={
                        <ProtectedRoute allowedRoles={['kitchen']}>
                            <KitchenDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Catch all route - redirect to appropriate dashboard */}
                <Route
                    path="*"
                    element={<Home />}
                />
            </Routes>
        </Router>
    );
}

export default App; 