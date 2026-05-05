import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';

const AdminProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back to Dashboard</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'A'}</Text>
        </View>
        <Text style={styles.userName}>{user?.name || 'Admin'}</Text>
        <Text style={styles.userRole}>Administrator</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Full Name</Text>
            <Text style={styles.infoValue}>{user?.name || 'N/A'}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Username</Text>
            <Text style={styles.infoValue}>{user?.username || 'N/A'}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone Number</Text>
            <Text style={styles.infoValue}>{user?.phoneNumber || 'N/A'}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.editButton} 
        onPress={() => navigation.navigate('EditAdminProfile')}
      >
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  content: {
    padding: 20,
    paddingBottom: 40
  },
  header: {
    marginBottom: 20
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  backButtonText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600'
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#fff'
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4
  },
  userRole: {
    fontSize: 16,
    color: '#64748b'
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3
  },
  infoRow: {
    paddingVertical: 12
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a'
  },
  infoValueSmall: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569'
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0'
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  },
  editButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#2563eb'
  },
  editButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '700'
  }
});

export default AdminProfileScreen;
