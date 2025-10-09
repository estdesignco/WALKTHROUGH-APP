import React from 'react';
import { Rows, Text, Box, Columns, Button, Checkbox } from '@canva/app-ui-kit';
import { requestOpenExternalUrl } from '@canva/platform';

interface ChecklistItem {
  id: string;
  name: string;
  link?: string;
  image_url?: string;
  price?: string;
  status?: string;
  checked?: boolean;
  size?: string;
  color?: string;
}

interface Category {
  id: string;
  name: string;
  items: ChecklistItem[];
}

interface Room {
  id: string;
  name: string;
  color: string;
  categories: Category[];
  collapsed?: boolean;
}

interface ChecklistPanelProps {
  rooms: Room[];
  onItemCheck: (roomId: string, categoryId: string, itemId: string, checked: boolean) => void;
  onStatusChange: (roomId: string, categoryId: string, itemId: string, status: string) => void;
  onRoomToggle: (roomId: string) => void;
}

export const ChecklistPanel: React.FC<ChecklistPanelProps> = ({
  rooms,
  onItemCheck,
  onStatusChange,
  onRoomToggle
}) => {
  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      'TO BE SELECTED': '#D4A574',
      'APPROVED': '#9ACD32',
      'ORDERED': '#32CD32',
      'PICKED': '#3B82F6',
      'SHIPPED': '#4169E1',
      'DELIVERED TO JOB SITE': '#8A2BE2',
      'INSTALLED': '#006400'
    };
    return statusMap[status] || '#9CA3AF';
  };

  return (
    <div style={{ 
      flex: 1, 
      overflowY: 'auto', 
      padding: '16px',
      backgroundColor: '#FAFAFA'
    }}>
      <Rows spacing="2u">
        {rooms.map((room) => (
          <div key={room.id} style={{ 
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            {/* Room Header */}
            <div
              onClick={() => onRoomToggle(room.id)}
              style={{
                backgroundColor: room.color,
                color: 'white',
                padding: '16px 20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                userSelect: 'none'
              }}
            >
              <Text size="medium">
                {room.name.toUpperCase()}
              </Text>
              <span style={{ fontSize: '20px' }}>
                {room.collapsed ? '▼' : '▲'}
              </span>
            </div>

            {/* Room Content */}
            {!room.collapsed && (
              <div style={{ padding: '16px' }}>
                <Rows spacing="2u">
                  {room.categories.map((category) => (
                    <div key={category.id}>
                      {/* Category Header */}
                      {category.name && (
                        <div style={{ 
                          padding: '8px 12px',
                          backgroundColor: '#F9FAFB',
                          borderRadius: '6px',
                          marginBottom: '8px'
                        }}>
                          <Text size="small">
                            <strong>{category.name}</strong>
                          </Text>
                        </div>
                      )}

                      {/* Items */}
                      <Rows spacing="1u">
                        {category.items.map((item) => (
                          <div
                            key={item.id}
                            style={{
                              padding: '12px',
                              backgroundColor: item.checked ? '#F0FDF4' : 'white',
                              border: '1px solid #E5E7EB',
                              borderRadius: '8px',
                              transition: 'all 0.2s'
                            }}
                          >
                            <Columns spacing="2u" alignY="center">
                              {/* Checkbox */}
                              <div>
                                <Checkbox
                                  value={item.checked ? "checked" : "unchecked"}
                                  onChange={(value) => 
                                    onItemCheck(room.id, category.id, item.id, value === "checked")
                                  }
                                />
                              </div>

                              {/* Image */}
                              {item.image_url && (
                                <div>
                                  <img
                                    src={item.image_url}
                                    alt={item.name}
                                    style={{
                                      width: '60px',
                                      height: '60px',
                                      objectFit: 'cover',
                                      borderRadius: '6px',
                                      border: '1px solid #E5E7EB'
                                    }}
                                  />
                                </div>
                              )}

                              {/* Item Details */}
                              <div style={{ flex: 1 }}>
                                <Rows spacing="0.5u">
                                  <Text size="small">
                                    <strong>{item.name}</strong>
                                  </Text>
                                  
                                  {item.price && (
                                    <Text size="small" tone="tertiary">
                                      💰 {item.price}
                                    </Text>
                                  )}
                                  
                                  {item.status && (
                                    <div
                                      style={{
                                        display: 'inline-block',
                                        padding: '4px 8px',
                                        backgroundColor: getStatusColor(item.status),
                                        color: 'white',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        fontWeight: 600
                                      }}
                                    >
                                      {item.status}
                                    </div>
                                  )}
                                </Rows>
                              </div>

                              {/* Link Button */}
                              {item.link && (
                                <div>
                                  <Button
                                    variant="tertiary"
                                    onClick={() => {
                                      if (item.link) {
                                        requestOpenExternalUrl({ url: item.link });
                                      }
                                    }}
                                  >
                                    🔗 View
                                  </Button>
                                </div>
                              )}
                            </Columns>
                          </div>
                        ))}
                      </Rows>
                    </div>
                  ))}
                </Rows>
              </div>
            )}
          </div>
        ))}
      </Rows>
    </div>
  );
};