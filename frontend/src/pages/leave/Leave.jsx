import EmployeeLeaveView from '../../components/Leave/EmployeeLeaveView';
import AdminLeaveView from '../../components/Leave/AdminLeaveView';
import { useAuth } from '../../hooks/useAuth';
import { useEffect } from 'react';

const Leave = () => {
    const { user, loading } = useAuth();

    useEffect(() => {
        document.title = "Casual Leave | HERA";
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <div>Authentication required</div>;
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