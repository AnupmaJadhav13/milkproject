import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { colors, spacing, typography } from '../theme';

const LoadingIndicator = ({ message = 'Loading...' }) => (
  <View style={styles.container}>
    <View style={styles.card}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xxl,
    alignItems: 'center',
    shadowColor: '#1A2B28',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09,
    shadowRadius: 18,
    elevation: 5,
  },
  text: {
    marginTop: spacing.md,
    fontSize: typography.small,
    color: colors.textMuted,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});

export default LoadingIndicator;
