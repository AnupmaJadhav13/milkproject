// ─── Sarvasvaa Milk · Design System ────────────────────────────────────────
// Soft Teal / Warm Neutral — Enterprise SaaS palette

export const colors = {
  bg:             '#F4F7FB',
  bgDeep:         '#EAF1FA',
  surface:        '#FFFFFF',
  surfaceMuted:   '#F8FAFC',
  surfaceHover:   '#EFF6FF',

  primary:        '#2563EB',
  primaryDark:    '#1D4ED8',
  primaryLight:   '#3B82F6',
  primaryXLight:  '#DBEAFE',

  accent:         '#0EA5E9',
  accentLight:    '#E0F2FE',

  teal50:         '#F0F9F7',
  teal100:        '#CCEAE4',
  teal200:        '#99D4C9',
  teal600:        '#2C7A6E',
  teal700:        '#1F5C53',

  success:        '#22896B',
  successLight:   '#E6F5EF',
  successDark:    '#166347',

  danger:         '#C0392B',
  dangerLight:    '#FDECEB',

  warning:        '#C87A1B',
  warningLight:   '#FEF4E6',

  info:           '#2563EB',
  infoLight:      '#EFF6FF',

  text:           '#1A2B28',
  textSecondary:  '#3D5450',
  textMuted:      '#7A9690',
  textDisabled:   '#AFC4C0',

  border:         '#D9E8E5',
  borderStrong:   '#B3CEC9',
  divider:        '#ECF2F1',

  navBg:          '#FFFFFF',
  navActive:      '#2563EB',
  navInactive:    '#7A9690',

  overlay:        'rgba(26, 43, 40, 0.55)',
  white:          '#FFFFFF',
  black:          '#000000',

  statTeal:       '#DBEAFE',
  statSage:       '#E0F2FE',
  statWarm:       '#FEF4E6',
  statCool:       '#EFF6FF',

  // legacy aliases
  bg_compat:      '#F4F7FB',
  lightBlue:      '#DBEAFE',
  lightPurple:    '#E0F2FE',
  lightGreen:     '#E6F5EF',
  lightGray:      '#F4F7FB',
  darkGray:       '#3D5450',
  purple:         '#0EA5E9',
  orange:         '#C87A1B',
  iconBlue:       '#2563EB',
  iconPurple:     '#0EA5E9',
  iconOrange:     '#C87A1B',
  iconGreen:      '#22896B',
};

export const spacing = {
  xxs: 4,
  xs:  8,
  sm:  12,
  md:  16,
  lg:  20,
  xl:  24,
  xxl: 32,
  xxxl: 40,
};

export const radius = {
  xs:  6,
  sm:  10,
  md:  14,
  lg:  18,
  xl:  22,
  xxl: 28,
  full: 999,
};

export const typography = {
  display: 32,
  h1:      26,
  h2:      20,
  h3:      17,
  body:    15,
  small:   13,
  xs:      11,
  caption: 13,

  regular:   '400',
  medium:    '500',
  semibold:  '600',
  bold:      '700',
  extrabold: '800',
};

export const shadows = {
  none: {},
  xs: {
    shadowColor: '#1A2B28',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sm: {
    shadowColor: '#1A2B28',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  card: {
    shadowColor: '#1A2B28',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  medium: {
    shadowColor: '#1A2B28',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09,
    shadowRadius: 18,
    elevation: 5,
  },
  modal: {
    shadowColor: '#1A2B28',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 10,
  },
  small: {
    shadowColor: '#1A2B28',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
};

export const commonStyles = {
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.h3,
    fontWeight: typography.bold,
    color: colors.text,
    letterSpacing: -0.2,
  },
  viewAll: {
    fontSize: typography.small,
    fontWeight: typography.semibold,
    color: colors.primary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.card,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  btnPrimaryText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: typography.bold,
    letterSpacing: 0.3,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.navBg,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    ...shadows.medium,
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    minWidth: 64,
  },
  navLabel: {
    fontSize: typography.xs,
    color: colors.navInactive,
    fontWeight: typography.medium,
  },
  navLabelActive: {
    color: colors.primary,
    fontWeight: typography.bold,
  },
};
