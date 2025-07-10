import { Suspense, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { lazy } from 'react'
import { Route, Router, Routes } from 'react-router-dom'

const Login = lazy(() => import('./pages/login/login'))

function App() {
   return (
       <Suspense fallback={<div>Loading…</div>}>
      <Routes>
        <Route path="/" element={<Login />} />
        {/* add more routes here */}
      </Routes>
    </Suspense>
   )

}

export default App
