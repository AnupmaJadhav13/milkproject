import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, RefreshControl, Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft, Search, SlidersHorizontal, X, Calendar
} from 'lucide-react-native';
import { fetchMilkEntries } from '../../redux/slices/milkSlice';
import { fetchCenters } from '../../redux/slices/centerSlice';
import { colors, radius, spacing, shadows } from '../../theme';

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmt    = (n, d = 2) => Number(n || 0).toFixed(d);
const fmtDate = (iso) => iso
  ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  : '—';

// ─── RecordCard ───────────────────────────────────────────────────────────────
const RecordCard = ({ item, index, onPress }) => {
  const qty    = Number(item.quantityLiters || 0);
  const rate   = Number(item.ratePerLiter   || 0);
  const amount = Number(item.amountInr      || 0);
  const isMorning = item.shift === 'Morning';
  const isCow     = item.animalType === 'Cow';

  return (
    <TouchableOpacity style={rc.row} activeOpacity={0.85} onPress={onPress}>
      <Text style={rc.serial}>{index + 1}</Text>
      <View style={rc.center}>
        <Text style={rc.name} numberOfLines={1}>{item.farmerId?.fullName || item.farmerCode || '—'}</Text>
        <View style={rc.metaRow}>
          <Text style={rc.shiftIcon}>{isMorning ? '🌅' : '🌙'}</Text>
          <Text style={rc.animalIcon}>{isCow ? '🐄' : '🐃'}</Text>
          <Text style={rc.meta}>FAT: {fmt(item.fat, 1)} | SNF: {fmt(item.snf, 1)}</Text>
        </View>
        <Text style={rc.formula}>{fmt(rate, 2)} × {fmt(qty, 2)}L</Text>
      </View>
      <View style={rc.right}>
        <Text style={rc.amount}>{fmt(amount, 2)}₹</Text>
      </View>
    </TouchableOpacity>
  );
};

const rc = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
    backgroundColor: colors.surface,
  },
  serial: { width: 28, fontSize: 13, fontWeight: '700', color: colors.textMuted, textAlign: 'center' },
  center: { flex: 1, paddingHorizontal: 6 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 1 },
  shiftIcon: { fontSize: 12 },
  animalIcon: { fontSize: 12 },
  meta: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  formula: { fontSize: 11, color: '#ec4899', fontWeight: '600' },
  right: { alignItems: 'flex-end', minWidth: 80 },
  amount: { fontSize: 16, fontWeight: '800', color: colors.primary },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
