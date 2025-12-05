import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import CalculatorDashboard from './CalculatorDashboard';

/**
 * Standalone Calculators Page
 * Accessible from main menu without needing a project
 */
const CalculatorsPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', padding: '20px' }}>
      {/* Back Navigation */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', maxWidth: '1400px', margin: '0 auto 20px auto' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: '#292929',
            border: '1px solid #525252',
            borderRadius: '8px',
            color: '#d4d4d4',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: '#292929',
            border: '1px solid #525252',
            borderRadius: '8px',
            color: '#d4d4d4',
            cursor: 'pointer'
          }}
        >
          <Home size={16} />
          <span>Home</span>
        </button>
      </div>

      {/* Calculator Dashboard */}
      <CalculatorDashboard />
    </div>
  );
};

export default CalculatorsPage;
