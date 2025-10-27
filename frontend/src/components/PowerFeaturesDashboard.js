import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import CalculatorDashboard from './CalculatorDashboard';
import VendorContactManager from './VendorContactManager';
import MaterialLibrary from './MaterialLibrary';
import BudgetTracker from './BudgetTracker';

const PowerFeaturesDashboard = () => {
  const { projectId } = useParams();
  const [activeTab, setActiveTab] = useState('calculators');

  const tabs = [
    { id: 'calculators', name: '🧮 Calculators', icon: '🧮' },
    { id: 'budget', name: '💰 Budget', icon: '💰' },
    { id: 'vendors', name: '📞 Vendors', icon: '📞' },
    { id: 'materials', name: '🎨 Materials', icon: '🎨' }
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.mainTitle}>✨ POWER FEATURES DASHBOARD ✨</h1>
        <p style={styles.subtitle}>All the tools you need in one place</p>
      </div>

      {/* Tab Navigation */}
      <div style={styles.tabBar}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.tabActive : {})
            }}
          >
            <span style={styles.tabIcon}>{tab.icon}</span>
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={styles.content}>
        {activeTab === 'calculators' && <CalculatorDashboard projectId={projectId} />}
        {activeTab === 'budget' && <BudgetTracker projectId={projectId} />}
        {activeTab === 'vendors' && <VendorContactManager projectId={projectId} />}
        {activeTab === 'materials' && <MaterialLibrary projectId={projectId} />}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    padding: '20px'
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
    padding: '40px 20px',
    background: 'linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 50%, #2a2a2a 100%)',
    borderRadius: '15px',
    border: '1px solid #8b7355',
    boxShadow: '0 0 20px rgba(139, 115, 85, 0.3), inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)'
  },
  mainTitle: {
    fontSize: '48px',
    fontWeight: '300',
    color: '#D4C5A9',
    margin: '0 0 15px 0',
    textShadow: '0 2px 10px rgba(0,0,0,0.3)',
    letterSpacing: '2px'
  },
  subtitle: {
    fontSize: '20px',
    color: '#D4C5A9',
    margin: 0
  },
  tabBar: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
    padding: '10px',
    backgroundColor: '#0a0a0a',
    borderRadius: '15px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    border: '1px solid rgba(139, 115, 85, 0.3)'
  },
  tab: {
    flex: 1,
    minWidth: '200px',
    padding: '20px 30px',
    border: '1px solid #8b7355',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 50%, #2a2a2a 100%)',
    color: '#D4C5A9',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    fontSize: '18px',
    fontWeight: 'bold',
    boxShadow: '0 4px 15px rgba(139, 115, 85, 0.2)'
  },
  tabActive: {
    background: 'linear-gradient(135deg, #8b7355 0%, #a0845c 50%, #8b7355 100%)',
    borderColor: '#a0845c',
    color: '#1a1a1a',
    transform: 'scale(1.05)',
    boxShadow: '0 5px 20px rgba(139, 115, 85, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.2)'
  },
  tabIcon: {
    fontSize: '28px'
  },
  content: {
    animation: 'fadeIn 0.3s ease-in'
  }
};

export default PowerFeaturesDashboard;