const CollectionRecordsScreen = ({ route, navigation }) => {
  const insets   = useSafeAreaInsets();
  const dispatch = useDispatch();
  const token    = useSelector((s) => s.auth.token);
  const entries    = useSelector((s) => s.milk.entries);
  const total      = useSelector((s) => s.milk.total);
  const totalPages = useSelector((s) => s.milk.totalPages);
  const milkStatus = useSelector((s) => s.milk.status);
  const centers    = useSelector((s) => s.centers.list);

  const initialCenter = route?.params?.centerId || '';
  const centerName    = route?.params?.centerName || '';

  const [search,         setSearch]         = useState('');
  const [centerId,       setCenterId]       = useState(initialCenter);
  const [date,           setDate]           = useState(new Date().toISOString().split('T')[0]);
  const [shifts,         setShifts]         = useState([]);
  const [animalTypes,    setAnimalTypes]    = useState([]);
  const [page,           setPage]           = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSearch,     setShowSearch]     = useState(false);
  const [refreshing,     setRefreshing]     = useState(false);

  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (token) dispatch(fetchCenters(token));
  }, [dispatch, token]);

  const load = useCallback((pg = 1) => {
    if (!token) return;
    const params = { page: pg, limit: 50 };
    if (centerId)              params.centerId   = centerId;
    if (date)                  params.date       = date;
    if (shifts.length === 1)   params.shift      = shifts[0];
    if (animalTypes.length === 1) params.animalType = animalTypes[0];
    if (debouncedSearch)       params.search     = debouncedSearch;
    dispatch(fetchMilkEntries({ token, params }));
    setPage(pg);
  }, [token, centerId, date, shifts, animalTypes, debouncedSearch, dispatch]);

  useEffect(() => { load(1); }, [load]);

  const isLoading = milkStatus === 'loading';

  // Shift options with emoji
  const shiftOptions = [
    { label: '☀️  Morning', value: 'Morning' },
    { label: '🌙  Evening', value: 'Evening' },
  ];

  // Animal options with emoji
  const animalOptions = [
    { label: '🐄  Cow',     value: 'Cow' },
    { label: '🐃  Buffalo', value: 'Buffalo' },
  ];

  const toggleShift = (val) =>
    setShifts(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);

  const toggleAnimal = (val) =>
    setAnimalTypes(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ── Teal Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Collections</Text>
          {centerName ? <Text style={styles.headerSub}>{centerName}</Text> : null}
        </View>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => setShowSearch(v => !v)}>
          <Search size={20} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* ── Search bar (toggle) ── */}
      {showSearch && (
        <View style={styles.searchBar}>
          <Search size={15} color={colors.primary} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search farmer name or code..."
            placeholderTextColor={colors.textDisabled}
            returnKeyType="search"
            autoFocus
            autoCorrect={false}
            autoCapitalize="none"
            underlineColorAndroid="transparent"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={15} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Filter Section (date + shift + animal) ── */}
      <View style={styles.filterSection}>

        {/* Date row */}
        <View style={styles.filterDateRow}>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
            <Calendar size={15} color={colors.textMuted} strokeWidth={2} />
            <Text style={styles.dateBtnText}>{date ? fmtDate(date) : 'Select Date'}</Text>
          </TouchableOpacity>
          {date && (
            <TouchableOpacity onPress={() => setDate('')} style={styles.clearDateBtn}>
              <X size={13} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={date ? new Date(date) : new Date()}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={(_, d) => {
              setShowDatePicker(false);
              if (d) setDate(d.toISOString().split('T')[0]);
            }}
          />
        )}

        {/* Shift chips row */}
        <View style={styles.chipsRow}>
          {shiftOptions.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.chip, shifts.includes(opt.value) && styles.chipActive]}
              onPress={() => toggleShift(opt.value)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, shifts.includes(opt.value) && styles.chipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Animal chips row */}
        <View style={styles.chipsRow}>
          {animalOptions.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.chip, animalTypes.includes(opt.value) && styles.chipActive]}
              onPress={() => toggleAnimal(opt.value)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, animalTypes.includes(opt.value) && styles.chipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* ── Records count ── */}
      <View style={styles.recordsHeader}>
        <Text style={styles.recordsTitle}>
          Accepted: {total > 0 ? total : 0}
        </Text>
        <TouchableOpacity onPress={() => setShowSearch(v => !v)}>
          <Search size={18} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* ── List ── */}
      {isLoading && entries.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} size="large" />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(i) => i._id}
          renderItem={({ item, index }) => (
            <RecordCard
              item={item}
              index={index}
              onPress={() => navigation.navigate('CollectionDetail', { collection: item })}
            />
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(1); setRefreshing(false); }}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>🥛</Text>
              <Text style={styles.emptyTitle}>No records found</Text>
              <Text style={styles.emptySub}>Try changing the date or clearing filters</Text>
            </View>
          }
          ListFooterComponent={
            page < totalPages ? (
              <TouchableOpacity style={styles.loadMoreBtn} onPress={() => load(page + 1)}>
                {isLoading
                  ? <ActivityIndicator color={colors.primary} size="small" />
                  : <Text style={styles.loadMoreText}>Load More</Text>
                }
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  // Teal header matching reference
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3aafa9',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    gap: 10,
  },
  backBtn: {
    width: 36, height: 36,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 1 },
  headerIconBtn: {
    width: 36, height: 36,
    justifyContent: 'center', alignItems: 'center',
  },

  // Search bar
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: spacing.md, marginTop: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    borderWidth: 1, borderColor: colors.border, ...shadows.xs,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },

  // Filter section
  filterSection: {
    backgroundColor: '#fff',
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },

  // Date row
  filterDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  dateBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  clearDateBtn: {
    padding: 4,
  },

  // Chips
  chipsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: '#3aafa9',
    borderColor: '#3aafa9',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },

  divider: {
    height: 1,
    backgroundColor: colors.divider || '#e5e7eb',
    marginTop: 4,
  },

  // Records header
  recordsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  recordsTitle: { fontSize: 15, fontWeight: '800', color: colors.text },

  emptyBox:  { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle:{ fontSize: 16, fontWeight: '700', color: colors.text },
  emptySub:  { fontSize: 13, color: colors.textMuted, marginTop: 4 },

  loadMoreBtn: {
    margin: spacing.md,
    backgroundColor: colors.primaryXLight,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.teal100,
  },
  loadMoreText: { fontSize: 14, fontWeight: '700', color: colors.primary },
});

export default CollectionRecordsScreen;