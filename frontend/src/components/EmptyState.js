import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';

const EmptyState = ({ title, subtitle, message }) => (
  <View style={styles.container}>
    <Text style={styles.title}>{title || message || 'No data found'}</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 64,
    paddingHorizontal: spacing.lg
  },
  title: {
    fontSize: typography.h3,
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center'
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: typography.caption,
    color: colors.textMuted,
    textAlign: 'center'
  }
});

export default EmptyState;
