import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

const SearchBar = ({ value, onChangeText, onChange, placeholder = 'Search' }) => (
  <View style={styles.container}>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText || onChange}
      placeholder={placeholder}
      placeholderTextColor="#94a3b8"
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border
  },
  input: {
    height: 48,
    color: colors.text,
    fontSize: typography.body
  }
});

export default SearchBar;
