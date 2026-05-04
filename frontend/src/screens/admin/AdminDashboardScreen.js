import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCenters } from '../../redux/slices/centerSlice';
import { fetchFarmers } from '../../redux/slices/farmerSlice';
import LoadingIndicator from '../../components/LoadingIndicator';
import { logout } from '../../redux/slices/authSlice';

const AdminDashboardScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { list: centers, status: centerStatus } = useSelector((state) => state.centers);
  const { list: farmers, status: farmerStatus } = useSelector((state) => state.farmers);
  const { token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token) {
      dispatch(fetchCenters(token));
      dispatch(fetchFarmers({ token, params: {} }));
    }
  }, [dispatch, token]);

  const onSignOut = () => {
    dispatch(logout());
  };

  if (centerStatus === 'loading' || farmerStatus === 'loading') {
    return <LoadingIndicator />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>Welcome back, {user?.name || 'Admin'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={onSignOut}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.cards}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Collection Centers</Text>
          <Text style={styles.cardValue}>{centers.length}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Farmers</Text>
          <Text style={styles.cardValue}>{farmers.length}</Text>
        </View>
      </View>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.grid}>
        <TouchableOpacity style={styles.actionTile} onPress={() => navigation.navigate('CenterList')}>
          <Text style={styles.actionTitle}>Manage Centers</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionTile} onPress={() => navigation.navigate('FarmerList')}>
          <Text style={styles.actionTitle}>Manage Farmers</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.grid}>
        <TouchableOpacity style={styles.actionTile} onPress={() => navigation.navigate('FoodReports')}>
          <Text style={styles.actionTitle}>Food Records</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.sectionTitle}>Recent Centers</Text>
      {centers.slice(0, 3).map((center) => (
        <View style={styles.tile} key={center._id}>
          <Text style={styles.tileHeading}>{center.name}</Text>
          <Text style={styles.tileText}>{center.fullAddress}</Text>
        </View>
      ))}
      {centers.length === 0 && <Text style={styles.emptyText}>No centers yet. Add a collection center to get started.</Text>}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  content: {
    padding: 20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a'
  },
  subtitle: {
    marginTop: 6,
    color: '#64748b'
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
  cards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3
  },
  cardLabel: {
    color: '#64748b',
    marginBottom: 10
  },
  cardValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a'
  },
  sectionTitle: {
    marginTop: 28,
    marginBottom: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a'
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  actionTile: {
    width: '48%',
    backgroundColor: '#2563eb',
    borderRadius: 18,
    padding: 20
  },
  actionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  },
  tile: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3
  },
  tileHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a'
  },
  tileText: {
    marginTop: 8,
    color: '#475569'
  },
  emptyText: {
    marginTop: 12,
    color: '#64748b'
  }
});

export default AdminDashboardScreen;
