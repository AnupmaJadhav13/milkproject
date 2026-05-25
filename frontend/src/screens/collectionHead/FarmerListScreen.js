import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { Phone } from 'lucide-react-native';
import { fetchFarmersByCenter } from '../../redux/slices/farmerSlice';
import LoadingIndicator from '../../components/LoadingIndicator';
import SearchBar from '../../components/SearchBar';
import { colors, radius, spacing, shadows, typography } from '../../theme';

const AVATAR_PALETTES = [
  { bg: '#E1F5EE', text: '#0F6E56' },
  { bg: '#EEEDFE', text: '#534AB7' },
  { bg: '#FAEEDA', text: '#854F0B' },
  { bg: '#E6F1FB', text: '#185FA5' },
  { bg: '#FBEAF0', text: '#993556' },
  { bg: '#EAF3DE', text: '#3B6D11' },
];

const getInitials = (name = '') => {
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
};

const getPalette = (index) => AVATAR_PALETTES[index % AVATAR_PALETTES.length];

const animalLabel = (type) => {
  if (type === 'Buffalo') return { emoji: '🐃', label: 'Buffalo' };
  if (type === 'Cow') return { emoji: '🐄', label: 'Cow' };
  return { emoji: '🐄/🐃', label: 'Both' };
};

const CollectionHeadFarmerListScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const { list, status } = useSelector((state) => state.farmers);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    if (token && user?.assignedCenter) {
      dispatch(fetchFarmersByCenter({ centerId: user.assignedCenter, token }));
    }
  }, [dispatch, token, user]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  }, [loadData]);

  const filtered = [...list]
    .sort((a, b) => (a.farmerCode || '').localeCompare(b.farmerCode || '', undefined, { numeric: true }))
    .filter((farmer) =>
      [farmer.fullName, farmer.mobileNumber, farmer.farmerCode, farmer.village].some(
        (field) => field?.toLowerCase().includes(search.toLowerCase())
      )
    );

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
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'C'}</Text>
            </View>
            <Text style={styles.brandText}>{user?.name || 'Collection Head'}</Text>
          </View>
          <Image
            source={require('../../../assets/sarvaalogo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Assigned Farmers</Text>
      

        {/* Search */}
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name, code, or mobile..." />

        {/* Empty */}
        {filtered.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No farmers found</Text>
            <Text style={styles.emptySubtext}>Try a different search term</Text>
          </View>
        )}

        {/* Farmer Cards */}
        {filtered.map((farmer, index) => {
          const palette = getPalette(index);
          const initials = getInitials(farmer.fullName);
          const isActive = farmer.status === 'Active';
          const animal = animalLabel(farmer.animalType);

          return (
            <View key={farmer._id} style={styles.card}>

              {/* Top: avatar + name/code + status */}
              <View style={styles.cardTop}>
                <View style={[styles.farmerAvatar, { backgroundColor: palette.bg }]}>
                  <Text style={[styles.farmerAvatarText, { color: palette.text }]}>{initials}</Text>
                </View>
                <View style={styles.farmerInfo}>
                  <Text style={styles.farmerName} numberOfLines={1}>{farmer.fullName}</Text>
                  <Text style={styles.farmerCode}>{farmer.farmerCode}</Text>
                </View>
                <View style={[styles.statusBadge, isActive ? styles.statusActive : styles.statusInactive]}>
                  <View style={[styles.statusDot, { backgroundColor: isActive ? '#1D9E75' : '#888780' }]} />
                  <Text style={[styles.statusText, { color: isActive ? '#0F6E56' : '#5F5E5A' }]}>
                    {farmer.status}
                  </Text>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Bottom: phone + animal tag */}
              <View style={styles.cardBottom}>
                <View style={styles.phoneRow}>
                  <Phone size={13} color={colors.textMuted} strokeWidth={2} />
                  <Text style={styles.phoneText}>{farmer.mobileNumber}</Text>
                </View>
                <View style={styles.animalTag}>
                  <Text style={styles.animalEmoji}>{animal.emoji}</Text>
                  <Text style={styles.animalLabel}>{animal.label}</Text>
                </View>
              </View>

            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EBF4FB' },
  scrollView: { flex: 1 },
  content: { padding: spacing.lg },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: colors.white },
  brandText: { fontSize: 15, fontWeight: '700', color: colors.text },
  logoImage: {
    width: 110,
    height: 44,
  },

  // Title
  title: { fontSize: 24, fontWeight: '800', color: colors.text, marginTop: 12, marginBottom: 2, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.md },

  // Empty
  emptyBox: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyText: { fontSize: typography.body, fontWeight: '700', color: colors.textSecondary },
  emptySubtext: { fontSize: typography.small, color: colors.textMuted, marginTop: 4 },

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

  // Card top
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  farmerAvatar: {
    width: 46, height: 46, borderRadius: 23,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  farmerAvatarText: { fontSize: 16, fontWeight: '700' },
  farmerInfo: { flex: 1, minWidth: 0 },
  farmerName: { fontSize: 15, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  farmerCode: { fontSize: 12, color: colors.primary, fontWeight: '600', marginTop: 2 },

  // Status badge
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, flexShrink: 0,
  },
  statusActive: { backgroundColor: '#E1F5EE' },
  statusInactive: { backgroundColor: '#F1EFE8' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },

  // Divider
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: 10 },

  // Card bottom
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  phoneText: { fontSize: 13, color: colors.textMuted },

  // Animal tag
  animalTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#E6F1FB',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1, borderColor: '#B5D4F4',
  },
  animalEmoji: { fontSize: 13 },
  animalLabel: { fontSize: 12, fontWeight: '600', color: '#0C447C' },
});

export default CollectionHeadFarmerListScreen;