import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { ChevronLeft } from 'lucide-react-native';
import { colors, radius, spacing, shadows } from '../../theme';
import AdvanceScreen from '../admin/AdvanceScreen';
import PayableScreen from '../admin/PayableScreen';

const AllPaysScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const user = useSelector((s) => s.auth.user);
  const [activeTab, setActiveTab] = useState('advance');

  const centerName = route?.params?.centerName || user?.name || 'My Center';

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 12 }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ChevronLeft size={20} color={colors.text} strokeWidth={2.5} />
          </TouchableOpacity>

          {/* Logo in center */}
          <Image
            source={require('../../assets/images/sarvaalogo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />

          {/* Spacer to balance back button */}
          <View style={{ width: 36 }} />
        </View>

        <Text style={styles.title}>Payments</Text>
        <Text style={styles.subtitle}>{centerName}</Text>

        {/* ── Tabs ── */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'advance' && styles.tabActive]}
            onPress={() => setActiveTab('advance')}
          >
            <Text style={[styles.tabText, activeTab === 'advance' && styles.tabTextActive]}>
              Advance
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'payable' && styles.tabActive]}
            onPress={() => setActiveTab('payable')}
          >
            <Text style={[styles.tabText, activeTab === 'payable' && styles.tabTextActive]}>
              Payable
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Tab Content ── */}
      {activeTab === 'advance' ? (
        <AdvanceScreen centerName={centerName} />
      ) : (
        <PayableScreen centerName={centerName} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  headerContainer: {
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoImage: {
    width: 110,
    height: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
    ...shadows.small,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.surface,
    fontWeight: '700',
  },
});

export default AllPaysScreen;