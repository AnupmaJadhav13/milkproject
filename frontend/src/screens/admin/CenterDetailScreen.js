import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CenterDetailScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const centerId = route?.params?.centerId;
  const centerCode = route?.params?.centerCode || '';
  const centerName = route?.params?.centerName || 'Collection Center';
  const centerAddress = route?.params?.centerAddress || '';

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.centerCard}>
        <Text style={styles.title}>{centerName}</Text>
        {centerCode ? <Text style={styles.code}>Code: {centerCode}</Text> : null}
        {centerAddress ? <Text style={styles.address}>{centerAddress}</Text> : null}
      </View>

      <Text style={styles.actionHeading}>Center Actions</Text>
      <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('FoodReports', { centerId, centerName })}>
        <Text style={styles.actionText}>Food Records</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={() => navigation.navigate('FarmerList', { centerId, centerCode, centerName })}>
        <Text style={styles.actionText}>Add Farmers</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
    justifyContent: 'center',
    gap: 12
  },
  centerCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center'
  },
  address: {
    marginTop: 10,
    fontSize: 15,
    color: '#475569',
    textAlign: 'center'
  },
  code: {
    marginTop: 6,
    color: '#2563eb',
    textAlign: 'center',
    fontWeight: '700'
  },
  actionHeading: {
    marginTop: 14,
    marginBottom: 2,
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a'
  },
  actionButton: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center'
  },
  actionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  },
  secondaryButton: {
    marginTop: 12,
    backgroundColor: '#0ea5e9'
  }
});

export default CenterDetailScreen;
