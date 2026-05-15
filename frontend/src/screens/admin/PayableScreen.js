import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList,
  Modal, Alert, ActivityIndicator, RefreshControl, ScrollView, Switch
} from 'react-native';
import { useSelector } from 'react-redux';
import { payableApi, farmerApi } from '../../api/api';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { ROLE_ADMIN } from '../../constants/roles';
import { Calendar } from 'lucide-react-native';

// ─── helpers ─────────────────────────────────────────────────────────────────
const today      = () => new Date().toISOString().split('T')[0];
const monthStart = () => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; };
const fmtDate    = (iso) => iso ? new Date(iso).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';

// ─── DateInput ────────────────────────────────────────────────────────────────
const DateInput = ({ label, value, onChange }) => (
  <View style={{ flex: 1 }}>
    <Text style={di.label}>{label}</Text>
    <View style={di.row}>
      <Calendar size={13} color={colors.primary} />
      <TextInput
        style={di.input}
        value={value}
        onChangeText={onChange}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.textMuted}
        keyboardType="numeric"
        maxLength={10}
      />
    </View>
  </View>
);
const di = StyleSheet.create({
  label: { fontSize: 11, fontWeight: '600', color: colors.textMuted, marginBottom: 4, textTransform: 'uppercase' },
  row:   { flexDirection: 'row', alignItems: 'center', gap: 6,
           backgroundColor: colors.surfaceMuted, borderRadius: radius.sm,
           paddingHorizontal: 10, paddingVertical: 9,
           borderWidth: 1, borderColor: colors.border },
  input: { flex: 1, fontSize: 13, color: colors.text },
});

