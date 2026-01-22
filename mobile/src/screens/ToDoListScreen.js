import React, { useState, useEffect, useCallback } from 'react';
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
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { apiService } from '../services/apiService';

export default function ToDoListScreen({ route, navigation }) {
  const { projectId, projectName } = route.params;
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [newTodo, setNewTodo] = useState({
    text: '',
    description: '',
    priority: 'medium',
    assigned_to: '',
    deadline: '',
  });
  
  // Comments modal state
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTodos(projectId);
      setTodos(response.data.todos || []);
    } catch (error) {
      console.error('Failed to load todos:', error);
      Alert.alert('Error', 'Failed to load to-do items');
    } finally {
      setLoading(false);
    }
  };

  const createTodo = async () => {
    if (!newTodo.text.trim()) {
      Alert.alert('Error', 'Please enter a to-do item');
      return;
    }

    try {
      const response = await apiService.createTodo({
        project_id: projectId,
        text: newTodo.text,
        description: newTodo.description,
        priority: newTodo.priority,
        assigned_to: newTodo.assigned_to,
        deadline: newTodo.deadline || null,
        status: 'pending',
      });

      if (response.data.todo) {
        setTodos(prev => [response.data.todo, ...prev]);
        setNewTodo({ text: '', description: '', priority: 'medium', assigned_to: '', deadline: '' });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Failed to create todo:', error);
      Alert.alert('Error', 'Failed to create to-do item');
    }
  };

  const updateTodoStatus = async (todoId, newStatus) => {
    try {
      await apiService.updateTodo(todoId, { status: newStatus });
      setTodos(prev =>
        prev.map(todo =>
          todo.id === todoId ? { ...todo, status: newStatus } : todo
        )
      );
    } catch (error) {
      console.error('Failed to update todo status:', error);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const updateTodoPriority = async (todoId, newPriority) => {
    try {
      await apiService.updateTodo(todoId, { priority: newPriority });
      setTodos(prev =>
        prev.map(todo =>
          todo.id === todoId ? { ...todo, priority: newPriority } : todo
        )
      );
    } catch (error) {
      console.error('Failed to update todo priority:', error);
      Alert.alert('Error', 'Failed to update priority');
    }
  };

  const deleteTodo = async (todoId) => {
    Alert.alert(
      'Delete To-Do',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteTodo(todoId);
              setTodos(prev => prev.filter(todo => todo.id !== todoId));
            } catch (error) {
              console.error('Failed to delete todo:', error);
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  // Comments functionality
  const openCommentsModal = (todo) => {
    setSelectedTodo(todo);
    setShowCommentsModal(true);
    setNewComment('');
  };

  const addComment = async () => {
    if (!newComment.trim() || !selectedTodo) return;

    try {
      setLoadingComments(true);
      const response = await apiService.addTodoComment(selectedTodo.id, {
        text: newComment.trim(),
        user: 'Mobile User',
      });

      if (response.data) {
        setTodos(prev =>
          prev.map(todo =>
            todo.id === selectedTodo.id
              ? { ...todo, comments: [...(todo.comments || []), response.data] }
              : todo
          )
        );
        setSelectedTodo(prev => ({
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
      case 'done': 
      case 'completed': return '#10B981';
      case 'working':
      case 'in_progress': return '#3B82F6';
      case 'pending': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#DC2626';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const filteredTodos = todos.filter(todo => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'working') return todo.status === 'working' || todo.status === 'in_progress';
    if (activeFilter === 'done') return todo.status === 'done' || todo.status === 'completed';
    return todo.status === activeFilter;
  });

  const counts = {
    all: todos.length,
    pending: todos.filter(t => t.status === 'pending').length,
    working: todos.filter(t => t.status === 'working' || t.status === 'in_progress').length,
    done: todos.filter(t => t.status === 'done' || t.status === 'completed').length,
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D4A574" />
        <Text style={styles.loadingText}>Loading to-do list...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.projectTitle}>{projectName}</Text>
        <Text style={styles.subtitle}>To-Do List</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {['all', 'pending', 'working', 'done'].map(filter => (
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
              {filter.charAt(0).toUpperCase() + filter.slice(1)} ({counts[filter]})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddForm(true)}
      >
        <Text style={styles.addButtonText}>+ Add To-Do Item</Text>
      </TouchableOpacity>

      {/* Todo List */}
      <ScrollView style={styles.content}>
        {filteredTodos.map(todo => (
          <View key={todo.id} style={styles.todoCard}>
            <View style={styles.todoHeader}>
              <TouchableOpacity onPress={() => deleteTodo(todo.id)}>
                <Text style={styles.deleteButton}>🗑️</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.todoText}>{todo.text}</Text>
            {todo.description && (
              <Text style={styles.todoDescription}>{todo.description}</Text>
            )}

            {/* STATUS DROPDOWN - Matching Desktop */}
            <View style={styles.dropdownRow}>
              <Text style={styles.dropdownLabel}>Status:</Text>
              <View style={[styles.pickerContainer, { backgroundColor: getStatusColor(todo.status) }]}>
                <Picker
                  selectedValue={todo.status || 'pending'}
                  onValueChange={(value) => updateTodoStatus(todo.id, value)}
                  style={styles.picker}
                  dropdownIconColor="#FFF"
                >
                  <Picker.Item label="⏳ Pending" value="pending" />
                  <Picker.Item label="🔄 Working" value="working" />
                  <Picker.Item label="✅ Done" value="done" />
                </Picker>
              </View>
            </View>

            {/* PRIORITY DROPDOWN - Matching Desktop */}
            <View style={styles.dropdownRow}>
              <Text style={styles.dropdownLabel}>Priority:</Text>
              <View style={[styles.pickerContainer, { backgroundColor: getPriorityColor(todo.priority) }]}>
                <Picker
                  selectedValue={todo.priority || 'medium'}
                  onValueChange={(value) => updateTodoPriority(todo.id, value)}
                  style={styles.picker}
                  dropdownIconColor="#FFF"
                >
                  <Picker.Item label="Low" value="low" />
                  <Picker.Item label="Medium" value="medium" />
                  <Picker.Item label="High" value="high" />
                  <Picker.Item label="🔴 Urgent" value="urgent" />
                </Picker>
              </View>
            </View>

            {/* Assigned To */}
            {todo.assigned_to && (
              <Text style={styles.assignedTo}>👤 Assigned: {todo.assigned_to}</Text>
            )}

            {/* Comments Section */}
            <TouchableOpacity
              style={styles.commentsButton}
              onPress={() => openCommentsModal(todo)}
            >
              <Text style={styles.commentsButtonText}>
                💬 Comments ({todo.comments?.length || 0})
              </Text>
            </TouchableOpacity>

            {/* Linked FFE Item */}
            {todo.linked_ffe_item && (
              <View style={styles.linkedItem}>
                <Text style={styles.linkedItemLabel}>Linked to:</Text>
                <Text style={styles.linkedItemText}>
                  {todo.linked_ffe_item.name} ({todo.linked_ffe_item.vendor})
                </Text>
              </View>
            )}
          </View>
        ))}

        {filteredTodos.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No to-do items</Text>
            <Text style={styles.emptySubtext}>Tap the button above to add one</Text>
          </View>
        )}
      </ScrollView>

      {/* Add Todo Modal */}
      <Modal visible={showAddForm} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add To-Do Item</Text>

            <TextInput
              style={styles.input}
              placeholder="What needs to be done?"
              placeholderTextColor="#6B7280"
              value={newTodo.text}
              onChangeText={text => setNewTodo(prev => ({ ...prev, text }))}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              placeholderTextColor="#6B7280"
              value={newTodo.description}
              onChangeText={description => setNewTodo(prev => ({ ...prev, description }))}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.inputLabel}>Priority</Text>
            <View style={styles.prioritySelector}>
              {['low', 'medium', 'high', 'urgent'].map(priority => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.priorityOption,
                    newTodo.priority === priority && {
                      backgroundColor: getPriorityColor(priority),
                    },
                  ]}
                  onPress={() => setNewTodo(prev => ({ ...prev, priority }))}
                >
                  <Text
                    style={[
                      styles.priorityOptionText,
                      newTodo.priority === priority && styles.priorityOptionTextActive,
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
              value={newTodo.assigned_to}
              onChangeText={assigned_to => setNewTodo(prev => ({ ...prev, assigned_to }))}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddForm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={createTodo}>
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

            <Text style={styles.commentsTodoText}>{selectedTodo?.text}</Text>

            <ScrollView style={styles.commentsList}>
              {(selectedTodo?.comments || []).map((comment, index) => (
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

              {(!selectedTodo?.comments || selectedTodo.comments.length === 0) && (
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
    borderBottomColor: '#D4A574',
  },
  projectTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4A574',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    paddingHorizontal: 8,
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
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#10B981',
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
  todoCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#D4A574',
  },
  todoHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  deleteButton: {
    fontSize: 18,
  },
  todoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F3F4F6',
    marginBottom: 8,
  },
  todoDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dropdownLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    width: 70,
  },
  pickerContainer: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    color: '#FFF',
    height: 40,
  },
  assignedTo: {
    fontSize: 14,
    color: '#D4A574',
    marginBottom: 8,
  },
  commentsButton: {
    backgroundColor: '#374151',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  commentsButtonText: {
    color: '#D4A574',
    fontSize: 14,
    fontWeight: '500',
  },
  linkedItem: {
    backgroundColor: '#374151',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  linkedItemLabel: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  linkedItemText: {
    fontSize: 12,
    color: '#D4A574',
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
    marginHorizontal: 2,
    borderRadius: 8,
  },
  priorityOptionText: {
    color: '#9CA3AF',
    fontWeight: '500',
    fontSize: 12,
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
  commentsTodoText: {
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
