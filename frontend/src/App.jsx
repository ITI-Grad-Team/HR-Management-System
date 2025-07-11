import { Suspense } from 'react'
import './App.css'
import { lazy } from 'react'
import { Route, Router, Routes, Navigate } from 'react-router-dom'
import DashboardPage from './pages/dashboard/dashboard'

const Login = lazy(() => import('./pages/login/login'))
const DashBoard = lazy(() => import('./pages/dashboard/dashboard'))
const Admin = lazy(() => import('./pages/admin/admin'))
const Settings = lazy(() => import('./pages/settings/settings'))
const RoleBasedDashboard = lazy(() => import('./components/RoleBasedDashBoard/RoleBasedDashBoard'))

function App() {
   return (
       <Suspense fallback={<div>Loading…</div>}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<DashboardPage />}>
        <Route index element={<Navigate to="home" />} />
        <Route path="home" element={<RoleBasedDashboard />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      </Routes>
    </Suspense>
   )

}

export default App
