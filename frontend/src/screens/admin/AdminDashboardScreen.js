import { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { House, Store, Users, CreditCard, LayoutGrid, Gift, MessageCircleMore } from 'lucide-react-native';
import { fetchCenters } from '../../redux/slices/centerSlice';
import { fetchFarmers } from '../../redux/slices/farmerSlice';
import LoadingIndicator from '../../components/LoadingIndicator';
import { logout } from '../../redux/slices/authSlice';
import { colors, radius, spacing, typography, shadows } from '../../theme';

const AdminDashboardScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { list: centers, status: centerStatus } = useSelector((state) => state.centers);
  const { list: farmers, status: farmerStatus } = useSelector((state) => state.farmers);
  const { token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token) {
      dispatch(fetchCenters(token));
      dispatch(fetchFarmers({ token, params: {} }));
    }
  }, [dispatch, token]);

  const onSignOut = () => { dispatch(logout()); };

  if (centerStatus === 'loading' || farmerStatus === 'loading') {
    return <LoadingIndicator />;
  }

  const activeCenters = centers.filter(c => c.status === 'Active').length;
  const activeFarmers = farmers.filter(f => f.status === 'Active').length;

  const quickActions = [
    { label: 'Manage Centers', icon: Store, nav: 'CenterList', bg: colors.primary, text: colors.white },
    { label: 'Rate Chart', icon: LayoutGrid, nav: 'RateChart', bg: colors.teal50, text: colors.primary, border: true },
    { label: 'Annual Bonus', icon: Gift, nav: 'AnnualBonus', bg: colors.warningLight, text: colors.warning, textBorder: true },
    { label: 'Send SMS', icon: MessageCircleMore, nav: 'SendSms', bg: colors.infoLight, text: colors.info, textBorder: true },
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
            <TouchableOpacity onPress={() => navigation.navigate('AdminProfile')}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'A'}</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.headerTitles}>
              <Text style={styles.headerWelcome}>Welcome back</Text>
              <Text style={styles.headerName}>{user?.name || 'Admin'}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onSignOut} style={styles.logoutBtn}>
            <Text style={styles.logoutBtnText}>Sign out</Text>
          </TouchableOpacity>
        </View>

        {/* Brand Row */}
        <View style={styles.brandRow}>
          <Text style={styles.brandName}>Sarvasvaa Milk</Text>
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText}>Admin</Text>
          </View>
        </View>

        {/* Stat Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.primaryXLight }]}>
            <Store size={20} color={colors.primary} strokeWidth={2.5} />
            <Text style={styles.statValue}>{activeCenters}</Text>
            <Text style={styles.statLabel}>Active{'\n'}Centers</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.statSage }]}>
            <Users size={20} color={colors.primary} strokeWidth={2.5} />
            <Text style={styles.statValue}>{activeFarmers}</Text>
            <Text style={styles.statLabel}>Active{'\n'}Farmers</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.statWarm }]}>
            <Store size={20} color={colors.primary} strokeWidth={2.5} />
            <Text style={styles.statValue}>{centers.length}</Text>
            <Text style={styles.statLabel}>Total{'\n'}Centers</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>

        <View style={styles.actionsGrid}>
          {quickActions.map((action, i) => {
            const IconComponent = action.icon;
            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.actionTile,
                  { backgroundColor: action.bg },
                  action.border && { borderWidth: 1.5, borderColor: colors.teal100 },
                  action.textBorder && { borderWidth: 1.5, borderColor: action.text + '33' },
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

        {/* Center List Preview */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Collection Centers</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CenterList')}>
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>

        {centers.slice(0, 3).map((center) => (
          <TouchableOpacity
            style={styles.centerRow}
            key={center._id}
            onPress={() => navigation.navigate('CenterDetail', { center })}
          >
            <View style={styles.centerIconBox}>
              <Store size={16} color={colors.primary} strokeWidth={2.5} />
            </View>
            <View style={styles.centerInfo}>
              <Text style={styles.centerName}>{center.name}</Text>
              <Text style={styles.centerAddress} numberOfLines={1}>{center.fullAddress}</Text>
            </View>
            <View style={[styles.statusDot, center.status === 'Active' ? styles.statusDotActive : styles.statusDotInactive]} />
          </TouchableOpacity>
        ))}

        {centers.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No centers added yet</Text>
            <Text style={styles.emptySubtext}>Add a collection center to get started</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Nav */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <View style={[styles.navIconContainer, styles.navIconActive]}>
            <House size={22} color={colors.surface} strokeWidth={2.5} />
          </View>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CollectionRecords')}>
          <View style={styles.navIconContainer}>
            <Store size={22} color={colors.textMuted} strokeWidth={2.5} />
          </View>
          <Text style={styles.navLabel}>Collections</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('AllPays')}>
          <View style={styles.navIconContainer}>
            <CreditCard size={22} color={colors.textMuted} strokeWidth={2.5} />
          </View>
          <Text style={styles.navLabel}>Payments</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('FarmerList')}>
          <View style={styles.navIconContainer}>
            <Users size={22} color={colors.textMuted} strokeWidth={2.5} />
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
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.sm, borderWidth: 2, borderColor: colors.teal100,
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: colors.white },
  headerTitles: { justifyContent: 'center' },
  headerWelcome: { fontSize: typography.xs, color: colors.textMuted, fontWeight: '500' },
  headerName: { fontSize: typography.body, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  logoutBtn: {
    paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.sm,
    backgroundColor: colors.dangerLight, borderWidth: 1, borderColor: colors.danger,
  },
  logoutBtnText: { fontSize: typography.xs, fontWeight: '700', color: colors.danger },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  brandName: { fontSize: typography.h1, fontWeight: '800', color: colors.text, letterSpacing: -0.5, marginRight: spacing.sm },
  brandBadge: {
    backgroundColor: colors.primaryXLight, paddingHorizontal: spacing.sm, paddingVertical: 3,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.teal100,
  },
  brandBadgeText: { fontSize: typography.xs, fontWeight: '700', color: colors.primary },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: {
    flex: 1, borderRadius: radius.lg, padding: spacing.md,
    alignItems: 'flex-start', ...shadows.xs,
    borderWidth: 1, borderColor: colors.divider,
  },

  statValue: { fontSize: typography.h1, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  statLabel: { fontSize: typography.xs, color: colors.textMuted, fontWeight: '500', marginTop: 2, lineHeight: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { fontSize: typography.h3, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  viewAllText: { fontSize: typography.small, color: colors.primary, fontWeight: '600' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  actionTile: {
    width: '47.5%', borderRadius: radius.lg, padding: spacing.md,
    justifyContent: 'space-between', minHeight: 90, ...shadows.xs,
  },

  actionLabel: { fontSize: typography.small, fontWeight: '700', flex: 1, letterSpacing: -0.2 },
  actionArrow: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  centerRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md,
    marginBottom: spacing.xs, ...shadows.xs, borderWidth: 1, borderColor: colors.divider,
  },
  centerIconBox: {
    width: 38, height: 38, borderRadius: 11, backgroundColor: colors.primaryXLight,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm,
  },

  centerInfo: { flex: 1 },
  centerName: { fontSize: typography.body, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  centerAddress: { fontSize: typography.xs, color: colors.textMuted, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusDotActive: { backgroundColor: colors.success },
  statusDotInactive: { backgroundColor: colors.danger },
  emptyBox: { alignItems: 'center', padding: spacing.xl },
  emptyText: { fontSize: typography.body, fontWeight: '600', color: colors.textSecondary },
  emptySubtext: { fontSize: typography.small, color: colors.textMuted, marginTop: 4 },
  bottomNav: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface, flexDirection: 'row',
    justifyContent: 'space-around', paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm, borderTopWidth: 1, borderTopColor: colors.divider,
    ...shadows.medium,
  },
  navItem: { alignItems: 'center', paddingVertical: spacing.xs },
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
  },
});

export default AdminDashboardScreen;
