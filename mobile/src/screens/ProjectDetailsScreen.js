import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { apiService } from '../services/apiService';

export default function ProjectDetailsScreen({ route, navigation }) {
  const { projectId } = route.params;
  const [project, setProject] = useState(null);
  const [questionnaire, setQuestionnaire] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjectDetails();
  }, []);

  const loadProjectDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch project details
      const projectResponse = await apiService.getProject(projectId);
      setProject(projectResponse.data);
      
      // Fetch questionnaire data
      try {
        const questionnaireResponse = await apiService.getQuestionnaire(projectId);
        setQuestionnaire(questionnaireResponse.data);
      } catch (error) {
        console.log('No questionnaire data available');
      }
    } catch (error) {
      console.error('Failed to load project details:', error);
      Alert.alert('Error', 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D4A574" />
        <Text style={styles.loadingText}>Loading project details...</Text>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Project not found</Text>
      </View>
    );
  }

  const answers = questionnaire?.answers || {};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Project Header */}
        <View style={styles.header}>
          <Text style={styles.projectTitle}>{project.name}</Text>
          <Text style={styles.subtitle}>Project Information</Text>
        </View>

        {/* Client Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CLIENT INFORMATION</Text>
          <InfoRow label="Client Name" value={project.client_info?.full_name || answers.client_name} />
          <InfoRow label="Email" value={project.client_info?.email || answers.email} />
          <InfoRow label="Phone" value={project.client_info?.phone || answers.phone} />
          <InfoRow label="Address" value={project.client_info?.address || answers.address} />
          <InfoRow label="Spouse/Partner" value={answers.spouse_partner_name} />
          <InfoRow label="Spouse Phone" value={answers.spouse_partner_phone} />
        </View>

        {/* Project Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PROJECT DETAILS</Text>
          <InfoRow label="Project Type" value={project.project_type} />
          <InfoRow label="Timeline" value={project.timeline || answers.timeline} />
          <InfoRow label="Budget" value={project.budget || answers.budget_range} />
          <InfoRow label="Property Type" value={answers.property_type} />
        </View>

        {/* New Build Team */}
        {(answers.new_build_architect || answers.new_build_builder) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>NEW BUILD TEAM</Text>
            <InfoRow label="Architect" value={answers.new_build_architect} />
            <InfoRow label="Architect Phone" value={answers.new_build_architect_phone} />
            <InfoRow label="Builder" value={answers.new_build_builder} />
            <InfoRow label="Builder Phone" value={answers.new_build_builder_phone} />
            <InfoRow label="New Build Address" value={answers.new_build_address} />
          </View>
        )}

        {/* Renovation Details */}
        {answers.renovation_address && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RENOVATION DETAILS</Text>
            <InfoRow label="Renovation Address" value={answers.renovation_address} />
            <InfoRow label="Current Plans" value={answers.renovation_has_current_plans} />
            <InfoRow label="New Plans" value={answers.renovation_has_new_plans} />
          </View>
        )}

        {/* Design Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DESIGN PREFERENCES</Text>
          <InfoRow label="Designer Experience" value={answers.worked_with_designer_before} />
          <InfoRow label="Decision Maker" value={answers.primary_decision_maker} />
          <InfoRow label="Involvement Level" value={answers.involvement_level} />
          <InfoRow label="Best Time to Call" value={answers.best_time_to_call} />
        </View>

        {/* Rooms Involved */}
        {project.rooms && project.rooms.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ROOMS IN PROJECT</Text>
            <View style={styles.roomsList}>
              {project.rooms.map((room, index) => (
                <View key={room.id || index} style={styles.roomChip}>
                  <Text style={styles.roomChipText}>{room.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Communication Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>COMMUNICATION</Text>
          <InfoRow label="Preferred Method" value={answers.contact_preferences} />
          <InfoRow label="Best Time to Call" value={answers.best_time_to_call} />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Contacts', { projectId })}
          >
            <Text style={styles.buttonText}>📋 View Contacts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Walkthrough', {
              projectId,
              projectName: project.name,
            })}
          >
            <Text style={styles.buttonText}>📸 Start Walkthrough</Text>
          </TouchableOpacity>
          
          {/* NEW BUTTONS - Desktop Feature Parity */}
          <TouchableOpacity
            style={[styles.button, styles.todoButton]}
            onPress={() => navigation.navigate('ToDoList', {
              projectId,
              projectName: project.name,
            })}
          >
            <Text style={styles.buttonText}>✅ To-Do List</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.punchButton]}
            onPress={() => navigation.navigate('PunchList', {
              projectId,
              projectName: project.name,
            })}
          >
            <Text style={styles.buttonText}>🔧 Punch List</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.samplesButton]}
            onPress={() => navigation.navigate('Samples', {
              projectId,
              projectName: project.name,
            })}
          >
            <Text style={styles.buttonText}>🎨 Samples Library</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const InfoRow = ({ label, value }) => {
  if (!value || value === '' || value === 'undefined') return null;
  
  return (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
};

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
  projectTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4A574',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  section: {
    margin: 16,
    padding: 16,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#D4A574',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D4A574',
    marginBottom: 12,
    letterSpacing: 1,
  },
  infoRow: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#F3F4F6',
  },
  roomsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roomChip: {
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D4A574',
  },
  roomChipText: {
    color: '#D4A574',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#D4A574',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
  },
});
