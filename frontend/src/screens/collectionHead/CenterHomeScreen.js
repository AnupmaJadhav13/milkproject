import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
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

  useEffect(() => {
    if (user?.assignedCenter && token) {
      dispatch(fetchFarmersByCenter({ centerId: user.assignedCenter, token }));
    }
  }, [dispatch, token, user]);

  const handleLogout = () => {
    dispatch(logout());
  };

  if (status === 'loading') return <LoadingIndicator />;

  const activeFarmers = farmers.filter(f => f.status === 'Active').length;

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'C'}</Text>
            </View>
            <Text style={styles.brandText}>Sarvasvaa Milk</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutIcon}>⎋</Text>
          </TouchableOpacity>
        </View>

        {/* Title & Subtitle */}
        <Text style={styles.title}>Collection Head</Text>
        <Text style={styles.subtitle}>Welcome, {user?.name || user?.fullName || 'Collection Head'}</Text>

        {/* Center Info Card */}
        <View style={styles.centerCard}>
          <View style={styles.centerIconContainer}>
            <Text style={styles.centerIcon}>🏢</Text>
          </View>
          <Text style={styles.centerLabel}>Assigned Center</Text>
          <Text style={styles.centerName}>My Center</Text>
          <View style={styles.centerStats}>
            <View style={styles.centerStat}>
              <Text style={styles.centerStatValue}>{activeFarmers}</Text>
              <Text style={styles.centerStatLabel}>Active Farmers</Text>
            </View>
            <View style={styles.centerStat}>
              <Text style={styles.centerStatValue}>{farmers.length}</Text>
              <Text style={styles.centerStatLabel}>Total Farmers</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity style={[styles.actionButton, styles.actionButtonPrimary]} onPress={() => navigation.navigate('FoodEntry')}>
          <View style={styles.actionButtonContent}>
            <View style={styles.actionButtonLeft}>
              <View style={styles.actionButtonIcon}>
                <Text style={styles.actionButtonIconText}>🌾</Text>
              </View>
              <Text style={styles.actionButtonText}>Add Food Record</Text>
            </View>
            <Text style={styles.actionButtonArrow}>→</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.actionButtonSecondary]} onPress={() => navigation.navigate('MilkEntry')}>
          <View style={styles.actionButtonContent}>
            <View style={styles.actionButtonLeft}>
              <View style={styles.actionButtonIcon}>
                <Text style={styles.actionButtonIconText}>🥛</Text>
              </View>
              <Text style={styles.actionButtonText}>Daily Milk Collection</Text>
            </View>
            <Text style={styles.actionButtonArrow}>→</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.actionButtonTertiary]} onPress={() => navigation.navigate('FoodHistory')}>
          <View style={styles.actionButtonContent}>
            <View style={styles.actionButtonLeft}>
              <View style={styles.actionButtonIcon}>
                <Text style={styles.actionButtonIconText}>📋</Text>
              </View>
              <Text style={styles.actionButtonText}>Center Food History</Text>
            </View>
            <Text style={styles.actionButtonArrow}>→</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.actionButtonQuaternary]} onPress={() => navigation.navigate('CollectionHeadFarmers')}>
          <View style={styles.actionButtonContent}>
            <View style={styles.actionButtonLeft}>
              <View style={styles.actionButtonIcon}>
                <Text style={styles.actionButtonIconText}>👥</Text>
              </View>
              <Text style={styles.actionButtonText}>View Farmers</Text>
            </View>
            <Text style={styles.actionButtonArrow}>→</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <View style={[styles.navIconContainer, styles.navIconActive]}>
            <Text style={styles.navIcon}>🏠</Text>
          </View>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MilkEntry')}>
          <View style={styles.navIconContainer}>
            <Text style={styles.navIcon}>🥛</Text>
          </View>
          <Text style={styles.navLabel}>Milk Entry</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('FoodEntry')}>
          <View style={styles.navIconContainer}>
            <Text style={styles.navIcon}>🌾</Text>
          </View>
          <Text style={styles.navLabel}>Food Entry</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CollectionHeadFarmers')}>
          <View style={styles.navIconContainer}>
            <Text style={styles.navIcon}>👥</Text>
          </View>
          <Text style={styles.navLabel}>Farmers</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg
  },
  scrollView: {
    flex: 1
  },
  content: {
    padding: spacing.lg
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.surface
  },
  brandText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text
  },
  logoutButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.danger
  },
  logoutIcon: {
    fontSize: 18,
    color: colors.danger
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.sm
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: spacing.lg
  },
  centerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    alignItems: 'center',
    ...shadows.card
  },
  centerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.lightBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  centerIcon: {
    fontSize: 28
  },
  centerLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4
  },
  centerName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.md
  },
  centerStats: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing.sm
  },
  centerStat: {
    alignItems: 'center'
  },
  centerStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4
  },
  centerStatLabel: {
    fontSize: 11,
    color: colors.textMuted
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.md
  },
  actionButton: {
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.small
  },
  actionButtonPrimary: {
    backgroundColor: colors.primary
  },
  actionButtonSecondary: {
    backgroundColor: colors.accent
  },
  actionButtonTertiary: {
    backgroundColor: colors.darkGray
  },
  actionButtonQuaternary: {
    backgroundColor: colors.success
  },
  actionButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  actionButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  actionButtonIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm
  },
  actionButtonIconText: {
    fontSize: 16
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.surface
  },
  actionButtonArrow: {
    fontSize: 20,
    color: colors.surface,
    fontWeight: '700'
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.medium
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: spacing.xs
  },
  navIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4
  },
  navIconActive: {
    backgroundColor: colors.primary
  },
  navIcon: {
    fontSize: 20
  },
  navLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600'
  },
  navLabelActive: {
    color: colors.primary
  }
});

export default CollectionHeadHomeScreen;
