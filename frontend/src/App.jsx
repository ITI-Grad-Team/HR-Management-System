<<<<<<< HEAD
function App() {
  return <></>;
}

export default App;
=======
import { Suspense } from 'react'
import './App.css'
import { lazy } from 'react'
import { Route, Router, Routes } from 'react-router-dom'

const Login = lazy(() => import('./pages/login/login'))
const DashBoard = lazy(() => import('./pages/dashboard/dashboard'))

function App() {
   return (
       <Suspense fallback={<div>Loading…</div>}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<DashBoard />} />
      </Routes>
    </Suspense>
   )

}

export default App
>>>>>>> ad19e8acd3a0ccef3dd1c250cbdb16c6c95e6afd
