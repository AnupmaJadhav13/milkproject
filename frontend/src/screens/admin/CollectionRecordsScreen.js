import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, RefreshControl
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  House, Store, CreditCard, Users, Search,
  ChevronLeft, Calendar, SlidersHorizontal, X
} from 'lucide-react-native';
import { fetchMilkEntries } from '../../redux/slices/milkSlice';
import { fetchCenters } from '../../redux/slices/centerSlice';
import { colors, radius, spacing, typography, shadows } from '../../theme';

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmt   = (n, d = 2) => Number(n || 0).toFixed(d);
const fmtINR = (n)       => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const fmtDate = (iso)    => iso
  ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

const AVATAR_COLORS = ['#2C7A6E','#7c3aed','#ec4899','#f59e0b','#10b981','#06b6d4','#ef4444','#8b5cf6'];
const avatarColor = (i) => AVATAR_COLORS[i % AVATAR_COLORS.length];
const initials = (name) => {
  if (!name) return '?';
  const p = name.trim().split(' ');
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
};

// ─── StatBox ─────────────────────────────────────────────────────────────────
const StatBox = ({ label, value, sub, accent }) => (
  <View style={[st.statBox, accent && { borderLeftWidth: 3, borderLeftColor: accent }]}>
    <Text style={st.statLabel}>{label}</Text>
    <Text style={[st.statValue, accent && { color: accent }]}>{value}</Text>
    {sub ? <Text style={st.statSub}>{sub}</Text> : null}
  </View>
);
const st = StyleSheet.create({
  statBox:   { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: 12, ...shadows.xs, borderWidth: 1, borderColor: colors.divider },
  statLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.text },
  statSub:   { fontSize: 10, color: colors.textMuted, marginTop: 2 },
});

