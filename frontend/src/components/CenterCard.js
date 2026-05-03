import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const CenterCard = ({ center, onEdit, onDelete }) => (
  <View style={styles.card}>
    <View style={styles.header}>
      <Text style={styles.name}>{center.name}</Text>
      <Text style={[styles.status, center.status === 'Active' ? styles.active : styles.inactive]}>{center.status}</Text>
    </View>
    <Text style={styles.subtitle}>{center.centerCode}</Text>
    <Text style={styles.meta}>{center.fullAddress}</Text>
    <View style={styles.row}>
      <Text style={styles.chip}>{center.village}</Text>
      <Text style={styles.chip}>{center.district}</Text>
      <Text style={styles.chip}>{center.state}</Text>
    </View>
    <View style={styles.actions}>
      <TouchableOpacity style={styles.button} onPress={onEdit}>
        <Text style={styles.buttonText}>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.delete]} onPress={onDelete}>
        <Text style={styles.buttonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  </View>
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
  chip: {
    backgroundColor: '#e2e8f0',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    color: '#0f172a',
    marginRight: 8,
    marginBottom: 6
  },
  actions: {
    flexDirection: 'row',
    marginTop: 12,
    justifyContent: 'flex-end'
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    marginLeft: 8
  },
  delete: {
    backgroundColor: '#ef4444'
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700'
  }
});

export default CenterCard;
