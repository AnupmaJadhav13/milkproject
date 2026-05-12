import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { authApi } from '../../api/api';
import { updateUserInfo } from '../../redux/slices/authSlice';

const EditAdminProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);

  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleUpdateProfile = async () => {
    if (!name.trim() || !username.trim()) {
      Alert.alert('Error', 'Name and username are required');
      return;
    }

    setProfileLoading(true);
    try {
      const response = await authApi.updateProfile({ name, username, phoneNumber }, token);
      
      // Update Redux state with new user info
      dispatch(updateUserInfo({
        name,
        username,
        phoneNumber
      }));
      
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'All password fields are required');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New password and confirm password do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword }, token);
      Alert.alert('Success', 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter full name"
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Enter username"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Enter phone number"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
          />
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, profileLoading && styles.disabledButton]} 
          onPress={handleUpdateProfile}
          disabled={profileLoading}
        >
          <Text style={styles.saveButtonText}>
            {profileLoading ? 'Updating...' : 'Update Profile'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Change Password</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Current Password</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
            placeholderTextColor="#94a3b8"
            secureTextEntry
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter new password (min 6 characters)"
            placeholderTextColor="#94a3b8"
            secureTextEntry
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm New Password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter new password"
            placeholderTextColor="#94a3b8"
            secureTextEntry
          />
        </View>

        <TouchableOpacity 
          style={[styles.changePasswordButton, passwordLoading && styles.disabledButton]} 
          onPress={handleChangePassword}
          disabled={passwordLoading}
        >
          <Text style={styles.changePasswordButtonText}>
            {passwordLoading ? 'Changing...' : 'Change Password'}
          </Text>
        </TouchableOpacity>
      </View>
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
    marginBottom: 24
  },
  backButton: {
    marginBottom: 12
  },
  backButtonText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600'
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a'
  },
  section: {
    marginBottom: 32
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16
  },
  inputGroup: {
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a'
  },
  saveButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  },
  changePasswordButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8
  },
  changePasswordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  },
  disabledButton: {
    opacity: 0.6
  }
});

export default EditAdminProfileScreen;
