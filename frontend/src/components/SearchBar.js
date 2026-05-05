import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

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
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginVertical: 12
  },
  input: {
    height: 48,
    color: '#0f172a',
    fontSize: 16
  }
});

export default SearchBar;
