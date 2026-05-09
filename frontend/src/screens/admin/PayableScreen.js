import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  Modal, Alert, ActivityIndicator, RefreshControl, ScrollView
} from 'react-native';
import { useSelector } from 'react-redux';
import { payableApi, farmerApi } from '../../api/api';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { ROLE_ADMIN } from '../../constants/roles';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const STATUS_COLORS = { Pending: colors.primary, Cleared: colors.success, 'Carry Forward': '#f59e0b' };

const PayableScreen = ({ centerId, centerName }) => {
  const { token, user } = useSelector((s) => s.auth);
  const isAdmin = user?.role === ROLE_ADMIN;

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [statusFilter, setStatusFilter] = useState('');
  const [payables, setPayables] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  const loadPayables = useCallback(async () => {
    setLoading(true);
    try {
      const params = { month, year };
      if (centerId) params.centerId = centerId;
      if (statusFilter) params.status = statusFilter;
      const res = await payableApi.getAll(token, params);
      setPayables(res.data.data || []);

      // Load center summary if centerId provided
      if (centerId) {
        try {
          const repRes = await payableApi.getCenterReport(centerId, token, { month, year });
          setSummary(repRes.data.data?.summary || null);
        } catch { /* ignore */ }
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }, [token, centerId, month, year, statusFilter]);

  useEffect(() => { loadPayables(); }, [loadPayables]);

  const generateAllPayables = async () => {
    if (!centerId) {
      Alert.alert('Info', 'Please open from a specific center to auto-generate payables.');
      return;
    }
    setGenerating(true);
    try {
      const farmersRes = await farmerApi.getByCenter(centerId, token);
      const farmers = farmersRes.data.data || farmersRes.data || [];
      let generated = 0;
      for (const f of farmers) {
        try {
          await payableApi.generate({ farmerId: f._id, centerId, month, year }, token);
          generated++;
        } catch { /* skip failed */ }
      }
      Alert.alert('Done', `Generated payables for ${generated} farmers.`);
      loadPayables();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setGenerating(false);
  };

  const handleClear = (item) => {
    Alert.alert(
      'Mark as Cleared',
      `Mark payment of ₹${Math.abs(item.finalPayableAmount).toLocaleString('en-IN')} as cleared for ${item.farmerId?.fullName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear', onPress: async () => {
            try {
              await payableApi.clear(item._id, token);
              loadPayables();
            } catch (e) { Alert.alert('Error', e.message); }
          }
        }
      ]
    );
  };

  const handleDelete = (item) => {
    if (item.finalPayableAmount !== 0) {
      Alert.alert('Cannot Delete', 'Can only delete payable records where Final Payable Amount = ₹0.');
      return;
    }
    Alert.alert('Delete Payable', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await payableApi.remove(item._id, token);
            loadPayables();
          } catch (e) { Alert.alert('Error', e.message); }
        }
      }
    ]);
  };

  const renderStatusBadge = (status) => (
    <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[status] || colors.primary) + '20' }]}>
      <Text style={[styles.statusText, { color: STATUS_COLORS[status] || colors.primary }]}>{status}</Text>
    </View>
  );

  const renderPayable = ({ item }) => {
    const isPayable = item.finalPayableAmount > 0;
    const isCarry = item.paymentStatus === 'Carry Forward';
    return (
      <TouchableOpacity style={styles.card} onPress={() => setDetailItem(item)}>
        <View style={styles.cardRow}>
          <Text style={styles.farmerName}>{item.farmerId?.fullName || '—'}</Text>
          {renderStatusBadge(item.paymentStatus)}
        </View>
        <Text style={styles.cardCode}>{item.farmerId?.farmerCode || item.farmerCode} · {item.collectionCenterId?.name || centerName}</Text>

        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Milk Income</Text>
            <Text style={styles.metricValue}>₹{item.totalMilkIncome?.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Advance</Text>
            <Text style={[styles.metricValue, { color: colors.danger }]}>-₹{item.totalAdvanceDeducted?.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Food</Text>
            <Text style={[styles.metricValue, { color: '#f59e0b' }]}>-₹{item.totalFoodExpenses?.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        <View style={[styles.payableResultBox, { backgroundColor: isPayable ? '#ecfdf5' : isCarry ? '#fffbeb' : '#eff6ff' }]}>
          {isPayable ? (
            <>
              <Text style={[styles.payableLabel, { color: colors.success }]}>💰 Payable to Farmer</Text>
              <Text style={[styles.payableAmount, { color: colors.success }]}>₹{item.finalPayableAmount?.toLocaleString('en-IN')}</Text>
            </>
          ) : isCarry ? (
            <>
              <Text style={[styles.payableLabel, { color: '#f59e0b' }]}>⏭ Carry Forward Balance</Text>
              <Text style={[styles.payableAmount, { color: '#f59e0b' }]}>₹{item.remainingAdvanceBalance?.toLocaleString('en-IN')}</Text>
            </>
          ) : (
            <>
              <Text style={[styles.payableLabel, { color: colors.primary }]}>✓ Cleared</Text>
              <Text style={[styles.payableAmount, { color: colors.primary }]}>₹0</Text>
            </>
          )}
        </View>

        {isAdmin && item.paymentStatus === 'Pending' && (
          <TouchableOpacity style={styles.clearBtn} onPress={() => handleClear(item)}>
            <Text style={styles.clearBtnText}>Mark as Cleared</Text>
          </TouchableOpacity>
        )}
        {isAdmin && item.finalPayableAmount === 0 && (
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
            <Text style={styles.deleteBtnText}>Delete Record</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Month / Year Picker */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {MONTHS.map((m, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.monthBtn, month === i + 1 && styles.monthBtnActive]}
              onPress={() => setMonth(i + 1)}
            >
              <Text style={[styles.monthBtnText, month === i + 1 && styles.monthBtnTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.filterRow}>
        {['', 'Pending', 'Cleared', 'Carry Forward'].map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterBtn, statusFilter === s && styles.filterBtnActive]}
            onPress={() => setStatusFilter(s)}
          >
            <Text style={[styles.filterBtnText, statusFilter === s && styles.filterBtnTextActive]}>{s || 'All'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary card */}
      {summary && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Center Summary — {MONTHS[month - 1]} {year}</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}><Text style={styles.summaryLabel}>Farmers</Text><Text style={styles.summaryValue}>{summary.totalFarmers}</Text></View>
            <View style={styles.summaryItem}><Text style={styles.summaryLabel}>Milk Income</Text><Text style={styles.summaryValue}>₹{summary.totalMilkIncome?.toLocaleString('en-IN')}</Text></View>
            <View style={styles.summaryItem}><Text style={styles.summaryLabel}>Total Payable</Text><Text style={[styles.summaryValue, { color: colors.success }]}>₹{summary.totalPayable?.toLocaleString('en-IN')}</Text></View>
          </View>
        </View>
      )}

      {/* Auto-generate button (admin only) */}
      {isAdmin && (
        <TouchableOpacity style={styles.generateBtn} onPress={generateAllPayables} disabled={generating}>
          {generating ? <ActivityIndicator color="#fff" /> : <Text style={styles.generateBtnText}>⚡ Auto-Generate Payables for {MONTHS[month - 1]} {year}</Text>}
        </TouchableOpacity>
      )}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} size="large" />
      ) : (
        <FlatList
          data={payables}
          keyExtractor={(i) => i._id}
          renderItem={renderPayable}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadPayables().finally(() => setRefreshing(false)); }} />}
          ListEmptyComponent={<Text style={styles.empty}>No payable records for this month. Tap "Auto-Generate" to create.</Text>}
        />
      )}

      {/* Detail Modal */}
      <Modal visible={!!detailItem} animationType="slide" transparent onRequestClose={() => setDetailItem(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {detailItem && (
              <ScrollView>
                <Text style={styles.modalTitle}>{detailItem.farmerId?.fullName}</Text>
                <Text style={styles.modalSub}>{MONTHS[(detailItem.month || 1) - 1]} {detailItem.year} · {detailItem.collectionCenterId?.name || centerName}</Text>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Milk Collection</Text>
                  <DetailRow label="Total Quantity" value={`${detailItem.totalMilkQuantity?.toFixed(2)} L`} />
                  <DetailRow label="Total Income" value={`₹${detailItem.totalMilkIncome?.toLocaleString('en-IN')}`} color={colors.success} />
                </View>

                {(detailItem.weeklyBreakdown || []).length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Weekly Breakdown</Text>
                    {detailItem.weeklyBreakdown.map((w) => (
                      <DetailRow key={w.week} label={`Week ${w.week}`} value={`${w.milkQuantity?.toFixed(1)}L · ₹${w.milkIncome?.toLocaleString('en-IN')}`} />
                    ))}
                  </View>
                )}

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Deductions</Text>
                  <DetailRow label="Advance Given" value={`₹${detailItem.totalAdvanceDeducted?.toLocaleString('en-IN')}`} color={colors.danger} />
                  <DetailRow label="Food Expenses" value={`₹${detailItem.totalFoodExpenses?.toLocaleString('en-IN')}`} color="#f59e0b" />
                  <DetailRow label="Total Deductions" value={`₹${((detailItem.totalAdvanceDeducted || 0) + (detailItem.totalFoodExpenses || 0)).toLocaleString('en-IN')}`} color={colors.danger} bold />
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Final Settlement</Text>
                  {detailItem.finalPayableAmount > 0 ? (
                    <DetailRow label="Pay to Farmer" value={`₹${detailItem.finalPayableAmount?.toLocaleString('en-IN')}`} color={colors.success} bold />
                  ) : (
                    <DetailRow label="Carry Forward Balance" value={`₹${detailItem.remainingAdvanceBalance?.toLocaleString('en-IN')}`} color="#f59e0b" bold />
                  )}
                  <DetailRow label="Status" value={detailItem.paymentStatus} />
                </View>

                <TouchableOpacity style={styles.closeBtn} onPress={() => setDetailItem(null)}>
                  <Text style={styles.closeBtnText}>Close</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const DetailRow = ({ label, value, color, bold }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, color && { color }, bold && { fontWeight: '800' }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  filterBar: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  monthBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: radius.sm, marginRight: 6,
    backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border
  },
  monthBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  monthBtnText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  monthBtnTextActive: { color: '#fff' },
  filterRow: { flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: 6, flexWrap: 'wrap' },
  filterBtn: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: radius.sm, backgroundColor: colors.surfaceMuted,
    borderWidth: 1, borderColor: colors.border
  },
  filterBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  filterBtnText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  filterBtnTextActive: { color: '#fff' },
  summaryCard: {
    marginHorizontal: spacing.md, backgroundColor: colors.surface,
    borderRadius: radius.md, padding: spacing.md, marginBottom: 8, ...shadows.card
  },
  summaryTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: colors.textMuted },
  summaryValue: { fontSize: 15, fontWeight: '800', color: colors.text },
  generateBtn: {
    marginHorizontal: spacing.md, marginBottom: 8,
    backgroundColor: '#7c3aed', borderRadius: radius.md,
    paddingVertical: 12, alignItems: 'center'
  },
  generateBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.md,
    padding: spacing.md, marginBottom: 12, ...shadows.card
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  farmerName: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 12, fontWeight: '700' },
  cardCode: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  metricsRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  metricBox: {
    flex: 1, backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm, padding: 8, alignItems: 'center'
  },
  metricLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  metricValue: { fontSize: 14, fontWeight: '800', color: colors.text, marginTop: 2 },
  payableResultBox: {
    borderRadius: radius.sm, padding: 12, marginTop: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  payableLabel: { fontSize: 13, fontWeight: '700' },
  payableAmount: { fontSize: 18, fontWeight: '900' },
  clearBtn: {
    marginTop: 10, backgroundColor: colors.success + '20',
    borderRadius: radius.sm, paddingVertical: 9, alignItems: 'center'
  },
  clearBtnText: { color: colors.success, fontWeight: '700', fontSize: 13 },
  deleteBtn: {
    marginTop: 6, backgroundColor: colors.danger + '15',
    borderRadius: radius.sm, paddingVertical: 8, alignItems: 'center'
  },
  deleteBtnText: { color: colors.danger, fontWeight: '700', fontSize: 13 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 60, fontSize: 15, paddingHorizontal: 30 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalContainer: {
    backgroundColor: colors.surface, borderTopLeftRadius: 22,
    borderTopRightRadius: 22, padding: spacing.lg, maxHeight: '88%'
  },
  modalTitle: { fontSize: typography.h3, fontWeight: '800', color: colors.text },
  modalSub: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.md },
  detailSection: {
    backgroundColor: colors.surfaceMuted, borderRadius: radius.sm,
    padding: spacing.md, marginBottom: 10
  },
  detailSectionTitle: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginBottom: 8, textTransform: 'uppercase' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  detailLabel: { fontSize: 14, color: colors.textMuted },
  detailValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  closeBtn: {
    backgroundColor: colors.primary, borderRadius: radius.sm,
    paddingVertical: 13, alignItems: 'center', marginTop: 8, marginBottom: 10
  },
  closeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 }
});

export default PayableScreen;
