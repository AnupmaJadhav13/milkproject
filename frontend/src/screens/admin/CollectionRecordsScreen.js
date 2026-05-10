import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, FlatList, StyleSheet, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchMilkEntries } from '../../redux/slices/milkSlice';
import { fetchCenters } from '../../redux/slices/centerSlice';
import LoadingIndicator from '../../components/LoadingIndicator';
import { colors, radius, spacing, shadows } from '../../theme';

const CollectionRecordsScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const { user } = useSelector((state) => state.auth);
  const entries = useSelector((state) => state.milk.entries);
  const summary = useSelector((state) => state.milk.summary);
  const status = useSelector((state) => state.milk.status);
  const centers = useSelector((state) => state.centers.list);
  const initialCenter = route?.params?.centerId || '';
  const [filters, setFilters] = useState({
    centerId: initialCenter,
    date: new Date().toISOString().split('T')[0],
    shift: '',
    animalType: '',
    farmerCode: ''
  });
  const [searchInput, setSearchInput] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  useEffect(() => {
    if (token) dispatch(fetchCenters(token));
  }, [dispatch, token]);

  // Debounce farmer code search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.farmerCode) {
        setFilters((prev) => ({ ...prev, farmerCode: searchInput }));
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!token) return;
    const params = {};
    if (filters.centerId) params.centerId = filters.centerId;
    if (filters.date) params.date = filters.date;
    if (filters.shift) params.shift = filters.shift;
    if (filters.animalType) params.animalType = filters.animalType;
    if (filters.farmerCode && filters.farmerCode.trim()) params.farmerCode = filters.farmerCode.trim();
    dispatch(fetchMilkEntries({ token, params }));
  }, [dispatch, token, filters.centerId, filters.date, filters.shift, filters.animalType, filters.farmerCode]);

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (index) => {
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];
    return colors[index % colors.length];
  };

  if (status === 'loading' && entries.length === 0) return <LoadingIndicator />;

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.avatarButton} 
              onPress={() => navigation.navigate('AdminProfile')}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'A'}</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.brandText}>Sarvasvaa Milk</Text>
          </View>
          <TouchableOpacity style={styles.logoutIcon}>
            <Text style={styles.logoutIconText}>⎋</Text>
          </TouchableOpacity>
        </View>

        {/* Title & Subtitle */}
        <Text style={styles.title}>Collection Records</Text>
        <Text style={styles.subtitle}>Manage and track daily milk intake.</Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="Search by farmer name or code..."
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Filter Section */}
        <View style={styles.filtersSection}>
          <Text style={styles.filtersSectionTitle}>Filters</Text>
          <TouchableOpacity 
            style={styles.clearFiltersButton}
            onPress={() => setFilters({ centerId: '', date: new Date().toISOString().split('T')[0], shift: '', animalType: '', farmerCode: '' })}
          >
            <Text style={styles.clearFiltersText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Cards */}
        <View style={styles.filterCards}>
          {/* Center Filter */}
          <View style={styles.filterCard}>
            <Text style={styles.filterLabel}>Collection Center</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={filters.centerId}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, centerId: value }))}
                style={styles.picker}
              >
                <Picker.Item label="All Centers" value="" />
                {centers.map((c) => (
                  <Picker.Item key={c._id} label={c.name} value={c._id} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Date Filter */}
          <View style={styles.filterCard}>
            <Text style={styles.filterLabel}>Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {filters.date ? new Date(filters.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Select Date'}
              </Text>
              <Text style={styles.dateButtonIcon}>📅</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={filters.date ? new Date(filters.date) : new Date()}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) {
                    setFilters((prev) => ({ ...prev, date: date.toISOString().split('T')[0] }));
                  }
                }}
              />
            )}
          </View>

          {/* Shift Filter */}
          <View style={styles.filterCard}>
            <Text style={styles.filterLabel}>Shift</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={filters.shift}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, shift: value }))}
                style={styles.picker}
              >
                <Picker.Item label="All Shifts" value="" />
                <Picker.Item label="Morning" value="Morning" />
                <Picker.Item label="Evening" value="Evening" />
              </Picker>
            </View>
          </View>

          {/* Animal Type Filter */}
          <View style={styles.filterCard}>
            <Text style={styles.filterLabel}>Animal Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={filters.animalType}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, animalType: value }))}
                style={styles.picker}
              >
                <Picker.Item label="All Types" value="" />
                <Picker.Item label="Cow" value="Cow" />
                <Picker.Item label="Buffalo" value="Buffalo" />
              </Picker>
            </View>
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryCards}>
          <View style={styles.summaryCardLarge}>
            <View style={styles.summaryIconContainer}>
              <Text style={styles.summaryIcon}>💧</Text>
            </View>
            <Text style={styles.summaryLabel}>Total Milk</Text>
            <Text style={styles.summaryValue}>{Number(summary?.totalMilkLiters || 0).toFixed(0)} L</Text>
          </View>

          <View style={styles.summaryCardSmall}>
            <Text style={styles.summarySmallLabel}>Cow / Buffalo</Text>
            <Text style={styles.summarySmallValue}>
              {Number(summary?.cowMilkLiters || 0).toFixed(0)}L / {Number(summary?.buffaloMilkLiters || 0).toFixed(0)}L
            </Text>
          </View>
        </View>

        {/* Recent Records Section */}
        <Text style={styles.sectionTitle}>Recent Records</Text>

        {entries.length === 0 ? (
          <Text style={styles.emptyText}>No collection records found.</Text>
        ) : (
          entries.map((item, index) => (
            <View key={item._id} style={styles.recordCard}>
              {/* Record Header */}
              <View style={styles.recordHeader}>
                <View style={styles.recordHeaderLeft}>
                  <View style={[styles.recordAvatar, { backgroundColor: getAvatarColor(index) }]}>
                    <Text style={styles.recordAvatarText}>
                      {getInitials(item.farmerId?.fullName || item.farmerCode)}
                    </Text>
                  </View>
                  <View style={styles.recordHeaderInfo}>
                    <Text style={styles.recordFarmerCode}>
                      {item.farmerCode} • {item.collectionCenterId?.name || 'Center'} • {item.shift}
                    </Text>
                    <Text style={styles.recordFarmerName}>{item.farmerId?.fullName || 'Unknown'}</Text>
                  </View>
                </View>
              </View>

              {/* Record Details */}
              <View style={styles.recordDetails}>
                <View style={styles.recordDetailItem}>
                  <Text style={styles.recordDetailLabel}>Quantity</Text>
                  <Text style={styles.recordDetailValue}>{Number(item.quantityLiters).toFixed(1)} L</Text>
                </View>
                <View style={styles.recordDetailItem}>
                  <Text style={styles.recordDetailLabel}>FAT / SNF</Text>
                  <Text style={styles.recordDetailValue}>{item.fat} / {item.snf}</Text>
                </View>
                <View style={styles.recordDetailItem}>
                  <Text style={styles.recordDetailLabel}>Amount</Text>
                  <Text style={[styles.recordDetailValue, { color: colors.success }]}>
                    ₹{Number(item.amountInr || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('AdminDashboard')}>
          <View style={styles.navIconContainer}>
            <Text style={styles.navIcon}>📊</Text>
          </View>
          <Text style={styles.navLabel}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <View style={[styles.navIconContainer, styles.navIconActive]}>
            <Text style={styles.navIcon}>📦</Text>
          </View>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Collections</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('AllPays')}>
          <View style={styles.navIconContainer}>
            <Text style={styles.navIcon}>💳</Text>
          </View>
          <Text style={styles.navLabel}>Payments</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('FarmerList')}>
          <View style={styles.navIconContainer}>
            <Text style={styles.navIcon}>👥</Text>
          </View>
          <Text style={styles.navLabel}>Farmers</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg
  },
  scrollView: {
    flex: 1
  },
  content: {
    padding: spacing.lg
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatarButton: {
    marginRight: spacing.sm
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.surface
  },
  brandText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text
  },
  logoutIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small
  },
  logoutIconText: {
    fontSize: 18,
    color: colors.text
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.sm
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: spacing.md
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.xs
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: colors.text
  },
  filtersSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  filtersSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text
  },
  clearFiltersButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  clearFiltersText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600'
  },
  filterCards: {
    marginBottom: spacing.md
  },
  filterCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.small
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.darkGray,
    marginBottom: spacing.xs
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    overflow: 'hidden'
  },
  picker: {
    height: 44,
    color: colors.text
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.surface
  },
  dateButtonText: {
    fontSize: 15,
    color: colors.text
  },
  dateButtonIcon: {
    fontSize: 16
  },
  summaryCards: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg
  },
  summaryCardLarge: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.card
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs
  },
  summaryIcon: {
    fontSize: 20
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4
  },
  summaryCardSmall: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    justifyContent: 'center',
    ...shadows.card
  },
  summarySmallLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 6
  },
  summarySmallValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.md
  },
  recordCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.card
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  recordHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  recordAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm
  },
  recordAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.surface
  },
  recordHeaderInfo: {
    flex: 1
  },
  recordFarmerCode: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 2
  },
  recordFarmerName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text
  },
  recordDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  recordDetailItem: {
    flex: 1,
    alignItems: 'center'
  },
  recordDetailLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 4
  },
  recordDetailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 40,
    fontSize: 15
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.medium
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: spacing.xs
  },
  navIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4
  },
  navIconActive: {
    backgroundColor: colors.primary
  },
  navIcon: {
    fontSize: 20
  },
  navLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600'
  },
  navLabelActive: {
    color: colors.primary
  }
});

export default CollectionRecordsScreen;
