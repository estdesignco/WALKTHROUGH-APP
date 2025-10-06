import React, { useEffect, useState } from 'react';
import { Box, Rows, Text, Button, Columns } from '@canva/app-ui-kit';
import { openDesign } from '@canva/design';

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
      await openDesign({ type: "current_page" }, async (session) => {
        const elements: DetectedElement[] = [];
        
        // Get all elements from the page
        if (session.page.type === "absolute") {
          const pageElements = session.page.elements;
          
          // Check each element for links
          for (const element of pageElements) {
            // Check if element has a link
            // Note: This is a placeholder - actual implementation depends on Canva API
            const hasLink = false; // Will be implemented with actual API
            
            elements.push({
              id: element.id || 'unknown',
              type: element.type || 'unknown',
              hasLink,
              link: undefined,
              imageUrl: undefined
            });
          }
        }
        
        setDetectedElements(elements);
        setLastScan(new Date());
      });
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
    <Box background="secondary" padding="1u">
      <Rows spacing="0.75u">
        <Columns spacing="1u" alignY="center">
          <Text weight="bold" size="small">
            🔍 Design Monitor
          </Text>
          <Button 
            variant={monitoring ? "secondary" : "primary"} 
            size="small"
            onClick={() => monitoring ? stopMonitoring() : setMonitoring(true)}
          >
            {monitoring ? 'Stop' : 'Start'} Monitoring
          </Button>
          <Button 
            variant="tertiary" 
            size="small"
            onClick={scanDesign}
            disabled={monitoring}
          >
            Scan Now
          </Button>
        </Columns>

        {monitoring && (
          <Box background="positive" padding="0.5u" borderRadius="small">
            <Text size="xsmall" tone="positive">
              ✅ Monitoring active - Detecting items with links...
            </Text>
          </Box>
        )}

        {lastScan && (
          <Text size="xsmall" tone="tertiary">
            Last scan: {lastScan.toLocaleTimeString()}
          </Text>
        )}

        {detectedElements.length > 0 && (
          <Box background="neutral" padding="0.75u" borderRadius="small">
            <Rows spacing="0.5u">
              <Text size="small" weight="bold">
                Elements on page: {detectedElements.length}
              </Text>
              <Text size="xsmall">
                With links: {detectedElements.filter(e => e.hasLink).length}
              </Text>
            </Rows>
          </Box>
        )}

        <Box background="neutral" padding="1u" borderRadius="standard">
          <Text size="xsmall">
            💡 Tip: Add product images with links in Canva, and they'll be auto-detected and added to your checklist!
          </Text>
        </Box>
      </Rows>
    </Box>
  );
};