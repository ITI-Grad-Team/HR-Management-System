import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom"; // Import Routes and Route
import { AuthProvider } from "./context/AuthContext";
import { SearchProvider } from "./context/SearchContext";
import App from "./App.jsx";

import "bootstrap/dist/css/bootstrap.min.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <SearchProvider>
        <Routes> 
          <Route path="/*" element={<App />} /> 
        </Routes>
      </SearchProvider>
    </AuthProvider>
  </BrowserRouter>
);
