import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ManagerDashboard from './components/manager/ManagerDashboard';
import ManagerWaiterView from './components/manager/ManagerWaiterView';
import WaiterDashboard from './components/waiter/WaiterDashboard';
import MenuPage from './components/waiter/MenuPage';
import KitchenDashboard from './components/kitchen/KitchenDashboard';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Protected Route component with role check
const ProtectedRoute = ({ children, allowedRoles }) => {
    const location = useLocation();
    const token = sessionStorage.getItem('token');
    const userRole = sessionStorage.getItem('userRole');
    const previousRole = sessionStorage.getItem('previousRole');

    if (!token) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // Special case: Allow managers to access waiter routes if they're in waiter mode
    if (userRole === 'manager' && previousRole === 'manager' && allowedRoles.includes('waiter')) {
        return children;
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
        return <Navigate to="/login" replace />;
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
                
                {/* Auth routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Manager routes */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute allowedRoles={['manager']}>
                            <ManagerDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/manager-waiter"
                    element={
                        <ProtectedRoute allowedRoles={['manager']}>
                            <ManagerWaiterView />
                        </ProtectedRoute>
                    }
                />

                {/* Waiter routes - Allow both waiters and managers in waiter mode */}
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
                        <ProtectedRoute allowedRoles={['waiter', 'manager']}>
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