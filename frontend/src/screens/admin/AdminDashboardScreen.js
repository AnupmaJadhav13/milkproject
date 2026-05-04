import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCenters } from '../../redux/slices/centerSlice';
import { fetchFarmers } from '../../redux/slices/farmerSlice';
import LoadingIndicator from '../../components/LoadingIndicator';
import { logout } from '../../redux/slices/authSlice';

const AdminDashboardScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
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
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}>
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
      <TouchableOpacity style={styles.manageCenterButton} onPress={() => navigation.navigate('CenterList')}>
        <Text style={styles.manageCenterButtonText}>Manage Centers</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('RateChart')}>
        <Text style={styles.secondaryButtonText}>Rate chart</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButtonOutline} onPress={() => navigation.navigate('AnnualBonus')}>
        <Text style={styles.secondaryButtonOutlineText}>Annual bonus</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.smsButton} onPress={() => navigation.navigate('SendSms')}>
        <Text style={styles.smsButtonText}>Send SMS</Text>
      </TouchableOpacity>
      <Text style={styles.sectionTitle}>Center List</Text>
      <Text style={styles.sectionSubtitle}>Select one center to view actions</Text>
      {centers.slice(0, 3).map((center, index) => (
        <TouchableOpacity
          style={styles.tile}
          key={center._id}
          onPress={() =>
            navigation.navigate('CenterDetail', {
              centerId: center._id,
              centerCode: center.centerCode,
              centerName: center.name,
              centerAddress: center.fullAddress
            })
          }
        >
          <View style={styles.tileIndex}>
            <Text style={styles.tileIndexText}>{index + 1}</Text>
          </View>
          <View style={styles.tileContent}>
            <Text style={styles.tileHeading}>{center.name}</Text>
            <Text style={styles.tileText}>{center.fullAddress}</Text>
          </View>
        </TouchableOpacity>
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
    marginBottom: 6,
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center'
  },
  sectionSubtitle: {
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 14
  },
  manageCenterButton: {
    marginTop: 24,
    backgroundColor: '#2563eb',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center'
  },
  manageCenterButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  },
  secondaryButton: {
    marginTop: 12,
    backgroundColor: '#7c3aed',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center'
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  },
  secondaryButtonOutline: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0d9488'
  },
  secondaryButtonOutlineText: {
    color: '#0d9488',
    fontSize: 16,
    fontWeight: '700'
  },
  smsButton: {
    marginTop: 12,
    backgroundColor: '#0f172a',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center'
  },
  smsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3
  },
  tileIndex: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center'
  },
  tileIndexText: {
    color: '#1d4ed8',
    fontWeight: '800'
  },
  tileContent: {
    marginLeft: 12,
    flex: 1
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
