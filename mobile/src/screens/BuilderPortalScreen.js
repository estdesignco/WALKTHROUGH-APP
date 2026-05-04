import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert,
  SafeAreaView, ActivityIndicator, Image, FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { apiService } from '../services/apiService';

export default function BuilderPortalScreen({ route, navigation }) {
  const { accessCode } = route.params;
  const [portalData, setPortalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [todos, setTodos] = useState([]);
  const [lang, setLang] = useState('en');

  const loadPortal = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiService.baseURL}/builder/${accessCode}`);
      if (!res.ok) throw new Error('Portal not found');
      const data = await res.json();
      setPortalData(data);
      // Load todos
      const todosRes = await fetch(`${apiService.baseURL}/todos/${data.portal.project_id}`);
      if (todosRes.ok) {
        const td = await todosRes.json();
        setTodos(Array.isArray(td) ? td : td.todos || []);
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally { setLoading(false); }
  }, [accessCode]);

  useEffect(() => { loadPortal(); }, [loadPortal]);

  const takePhoto = async (roomId) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Camera access required'); return; }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await fetch(`${apiService.baseURL}/photos/upload`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: portalData.portal.project_id,
          room_id: roomId,
          file_name: `photo_${Date.now()}.jpg`,
          photo_data: `data:image/jpeg;base64,${asset.base64}`,
          metadata: { source: 'builder_mobile' }
        }),
      });
      loadPortal();
    }
  };

  const pickPhoto = async (roomId) => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, base64: true, allowsMultipleSelection: true });
    if (!result.canceled) {
      for (const asset of result.assets) {
        await fetch(`${apiService.baseURL}/photos/upload`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: portalData.portal.project_id,
            room_id: roomId,
            file_name: asset.fileName || `photo_${Date.now()}.jpg`,
            photo_data: `data:image/jpeg;base64,${asset.base64}`,
            metadata: { source: 'builder_mobile' }
          }),
        });
      }
      loadPortal();
    }
  };

  const addTodo = async (text, assignedTo) => {
    await fetch(`${apiService.baseURL}/todos`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, project_id: portalData.portal.project_id, assigned_to: assignedTo, priority: 'Medium', source_type: 'builder' }),
    });
    loadPortal();
  };

  const addScheduleItem = async (title, date) => {
    const updated = [...(portalData.portal.schedule || []), { title, date, status: 'pending', notes: '' }];
    await fetch(`${apiService.baseURL}/builder-portal/${portalData.portal.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schedule: updated }),
    });
    loadPortal();
  };

  const toggleScope = async (idx) => {
    const updated = [...(portalData.portal.scope_of_work || [])];
    updated[idx] = { ...updated[idx], completed: !updated[idx].completed };
    await fetch(`${apiService.baseURL}/builder-portal/${portalData.portal.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope_of_work: updated }),
    });
    loadPortal();
  };

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#D4A574" /></View>
  );

  if (!portalData) return (
    <View style={styles.center}><Text style={styles.errorText}>Portal not found</Text></View>
  );

  const { portal, project, rooms, photos } = portalData;
  const scopeItems = portal.scope_of_work || [];
  const completedScope = scopeItems.filter(s => s.completed).length;

  // Get all items for tagging
  const allItems = [];
  (rooms || []).forEach(room => {
    room.categories?.forEach(cat => {
      cat.subcategories?.forEach(sub => {
        sub.items?.forEach(item => { allItems.push({ id: item.id, name: item.name, room: room.name }); });
      });
    });
  });
  const allContacts = portal.contacts || [];

  const tabs = [
    { id: 'dashboard', label: lang === 'en' ? 'Home' : 'Inicio' },
    { id: 'scope', label: lang === 'en' ? 'Scope' : 'Alcance' },
    { id: 'photos', label: lang === 'en' ? 'Photos' : 'Fotos' },
    { id: 'todos', label: lang === 'en' ? 'Tasks' : 'Tareas' },
    { id: 'schedule', label: lang === 'en' ? 'Schedule' : 'Calendario' },
    { id: 'changes', label: lang === 'en' ? 'Changes' : 'Cambios' },
    { id: 'contacts', label: lang === 'en' ? 'Contacts' : 'Contactos' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* TAB BAR */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {tabs.map(tab => (
          <TouchableOpacity key={tab.id} onPress={() => setActiveTab(tab.id)}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}>
            <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity onPress={() => setLang(l => l === 'en' ? 'es' : 'en')} style={styles.langBtn}>
          <Text style={styles.langBtnText}>{lang === 'en' ? 'ES' : 'EN'}</Text>
        </TouchableOpacity>
      </ScrollView>

      <ScrollView style={styles.content}>
        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <View>
            <View style={styles.welcomeBanner}>
              <Text style={styles.welcomeTitle}>{project.name}</Text>
              <Text style={styles.welcomeSub}>{project.client_info?.address}</Text>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statBox}><Text style={styles.statNum}>{rooms.length}</Text><Text style={styles.statLabel}>{lang === 'en' ? 'Rooms' : 'Hab.'}</Text></View>
              <View style={styles.statBox}><Text style={[styles.statNum, { color: '#10B981' }]}>{completedScope}/{scopeItems.length}</Text><Text style={styles.statLabel}>{lang === 'en' ? 'Scope' : 'Alcance'}</Text></View>
              <View style={styles.statBox}><Text style={[styles.statNum, { color: '#F59E0B' }]}>{todos.length}</Text><Text style={styles.statLabel}>{lang === 'en' ? 'Tasks' : 'Tareas'}</Text></View>
            </View>
          </View>
        )}

        {/* SCOPE WITH CHECKBOXES */}
        {activeTab === 'scope' && (
          <View>
            <Text style={styles.sectionTitle}>{lang === 'en' ? 'Scope of Work' : 'Alcance del Trabajo'}</Text>
            {scopeItems.map((item, idx) => (
              <TouchableOpacity key={idx} onPress={() => toggleScope(idx)} style={[styles.scopeItem, item.completed && styles.scopeCompleted]}>
                <View style={[styles.checkbox, item.completed && styles.checkboxChecked]}>
                  {item.completed && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.scopeText, item.completed && styles.scopeTextDone]}>{item.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* PHOTOS - TAKE & UPLOAD */}
        {activeTab === 'photos' && (
          <View>
            <Text style={styles.sectionTitle}>{lang === 'en' ? 'Photos & Files' : 'Fotos y Archivos'}</Text>
            {rooms.map(room => (
              <View key={room.id} style={styles.roomPhotoSection}>
                <View style={styles.roomPhotoHeader}>
                  <Text style={[styles.roomName, { color: room.color || '#D4A574' }]}>{room.name}</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={() => takePhoto(room.id)} style={styles.cameraBtn}>
                      <Text style={styles.cameraBtnText}>📷</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => pickPhoto(room.id)} style={styles.uploadBtn}>
                      <Text style={styles.uploadBtnText}>📁</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                  {(photos[room.id] || []).map((photo, idx) => (
                    <Image key={idx} source={{ uri: photo.url || photo.photo_data }} style={styles.photoThumb} />
                  ))}
                </ScrollView>
              </View>
            ))}
          </View>
        )}

        {/* TODOS - WITH TAGGING */}
        {activeTab === 'todos' && (
          <View>
            <Text style={styles.sectionTitle}>{lang === 'en' ? 'To-Do List' : 'Lista de Tareas'}</Text>
            <TouchableOpacity onPress={() => {
              Alert.prompt(lang === 'en' ? 'New Task' : 'Nueva Tarea', '', (text) => {
                if (text) {
                  // Show picker for assigning
                  const names = allContacts.map(c => c.username || c.name);
                  if (names.length > 0) {
                    Alert.prompt('Assign to (leave blank to skip)', names.join(', '), (assignee) => {
                      addTodo(text, assignee || '');
                    });
                  } else {
                    addTodo(text, '');
                  }
                }
              });
            }} style={styles.addBtn}>
              <Text style={styles.addBtnText}>{lang === 'en' ? '+ Add Task' : '+ Agregar Tarea'}</Text>
            </TouchableOpacity>
            {todos.map(todo => (
              <View key={todo.id} style={[styles.todoItem, { borderLeftColor: todo.status === 'completed' ? '#10B981' : '#F59E0B' }]}>
                <Text style={styles.todoText}>{todo.text?.replace(/<[^>]*>/g, '') || ''}</Text>
                {todo.assigned_to && <Text style={styles.todoAssigned}>@{todo.assigned_to}</Text>}
                {(todo.tagged_products||[]).length > 0 && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                  {todo.tagged_products.map((p,i) => <Text key={i} style={{ color: '#93C5FD', fontSize: 10, backgroundColor: '#1E3A5F', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 3 }}>{allItems.find(x=>x.id===p)?.name||p}</Text>)}
                </View>}
                {(todo.tagged_people||[]).length > 0 && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                  {todo.tagged_people.map((p,i) => <Text key={i} style={{ color: '#D4A574', fontSize: 10, backgroundColor: '#D4A57420', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 3 }}>@{p}</Text>)}
                </View>}
              </View>
            ))}
          </View>
        )}

        {/* SCHEDULE - WITH TAGGING */}
        {activeTab === 'schedule' && (
          <View>
            <Text style={styles.sectionTitle}>{lang === 'en' ? 'Schedule' : 'Calendario'}</Text>
            <TouchableOpacity onPress={() => {
              Alert.prompt(lang === 'en' ? 'New Event' : 'Nuevo Evento', '', (text) => { if (text) addScheduleItem(text, new Date().toISOString().split('T')[0]); });
            }} style={styles.addBtn}>
              <Text style={styles.addBtnText}>{lang === 'en' ? '+ Add to Schedule' : '+ Agregar'}</Text>
            </TouchableOpacity>
            {(portal.schedule || []).map((event, idx) => (
              <View key={idx} style={[styles.scheduleItem, { borderLeftColor: event.status === 'completed' ? '#10B981' : '#D4A574' }]}>
                <Text style={styles.scheduleTitle}>{event.title}</Text>
                <Text style={styles.scheduleDate}>{event.date}</Text>
                {(event.tagged_people||[]).length > 0 && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                  {event.tagged_people.map((p,i) => <Text key={i} style={{ color: '#D4A574', fontSize: 10, backgroundColor: '#D4A57420', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 3 }}>@{p}</Text>)}
                </View>}
              </View>
            ))}
          </View>
        )}

        {/* CHANGE ORDERS */}
        {activeTab === 'changes' && (
          <View>
            <Text style={styles.sectionTitle}>{lang === 'en' ? 'Change Orders' : 'Órdenes de Cambio'}</Text>
            <TouchableOpacity onPress={() => {
              Alert.prompt(lang === 'en' ? 'Change Order Title' : 'Título', '', async (title) => {
                if (title) {
                  Alert.prompt('Description', '', async (desc) => {
                    await fetch(`${apiService.baseURL}/builder/${accessCode}/comment`, {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ section: 'change_order', author: 'Builder', text: JSON.stringify({ title, description: desc || '', date: new Date().toISOString().split('T')[0] }) }),
                    });
                    loadPortal();
                  });
                }
              });
            }} style={styles.addBtn}>
              <Text style={styles.addBtnText}>{lang === 'en' ? '+ New Change Order' : '+ Nueva Orden'}</Text>
            </TouchableOpacity>
            {(portal.change_orders || []).map((co, idx) => (
              <View key={idx} style={[styles.scheduleItem, { borderLeftColor: '#F59E0B' }]}>
                <Text style={styles.scheduleTitle}>{co.title}</Text>
                <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>{co.description?.replace(/<[^>]*>/g, '') || ''}</Text>
                <Text style={styles.scheduleDate}>{co.date}</Text>
              </View>
            ))}
          </View>
        )}

        {/* CONTACTS */}
        {activeTab === 'contacts' && (
          <View>
            <Text style={styles.sectionTitle}>{lang === 'en' ? 'Contacts' : 'Contactos'}</Text>
            {allContacts.map((c, idx) => (
              <View key={idx} style={{ backgroundColor: '#1a1f2e', padding: 14, borderRadius: 8, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: '#D4A574' }}>
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>{c.name}</Text>
                {c.username && <Text style={{ color: '#D4A574', fontSize: 11 }}>@{c.username}</Text>}
                <Text style={{ color: '#10B981', fontSize: 12, marginTop: 2 }}>{c.role}</Text>
                {c.phone && <Text style={{ color: '#9CA3AF', fontSize: 13, marginTop: 6 }}>{c.phone}</Text>}
                {c.email && <Text style={{ color: '#9CA3AF', fontSize: 13 }}>{c.email}</Text>}
              </View>
            ))}
          </View>
        )}
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1218' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f1218' },
  errorText: { color: '#EF4444', fontSize: 16 },
  tabBar: { flexDirection: 'row', backgroundColor: '#1a1f2e', borderBottomWidth: 1, borderBottomColor: '#2a3040', maxHeight: 50 },
  tab: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#D4A574' },
  tabText: { color: '#6B7280', fontSize: 13, fontWeight: '600' },
  activeTabText: { color: '#D4A574', fontWeight: '700' },
  langBtn: { paddingHorizontal: 12, paddingVertical: 14, marginLeft: 'auto' },
  langBtnText: { color: '#D4A574', fontWeight: '900', fontSize: 12 },
  content: { flex: 1, padding: 16 },
  welcomeBanner: { backgroundColor: '#2a2218', borderRadius: 12, padding: 24, borderWidth: 2, borderColor: '#D4A574', marginBottom: 16 },
  welcomeTitle: { color: '#D4A574', fontSize: 22, fontWeight: '900' },
  welcomeSub: { color: '#9CA3AF', fontSize: 13, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statBox: { flex: 1, backgroundColor: '#1a1f2e', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#2a3040' },
  statNum: { color: '#D4A574', fontSize: 28, fontWeight: '900' },
  statLabel: { color: '#9CA3AF', fontSize: 11, marginTop: 4, fontWeight: '700' },
  sectionTitle: { color: '#D4A574', fontSize: 20, fontWeight: '700', marginBottom: 16 },
  scopeItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#1a1f2e', padding: 14, borderRadius: 8, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: '#D4A574' },
  scopeCompleted: { borderLeftColor: '#10B981' },
  checkbox: { width: 24, height: 24, borderRadius: 4, borderWidth: 2, borderColor: '#6B7280', justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#10B981', borderColor: '#10B981' },
  checkmark: { color: '#fff', fontWeight: '900' },
  scopeText: { color: '#E5E7EB', fontSize: 14 },
  scopeTextDone: { color: '#6B7280', textDecorationLine: 'line-through' },
  roomPhotoSection: { marginBottom: 24 },
  roomPhotoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a1f2e', padding: 12, borderRadius: 8 },
  roomName: { fontSize: 15, fontWeight: '700' },
  cameraBtn: { backgroundColor: '#D4A574', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  cameraBtnText: { fontSize: 18 },
  uploadBtn: { backgroundColor: '#374151', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  uploadBtnText: { fontSize: 18 },
  photoThumb: { width: 120, height: 90, borderRadius: 8, marginRight: 8 },
  addBtn: { backgroundColor: '#D4A574', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  addBtnText: { color: '#1a1f2e', fontWeight: '700', fontSize: 14 },
  todoItem: { backgroundColor: '#1a1f2e', padding: 12, borderRadius: 8, marginBottom: 8, borderLeftWidth: 4 },
  todoText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  todoAssigned: { color: '#D4A574', fontSize: 11, marginTop: 4 },
  scheduleItem: { backgroundColor: '#1a1f2e', padding: 14, borderRadius: 8, marginBottom: 8, borderLeftWidth: 4 },
  scheduleTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  scheduleDate: { color: '#D4A574', fontSize: 12, marginTop: 4 },
});
