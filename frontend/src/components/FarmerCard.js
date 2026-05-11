import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography, shadows } from '../theme';

const FarmerCard = ({ farmer, onPress, actions }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.92}>
    <View style={styles.header}>
      <View style={styles.avatarRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{farmer.fullName?.charAt(0)?.toUpperCase() || 'F'}</Text>
        </View>
        <View style={styles.nameBlock}>
          <Text style={styles.name} numberOfLines={1}>{farmer.fullName}</Text>
          <Text style={styles.code}>{farmer.farmerCode || 'FARM-NA'}</Text>
        </View>
      </View>
      <View style={farmer.status === 'Active' ? styles.badgeActive : styles.badgeInactive}>
        <Text style={farmer.status === 'Active' ? styles.badgeActiveText : styles.badgeInactiveText}>
          {farmer.status}
        </Text>
      </View>
    </View>

    <View style={styles.divider} />

    <View style={styles.infoGrid}>
      <View style={styles.infoCell}>
        <Text style={styles.infoLabel}>Mobile</Text>
        <Text style={styles.infoValue}>{farmer.mobileNumber || '—'}</Text>
      </View>
      <View style={styles.infoCell}>
        <Text style={styles.infoLabel}>Animal</Text>
        <Text style={styles.infoValue}>{farmer.animalType || '—'}</Text>
      </View>
      <View style={styles.infoCell}>
        <Text style={styles.infoLabel}>Village</Text>
        <Text style={styles.infoValue}>{farmer.village || '—'}</Text>
      </View>
    </View>

    {farmer.assignedCenter?.name ? (
      <View style={styles.centerChip}>
        <View style={styles.centerDot} />
        <Text style={styles.centerChipText}>{farmer.assignedCenter.name}</Text>
      </View>
    ) : null}

    {actions ? <View style={styles.actions}>{actions}</View> : null}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryXLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.teal100,
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
  },
  nameBlock: {
    flex: 1,
  },
  name: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  code: {
    fontSize: typography.xs,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  badgeActive: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeActiveText: {
    color: colors.success,
    fontSize: typography.xs,
    fontWeight: '700',
  },
  badgeInactive: {
    backgroundColor: colors.dangerLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeInactiveText: {
    color: colors.danger,
    fontSize: typography.xs,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.sm,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoCell: {
    flex: 1,
  },
  infoLabel: {
    fontSize: typography.xs,
    color: colors.textMuted,
    fontWeight: '500',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: typography.small,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  centerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    backgroundColor: colors.primaryXLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  centerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 6,
  },
  centerChipText: {
    fontSize: typography.xs,
    color: colors.primary,
    fontWeight: '600',
  },
  actions: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: spacing.xs,
  },
});

export default FarmerCard;
