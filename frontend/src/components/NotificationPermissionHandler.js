/**
 * Notification Permission Handler
 * Handles push notification registration for all users
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Modal, StyleSheet, Platform } from 'react-native';
import { useSelector } from 'react-redux';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { authApi } from '../api/api';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function NotificationPermissionHandler() {
  const { user, token } = useSelector((state) => state.auth);
  const [showSuccess, setShowSuccess] = useState(false);
  const isRegistering = useRef(false);
  const registeredUserId = useRef(null);

  useEffect(() => {
    // Only register if:
    // 1. User is logged in (user and token exist)
    // 2. Running on physical device
    // 3. Not currently registering
    // 4. Haven't registered for this user yet
    if (user && token && Device.isDevice && !isRegistering.current && registeredUserId.current !== user.id) {
      registerPushNotifications();
    }
  }, [user, token]); // Watch entire user and token objects

  const registerPushNotifications = async () => {
    // Prevent concurrent registrations
    if (isRegistering.current) return;
    isRegistering.current = true;

    try {
      // Step 1: Request permission
      const { status: existingStatus} = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        isRegistering.current = false;
        return;
      }

      // Step 2: Get push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      if (!projectId) {
        isRegistering.current = false;
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      const expoPushToken = tokenData.data;

      if (!expoPushToken) {
        isRegistering.current = false;
        return;
      }

      // Step 3: Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        });
      }

      // Step 4: Save to backend
      const response = await authApi.savePushToken(expoPushToken, token);
      
      if (response.data.success) {
        // Mark this user as registered
        registeredUserId.current = user.id;
        
        // Show success popup
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      }
      
      isRegistering.current = false;
    } catch (error) {
      isRegistering.current = false;
    }
  };

  return (
    <Modal
      visible={showSuccess}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowSuccess(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.successCard}>
          <View style={styles.successIcon}>
            <Text style={styles.successIconText}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Notification Activated!</Text>
          <Text style={styles.successTitle}>सूचना सक्रिय!</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  successCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    maxWidth: 300,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  successIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  successIconText: {
    fontSize: 45,
    color: 'white',
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
});
