import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { colors, radius, spacing, shadows } from '../../theme';
import AdvanceScreen from '../admin/AdvanceScreen';
import PayableScreen from '../admin/PayableScreen';

const AllPaysScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { centerId, centerName } = route.params || {};
  const [activeTab, setActiveTab] = useState('advance');

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <View style={styles.container}>
      <View style={[styles.headerContainer, { paddingTop: insets.top + 12 }]}>
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

        <Text style={styles.title}>All Payments</Text>
        <Text style={styles.subtitle}>{centerName || 'Center Payments'}</Text>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'advance' && styles.tabActive]}
            onPress={() => setActiveTab('advance')}
          >
            <Text style={[styles.tabText, activeTab === 'advance' && styles.tabTextActive]}>
              Advance
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'payable' && styles.tabActive]}
            onPress={() => setActiveTab('payable')}
          >
            <Text style={[styles.tabText, activeTab === 'payable' && styles.tabTextActive]}>
              Payable
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Content */}
      {activeTab === 'advance' ? (
        <AdvanceScreen centerId={centerId} />
      ) : (
        <PayableScreen centerId={centerId} />
      )}

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CollectionHeadHome')}>
          <View style={styles.navIconContainer}>
            <Text style={styles.navIcon}>🏠</Text>
          </View>
          <Text style={styles.navLabel}>Home</Text>
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
  headerContainer: {
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md
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
    marginBottom: spacing.md
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
    ...shadows.small
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radius.sm
  },
  tabActive: {
    backgroundColor: colors.primary
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMuted
  },
  tabTextActive: {
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

export default AllPaysScreen;