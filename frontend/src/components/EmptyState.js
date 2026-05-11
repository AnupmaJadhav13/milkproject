import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, radius, shadows } from '../theme';

const EmptyState = ({ title, subtitle, message }) => (
  <View style={styles.container}>
    <View style={styles.iconCircle}>
      <Text style={styles.iconText}>○</Text>
    </View>
    <Text style={styles.title}>{title || message || 'No data found'}</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 64,
    paddingHorizontal: spacing.xl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryXLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.teal100,
  },
  iconText: {
    fontSize: 28,
    color: colors.primary,
  },
  title: {
    fontSize: typography.h3,
    color: colors.textSecondary,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: typography.small,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default EmptyState;
