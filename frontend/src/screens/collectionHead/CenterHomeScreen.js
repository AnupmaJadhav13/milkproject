import { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { Store, Users, Salad, LogOut, Droplets, ClipboardList, CreditCard } from 'lucide-react-native';
import { fetchFarmersByCenter } from '../../redux/slices/farmerSlice';
import { logout } from '../../redux/slices/authSlice';
import LoadingIndicator from '../../components/LoadingIndicator';
import { colors, radius, spacing, typography, shadows } from '../../theme';

const menuItems = [
  { label: 'Daily Milk\nEntry',  icon: Droplets,     nav: 'MilkEntry',             iconColor: '#1D9E75', iconBg: '#E1F5EE' },
  { label: 'Add Food',           icon: Salad,         nav: 'FoodEntry',             iconColor: '#B87D1A', iconBg: '#FEF3DC' },
  { label: 'Food History',       icon: ClipboardList, nav: 'FoodHistory',           iconColor: '#185FA5', iconBg: '#E6F1FB' },
  { label: 'Farmers',            icon: Users,         nav: 'CollectionHeadFarmers', iconColor: '#1D9E75', iconBg: '#E1F5EE' },
  { label: 'Payments',           icon: CreditCard,    nav: 'AllPays',               iconColor: '#185FA5', iconBg: '#E6F1FB' },
];

const CollectionHeadHomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const farmers = useSelector((state) => state.farmers.list);
  const status = useSelector((state) => state.farmers.status);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    if (user?.assignedCenter && token) {
      dispatch(fetchFarmersByCenter({ centerId: user.assignedCenter, token }));
    }
  }, [dispatch, token, user]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleLogout = () => { dispatch(logout()); };

  if (status === 'loading') return <LoadingIndicator />;

  const activeFarmers = farmers.filter(f => f.status === 'Active').length;
  const inactiveFarmers = farmers.length - activeFarmers;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'C'}</Text>
            </View>
            <View>
              <Text style={styles.headerWelcome}>Welcome back 👋</Text>
              <Text style={styles.headerName}>{user?.name || user?.fullName || 'Collection Head'}</Text>
            </View>
          </View>
         <TouchableOpacity onPress={handleLogout} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
  <LogOut size={22} color={colors.danger} strokeWidth={2} />
</TouchableOpacity>
        </View>

        {/* ── Brand + Role — centered ── */}
        <View style={styles.brandCenter}>
          <Image
            source={require('../../assets/images/sarvaalogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Collection Head</Text>
          </View>
        </View>

        {/* ── Farmer Stats Card ── */}
        <View style={styles.statsCard}>
          <View style={styles.statsCardHeader}>
            <View style={styles.statsIconBox}>
              <Store size={20} color={colors.primary} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statsCardLabel}>My Collection Center</Text>
              <Text style={styles.statsCardTitle}>Farmer Overview</Text>
            </View>
            <View style={styles.activePill}>
              <View style={styles.activeDot} />
              <Text style={styles.activePillText}>Active</Text>
            </View>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{farmers.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.success }]}>{activeFarmers}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.danger }]}>{inactiveFarmers}</Text>
              <Text style={styles.statLabel}>Inactive</Text>
            </View>
          </View>
        </View>

        {/* ── Quick Menu — 3-col circular grid ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>

        <View style={styles.menuGrid}>
          {menuItems.map((item, i) => {
            const IconComponent = item.icon;
            return (
              <TouchableOpacity
                key={i}
                style={styles.menuItem}
                onPress={() => navigation.navigate(
                  item.nav,
                  item.nav === 'AllPays'
                    ? { centerId: user?.assignedCenter, centerName: user?.name || 'My Center' }
                    : undefined
                )}
                activeOpacity={0.7}
              >
                <View style={[styles.menuCircle, { backgroundColor: item.iconBg }]}>
                  <IconComponent size={28} color={item.iconColor} strokeWidth={2} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EBF4FB' },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: spacing.lg },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.sm, borderWidth: 2, borderColor: colors.teal100,
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: colors.white },
  headerWelcome: { fontSize: typography.xs, color: colors.textMuted, fontWeight: '500' },
  headerName: { fontSize: typography.body, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.sm,
    backgroundColor: colors.dangerLight, borderWidth: 1, borderColor: colors.danger,
  },

  // Brand Center
  brandCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xl,
    backgroundColor: '#EBF4FB',
    borderRadius: radius.lg,
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  logo: { width: 140, height: 56 },
  roleBadge: {
    backgroundColor: colors.primaryXLight, paddingHorizontal: spacing.md, paddingVertical: 4,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.teal100,
  },
  roleBadgeText: { fontSize: typography.xs, fontWeight: '700', color: colors.primary },

  // Stats Card
  statsCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg,
    marginBottom: spacing.xl, ...shadows.card, borderWidth: 1, borderColor: colors.divider,
  },
  statsCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  statsIconBox: {
    width: 44, height: 44, borderRadius: 13, backgroundColor: colors.primaryXLight,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm,
  },
  statsCardLabel: { fontSize: typography.xs, color: colors.textMuted, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  statsCardTitle: { fontSize: typography.h3, fontWeight: '800', color: colors.text },
  activePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.successLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success },
  activePillText: { fontSize: 10, fontWeight: '700', color: colors.success },
  statsDivider: { height: 1, backgroundColor: colors.divider, marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: typography.h2, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: typography.xs, color: colors.textMuted, fontWeight: '500', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: colors.divider },

  // Section header
  sectionHeader: { marginBottom: spacing.sm },
  sectionTitle: { fontSize: typography.h3, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },

  // 3-col circular menu grid
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingVertical: spacing.md,
    ...shadows.xs,
  },
  menuItem: {
    width: '33.33%',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  menuCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  menuLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 17,
    letterSpacing: -0.1,
  },
});

export default CollectionHeadHomeScreen;