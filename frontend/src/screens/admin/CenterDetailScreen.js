import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { colors, radius, spacing, typography, shadows } from '../../theme';

const CenterDetailScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const centerId = route?.params?.centerId;
  const centerCode = route?.params?.centerCode || '';
  const centerName = route?.params?.centerName || 'Collection Center';
  const centerAddress = route?.params?.centerAddress || '';

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.brandText}>Sarvasvaa Milk</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutIcon}>⎋</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Center Details</Text>
        <Text style={styles.subtitle}>Manage center operations and records</Text>

        {/* Center Info Card */}
        <View style={styles.centerCard}>
          <View style={styles.centerIconContainer}>
            <Text style={styles.centerIcon}>🏢</Text>
          </View>
          <Text style={styles.centerName}>{centerName}</Text>
          {centerCode ? <Text style={styles.centerCode}>Code: {centerCode}</Text> : null}
          {centerAddress ? (
            <View style={styles.addressRow}>
              <Text style={styles.addressIcon}>📍</Text>
              <Text style={styles.centerAddress}>{centerAddress}</Text>
            </View>
          ) : null}
        </View>

        {/* Action Buttons */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity 
          style={[styles.actionButton, styles.actionButtonPrimary]} 
          onPress={() => navigation.navigate('FoodReports', { centerId, centerName })}
        >
          <View style={styles.actionButtonContent}>
            <View style={styles.actionButtonLeft}>
              <View style={styles.actionButtonIcon}>
                <Text style={styles.actionButtonIconText}>🌾</Text>
              </View>
              <Text style={styles.actionButtonText}>Food Records</Text>
            </View>
            <Text style={styles.actionButtonArrow}>→</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.actionButtonSecondary]} 
          onPress={() => navigation.navigate('FarmerList', { centerId, centerCode, centerName })}
        >
          <View style={styles.actionButtonContent}>
            <View style={styles.actionButtonLeft}>
              <View style={styles.actionButtonIcon}>
                <Text style={styles.actionButtonIconText}>👥</Text>
              </View>
              <Text style={styles.actionButtonText}>Manage Farmers</Text>
            </View>
            <Text style={styles.actionButtonArrow}>→</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.actionButtonTertiary]} 
          onPress={() => navigation.navigate('CollectionRecords', { centerId, centerName })}
        >
          <View style={styles.actionButtonContent}>
            <View style={styles.actionButtonLeft}>
              <View style={styles.actionButtonIcon}>
                <Text style={styles.actionButtonIconText}>📦</Text>
              </View>
              <Text style={styles.actionButtonText}>Collection Records</Text>
            </View>
            <Text style={styles.actionButtonArrow}>→</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.actionButtonQuaternary]} 
          onPress={() => navigation.navigate('AllPays', { centerId, centerName })}
        >
          <View style={styles.actionButtonContent}>
            <View style={styles.actionButtonLeft}>
              <View style={styles.actionButtonIcon}>
                <Text style={styles.actionButtonIconText}>💰</Text>
              </View>
              <Text style={styles.actionButtonText}>All Payments</Text>
            </View>
            <Text style={styles.actionButtonArrow}>→</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('AdminDashboard')}>
          <View style={styles.navIconContainer}>
            <Text style={styles.navIcon}>📊</Text>
          </View>
          <Text style={styles.navLabel}>Dashboard</Text>
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
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border
  },
  backIcon: {
    fontSize: 20,
    color: colors.text
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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.lightBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  centerIcon: {
    fontSize: 32
  },
  centerName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs
  },
  centerCode: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: spacing.sm
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs
  },
  addressIcon: {
    fontSize: 14,
    marginRight: 6
  },
  centerAddress: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    flex: 1
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
    backgroundColor: colors.success
  },
  actionButtonTertiary: {
    backgroundColor: colors.accent
  },
  actionButtonQuaternary: {
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
  navIcon: {
    fontSize: 20
  },
  navLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600'
  }
});

export default CenterDetailScreen;
