import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import DateTimePicker from '@react-native-community/datetimepicker';
import { fetchFoodRecords } from '../../redux/slices/foodSlice';
import { LoadingIndicator, EmptyState } from '../../components';
import { ChevronLeft, Calendar, Search, X, Salad } from 'lucide-react-native';
import { colors, radius, spacing, shadows } from '../../theme';

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;

const FoodReportsScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const foodRecords = useSelector((state) => state.food.records);
  const status = useSelector((state) => state.food.status);

  const selectedCenterId = route?.params?.centerId || '';
  const selectedCenterName = route?.params?.centerName || '';

  const [date, setDate]               = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (token) loadData();
  }, [dispatch, token]);

  const loadData = () => {
    const params = {};
    if (selectedCenterId) params.center = selectedCenterId;
    dispatch(fetchFoodRecords({ token, params }));
  };

  const filteredRecords = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    return foodRecords.filter((record) => {
      const farmerName = record.farmerId?.fullName?.toLowerCase() || '';
      const centerName = record.collectionCenterId?.name?.toLowerCase() || '';
      const searchOk   = !search || farmerName.includes(search) || centerName.includes(search);

      let dateOk = true;
      if (date) {
        const selected = new Date(date); selected.setHours(0,0,0,0);
        const rec = new Date(record.date); rec.setHours(0,0,0,0);
        dateOk = rec.getTime() === selected.getTime();
      }

      return searchOk && dateOk;
    });
  }, [foodRecords, searchQuery, date]);

  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => navigation.navigate('FoodDetail', { foodRecord: item })}
      >
        {/* Top row */}
        <View style={styles.cardTop}>
          <View style={styles.cardIconWrap}>
            <Salad size={18} color="#3aafa9" strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardName} numberOfLines={1}>
              {item.farmerId?.fullName || '—'}
            </Text>
            <Text style={styles.cardCenter} numberOfLines={1}>
              {item.collectionCenterId?.name || '—'}
            </Text>
          </View>
        </View>

        {/* Details row */}
        <View style={styles.cardBottom}>
          <Text style={styles.cardDate}>
            📅 {item.date ? new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
          </Text>
          <Text style={styles.cardAmount}>₹{Number(item.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (status === 'loading') return <LoadingIndicator />;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ── Teal Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.brand}>Sarvasvaa Milk</Text>
          <Text style={styles.title}>Food Records</Text>
        </View>
      </View>

      {/* ── Center banner ── */}
      {selectedCenterName ? (
        <View style={styles.centerBanner}>
          <Text style={styles.centerBannerText}>📍 {selectedCenterName}</Text>
        </View>
      ) : null}

      {/* ── Search ── */}
      <View style={styles.searchBar}>
        <Search size={15} color={colors.primary} strokeWidth={2} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search farmer or center..."
          placeholderTextColor={colors.textDisabled}
          autoCorrect={false}
          autoCapitalize="none"
          underlineColorAndroid="transparent"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={14} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Single Date picker ── */}
      <View style={styles.dateRow}>
        <TouchableOpacity style={styles.datePill} onPress={() => setShowDatePicker(true)}>
          <Calendar size={13} color="#3aafa9" strokeWidth={2} />
          <Text style={styles.datePillText}>{date ? fmtDate(date) : 'Select Date'}</Text>
        </TouchableOpacity>
        {date && (
          <TouchableOpacity onPress={() => setDate(null)} style={styles.clearDatesBtn}>
            <X size={14} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={date ? new Date(date) : new Date()}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={(_, d) => { setShowDatePicker(false); if (d) setDate(d.toISOString()); }}
        />
      )}

      {/* ── Count ── */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>Records ({filteredRecords.length})</Text>
      </View>

      {/* ── List ── */}
      <FlatList
        data={filteredRecords}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🌾</Text>
            <Text style={styles.emptyTitle}>No food records found</Text>
            <Text style={styles.emptySub}>Try adjusting your filters or date range</Text>
          </View>
        }
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        onRefresh={loadData}
        refreshing={status === 'loading'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#3aafa9',
    paddingHorizontal: spacing.lg, paddingVertical: 14, gap: 10,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  brand: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  title: { fontSize: 18, fontWeight: '800', color: '#fff' },

  centerBanner: {
    backgroundColor: '#e6f7f6', paddingHorizontal: spacing.lg, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#b2e8e5',
  },
  centerBannerText: { fontSize: 13, fontWeight: '600', color: '#3aafa9' },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: spacing.md, marginTop: 12,
    backgroundColor: '#fff', borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    borderWidth: 1, borderColor: '#e5e7eb', ...shadows.xs,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },

  // Date row
  dateRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: spacing.md, marginTop: 10,
  },
  datePill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 9,
    borderWidth: 1, borderColor: '#b2e8e5',
  },
  datePillText: { fontSize: 13, fontWeight: '600', color: '#3aafa9', flex: 1 },
  clearDatesBtn: { padding: 6 },

  // Count
  countRow: { paddingHorizontal: spacing.md, paddingVertical: 10 },
  countText: { fontSize: 14, fontWeight: '800', color: colors.text },

  // Card
  card: {
    backgroundColor: '#fff', borderRadius: 14,
    padding: spacing.md, marginBottom: 10,
    ...shadows.card,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  cardIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#e6f7f6',
    justifyContent: 'center', alignItems: 'center',
  },
  cardName: { fontSize: 15, fontWeight: '700', color: colors.text },
  cardCenter: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  cardBottom: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 8,
  },
  cardDate: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  cardAmount: { fontSize: 16, fontWeight: '800', color: '#3aafa9' },

  // Empty
  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptySub: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
});

export default FoodReportsScreen;