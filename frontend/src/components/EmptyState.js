import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const EmptyState = ({ title, subtitle }) => (
  <View style={styles.container}>
    <Text style={styles.title}>{title}</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 64,
    paddingHorizontal: 24
  },
  title: {
    fontSize: 20,
    color: '#0f172a',
    fontWeight: '700',
    textAlign: 'center'
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#475569',
    textAlign: 'center'
  }
});

export default EmptyState;
