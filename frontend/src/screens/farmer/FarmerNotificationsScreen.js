import React, { useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { Bell, ChevronLeft, CheckCheck } from 'lucide-react-native';
import {
  fetchMyNotifications,
  markAllNotificationsRead
} from '../../redux/slices/notificationSlice';
import { colors, radius, spacing, typography, shadows } from '../../theme';

const TYPE_CONFIG = {
  FARMER_REGISTRATION: { label: 'Registration', color: colors.success, bg: colors.successLight },
  PAYMENT_DONE: { label: 'Payment', color: colors.success, bg: colors.successLight },
  ADVANCE_GIVEN: { label: 'Advance', color: colors.warning, bg: colors.warningLight },
  ANNUAL_BONUS: { label: 'Bonus', color: colors.warning, bg: colors.warningLight },
  FOOD_RECORD: { label: 'Food', color: colors.primary, bg: colors.primaryXLight },
  MILK_COLLECTION: { label: 'Milk', color: colors.primary, bg: colors.primaryXLight },
  CUSTOM_MESSAGE: { label: 'Message', color: colors.info, bg: colors.infoLight }
};

const fmtTime = (d) => {
  const date = new Date(d);
  const now = new Date();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  if (hrs < 24) return `${hrs} hr ago`;
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const FarmerNotificationsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const token = useSelector((s) => s.auth.token);
  const { list, unreadCount, status } = useSelector((s) => s.notifications);

  const load = useCallback(() => {
    if (token) dispatch(fetchMyNotifications({ token, params: { limit: 50 } }));
  }, [token, dispatch]);

  useEffect(() => { load(); }, [load]);

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsRead(token));
  };

  const renderItem = ({ item }) => {
    const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.CUSTOM_MESSAGE;
    return (
      <TouchableOpacity
        style={[styles.card, !item.isRead && styles.cardUnread]}
        onPress={() => navigation.navigate('FarmerNotificationDetail', { notification: item })}
        activeOpacity={0.85}
      >
        <View style={[styles.iconBox, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.typeLabel, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardTop}>
            <Text style={[styles.cardTitle, !item.isRead && styles.cardTitleUnread]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.cardTime}>{fmtTime(item.createdAt)}</Text>
          </View>
          <Text style={styles.cardMessage} numberOfLines={3}>{item.message}</Text>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color={colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSub}>Real-time updates</Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
            <CheckCheck size={14} color={colors.primary} strokeWidth={2.5} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Bell size={14} color={colors.info} strokeWidth={2.5} />
          <Text style={styles.unreadBannerText}>{unreadCount} unread notifications</Text>
        </View>
      )}

      {status === 'loading' && list.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} size="large" />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={load}
          refreshing={status === 'loading'}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Bell size={48} color={colors.textMuted} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptyText}>You do not have any notifications yet.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md, backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.divider, ...shadows.xs
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 11, backgroundColor: colors.primaryXLight,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: typography.h3, fontWeight: '800', color: colors.text },
  headerSub: { fontSize: typography.xs, color: colors.textMuted, fontWeight: '500' },
  markAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primaryXLight, paddingHorizontal: spacing.sm,
    paddingVertical: 6, borderRadius: radius.md, borderWidth: 1, borderColor: colors.teal100
  },
  markAllText: { fontSize: typography.xs, color: colors.primary, fontWeight: '700' },
  unreadBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.infoLight, paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.info + '33'
  },
  unreadBannerText: { fontSize: typography.xs, color: colors.info, fontWeight: '600' },
  list: { padding: spacing.lg, paddingBottom: 40 },
  card: {
    flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.sm, ...shadows.xs,
    borderWidth: 1, borderColor: colors.divider
  },
  cardUnread: {
    borderColor: colors.primary + '44', backgroundColor: colors.primaryXLight + '88'
  },
  iconBox: {
    width: 52, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm,
    paddingHorizontal: 4
  },
  typeLabel: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', textAlign: 'center' },
  cardContent: { flex: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  cardTitle: { fontSize: typography.small, fontWeight: '600', color: colors.textSecondary, flex: 1, marginRight: 8 },
  cardTitleUnread: { fontWeight: '800', color: colors.text },
  cardTime: { fontSize: 10, color: colors.textMuted, fontWeight: '500' },
  cardMessage: { fontSize: typography.xs, color: colors.textMuted, lineHeight: 18 },
  unreadDot: {
    position: 'absolute', top: 0, right: 0,
    width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary
  },
  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: typography.h3, fontWeight: '700', color: colors.textSecondary, marginTop: spacing.md },
  emptyText: { fontSize: typography.small, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' }
});

export default FarmerNotificationsScreen;
