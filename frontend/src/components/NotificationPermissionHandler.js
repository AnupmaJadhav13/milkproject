import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  Linking,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import * as Device from 'expo-device';
import { registerForPushNotificationsAsync } from '../services/pushNotificationService';
import { authApi } from '../api/api';

export default function NotificationPermissionHandler() {
  const { user, token } = useSelector((state) => state.auth);
  const [showSuccess, setShowSuccess] = useState(false);
  const hasSavedToken = useRef(false);
  const isProcessing = useRef(false);
  const permissionAlertVisible = useRef(false);

  useEffect(() => {
    if (user?.role === 'farmer' && token) {
      handleNotificationSetup();
    }
  }, [user, token]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && user?.role === 'farmer' && token) {
        handleNotificationSetup();
      }
    });

    return () => subscription.remove();
  }, [user, token]);

  const showNotificationRequiredAlert = () => {
    if (permissionAlertVisible.current) return;

    permissionAlertVisible.current = true;
    Alert.alert(
      'Notifications Required',
      'Farmer payment and advance alerts are sent as phone notifications. Please allow notifications to receive real-time updates.',
      [
        {
          text: 'Open Settings',
          onPress: async () => {
            permissionAlertVisible.current = false;
            await Linking.openSettings();
          },
        },
        {
          text: 'Try Again',
          onPress: () => {
            permissionAlertVisible.current = false;
            handleNotificationSetup();
          },
        },
      ],
      { cancelable: false }
    );
  };

  const handleNotificationSetup = async () => {
    if (isProcessing.current || hasSavedToken.current) return;

    try {
      isProcessing.current = true;

      if (!Device.isDevice) {
        console.log('Skipping push notifications on non-physical device');
        return;
      }

      const pushResult = await registerForPushNotificationsAsync();
      const fcmToken = typeof pushResult === 'string' ? pushResult : pushResult?.token;

      if (!fcmToken) {
        if (pushResult?.status === 'permission_denied') {
          showNotificationRequiredAlert();
        } else {
          console.warn('FCM token not available:', pushResult);
        }
        return;
      }

      await authApi.savePushToken({ fcmToken, pushProvider: 'fcm' }, token);
      hasSavedToken.current = true;
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Error in FCM notification setup:', error);
    } finally {
      isProcessing.current = false;
    }
  };

  return (
    <Modal
      visible={showSuccess}
      transparent
      animationType="fade"
      onRequestClose={() => setShowSuccess(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.successCard}>
          <View style={styles.successIcon}>
            <Text style={styles.successIconText}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Notification Activated!</Text>
          <Text style={styles.successSubtitle}>सूचना सक्रिय!</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
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
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  successIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#0F766E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  successIconText: {
    fontSize: 44,
    color: 'white',
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 5,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F766E',
    textAlign: 'center',
  },
});
