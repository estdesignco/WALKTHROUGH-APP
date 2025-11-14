import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { apiService } from '../services/apiService';

export default function ContactsScreen({ route, navigation }) {
  const { projectId } = route.params;
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const response = await apiService.getContacts(projectId);
      setContacts(response.data || []);
    } catch (error) {
      console.error('Failed to load contacts:', error);
      Alert.alert('Error', 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phone) => {
    if (!phone) return;
    const phoneNumber = phone.replace(/[^0-9]/g, '');
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleEmail = (email) => {
    if (!email) return;
    Linking.openURL(`mailto:${email}`);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D4A574" />
        <Text style={styles.loadingText}>Loading contacts...</Text>
      </View>
    );
  }

  if (contacts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📇</Text>
          <Text style={styles.emptyText}>No contacts found</Text>
          <Text style={styles.emptySubtext}>
            Contacts will appear here after questionnaire submission
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Group contacts by role
  const groupedContacts = contacts.reduce((acc, contact) => {
    const role = contact.role || 'Other';
    if (!acc[role]) acc[role] = [];
    acc[role].push(contact);
    return acc;
  }, {});

  const roleOrder = ['Client', 'Spouse/Partner', 'Architect', 'Builder', 'Interior Designer', 'General Contractor'];
  const sortedRoles = [
    ...roleOrder.filter(role => groupedContacts[role]),
    ...Object.keys(groupedContacts).filter(role => !roleOrder.includes(role))
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Project Contacts</Text>
          <Text style={styles.headerSubtitle}>{contacts.length} contact(s)</Text>
        </View>

        {/* Contacts by Role */}
        {sortedRoles.map((role) => (
          <View key={role} style={styles.roleSection}>
            <Text style={styles.roleTitle}>{role}</Text>
            {groupedContacts[role].map((contact, index) => (
              <View key={contact.id || index} style={styles.contactCard}>
                {/* Contact Name */}
                <View style={styles.contactHeader}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  {contact.company && (
                    <Text style={styles.contactCompany}>{contact.company}</Text>
                  )}
                </View>

                {/* Contact Details */}
                <View style={styles.contactDetails}>
                  {contact.phone && (
                    <TouchableOpacity
                      style={styles.contactAction}
                      onPress={() => handleCall(contact.phone)}
                    >
                      <Text style={styles.contactIcon}>📞</Text>
                      <Text style={styles.contactText}>{contact.phone}</Text>
                    </TouchableOpacity>
                  )}

                  {contact.email && (
                    <TouchableOpacity
                      style={styles.contactAction}
                      onPress={() => handleEmail(contact.email)}
                    >
                      <Text style={styles.contactIcon}>✉️</Text>
                      <Text style={styles.contactText}>{contact.email}</Text>
                    </TouchableOpacity>
                  )}

                  {contact.address && (
                    <View style={styles.contactAction}>
                      <Text style={styles.contactIcon}>📍</Text>
                      <Text style={styles.contactText}>{contact.address}</Text>
                    </View>
                  )}
                </View>

                {/* Notes */}
                {contact.notes && (
                  <View style={styles.notesSection}>
                    <Text style={styles.notesLabel}>Notes:</Text>
                    <Text style={styles.notesText}>{contact.notes}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
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
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#1F2937',
    borderBottomWidth: 4,
    borderBottomColor: '#D4A574',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4A574',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  roleSection: {
    margin: 16,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D4A574',
    marginBottom: 12,
    letterSpacing: 1,
  },
  contactCard: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#D4A574',
  },
  contactHeader: {
    marginBottom: 12,
  },
  contactName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F3F4F6',
    marginBottom: 4,
  },
  contactCompany: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  contactDetails: {
    gap: 8,
  },
  contactAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactIcon: {
    fontSize: 16,
  },
  contactText: {
    fontSize: 16,
    color: '#D4C5A9',
  },
  notesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  notesLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#F3F4F6',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 12,
    fontSize: 16,
  },
});
