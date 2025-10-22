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
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '15px',
    boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)'
  },
  mainTitle: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#ffffff',
    margin: '0 0 15px 0',
    textShadow: '0 2px 10px rgba(0,0,0,0.3)'
  },
  subtitle: {
    fontSize: '20px',
    color: '#e0e0e0',
    margin: 0
  },
  tabBar: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
    padding: '10px',
    backgroundColor: '#1a1a1a',
    borderRadius: '15px',
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  tab: {
    flex: 1,
    minWidth: '200px',
    padding: '20px 30px',
    border: '3px solid #333',
    borderRadius: '12px',
    backgroundColor: '#2a2a2a',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    fontSize: '18px',
    fontWeight: 'bold'
  },
  tabActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
    transform: 'scale(1.05)',
    boxShadow: '0 5px 20px rgba(102, 126, 234, 0.4)'
  },
  tabIcon: {
    fontSize: '28px'
  },
  content: {
    animation: 'fadeIn 0.3s ease-in'
  }
};

export default PowerFeaturesDashboard;
