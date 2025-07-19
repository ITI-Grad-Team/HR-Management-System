import React from 'react';
import EmployeeLeaveView from '../../components/Leave/EmployeeLeaveView';
import AdminLeaveView from '../../components/Leave/AdminLeaveView';
import { useAuth } from '../../hooks/useAuth';

const Leave = () => {
    const { user } = useAuth();

    if (!user) {
        return <div>Loading...</div>;
    }

    const renderView = () => {
        switch (user.role) {
            case 'employee':
                return <EmployeeLeaveView />;
            case 'admin':
            case 'hr':
                return <AdminLeaveView />;
            default:
                return <div>You do not have permission to view this page.</div>;
        }
    };

    return (
        <div className="container-fluid mt-4">
            <h2 className="mb-4">Casual Leave</h2>
            {renderView()}
        </div>
    );
};

export default Leave; 