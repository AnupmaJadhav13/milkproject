import { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { House, Store, Users, Salad, LogOut } from 'lucide-react-native';
import { fetchFarmersByCenter } from '../../redux/slices/farmerSlice';
import { logout } from '../../redux/slices/authSlice';
import LoadingIndicator from '../../components/LoadingIndicator';
import { colors, radius, spacing, typography, shadows } from '../../theme';

const CollectionHeadHomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const farmers = useSelector((state) => state.farmers.list);
  const status = useSelector((state) => state.farmers.status);

  useEffect(() => {
    if (user?.assignedCenter && token) {
      dispatch(fetchFarmersByCenter({ centerId: user.assignedCenter, token }));
    }
  }, [dispatch, token, user]);

  const handleLogout = () => { dispatch(logout()); };

  if (status === 'loading') return <LoadingIndicator />;

  const activeFarmers = farmers.filter(f => f.status === 'Active').length;

  const actions = [
    { label: 'Add Food Record', icon: Salad, nav: 'FoodEntry', bg: colors.primary, text: colors.white },
    { label: 'Daily Milk Collection', icon: Store, nav: 'MilkEntry', bg: colors.teal50, text: colors.primary, border: true },
    { label: 'Food History', icon: Salad, nav: 'FoodHistory', bg: colors.warningLight, text: colors.warning, border2: true },
    { label: 'View Farmers', icon: Users, nav: 'CollectionHeadFarmers', bg: colors.successLight, text: colors.success, border3: true },
  ];

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
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'C'}</Text>
            </View>
            <View>
              <Text style={styles.headerWelcome}>Welcome back</Text>
              <Text style={styles.headerName}>{user?.name || user?.fullName || 'Collection Head'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>Sign out</Text>
          </TouchableOpacity>
        </View>

        {/* Page Title */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>Collection Head</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Head</Text>
          </View>
        </View>

        {/* Center Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryIconBox}>
              <Store size={22} color={colors.primary} strokeWidth={2.5} />
            </View>
            <View>
              <Text style={styles.summaryLabel}>Assigned Center</Text>
              <Text style={styles.summaryTitle}>My Center</Text>
            </View>
            <View style={styles.activeDot} />
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>{activeFarmers}</Text>
              <Text style={styles.summaryStatLabel}>Active</Text>
            </View>
            <View style={styles.summaryStatDivider} />
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>{farmers.length}</Text>
              <Text style={styles.summaryStatLabel}>Total</Text>
            </View>
            <View style={styles.summaryStatDivider} />
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>{farmers.length - activeFarmers}</Text>
              <Text style={styles.summaryStatLabel}>Inactive</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {actions.map((action, i) => {
            const IconComponent = action.icon;
            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.actionTile,
                  { backgroundColor: action.bg },
                  action.border && { borderWidth: 1.5, borderColor: colors.teal100 },
                  action.border2 && { borderWidth: 1.5, borderColor: colors.warning + '44' },
                  action.border3 && { borderWidth: 1.5, borderColor: colors.success + '44' },
                ]}
                onPress={() => navigation.navigate(action.nav)}
              >
                <IconComponent size={24} color={action.text} strokeWidth={2.5} />
                <Text style={[styles.actionLabel, { color: action.text }]}>{action.label}</Text>
                <Text style={[styles.actionArrow, { color: action.text + '88' }]}>→</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Nav */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <View style={[styles.navIconContainer, styles.navIconActive]}>
            <House size={22} color={colors.surface} strokeWidth={2} />
          </View>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MilkEntry')}>
          <View style={styles.navIconContainer}>
            <Store size={22} color={colors.textMuted} strokeWidth={2} />
          </View>
          <Text style={styles.navLabel}>Milk Entry</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('FoodEntry')}>
          <View style={styles.navIconContainer}>
            <Salad size={22} color={colors.textMuted} strokeWidth={2} />
          </View>
          <Text style={styles.navLabel}>Food Entry</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CollectionHeadFarmers')}>
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
  container: { flex: 1, backgroundColor: colors.bg },
  scrollView: { flex: 1 },
  content: { padding: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.sm, borderWidth: 2, borderColor: colors.teal100,
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: colors.white },
  headerWelcome: { fontSize: typography.xs, color: colors.textMuted, fontWeight: '500' },
  headerName: { fontSize: typography.body, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  logoutBtn: {
    paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.sm,
    backgroundColor: colors.dangerLight, borderWidth: 1, borderColor: colors.danger,
  },
  logoutBtnText: { fontSize: typography.xs, fontWeight: '700', color: colors.danger },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  title: { fontSize: typography.h1, fontWeight: '800', color: colors.text, letterSpacing: -0.5, marginRight: spacing.sm },
  roleBadge: {
    backgroundColor: colors.primaryXLight, paddingHorizontal: spacing.sm, paddingVertical: 3,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.teal100,
  },
  roleBadgeText: { fontSize: typography.xs, fontWeight: '700', color: colors.primary },
  summaryCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg,
    marginBottom: spacing.xl, ...shadows.card, borderWidth: 1, borderColor: colors.divider,
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center' },
  summaryIconBox: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: colors.primaryXLight,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm,
  },
  summaryLabel: { fontSize: typography.xs, color: colors.textMuted, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryTitle: { fontSize: typography.h3, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  activeDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success,
    marginLeft: 'auto',
  },
  summaryDivider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.md },
  summaryStats: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryStat: { alignItems: 'center', flex: 1 },
  summaryStatValue: { fontSize: typography.h2, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  summaryStatLabel: { fontSize: typography.xs, color: colors.textMuted, fontWeight: '500', marginTop: 2 },
  summaryStatDivider: { width: 1, backgroundColor: colors.divider },
  sectionTitle: { fontSize: typography.h3, fontWeight: '700', color: colors.text, marginBottom: spacing.sm, letterSpacing: -0.2 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actionTile: {
    width: '47.5%', borderRadius: radius.lg, padding: spacing.md,
    justifyContent: 'space-between', minHeight: 90, ...shadows.xs,
  },
  actionLabel: { fontSize: typography.small, fontWeight: '700', flex: 1, letterSpacing: -0.2 },
  actionArrow: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  bottomNav: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface, flexDirection: 'row',
    justifyContent: 'space-around', paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.divider, ...shadows.medium,
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

export default CollectionHeadHomeScreen;
