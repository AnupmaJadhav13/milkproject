/**
 * Test Push Notification Component
 * 
 * Add this to your farmer dashboard to manually test push notifications
 * 
 * Usage:
 * 1. Import: import TestPushNotification from './TestPushNotification';
 * 2. Add to farmer dashboard: <TestPushNotification />
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { registerForPushNotificationsAsync } from './src/services/pushNotificationService';
import { authApi } from './src/api/api';
import { useSelector } from 'react-redux';

export default function TestPushNotification() {
  const [status, setStatus] = useState('');
  const [token, setToken] = useState('');
  const { token: authToken } = useSelector((state) => state.auth);

  const testPermission = async () => {
    try {
      setStatus('Checking permission...');
      const { status } = await Notifications.getPermissionsAsync();
      setStatus(`Permission: ${status}`);
      Alert.alert('Permission Status', status);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
      Alert.alert('Error', error.message);
    }
  };

  const requestPermission = async () => {
    try {
      setStatus('Requesting permission...');
      const { status } = await Notifications.requestPermissionsAsync();
      setStatus(`Permission: ${status}`);
      Alert.alert('Permission Result', status);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
      Alert.alert('Error', error.message);
    }
  };

  const getToken = async () => {
    try {
      setStatus('Getting token...');
      
      if (!Device.isDevice) {
        Alert.alert('Error', 'Must use physical device for push notifications');
        setStatus('Error: Not a physical device');
        return;
      }

      const pushToken = await registerForPushNotificationsAsync();
      
      if (pushToken) {
        setToken(pushToken);
        setStatus('Token obtained!');
        Alert.alert('Success', `Token: ${pushToken.substring(0, 30)}...`);
      } else {
        setStatus('Failed to get token');
        Alert.alert('Error', 'Failed to get push token');
      }
    } catch (error) {
      setStatus(`Error: ${error.message}`);
      Alert.alert('Error', error.message);
    }
  };

  const saveToken = async () => {
    try {
      if (!token) {
        Alert.alert('Error', 'Get token first');
        return;
      }

      setStatus('Saving token to backend...');
      const response = await authApi.savePushToken(token, authToken);
      setStatus('Token saved!');
      Alert.alert('Success', 'Token saved to backend');
      console.log('Response:', response.data);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
      Alert.alert('Error', error.response?.data?.message || error.message);
    }
  };

  const sendLocalNotification = async () => {
    try {
      setStatus('Sending local notification...');
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Notification',
          body: 'This is a local test notification',
          data: { test: true },
        },
        trigger: null, // Show immediately
      });
      setStatus('Local notification sent!');
      Alert.alert('Success', 'Check your notification bar');
    } catch (error) {
      setStatus(`Error: ${error.message}`);
      Alert.alert('Error', error.message);
    }
  };

  const checkDevice = () => {
    const info = {
      isDevice: Device.isDevice,
      brand: Device.brand,
      modelName: Device.modelName,
      osName: Device.osName,
      osVersion: Device.osVersion,
    };
    Alert.alert('Device Info', JSON.stringify(info, null, 2));
    console.log('Device Info:', info);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Push Notification Test</Text>
      
      {status ? <Text style={styles.status}>{status}</Text> : null}
      
      {token ? (
        <Text style={styles.token}>
          Token: {token.substring(0, 30)}...
        </Text>
      ) : null}

      <TouchableOpacity style={styles.button} onPress={checkDevice}>
        <Text style={styles.buttonText}>1. Check Device</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={testPermission}>
        <Text style={styles.buttonText}>2. Check Permission</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={requestPermission}>
        <Text style={styles.buttonText}>3. Request Permission</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={getToken}>
        <Text style={styles.buttonText}>4. Get Push Token</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={saveToken}>
        <Text style={styles.buttonText}>5. Save Token to Backend</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={sendLocalNotification}>
        <Text style={styles.buttonText}>6. Send Local Test</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  status: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  token: {
    fontSize: 12,
    color: '#007AFF',
    marginBottom: 15,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});

