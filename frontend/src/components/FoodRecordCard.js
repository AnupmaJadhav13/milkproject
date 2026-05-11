import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography, shadows } from '../theme';

const FoodRecordCard = ({ record }) => {
  const isPaid = record.paymentStatus === 'Paid';
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.nameRow}>
          <View style={styles.dot} />
          <Text style={styles.farmerName} numberOfLines={1}>
            {record.farmerId?.fullName || 'Unknown'}
          </Text>
        </View>
        <View style={[styles.payBadge, isPaid ? styles.payBadgePaid : styles.payBadgePending]}>
          <Text style={[styles.payBadgeText, isPaid ? styles.payBadgePaidText : styles.payBadgePendingText]}>
            {record.paymentStatus}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.grid}>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>Animal</Text>
          <Text style={styles.cellValue}>{record.animalType || '—'}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>Food</Text>
          <Text style={styles.cellValue}>{record.foodType || '—'}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>Qty</Text>
          <Text style={styles.cellValue}>{record.quantity} {record.unit}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.rateText}>@ ₹{record.rate}</Text>
          <Text style={styles.totalText}>₹{record.totalAmount}</Text>
        </View>
        <Text style={styles.date}>{new Date(record.date).toLocaleDateString('en-IN')}</Text>
      </View>

      {record.notes ? (
        <View style={styles.notesBox}>
          <Text style={styles.notesText}>{record.notes}</Text>
        </View>
      ) : null}
    </View>
  );
};

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
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: spacing.xs,
  },
  farmerName: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  payBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  payBadgePaid: {
    backgroundColor: colors.successLight,
  },
  payBadgePaidText: {
    color: colors.success,
  },
  payBadgePending: {
    backgroundColor: colors.warningLight,
  },
  payBadgePendingText: {
    color: colors.warning,
  },
  payBadgeText: {
    fontSize: typography.xs,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  cell: {},
  cellLabel: {
    fontSize: typography.xs,
    color: colors.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cellValue: {
    fontSize: typography.small,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  rateText: {
    fontSize: typography.small,
    color: colors.textMuted,
  },
  totalText: {
    fontSize: typography.h3,
    fontWeight: '800',
    color: colors.primary,
  },
  date: {
    fontSize: typography.xs,
    color: colors.textDisabled,
  },
  notesBox: {
    marginTop: spacing.xs,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    padding: spacing.xs,
  },
  notesText: {
    fontSize: typography.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});

export default FoodRecordCard;
