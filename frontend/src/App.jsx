import { Suspense } from 'react'
import './App.css'
import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import ProfileContainer from './components/BioCard/ProfileContainer';

const Login = lazy(() => import('./pages/login/login'))
const DashBoard = lazy(() => import('./pages/dashboard/dashboard'))

function App() {
   return (
       <Suspense fallback={<div>Loading…</div>}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<DashBoard />} />
        <Route path="/profile" element={<ProfileContainer />} />
      </Routes>
    </Suspense>
   )

}

export default App
