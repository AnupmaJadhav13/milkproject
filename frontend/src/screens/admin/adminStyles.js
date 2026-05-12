import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography, shadows } from '../../theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  toggleContainer: {
    flexDirection: 'row',
    margin: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.xs,
  },
  toggleButton: {
    flex: 1,
    padding: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  activeToggle: {
    backgroundColor: colors.primary,
    ...shadows.xs,
  },
  toggleText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.textMuted,
  },
  activeToggleText: {
    color: colors.white,
  },
  filtersContainer: {
    maxHeight: 100,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  filterItem: {
    width: 150,
    marginRight: spacing.sm,
  },
  filterLabel: {
    fontSize: typography.small,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  picker: {
    height: 44,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  dateText: {
    fontSize: typography.small,
    color: colors.text,
    fontWeight: '500',
  },
  listContainer: {
    padding: spacing.md,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  selectedCenterBanner: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.primaryXLight,
    borderColor: colors.teal100,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  selectedCenterLabel: {
    color: colors.primary,
    fontSize: typography.xs,
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedCenterValue: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: '700',
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
    ...shadows.xs,
  },
  summaryLabel: {
    fontSize: typography.xs,
    color: colors.textMuted,
    marginBottom: 6,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: typography.h3,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
  },
  recordCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.divider,
    ...shadows.card,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  farmerName: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  centerName: {
    fontSize: typography.small,
    color: colors.textMuted,
    fontWeight: '500',
  },
  recordDetails: {
    marginBottom: spacing.sm,
  },
  recordActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  editButton: {
    backgroundColor: colors.primaryXLight,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.teal100,
  },
  editButtonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: typography.small,
  },
  deleteButton: {
    backgroundColor: colors.dangerLight,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  deleteButtonText: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: typography.small,
  },
  reportCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.divider,
    ...shadows.card,
  },
});

export default styles;
