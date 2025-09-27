import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import StudioLandingPage from "./components/StudioLandingPage";

// Test component to check if customer components can be loaded
const TestCustomerPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold text-center mb-8">Customer Landing Page Test</h1>
      <div className="text-center">
        <p className="text-xl mb-4">This is a test page to verify customer routing works</p>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Test Button
        </button>
      </div>
    </div>
  );
};

const TestQuestionnairePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold text-center mb-8">Questionnaire Test</h1>
      <div className="text-center">
        <p className="text-xl mb-4">This is a test questionnaire page</p>
        <form className="max-w-md mx-auto">
          <input 
            type="text" 
            placeholder="Test input field" 
            className="w-full p-2 mb-4 text-black rounded"
          />
          <button 
            type="submit"
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Submit Test
          </button>
        </form>
      </div>
    </div>
  );
};

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
              element={<TestCustomerPage />}
            />
            <Route 
              path="/customer/questionnaire" 
              element={<TestQuestionnairePage />}
            />
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
};

export default App;