import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCenters } from '../../redux/slices/centerSlice';
import { fetchFarmers } from '../../redux/slices/farmerSlice';
import LoadingIndicator from '../../components/LoadingIndicator';
import { logout } from '../../redux/slices/authSlice';
import { colors, radius, spacing, typography, shadows } from '../../theme';

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
        <TouchableOpacity 
          style={styles.avatarButton} 
          onPress={() => navigation.navigate('AdminProfile')}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'A'}</Text>
          </View>
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
      <TouchableOpacity style={styles.allPaysButton} onPress={() => navigation.navigate('AllPays')}>
        <Text style={styles.allPaysButtonText}>All Pays</Text>
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
    backgroundColor: colors.bg
  },
  content: {
    padding: spacing.lg
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: typography.h1,
    fontWeight: '800',
    color: colors.text
  },
  subtitle: {
    marginTop: 6,
    color: colors.textMuted
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
  avatarButton: {
    padding: 4
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.surface
  },
  cards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg
  },
  card: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.card
  },
  cardLabel: {
    color: colors.textMuted,
    marginBottom: 10
  },
  cardValue: {
    fontSize: typography.h1,
    fontWeight: '800',
    color: colors.text
  },
  sectionTitle: {
    marginTop: 28,
    marginBottom: 6,
    fontSize: typography.h2,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center'
  },
  sectionSubtitle: {
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 14
  },
  manageCenterButton: {
    marginTop: 24,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center'
  },
  manageCenterButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700'
  },
  secondaryButton: {
    marginTop: 12,
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center'
  },
  secondaryButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700'
  },
  secondaryButtonOutline: {
    marginTop: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.success
  },
  secondaryButtonOutlineText: {
    color: colors.success,
    fontSize: 16,
    fontWeight: '700'
  },
  smsButton: {
    marginTop: 12,
    backgroundColor: colors.text,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center'
  },
  smsButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700'
  },
  allPaysButton: {
    marginTop: 12,
    backgroundColor: colors.warning,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center'
  },
  allPaysButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700'
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 12,
    ...shadows.card
  },
  tileIndex: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center'
  },
  tileIndexText: {
    color: colors.primaryDark,
    fontWeight: '800'
  },
  tileContent: {
    marginLeft: 12,
    flex: 1
  },
  tileHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text
  },
  tileText: {
    marginTop: 8,
    color: colors.textMuted
  },
  emptyText: {
    marginTop: 12,
    color: colors.textMuted
  }
});

export default AdminDashboardScreen;
