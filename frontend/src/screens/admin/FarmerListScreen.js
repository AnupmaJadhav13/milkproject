import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Users, Plus, Phone, Trash2, SquarePen, LogOut } from 'lucide-react-native';
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
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    if (token) {
      const params = selectedCenterId ? { centerId: selectedCenterId } : {};
      dispatch(fetchFarmers({ token, params }));
    }
  }, [dispatch, token, selectedCenterId]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  }, [loadData]);

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
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (index) => {
    const avatarColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];
    return avatarColors[index % avatarColors.length];
  };

  if (status === 'loading') return <LoadingIndicator />;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
          
            <Text style={styles.title}>Farmers</Text>
          </View>
          <TouchableOpacity style={styles.logoutIcon}>
            <LogOut size={18} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
        </View>

           

        {/* Farmer Login Management + Add Farmer side by side */}
        <View style={styles.topActionsRow}>
          <TouchableOpacity
            style={styles.loginMgmtBtn}
            onPress={() => navigation.navigate('FarmerLoginManagement')}
          >
            <Text style={styles.loginMgmtBtnText}>🔐 Login Mgmt</Text>
          </TouchableOpacity>

          {selectedCenterId && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('AddFarmer', {
                centerId: selectedCenterId,
                centerCode: selectedCenterCode,
                centerName: selectedCenterName
              })}
            >
              <Plus size={16} color={colors.surface} strokeWidth={2.5} />
              <Text style={styles.addButtonText}>Add Farmer</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search Bar */}
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by name, code, or mobile..."
        />

        {/* Status Filter Pills */}
        <View style={styles.filterPills}>
          {['All', 'Active', 'Inactive'].map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.filterPill, statusFilter === s && styles.filterPillActive]}
              onPress={() => setStatusFilter(s)}
            >
              <Text style={[styles.filterPillText, statusFilter === s && styles.filterPillTextActive]}>
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Farmers List */}
        {filtered.length === 0 ? (
          <Text style={styles.emptyText}>No farmers match your search or filter.</Text>
        ) : (
          filtered.map((farmer, index) => (
            <TouchableOpacity
              key={farmer._id}
              style={styles.farmerCard}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('FarmerDetail', { farmer })}
            >
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

                {/* Phone number on the right instead of Active badge */}
                <TouchableOpacity
                  style={styles.phoneChip}
                  onPress={() => onCall(farmer.mobileNumber)}
                >
                  <Phone size={12} color={colors.success} strokeWidth={2.5} />
                  <Text style={styles.phoneChipText}>{farmer.mobileNumber || '—'}</Text>
                </TouchableOpacity>
              </View>

              {/* Tags */}
              <View style={styles.tagsRow}>
                <View style={styles.tag}>
                  <Text style={styles.tagIcon}>
                    {farmer.animalType === 'Buffalo' ? '🐃' : farmer.animalType === 'Cow' ? '🐄' : '🐄/🐃'}
                  </Text>
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
                  <Phone size={16} color={colors.success} strokeWidth={2} />
                  <Text style={styles.callButtonText}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => navigation.navigate('EditFarmer', { farmer })}
                >
                  <SquarePen size={16} color={colors.text} strokeWidth={2} />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(farmer)}>
                  <Trash2 size={16} color={colors.danger} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

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
  container: { flex: 1, backgroundColor: colors.bg },
  scrollView: { flex: 1 },
  content: { padding: spacing.lg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatarButton: { marginRight: spacing.sm },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center'
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: colors.surface },
  brandText: { fontSize: 16, fontWeight: '700', color: colors.text },
  logoutIcon: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: colors.surface,
    justifyContent: 'center', alignItems: 'center',
    ...shadows.small
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 4, marginBottom: spacing.md },

  // Side-by-side top action buttons
  topActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  loginMgmtBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryXLight,
    borderRadius: radius.lg,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.teal100,
  },
  loginMgmtBtnText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 12,
    ...shadows.small
  },
  addButtonText: { color: colors.surface, fontSize: 13, fontWeight: '700' },

  filterPills: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md },
  filterPill: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.lg, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border
  },
  filterPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterPillText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  filterPillTextActive: { color: colors.surface },

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
  farmerHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  farmerAvatar: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    marginRight: spacing.sm
  },
  farmerAvatarText: { fontSize: 16, fontWeight: '700', color: colors.surface },
  farmerHeaderInfo: { flex: 1 },
  farmerName: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 2 },
  farmerCode: { fontSize: 12, color: colors.primary, fontWeight: '600' },

  // Phone chip replacing Active badge
  phoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.success,
  },
  phoneChipText: { fontSize: 12, fontWeight: '600', color: colors.success },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.xs, marginBottom: spacing.sm },
  tag: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.lightGray,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8, marginRight: 6, marginBottom: 6
  },
  tagIcon: { fontSize: 12, marginRight: 4 },
  tagText: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },

  actionButtons: { flexDirection: 'row', gap: 10, marginTop: spacing.xs },
  callButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.successLight, borderRadius: radius.sm,
    paddingVertical: 10, borderWidth: 1, borderColor: colors.success
  },
  callButtonText: { fontSize: 13, fontWeight: '600', color: colors.success },
  editButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.lightGray, borderRadius: radius.sm,
    paddingVertical: 10, borderWidth: 1, borderColor: colors.border
  },
  editButtonText: { fontSize: 13, fontWeight: '600', color: colors.text },
  deleteButton: {
    flex: 1, backgroundColor: colors.dangerLight, borderRadius: radius.sm,
    paddingVertical: 10, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.danger
  },

  emptyText: { marginTop: 24, color: colors.textMuted, textAlign: 'center' },
});

export default FarmerListScreen;