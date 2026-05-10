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

  // Calculate dynamic stats
  const activeCenters = centers.filter(c => c.status === 'Active').length;
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
            <TouchableOpacity 
              style={styles.avatarButton} 
              onPress={() => navigation.navigate('AdminProfile')}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'A'}</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.brandText}>Sarvasvaa Milk</Text>
          </View>
          <TouchableOpacity onPress={onSignOut} style={styles.logoutIcon}>
            <Text style={styles.logoutIconText}>⎋</Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Welcome back, {user?.name || 'Admin'}</Text>

        {/* Stats Cards Row */}
        <View style={styles.statsRow}>
          {/* Collection Centers Card */}
          <View style={[styles.statCard, styles.statCardBlue]}>
            <View style={styles.statIconContainer}>
              <View style={[styles.statIcon, { backgroundColor: colors.iconBlue }]}>
                <Text style={styles.statIconText}>🏢</Text>
              </View>
            </View>
            <Text style={styles.statLabel}>Collection{'\n'}Centers</Text>
            <Text style={styles.statValue}>{activeCenters}</Text>
          </View>

          {/* Farmers Card */}
          <View style={[styles.statCard, styles.statCardPurple]}>
            <View style={styles.statIconContainer}>
              <View style={[styles.statIcon, { backgroundColor: colors.iconPurple }]}>
                <Text style={styles.statIconText}>👥</Text>
              </View>
            </View>
            <Text style={styles.statLabel}>Farmers</Text>
            <Text style={styles.statValue}>{activeFarmers}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity 
          style={[styles.actionButton, styles.actionButtonBlue]} 
          onPress={() => navigation.navigate('CenterList')}
        >
          <View style={styles.actionButtonContent}>
            <View style={styles.actionButtonLeft}>
              <View style={styles.actionButtonIcon}>
                <Text style={styles.actionButtonIconText}>📋</Text>
              </View>
              <Text style={styles.actionButtonText}>Manage Centers</Text>
            </View>
            <Text style={styles.actionButtonArrow}>→</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.actionButtonPurple]} 
          onPress={() => navigation.navigate('RateChart')}
        >
          <View style={styles.actionButtonContent}>
            <View style={styles.actionButtonLeft}>
              <View style={styles.actionButtonIcon}>
                <Text style={styles.actionButtonIconText}>📊</Text>
              </View>
              <Text style={styles.actionButtonText}>Rate Chart</Text>
            </View>
            <Text style={styles.actionButtonArrow}>→</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.actionButtonGreen]} 
          onPress={() => navigation.navigate('AnnualBonus')}
        >
          <View style={styles.actionButtonContent}>
            <View style={styles.actionButtonLeft}>
              <View style={styles.actionButtonIcon}>
                <Text style={styles.actionButtonIconText}>🎁</Text>
              </View>
              <Text style={styles.actionButtonText}>Annual Bonus</Text>
            </View>
            <Text style={styles.actionButtonArrow}>→</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.actionButtonGray]} 
          onPress={() => navigation.navigate('SendSms')}
        >
          <View style={styles.actionButtonContent}>
            <View style={styles.actionButtonLeft}>
              <View style={styles.actionButtonIcon}>
                <Text style={styles.actionButtonIconText}>💬</Text>
              </View>
              <Text style={styles.actionButtonText}>Send SMS</Text>
            </View>
            <Text style={styles.actionButtonArrow}>→</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.actionButtonOrange]} 
          onPress={() => navigation.navigate('AllPays')}
        >
          <View style={styles.actionButtonContent}>
            <View style={styles.actionButtonLeft}>
              <View style={styles.actionButtonIcon}>
                <Text style={styles.actionButtonIconText}>💰</Text>
              </View>
              <Text style={styles.actionButtonText}>All Pays</Text>
            </View>
            <Text style={styles.actionButtonArrow}>→</Text>
          </View>
        </TouchableOpacity>

        {/* Center List Preview */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Center List Preview</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CenterList')}>
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>

        {centers.slice(0, 3).map((center, index) => (
          <TouchableOpacity
            style={styles.centerCard}
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
            <View style={styles.centerIcon}>
              <Text style={styles.centerIconText}>🏢</Text>
            </View>
            <View style={styles.centerContent}>
              <Text style={styles.centerName}>{center.name}</Text>
              <Text style={styles.centerAddress}>📍 {center.fullAddress}</Text>
            </View>
            <View style={[styles.statusBadge, center.status === 'Active' && styles.statusBadgeActive]}>
              <Text style={styles.statusBadgeText}>{center.status}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {centers.length === 0 && (
          <Text style={styles.emptyText}>No centers yet. Add a collection center to get started.</Text>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <View style={[styles.navIconContainer, styles.navIconActive]}>
            <Text style={styles.navIcon}>📊</Text>
          </View>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CollectionRecords')}>
          <View style={styles.navIconContainer}>
            <Text style={styles.navIcon}>📦</Text>
          </View>
          <Text style={styles.navLabel}>Collections</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('AllPays')}>
          <View style={styles.navIconContainer}>
            <Text style={styles.navIcon}>💳</Text>
          </View>
          <Text style={styles.navLabel}>Payments</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('FarmerList')}>
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
  avatarButton: {
    marginRight: spacing.sm
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center'
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
  logoutIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small
  },
  logoutIconText: {
    fontSize: 18,
    color: colors.text
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.sm
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: colors.textMuted
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.card
  },
  statCardBlue: {
    backgroundColor: colors.lightBlue
  },
  statCardPurple: {
    backgroundColor: colors.lightPurple
  },
  statIconContainer: {
    marginBottom: spacing.xs
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center'
  },
  statIconText: {
    fontSize: 18
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 6,
    lineHeight: 16
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4
  },
  actionButton: {
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    ...shadows.small
  },
  actionButtonBlue: {
    backgroundColor: colors.primary
  },
  actionButtonPurple: {
    backgroundColor: colors.purple
  },
  actionButtonGreen: {
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: colors.success
  },
  actionButtonGray: {
    backgroundColor: colors.darkGray
  },
  actionButtonOrange: {
    backgroundColor: colors.orange
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600'
  },
  centerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.card
  },
  centerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.lightBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm
  },
  centerIconText: {
    fontSize: 20
  },
  centerContent: {
    flex: 1
  },
  centerName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4
  },
  centerAddress: {
    fontSize: 12,
    color: colors.textMuted
  },
  statusBadge: {
    backgroundColor: colors.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  statusBadgeActive: {
    backgroundColor: colors.successLight
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text
  },
  emptyText: {
    marginTop: 12,
    color: colors.textMuted,
    textAlign: 'center'
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

export default AdminDashboardScreen;
