import React from 'react';
import EmployeeAttendanceView from '../../components/Attendance/EmployeeAttendanceView';
import AdminAttendanceView from '../../components/Attendance/AdminAttendanceView';
import "../../components/Attendance/Attendance.css"
import { useAuth } from '../../context/AuthContext';
const Attendance = () => {
  const { user } = useAuth();

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
      <h2 className="mb-4">Attendance & Leave</h2>
      {renderView()}
    </div>
  );
};

export default Attendance; 