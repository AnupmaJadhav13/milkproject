import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { colors, radius, spacing, typography, shadows } from '../../theme';

const AdminProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => { dispatch(logout()); };

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: 40 }]}>
      {/* Back */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backBtnText}>← Dashboard</Text>
      </TouchableOpacity>

      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarRing}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'A'}</Text>
          </View>
        </View>
        <Text style={styles.userName}>{user?.name || 'Admin'}</Text>
        <View style={styles.roleBadge}>
          <View style={styles.roleDot} />
          <Text style={styles.roleBadgeText}>Administrator</Text>
        </View>
      </View>

      {/* Info Card */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Account Information</Text>
      </View>
      <View style={styles.infoCard}>
        {[
          { label: 'Full Name', value: user?.name },
          { label: 'Username', value: user?.username },
          { label: 'Phone Number', value: user?.phoneNumber },
        ].map((item, i, arr) => (
          <React.Fragment key={i}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value || 'N/A'}</Text>
            </View>
            {i < arr.length - 1 && <View style={styles.divider} />}
          </React.Fragment>
        ))}
      </View>

      {/* Actions */}
      <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditAdminProfile')}>
        <Text style={styles.editBtnText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  backBtn: { marginBottom: spacing.lg },
  backBtnText: { fontSize: typography.body, color: colors.primary, fontWeight: '600' },
  avatarSection: { alignItems: 'center', marginBottom: spacing.xxl },
  avatarRing: {
    width: 108, height: 108, borderRadius: 54,
    borderWidth: 3, borderColor: colors.teal100,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
    ...shadows.sm,
  },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 38, fontWeight: '800', color: colors.white },
  userName: { fontSize: typography.h1, fontWeight: '800', color: colors.text, letterSpacing: -0.5, marginBottom: spacing.xs },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.primaryXLight, paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.teal100,
  },
  roleDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success, marginRight: 6 },
  roleBadgeText: { fontSize: typography.small, fontWeight: '700', color: colors.primary },
  sectionHeader: { marginBottom: spacing.sm },
  sectionTitle: { fontSize: typography.h3, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  infoCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.divider, ...shadows.card,
  },
  infoRow: { paddingVertical: spacing.sm },
  infoLabel: { fontSize: typography.xs, color: colors.textMuted, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  infoValue: { fontSize: typography.body, fontWeight: '600', color: colors.text },
  divider: { height: 1, backgroundColor: colors.divider },
  editBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md, height: 52,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm, ...shadows.sm,
  },
  editBtnText: { color: colors.white, fontSize: typography.body, fontWeight: '700', letterSpacing: 0.3 },
  logoutBtn: {
    backgroundColor: colors.dangerLight, borderRadius: radius.md, height: 52,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.danger,
  },
  logoutBtnText: { color: colors.danger, fontSize: typography.body, fontWeight: '700' },
});

export default AdminProfileScreen;
