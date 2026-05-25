import { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { Store, Users, LayoutGrid, Gift, MessageCircleMore, FileText, Milk } from 'lucide-react-native';
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
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    if (token) {
      dispatch(fetchCenters(token));
      dispatch(fetchFarmers({ token, params: {} }));
    }
  }, [dispatch, token]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  }, [loadData]);

  const onSignOut = () => { dispatch(logout()); };

  if (centerStatus === 'loading' || farmerStatus === 'loading') {
    return <LoadingIndicator />;
  }

  const activeFarmers = farmers.filter(f => f.status === 'Active').length;

  // Order: Collection, Notifications, Annual Bonus, Reports, Farmer Login, Rate Chart
  const quickActions = [
    {
      label: 'Manage centers',
      icon: Milk,
      nav: 'CenterList',
      iconBg: colors.teal50,
      iconColor: colors.primary,
    },
    {
      label: 'Notifications',
      icon: MessageCircleMore,
      nav: 'SendNotification',
      iconBg: colors.infoLight,
      iconColor: colors.info,
    },
    {
      label: 'Annual Bonus',
      icon: Gift,
      nav: 'AnnualBonus',
      iconBg: colors.warningLight,
      iconColor: colors.warning,
    },
    {
      label: 'Reports',
      icon: FileText,
      nav: 'Reports',
      iconBg: colors.successLight,
      iconColor: colors.success,
    },
    {
      label: 'Farmer Login',
      icon: Users,
      nav: 'FarmerLoginManagement',
      iconBg: colors.primaryXLight,
      iconColor: colors.primary,
    },
    {
      label: 'Rate Chart',
      icon: LayoutGrid,
      nav: 'RateChart',
      iconBg: colors.primaryXLight,
      iconColor: colors.primary,
    },
  ];

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
          {/* Left: Avatar + Welcome */}
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

      
          <View style={styles.headerRight}>
            <Image
              source={require('../../../assets/sarvaalogo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
           
          </View>
        </View>

        {/* Stat Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.statSage }]}>
          
            <Text style={styles.statValue}>{activeFarmers}</Text>
            <Text style={styles.statLabel}>Active Farmers</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.statWarm }]}>
           
            <Text style={styles.statValue}>{centers.length}</Text>
            <Text style={styles.statLabel}>Total Centers</Text>
          </View>
        </View>

        {/* Quick Actions — 3-column circular style */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>

        <View style={styles.actionsGrid}>
          {quickActions.map((action, i) => {
            const IconComponent = action.icon;
            return (
              <TouchableOpacity
                key={i}
                style={styles.actionItem}
                onPress={() => navigation.navigate(action.nav)}
                activeOpacity={0.7}
              >
                <View style={[styles.actionCircle, { backgroundColor: action.iconBg }]}>
                  <IconComponent size={26} color={action.iconColor} strokeWidth={2} />
                </View>
                <Text style={styles.actionLabel} numberOfLines={2}>{action.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Collection Centers — full list */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Collection Centers</Text>
        </View>

        {centers.map((center) => (
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollView: { flex: 1 },
  content: { padding: spacing.lg },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerRight: { alignItems: 'flex-end', gap: 6 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.sm, borderWidth: 2, borderColor: colors.teal100,
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: colors.white },
  headerTitles: { justifyContent: 'center' },
  headerWelcome: { fontSize: typography.xs, color: colors.textMuted, fontWeight: '500' },
  headerName: { fontSize: typography.body, fontWeight: '700', color: colors.text, letterSpacing: -0.2, marginBottom: 3 },
  logo: { width: 132, height: 56 },
  logoutBtn: {
    paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: radius.sm,
    backgroundColor: colors.dangerLight, borderWidth: 1, borderColor: colors.danger,
  },
  logoutBtnText: { fontSize: typography.xs, fontWeight: '700', color: colors.danger },

  // Brand badge (now inside header titles)
  brandBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryXLight, paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.teal100,
  },
  brandBadgeText: { fontSize: typography.xs, fontWeight: '700', color: colors.primary },

  // Stat Cards — centered
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.xs,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  statIconBox: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.h1,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: typography.xs,
    color: colors.text,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 16,
    textAlign: 'center',
  },

  // Section header
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { fontSize: typography.h3, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },

  // Quick Actions — 3-column circular grid (MobileDairy style)
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.xl,
  },
  actionItem: {
    width: '33.33%',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  actionCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.divider,
    ...shadows.xs,
  },
  actionLabel: {
    fontSize: typography.xs,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 16,
    letterSpacing: -0.1,
  },

  // Collection Centers
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

  // Empty state
  emptyBox: { alignItems: 'center', padding: spacing.xl },
  emptyText: { fontSize: typography.body, fontWeight: '600', color: colors.textSecondary },
  emptySubtext: { fontSize: typography.small, color: colors.textMuted, marginTop: 4 },
});

export default AdminDashboardScreen;