// ─── InfoChip ─────────────────────────────────────────────────────────────────
const InfoChip = ({ label, value, valueColor }) => (
  <View style={chip.box}>
    <Text style={chip.label}>{label}</Text>
    <Text style={[chip.value, valueColor && { color: valueColor }]}>{value}</Text>
  </View>
);
const chip = StyleSheet.create({
  box:   { flex: 1, backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, padding: 7, alignItems: 'center' },
  label: { fontSize: 9, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  value: { fontSize: 12, fontWeight: '800', color: colors.text, marginTop: 2 },
});

// ─── FarmerPayableCard ────────────────────────────────────────────────────────
const FarmerPayableCard = ({ item, centerName, isAdmin, fromDate, toDate, centerId, token, onRefresh, onViewDetail }) => {
  const isPaid = item.paymentStatus === 'Paid';

  const [deductAdvance, setDeductAdvance] = useState(item.deductAdvance ?? false);
  const [deductFood,    setDeductFood]    = useState(item.deductFood    ?? false);
  const [applying,  setApplying]  = useState(false);
  const [paying,    setPaying]    = useState(false);

  // ── Live calculation (mirrors backend exactly) ──
  const milkIncome  = item.totalMilkIncome      || 0;
  const advanceAmt  = item.totalAdvanceRemaining || 0;
  const foodAmt     = item.totalFoodPending      || 0;

  const liveDeductFood = deductFood    ? Math.min(foodAmt,    milkIncome)    : 0;
  const milkAfterFood  = Math.max(0, milkIncome - liveDeductFood);
  const liveDeductAdv  = deductAdvance ? Math.min(advanceAmt, milkAfterFood) : 0;
  const livePayable    = Math.max(0, milkAfterFood - liveDeductAdv);
  const liveAdvStillOwed = Math.max(0, advanceAmt - liveDeductAdv);

  const togglesChanged =
    deductAdvance !== (item.deductAdvance ?? false) ||
    deductFood    !== (item.deductFood    ?? false);

  const doGenerate = async (da, df) => {
    await payableApi.generate({
      farmerId: item.farmerId?._id || item.farmerId,
      centerId: item.collectionCenterId?._id || centerId,
      fromDate, toDate,
      deductAdvance: da,
      deductFood:    df,
    }, token);
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      const res = await payableApi.generate({
        farmerId: item.farmerId?._id || item.farmerId,
        centerId: item.collectionCenterId?._id || centerId,
        fromDate, toDate, deductAdvance, deductFood,
      }, token);
      if (res.data?.alreadyPaid) {
        Alert.alert('Already Paid', 'This cycle is already marked as Paid. No changes made.');
      }
      onRefresh();
    } catch (e) { Alert.alert('Error', e.message); }
    setApplying(false);
  };

  const handleMarkPaid = () => {
    const advLine = liveDeductAdv > 0
      ? `• Advance recovered: ₹${liveDeductAdv.toLocaleString('en-IN')}  (₹${liveAdvStillOwed.toLocaleString('en-IN')} still owed)`
      : '';
    const foodLine = liveDeductFood > 0
      ? `• Food settled: ₹${liveDeductFood.toLocaleString('en-IN')}`
      : '';
    const msg = [
      `Pay ₹${livePayable.toLocaleString('en-IN')} to ${item.farmerId?.fullName}?`,
      advLine, foodLine,
    ].filter(Boolean).join('\n');

    Alert.alert('Confirm Payment', msg, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm & Pay',
        onPress: async () => {
          setPaying(true);
          try {
            if (togglesChanged) await doGenerate(deductAdvance, deductFood);
            await payableApi.markPaid(item._id, token);
            onRefresh();
          } catch (e) { Alert.alert('Error', e.message); }
          setPaying(false);
        },
      },
    ]);
  };

  const handleDelete = () =>
    Alert.alert('Delete Payable', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try { await payableApi.remove(item._id, token); onRefresh(); }
          catch (e) { Alert.alert('Error', e.message); }
        }
      },
    ]);

  return (
    <View style={cs.card}>
      {/* Header */}
      <TouchableOpacity style={cs.headerRow} onPress={() => onViewDetail(item)} activeOpacity={0.75}>
        <View style={{ flex: 1 }}>
          <Text style={cs.farmerName} numberOfLines={1}>{item.farmerId?.fullName || '—'}</Text>
          <Text style={cs.meta}>
            {item.farmerId?.farmerCode || item.farmerCode}
            {' · '}{item.collectionCenterId?.name || centerName}
          </Text>
          <Text style={cs.cycle}>
            📅 {item.paymentCycle || `${fmtDate(item.fromDate)} – ${fmtDate(item.toDate)}`}
          </Text>
        </View>
        <View style={[cs.badge, { backgroundColor: isPaid ? colors.successLight : colors.primaryXLight }]}>
          <Text style={[cs.badgeText, { color: isPaid ? colors.success : colors.primary }]}>
            {isPaid ? '✓ Paid' : '⏳ Pending'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Milk Income */}
      <View style={cs.milkBox}>
        <Text style={cs.milkLabel}>🥛 Milk Income</Text>
        <Text style={cs.milkValue}>₹{milkIncome.toLocaleString('en-IN')}</Text>
      </View>

      {/* Chips */}
      <View style={cs.chipsRow}>
        <InfoChip label="Milk Days"   value={item.totalMilkDays || 0} />
        <InfoChip label="Liters"      value={`${(item.totalMilkQuantity || 0).toFixed(1)} L`} />
        <InfoChip label="Food Pending" value={foodAmt > 0 ? `₹${foodAmt.toLocaleString('en-IN')}` : '₹0'} valueColor={foodAmt > 0 ? '#f59e0b' : undefined} />
        <InfoChip label="Advance Owed" value={advanceAmt > 0 ? `₹${advanceAmt.toLocaleString('en-IN')}` : '₹0'} valueColor={advanceAmt > 0 ? colors.danger : undefined} />
      </View>

      {/* Toggles — only for pending records */}
      {isAdmin && !isPaid && (
        <View style={cs.togglesBox}>
          <Text style={cs.togglesTitle}>Deductions for this farmer</Text>

          {/* Advance toggle */}
          <View style={cs.toggleRow}>
            <View style={cs.toggleLeft}>
              <View style={[cs.dot, { backgroundColor: colors.danger }]} />
              <View style={{ flex: 1 }}>
                <Text style={cs.toggleLabel}>Deduct Advance</Text>
                {deductAdvance
                  ? <Text style={[cs.toggleSub, { color: colors.danger }]}>
                      Recover ₹{liveDeductAdv.toLocaleString('en-IN')}
                      {liveAdvStillOwed > 0 ? `  ·  ₹${liveAdvStillOwed.toLocaleString('en-IN')} still owed` : '  ·  Fully cleared'}
                    </Text>
                  : advanceAmt > 0
                    ? <Text style={[cs.toggleSub, { color: colors.textMuted }]}>Outstanding: ₹{advanceAmt.toLocaleString('en-IN')}</Text>
                    : <Text style={[cs.toggleSub, { color: colors.textMuted }]}>No advance</Text>
                }
              </View>
            </View>
            <Switch
              value={deductAdvance}
              onValueChange={setDeductAdvance}
              trackColor={{ false: colors.border, true: colors.danger + '55' }}
              thumbColor={deductAdvance ? colors.danger : colors.textDisabled}
            />
          </View>

          {/* Food toggle */}
          <View style={[cs.toggleRow, { borderBottomWidth: 0 }]}>
            <View style={cs.toggleLeft}>
              <View style={[cs.dot, { backgroundColor: '#f59e0b' }]} />
              <View style={{ flex: 1 }}>
                <Text style={cs.toggleLabel}>Deduct Food</Text>
                {deductFood
                  ? <Text style={[cs.toggleSub, { color: '#f59e0b' }]}>− ₹{liveDeductFood.toLocaleString('en-IN')}</Text>
                  : foodAmt > 0
                    ? <Text style={[cs.toggleSub, { color: colors.textMuted }]}>Pending: ₹{foodAmt.toLocaleString('en-IN')}</Text>
                    : <Text style={[cs.toggleSub, { color: colors.textMuted }]}>No food pending</Text>
                }
              </View>
            </View>
            <Switch
              value={deductFood}
              onValueChange={setDeductFood}
              trackColor={{ false: colors.border, true: '#f59e0b55' }}
              thumbColor={deductFood ? '#f59e0b' : colors.textDisabled}
            />
          </View>

          {togglesChanged && (
            <TouchableOpacity style={cs.applyBtn} onPress={handleApply} disabled={applying}>
              {applying ? <ActivityIndicator size="small" color="#fff" /> : <Text style={cs.applyBtnText}>Apply Changes</Text>}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Final Payable */}
      <View style={[cs.finalBox, { backgroundColor: isPaid ? colors.successLight : '#eff6ff' }]}>
        <View style={{ flex: 1 }}>
          <Text style={[cs.finalLabel, { color: isPaid ? colors.success : colors.primary }]}>
            {isPaid ? '✓ Amount Paid' : '💰 Final Payable'}
          </Text>
          {!isPaid && (
            <Text style={cs.finalFormula}>
              ₹{milkIncome.toLocaleString('en-IN')} milk
              {liveDeductFood > 0 ? ` − ₹${liveDeductFood.toLocaleString('en-IN')} food` : ''}
              {liveDeductAdv  > 0 ? ` − ₹${liveDeductAdv.toLocaleString('en-IN')} advance` : ''}
              {' = ₹'}{livePayable.toLocaleString('en-IN')}
            </Text>
          )}
          {!isPaid && deductAdvance && liveAdvStillOwed > 0 && (
            <Text style={[cs.finalFormula, { color: colors.danger, marginTop: 2 }]}>
              ₹{liveAdvStillOwed.toLocaleString('en-IN')} advance still owed after this cycle
            </Text>
          )}
        </View>
        <Text style={[cs.finalAmt, { color: isPaid ? colors.success : colors.primary }]}>
          ₹{(isPaid ? item.finalPayableAmount : livePayable).toLocaleString('en-IN')}
        </Text>
      </View>

      {/* Actions */}
      {isAdmin && !isPaid && (
        <View style={cs.actionsRow}>
          <TouchableOpacity style={cs.payBtn} onPress={handleMarkPaid} disabled={paying}>
            {paying ? <ActivityIndicator size="small" color="#fff" /> : <Text style={cs.payBtnText}>Mark as Paid</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={cs.delBtn} onPress={handleDelete}>
            <Text style={cs.delBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
      {isAdmin && isPaid && (
        <TouchableOpacity style={[cs.delBtn, { marginTop: 8 }]} onPress={handleDelete}>
          <Text style={cs.delBtnText}>Delete Record</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const cs = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: 12, ...shadows.card },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  farmerName: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta:  { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  cycle: { fontSize: 11, color: colors.primary, fontWeight: '600', marginTop: 3 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  milkBox: { backgroundColor: colors.successLight, borderRadius: radius.sm, padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  milkLabel: { fontSize: 13, fontWeight: '700', color: colors.success },
  milkValue: { fontSize: 18, fontWeight: '900', color: colors.success },
  chipsRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  togglesBox: { backgroundColor: '#fafafa', borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 10 },
  togglesTitle: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.divider },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  toggleLabel: { fontSize: 13, fontWeight: '600', color: colors.text },
  toggleSub: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  applyBtn: { marginTop: 10, backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: 9, alignItems: 'center' },
  applyBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  finalBox: { borderRadius: radius.sm, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  finalLabel: { fontSize: 13, fontWeight: '700' },
  finalFormula: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  finalAmt: { fontSize: 20, fontWeight: '900' },
  actionsRow: { flexDirection: 'row', gap: 8 },
  payBtn: { flex: 2, backgroundColor: colors.success + '20', borderRadius: radius.sm, paddingVertical: 10, alignItems: 'center' },
  payBtnText: { color: colors.success, fontWeight: '700', fontSize: 13 },
  delBtn: { flex: 1, backgroundColor: colors.danger + '15', borderRadius: radius.sm, paddingVertical: 10, alignItems: 'center' },
  delBtnText: { color: colors.danger, fontWeight: '700', fontSize: 13 },
});


// ─── Main PayableScreen ───────────────────────────────────────────────────────
const PayableScreen = ({ centerId, centerName }) => {
  const { token, user } = useSelector((s) => s.auth);
  const isAdmin = user?.role === ROLE_ADMIN;

  // Date range state — default: 1st of current month → today
  const [fromDate, setFromDate]         = useState(monthStart);
  const [toDate,   setToDate]           = useState(today);
  const [statusFilter, setStatusFilter] = useState('');
  const [payables,  setPayables]        = useState([]);
  const [summary,   setSummary]         = useState(null);
  const [loading,   setLoading]         = useState(false);
  const [refreshing, setRefreshing]     = useState(false);
  const [generating, setGenerating]     = useState(false);
  const [detailItem, setDetailItem]     = useState(null);

  // Derive month/year from fromDate for the summary API
  const fromDateObj = fromDate ? new Date(fromDate) : new Date();
  const month = fromDateObj.getMonth() + 1;
  const year  = fromDateObj.getFullYear();

  const loadPayables = useCallback(async () => {
    setLoading(true);
    try {
      // Filter by month+year derived from fromDate
      const params = { month, year };
      if (centerId)     params.centerId = centerId;
      if (statusFilter) params.status   = statusFilter;
      const res = await payableApi.getAll(token, params);
      setPayables(res.data.data || []);

      if (centerId) {
        try {
          const rep = await payableApi.getCenterReport(centerId, token, { month, year });
          setSummary(rep.data.data?.summary || null);
        } catch { /* ignore */ }
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }, [token, centerId, month, year, statusFilter]);

  useEffect(() => { loadPayables(); }, [loadPayables]);

  // Validate date inputs
  const datesValid = () => {
    if (!fromDate || !toDate) { Alert.alert('Validation', 'Please enter both From and To dates'); return false; }
    if (fromDate > toDate)    { Alert.alert('Validation', 'From date must be before To date');    return false; }
    return true;
  };

  // Generate payables for all farmers in the center for the selected date range
  // Skips farmers whose payable for this cycle is already Paid
  const generateAll = async () => {
    if (!centerId) { Alert.alert('Info', 'Please open from a specific center to generate payables.'); return; }
    if (!datesValid()) return;

    setGenerating(true);
    try {
      const res = await farmerApi.getByCenter(centerId, token);
      const farmers = res.data.data || res.data || [];
      let created = 0, skipped = 0;

      for (const f of farmers) {
        try {
          const r = await payableApi.generate({
            farmerId: f._id, centerId,
            fromDate, toDate,
            deductAdvance: false, deductFood: false,
          }, token);
          if (r.data?.alreadyPaid) skipped++;
          else created++;
        } catch { /* skip individual errors */ }
      }

      const msg = skipped > 0
        ? `Created: ${created}  ·  Skipped (already paid): ${skipped}\nUse toggles on each card to apply deductions.`
        : `Payables created for ${created} farmers.\nUse toggles on each card to apply deductions.`;
      Alert.alert('Done', msg);
      loadPayables();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setGenerating(false);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* ── Date Range Picker ── */}
      <View style={ss.dateRangeCard}>
        <Text style={ss.dateRangeTitle}>Payment Period</Text>
        <View style={ss.dateRow}>
          <DateInput label="From Date" value={fromDate} onChange={setFromDate} />
          <View style={ss.dateSep}><Text style={ss.dateSepText}>→</Text></View>
          <DateInput label="To Date"   value={toDate}   onChange={setToDate}   />
        </View>
        {fromDate && toDate && (
          <Text style={ss.dateRangeSub}>
            {fmtDate(fromDate)} → {fmtDate(toDate)}
          </Text>
        )}
      </View>

      {/* ── Status filter ── */}
      <View style={ss.filterRow}>
        {['', 'Pending', 'Paid'].map((s) => (
          <TouchableOpacity
            key={s}
            style={[ss.filterBtn, statusFilter === s && ss.filterBtnActive]}
            onPress={() => setStatusFilter(s)}
          >
            <Text style={[ss.filterBtnText, statusFilter === s && ss.filterBtnTextActive]}>
              {s || 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Center summary ── */}
      {summary && (
        <View style={ss.summaryCard}>
          <Text style={ss.summaryTitle}>
            Summary · {fmtDate(fromDate)} → {fmtDate(toDate)}
          </Text>
          <View style={ss.summaryRow}>
            <SummaryItem label="Farmers"     value={summary.totalFarmers} />
            <SummaryItem label="Milk Income" value={`₹${(summary.totalMilkIncome || 0).toLocaleString('en-IN')}`} />
            <SummaryItem label="Total Payable" value={`₹${(summary.totalPayable || 0).toLocaleString('en-IN')}`} valueColor={colors.success} />
          </View>
        </View>
      )}

      {/* ── Generate button ── */}
      {isAdmin && (
        <View style={ss.generateRow}>
          <TouchableOpacity style={ss.generateBtn} onPress={generateAll} disabled={generating}>
            {generating
              ? <ActivityIndicator color="#fff" />
              : <Text style={ss.generateBtnText}>⚡ Generate Payables for Date Range</Text>
            }
          </TouchableOpacity>
          <Text style={ss.generateHint}>
            Already-paid cycles are protected and will not be overwritten
          </Text>
        </View>
      )}

      {/* ── List ── */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} size="large" />
      ) : (
        <FlatList
          data={payables}
          keyExtractor={(i) => i._id}
          renderItem={({ item }) => (
            <FarmerPayableCard
              item={item}
              centerName={centerName}
              isAdmin={isAdmin}
              fromDate={fromDate}
              toDate={toDate}
              centerId={centerId}
              token={token}
              onRefresh={loadPayables}
              onViewDetail={setDetailItem}
            />
          )}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadPayables().finally(() => setRefreshing(false)); }}
            />
          }
          ListEmptyComponent={
            <Text style={ss.empty}>
              No payable records for this period.{'\n'}
              Set a date range and tap "Generate Payables".
            </Text>
          }
        />
      )}

      {/* ── Detail Modal ── */}
      <Modal visible={!!detailItem} animationType="slide" transparent onRequestClose={() => setDetailItem(null)}>
        <View style={ss.modalOverlay}>
          <View style={ss.modalContainer}>
            {detailItem && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={ss.modalTitle}>{detailItem.farmerId?.fullName}</Text>
                <Text style={ss.modalSub}>
                  {detailItem.paymentCycle || `${fmtDate(detailItem.fromDate)} – ${fmtDate(detailItem.toDate)}`}
                  {' · '}{detailItem.collectionCenterId?.name || centerName}
                </Text>

                <DSec title="Milk Collection">
                  <DRow label="Date Range"    value={`${fmtDate(detailItem.fromDate)} – ${fmtDate(detailItem.toDate)}`} />
                  <DRow label="Milk Days"     value={`${detailItem.totalMilkDays || 0} days`} />
                  <DRow label="Total Liters"  value={`${(detailItem.totalMilkQuantity || 0).toFixed(2)} L`} />
                  <DRow label="Milk Income"   value={`₹${(detailItem.totalMilkIncome || 0).toLocaleString('en-IN')}`} color={colors.success} bold />
                </DSec>

                {(detailItem.weeklyBreakdown || []).length > 0 && (
                  <DSec title="Weekly Breakdown">
                    {detailItem.weeklyBreakdown.map((w) => (
                      <DRow key={w.week} label={`Week ${w.week}`}
                        value={`${(w.milkQuantity || 0).toFixed(1)}L · ₹${(w.milkIncome || 0).toLocaleString('en-IN')}`} />
                    ))}
                  </DSec>
                )}

                <DSec title="Pending Amounts (at time of generation)">
                  <DRow label="Food Pending"      value={`₹${(detailItem.totalFoodPending || 0).toLocaleString('en-IN')}`}      color="#f59e0b" />
                  <DRow label="Advance Remaining" value={`₹${(detailItem.totalAdvanceRemaining || 0).toLocaleString('en-IN')}`} color={colors.danger} />
                </DSec>

                <DSec title="Deductions Applied">
                  <DRow label="Advance Recovered"
                    value={detailItem.deductAdvance ? `₹${(detailItem.totalAdvanceDeducted || 0).toLocaleString('en-IN')}` : 'Not deducted'}
                    color={detailItem.deductAdvance ? colors.danger : colors.textMuted} />
                  <DRow label="Food Deducted"
                    value={detailItem.deductFood ? `₹${(detailItem.totalFoodExpenses || 0).toLocaleString('en-IN')}` : 'Not deducted'}
                    color={detailItem.deductFood ? '#f59e0b' : colors.textMuted} />
                  <DRow label="Advance Still Owed"
                    value={`₹${(detailItem.remainingAdvanceBalance || 0).toLocaleString('en-IN')}`}
                    color={colors.danger} />
                </DSec>

                <DSec title="Final Settlement">
                  <DRow label="Final Payable" value={`₹${(detailItem.finalPayableAmount || 0).toLocaleString('en-IN')}`} color={colors.primary} bold />
                  <DRow label="Status"        value={detailItem.paymentStatus} />
                  <DRow label="Cycle"         value={detailItem.paymentCycle || '—'} />
                </DSec>

                <TouchableOpacity style={ss.closeBtn} onPress={() => setDetailItem(null)}>
                  <Text style={ss.closeBtnText}>Close</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─── Small helpers ────────────────────────────────────────────────────────────
const SummaryItem = ({ label, value, valueColor }) => (
  <View style={{ alignItems: 'center' }}>
    <Text style={ss.summaryLabel}>{label}</Text>
    <Text style={[ss.summaryValue, valueColor && { color: valueColor }]}>{value}</Text>
  </View>
);

const DSec = ({ title, children }) => (
  <View style={ss.dSec}>
    <Text style={ss.dSecTitle}>{title}</Text>
    {children}
  </View>
);

const DRow = ({ label, value, color, bold }) => (
  <View style={ss.dRow}>
    <Text style={ss.dLabel}>{label}</Text>
    <Text style={[ss.dValue, color && { color }, bold && { fontWeight: '800' }]}>{value}</Text>
  </View>
);

// ─── Screen styles ────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  dateRangeCard: {
    marginHorizontal: spacing.md, marginTop: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.md,
    padding: spacing.md, ...shadows.card,
    borderWidth: 1, borderColor: colors.border,
  },
  dateRangeTitle: { fontSize: 13, fontWeight: '800', color: colors.text, marginBottom: 10 },
  dateRow:   { flexDirection: 'row', gap: 10, alignItems: 'flex-end' },
  dateSep:   { paddingBottom: 10 },
  dateSepText: { fontSize: 16, color: colors.textMuted, fontWeight: '700' },
  dateRangeSub: { fontSize: 11, color: colors.primary, fontWeight: '600', marginTop: 8, textAlign: 'center' },

  filterRow: { flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: 6 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border },
  filterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterBtnText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  filterBtnTextActive: { color: '#fff' },

  summaryCard: { marginHorizontal: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: 8, ...shadows.card },
  summaryTitle: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginBottom: 8 },
  summaryRow:   { flexDirection: 'row', justifyContent: 'space-around' },
  summaryLabel: { fontSize: 11, color: colors.textMuted },
  summaryValue: { fontSize: 15, fontWeight: '800', color: colors.text },

  generateRow: { marginHorizontal: spacing.md, marginBottom: 8 },
  generateBtn: { backgroundColor: '#7c3aed', borderRadius: radius.md, paddingVertical: 12, alignItems: 'center' },
  generateBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  generateHint: { fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 5 },

  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 60, fontSize: 15, paddingHorizontal: 30, lineHeight: 24 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: spacing.lg, maxHeight: '90%' },
  modalTitle: { fontSize: typography.h3, fontWeight: '800', color: colors.text },
  modalSub:   { fontSize: 13, color: colors.textMuted, marginBottom: spacing.md },
  dSec:       { backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, padding: spacing.md, marginBottom: 10 },
  dSecTitle:  { fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  dRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  dLabel:     { fontSize: 14, color: colors.textMuted },
  dValue:     { fontSize: 14, fontWeight: '600', color: colors.text },
  closeBtn:   { backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: 13, alignItems: 'center', marginTop: 8, marginBottom: 10 },
  closeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

export default PayableScreen;
