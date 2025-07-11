import { Suspense } from 'react'
import './App.css'
import { lazy } from 'react'
import { Route, Router, Routes } from 'react-router-dom'

const Login = lazy(() => import('./pages/login/login'))
const DashBoard = lazy(() => import('./pages/dashboard/dashboard'))
const Admin = lazy(() => import('./pages/admin/admin'))

function App() {
   return (
       <Suspense fallback={<div>Loading…</div>}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<DashBoard />} />
        <Route path="/admin" element={<Admin />} />

      </Routes>
    </Suspense>
   )

}

export default App
