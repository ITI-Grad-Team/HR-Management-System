import { Suspense } from "react";
import "./App.css";
import { lazy } from "react";
<<<<<<< HEAD
import { Route, Router, Routes, Navigate } from "react-router-dom";
import DashboardPage from "./pages/dashboard/dashboard";
import Sidebar from "./components/sidebar/sidebar";

const Login = lazy(() => import("./pages/login/login"));
const DashBoard = lazy(() => import("./pages/dashboard/dashboard"));
const Admin = lazy(() => import("./pages/admin/admin"));
=======
import ProfileContainer from "./components/BioCard/ProfileContainer";
import { Route, Router, Routes, Navigate } from "react-router-dom";
import PrivateRoute from "./pages/PrivateRoute";

const Login = lazy(() => import("./pages/login/login"));
const DashboardPage = lazy(() => import("./pages/dashboard/dashboard"));
>>>>>>> 171650e589f64cfc4d06779d5d12ff979277ea7e
const Settings = lazy(() => import("./pages/settings/settings"));
const RoleBasedDashboard = lazy(() =>
  import("./components/RoleBasedDashBoard/RoleBasedDashBoard")
);
<<<<<<< HEAD
=======
const Employees = lazy(() => import("./pages/employees/employees"));
const Applications = lazy(() => import("./pages/applications/Applications"));
>>>>>>> 171650e589f64cfc4d06779d5d12ff979277ea7e

function App() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <Routes>
        <Route path="/" element={<Login />} />
<<<<<<< HEAD
        <Route path="/dashboard" element={<DashBoard />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/dashboard" element={<DashboardPage />}>
          <Route index element={<Navigate to="home" />} />
          <Route path="home" element={<RoleBasedDashboard />} />
          <Route path="settings" element={<Settings />} />
=======

        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<DashboardPage />}>
            <Route index element={<Navigate to="home" />} />
            <Route path="home" element={<RoleBasedDashboard />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<ProfileContainer />} />
            <Route path="employees" element={<Employees />} />
            <Route path="applications" element={<Applications />} />
          </Route>
>>>>>>> 171650e589f64cfc4d06779d5d12ff979277ea7e
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
