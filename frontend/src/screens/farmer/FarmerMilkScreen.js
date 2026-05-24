import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Platform, RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Droplets, Calendar, ChevronLeft } from 'lucide-react-native';
import { fetchFarmerMilk } from '../../redux/slices/farmerDashboardSlice';
import { colors, radius, spacing, typography, shadows } from '../../theme';

const fmt = (d) => d.toISOString().split('T')[0];
const fmtDisplay = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const FarmerMilkScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const token = useSelector((s) => s.auth.token);
  const { milk, milkStatus } = useSelector((s) => s.farmerDashboard);

  const today = new Date();
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [showFrom, setShowFrom] = useState(false);
  const [showTo, setShowTo] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    if (!token) return;
    dispatch(fetchFarmerMilk({ token, params: { from: fmt(fromDate), to: fmt(toDate) } }));
  }, [token, fromDate, toDate, dispatch]);

  useEffect(() => { load(); }, [load]);

  const entries = milk.data || [];
  const summary = milk.summary || {};

  const renderEntry = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIconBox}>
          <Droplets size={16} color={colors.primary} strokeWidth={2.5} />
        </View>
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.cardDate}>{fmtDisplay(item.date)}</Text>
          <View style={styles.tagRow}>
            <View style={[styles.tag, { backgroundColor: item.shift === 'Morning' ? colors.warningLight : colors.infoLight }]}>
              <Text style={[styles.tagText, { color: item.shift === 'Morning' ? colors.warning : colors.info }]}>
                {item.shift}
              </Text>
            </View>
            <View style={[styles.tag, { backgroundColor: colors.primaryXLight }]}>
              <Text style={[styles.tagText, { color: colors.primary }]}>
                {item.animalType}
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.cardAmount}>₹{item.amountInr?.toFixed(2)}</Text>
      </View>
      <View style={styles.cardDivider} />
      <View style={styles.cardStats}>
        <View style={styles.cardStat}>
          <Text style={styles.cardStatLabel}>Milk</Text>
          <Text style={styles.cardStatValue}>{item.quantityLiters} L</Text>
        </View>
        <View style={styles.cardStat}>
          <Text style={styles.cardStatLabel}>FAT</Text>
          <Text style={styles.cardStatValue}>{item.fat}</Text>
        </View>
        <View style={styles.cardStat}>
          <Text style={styles.cardStatLabel}>SNF</Text>
          <Text style={styles.cardStatValue}>{item.snf}</Text>
        </View>
        <View style={styles.cardStat}>
          <Text style={styles.cardStatLabel}>Rate</Text>
          <Text style={styles.cardStatValue}>₹{item.ratePerLiter}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color={colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Milk Collection Records</Text>
          <Text style={styles.headerSub}>Milk Collection Records</Text>
        </View>
      </View>

      {/* Date Filter */}
      <View style={styles.filterCard}>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowFrom(true)}>
          <Calendar size={14} color={colors.primary} strokeWidth={2.5} />
          <Text style={styles.dateBtnText}>{fmtDisplay(fromDate)}</Text>
        </TouchableOpacity>
        <Text style={styles.dateSep}>-</Text>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowTo(true)}>
          <Calendar size={14} color={colors.primary} strokeWidth={2.5} />
          <Text style={styles.dateBtnText}>{fmtDisplay(toDate)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.todayBtn} onPress={() => { setFromDate(today); setToDate(today); }}>
          <Text style={styles.todayBtnText}>Today</Text>
        </TouchableOpacity>
      </View>

      {showFrom && (
        <DateTimePicker
          value={fromDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={toDate}
          onChange={(_, d) => { setShowFrom(false); if (d) setFromDate(d); }}
        />
      )}
      {showTo && (
        <DateTimePicker
          value={toDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={fromDate} maximumDate={today}
          onChange={(_, d) => { setShowTo(false); if (d) setToDate(d); }}
        />
      )}

      {/* Summary Bar */}
      {entries.length > 0 && (
        <View style={styles.summaryBar}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryVal}>{summary.totalMilkLiters || 0} L</Text>
            <Text style={styles.summaryLbl}>Total Milk</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryVal}>₹{summary.totalAmountInr || 0}</Text>
            <Text style={styles.summaryLbl}>Total Amount</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryVal}>{summary.avgFat || 0}</Text>
            <Text style={styles.summaryLbl}>Avg FAT</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryVal}>{summary.avgSnf || 0}</Text>
            <Text style={styles.summaryLbl}>Avg SNF</Text>
          </View>
        </View>
      )}

      {/* List */}
      {milkStatus === 'loading' ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} size="large" />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item._id}
          renderItem={renderEntry}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); setRefreshing(false); }}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Droplets size={40} color={colors.textMuted} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>No records</Text>
              <Text style={styles.emptyText}>No milk records for the selected date</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md, backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.divider, ...shadows.xs
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 11, backgroundColor: colors.primaryXLight,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm
  },
  headerTitle: { fontSize: typography.h3, fontWeight: '800', color: colors.text },
  headerSub: { fontSize: typography.xs, color: colors.textMuted, fontWeight: '500' },
  filterCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.divider, gap: spacing.xs
  },
  dateBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.surfaceMuted, borderRadius: radius.md,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderWidth: 1, borderColor: colors.border
  },
  dateBtnText: { fontSize: typography.xs, color: colors.text, fontWeight: '600', flex: 1 },
  dateSep: { fontSize: typography.small, color: colors.textMuted, fontWeight: '700' },
  todayBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs
  },
  todayBtnText: { color: colors.white, fontSize: typography.xs, fontWeight: '700' },
  summaryBar: {
    flexDirection: 'row', backgroundColor: colors.primaryXLight,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.teal100
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryVal: { fontSize: typography.small, fontWeight: '800', color: colors.primary },
  summaryLbl: { fontSize: 10, color: colors.primary + 'AA', fontWeight: '500', marginTop: 1 },
  summaryDivider: { width: 1, backgroundColor: colors.teal100 },
  list: { padding: spacing.lg, paddingBottom: 40 },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md,
    marginBottom: spacing.sm, ...shadows.card, borderWidth: 1, borderColor: colors.divider
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  cardIconBox: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primaryXLight,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm
  },
  cardHeaderInfo: { flex: 1 },
  cardDate: { fontSize: typography.small, fontWeight: '700', color: colors.text },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  tagText: { fontSize: 10, fontWeight: '700' },
  cardAmount: { fontSize: typography.h3, fontWeight: '800', color: colors.success },
  cardDivider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.sm },
  cardStats: { flexDirection: 'row', justifyContent: 'space-between' },
  cardStat: { alignItems: 'center', flex: 1 },
  cardStatLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '500' },
  cardStatValue: { fontSize: typography.small, fontWeight: '700', color: colors.text, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: typography.h3, fontWeight: '700', color: colors.textSecondary, marginTop: spacing.md },
  emptyText: { fontSize: typography.small, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' }
});

export default FarmerMilkScreen;
