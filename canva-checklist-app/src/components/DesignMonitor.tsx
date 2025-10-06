import React, { useEffect, useState } from 'react';
import { Text, Box } from '@canva/app-ui-kit';

interface DesignMonitorProps {
  projectId: string;
  onItemDetected: (item: any) => void;
}

export const DesignMonitor: React.FC<DesignMonitorProps> = ({ projectId, onItemDetected }) => {
  const [monitoring, setMonitoring] = useState(false);
  const [detectedCount, setDetectedCount] = useState(0);

  useEffect(() => {
    console.log('🔍 Design Monitor initialized for project:', projectId);
    
    // TODO: Implement Canva Design API monitoring
    // This will watch for images with links added to the design
    // and auto-detect products to add to checklist
    
    setMonitoring(true);
  }, [projectId]);

  return (
    <div style={{ 
      padding: '12px 24px',
      backgroundColor: '#EEF2FF',
      borderBottom: '1px solid #C7D2FE'
    }}>
      <Text size="small" tone="tertiary">
        {monitoring ? '🔍 Monitoring design for product links...' : '⏸️ Monitor paused'}
        {detectedCount > 0 && ` | ${detectedCount} items detected`}
      </Text>
    </div>
  );
};