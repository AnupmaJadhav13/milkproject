import { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { House, Store, Users, CreditCard, Plus, MapPin, Trash2, SquarePen, LogOut } from 'lucide-react-native';
import { fetchCenters, deleteCenter } from '../../redux/slices/centerSlice';
import LoadingIndicator from '../../components/LoadingIndicator';
import SearchBar from '../../components/SearchBar';
import ConfirmDialog from '../../components/ConfirmDialog';
import { colors, radius, spacing, shadows } from '../../theme';

const CenterListScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { list, status, error } = useSelector((state) => state.centers);
  const { user } = useSelector((state) => state.auth);
  const token = useSelector((state) => state.auth.token);
  const [search, setSearch] = useState('');
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    if (token) dispatch(fetchCenters(token));
  }, [dispatch, token]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  }, [loadData]);

  const filteredCenters = list.filter((center) => {
    const centerName = center?.name?.toLowerCase() || '';
    const centerCode = center?.centerCode?.toLowerCase() || '';
    const query = search.toLowerCase();
    return centerName.includes(query) || centerCode.includes(query);
  });

  const onDelete = (center) => {
    setSelectedCenter(center);
    setConfirmVisible(true);
  };

  const confirmDelete = () => {
    dispatch(deleteCenter({ id: selectedCenter._id, token }));
    setConfirmVisible(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return colors.success;
      case 'Inactive': return colors.textMuted;
      case 'Maintenance': return colors.warning;
      default: return colors.textMuted;
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'Active': return colors.successLight;
      case 'Inactive': return colors.lightGray;
      case 'Maintenance': return colors.warningLight;
      default: return colors.lightGray;
    }
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
            <LogOut size={18} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <Text style={styles.title}>Collection Centers</Text>

        {/* Add Center Button */}
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddCenter')}>
          <Plus size={20} color={colors.surface} strokeWidth={2.5} />
          <Text style={styles.addButtonText}>Add Center</Text>
        </TouchableOpacity>

        {/* Search Bar */}
        <SearchBar 
          value={search} 
          onChange={setSearch} 
          placeholder="Search centers by name or code..." 
        />

        {/* Centers List */}
        {filteredCenters.length === 0 ? (
          <Text style={styles.emptyText}>No centers found. Use Add to create one.</Text>
        ) : (
          filteredCenters.map((center) => (
            <TouchableOpacity
              key={center._id}
              style={styles.centerCard}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('CenterDetail', { center })}
            >
              {/* Center Header */}
              <View style={styles.centerHeader}>
                <Text style={styles.centerName}>{center.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(center.status) }]}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(center.status) }]} />
                  <Text style={[styles.statusText, { color: getStatusColor(center.status) }]}>
                    {center.status}
                  </Text>
                </View>
              </View>

              {/* Center Code */}
              <Text style={styles.centerCode}>{center.centerCode}</Text>

              {/* Address */}
              <View style={styles.addressRow}>
                <MapPin size={14} color={colors.textMuted} strokeWidth={2} />
                <Text style={styles.addressText}>{center.fullAddress}</Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.editButton} 
                  onPress={() => navigation.navigate('EditCenter', { center })}
                >
                  <SquarePen size={16} color={colors.text} strokeWidth={2} />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.deleteButton} 
                  onPress={() => onDelete(center)}
                >
                  <Trash2 size={16} color={colors.danger} strokeWidth={2} />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <ConfirmDialog
        visible={confirmVisible}
        title="Delete Collection Center"
        message="Are you sure you want to delete this center?"
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
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.md
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 14,
    marginBottom: spacing.md,
    ...shadows.small
  },
  addButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700'
  },
  centerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card
  },
  centerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs
  },
  centerName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    flex: 1
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12
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
  centerCode: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.sm
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: spacing.sm
  },
  addressText: {
    fontSize: 13,
    color: colors.textMuted,
    flex: 1,
    lineHeight: 18
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm
  },
  tag: {
    backgroundColor: colors.lightGray,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 6
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
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.lightGray,
    borderRadius: radius.sm,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.dangerLight,
    borderRadius: radius.sm,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.danger
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.danger
  },
  emptyText: {
    marginTop: 24,
    color: colors.textMuted,
    fontSize: 16,
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
  navLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600'
  },
  navLabelActive: {
    color: colors.primary
  }
});

export default CenterListScreen;
