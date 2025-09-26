import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import StudioLandingPage from "./components/StudioLandingPage";

const App = () => {
  return (
    <div className="App min-h-screen bg-gray-900">
      <BrowserRouter>
        <main className="container mx-auto px-4 py-6">
          <Routes>
            <Route 
              path="/" 
              element={<StudioLandingPage />}
            />
            <Route 
              path="/studio" 
              element={<StudioLandingPage />}
            />
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
};

export default App;