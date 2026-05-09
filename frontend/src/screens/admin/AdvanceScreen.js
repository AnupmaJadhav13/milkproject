import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, Modal, ScrollView, Alert, ActivityIndicator, RefreshControl
} from 'react-native';
import { useSelector } from 'react-redux';
import { advanceApi, farmerApi } from '../../api/api';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { ROLE_ADMIN } from '../../constants/roles';

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'UPI'];

const AdvanceScreen = ({ centerId, centerName }) => {
  const { token, user } = useSelector((s) => s.auth);
  const isAdmin = user?.role === ROLE_ADMIN;

  const [advances, setAdvances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [farmerSearch, setFarmerSearch] = useState('');
  const [farmerResults, setFarmerResults] = useState([]);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [farmerSearchLoading, setFarmerSearchLoading] = useState(false);

  const [form, setForm] = useState({
    advanceAmount: '',
    advanceDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    notes: ''
  });

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

  const searchFarmers = async (query) => {
    setFarmerSearch(query);
    if (query.length < 2) { setFarmerResults([]); return; }
    setFarmerSearchLoading(true);
    try {
      const params = { search: query };
      if (centerId) params.centerId = centerId;
      const res = await farmerApi.getAll(token, params);
      setFarmerResults((res.data.data || res.data).slice(0, 8));
    } catch { /* ignore */ }
    setFarmerSearchLoading(false);
  };

  const selectFarmer = (f) => {
    setSelectedFarmer(f);
    setFarmerSearch(f.fullName);
    setFarmerResults([]);
  };

  const resetForm = () => {
    setForm({ advanceAmount: '', advanceDate: new Date().toISOString().split('T')[0], paymentMethod: 'Cash', notes: '' });
    setSelectedFarmer(null);
    setFarmerSearch('');
    setFarmerResults([]);
  };

  const handleSubmit = async () => {
    if (!selectedFarmer) { Alert.alert('Validation', 'Please select a farmer'); return; }
    if (!form.advanceAmount || isNaN(Number(form.advanceAmount))) { Alert.alert('Validation', 'Enter valid advance amount'); return; }
    setSubmitting(true);
    try {
      await advanceApi.add({ farmerId: selectedFarmer._id, ...form }, token);
      Alert.alert('Success', 'Advance payment added & SMS sent to farmer');
      setShowForm(false);
      resetForm();
      loadAdvances();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setSubmitting(false);
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Advance', 'Are you sure you want to delete this advance record?', [
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

  const openEdit = (item) => {
    setEditTarget(item);
    setForm({
      advanceAmount: String(item.advanceAmount),
      advanceDate: item.advanceDate?.split('T')[0] || '',
      paymentMethod: item.paymentMethod,
      notes: item.notes || ''
    });
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    setSubmitting(true);
    try {
      await advanceApi.update(editTarget._id, form, token);
      setShowEditModal(false);
      loadAdvances();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setSubmitting(false);
  };

  const renderAdvance = ({ item }) => {
    const statusColor = item.status === 'Active' ? colors.primary : colors.success;
    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.farmerName}>{item.farmerId?.fullName || '—'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.cardCode}>Code: {item.farmerId?.farmerCode || item.farmerCode}</Text>
        <Text style={styles.cardCode}>Center: {item.collectionCenterId?.name || centerName}</Text>

        <View style={styles.amountRow}>
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Advance Given</Text>
            <Text style={styles.amountValue}>₹{item.advanceAmount?.toLocaleString('en-IN')}</Text>
          </View>
          <View style={[styles.amountBox, { backgroundColor: '#fef3c7' }]}>
            <Text style={[styles.amountLabel, { color: '#92400e' }]}>Remaining</Text>
            <Text style={[styles.amountValue, { color: '#92400e' }]}>₹{item.remainingAmount?.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        <Text style={styles.meta}>
          {new Date(item.advanceDate).toLocaleDateString('en-IN')} · {item.paymentMethod}
        </Text>
        {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}

        {isAdmin && (
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
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
      {/* Add button */}
      {isAdmin && (
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
          <Text style={styles.addBtnText}>+ Add Advance Payment</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} size="large" />
      ) : (
        <FlatList
          data={advances}
          keyExtractor={(i) => i._id}
          renderItem={renderAdvance}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAdvances().finally(() => setRefreshing(false)); }} />}
          ListEmptyComponent={<Text style={styles.empty}>No advance records found.</Text>}
        />
      )}

      {/* Add Advance Modal */}
      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Add Advance Payment</Text>

              <Text style={styles.fieldLabel}>Search Farmer *</Text>
              <TextInput
                style={styles.input}
                placeholder="Search by name or farmer code..."
                value={farmerSearch}
                onChangeText={searchFarmers}
                placeholderTextColor={colors.textMuted}
              />
              {farmerSearchLoading && <ActivityIndicator size="small" color={colors.primary} />}
              {farmerResults.length > 0 && (
                <View style={styles.dropdown}>
                  {farmerResults.map((f) => (
                    <TouchableOpacity key={f._id} style={styles.dropdownItem} onPress={() => selectFarmer(f)}>
                      <Text style={styles.dropdownText}>{f.fullName} ({f.farmerCode})</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {selectedFarmer && (
                <View style={styles.selectedFarmerBox}>
                  <Text style={styles.selectedFarmerText}>✓ {selectedFarmer.fullName}</Text>
                  <Text style={styles.selectedFarmerSub}>{selectedFarmer.mobileNumber} · {selectedFarmer.farmerCode}</Text>
                </View>
              )}

              <Text style={styles.fieldLabel}>Advance Amount (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter amount"
                keyboardType="numeric"
                value={form.advanceAmount}
                onChangeText={(v) => setForm({ ...form, advanceAmount: v })}
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.fieldLabel}>Advance Date *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={form.advanceDate}
                onChangeText={(v) => setForm({ ...form, advanceDate: v })}
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.fieldLabel}>Payment Method *</Text>
              <View style={styles.methodRow}>
                {PAYMENT_METHODS.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.methodBtn, form.paymentMethod === m && styles.methodBtnActive]}
                    onPress={() => setForm({ ...form, paymentMethod: m })}
                  >
                    <Text style={[styles.methodBtnText, form.paymentMethod === m && styles.methodBtnTextActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Notes / Reason</Text>
              <TextInput
                style={[styles.input, { height: 72 }]}
                placeholder="Optional notes..."
                multiline
                value={form.notes}
                onChangeText={(v) => setForm({ ...form, notes: v })}
                placeholderTextColor={colors.textMuted}
              />

              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowForm(false); resetForm(); }}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
                  {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Add & Notify</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Advance</Text>
            <Text style={styles.fieldLabel}>Advance Amount (₹)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={form.advanceAmount} onChangeText={(v) => setForm({ ...form, advanceAmount: v })} />
            <Text style={styles.fieldLabel}>Advance Date</Text>
            <TextInput style={styles.input} value={form.advanceDate} onChangeText={(v) => setForm({ ...form, advanceDate: v })} />
            <Text style={styles.fieldLabel}>Payment Method</Text>
            <View style={styles.methodRow}>
              {PAYMENT_METHODS.map((m) => (
                <TouchableOpacity key={m} style={[styles.methodBtn, form.paymentMethod === m && styles.methodBtnActive]} onPress={() => setForm({ ...form, paymentMethod: m })}>
                  <Text style={[styles.methodBtnText, form.paymentMethod === m && styles.methodBtnTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.fieldLabel}>Notes</Text>
            <TextInput style={[styles.input, { height: 60 }]} multiline value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEditModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleEditSave} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  addBtn: {
    margin: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 13,
    alignItems: 'center'
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: 12,
    ...shadows.card
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  farmerName: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 12, fontWeight: '700' },
  cardCode: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  amountRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  amountBox: {
    flex: 1, backgroundColor: '#eff6ff', borderRadius: radius.sm,
    padding: 10, alignItems: 'center'
  },
  amountLabel: { fontSize: 11, color: colors.primary, fontWeight: '600' },
  amountValue: { fontSize: 17, fontWeight: '800', color: colors.primary, marginTop: 2 },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 8 },
  notes: { fontSize: 13, color: colors.textMuted, marginTop: 4, fontStyle: 'italic' },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  editBtn: {
    flex: 1, backgroundColor: colors.primary + '20', borderRadius: radius.sm,
    paddingVertical: 8, alignItems: 'center'
  },
  editBtnText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  deleteBtn: {
    flex: 1, backgroundColor: colors.danger + '15', borderRadius: radius.sm,
    paddingVertical: 8, alignItems: 'center'
  },
  deleteBtnText: { color: colors.danger, fontWeight: '700', fontSize: 13 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 60, fontSize: 15 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: spacing.lg,
    maxHeight: '90%'
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
    borderWidth: 1, borderColor: colors.border, marginTop: 2, zIndex: 100
  },
  dropdownItem: { paddingHorizontal: spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  dropdownText: { fontSize: 14, color: colors.text },
  selectedFarmerBox: {
    backgroundColor: '#ecfdf5', borderRadius: radius.sm,
    padding: 10, marginTop: 6
  },
  selectedFarmerText: { color: colors.success, fontWeight: '700', fontSize: 14 },
  selectedFarmerSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  methodRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  methodBtn: {
    flex: 1, borderRadius: radius.sm, paddingVertical: 9,
    alignItems: 'center', backgroundColor: colors.surfaceMuted,
    borderWidth: 1, borderColor: colors.border
  },
  methodBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  methodBtnText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
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
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 }
});

export default AdvanceScreen;
