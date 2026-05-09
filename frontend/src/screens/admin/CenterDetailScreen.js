import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography, shadows } from '../../theme';

const CenterDetailScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const centerId = route?.params?.centerId;
  const centerCode = route?.params?.centerCode || '';
  const centerName = route?.params?.centerName || 'Collection Center';
  const centerAddress = route?.params?.centerAddress || '';

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.centerCard}>
        <Text style={styles.title}>{centerName}</Text>
        {centerCode ? <Text style={styles.code}>Code: {centerCode}</Text> : null}
        {centerAddress ? <Text style={styles.address}>{centerAddress}</Text> : null}
      </View>

      <Text style={styles.actionHeading}>Center Actions</Text>
      <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('FoodReports', { centerId, centerName })}>
        <Text style={styles.actionText}>Food Records</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={() => navigation.navigate('FarmerList', { centerId, centerCode, centerName })}>
        <Text style={styles.actionText}>Add Farmers</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionButton, styles.collectionButton]} onPress={() => navigation.navigate('CollectionRecords', { centerId, centerName })}>
        <Text style={styles.actionText}>Collection Records</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionButton, styles.allPaysButton]} onPress={() => navigation.navigate('AllPays', { centerId, centerName })}>
        <Text style={styles.actionText}>💰 All Pays</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
    justifyContent: 'center',
    gap: 12
  },
  centerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 18,
    ...shadows.card
  },
  title: {
    fontSize: typography.h2,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center'
  },
  address: {
    marginTop: 10,
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center'
  },
  code: {
    marginTop: 6,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '700'
  },
  actionHeading: {
    marginTop: 14,
    marginBottom: 2,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center'
  },
  actionText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700'
  },
  secondaryButton: {
    marginTop: 12,
    backgroundColor: '#0f766e'
  },
  collectionButton: {
    marginTop: 12,
    backgroundColor: colors.accent
  },
  allPaysButton: {
    marginTop: 12,
    backgroundColor: '#0369a1'
  }
});

export default CenterDetailScreen;
