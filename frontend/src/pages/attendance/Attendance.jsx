import React, { useEffect } from 'react';
import EmployeeAttendanceView from '../../components/Attendance/EmployeeAttendanceView';
import AdminAttendanceView from '../../components/Attendance/AdminAttendanceView';
import "../../components/Attendance/Attendance.css"
import { useAuth } from '../../hooks/useAuth';
const Attendance = () => {
  const { user } = useAuth();

  useEffect(() => {
      document.title = "Attendance | HERA";
    }, []);

  if (!user) {
    return <div>Loading...</div>;
  }

  const renderView = () => {
    switch (user.role) {
      case 'employee':
        return <EmployeeAttendanceView />;
      case 'admin':
      case 'hr':
        return <AdminAttendanceView />;
      default:
        return <div>You do not have permission to view this page.</div>;
    }
  };

  return (
    <div className="container-fluid mt-4">
      {renderView()}
    </div>
  );
};

export default Attendance; 