import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { ArrowLeft, LogOut, Store, MapPin, Droplet, Users, CreditCard, House, Edit, Trash2, FlaskConical } from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows } from '../../theme';

const CenterDetailScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  
  // Get the full center object from route params
  const center = route?.params?.center || {};
  const centerId = center._id || route?.params?.centerId;
  const centerCode = center.centerCode || route?.params?.centerCode || '';
  const centerName = center.name || route?.params?.centerName || 'Collection Center';
  const centerAddress = center.fullAddress || route?.params?.centerAddress || '';
  const centerVillage = center.village || '';
  const centerStatus = center.status || 'Active';
  const hasCoolingUnit = center.hasCoolingUnit || false;
  const hasTestingLab = center.hasTestingLab || false;

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Center',
      'Are you sure you want to delete this center?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          // Add delete logic here
        }}
      ]
    );
  };

  const handleEditCenter = () => {
    // Check if we have a complete center object
    if (center && center._id) {
      navigation.navigate('EditCenter', { center });
    } else {
      Alert.alert(
        'Error',
        'Unable to edit center. Please navigate from the Centers list.',
        [{ text: 'OK' }]
      );
    }
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
            <ArrowLeft size={20} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.brandText}>Sarvasvaa Milk</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={18} color={colors.danger} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Center Info Card */}
        <View style={styles.centerCard}>
          <View style={styles.centerIconContainer}>
            <Store size={32} color={colors.surface} strokeWidth={2} />
          </View>
          <Text style={styles.centerName}>{centerName}</Text>
          <Text style={styles.centerCode}>{centerCode}</Text>
          
          <View style={styles.addressRow}>
            <MapPin size={14} color={colors.textMuted} strokeWidth={2} />
            <Text style={styles.centerAddress}>{centerVillage || centerAddress}</Text>
          </View>

          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: centerStatus === 'Active' ? colors.success : colors.textMuted }]} />
            <Text style={[styles.statusText, { color: centerStatus === 'Active' ? colors.success : colors.textMuted }]}>
              {centerStatus}
            </Text>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>3</Text>
              <Text style={styles.statLabel}>Active Farmers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>3</Text>
              <Text style={styles.statLabel}>Total Farmers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Inactive</Text>
            </View>
          </View>

          {/* Facilities */}
          <View style={styles.facilitiesSection}>
            <Text style={styles.facilitiesTitle}>Facilities</Text>
            <View style={styles.facilitiesRow}>
              {hasCoolingUnit && (
                <View style={styles.facilityTag}>
                  <Droplet size={14} color={colors.primary} strokeWidth={2} />
                  <Text style={styles.facilityText}>Cooling Unit</Text>
                </View>
              )}
              {hasTestingLab && (
                <View style={styles.facilityTag}>
                  <FlaskConical size={14} color={colors.primary} strokeWidth={2} />
                  <Text style={styles.facilityText}>Testing Lab</Text>
                </View>
              )}
            </View>
          </View>

          {/* Edit & Delete Buttons */}
          <View style={styles.centerActions}>
            <TouchableOpacity 
              style={styles.editCenterButton}
              onPress={handleEditCenter}
            >
              <Edit size={16} color={colors.text} strokeWidth={2} />
              <Text style={styles.editCenterText}>Edit Center</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.deleteCenterButton}
              onPress={handleDelete}
            >
              <Trash2 size={16} color={colors.danger} strokeWidth={2} />
              <Text style={styles.deleteCenterText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={[styles.actionCard, styles.actionCardGreen]} 
            onPress={() => navigation.navigate('FoodReports', { centerId, centerName })}
          >
            <Salad size={24} color="#ffffff" strokeWidth={2} />
            <Text style={[styles.actionCardText, { color: '#ffffff' }]}>Food Records</Text>
            <View style={styles.actionCardArrow}>
              <Text style={[styles.actionCardArrowText, { color: '#ffffff' }]}>→</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, styles.actionCardLightGreen]} 
            onPress={() => navigation.navigate('FarmerList', { centerId, centerCode, centerName })}
          >
            <Users size={24} color="#065f46" strokeWidth={2} />
            <Text style={[styles.actionCardText, { color: '#065f46' }]}>Manage Farmers</Text>
            <View style={styles.actionCardArrow}>
              <Text style={[styles.actionCardArrowText, { color: '#065f46' }]}>→</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, styles.actionCardBlue]} 
            onPress={() => navigation.navigate('CollectionRecords', { centerId, centerName })}
          >
            <Droplet size={24} color="#1e40af" strokeWidth={2} />
            <Text style={[styles.actionCardText, { color: '#1e40af' }]}>Collection Records</Text>
            <View style={styles.actionCardArrow}>
              <Text style={[styles.actionCardArrowText, { color: '#1e40af' }]}>→</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, styles.actionCardOrange]} 
            onPress={() => navigation.navigate('AllPays', { centerId, centerName })}
          >
            <CreditCard size={24} color="#9a3412" strokeWidth={2} />
            <Text style={[styles.actionCardText, { color: '#9a3412' }]}>All Payments</Text>
            <View style={styles.actionCardArrow}>
              <Text style={[styles.actionCardArrowText, { color: '#9a3412' }]}>→</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('AdminDashboard')}>
          <View style={styles.navIconContainer}>
            <House size={22} color={colors.textMuted} strokeWidth={2} />
          </View>
          <Text style={styles.navLabel}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CollectionRecords')}>
          <View style={styles.navIconContainer}>
            <Store size={22} color={colors.textMuted} strokeWidth={2} />
          </View>
          <Text style={styles.navLabel}>Collections</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('AllPays')}>
          <View style={styles.navIconContainer}>
            <CreditCard size={22} color={colors.textMuted} strokeWidth={2} />
          </View>
          <Text style={styles.navLabel}>Payments</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('FarmerList')}>
          <View style={styles.navIconContainer}>
            <Users size={22} color={colors.textMuted} strokeWidth={2} />
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
    marginBottom: spacing.lg
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border
  },
  brandText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border
  },
  centerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    alignItems: 'center',
    ...shadows.card
  },
  centerIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#065f46',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  centerName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4
  },
  centerCode: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: spacing.sm
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  centerAddress: {
    fontSize: 13,
    color: colors.textMuted,
    marginLeft: 6
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.successLight,
    marginBottom: spacing.md
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600'
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border
  },
  statItem: {
    flex: 1,
    alignItems: 'center'
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center'
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border
  },
  facilitiesSection: {
    width: '100%',
    marginBottom: spacing.md
  },
  facilitiesTitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    textAlign: 'left'
  },
  facilitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs
  },
  facilityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6
  },
  facilityText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600'
  },
  centerActions: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.sm
  },
  editCenterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 12
  },
  editCenterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text
  },
  deleteCenterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 12
  },
  deleteCenterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.danger
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.md
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg
  },
  actionCard: {
    width: '48%',
    aspectRatio: 1.5,
    borderRadius: radius.lg,
    padding: spacing.md,
    justifyContent: 'space-between',
    ...shadows.small
  },
  actionCardGreen: {
    backgroundColor: '#065f46'
  },
  actionCardLightGreen: {
    backgroundColor: '#d1fae5'
  },
  actionCardBlue: {
    backgroundColor: '#dbeafe'
  },
  actionCardOrange: {
    backgroundColor: '#fed7aa'
  },
  actionCardText: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: spacing.xs
  },
  actionCardArrow: {
    alignSelf: 'flex-end'
  },
  actionCardArrowText: {
    fontSize: 20,
    fontWeight: '600'
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
  navLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600'
  }
});

export default CenterDetailScreen;
