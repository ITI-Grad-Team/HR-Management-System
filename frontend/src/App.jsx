import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
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
import ForgotPassword from "./pages/PasswordReset/forgotPassword.jsx";
import ResetPassword from "./pages/PasswordReset/resetPassword.jsx";
import ChangePassword from "./pages/PasswordReset/ChangePassword.jsx";



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
const HrDetails = lazy(() => import("./pages/HrDetails/HrDetails"));
const SearchResultsPage = lazy(() =>
  import("./pages/SearchResultsPage/SearchResultsPage.jsx")
);
const Leave = lazy(() => import("./pages/leave/Leave.jsx"));
const Tasks = lazy(() => import("./pages/Tasks/Tasks"));

function App() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
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
            <Route path="leave" element={<Leave />} />
            <Route path="EmployeeDetails/:id" element={<EmployeeDetails />} />
            <Route path="hrDetails/:id" element={<HrDetails />} />
            <Route path="search-results" element={<SearchResultsPage />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="change-password" element={<ChangePassword />} />
          </Route>
        </Route>
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} />
    </Suspense>
  );
}

export default App;
