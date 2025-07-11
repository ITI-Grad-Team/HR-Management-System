import { Suspense } from "react";
import "./App.css";
import { lazy } from "react";
import { Route, Router, Routes } from "react-router-dom";

<<<<<<< HEAD
const Login = lazy(() => import("./pages/login/login"));
const DashBoard = lazy(() => import("./pages/dashboard/dashboard"));
=======
const Login = lazy(() => import('./pages/login/login'))
const DashBoard = lazy(() => import('./pages/dashboard/dashboard'))
const Admin = lazy(() => import('./pages/admin/admin'))
const Settings = lazy(() => import('./pages/settings/settings'))
>>>>>>> 0bcf5a3cc6be5572dd42d87e9ede49966edf70f7

function App() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<DashBoard />} />
        <Route path="/admin" element={<Admin />} />

        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}

export default App;
