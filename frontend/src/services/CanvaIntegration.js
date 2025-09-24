// Canva Integration Service for Design Presentations
class CanvaIntegration {
  constructor() {
    this.apiBase = 'https://api.canva.com/v1';
    this.apiKey = process.env.REACT_APP_CANVA_API_KEY;
  }

  // Create mood board from FF&E selections
  async createMoodBoard(projectId, ffeItems, designTheme = 'modern') {
    try {
      console.log('🎨 Creating mood board in Canva...');
      
      // Prepare design elements
      const designElements = {
        title: `${projectId} - Design Mood Board`,
        theme: designTheme,
        elements: ffeItems.map(item => ({
          type: 'image',
          imageUrl: item.image_url,
          title: item.name,
          description: `${item.manufacturer} - ${item.finish_color || 'Natural'}`,
          position: this.calculateMoodBoardPosition(item.category)
        })),
        colorPalette: this.extractColorPalette(ffeItems),
        typography: {
          heading: 'Montserrat',
          body: 'Open Sans'
        }
      };

      const response = await fetch(`${this.apiBase}/designs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          design_type: 'presentation',
          template_id: 'mood_board_professional',
          elements: designElements
        })
      });

      if (response.ok) {
        const design = await response.json();
        console.log('✅ Mood board created:', design.id);
        return {
          designId: design.id,
          editUrl: design.edit_url,
          previewUrl: design.preview_url,
          downloadUrl: design.download_url
        };
      } else {
        throw new Error(`Canva API error: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Canva mood board creation failed:', error);
      throw error;
    }
  }

  // Generate client presentation deck
  async createClientPresentation(projectData, ffeSchedule) {
    try {
      console.log('📊 Creating client presentation in Canva...');
      
      const presentationData = {
        title: `${projectData.name} - Design Presentation`,
        subtitle: `Interior Design by Established Design Co.`,
        slides: [
          {
            type: 'cover',
            title: projectData.name,
            subtitle: 'Design Concept & FF&E Selections',
            backgroundImage: this.getProjectHeroImage(ffeSchedule)
          },
          {
            type: 'overview',
            title: 'Project Overview',
            content: {
              client: projectData.client_info?.full_name || 'Client',
              timeline: projectData.timeline || '6 months',
              budget: this.formatBudget(ffeSchedule.total_budget),
              rooms: projectData.rooms?.length || 0
            }
          },
          ...this.generateRoomSlides(projectData.rooms, ffeSchedule),
          {
            type: 'budget_summary',
            title: 'Investment Overview',
            content: this.generateBudgetBreakdown(ffeSchedule)
          },
          {
            type: 'timeline',
            title: 'Project Timeline',
            content: this.generateTimelineData(ffeSchedule)
          },
          {
            type: 'next_steps',
            title: 'Next Steps',
            content: [
              'Review and approve selections',
              'Finalize purchase orders',
              'Schedule delivery coordination',
              'Plan installation timeline'
            ]
          }
        ]
      };

      const response = await fetch(`${this.apiBase}/presentations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(presentationData)
      });

      if (response.ok) {
        const presentation = await response.json();
        console.log('✅ Client presentation created:', presentation.id);
        return presentation;
      } else {
        throw new Error(`Canva presentation creation failed: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Canva presentation creation failed:', error);
      throw error;
    }
  }

  // Generate FF&E specification sheets
  async createFFESpecSheets(ffeItems) {
    try {
      console.log('📋 Creating FF&E specification sheets...');
      
      const specSheets = await Promise.all(
        ffeItems.map(async (item) => {
          const specData = {
            template: 'ffe_specification',
            data: {
              itemName: item.name,
              manufacturer: item.manufacturer,
              model: item.model || item.sku,
              finish: item.finish_color,
              dimensions: this.formatDimensions(item.size),
              quantity: item.quantity,
              unitPrice: item.cost,
              totalPrice: (parseFloat(item.cost?.replace('$', '') || '0') * item.quantity).toFixed(2),
              supplier: item.vendor,
              leadTime: item.lead_time_weeks ? `${item.lead_time_weeks} weeks` : 'TBD',
              notes: item.notes || '',
              image: item.image_url,
              room: item.room_location || 'Unspecified'
            }
          };

          const response = await fetch(`${this.apiBase}/documents`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(specData)
          });

          if (response.ok) {
            const spec = await response.json();
            return {
              itemId: item.id,
              itemName: item.name,
              specSheetId: spec.id,
              downloadUrl: spec.download_url,
              previewUrl: spec.preview_url
            };
          } else {
            console.warn(`Failed to create spec sheet for ${item.name}`);
            return null;
          }
        })
      );

      const successful = specSheets.filter(sheet => sheet !== null);
      console.log(`✅ Created ${successful.length} FF&E specification sheets`);
      return successful;
    } catch (error) {
      console.error('❌ FF&E spec sheet creation failed:', error);
      throw error;
    }
  }

  // Helper methods
  calculateMoodBoardPosition(category) {
    const positions = {
      'furniture': { x: 100, y: 100 },
      'lighting': { x: 300, y: 100 },
      'accessories': { x: 500, y: 100 },
      'textiles': { x: 100, y: 300 },
      'artwork': { x: 300, y: 300 }
    };
    return positions[category] || { x: 200, y: 200 };
  }

  extractColorPalette(ffeItems) {
    const colors = [];
    ffeItems.forEach(item => {
      if (item.finish_color) {
        // Convert color names to hex codes (simplified)
        const colorMap = {
          'white': '#FFFFFF',
          'black': '#000000',
          'gray': '#808080',
          'brown': '#8B4513',
          'beige': '#F5F5DC',
          'navy': '#000080'
        };
        const hexColor = colorMap[item.finish_color.toLowerCase()];
        if (hexColor && !colors.includes(hexColor)) {
          colors.push(hexColor);
        }
      }
    });
    return colors.slice(0, 5); // Limit to 5 main colors
  }

  generateRoomSlides(rooms, ffeSchedule) {
    return rooms.map(room => ({
      type: 'room_detail',
      title: room.name,
      content: {
        description: room.description || '',
        items: ffeSchedule.items
          .filter(item => item.room_location === room.name)
          .map(item => ({
            name: item.name,
            image: item.image_url,
            manufacturer: item.manufacturer,
            price: item.cost,
            status: item.status
          })),
        totalBudget: ffeSchedule.items
          .filter(item => item.room_location === room.name)
          .reduce((sum, item) => sum + (parseFloat(item.cost?.replace('$', '') || '0') * item.quantity), 0)
      }
    }));
  }

  generateBudgetBreakdown(ffeSchedule) {
    const breakdown = {};
    ffeSchedule.items.forEach(item => {
      const category = item.category || 'Other';
      if (!breakdown[category]) {
        breakdown[category] = { items: 0, total: 0 };
      }
      breakdown[category].items++;
      breakdown[category].total += parseFloat(item.cost?.replace('$', '') || '0') * item.quantity;
    });
    return breakdown;
  }

  formatBudget(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  }

  formatDimensions(sizeString) {
    if (!sizeString) return 'Dimensions TBD';
    return sizeString;
  }

  getProjectHeroImage(ffeSchedule) {
    // Find the best representative image from FF&E items
    const itemsWithImages = ffeSchedule.items.filter(item => item.image_url);
    if (itemsWithImages.length > 0) {
      // Prefer furniture or large items
      const furniture = itemsWithImages.find(item => 
        item.category === 'furniture' || item.name.toLowerCase().includes('sofa')
      );
      return furniture?.image_url || itemsWithImages[0].image_url;
    }
    return null;
  }

  generateTimelineData(ffeSchedule) {
    const timeline = [];
    const sortedItems = ffeSchedule.items
      .filter(item => item.expected_delivery)
      .sort((a, b) => new Date(a.expected_delivery) - new Date(b.expected_delivery));

    const groupedByMonth = {};
    sortedItems.forEach(item => {
      const month = new Date(item.expected_delivery).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
      if (!groupedByMonth[month]) {
        groupedByMonth[month] = [];
      }
      groupedByMonth[month].push(item);
    });

    Object.entries(groupedByMonth).forEach(([month, items]) => {
      timeline.push({
        period: month,
        deliveries: items.length,
        totalValue: items.reduce((sum, item) => 
          sum + (parseFloat(item.cost?.replace('$', '') || '0') * item.quantity), 0
        ),
        keyItems: items.slice(0, 3).map(item => item.name)
      });
    });

    return timeline;
  }
}

export default CanvaIntegration;