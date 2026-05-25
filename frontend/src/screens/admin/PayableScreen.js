import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  Modal, Alert, ActivityIndicator, RefreshControl, ScrollView, Switch, Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSelector } from 'react-redux';
import { payableApi, farmerApi } from '../../api/api';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { ROLE_ADMIN, ROLE_COLLECTION_HEAD } from '../../constants/roles';
import { Calendar } from 'lucide-react-native';

const round2      = (value) => Number(Number(value || 0).toFixed(2));
const fmtMoney    = (value) => round2(value).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const today      = () => new Date().toISOString().split('T')[0];
const monthStart = () => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; };
const fmtDate    = (iso) => iso ? new Date(iso).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';

// ─── DateInput ────────────────────────────────────────────────────────────────
const DateInput = ({ label, value, onChange }) => {
  const [show, setShow] = useState(false);
  const todayDate = new Date();
  const dateObj = value ? new Date(value) : todayDate;
  const display = value
    ? new Date(value).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
    : 'Select date';
  return (
    <View style={{ flex: 1 }}>
      <Text style={di.label}>{label}</Text>
      <TouchableOpacity style={di.row} onPress={() => setShow(true)}>
        <Calendar size={13} color={colors.primary} />
        <Text style={[di.input, { color: value ? colors.text : colors.textMuted }]}>{display}</Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={dateObj}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={todayDate}
          onChange={(_, d) => { setShow(false); if (d) onChange(d.toISOString().split('T')[0]); }}
        />
      )}
    </View>
  );
};
const di = StyleSheet.create({
  label: { fontSize: 11, fontWeight: '600', color: colors.textMuted, marginBottom: 4, textTransform: 'uppercase' },
  row:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surfaceMuted,
           borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 9, borderWidth: 1, borderColor: colors.border },
  input: { flex: 1, fontSize: 13 },
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
const FarmerPayableCard = ({ item, centerName, isAdmin, isCollectionHead, fromDate, toDate, centerId, token, onRefresh, onViewDetail }) => {
  const isPaid = item.paymentStatus === 'Paid';
  const isForwarded = item.adminApprovalStatus === 'Forwarded';
  const canToggleDeductions = isCollectionHead && !isForwarded;

  const [deductAdvance, setDeductAdvance] = useState(item.deductAdvance ?? false);
  const [deductFood,    setDeductFood]    = useState(item.deductFood    ?? false);
  const [applying,  setApplying]  = useState(false);
  const [paying,    setPaying]    = useState(false);
  const [forwarding, setForwarding] = useState(false);

  const milkIncome     = item.totalMilkIncome      || 0;
  const advanceAmt     = item.totalAdvanceRemaining || 0;
  const foodAmt        = item.totalFoodPending      || 0;
  const liveDeductFood = round2(deductFood ? Math.min(foodAmt, milkIncome) : 0);
  const milkAfterFood  = round2(Math.max(0, milkIncome - liveDeductFood));
  const liveDeductAdv  = round2(deductAdvance ? Math.min(advanceAmt, milkAfterFood) : 0);
  const livePayable    = round2(Math.max(0, milkAfterFood - liveDeductAdv));
  const liveAdvStillOwed = round2(Math.max(0, advanceAmt - liveDeductAdv));
  const displayAdvanceDeducted = isAdmin || isForwarded || isPaid ? round2(item.totalAdvanceDeducted) : liveDeductAdv;
  const displayFoodDeducted = isAdmin || isForwarded || isPaid ? round2(item.totalFoodExpenses) : liveDeductFood;
  const displayPayable = isAdmin || isForwarded || isPaid ? round2(item.finalPayableAmount) : livePayable;
  const displayAdvanceStillOwed = isAdmin || isForwarded || isPaid ? round2(item.remainingAdvanceBalance) : liveAdvStillOwed;
  const togglesChanged = deductAdvance !== (item.deductAdvance ?? false) || deductFood !== (item.deductFood ?? false);

  const doGenerate = async (da, df) => {
    await payableApi.generate({
      farmerId: item.farmerId?._id || item.farmerId,
      centerId: item.collectionCenterId?._id || centerId,
      fromDate, toDate, deductAdvance: da, deductFood: df,
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
      if (res.data?.alreadyPaid) Alert.alert('Already Paid', 'This cycle is already marked as Paid.');
      onRefresh();
    } catch (e) { Alert.alert('Error', e.message); }
    setApplying(false);
  };

  const handleMarkPaid = () => {
    const lines = [
      `Pay ₹${fmtMoney(displayPayable)} to ${item.farmerId?.fullName}?`,
      displayAdvanceDeducted > 0 ? `• Advance recovered: ₹${fmtMoney(displayAdvanceDeducted)}  (₹${fmtMoney(displayAdvanceStillOwed)} still owed)` : '',
      displayFoodDeducted > 0 ? `• Food settled: ₹${fmtMoney(displayFoodDeducted)}` : '',
    ].filter(Boolean).join('\n');
    Alert.alert('Confirm Payment', lines, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm & Pay', onPress: async () => {
          setPaying(true);
          try {
            if (togglesChanged) await doGenerate(deductAdvance, deductFood);
            await payableApi.markPaid(item._id, token);
            onRefresh();
          } catch (e) { Alert.alert('Error', e.message); }
          setPaying(false);
        }
      },
    ]);
  };

  const handleForward = async () => {
    setForwarding(true);
    try {
      if (togglesChanged) await doGenerate(deductAdvance, deductFood);
      await payableApi.forward(item._id, token);
      Alert.alert('Success', 'Payment details forwarded to Admin');
      onRefresh();
    } catch (e) { Alert.alert('Error', e.message); }
    setForwarding(false);
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
          <Text style={cs.meta}>{item.farmerId?.farmerCode || item.farmerCode}{' · '}{item.collectionCenterId?.name || centerName}</Text>
        </View>
        <View style={[cs.badge, { backgroundColor: isPaid ? colors.successLight : colors.primaryXLight }]}>
          <Text style={[cs.badgeText, { color: isPaid ? colors.success : colors.primary }]}>
            {isPaid ? 'Paid' : isForwarded ? 'Forwarded' : 'Pending'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Milk Income + Final Payable — side by side */}
      <View style={cs.amountsRow}>
        <View style={[cs.amountBox, { backgroundColor: colors.successLight, marginRight: 5 }]}>
          <Text style={cs.amountLabel}>🥛 Milk Income</Text>
          <Text style={[cs.amountValue, { color: colors.success }]}>₹{fmtMoney(milkIncome)}</Text>
        </View>
        <View style={[cs.amountBox, { backgroundColor: isPaid ? colors.successLight : '#eff6ff', marginLeft: 5 }]}>
          <Text style={[cs.amountLabel, { color: isPaid ? colors.success : colors.primary }]}>
            {isPaid ? '✓ Paid' : '💰 Payable'}
          </Text>
          <Text style={[cs.amountValue, { color: isPaid ? colors.success : colors.primary }]}>
            ₹{fmtMoney(displayPayable)}
          </Text>
        </View>
      </View>

      {/* Formula line if deductions exist */}
      {!isPaid && (displayFoodDeducted > 0 || displayAdvanceDeducted > 0) && (
        <Text style={cs.formula}>
          ₹{fmtMoney(milkIncome)} milk
          {displayFoodDeducted > 0 ? ` - ₹${fmtMoney(displayFoodDeducted)} food` : ''}
          {displayAdvanceDeducted > 0 ? ` - ₹${fmtMoney(displayAdvanceDeducted)} advance` : ''}
          {' = ₹'}{fmtMoney(displayPayable)}
        </Text>
      )}
      {!isPaid && deductAdvance && displayAdvanceStillOwed > 0 && (
        <Text style={[cs.formula, { color: colors.danger }]}>
          ₹{fmtMoney(displayAdvanceStillOwed)} advance still owed after this cycle
        </Text>
      )}

      {/* Deduction toggles — Collection Head only */}
      {canToggleDeductions && !isPaid && (
        <View style={cs.togglesBox}>
          <Text style={cs.togglesTitle}>Deductions</Text>
          <View style={cs.toggleRow}>
            <View style={cs.toggleLeft}>
              <View style={[cs.dot, { backgroundColor: colors.danger }]} />
              <View style={{ flex: 1 }}>
                <Text style={cs.toggleLabel}>Deduct Advance</Text>
                {deductAdvance
                  ? <Text style={[cs.toggleSub, { color: colors.danger }]}>
                      Recover ₹{fmtMoney(liveDeductAdv)}
                      {liveAdvStillOwed > 0 ? `  ·  ₹${fmtMoney(liveAdvStillOwed)} still owed` : '  ·  Fully cleared'}
                    </Text>
                  : advanceAmt > 0
                    ? <Text style={[cs.toggleSub, { color: colors.textMuted }]}>Outstanding: ₹{fmtMoney(advanceAmt)}</Text>
                    : <Text style={[cs.toggleSub, { color: colors.textMuted }]}>No advance</Text>
                }
              </View>
            </View>
            <Switch value={deductAdvance} onValueChange={setDeductAdvance}
              trackColor={{ false: colors.border, true: colors.danger + '55' }}
              thumbColor={deductAdvance ? colors.danger : colors.textDisabled} />
          </View>
          <View style={[cs.toggleRow, { borderBottomWidth: 0 }]}>
            <View style={cs.toggleLeft}>
              <View style={[cs.dot, { backgroundColor: '#f59e0b' }]} />
              <View style={{ flex: 1 }}>
                <Text style={cs.toggleLabel}>Deduct Food</Text>
                {deductFood
                  ? <Text style={[cs.toggleSub, { color: '#f59e0b' }]}>- ₹{fmtMoney(liveDeductFood)}</Text>
                  : foodAmt > 0
                    ? <Text style={[cs.toggleSub, { color: colors.textMuted }]}>Pending: ₹{fmtMoney(foodAmt)}</Text>
                    : <Text style={[cs.toggleSub, { color: colors.textMuted }]}>No food pending</Text>
                }
              </View>
            </View>
            <Switch value={deductFood} onValueChange={setDeductFood}
              trackColor={{ false: colors.border, true: '#f59e0b55' }}
              thumbColor={deductFood ? '#f59e0b' : colors.textDisabled} />
          </View>
          {togglesChanged && (
            <TouchableOpacity style={cs.applyBtn} onPress={handleApply} disabled={applying}>
              {applying ? <ActivityIndicator size="small" color="#fff" /> : <Text style={cs.applyBtnText}>Apply Changes</Text>}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Actions */}
      {isCollectionHead && !isPaid && (
        <TouchableOpacity
          style={[cs.forwardBtn, isForwarded && cs.forwardedBtn]}
          onPress={handleForward}
          disabled={forwarding || isForwarded}
        >
          {forwarding
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={cs.forwardBtnText}>{isForwarded ? 'Forwarded to Admin' : 'Forward to Admin'}</Text>
          }
        </TouchableOpacity>
      )}

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
        <TouchableOpacity style={[cs.delBtn, { marginTop: 6 }]} onPress={handleDelete}>
          <Text style={cs.delBtnText}>Delete Record</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const cs = StyleSheet.create({
  card: {
    backgroundColor: colors.surface, borderRadius: radius.md,
    padding: spacing.sm, marginBottom: 8, ...shadows.card,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 7 },
  farmerName: { fontSize: 14, fontWeight: '700', color: colors.text },
  meta:  { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  badge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, marginLeft: 8, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '700' },

  // ── Side-by-side amounts ──
  amountsRow: { flexDirection: 'row', marginBottom: 5 },
  amountBox: {
    flex: 1, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 8,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  amountLabel: { fontSize: 12, fontWeight: '700', color: colors.success },
  amountValue: { fontSize: 15, fontWeight: '900' },

  formula: { fontSize: 10, color: colors.textMuted, marginBottom: 5 },

  togglesBox: {
    backgroundColor: '#fafafa', borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border,
    padding: 10, marginTop: 4, marginBottom: 6,
  },
  togglesTitle: {
    fontSize: 10, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  toggleLabel: { fontSize: 12, fontWeight: '600', color: colors.text },
  toggleSub: { fontSize: 10, fontWeight: '600', marginTop: 1 },
  applyBtn: { marginTop: 8, backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: 8, alignItems: 'center' },
  applyBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  actionsRow: { flexDirection: 'row', gap: 7, marginTop: 4 },
  forwardBtn: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: 10, alignItems: 'center', marginTop: 4 },
  forwardedBtn: { backgroundColor: colors.textMuted },
  forwardBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  payBtn: { flex: 2, backgroundColor: colors.success + '20', borderRadius: radius.sm, paddingVertical: 9, alignItems: 'center' },
  payBtnText: { color: colors.success, fontWeight: '700', fontSize: 13 },
  delBtn: { flex: 1, backgroundColor: colors.danger + '15', borderRadius: radius.sm, paddingVertical: 9, alignItems: 'center' },
  delBtnText: { color: colors.danger, fontWeight: '700', fontSize: 13 },
});

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

// ─── Main PayableScreen ───────────────────────────────────────────────────────
const PayableScreen = ({ centerId: centerIdProp, centerName }) => {
  const { token, user } = useSelector((s) => s.auth);
  const isAdmin = user?.role === ROLE_ADMIN;
  const isCollectionHead = user?.role === ROLE_COLLECTION_HEAD;

  const centerId = isCollectionHead
    ? (typeof user?.assignedCenter === 'object'
        ? user?.assignedCenter?._id?.toString() || user?.assignedCenter?.toString()
        : user?.assignedCenter?.toString())
    : (centerIdProp
        ? (typeof centerIdProp === 'object'
            ? centerIdProp?._id?.toString() || centerIdProp?.toString()
            : centerIdProp)
        : undefined);

  const [fromDate,     setFromDate]     = useState(monthStart);
  const [toDate,       setToDate]       = useState(today);
  const [statusFilter, setStatusFilter] = useState('');
  const [payables,     setPayables]     = useState([]);
  const [summary,      setSummary]      = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [refreshing,   setRefreshing]   = useState(false);
  const [generating,   setGenerating]   = useState(false);
  const [detailItem,   setDetailItem]   = useState(null);

  const fromDateObj = fromDate ? new Date(fromDate) : new Date();
  const month = fromDateObj.getMonth() + 1;
  const year  = fromDateObj.getFullYear();

  const loadPayables = useCallback(async () => {
    setLoading(true);
    try {
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

  const datesValid = () => {
    if (!fromDate || !toDate) { Alert.alert('Validation', 'Please enter both From and To dates'); return false; }
    if (fromDate > toDate)    { Alert.alert('Validation', 'From date must be before To date');    return false; }
    return true;
  };

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
            farmerId: f._id, centerId, fromDate, toDate,
            deductAdvance: false, deductFood: false,
          }, token);
          if (r.data?.alreadyPaid) skipped++; else created++;
        } catch { /* skip */ }
      }
      Alert.alert('Done', skipped > 0
        ? `Created: ${created}  ·  Skipped (already paid): ${skipped}\nUse toggles on each card to apply deductions.`
        : `Payables created for ${created} farmers.\nUse toggles on each card to apply deductions.`);
      loadPayables();
    } catch (e) { Alert.alert('Error', e.message); }
    setGenerating(false);
  };

  const ListHeader = (
    <>
      <View style={ss.dateRangeCard}>
        <View style={ss.dateRow}>
          <DateInput label="From Date" value={fromDate} onChange={setFromDate} />
          <View style={ss.dateSep}><Text style={ss.dateSepText}>→</Text></View>
          <DateInput label="To Date"   value={toDate}   onChange={setToDate}   />
        </View>
      </View>

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

      {summary && (
        <View style={ss.summaryCard}>
          <View style={ss.summaryRow}>
            <SummaryItem label="Farmers"       value={summary.totalFarmers} />
            <SummaryItem label="Milk Income"   value={`₹${fmtMoney(summary.totalMilkIncome)}`} />
            <SummaryItem label="Total Payable" value={`₹${fmtMoney(summary.totalPayable)}`} valueColor={colors.success} />
          </View>
        </View>
      )}

      {isCollectionHead && (
        <View style={ss.generateRow}>
          <TouchableOpacity style={ss.generateBtn} onPress={generateAll} disabled={generating}>
            {generating
              ? <ActivityIndicator color="#fff" />
              : <Text style={ss.generateBtnText}>⚡ Generate Payables for Date Range</Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {loading && <ActivityIndicator style={{ marginTop: 30, marginBottom: 16 }} color={colors.primary} size="large" />}
    </>
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={loading ? [] : payables}
        keyExtractor={(i) => i._id}
        renderItem={({ item }) => (
          <FarmerPayableCard
            item={item}
            centerName={centerName}
            isAdmin={isAdmin}
            isCollectionHead={isCollectionHead}
            fromDate={fromDate}
            toDate={toDate}
            centerId={centerId}
            token={token}
            onRefresh={loadPayables}
            onViewDetail={setDetailItem}
          />
        )}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadPayables().finally(() => setRefreshing(false)); }}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <Text style={ss.empty}>
              {isAdmin
                ? 'No forwarded payment records for this period.'
                : 'No payable records for this period.\nSet a date range and tap "Generate Payables".'}
            </Text>
          ) : null
        }
      />

      {/* Detail Modal */}
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
                  <DRow label="Date Range"   value={`${fmtDate(detailItem.fromDate)} – ${fmtDate(detailItem.toDate)}`} />
                  <DRow label="Milk Days"    value={`${detailItem.totalMilkDays || 0} days`} />
                  <DRow label="Total Liters" value={`${(detailItem.totalMilkQuantity || 0).toFixed(2)} L`} />
                  <DRow label="Milk Income"  value={`₹${fmtMoney(detailItem.totalMilkIncome)}`} color={colors.success} bold />
                </DSec>
                {(detailItem.weeklyBreakdown || []).length > 0 && (
                  <DSec title="Weekly Breakdown">
                    {detailItem.weeklyBreakdown.map((w) => (
                      <DRow key={w.week} label={`Week ${w.week}`}
                        value={`${(w.milkQuantity || 0).toFixed(1)}L · ₹${fmtMoney(w.milkIncome)}`} />
                    ))}
                  </DSec>
                )}
                <DSec title="Pending Amounts">
                  <DRow label="Food Pending"      value={`₹${fmtMoney(detailItem.totalFoodPending)}`}      color="#f59e0b" />
                  <DRow label="Advance Remaining" value={`₹${fmtMoney(detailItem.totalAdvanceRemaining)}`} color={colors.danger} />
                </DSec>
                <DSec title="Deductions Applied">
                  <DRow label="Advance Recovered"
                    value={detailItem.deductAdvance ? `₹${fmtMoney(detailItem.totalAdvanceDeducted)}` : 'Not deducted'}
                    color={detailItem.deductAdvance ? colors.danger : colors.textMuted} />
                  <DRow label="Food Deducted"
                    value={detailItem.deductFood ? `₹${fmtMoney(detailItem.totalFoodExpenses)}` : 'Not deducted'}
                    color={detailItem.deductFood ? '#f59e0b' : colors.textMuted} />
                  <DRow label="Advance Still Owed"
                    value={`₹${fmtMoney(detailItem.remainingAdvanceBalance)}`}
                    color={colors.danger} />
                </DSec>
                <DSec title="Final Settlement">
                  <DRow label="Final Payable" value={`₹${fmtMoney(detailItem.finalPayableAmount)}`} color={colors.primary} bold />
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

// ─── Screen styles ────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  dateRangeCard: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radius.md,
    padding: spacing.sm, ...shadows.card, borderWidth: 1, borderColor: colors.border,
  },
  dateRow:     { flexDirection: 'row', gap: 10, alignItems: 'flex-end' },
  dateSep:     { paddingBottom: 10 },
  dateSepText: { fontSize: 16, color: colors.textMuted, fontWeight: '700' },

  filterRow: { flexDirection: 'row', paddingVertical: spacing.xs, gap: 6 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border },
  filterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterBtnText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  filterBtnTextActive: { color: '#fff' },

  summaryCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm, marginBottom: 6, ...shadows.card },
  summaryRow:  { flexDirection: 'row', justifyContent: 'space-around' },
  summaryLabel: { fontSize: 11, color: colors.textMuted },
  summaryValue: { fontSize: 15, fontWeight: '800', color: colors.text },

  generateRow: { marginBottom: 6 },
  generateBtn: { backgroundColor: '#7c3aed', borderRadius: radius.md, paddingVertical: 11, alignItems: 'center' },
  generateBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 60, fontSize: 15, paddingHorizontal: 30, lineHeight: 24 },

  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: spacing.lg, maxHeight: '90%' },
  modalTitle:  { fontSize: typography.h3, fontWeight: '800', color: colors.text },
  modalSub:    { fontSize: 13, color: colors.textMuted, marginBottom: spacing.md },
  dSec:        { backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, padding: spacing.md, marginBottom: 10 },
  dSecTitle:   { fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  dRow:        { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  dLabel:      { fontSize: 14, color: colors.textMuted },
  dValue:      { fontSize: 14, fontWeight: '600', color: colors.text },
  closeBtn:    { backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: 13, alignItems: 'center', marginTop: 8, marginBottom: 10 },
  closeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

export default PayableScreen;
