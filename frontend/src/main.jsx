<<<<<<< HEAD
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
=======
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { AuthProvider } from './context/AuthContext';
>>>>>>> 0bcf5a3cc6be5572dd42d87e9ede49966edf70f7

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
  <AuthProvider>
    <App />
    </AuthProvider>
  </BrowserRouter>
<<<<<<< HEAD
);
=======
  
);
>>>>>>> 0bcf5a3cc6be5572dd42d87e9ede49966edf70f7
