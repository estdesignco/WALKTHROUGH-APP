import React, { useEffect, useState } from 'react';
import { Box, Rows, Text, Button, Columns, Title } from '@canva/app-ui-kit';
// import { openDesign } from '@canva/design';

interface DesignMonitorProps {
  projectId: string;
  onItemDetected: (item: any) => void;
}

interface DetectedElement {
  id: string;
  type: string;
  hasLink: boolean;
  link?: string;
  imageUrl?: string;
}

export const DesignMonitor: React.FC<DesignMonitorProps> = ({ projectId, onItemDetected }) => {
  const [monitoring, setMonitoring] = useState(false);
  const [detectedElements, setDetectedElements] = useState<DetectedElement[]>([]);
  const [lastScan, setLastScan] = useState<Date | null>(null);

  const scanDesign = async () => {
    try {
      // TODO: Implement with proper Canva Design API
      // await openDesign({ type: "current_page" }, async (session) => {
      //   const elements: DetectedElement[] = [];
      //   // Implementation here
      //   setDetectedElements(elements);
      // });
      
      setDetectedElements([]);
      setLastScan(new Date());
      console.log('Design scanning will be implemented with Canva Design API');
    } catch (err) {
      console.error('Error scanning design:', err);
    }
  };

  const startMonitoring = () => {
    setMonitoring(true);
    scanDesign();
    
    // Scan every 5 seconds
    const interval = setInterval(() => {
      scanDesign();
    }, 5000);
    
    return () => clearInterval(interval);
  };

  const stopMonitoring = () => {
    setMonitoring(false);
  };

  useEffect(() => {
    if (monitoring) {
      const cleanup = startMonitoring();
      return cleanup;
    }
  }, [monitoring]);

  return (
    <Box padding="1u">
      <Rows spacing="1u">
        <Columns spacing="1u" alignY="center">
          <Title size="small">
            🔍 Design Monitor
          </Title>
          <Button 
            variant={monitoring ? "secondary" : "primary"}
            onClick={() => monitoring ? stopMonitoring() : setMonitoring(true)}
          >
            {monitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </Button>
          <Button 
            variant="tertiary"
            onClick={scanDesign}
            disabled={monitoring}
          >
            Scan Now
          </Button>
        </Columns>

        {monitoring && (
          <Box padding="1u">
            <Text>
              ✅ Monitoring active - Detecting items with links...
            </Text>
          </Box>
        )}

        {lastScan && (
          <Text>
            Last scan: {lastScan.toLocaleTimeString()}
          </Text>
        )}

        {detectedElements.length > 0 && (
          <Box padding="1u">
            <Rows spacing="1u">
              <Title size="xsmall">
                Elements on page: {detectedElements.length}
              </Title>
              <Text>
                With links: {detectedElements.filter(e => e.hasLink).length}
              </Text>
            </Rows>
          </Box>
        )}

        <Box padding="1u">
          <Text>
            💡 Tip: Add product images with links in Canva, and they'll be auto-detected and added to your checklist!
          </Text>
        </Box>
      </Rows>
    </Box>
  );
};