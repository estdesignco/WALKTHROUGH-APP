import React, { useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import StudioLandingPage from "./components/StudioLandingPage";

const App = () => {
  return (
    <div className="App min-h-screen bg-gray-900">
      <BrowserRouter>
        <main className="container mx-auto px-4 py-6">
          <Routes>
            <Route 
              path="/" 
              element={<Navigate to="/studio" replace />}
            />
            <Route 
              path="/studio" 
              element={<StudioLandingPage />}
            />
            {/* Add more routes as needed */}
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
};

export default App;