import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { fetchFarmersByCenter } from '../../redux/slices/farmerSlice';
import { logout } from '../../redux/slices/authSlice';
import LoadingIndicator from '../../components/LoadingIndicator';

const CollectionHeadHomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const farmers = useSelector((state) => state.farmers.list);
  const status = useSelector((state) => state.farmers.status);
  const [centerName, setCenterName] = useState('My Center');

  useEffect(() => {
    if (user?.assignedCenter && token) {
      dispatch(fetchFarmersByCenter({ centerId: user.assignedCenter, token }));
    }
  }, [dispatch, token, user]);

  const handleLogout = () => {
    dispatch(logout());
  };

  if (status === 'loading') return <LoadingIndicator />;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Collection Head</Text>
          <Text style={styles.subheading}>Welcome, {user?.name || user?.fullName}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Assigned Center</Text>
        <Text style={styles.cardValue}>{centerName}</Text>
        <Text style={styles.cardDetail}>{farmers.length} active farmers</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('FoodEntry')}>
        <Text style={styles.buttonText}>Add Food Record</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.buttonSecondary} onPress={() => navigation.navigate('FoodHistory')}>
        <Text style={styles.buttonText}>Center Food History</Text>
      </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a'
  },
  subheading: {
    color: '#64748b',
    marginTop: 8
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16
  },
  logoutText: {
    color: '#fff',
    fontWeight: '700'
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
    alignItems: 'center',
    marginBottom: 12
  },
  buttonSecondary: {
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    marginBottom: 12
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16
  }
});

export default CollectionHeadHomeScreen;
