import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { fetchFarmersByCenter } from '../../redux/slices/farmerSlice';
import { logout } from '../../redux/slices/authSlice';
import LoadingIndicator from '../../components/LoadingIndicator';
import { colors, radius, spacing, typography, shadows } from '../../theme';

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
      <TouchableOpacity style={styles.buttonSecondaryAlt} onPress={() => navigation.navigate('MilkEntry')}>
        <Text style={styles.buttonText}>Daily Milk Collection</Text>
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
    padding: spacing.lg,
    backgroundColor: colors.bg
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg
  },
  heading: {
    fontSize: typography.h1,
    fontWeight: '800',
    color: colors.text
  },
  subheading: {
    color: colors.textMuted,
    marginTop: spacing.xs
  },
  logoutButton: {
    backgroundColor: colors.danger,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.md
  },
  logoutText: {
    color: colors.surface,
    fontWeight: '700'
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 24,
    marginBottom: spacing.lg,
    ...shadows.card
  },
  cardLabel: {
    color: colors.textMuted,
    marginBottom: 8
  },
  cardValue: {
    fontSize: typography.h2,
    fontWeight: '800',
    color: colors.text
  },
  cardDetail: {
    marginTop: 10,
    color: colors.textMuted
  },
  button: {
    paddingVertical: 16,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    marginBottom: 12
  },
  buttonSecondary: {
    paddingVertical: 16,
    borderRadius: radius.md,
    backgroundColor: colors.text,
    alignItems: 'center',
    marginBottom: 12
  },
  buttonSecondaryAlt: {
    paddingVertical: 16,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    marginBottom: 12
  },
  buttonText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 16
  }
});

export default CollectionHeadHomeScreen;
