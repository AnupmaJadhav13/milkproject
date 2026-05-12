import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, CreditCard, LogOut } from 'lucide-react-native';
import { colors, radius, spacing, shadows } from '../../theme';
import AdvanceScreen from './AdvanceScreen';
import PayableScreen from './PayableScreen';

const TABS = [
  { key: 'advance', label: 'Advance' },
  { key: 'payable', label: 'Payable' }
];

const AllPaysScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('advance');
  const centerId = route?.params?.centerId;
  const centerName = route?.params?.centerName || 'All Centers';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ChevronLeft size={20} color={colors.primary} strokeWidth={2.5} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.brandText}>Sarvasvaa Milk</Text>
            <Text style={styles.headerTitle}>All Pays</Text>
            <Text style={styles.headerSubtitle}>{centerName}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutIcon}>
          <LogOut size={18} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
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
  container: { 
    flex: 1, 
    backgroundColor: colors.bg 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    ...shadows.small
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.lightBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm
  },
  headerTitleContainer: {
    flex: 1
  },
  brandText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 2
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: colors.text 
  },
  headerSubtitle: { 
    fontSize: 13, 
    color: colors.textMuted, 
    marginTop: 2 
  },
  logoutIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center'
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    borderRadius: radius.md,
    padding: 4,
    ...shadows.small
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radius.sm
  },
  tabActive: { 
    backgroundColor: colors.primary 
  },
  tabText: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: colors.textMuted 
  },
  tabTextActive: { 
    color: '#fff' 
  }
});

export default AllPaysScreen;
