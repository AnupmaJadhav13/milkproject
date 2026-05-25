import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, Modal, ScrollView, Alert, ActivityIndicator, RefreshControl, Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import { useSelector } from 'react-redux';
import { advanceApi, farmerApi, centerApi } from '../../api/api';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { ROLE_ADMIN, ROLE_COLLECTION_HEAD } from '../../constants/roles';

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'UPI'];

const AdvanceScreen = ({ centerId: centerIdProp, centerName }) => {
  const { token, user } = useSelector((s) => s.auth);
  const isAdmin = user?.role === ROLE_ADMIN;
  const isCollectionHead = user?.role === ROLE_COLLECTION_HEAD;
  const canManage = isAdmin || isCollectionHead; // both can add/manage advances

  // Normalise centerId — collection head always uses their own assignedCenter
  const centerId = isCollectionHead
    ? (typeof user?.assignedCenter === 'object'
        ? user?.assignedCenter?._id?.toString() || user?.assignedCenter?.toString()
        : user?.assignedCenter?.toString())
    : (centerIdProp
        ? (typeof centerIdProp === 'object'
            ? centerIdProp?._id?.toString() || centerIdProp?.toString()
            : centerIdProp)
        : undefined);

  const [advances, setAdvances]           = useState([]);
  const [loading, setLoading]             = useState(false);
  const [refreshing, setRefreshing]       = useState(false);
  const [submitting, setSubmitting]       = useState(false);

  // ── Add new advance modal ──
  const [showAddModal, setShowAddModal]   = useState(false);
  const [farmerSearch, setFarmerSearch]   = useState('');
  const [farmerResults, setFarmerResults] = useState([]);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [centerResults, setCenterResults] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [farmerSearchLoading, setFarmerSearchLoading] = useState(false);
  const [addForm, setAddForm] = useState({
    advanceAmount: '',
    advanceDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    notes: ''
  });
  const [showAdvanceDatePicker, setShowAdvanceDatePicker] = useState(false);

  // ── Add Amount to existing advance modal ──
  const [showAddAmountModal, setShowAddAmountModal] = useState(false);
  const [addAmountTarget, setAddAmountTarget]       = useState(null);
  const [extraAmount, setExtraAmount]               = useState('');
  const [extraNotes, setExtraNotes]                 = useState('');

  // ── Summary totals ──
  const totalGiven     = advances.reduce((s, a) => s + (a.advanceAmount || 0), 0);
  const totalRemaining = advances.filter(a => a.status === 'Active').reduce((s, a) => s + (a.remainingAmount || 0), 0);
  const totalSettled   = advances.filter(a => a.status === 'Settled').length;

  const loadAdvances = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (centerId) params.centerId = centerId;
      const res = await advanceApi.getAll(token, params);
      setAdvances(res.data.data || []);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }, [token, centerId]);

  useEffect(() => { loadAdvances(); }, [loadAdvances]);

  // ── Farmer search ──
  const searchFarmers = async (query) => {
    setFarmerSearch(query);
    if (query.length < 2) { setFarmerResults([]); setCenterResults([]); return; }
    setFarmerSearchLoading(true);
    try {
      if (isAdmin) {
        const res = await centerApi.getAll(token);
        const all = res.data.data || res.data || [];
        const q = query.toLowerCase();
        setCenterResults(all.filter(c =>
          c.name?.toLowerCase().includes(q) ||
          c.centerCode?.toLowerCase().includes(q) ||
          c.collectionHead?.fullName?.toLowerCase().includes(q)
        ).slice(0, 8));
        setFarmerSearchLoading(false);
        return;
      }

      let farmers = [];
      if (isCollectionHead && centerId) {
        // Collection head: fetch all center farmers then filter client-side
        const res = await farmerApi.getByCenter(centerId, token);
        const all = res.data || [];
        const q = query.toLowerCase();
        farmers = all.filter(f =>
          f.fullName?.toLowerCase().includes(q) ||
          f.farmerCode?.toLowerCase().includes(q) ||
          f.mobileNumber?.includes(q)
        );
      } else {
        const params = { search: query };
        if (centerId) params.centerId = centerId;
        const res = await farmerApi.getAll(token, params);
        farmers = res.data.data || res.data || [];
      }
      setFarmerResults(farmers.slice(0, 8));
    } catch { /* ignore */ }
    setFarmerSearchLoading(false);
  };

  const selectFarmer = (f) => {
    setSelectedFarmer(f);
    setFarmerSearch(f.fullName);
    setFarmerResults([]);
  };

  const selectCenter = (c) => {
    setSelectedCenter(c);
    setFarmerSearch(c.name);
    setCenterResults([]);
  };

  const resetAddForm = () => {
    setAddForm({ advanceAmount: '', advanceDate: new Date().toISOString().split('T')[0], paymentMethod: 'Cash', notes: '' });
    setSelectedFarmer(null);
    setSelectedCenter(null);
    setFarmerSearch('');
    setFarmerResults([]);
    setCenterResults([]);
    setShowAdvanceDatePicker(false);
  };

  // ── Submit new advance ──
  const handleAddSubmit = async () => {
    if (isAdmin && !selectedCenter) { Alert.alert('Validation', 'Please select a collection center'); return; }
    if (isCollectionHead && !selectedFarmer) { Alert.alert('Validation', 'Please select a farmer'); return; }
    if (!addForm.advanceAmount || isNaN(Number(addForm.advanceAmount)) || Number(addForm.advanceAmount) <= 0) {
      Alert.alert('Validation', 'Enter a valid advance amount'); return;
    }
    setSubmitting(true);
    try {
      const payload = isAdmin
        ? { centerId: selectedCenter._id, ...addForm }
        : { farmerId: selectedFarmer._id, ...addForm };
      await advanceApi.add(payload, token);
      Alert.alert('Success', isAdmin ? 'Advance added for collection center' : 'Advance added & farmer notified');
      setShowAddModal(false);
      resetAddForm();
      loadAdvances();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setSubmitting(false);
  };

  // ── Add extra amount to existing advance ──
  const openAddAmount = (item) => {
    setAddAmountTarget(item);
    setExtraAmount('');
    setExtraNotes('');
    setShowAddAmountModal(true);
  };

  const handleAddAmount = async () => {
    const amt = Number(extraAmount);
    if (!amt || amt <= 0) { Alert.alert('Validation', 'Enter a valid amount to add'); return; }
    setSubmitting(true);
    try {
      await advanceApi.addAmount(addAmountTarget._id, { extraAmount: amt, notes: extraNotes }, token);
      Alert.alert('Success', `₹${amt.toLocaleString('en-IN')} added to advance. SMS sent.`);
      setShowAddAmountModal(false);
      loadAdvances();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setSubmitting(false);
  };

  // ── Delete ──
  const handleDelete = (id) => {
    Alert.alert('Delete Advance', 'Are you sure you want to delete this record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await advanceApi.remove(id, token);
            loadAdvances();
          } catch (e) { Alert.alert('Error', e.message); }
        }
      }
    ]);
  };

  // ── Render card ──
  const renderAdvance = ({ item }) => {
    const isActive  = item.status === 'Active';
    const statusClr = isActive ? colors.primary : colors.success;
    const pct       = item.advanceAmount > 0
      ? Math.round(((item.advanceAmount - item.remainingAmount) / item.advanceAmount) * 100)
      : 100;

    if (isAdmin) {
      return (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.farmerName}>{item.collectionCenterId?.name || centerName}</Text>
              <Text style={styles.cardMeta}>
                {item.collectionHeadName || item.collectionCenterId?.collectionHead?.fullName || 'Collection Head'}
                {' · '}
                {item.collectionCenterId?.centerCode || 'Center'}
              </Text>
            </View>
          </View>
          <View style={styles.amountRow}>
            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>Advance Amount</Text>
              <Text style={styles.amountValue}>₹{(item.advanceAmount || 0).toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>Date</Text>
              <Text style={styles.amountValue}>{new Date(item.advanceDate).toLocaleDateString('en-IN')}</Text>
            </View>
          </View>
          {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
        </View>
      );
    }

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.farmerName}>{item.farmerId?.fullName || '—'}</Text>
            <Text style={styles.cardMeta}>
              {item.farmerId?.farmerCode || item.farmerCode}
              {' · '}
              {item.collectionCenterId?.name || centerName}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusClr + '18' }]}>
            <Text style={[styles.statusText, { color: statusClr }]}>{item.status}</Text>
          </View>
        </View>

        {/* Amount boxes */}
        <View style={styles.amountRow}>
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Total Given</Text>
            <Text style={styles.amountValue}>₹{(item.advanceAmount || 0).toLocaleString('en-IN')}</Text>
          </View>
          <View style={[styles.amountBox, { backgroundColor: isActive ? '#fef3c7' : colors.successLight }]}>
            <Text style={[styles.amountLabel, { color: isActive ? '#92400e' : colors.success }]}>Remaining</Text>
            <Text style={[styles.amountValue, { color: isActive ? '#92400e' : colors.success }]}>
              ₹{(item.remainingAmount || 0).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={[styles.amountBox, { backgroundColor: colors.primaryXLight }]}>
            <Text style={[styles.amountLabel, { color: colors.primary }]}>Recovered</Text>
            <Text style={[styles.amountValue, { color: colors.primary }]}>
              ₹{((item.advanceAmount || 0) - (item.remainingAmount || 0)).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: pct === 100 ? colors.success : colors.primary }]} />
        </View>
        <Text style={styles.progressLabel}>{pct}% recovered</Text>

        {/* Meta */}
        <Text style={styles.meta}>
          {new Date(item.advanceDate).toLocaleDateString('en-IN')} · {item.paymentMethod}
        </Text>
        {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}

        {/* Actions */}
        {isCollectionHead && (
          <View style={styles.cardActions}>
            {isActive && (
              <TouchableOpacity style={styles.addAmtBtn} onPress={() => openAddAmount(item)}>
                <Text style={styles.addAmtBtnText}>+ Add Amount</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id)}>
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={loading ? [] : advances}
        keyExtractor={(i) => i._id}
        renderItem={renderAdvance}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadAdvances().finally(() => setRefreshing(false)); }}
          />
        }
        ListHeaderComponent={
          <>
            {/* Summary strip */}
            <View style={styles.summaryStrip}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Given</Text>
                <Text style={styles.summaryValue}>₹{totalGiven.toLocaleString('en-IN')}</Text>
              </View>
              <View style={[styles.summaryItem, styles.summaryDivider]}>
                <Text style={styles.summaryLabel}>Outstanding</Text>
                <Text style={[styles.summaryValue, { color: colors.danger }]}>₹{totalRemaining.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Settled</Text>
                <Text style={[styles.summaryValue, { color: colors.success }]}>{totalSettled}</Text>
              </View>
            </View>

            {/* Add button */}
            {canManage && (
              <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
                <Text style={styles.addBtnText}>{isAdmin ? '+ New Center Advance' : '+ New Advance Payment'}</Text>
              </TouchableOpacity>
            )}

            {loading && (
              <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} size="large" />
            )}
          </>
        }
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>No advance records found.</Text> : null
        }
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 100 }}
      />

      {/* ── Add New Advance Modal ── */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>{isAdmin ? 'New Center Advance' : 'New Advance Payment'}</Text>

              <Text style={styles.fieldLabel}>{isAdmin ? 'Search Collection Center *' : 'Search Farmer *'}</Text>
              <TextInput
                style={styles.input}
                placeholder={isAdmin ? 'Search by center or head name...' : 'Search by name or farmer code...'}
                value={farmerSearch}
                onChangeText={searchFarmers}
                placeholderTextColor={colors.textMuted}
              />
              {farmerSearchLoading && <ActivityIndicator size="small" color={colors.primary} />}
              {isAdmin && centerResults.length > 0 && (
                <View style={styles.dropdown}>
                  {centerResults.map((c) => (
                    <TouchableOpacity key={c._id} style={styles.dropdownItem} onPress={() => selectCenter(c)}>
                      <Text style={styles.dropdownText}>{c.name} ({c.centerCode})</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {!isAdmin && farmerResults.length > 0 && (
                <View style={styles.dropdown}>
                  {farmerResults.map((f) => (
                    <TouchableOpacity key={f._id} style={styles.dropdownItem} onPress={() => selectFarmer(f)}>
                      <Text style={styles.dropdownText}>{f.fullName} ({f.farmerCode})</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {selectedCenter && (
                <View style={styles.selectedBox}>
                  <Text style={styles.selectedText}>✓ {selectedCenter.name}</Text>
                  <Text style={styles.selectedSub}>
                    {selectedCenter.collectionHead?.fullName || 'Collection Head'} · {selectedCenter.centerCode}
                  </Text>
                </View>
              )}
              {selectedFarmer && (
                <View style={styles.selectedBox}>
                  <Text style={styles.selectedText}>✓ {selectedFarmer.fullName}</Text>
                  <Text style={styles.selectedSub}>{selectedFarmer.mobileNumber} · {selectedFarmer.farmerCode}</Text>
                </View>
              )}

              <Text style={styles.fieldLabel}>Advance Amount (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter amount"
                keyboardType="numeric"
                value={addForm.advanceAmount}
                onChangeText={(v) => setAddForm({ ...addForm, advanceAmount: v })}
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.fieldLabel}>Date *</Text>
              <TouchableOpacity
                style={[styles.input, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}
                onPress={() => setShowAdvanceDatePicker(true)}
              >
                <Calendar size={14} color={colors.primary} />
                <Text style={{ fontSize: 15, color: colors.text }}>
                  {addForm.advanceDate
                    ? new Date(addForm.advanceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'Select date'}
                </Text>
              </TouchableOpacity>
              {showAdvanceDatePicker && (
                <DateTimePicker
                  value={addForm.advanceDate ? new Date(addForm.advanceDate) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={new Date()}
                  onChange={(_, d) => {
                    setShowAdvanceDatePicker(false);
                    if (d) setAddForm({ ...addForm, advanceDate: d.toISOString().split('T')[0] });
                  }}
                />
              )}

              <Text style={styles.fieldLabel}>Payment Method *</Text>
              <View style={styles.methodRow}>
                {PAYMENT_METHODS.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.methodBtn, addForm.paymentMethod === m && styles.methodBtnActive]}
                    onPress={() => setAddForm({ ...addForm, paymentMethod: m })}
                  >
                    <Text style={[styles.methodBtnText, addForm.paymentMethod === m && styles.methodBtnTextActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Notes / Reason</Text>
              <TextInput
                style={[styles.input, { height: 72 }]}
                placeholder="Optional notes..."
                multiline
                value={addForm.notes}
                onChangeText={(v) => setAddForm({ ...addForm, notes: v })}
                placeholderTextColor={colors.textMuted}
              />

              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowAddModal(false); resetAddForm(); }}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitBtn} onPress={handleAddSubmit} disabled={submitting}>
                  {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Add & Notify</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Add Amount to Existing Advance Modal ── */}
      <Modal visible={showAddAmountModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Add Amount to Advance</Text>

            {addAmountTarget && (
              <View style={styles.targetInfoBox}>
                <Text style={styles.targetName}>{addAmountTarget.farmerId?.fullName}</Text>
                <View style={styles.targetAmtRow}>
                  <View style={styles.targetAmtItem}>
                    <Text style={styles.targetAmtLabel}>Current Total</Text>
                    <Text style={styles.targetAmtValue}>₹{(addAmountTarget.advanceAmount || 0).toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.targetAmtItem}>
                    <Text style={styles.targetAmtLabel}>Remaining</Text>
                    <Text style={[styles.targetAmtValue, { color: '#92400e' }]}>
                      ₹{(addAmountTarget.remainingAmount || 0).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <Text style={styles.fieldLabel}>Amount to Add (₹) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 500"
              keyboardType="numeric"
              value={extraAmount}
              onChangeText={setExtraAmount}
              placeholderTextColor={colors.textMuted}
              autoFocus
            />

            {/* Live preview */}
            {extraAmount && !isNaN(Number(extraAmount)) && Number(extraAmount) > 0 && addAmountTarget && (
              <View style={styles.previewBox}>
                <Text style={styles.previewText}>
                  New Total: ₹{((addAmountTarget.advanceAmount || 0) + Number(extraAmount)).toLocaleString('en-IN')}
                  {'  ·  '}
                  New Remaining: ₹{((addAmountTarget.remainingAmount || 0) + Number(extraAmount)).toLocaleString('en-IN')}
                </Text>
              </View>
            )}

            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, { height: 60 }]}
              placeholder="Reason for adding amount..."
              multiline
              value={extraNotes}
              onChangeText={setExtraNotes}
              placeholderTextColor={colors.textMuted}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddAmountModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleAddAmount} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Add Amount</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  summaryStrip: {
    flexDirection: 'row', backgroundColor: colors.surface,
    marginTop: spacing.md,
    borderRadius: radius.md, padding: spacing.md,
    ...shadows.card
  },
  summaryItem:    { flex: 1, alignItems: 'center' },
  summaryDivider: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.divider },
  summaryLabel:   { fontSize: 11, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  summaryValue:   { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 3 },

  addBtn: {
    marginTop: spacing.md, backgroundColor: colors.primary,
    borderRadius: radius.md, paddingVertical: 13, alignItems: 'center'
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  card: {
    backgroundColor: colors.surface, borderRadius: radius.md,
    padding: spacing.md, marginBottom: 12, ...shadows.card
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  farmerName:  { fontSize: 16, fontWeight: '700', color: colors.text },
  cardMeta:    { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8 },
  statusText:  { fontSize: 12, fontWeight: '700' },

  amountRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  amountBox: {
    flex: 1, backgroundColor: '#eff6ff', borderRadius: radius.sm,
    padding: 9, alignItems: 'center'
  },
  amountLabel: { fontSize: 10, color: colors.primary, fontWeight: '600', textTransform: 'uppercase' },
  amountValue: { fontSize: 14, fontWeight: '800', color: colors.primary, marginTop: 2 },

  progressBg:   { height: 5, backgroundColor: colors.divider, borderRadius: 3, marginBottom: 4 },
  progressFill: { height: 5, borderRadius: 3 },
  progressLabel:{ fontSize: 10, color: colors.textMuted, marginBottom: 6 },

  meta:  { fontSize: 12, color: colors.textMuted },
  notes: { fontSize: 12, color: colors.textMuted, marginTop: 3, fontStyle: 'italic' },

  cardActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  addAmtBtn: {
    flex: 2, backgroundColor: colors.primary + '18', borderRadius: radius.sm,
    paddingVertical: 9, alignItems: 'center',
    borderWidth: 1, borderColor: colors.primary + '40'
  },
  addAmtBtnText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  deleteBtn: {
    flex: 1, backgroundColor: colors.danger + '12', borderRadius: radius.sm,
    paddingVertical: 9, alignItems: 'center'
  },
  deleteBtnText: { color: colors.danger, fontWeight: '700', fontSize: 13 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 60, fontSize: 15 },

  // Modal shared
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalContainer: {
    backgroundColor: colors.surface, borderTopLeftRadius: 22,
    borderTopRightRadius: 22, padding: spacing.lg, maxHeight: '90%'
  },
  modalTitle: { fontSize: typography.h3, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 4, marginTop: 10 },
  input: {
    backgroundColor: colors.surfaceMuted, borderRadius: radius.sm,
    paddingHorizontal: spacing.md, paddingVertical: 11,
    fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border
  },
  dropdown: {
    backgroundColor: colors.surface, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border, marginTop: 2
  },
  dropdownItem: { paddingHorizontal: spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  dropdownText: { fontSize: 14, color: colors.text },
  selectedBox: { backgroundColor: '#ecfdf5', borderRadius: radius.sm, padding: 10, marginTop: 6 },
  selectedText: { color: colors.success, fontWeight: '700', fontSize: 14 },
  selectedSub:  { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  methodRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  methodBtn: {
    flex: 1, borderRadius: radius.sm, paddingVertical: 9, alignItems: 'center',
    backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border
  },
  methodBtnActive:     { backgroundColor: colors.primary, borderColor: colors.primary },
  methodBtnText:       { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  methodBtnTextActive: { color: '#fff' },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 8 },
  cancelBtn: {
    flex: 1, borderRadius: radius.sm, paddingVertical: 13,
    alignItems: 'center', backgroundColor: colors.surfaceMuted
  },
  cancelBtnText: { color: colors.textMuted, fontWeight: '700' },
  submitBtn: {
    flex: 2, borderRadius: radius.sm, paddingVertical: 13,
    alignItems: 'center', backgroundColor: colors.primary
  },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Add-amount modal extras
  targetInfoBox: {
    backgroundColor: colors.primaryXLight, borderRadius: radius.sm,
    padding: 12, marginBottom: 8
  },
  targetName:    { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 8 },
  targetAmtRow:  { flexDirection: 'row', gap: 10 },
  targetAmtItem: { flex: 1, alignItems: 'center' },
  targetAmtLabel:{ fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  targetAmtValue:{ fontSize: 16, fontWeight: '800', color: colors.primary, marginTop: 2 },
  previewBox: {
    backgroundColor: colors.successLight, borderRadius: radius.sm,
    padding: 10, marginTop: 6
  },
  previewText: { fontSize: 12, color: colors.success, fontWeight: '700', textAlign: 'center' }
});

export default AdvanceScreen;
