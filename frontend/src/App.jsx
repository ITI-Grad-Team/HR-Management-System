import { Suspense } from "react";
import "./App.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { lazy } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import PrivateRoute from "./pages/PrivateRoute";
import "react-loading-skeleton/dist/skeleton.css";
import DashboardFallback from "./components/DashboardFallBack/DashboardFallBack";
import ApplicationPage from "./pages/public_application/ApplicationPage";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const Login = lazy(() => import("./pages/login/login"));
const DashboardPage = lazy(() => import("./pages/dashboard/dashboard"));
const Settings = lazy(() => import("./pages/settings/settings"));
const RoleBasedDashboard = lazy(() =>
  import("./components/RoleBasedDashBoard/RoleBasedDashBoard")
);
const EmployeeDetails = lazy(() =>
  import("./pages/EmployeeDetailss/EmployeeDetails")
);

const Employees = lazy(() => import("./pages/employees/employees"));
const Applications = lazy(() => import("./pages/applications/Applications"));
const Payroll = lazy(() => import("./pages/payroll/Payroll"));
const Attendance = lazy(() => import("./pages/attendance/Attendance"));

function App() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/apply/:distinction_name/" element={<ApplicationPage />} />
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<DashboardPage />}>
            <Route index element={<Navigate to="home" />} />
            <Route path="home" element={<RoleBasedDashboard />} />
            <Route path="settings" element={<Settings />} />
            <Route path="employees" element={<Employees />} />
            <Route path="applications" element={<Applications />} />
            <Route path="payroll" element={<Payroll />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="EmployeeDetails/:id" element={<EmployeeDetails />} />
          </Route>
        </Route>
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} />
    </Suspense>
  );
}

export default App;
