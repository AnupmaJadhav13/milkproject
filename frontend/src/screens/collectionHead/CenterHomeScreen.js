import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { fetchFarmers } from '../../redux/slices/farmerSlice';
import LoadingIndicator from '../../components/LoadingIndicator';
import { useDispatch } from 'react-redux';

const CollectionHeadHomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const farmers = useSelector((state) => state.farmers.list);
  const status = useSelector((state) => state.farmers.status);
  const [centerName, setCenterName] = useState('My Center');

  useEffect(() => {
    if (user?.assignedCenter && token) {
      dispatch(fetchFarmers({ token, params: { centerId: user.assignedCenter } }));
    }
  }, [dispatch, token, user]);

  if (status === 'loading') return <LoadingIndicator />;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Collection Head</Text>
      <Text style={styles.subheading}>Welcome, {user?.name || user?.fullName}</Text>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Assigned Center</Text>
        <Text style={styles.cardValue}>{centerName}</Text>
        <Text style={styles.cardDetail}>{farmers.length} active farmers</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('CollectionHeadFarmers') }>
        <Text style={styles.buttonText}>View Farmers</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f8fafc'
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a'
  },
  subheading: {
    color: '#64748b',
    marginTop: 8,
    marginBottom: 24
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4
  },
  cardLabel: {
    color: '#64748b',
    marginBottom: 8
  },
  cardValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a'
  },
  cardDetail: {
    marginTop: 10,
    color: '#475569'
  },
  button: {
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16
  }
});

export default CollectionHeadHomeScreen;
