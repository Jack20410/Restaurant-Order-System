import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import WaiterDashboard from '../waiter/WaiterDashboard';
import { FaUserTie } from 'react-icons/fa';

const ManagerWaiterView = () => {
    const navigate = useNavigate();

    const switchToManagerMode = () => {
        // Clear the previous role as we're switching back
        sessionStorage.removeItem('previousRole');
        navigate('/manager');
    };

    return (
        <div className="position-relative">
            {/* Switch to Manager Mode Button - Fixed Position */}
            <div 
                className="position-fixed"
                style={{
                    top: '2px',
                    right: '0px',
                    zIndex: 1100,
                    backgroundColor: '#fff',
                    padding: '5px',
                    borderRadius: '50px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}
            >
                <Button
                    variant="warning"
                    onClick={switchToManagerMode}
                    className="d-flex align-items-center gap-2 rounded-pill px-4 py-2"
                    style={{
                        fontSize: '1rem',
                        fontWeight: '500',
                        minWidth: '200px',
                        backgroundColor: '#ffc107',
                        border: 'none'
                    }}
                >
                    <FaUserTie size={20} />
                    Switch to Manager Mode
                </Button>
            </div>

            {/* Render the regular WaiterDashboard */}
            <WaiterDashboard />
        </div>
    );
};

export default ManagerWaiterView; 