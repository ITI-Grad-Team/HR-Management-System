import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";

import "bootstrap/dist/css/bootstrap.min.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./index.css";
import { AuthProvider } from "./context/auth/AuthProvider.jsx";
import { SearchProvider } from "./context/search/SearchProvider.jsx";

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
