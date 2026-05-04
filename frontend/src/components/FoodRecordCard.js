import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const FoodRecordCard = ({ record }) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.farmerName}>{record.farmerId?.fullName}</Text>
        <Text style={styles.date}>{new Date(record.date).toLocaleDateString()}</Text>
      </View>
      <View style={styles.details}>
        <Text style={styles.detailText}>Animal: {record.animalType}</Text>
        <Text style={styles.detailText}>Food: {record.foodType}</Text>
        <Text style={styles.detailText}>Quantity: {record.quantity} {record.unit}</Text>
        <Text style={styles.detailText}>Rate: ₹{record.rate}</Text>
        <Text style={styles.detailText}>Total: ₹{record.totalAmount}</Text>
        <Text style={[styles.detailText, styles.status, record.paymentStatus === 'Paid' ? styles.paid : styles.pending]}>
          Status: {record.paymentStatus}
        </Text>
      </View>
      {record.notes && (
        <Text style={styles.notes}>Notes: {record.notes}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  farmerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  details: {
    marginBottom: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },
  status: {
    fontWeight: 'bold',
  },
  paid: {
    color: '#2e7d32',
  },
  pending: {
    color: '#f57c00',
  },
  notes: {
    fontSize: 12,
    color: '#777',
    fontStyle: 'italic',
  },
});

export default FoodRecordCard;