import { Suspense } from "react";
import "./App.css";
import { lazy } from "react";
import ProfileContainer from "./components/BioCard/ProfileContainer";
import { Route, Router, Routes, Navigate } from "react-router-dom";
import PrivateRoute from "./pages/PrivateRoute";

const Login = lazy(() => import("./pages/login/login"));
const DashboardPage = lazy(() => import("./pages/dashboard/dashboard"));
const Settings = lazy(() => import("./pages/settings/settings"));
const RoleBasedDashboard = lazy(() =>
  import("./components/RoleBasedDashBoard/RoleBasedDashBoard")
);
const Employees = lazy(() => import("./pages/employees/employees"));
const Applications = lazy(() => import("./pages/applications/Applications"));

function App() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<DashboardPage />}>
            <Route index element={<Navigate to="home" />} />
            <Route path="home" element={<RoleBasedDashboard />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<ProfileContainer />} />
            <Route path="employees" element={<Employees />} />
            <Route path="applications" element={<Applications />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
