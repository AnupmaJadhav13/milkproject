import React from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

const SearchBar = ({ value, onChangeText, onChange, placeholder = 'Search' }) => (
  <View style={styles.wrapper}>
    <View style={styles.iconBox}>
      <Text style={styles.icon}>⌕</Text>
    </View>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText || onChange}
      placeholder={placeholder}
      placeholderTextColor={colors.textDisabled}
    />
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#1A2B28',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primaryXLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  icon: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    height: 48,
    color: colors.text,
    fontSize: typography.body,
  },
});

export default SearchBar;
