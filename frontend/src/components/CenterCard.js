import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography, shadows } from '../theme';

const CenterCard = ({ center, onEdit, onDelete }) => (
  <View style={styles.card}>
    <View style={styles.header}>
      <View style={styles.iconBox}>
        <Text style={styles.iconBoxText}>◈</Text>
      </View>
      <View style={styles.titleBlock}>
        <Text style={styles.name} numberOfLines={1}>{center.name}</Text>
        <Text style={styles.code}>{center.centerCode}</Text>
      </View>
      <View style={center.status === 'Active' ? styles.badgeActive : styles.badgeInactive}>
        <Text style={center.status === 'Active' ? styles.badgeActiveText : styles.badgeInactiveText}>
          {center.status}
        </Text>
      </View>
    </View>

    <View style={styles.divider} />

    <Text style={styles.address}>{center.fullAddress}</Text>

    <View style={styles.chips}>
      {[center.village, center.district, center.state].filter(Boolean).map((tag, i) => (
        <View key={i} style={styles.chip}>
          <Text style={styles.chipText}>{tag}</Text>
        </View>
      ))}
    </View>

    <View style={styles.actions}>
      <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
        <Text style={styles.editBtnText}>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
        <Text style={styles.deleteBtnText}>Delete</Text>
      </TouchableOpacity>
    </View>
  </View>
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
    alignItems: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryXLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  iconBoxText: {
    fontSize: 18,
    color: colors.primary,
  },
  titleBlock: {
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
    color: colors.textMuted,
    fontWeight: '500',
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
  address: {
    fontSize: typography.small,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surfaceMuted,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  editBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryXLight,
    borderWidth: 1,
    borderColor: colors.teal100,
  },
  editBtnText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: typography.small,
  },
  deleteBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: radius.sm,
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  deleteBtnText: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: typography.small,
  },
});

export default CenterCard;
