import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const FarmerCard = ({ farmer, onPress, actions }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
    <View style={styles.header}>
      <Text style={styles.name}>{farmer.fullName}</Text>
      <Text style={[styles.status, farmer.status === 'Active' ? styles.active : styles.inactive]}>{farmer.status}</Text>
    </View>
    <Text style={styles.subtitle}>{farmer.mobileNumber}</Text>
    <Text style={styles.meta}>{farmer.address}</Text>
    <View style={styles.row}>
      <Text style={styles.tag}>{farmer.animalType}</Text>
      <Text style={styles.tag}>{farmer.village}</Text>
      <Text style={styles.tag}>{farmer.assignedCenter?.name || 'Unassigned'}</Text>
    </View>
    {actions ? <View style={styles.actions}>{actions}</View> : null}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a'
  },
  status: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    color: '#fff'
  },
  active: {
    backgroundColor: '#16a34a'
  },
  inactive: {
    backgroundColor: '#ef4444'
  },
  subtitle: {
    color: '#64748b',
    marginBottom: 8
  },
  meta: {
    color: '#475569',
    marginBottom: 12
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  tag: {
    backgroundColor: '#e2e8f0',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    color: '#0f172a',
    marginRight: 8,
    marginBottom: 6
  },
  actions: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end'
  }
});

export default FarmerCard;
