/**
 * Notification Permission Handler
 * 
 * Handles push notification registration for farmers and collection heads
 * Shows success popup when activated
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useSelector } from 'react-redux';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import {
  registerForPushNotificationsAsync
} from '../services/pushNotificationService';
import { authApi } from '../api/api';

export default function NotificationPermissionHandler() {
  const { user, token } = useSelector((state) => state.auth);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Only process once per login session
    if (hasProcessed.current) return;
    
    // Only handle for farmers and collection heads on physical devices
    if (user && (user.role === 'farmer' || user.role === 'collection_head') && token) {
      if (Device.isDevice) {
        hasProcessed.current = true;
        handleNotificationSetup();
      } else {
        console.log('⏭️ Skipping push notifications - not a physical device');
      }
    }
  }, [user, token]);

  const handleNotificationSetup = async () => {
    try {
      setIsProcessing(true);
      console.log('🔔 Starting notification setup...');

      // Get push token (this handles permission internally)
      const expoPushToken = await registerForPushNotificationsAsync();

      if (expoPushToken) {
        console.log('✅ Push token obtained:', expoPushToken);

        // Save to backend for farmers only
        if (user.role === 'farmer') {
          try {
            console.log('💾 Saving push token to backend...');
            await authApi.savePushToken(expoPushToken, token);
            console.log('✅ Push token saved to backend');
          } catch (saveError) {
            console.error('❌ Error saving push token:', saveError);
            // Don't show error to user, just log it
          }
        }

        // Show success popup
        setShowSuccess(true);

        // Auto-hide after 2 seconds
        setTimeout(() => {
          setShowSuccess(false);
        }, 2000);
      } else {
        console.log('⚠️ Push token not obtained - permission may be denied');
        // Don't show error popup, just silently fail
      }
    } catch (error) {
      console.error('❌ Error in notification setup:', error);
      // Don't show error popup, just silently fail
    } finally {
      setIsProcessing(false);
    }
  };

  // Success Modal - Simple and clean
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
  
  // Success Modal Styles
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

