import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFarmers, deleteFarmer } from '../../redux/slices/farmerSlice';
import LoadingIndicator from '../../components/LoadingIndicator';
import SearchBar from '../../components/SearchBar';
import ConfirmDialog from '../../components/ConfirmDialog';
import { colors, radius, spacing, shadows } from '../../theme';

const FarmerListScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { list, status } = useSelector((state) => state.farmers);
  const { user } = useSelector((state) => state.auth);
  const token = useSelector((state) => state.auth.token);
  const selectedCenterId = route?.params?.centerId || '';
  const selectedCenterCode = route?.params?.centerCode || '';
  const selectedCenterName = route?.params?.centerName || '';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);

  useFocusEffect(
    React.useCallback(() => {
      if (token) {
        const params = selectedCenterId ? { centerId: selectedCenterId } : {};
        dispatch(fetchFarmers({ token, params }));
      }
    }, [dispatch, token, selectedCenterId])
  );

  const filtered = list.filter((farmer) => {
    const matchesSearch = [farmer.fullName, farmer.mobileNumber, farmer.farmerCode, farmer.village]
      .some((field) => field?.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || farmer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const onDelete = (farmer) => {
    setSelectedFarmer(farmer);
    setConfirmVisible(true);
  };

  const confirmDelete = () => {
    dispatch(deleteFarmer({ id: selectedFarmer._id, token }));
    setConfirmVisible(false);
  };

  const onCall = (mobile) => {
    const cleaned = String(mobile || '').replace(/[^\d+]/g, '');
    if (!cleaned) {
      Alert.alert('No number', 'This farmer has no mobile number.');
      return;
    }
    Linking.openURL(`tel:${cleaned}`);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (index) => {
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];
    return colors[index % colors.length];
  };

  if (status === 'loading') return <LoadingIndicator />;

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
          <TouchableOpacity style={styles.logoutIcon}>
            <Text style={styles.logoutIconText}>⎋</Text>
          </TouchableOpacity>
        </View>

        {/* Title & Subtitle */}
        <Text style={styles.title}>Farmers</Text>
        <Text style={styles.subtitle}>Manage and track your dairy farmers</Text>

        {/* Add Farmer Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddFarmer', { centerId: selectedCenterId, centerCode: selectedCenterCode, centerName: selectedCenterName })}
        >
          <Text style={styles.addButtonText}>+ Add Farmer</Text>
        </TouchableOpacity>

        {/* Search Bar */}
        <SearchBar 
          value={search} 
          onChange={setSearch} 
          placeholder="Search by name, code, or mobile number..." 
        />

        {/* Status Filter Pills */}
        <View style={styles.filterPills}>
          {['All', 'Active', 'Inactive'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.filterPill, statusFilter === status && styles.filterPillActive]}
              onPress={() => setStatusFilter(status)}
            >
              <Text style={[styles.filterPillText, statusFilter === status && styles.filterPillTextActive]}>
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Farmers List */}
        {filtered.length === 0 ? (
          <Text style={styles.emptyText}>No farmers match your search or filter.</Text>
        ) : (
          filtered.map((farmer, index) => (
            <View key={farmer._id} style={styles.farmerCard}>
              {/* Farmer Header */}
              <View style={styles.farmerHeader}>
                <View style={styles.farmerHeaderLeft}>
                  <View style={[styles.farmerAvatar, { backgroundColor: getAvatarColor(index) }]}>
                    <Text style={styles.farmerAvatarText}>{getInitials(farmer.fullName)}</Text>
                  </View>
                  <View style={styles.farmerHeaderInfo}>
                    <Text style={styles.farmerName}>{farmer.fullName}</Text>
                    <Text style={styles.farmerCode}>{farmer.farmerCode}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, farmer.status === 'Active' ? styles.statusBadgeActive : styles.statusBadgeInactive]}>
                  <View style={[styles.statusDot, { backgroundColor: farmer.status === 'Active' ? colors.success : colors.textMuted }]} />
                  <Text style={[styles.statusText, { color: farmer.status === 'Active' ? colors.success : colors.textMuted }]}>
                    {farmer.status}
                  </Text>
                </View>
              </View>

              {/* Farmer Details */}
              <View style={styles.farmerDetail}>
                <Text style={styles.detailIcon}>📞</Text>
                <Text style={styles.detailText}>{farmer.mobileNumber}</Text>
              </View>

              <View style={styles.farmerDetail}>
                <Text style={styles.detailIcon}>📍</Text>
                <Text style={styles.detailText}>{farmer.village}, {farmer.address}</Text>
              </View>

              {/* Tags */}
              <View style={styles.tagsRow}>
                <View style={styles.tag}>
                  <Text style={styles.tagIcon}>🐄</Text>
                  <Text style={styles.tagText}>{farmer.animalType}</Text>
                </View>
                <View style={styles.tag}>
                  <Text style={styles.tagIcon}>🏢</Text>
                  <Text style={styles.tagText}>{farmer.assignedCenter?.name || 'Center A'}</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.callButton} onPress={() => onCall(farmer.mobileNumber)}>
                  <Text style={styles.callButtonIcon}>📞</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditFarmer', { farmer })}>
                  <Text style={styles.editButtonIcon}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(farmer)}>
                  <Text style={styles.deleteButtonIcon}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
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

        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <View style={[styles.navIconContainer, styles.navIconActive]}>
            <Text style={styles.navIcon}>👥</Text>
          </View>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Farmers</Text>
        </TouchableOpacity>
      </View>

      <ConfirmDialog
        visible={confirmVisible}
        title="Remove Farmer"
        message="Are you sure you want to delete this farmer record?"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmVisible(false)}
      />
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
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: spacing.md
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.small
  },
  addButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700'
  },
  filterPills: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted
  },
  filterPillTextActive: {
    color: colors.surface
  },
  farmerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card
  },
  farmerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  farmerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  farmerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm
  },
  farmerAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.surface
  },
  farmerHeaderInfo: {
    flex: 1
  },
  farmerName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2
  },
  farmerCode: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600'
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12
  },
  statusBadgeActive: {
    backgroundColor: colors.successLight
  },
  statusBadgeInactive: {
    backgroundColor: colors.lightGray
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600'
  },
  farmerDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs
  },
  detailIcon: {
    fontSize: 14,
    marginRight: 8
  },
  detailText: {
    fontSize: 13,
    color: colors.textMuted,
    flex: 1
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
    marginBottom: spacing.sm
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 6
  },
  tagIcon: {
    fontSize: 12,
    marginRight: 4
  },
  tagText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600'
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.xs
  },
  callButton: {
    flex: 1,
    backgroundColor: colors.successLight,
    borderRadius: radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.success
  },
  callButtonIcon: {
    fontSize: 16
  },
  editButton: {
    flex: 1,
    backgroundColor: colors.lightGray,
    borderRadius: radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border
  },
  editButtonIcon: {
    fontSize: 16
  },
  deleteButton: {
    flex: 1,
    backgroundColor: colors.dangerLight,
    borderRadius: radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.danger
  },
  deleteButtonIcon: {
    fontSize: 16
  },
  emptyText: {
    marginTop: 24,
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

export default FarmerListScreen;
