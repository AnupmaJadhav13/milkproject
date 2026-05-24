import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { Bell, ChevronLeft } from 'lucide-react-native';
import { markNotificationRead } from '../../redux/slices/notificationSlice';
import { colors, radius, spacing, typography, shadows } from '../../theme';

const FarmerNotificationDetailScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const notification = route?.params?.notification || {};

  useEffect(() => {
    if (token && notification._id && !notification.isRead) {
      dispatch(markNotificationRead({ token, notificationId: notification._id }));
    }
  }, [dispatch, token, notification._id, notification.isRead]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color={colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Notification Details</Text>
          <Text style={styles.headerSub}>
            {notification.createdAt ? new Date(notification.createdAt).toLocaleString('en-IN') : ''}
          </Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.iconBox}>
            <Bell size={24} color={colors.primary} strokeWidth={2.5} />
          </View>
          <Text style={styles.title}>{notification.title || '-'}</Text>
          <Text style={styles.type}>{String(notification.type || 'GENERAL').replace(/_/g, ' ')}</Text>
          <Text style={styles.message}>{notification.message || '-'}</Text>
        </View>
      </ScrollView>
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
  headerTitle: { fontSize: typography.h3, fontWeight: '800', color: colors.text },
  headerSub: { fontSize: typography.xs, color: colors.textMuted, fontWeight: '500', marginTop: 2 },
  content: { padding: spacing.lg },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.divider, ...shadows.xs
  },
  iconBox: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: colors.primaryXLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md
  },
  title: { fontSize: typography.h2, fontWeight: '800', color: colors.text },
  type: { fontSize: typography.xs, color: colors.primary, fontWeight: '800', marginTop: 6 },
  message: { fontSize: typography.body, color: colors.text, lineHeight: 24, marginTop: spacing.lg }
});

export default FarmerNotificationDetailScreen;
