import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Platform, RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Salad, Calendar, ChevronLeft } from 'lucide-react-native';
import { fetchFarmerFood } from '../../redux/slices/farmerDashboardSlice';
import { colors, radius, spacing, typography, shadows } from '../../theme';

const fmt = (d) => d.toISOString().split('T')[0];
const fmtDisplay = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const STATUS_COLORS = {
  Pending: { bg: colors.warningLight, text: colors.warning },
  Paid: { bg: colors.successLight, text: colors.success }
};

const FarmerFoodScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const token = useSelector((s) => s.auth.token);
  const { food, foodStatus } = useSelector((s) => s.farmerDashboard);

  const today = new Date();
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [showFrom, setShowFrom] = useState(false);
  const [showTo, setShowTo] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    if (!token) return;
    dispatch(fetchFarmerFood({ token, params: { from: fmt(fromDate), to: fmt(toDate) } }));
  }, [token, fromDate, toDate, dispatch]);

  useEffect(() => { load(); }, [load]);

  const records = food.data || [];
  const summary = food.summary || {};

  const renderRecord = ({ item }) => {
    const statusStyle = STATUS_COLORS[item.paymentStatus] || STATUS_COLORS.Pending;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIconBox}>
            <Salad size={16} color={colors.warning} strokeWidth={2.5} />
          </View>
          <View style={styles.cardHeaderInfo}>
            <Text style={styles.cardTitle}>{item.foodType}{item.brandName ? ` (${item.brandName})` : ''}</Text>
            <Text style={styles.cardDate}>{fmtDisplay(item.date)}</Text>
          </View>
          <View>
            <Text style={styles.cardAmount}>₹{item.totalAmount?.toFixed(2)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>
                {item.paymentStatus === 'Paid' ? 'Paid' : 'Pending'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.cardDivider} />
        <View style={styles.cardStats}>
          <View style={styles.cardStat}>
            <Text style={styles.cardStatLabel}>Quantity</Text>
            <Text style={styles.cardStatValue}>{item.quantity} {item.unit}</Text>
          </View>
          <View style={styles.cardStat}>
            <Text style={styles.cardStatLabel}>Rate</Text>
            <Text style={styles.cardStatValue}>₹{item.rate}</Text>
          </View>
          <View style={styles.cardStat}>
            <Text style={styles.cardStatLabel}>Animal</Text>
            <Text style={styles.cardStatValue}>{item.animalType}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color={colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Food Records</Text>
          <Text style={styles.headerSub}>Food Records</Text>
        </View>
      </View>

      {/* Date Filter */}
      <View style={styles.filterCard}>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowFrom(true)}>
          <Calendar size={14} color={colors.primary} strokeWidth={2.5} />
          <Text style={styles.dateBtnText}>{fmtDisplay(fromDate)}</Text>
        </TouchableOpacity>
        <Text style={styles.dateSep}>→</Text>
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
      {records.length > 0 && (
        <View style={styles.summaryBar}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryVal}>{records.length}</Text>
            <Text style={styles.summaryLbl}>Total Records</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryVal}>₹{summary.totalAmount || 0}</Text>
            <Text style={styles.summaryLbl}>Total Amount</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryVal}>
              {records.filter((r) => r.paymentStatus === 'Pending').length}
            </Text>
            <Text style={styles.summaryLbl}>Pending</Text>
          </View>
        </View>
      )}

      {/* List */}
      {foodStatus === 'loading' ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} size="large" />
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item._id}
          renderItem={renderRecord}
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
              <Salad size={40} color={colors.textMuted} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>No records</Text>
              <Text style={styles.emptyText}>No food records for the selected date</Text>
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
    backgroundColor: colors.warning, borderRadius: radius.md,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs
  },
  todayBtnText: { color: colors.white, fontSize: typography.xs, fontWeight: '700' },
  summaryBar: {
    flexDirection: 'row', backgroundColor: colors.warningLight,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.warning + '33'
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryVal: { fontSize: typography.small, fontWeight: '800', color: colors.warning },
  summaryLbl: { fontSize: 10, color: colors.warning + 'AA', fontWeight: '500', marginTop: 1 },
  summaryDivider: { width: 1, backgroundColor: colors.warning + '33' },
  list: { padding: spacing.lg, paddingBottom: 40 },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md,
    marginBottom: spacing.sm, ...shadows.card, borderWidth: 1, borderColor: colors.divider
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  cardIconBox: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: colors.warningLight,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm
  },
  cardHeaderInfo: { flex: 1 },
  cardTitle: { fontSize: typography.small, fontWeight: '700', color: colors.text },
  cardDate: { fontSize: typography.xs, color: colors.textMuted, marginTop: 2 },
  cardAmount: { fontSize: typography.body, fontWeight: '800', color: colors.text, textAlign: 'right' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full, marginTop: 4, alignSelf: 'flex-end' },
  statusText: { fontSize: 10, fontWeight: '700' },
  cardDivider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.sm },
  cardStats: { flexDirection: 'row', justifyContent: 'space-between' },
  cardStat: { alignItems: 'center', flex: 1 },
  cardStatLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '500' },
  cardStatValue: { fontSize: typography.small, fontWeight: '700', color: colors.text, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: typography.h3, fontWeight: '700', color: colors.textSecondary, marginTop: spacing.md },
  emptyText: { fontSize: typography.small, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' }
});

export default FarmerFoodScreen;
