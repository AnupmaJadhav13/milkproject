import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import AdvanceScreen from './AdvanceScreen';
import PayableScreen from './PayableScreen';

const TABS = [
  { key: 'advance', label: '💳 Advance' },
  { key: 'payable', label: '📋 Payable' }
];

const AllPaysScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('advance');
  const centerId = route?.params?.centerId;
  const centerName = route?.params?.centerName || 'Collection Center';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>All Pays</Text>
          <Text style={styles.subtitle}>{centerName}</Text>
        </View>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {activeTab === 'advance' ? (
          <AdvanceScreen centerId={centerId} centerName={centerName} navigation={navigation} />
        ) : (
          <PayableScreen centerId={centerId} centerName={centerName} navigation={navigation} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    ...shadows.card
  },
  backBtn: { marginRight: spacing.md },
  backText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
  title: { fontSize: typography.h3, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    borderRadius: radius.md,
    padding: 4,
    ...shadows.card
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radius.sm
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  tabTextActive: { color: '#fff' }
});

export default AllPaysScreen;
