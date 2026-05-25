import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, RefreshControl, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { ArrowLeft, LogOut, MapPin, Droplet, Users, CreditCard, Salad } from 'lucide-react-native';
import { colors, radius, spacing, shadows } from '../../theme';

const CenterDetailScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const center = route?.params?.center || {};
  const centerId = center._id || route?.params?.centerId;
  const centerCode = center.centerCode || route?.params?.centerCode || '';
  const centerName = center.name || route?.params?.centerName || 'Collection Center';
  const centerAddress = center.fullAddress || route?.params?.centerAddress || '';
  const centerVillage = center.village || '';
  const centerStatus = center.status || 'Active';
  const hasCoolingUnit = center.hasCoolingUnit || false;
  const hasTestingLab = center.hasTestingLab || false;
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Center',
      'Are you sure you want to delete this center?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {} }
      ]
    );
  };

  const handleEditCenter = () => {
    if (center && center._id) {
      navigation.navigate('EditCenter', { center });
    } else {
      Alert.alert('Error', 'Unable to edit center. Please navigate from the Centers list.', [{ text: 'OK' }]);
    }
  };

  const quickActions = [
    {
      label: 'Collection\nRecords',
      icon: <Droplet size={28} color="#1e40af" strokeWidth={2} />,
      bg: '#dbeafe',
      onPress: () => navigation.navigate('CollectionRecords', { centerId, centerName }),
    },
    {
      label: 'Manage\nFarmers',
      icon: <Users size={28} color="#065f46" strokeWidth={2} />,
      bg: '#d1fae5',
      onPress: () => navigation.navigate('FarmerList', { centerId, centerCode, centerName }),
    },
    {
      label: 'Food\nRecords',
      icon: <Salad size={28} color="#166534" strokeWidth={2} />,
      bg: '#bbf7d0',
      onPress: () => navigation.navigate('FoodReports', { centerId, centerName }),
    },
    {
      label: 'All\nPayments',
      icon: <CreditCard size={28} color="#9a3412" strokeWidth={2} />,
      bg: '#fed7aa',
      onPress: () => navigation.navigate('AllPays', { centerId, centerName }),
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={20} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.brandText}>Sarvasvaa Milk</Text>
          {/* Logout as icon only */}
          <TouchableOpacity style={styles.logoutIconButton} onPress={handleLogout}>
            <LogOut size={20} color={colors.danger} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Center Info Card */}
        <View style={styles.centerCard}>
          <View style={styles.centerLogoContainer}>
            <Image
              source={require('../../assets/images/sarvaalogo.png')}
              style={styles.centerLogo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.centerName}>{centerName}</Text>
          <Text style={styles.centerCode}>{centerCode}</Text>

          <View style={styles.addressRow}>
            <MapPin size={14} color={colors.textMuted} strokeWidth={2} />
            <Text style={styles.centerAddress}>{centerVillage || centerAddress}</Text>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>3</Text>
              <Text style={styles.statLabel}>Active Farmers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>3</Text>
              <Text style={styles.statLabel}>Total Farmers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Inactive</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionItem}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: action.bg }]}>
                {action.icon}
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  brandText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  logoutIconButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  centerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    alignItems: 'center',
    ...shadows.card,
  },
  centerLogoContainer: {
    width: 140,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  centerLogo: {
    width: 120,
    height: 64,
  },
  centerName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  centerCode: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  centerAddress: {
    fontSize: 13,
    color: colors.textMuted,
    marginLeft: 6,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    ...shadows.card,
  },
  actionItem: {
    width: '22%',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 15,
  },
});

export default CenterDetailScreen;