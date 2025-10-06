import React, { useState } from 'react';
import { Box, Rows, Columns, Text, Button } from '@canva/app-ui-kit';
import { requestOpenExternalUrl } from '@canva/platform';

interface ChecklistPanelProps {
  project: any;
  onItemCheck: (roomId: string, categoryId: string, itemId: string, checked: boolean) => void;
  onStatusChange: (roomId: string, categoryId: string, itemId: string, status: string) => void;
}

export const ChecklistPanel: React.FC<ChecklistPanelProps> = ({ project, onItemCheck, onStatusChange }) => {
  const [collapsedRooms, setCollapsedRooms] = useState<Set<string>>(new Set());
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const toggleRoom = (roomId: string) => {
    const newCollapsed = new Set(collapsedRooms);
    if (newCollapsed.has(roomId)) {
      newCollapsed.delete(roomId);
    } else {
      newCollapsed.add(roomId);
    }
    setCollapsedRooms(newCollapsed);
  };

  const toggleCategory = (categoryId: string) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(categoryId)) {
      newCollapsed.delete(categoryId);
    } else {
      newCollapsed.add(categoryId);
    }
    setCollapsedCategories(newCollapsed);
  };

  const handleOpenLink = async (link: string) => {
    if (link) {
      try {
        await requestOpenExternalUrl({ url: link });
      } catch (err) {
        console.error('Failed to open link:', err);
      }
    }
  };

  const getStatusColor = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'PICKED': '#e3f2fd',
      'ORDERED': '#fff3e0',
      'SHIPPED': '#f3e5f5',
      'DELIVERED TO RECEIVER': '#e8f5e9',
      'DELIVERED TO JOB SITE': '#e8f5e9',
      'INSTALLED': '#c8e6c9'
    };
    return statusMap[status] || '#f5f5f5';
  };

  if (!project || !project.rooms || project.rooms.length === 0) {
    return (
      <Box padding="2u">
        <Text>No checklist items found.</Text>
      </Box>
    );
  }

  return (
    <Box className="checklist-panel" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
      <Rows spacing="0.5u">
        {project.rooms.map((room: any) => {
          const isRoomCollapsed = collapsedRooms.has(room.id);
          const roomColor = room.color || '#D4A574';
          
          return (
            <Box key={room.id}>
              {/* Room Header */}
              <Box 
                background="brandPrimary"
                padding="1u"
                className="room-header"
                onClick={() => toggleRoom(room.id)}
                style={{
                  backgroundColor: roomColor,
                  cursor: 'pointer'
                }}
              >
                <Columns spacing="1u" alignY="center">
                  <Text tone="inverse" weight="bold">
                    {isRoomCollapsed ? '▶' : '▼'} {room.name}
                  </Text>
                  <Text tone="inverse" size="small">
                    ({room.categories?.reduce((sum: number, cat: any) => sum + (cat.items?.length || 0), 0)} items)
                  </Text>
                </Columns>
              </Box>

              {/* Room Content */}
              {!isRoomCollapsed && room.categories && (
                <Box padding="0.5u" background="neutral">
                  <Rows spacing="0.5u">
                    {room.categories.map((category: any) => {
                      const isCategoryCollapsed = collapsedCategories.has(category.id);
                      
                      return (
                        <Box key={category.id}>
                          {/* Category Header */}
                          <Box 
                            padding="1u"
                            background="neutral"
                            className="room-header"
                            onClick={() => toggleCategory(category.id)}
                            style={{
                              backgroundColor: '#e0e0e0',
                              cursor: 'pointer'
                            }}
                          >
                            <Text weight="bold" size="small">
                              {isCategoryCollapsed ? '▶' : '▼'} {category.name} ({category.items?.length || 0})
                            </Text>
                          </Box>

                          {/* Category Items */}
                          {!isCategoryCollapsed && category.items && category.items.length > 0 && (
                            <Box padding="0.5u">
                              <Rows spacing="0.5u">
                                {category.items.map((item: any) => (
                                  <Box 
                                    key={item.id} 
                                    padding="0.75u" 
                                    background="white"
                                    borderRadius="small"
                                    className="checklist-item"
                                    style={{
                                      borderLeft: `3px solid ${item.checked ? '#4caf50' : '#ccc'}`,
                                      transition: 'all 0.2s'
                                    }}
                                  >
                                    <Columns spacing="0.75u" alignY="center">
                                      {/* Checkbox */}
                                      <input 
                                        type="checkbox"
                                        checked={item.checked || false}
                                        onChange={(e) => onItemCheck(room.id, category.id, item.id, e.target.checked)}
                                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                      />

                                      {/* Image */}
                                      {item.image_url && (
                                        <img 
                                          src={item.image_url} 
                                          alt={item.name}
                                          className="item-image"
                                          style={{
                                            width: '40px',
                                            height: '40px',
                                            objectFit: 'cover',
                                            borderRadius: '4px'
                                          }}
                                        />
                                      )}

                                      {/* Item Info */}
                                      <Box style={{ flex: 1 }}>
                                        <Rows spacing="0.25u">
                                          <Text size="small" weight="bold">
                                            {item.name}
                                          </Text>
                                          {item.price && (
                                            <Text size="xsmall" tone="tertiary">
                                              ${item.price}
                                            </Text>
                                          )}
                                          {item.status && (
                                            <span 
                                              className="status-badge"
                                              style={{
                                                backgroundColor: getStatusColor(item.status),
                                                padding: '2px 6px',
                                                borderRadius: '8px',
                                                fontSize: '10px',
                                                display: 'inline-block'
                                              }}
                                            >
                                              {item.status}
                                            </span>
                                          )}
                                        </Rows>
                                      </Box>

                                      {/* Link Button */}
                                      {item.link && (
                                        <Button 
                                          variant="tertiary" 
                                          size="small"
                                          onClick={() => handleOpenLink(item.link)}
                                        >
                                          🔗
                                        </Button>
                                      )}
                                    </Columns>
                                  </Box>
                                ))}
                              </Rows>
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </Rows>
                </Box>
              )}
            </Box>
          );
        })}
      </Rows>
    </Box>
  );
};