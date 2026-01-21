import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { apiService } from '../services/apiService';

export default function PunchListScreen({ route, navigation }) {
  const { projectId, projectName } = route.params;
  const [punchItems, setPunchItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [newItem, setNewItem] = useState({
    description: '',
    location: '',
    priority: 'medium',
    assigned_to: '',
    status: 'open',
  });

  // Comments modal state
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    loadPunchList();
  }, []);

  const loadPunchList = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPunchList(projectId);
      setPunchItems(response.data.items || []);
    } catch (error) {
      console.error('Failed to load punch list:', error);
      Alert.alert('Error', 'Failed to load punch list');
    } finally {
      setLoading(false);
    }
  };

  const createPunchItem = async () => {
    if (!newItem.description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    try {
      const response = await apiService.createPunchItem({
        project_id: projectId,
        description: newItem.description,
        location: newItem.location,
        priority: newItem.priority,
        assigned_to: newItem.assigned_to,
        status: 'open',
      });

      if (response.data) {
        setPunchItems(prev => [response.data, ...prev]);
        setNewItem({ description: '', location: '', priority: 'medium', assigned_to: '', status: 'open' });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Failed to create punch item:', error);
      Alert.alert('Error', 'Failed to create punch item');
    }
  };

  const updateItemStatus = async (itemId, newStatus) => {
    try {
      await apiService.updatePunchItem(itemId, { status: newStatus });
      setPunchItems(prev =>
        prev.map(item =>
          item.id === itemId ? { ...item, status: newStatus } : item
        )
      );
    } catch (error) {
      console.error('Failed to update punch item status:', error);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const deletePunchItem = async (itemId) => {
    Alert.alert(
      'Delete Punch Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deletePunchItem(itemId);
              setPunchItems(prev => prev.filter(item => item.id !== itemId));
            } catch (error) {
              console.error('Failed to delete punch item:', error);
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  // Comments functionality
  const openCommentsModal = (item) => {
    setSelectedItem(item);
    setShowCommentsModal(true);
    setNewComment('');
  };

  const addComment = async () => {
    if (!newComment.trim() || !selectedItem) return;

    try {
      setLoadingComments(true);
      const response = await apiService.addPunchItemComment(selectedItem.id, {
        text: newComment.trim(),
        user: 'Mobile User',
      });

      if (response.data) {
        setPunchItems(prev =>
          prev.map(item =>
            item.id === selectedItem.id
              ? { ...item, comments: [...(item.comments || []), response.data] }
              : item
          )
        );
        setSelectedItem(prev => ({
          ...prev,
          comments: [...(prev.comments || []), response.data],
        }));
        setNewComment('');
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setLoadingComments(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'in_progress': return '#3B82F6';
      case 'open': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'open': return 'Open';
      default: return status;
    }
  };

  const filteredItems = punchItems.filter(item => {
    if (activeFilter === 'all') return true;
    return item.status === activeFilter;
  });

  const counts = {
    all: punchItems.length,
    open: punchItems.filter(i => i.status === 'open').length,
    in_progress: punchItems.filter(i => i.status === 'in_progress').length,
    completed: punchItems.filter(i => i.status === 'completed').length,
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D4A574" />
        <Text style={styles.loadingText}>Loading punch list...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.projectTitle}>{projectName}</Text>
        <Text style={styles.subtitle}>Punch List</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {['all', 'open', 'in_progress', 'completed'].map(filter => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              activeFilter === filter && styles.filterTabActive,
            ]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === filter && styles.filterTabTextActive,
              ]}
            >
              {getStatusLabel(filter)} ({counts[filter]})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddForm(true)}
      >
        <Text style={styles.addButtonText}>+ Add Punch Item</Text>
      </TouchableOpacity>

      {/* Punch List */}
      <ScrollView style={styles.content}>
        {filteredItems.map(item => (
          <View key={item.id} style={styles.punchCard}>
            <View style={styles.punchHeader}>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
                <Text style={styles.priorityText}>{item.priority?.toUpperCase()}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
              </View>
              <TouchableOpacity onPress={() => deletePunchItem(item.id)}>
                <Text style={styles.deleteButton}>🗑️</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.punchDescription}>{item.description}</Text>
            
            {item.location && (
              <View style={styles.locationRow}>
                <Text style={styles.locationIcon}>📍</Text>
                <Text style={styles.locationText}>{item.location}</Text>
              </View>
            )}

            {/* Photo Preview */}
            {item.photo_url && (
              <Image
                source={{ uri: item.photo_url }}
                style={styles.photoPreview}
                resizeMode="cover"
              />
            )}

            {/* Status Selector */}
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Status:</Text>
              <View style={styles.statusButtons}>
                {['open', 'in_progress', 'completed'].map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusButton,
                      item.status === status && {
                        backgroundColor: getStatusColor(status),
                      },
                    ]}
                    onPress={() => updateItemStatus(item.id, status)}
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        item.status === status && styles.statusButtonTextActive,
                      ]}
                    >
                      {getStatusLabel(status)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Comments Section */}
            <TouchableOpacity
              style={styles.commentsButton}
              onPress={() => openCommentsModal(item)}
            >
              <Text style={styles.commentsButtonText}>
                💬 Comments ({item.comments?.length || 0})
              </Text>
            </TouchableOpacity>

            {item.assigned_to && (
              <Text style={styles.assignedTo}>Assigned to: {item.assigned_to}</Text>
            )}
          </View>
        ))}

        {filteredItems.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔧</Text>
            <Text style={styles.emptyText}>No punch items</Text>
            <Text style={styles.emptySubtext}>Tap the button above to add one</Text>
          </View>
        )}
      </ScrollView>

      {/* Add Item Modal */}
      <Modal visible={showAddForm} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Punch Item</Text>

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What needs to be fixed?"
              placeholderTextColor="#6B7280"
              value={newItem.description}
              onChangeText={description => setNewItem(prev => ({ ...prev, description }))}
              multiline
              numberOfLines={3}
            />

            <TextInput
              style={styles.input}
              placeholder="Location (e.g., Master Bedroom, Kitchen)"
              placeholderTextColor="#6B7280"
              value={newItem.location}
              onChangeText={location => setNewItem(prev => ({ ...prev, location }))}
            />

            <Text style={styles.inputLabel}>Priority</Text>
            <View style={styles.prioritySelector}>
              {['low', 'medium', 'high'].map(priority => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.priorityOption,
                    newItem.priority === priority && {
                      backgroundColor: getPriorityColor(priority),
                    },
                  ]}
                  onPress={() => setNewItem(prev => ({ ...prev, priority }))}
                >
                  <Text
                    style={[
                      styles.priorityOptionText,
                      newItem.priority === priority && styles.priorityOptionTextActive,
                    ]}
                  >
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Assigned to (optional)"
              placeholderTextColor="#6B7280"
              value={newItem.assigned_to}
              onChangeText={assigned_to => setNewItem(prev => ({ ...prev, assigned_to }))}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddForm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={createPunchItem}>
                <Text style={styles.saveButtonText}>Add Item</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Comments Modal */}
      <Modal visible={showCommentsModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.commentsModalContent}>
            <View style={styles.commentsHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setShowCommentsModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.commentsItemText}>{selectedItem?.description}</Text>

            <ScrollView style={styles.commentsList}>
              {(selectedItem?.comments || []).map((comment, index) => (
                <View key={index} style={styles.commentItem}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentUser}>{comment.user || 'User'}</Text>
                    <Text style={styles.commentTime}>
                      {comment.timestamp ? new Date(comment.timestamp).toLocaleString() : ''}
                    </Text>
                  </View>
                  <Text style={styles.commentText}>{comment.text}</Text>
                </View>
              ))}

              {(!selectedItem?.comments || selectedItem.comments.length === 0) && (
                <Text style={styles.noComments}>No comments yet</Text>
              )}
            </ScrollView>

            <View style={styles.addCommentRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor="#6B7280"
                value={newComment}
                onChangeText={setNewComment}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendCommentButton, loadingComments && styles.disabled]}
                onPress={addComment}
                disabled={loadingComments}
              >
                {loadingComments ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.sendCommentText}>Send</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  loadingText: {
    marginTop: 16,
    color: '#9CA3AF',
    fontSize: 16,
  },
  header: {
    padding: 20,
    backgroundColor: '#1F2937',
    borderBottomWidth: 4,
    borderBottomColor: '#EF4444',
  },
  projectTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4A574',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: '#D4A574',
  },
  filterTabText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#EF4444',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  punchCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  punchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    flex: 1,
  },
  statusText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  deleteButton: {
    fontSize: 18,
  },
  punchDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F3F4F6',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  photoPreview: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
  },
  statusRow: {
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  statusButtons: {
    flexDirection: 'row',
  },
  statusButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#374151',
    marginHorizontal: 2,
    borderRadius: 4,
  },
  statusButtonText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  statusButtonTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  commentsButton: {
    backgroundColor: '#374151',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  commentsButtonText: {
    color: '#D4A574',
    fontSize: 14,
    fontWeight: '500',
  },
  assignedTo: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4A574',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    color: '#F3F4F6',
    fontSize: 16,
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  prioritySelector: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#374151',
    marginHorizontal: 4,
    borderRadius: 8,
  },
  priorityOptionText: {
    color: '#9CA3AF',
    fontWeight: '500',
  },
  priorityOptionTextActive: {
    color: '#FFF',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 8,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#D4A574',
    borderRadius: 8,
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Comments modal
  commentsModalContent: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: '70%',
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  closeButton: {
    fontSize: 24,
    color: '#9CA3AF',
  },
  commentsItemText: {
    fontSize: 14,
    color: '#D4A574',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  commentsList: {
    flex: 1,
    marginBottom: 12,
  },
  commentItem: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentUser: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#D4A574',
  },
  commentTime: {
    fontSize: 10,
    color: '#6B7280',
  },
  commentText: {
    fontSize: 14,
    color: '#F3F4F6',
  },
  noComments: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 40,
  },
  addCommentRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    color: '#F3F4F6',
    maxHeight: 80,
    marginRight: 8,
  },
  sendCommentButton: {
    backgroundColor: '#D4A574',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  sendCommentText: {
    color: '#1F2937',
    fontWeight: 'bold',
  },
  disabled: {
    opacity: 0.5,
  },
});
