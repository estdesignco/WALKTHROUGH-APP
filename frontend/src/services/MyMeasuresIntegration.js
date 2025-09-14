// My Measures Integration Service
class MyMeasuresIntegration {
  constructor() {
    this.apiBase = 'https://api.mymeasures.com/v1';
    this.apiKey = process.env.REACT_APP_MY_MEASURES_API_KEY;
  }

  // Import room measurements from My Measures app
  async importRoomMeasurements(projectId, roomId) {
    try {
      console.log('📐 Importing measurements from My Measures...');
      
      const response = await fetch(`${this.apiBase}/projects/${projectId}/rooms/${roomId}/measurements`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const measurements = await response.json();
        
        // Transform My Measures data to our format
        const transformedData = {
          roomId: roomId,
          dimensions: {
            length: measurements.length || 0,
            width: measurements.width || 0,
            height: measurements.height || 0,
            area: measurements.area || 0
          },
          features: {
            windows: measurements.windows || [],
            doors: measurements.doors || [],
            outlets: measurements.electrical_outlets || [],
            fixtures: measurements.permanent_fixtures || []
          },
          floorPlan: measurements.floor_plan_image || null,
          timestamp: new Date().toISOString()
        };

        console.log('✅ Measurements imported successfully:', transformedData);
        return transformedData;
      } else {
        throw new Error(`My Measures API error: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ My Measures import failed:', error);
      throw error;
    }
  }

  // Export FF&E layout to My Measures for spatial planning
  async exportFFELayout(projectId, ffeItems) {
    try {
      console.log('📤 Exporting FF&E layout to My Measures...');
      
      // Transform FF&E items to My Measures spatial format
      const spatialLayout = {
        projectId: projectId,
        items: ffeItems.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          dimensions: {
            length: item.dimensions?.length || 0,
            width: item.dimensions?.width || 0,  
            height: item.dimensions?.height || 0
          },
          position: {
            x: item.position?.x || 0,
            y: item.position?.y || 0,
            rotation: item.position?.rotation || 0
          },
          room: item.room_location,
          status: item.status
        })),
        generated_at: new Date().toISOString()
      };

      const response = await fetch(`${this.apiBase}/layouts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(spatialLayout)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ FF&E layout exported successfully:', result.id);
        return result;
      } else {
        throw new Error(`My Measures export failed: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ My Measures export failed:', error);
      throw error;
    }
  }

  // Sync measurements between platforms
  async syncMeasurements(projectId) {
    try {
      console.log('🔄 Syncing measurements...');
      
      const response = await fetch(`${this.apiBase}/sync/${projectId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const syncResult = await response.json();
        console.log('✅ Measurements synced successfully');
        return syncResult;
      } else {
        throw new Error(`Sync failed: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Measurement sync failed:', error);
      throw error;
    }
  }
}

export default MyMeasuresIntegration;