import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { House, Droplets, Salad, Bell, FileText, LogOut, ChevronRight } from 'lucide-react-native';
import { logout } from '../../redux/slices/authSlice';
import { fetchFarmerMilk } from '../../redux/slices/farmerDashboardSlice';
import { fetchUnreadCount } from '../../redux/slices/notificationSlice';
import { colors, radius, spacing, typography, shadows } from '../../theme';

const FarmerDashboardScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { user, token } = useSelector((s) => s.auth);
  const { milk, milkStatus } = useSelector((s) => s.farmerDashboard);
  const { unreadCount } = useSelector((s) => s.notifications);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = () => {
    if (!token) return;
    const today = new Date().toISOString().split('T')[0];
    dispatch(fetchFarmerMilk({ token, params: { from: today, to: today } }));
    dispatch(fetchUnreadCount(token));
  };

  useEffect(() => { loadData(); }, [token]);

  const onRefresh = async () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  };

  const todaySummary = milk.summary || {};
  const todayEntries = milk.data || [];

  const quickActions = [
    { label: 'Milk Records', sublabel: 'Daily collections', icon: Droplets, nav: 'FarmerMilk', bg: colors.primaryXLight, text: colors.primary, border: colors.teal100 },
    { label: 'Food Records', sublabel: 'Feed purchases', icon: Salad, nav: 'FarmerFood', bg: colors.warningLight, text: colors.warning, border: colors.warning + '44' },
    { label: 'Reports', sublabel: 'Milk summary', icon: FileText, nav: 'FarmerReport', bg: colors.successLight, text: colors.success, border: colors.success + '44' },
    { label: 'Notifications', sublabel: 'Messages and alerts', icon: Bell, nav: 'FarmerNotifications', bg: colors.infoLight, text: colors.info, border: colors.info + '44', badge: unreadCount }
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'F'}</Text>
            </View>
            <View>
              <Text style={styles.headerWelcome}>Welcome</Text>
              <Text style={styles.headerName}>{user?.name || 'Farmer'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={() => dispatch(logout())}>
            <LogOut size={14} color={colors.danger} strokeWidth={2.5} />
            <Text style={styles.logoutBtnText}>Sign out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.brandRow}>
          <Text style={styles.brandName}>Sarvasvaa Milk</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Farmer</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Farmer Code</Text>
              <Text style={styles.infoValue}>{user?.farmerCode || '-'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Mobile</Text>
              <Text style={styles.infoValue}>{user?.phoneNumber || '-'}</Text>
            </View>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Center</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{user?.centerName || '-'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Animal Type</Text>
              <Text style={styles.infoValue}>{user?.animalType || '-'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Collection</Text>
          <TouchableOpacity onPress={() => navigation.navigate('FarmerMilk')}>
            <Text style={styles.viewAll}>View All -></Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.primaryXLight }]}>
            <Droplets size={18} color={colors.primary} strokeWidth={2.5} />
            <Text style={styles.statValue}>{todaySummary.totalMilkLiters || 0}</Text>
            <Text style={styles.statLabel}>Liters</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.successLight }]}>
            <Text style={styles.statEmoji}>Rs</Text>
            <Text style={styles.statValue}>{todaySummary.totalAmountInr || 0}</Text>
            <Text style={styles.statLabel}>Amount</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.warningLight }]}>
            <Text style={styles.statEmoji}>#</Text>
            <Text style={styles.statValue}>{todaySummary.totalEntries || 0}</Text>
            <Text style={styles.statLabel}>Records</Text>
          </View>
        </View>

        {todayEntries.length > 0 && todayEntries.slice(0, 2).map((entry) => (
          <View key={entry._id} style={styles.entryRow}>
            <View style={styles.entryIconBox}>
              <Droplets size={16} color={colors.primary} strokeWidth={2.5} />
            </View>
            <View style={styles.entryInfo}>
              <Text style={styles.entryTitle}>
                {entry.shift} · {entry.animalType}
              </Text>
              <Text style={styles.entrySubtitle}>
                {entry.quantityLiters}L · FAT {entry.fat} · SNF {entry.snf}
              </Text>
            </View>
            <Text style={styles.entryAmount}>₹{entry.amountInr?.toFixed(0)}</Text>
          </View>
        ))}

        {milkStatus !== 'loading' && todayEntries.length === 0 && (
          <View style={styles.emptyToday}>
            <Text style={styles.emptyTodayText}>No milk collection recorded today</Text>
          </View>
        )}

        <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Main Sections</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <TouchableOpacity
                key={action.label}
                style={[styles.actionTile, { backgroundColor: action.bg, borderColor: action.border }]}
                onPress={() => navigation.navigate(action.nav)}
                activeOpacity={0.8}
              >
                <View style={styles.actionTileTop}>
                  <Icon size={22} color={action.text} strokeWidth={2.5} />
                  {action.badge > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{action.badge > 99 ? '99+' : action.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.actionLabel, { color: action.text }]}>{action.label}</Text>
                <Text style={[styles.actionSublabel, { color: action.text + 'AA' }]}>{action.sublabel}</Text>
                <ChevronRight size={14} color={action.text + '88'} style={styles.actionArrow} />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
        {[
          { label: 'Home', icon: House, nav: null, active: true },
          { label: 'Milk', icon: Droplets, nav: 'FarmerMilk' },
          { label: 'Food', icon: Salad, nav: 'FarmerFood' },
          { label: 'Reports', icon: FileText, nav: 'FarmerReport' },
          { label: 'Alerts', icon: Bell, nav: 'FarmerNotifications', badge: unreadCount }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <TouchableOpacity key={item.label} style={styles.navItem} onPress={() => item.nav && navigation.navigate(item.nav)}>
              <View style={[styles.navIconBox, item.active && styles.navIconBoxActive]}>
                <Icon size={20} color={item.active ? colors.white : colors.textMuted} strokeWidth={2} />
                {item.badge > 0 && (
                  <View style={styles.navBadge}>
                    <Text style={styles.navBadgeText}>{item.badge > 9 ? '9+' : item.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.navLabel, item.active && styles.navLabelActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm, borderWidth: 2, borderColor: colors.teal100 },
  avatarText: { fontSize: 18, fontWeight: '700', color: colors.white },
  headerWelcome: { fontSize: typography.xs, color: colors.textMuted, fontWeight: '500' },
  headerName: { fontSize: typography.body, fontWeight: '700', color: colors.text },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.sm, backgroundColor: colors.dangerLight, borderWidth: 1, borderColor: colors.danger },
  logoutBtnText: { fontSize: typography.xs, fontWeight: '700', color: colors.danger },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  brandName: { fontSize: typography.h1, fontWeight: '800', color: colors.text, letterSpacing: -0.5, marginRight: spacing.sm },
  roleBadge: { backgroundColor: colors.primaryXLight, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full, borderWidth: 1, borderColor: colors.teal100 },
  roleBadgeText: { fontSize: typography.xs, fontWeight: '700', color: colors.primary },
  infoCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.lg, ...shadows.card, borderWidth: 1, borderColor: colors.divider },
  infoRow: { flexDirection: 'row' },
  infoItem: { flex: 1 },
  infoLabel: { fontSize: typography.xs, color: colors.textMuted, fontWeight: '500', marginBottom: 2 },
  infoValue: { fontSize: typography.small, fontWeight: '700', color: colors.text },
  infoDivider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { fontSize: typography.h3, fontWeight: '700', color: colors.text },
  viewAll: { fontSize: typography.small, color: colors.primary, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statCard: { flex: 1, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', ...shadows.xs, borderWidth: 1, borderColor: colors.divider },
  statValue: { fontSize: typography.h2, fontWeight: '800', color: colors.text, marginTop: 4 },
  statLabel: { fontSize: typography.xs, color: colors.textMuted, fontWeight: '500', marginTop: 2 },
  statEmoji: { fontSize: 14, fontWeight: '800', color: colors.success },
  entryRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.xs, ...shadows.xs, borderWidth: 1, borderColor: colors.divider },
  entryIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primaryXLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  entryInfo: { flex: 1 },
  entryTitle: { fontSize: typography.small, fontWeight: '700', color: colors.text },
  entrySubtitle: { fontSize: typography.xs, color: colors.textMuted, marginTop: 2 },
  entryAmount: { fontSize: typography.body, fontWeight: '800', color: colors.success },
  emptyToday: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', marginBottom: spacing.md, borderWidth: 1, borderColor: colors.divider },
  emptyTodayText: { color: colors.textMuted, fontSize: typography.small },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  actionTile: { width: '47.5%', borderRadius: radius.lg, padding: spacing.md, minHeight: 100, borderWidth: 1.5, ...shadows.xs },
  actionTileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  badge: { backgroundColor: colors.danger, borderRadius: radius.full, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  actionLabel: { fontSize: typography.small, fontWeight: '800', letterSpacing: -0.2 },
  actionSublabel: { fontSize: typography.xs, fontWeight: '500', marginTop: 2 },
  actionArrow: { marginTop: spacing.xs },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, flexDirection: 'row', justifyContent: 'space-around', paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.divider, ...shadows.medium },
  navItem: { alignItems: 'center', paddingVertical: spacing.xs },
  navIconBox: { width: 38, height: 38, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginBottom: 3 },
  navIconBoxActive: { backgroundColor: colors.primary },
  navBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: colors.danger, borderRadius: 8, minWidth: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  navBadgeText: { color: colors.white, fontSize: 9, fontWeight: '700' },
  navLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  navLabelActive: { color: colors.primary }
});

export default FarmerDashboardScreen;
