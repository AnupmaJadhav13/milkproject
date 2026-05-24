import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { LogOut, Package, IndianRupee, Calendar } from 'lucide-react-native';
import { fetchFoodRecordsByCenter } from '../../redux/slices/foodSlice';
import { logout } from '../../redux/slices/authSlice';
import LoadingIndicator from '../../components/LoadingIndicator';
import SearchBar from '../../components/SearchBar';
import { colors, radius, spacing, shadows } from '../../theme';

const AVATAR_PALETTES = [
  { bg: '#E1F5EE', text: '#0F6E56' },
  { bg: '#EEEDFE', text: '#534AB7' },
  { bg: '#FAEEDA', text: '#854F0B' },
  { bg: '#E6F1FB', text: '#185FA5' },
  { bg: '#FBEAF0', text: '#993556' },
  { bg: '#EAF3DE', text: '#3B6D11' },
];

const getPalette = (index) => AVATAR_PALETTES[index % AVATAR_PALETTES.length];

const getInitials = (name = '') => {
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getPaymentStyle = (status) => {
  if (status === 'Paid') return { bg: '#E1F5EE', text: '#0F6E56', dot: '#1D9E75' };
  return { bg: '#FFF4E5', text: '#954D00', dot: '#F59E0B' };
};

const FoodRecordCard = ({ record, index }) => {
  const palette = getPalette(index);
  const name = record.farmerId?.fullName || 'Unknown Farmer';
  const initials = getInitials(name);
  const payment = getPaymentStyle(record.paymentStatus);
  const total = record.quantity && record.rate
    ? (parseFloat(record.quantity) * parseFloat(record.rate)).toFixed(2)
    : record.totalAmount?.toFixed(2) || '0.00';

  return (
    <View style={styles.card}>
      {/* Top Row: Avatar + Name + Payment Badge */}
      <View style={styles.cardTop}>
        <View style={[styles.farmerAvatar, { backgroundColor: palette.bg }]}>
          <Text style={[styles.farmerAvatarText, { color: palette.text }]}>{initials}</Text>
        </View>
        <View style={styles.farmerInfo}>
          <Text style={styles.farmerName} numberOfLines={1}>{name}</Text>
          {record.farmerId?.farmerCode && (
            <Text style={styles.farmerCode}>{record.farmerId.farmerCode}</Text>
          )}
        </View>
        <View style={[styles.paymentBadge, { backgroundColor: payment.bg }]}>
          <View style={[styles.paymentDot, { backgroundColor: payment.dot }]} />
          <Text style={[styles.paymentText, { color: payment.text }]}>{record.paymentStatus || 'Pending'}</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Bottom Row: Brand | Qty+Unit | Total | Date */}
      <View style={styles.cardBottom}>
        <View style={styles.metaItem}>
          <Package size={12} color={colors.textMuted} strokeWidth={2} />
          <Text style={styles.metaText} numberOfLines={1}>
            {record.brandName || 'No Brand'}
          </Text>
        </View>

        <View style={styles.metaItem}>
          <Text style={styles.metaText}>
            {record.quantity} {record.unit}
          </Text>
        </View>

        <View style={styles.totalChip}>
          <IndianRupee size={11} color="#0C447C" strokeWidth={2.5} />
          <Text style={styles.totalText}>{total}</Text>
        </View>

        <View style={styles.metaItem}>
          <Calendar size={12} color={colors.textMuted} strokeWidth={2} />
          <Text style={styles.metaText}>{formatDate(record.date)}</Text>
        </View>
      </View>
    </View>
  );
};

const FoodHistoryScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const records = useSelector((state) => state.food.records);
  const status = useSelector((state) => state.food.status);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    if (token && user?.assignedCenter) {
      dispatch(fetchFoodRecordsByCenter({ centerId: user.assignedCenter, token, params: {} }));
    }
  }, [dispatch, token, user]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  }, [loadData]);

  const filteredRecords = records.filter((record) =>
    record.farmerId?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.brandName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.farmerId?.farmerCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = () => {
    dispatch(logout());
  };

  if (status === 'loading') return <LoadingIndicator />;

  return (
    <View style={styles.container}>
      <View style={[styles.headerContainer, { paddingTop: insets.top + 12 }]}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'C'}</Text>
            </View>
            <Text style={styles.brandText}>{user?.name || 'Collection Head'}</Text>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <LogOut size={22} color={colors.danger} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Food History</Text>
        <Text style={styles.subtitle}>
          {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''} at your center
        </Text>

        <SearchBar
          placeholder="Search by farmer, code, or brand..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredRecords}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => <FoodRecordCard record={item} index={index} />}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No records found</Text>
            <Text style={styles.emptyText}>Try a different search term</Text>
          </View>
        }
        contentContainerStyle={[styles.listContainer, { paddingBottom: 40 }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,   // ← original
  },
  headerContainer: {
    backgroundColor: colors.bg,   // ← original
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.accent,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: colors.surface },
  brandText: { fontSize: 15, fontWeight: '700', color: colors.text },

  // Title
  title: {
    fontSize: 24, fontWeight: '800', color: colors.text,
    marginTop: 12, marginBottom: 2, letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13, color: colors.textMuted, marginBottom: spacing.md,
  },

  // List
  listContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: spacing.md,
    marginBottom: 10,
    ...shadows.xs,
  },

  // Card Top
  cardTop: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  farmerAvatar: {
    width: 46, height: 46, borderRadius: 23,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  farmerAvatarText: { fontSize: 16, fontWeight: '700' },
  farmerInfo: { flex: 1, minWidth: 0 },
  farmerName: {
    fontSize: 15, fontWeight: '700', color: colors.text, letterSpacing: -0.2,
  },
  farmerCode: {
    fontSize: 12, color: colors.primary, fontWeight: '600', marginTop: 2,
  },

  // Payment Badge
  paymentBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, flexShrink: 0,
  },
  paymentDot: { width: 6, height: 6, borderRadius: 3 },
  paymentText: { fontSize: 11, fontWeight: '600' },

  // Divider
  divider: {
    height: 1, backgroundColor: colors.divider, marginVertical: 10,
  },

  // Card Bottom
  cardBottom: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', flexWrap: 'wrap', gap: 6,
  },
  metaItem: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  metaText: {
    fontSize: 12, color: colors.textMuted, fontWeight: '500',
  },

  // Total Chip
  totalChip: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: '#E6F1FB',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1, borderColor: '#B5D4F4',
  },
  totalText: {
    fontSize: 12, fontWeight: '700', color: '#0C447C',
  },

  // Empty
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginTop: spacing.lg,
    alignItems: 'center',
    ...shadows.card,
  },
  emptyIcon: { fontSize: 48, marginBottom: spacing.sm },
  emptyTitle: {
    fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4,
  },
  emptyText: {
    textAlign: 'center', color: colors.textMuted, fontSize: 13,
  },
});

export default FoodHistoryScreen;