import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import StudioLandingPage from "./components/StudioLandingPage";
import CustomerLandingPage from "./components/CustomerLandingPage";
import CustomerfacingQuestionnaire from "./components/CustomerfacingQuestionnaire";

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
            <Route 
              path="/customer" 
              element={<div style={{minHeight: '100vh', backgroundColor: '#000', color: '#B49B7E', padding: '50px', textAlign: 'center'}}><h1 style={{fontSize: '48px'}}>CUSTOMER LANDING PAGE TEST</h1><p style={{fontSize: '24px', color: '#F5F5DC'}}>This route is working! Customer system can load.</p></div>}
            />
            <Route 
              path="/customer/questionnaire" 
              element={<CustomerfacingQuestionnaire />}
            />
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
};

export default App;