// ─── RecordCard ───────────────────────────────────────────────────────────────
const RecordCard = ({ item, index, onPress }) => {
  const qty    = Number(item.quantityLiters || 0);
  const rate   = Number(item.ratePerLiter   || 0);
  const amount = Number(item.amountInr      || 0);
  // Verify: amount should equal qty * rate (within rounding)
  const computed = Number((qty * rate).toFixed(2));
  const mismatch = Math.abs(computed - amount) > 0.05;

  const isMorning = item.shift === 'Morning';
  const isCow     = item.animalType === 'Cow';

  return (
    <TouchableOpacity style={rc.card} activeOpacity={0.9} onPress={onPress}>
      {/* Top row: avatar + name + date + shift badge */}
      <View style={rc.topRow}>
        <View style={[rc.avatar, { backgroundColor: avatarColor(index) }]}>
          <Text style={rc.avatarText}>{initials(item.farmerId?.fullName || item.farmerCode)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={rc.farmerName} numberOfLines={1}>
            {item.farmerId?.fullName || '—'}
          </Text>
          <Text style={rc.farmerMeta}>
            {item.farmerCode}
            {item.collectionCenterId?.name ? ` · ${item.collectionCenterId.name}` : ''}
          </Text>
        </View>
        <View style={rc.badgesCol}>
          <View style={[rc.shiftBadge, { backgroundColor: isMorning ? '#fef3c7' : '#eff6ff' }]}>
            <Text style={[rc.shiftText, { color: isMorning ? '#92400e' : '#1d4ed8' }]}>
              {isMorning ? '🌅 Morning' : '🌙 Evening'}
            </Text>
          </View>
          <View style={[rc.animalBadge, { backgroundColor: isCow ? '#ecfdf5' : '#f5f3ff' }]}>
            <Text style={[rc.animalText, { color: isCow ? '#065f46' : '#5b21b6' }]}>
              {isCow ? '🐄 Cow' : '🐃 Buffalo'}
            </Text>
          </View>
        </View>
      </View>

      {/* Date row */}
      <Text style={rc.dateRow}>
        📅 {fmtDate(item.date)}
      </Text>

      {/* Metrics grid */}
      <View style={rc.metricsGrid}>
        <View style={rc.metricItem}>
          <Text style={rc.metricLabel}>Quantity</Text>
          <Text style={rc.metricValue}>{fmt(qty, 2)} L</Text>
        </View>
        <View style={rc.metricItem}>
          <Text style={rc.metricLabel}>FAT</Text>
          <Text style={[rc.metricValue, { color: '#f59e0b' }]}>{fmt(item.fat, 1)}</Text>
        </View>
        <View style={rc.metricItem}>
          <Text style={rc.metricLabel}>SNF</Text>
          <Text style={[rc.metricValue, { color: colors.info }]}>{fmt(item.snf, 1)}</Text>
        </View>
        <View style={rc.metricItem}>
          <Text style={rc.metricLabel}>Rate/L</Text>
          <Text style={rc.metricValue}>{fmtINR(rate)}</Text>
        </View>
      </View>

      {/* Amount row */}
      <View style={rc.amountRow}>
        <View style={{ flex: 1 }}>
          <Text style={rc.amountFormula}>
            {fmt(qty, 2)} L × {fmtINR(rate)}/L
          </Text>
          {mismatch && (
            <Text style={rc.mismatchWarn}>⚠ Stored amount differs from computed</Text>
          )}
        </View>
        <Text style={rc.amountValue}>{fmtINR(amount)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const rc = StyleSheet.create({
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: 10,
    ...shadows.card, borderWidth: 1, borderColor: colors.divider,
  },
  topRow:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  avatar:      { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarText:  { fontSize: 15, fontWeight: '800', color: '#fff' },
  farmerName:  { fontSize: 15, fontWeight: '700', color: colors.text },
  farmerMeta:  { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  badgesCol:   { alignItems: 'flex-end', gap: 4 },
  shiftBadge:  { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  shiftText:   { fontSize: 10, fontWeight: '700' },
  animalBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  animalText:  { fontSize: 10, fontWeight: '700' },
  dateRow:     { fontSize: 11, color: colors.textMuted, marginBottom: 10, fontWeight: '500' },
  metricsGrid: {
    flexDirection: 'row', backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm, padding: 8, gap: 4, marginBottom: 10,
  },
  metricItem:  { flex: 1, alignItems: 'center' },
  metricLabel: { fontSize: 9, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  metricValue: { fontSize: 14, fontWeight: '800', color: colors.text, marginTop: 2 },
  amountRow:   {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.successLight, borderRadius: radius.sm, padding: 10,
  },
  amountFormula: { fontSize: 11, color: colors.success, fontWeight: '600' },
  mismatchWarn:  { fontSize: 10, color: colors.danger, marginTop: 2 },
  amountValue:   { fontSize: 18, fontWeight: '900', color: colors.success },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
const CollectionRecordsScreen = ({ route, navigation }) => {
  const insets   = useSafeAreaInsets();
  const dispatch = useDispatch();
  const token    = useSelector((s) => s.auth.token);
  const { user } = useSelector((s) => s.auth);
  const entries    = useSelector((s) => s.milk.entries);
  const summary    = useSelector((s) => s.milk.summary);
  const total      = useSelector((s) => s.milk.total);
  const totalPages = useSelector((s) => s.milk.totalPages);
  const milkStatus = useSelector((s) => s.milk.status);
  const centers    = useSelector((s) => s.centers.list);

  const initialCenter = route?.params?.centerId || '';

  const [search,      setSearch]      = useState('');
  const [centerId,    setCenterId]    = useState(initialCenter);
  const [date,        setDate]        = useState(new Date().toISOString().split('T')[0]);
  const [shift,       setShift]       = useState('');
  const [animalType,  setAnimalType]  = useState('');
  const [page,        setPage]        = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing,  setRefreshing]  = useState(false);

  // Debounced search
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
    if (centerId)        params.centerId   = centerId;
    if (date)            params.date       = date;
    if (shift)           params.shift      = shift;
    if (animalType)      params.animalType = animalType;
    if (debouncedSearch) params.search     = debouncedSearch;
    dispatch(fetchMilkEntries({ token, params }));
    setPage(pg);
  }, [token, centerId, date, shift, animalType, debouncedSearch, dispatch]);

  useEffect(() => { load(1); }, [load]);

  const clearFilters = () => {
    setSearch(''); setDebouncedSearch('');
    setCenterId(''); setDate(new Date().toISOString().split('T')[0]);
    setShift(''); setAnimalType('');
  };

  const isLoading = milkStatus === 'loading';

  // ── Summary stats ──
  const s = summary || {};
  const totalLiters  = Number(s.totalMilkLiters   || 0);
  const totalAmount  = Number(s.totalAmountInr     || 0);
  const avgFat       = Number(s.avgFat             || 0);
  const avgSnf       = Number(s.avgSnf             || 0);
  const avgRate      = Number(s.avgRatePerLiter     || 0);
  const morningL     = Number(s.morningMilkLiters  || 0);
  const eveningL     = Number(s.eveningMilkLiters  || 0);
  const cowL         = Number(s.cowMilkLiters      || 0);
  const buffaloL     = Number(s.buffaloMilkLiters  || 0);

  const activeFilters = [centerId, shift, animalType].filter(Boolean).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={20} color={colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.brandText}>Sarvasvaa Milk</Text>
          <Text style={styles.headerTitle}>Collection Records</Text>
        </View>
        <TouchableOpacity
          style={[styles.filterToggleBtn, activeFilters > 0 && { backgroundColor: colors.primary }]}
          onPress={() => setShowFilters(v => !v)}
        >
          <SlidersHorizontal size={16} color={activeFilters > 0 ? '#fff' : colors.primary} strokeWidth={2.5} />
          {activeFilters > 0 && (
            <View style={styles.filterBadge}><Text style={styles.filterBadgeText}>{activeFilters}</Text></View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Search bar ── */}
      <View style={styles.searchBar}>
        <Search size={15} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search farmer name or code..."
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <X size={15} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Date row (always visible) ── */}
      <View style={styles.dateRow}>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
          <Calendar size={14} color={colors.primary} />
          <Text style={styles.dateBtnText}>
            {date ? fmtDate(date) : 'Select Date'}
          </Text>
        </TouchableOpacity>
        {date && (
          <TouchableOpacity style={styles.clearDateBtn} onPress={() => setDate('')}>
            <X size={12} color={colors.textMuted} />
            <Text style={styles.clearDateText}>Clear date</Text>
          </TouchableOpacity>
        )}
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={date ? new Date(date) : new Date()}
          mode="date"
          display="default"
          onChange={(_, d) => {
            setShowDatePicker(false);
            if (d) setDate(d.toISOString().split('T')[0]);
          }}
        />
      )}

      {/* ── Collapsible filters ── */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          {/* Center */}
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Center</Text>
            <View style={styles.pickerWrap}>
              <Picker selectedValue={centerId} onValueChange={setCenterId} style={styles.picker}>
                <Picker.Item label="All Centers" value="" />
                {centers.map(c => <Picker.Item key={c._id} label={c.name} value={c._id} />)}
              </Picker>
            </View>
          </View>
          {/* Shift chips */}
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Shift</Text>
            <View style={styles.chipRow}>
              {['', 'Morning', 'Evening'].map(v => (
                <TouchableOpacity
                  key={v}
                  style={[styles.chip, shift === v && styles.chipActive]}
                  onPress={() => setShift(v)}
                >
                  <Text style={[styles.chipText, shift === v && styles.chipTextActive]}>
                    {v || 'All'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {/* Animal chips */}
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Animal</Text>
            <View style={styles.chipRow}>
              {['', 'Cow', 'Buffalo'].map(v => (
                <TouchableOpacity
                  key={v}
                  style={[styles.chip, animalType === v && styles.chipActive]}
                  onPress={() => setAnimalType(v)}
                >
                  <Text style={[styles.chipText, animalType === v && styles.chipTextActive]}>
                    {v || 'All'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TouchableOpacity style={styles.clearAllBtn} onPress={clearFilters}>
            <Text style={styles.clearAllText}>Clear All Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Summary stats grid ── */}
      {!isLoading && (
        <View style={styles.statsSection}>
          {/* Row 1 */}
          <View style={styles.statsRow}>
            <StatBox label="Total Milk"   value={`${fmt(totalLiters, 1)} L`} sub={`${total} entries`} accent={colors.primary} />
            <StatBox label="Total Amount" value={fmtINR(totalAmount)} accent={colors.success} />
          </View>
          {/* Row 2 */}
          <View style={styles.statsRow}>
            <StatBox label="Avg FAT"  value={fmt(avgFat, 2)}  sub="%" accent="#f59e0b" />
            <StatBox label="Avg SNF"  value={fmt(avgSnf, 2)}  sub="%" accent={colors.info} />
            <StatBox label="Avg Rate" value={fmtINR(avgRate)} sub="/L" />
          </View>
          {/* Row 3 */}
          <View style={styles.statsRow}>
            <StatBox label="🌅 Morning" value={`${fmt(morningL, 1)} L`} />
            <StatBox label="🌙 Evening" value={`${fmt(eveningL, 1)} L`} />
            <StatBox label="🐄 Cow"     value={`${fmt(cowL, 1)} L`} />
            <StatBox label="🐃 Buffalo" value={`${fmt(buffaloL, 1)} L`} />
          </View>
        </View>
      )}

      {/* ── Records count ── */}
      <View style={styles.recordsHeader}>
        <Text style={styles.recordsTitle}>
          Records {total > 0 ? `(${total})` : ''}
        </Text>
        {total > entries.length && (
          <Text style={styles.recordsSubtitle}>Showing {entries.length} of {total}</Text>
        )}
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
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(1); setRefreshing(false); }}
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

      {/* ── Bottom Nav ── */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
        {[
          { label: 'Dashboard',   icon: House,     nav: 'AdminDashboard' },
          { label: 'Collections', icon: Store,     nav: null },
          { label: 'Payments',    icon: CreditCard,nav: 'AllPays' },
          { label: 'Farmers',     icon: Users,     nav: 'FarmerList' },
        ].map(({ label, icon: Icon, nav }) => {
          const active = nav === null;
          return (
            <TouchableOpacity key={label} style={styles.navItem} onPress={() => nav && navigation.navigate(nav)}>
              <View style={[styles.navIcon, active && styles.navIconActive]}>
                <Icon size={22} color={active ? '#fff' : colors.textMuted} strokeWidth={2.5} />
              </View>
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    backgroundColor: colors.surface, ...shadows.small,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.primaryXLight,
    justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm,
  },
  brandText:   { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  filterToggleBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.primaryXLight,
    justifyContent: 'center', alignItems: 'center',
  },
  filterBadge: {
    position: 'absolute', top: -4, right: -4,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: colors.danger, justifyContent: 'center', alignItems: 'center',
  },
  filterBadgeText: { fontSize: 9, color: '#fff', fontWeight: '800' },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: spacing.md, marginTop: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    borderWidth: 1, borderColor: colors.border, ...shadows.xs,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },

  dateRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: spacing.md, marginTop: 8, gap: 10,
  },
  dateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primaryXLight, borderRadius: radius.sm,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: colors.teal100,
  },
  dateBtnText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  clearDateBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  clearDateText: { fontSize: 12, color: colors.textMuted },

  filtersPanel: {
    marginHorizontal: spacing.md, marginTop: 8,
    backgroundColor: colors.surface, borderRadius: radius.md,
    padding: spacing.md, ...shadows.card,
    borderWidth: 1, borderColor: colors.border,
  },
  filterRow:  { marginBottom: 12 },
  filterLabel:{ fontSize: 12, fontWeight: '700', color: colors.textMuted, marginBottom: 6, textTransform: 'uppercase' },
  pickerWrap: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, overflow: 'hidden', backgroundColor: colors.surfaceMuted },
  picker:     { height: 44, color: colors.text },
  chipRow:    { flexDirection: 'row', gap: 8 },
  chip:       { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText:   { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  chipTextActive: { color: '#fff' },
  clearAllBtn:{ alignSelf: 'flex-end', paddingVertical: 6, paddingHorizontal: 12 },
  clearAllText:{ fontSize: 13, color: colors.danger, fontWeight: '600' },

  statsSection: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  statsRow:     { flexDirection: 'row', gap: 8, marginBottom: 8 },

  recordsHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: 8,
  },
  recordsTitle:    { fontSize: 15, fontWeight: '800', color: colors.text },
  recordsSubtitle: { fontSize: 12, color: colors.textMuted },

  emptyBox:  { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle:{ fontSize: 16, fontWeight: '700', color: colors.text },
  emptySub:  { fontSize: 13, color: colors.textMuted, marginTop: 4 },

  loadMoreBtn: {
    margin: spacing.md, backgroundColor: colors.primaryXLight,
    borderRadius: radius.md, paddingVertical: 12, alignItems: 'center',
    borderWidth: 1, borderColor: colors.teal100,
  },
  loadMoreText: { fontSize: 14, fontWeight: '700', color: colors.primary },

  bottomNav: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface, flexDirection: 'row',
    justifyContent: 'space-around', paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm, borderTopWidth: 1,
    borderTopColor: colors.divider, ...shadows.medium,
  },
  navItem:      { alignItems: 'center', paddingVertical: spacing.xs },
  navIcon:      { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  navIconActive:{ backgroundColor: colors.primary },
  navLabel:     { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  navLabelActive:{ color: colors.primary },
});

export default CollectionRecordsScreen;
