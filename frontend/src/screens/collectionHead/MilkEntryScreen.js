import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { Picker } from '@react-native-picker/picker';
import { fetchFarmersByCenter } from '../../redux/slices/farmerSlice';
import { createMilkEntry, fetchMilkEntries } from '../../redux/slices/milkSlice';

const MilkEntryScreen = () => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const farmers = useSelector((state) => state.farmers.list);
  const entries = useSelector((state) => state.milk.entries);
  const milkStatus = useSelector((state) => state.milk.status);
  const [form, setForm] = useState({
    farmerId: '',
    shift: 'Morning',
    animalType: 'Cow',
    quantityLiters: '',
    fat: '',
    snf: '',
    date: new Date().toISOString().slice(0, 10)
  });

  useEffect(() => {
    if (token && user?.assignedCenter) {
      dispatch(fetchFarmersByCenter({ centerId: user.assignedCenter, token }));
      dispatch(fetchMilkEntries({ token, params: { date: form.date } }));
    }
  }, [dispatch, token, user?.assignedCenter, form.date]);

  const selectedFarmer = useMemo(() => farmers.find((f) => f._id === form.farmerId), [farmers, form.farmerId]);
  const liveRate = useMemo(() => {
    const fat = Number(form.fat || 0);
    const snf = Number(form.snf || 0);
    const base = 30;
    const fatDiffSteps = Math.round((fat - 3.0) * 10);
    const snfDiffSteps = Math.round((snf - 7.5) * 10);
    return Number((base + fatDiffSteps * 0.3 + snfDiffSteps * 0.5).toFixed(2));
  }, [form.fat, form.snf]);
  const totalAmount = useMemo(() => Number((Number(form.quantityLiters || 0) * liveRate).toFixed(2)), [form.quantityLiters, liveRate]);

  const onSave = async () => {
    if (!form.farmerId || !form.quantityLiters || !form.fat || !form.snf) {
      Toast.show({ type: 'error', text1: 'Please fill all required fields' });
      return;
    }
    try {
      await dispatch(
        createMilkEntry({
          token,
          data: {
            farmerId: form.farmerId,
            shift: form.shift,
            animalType: form.animalType,
            quantityLiters: Number(form.quantityLiters),
            fat: Number(form.fat),
            snf: Number(form.snf),
            date: form.date
          }
        })
      ).unwrap();
      Toast.show({ type: 'success', text1: 'Milk record saved' });
      setForm((prev) => ({ ...prev, quantityLiters: '', fat: '', snf: '' }));
      dispatch(fetchMilkEntries({ token, params: { date: form.date } }));
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Save failed', text2: String(error) });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Daily Milk Collection</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Farmer</Text>
        <Picker selectedValue={form.farmerId} onValueChange={(value) => setForm((prev) => ({ ...prev, farmerId: value }))}>
          <Picker.Item label="Select farmer by code" value="" />
          {farmers.map((f) => (
            <Picker.Item key={f._id} label={`${f.farmerCode} - ${f.fullName}`} value={f._id} />
          ))}
        </Picker>
        {selectedFarmer ? <Text style={styles.helper}>Mobile: {selectedFarmer.mobileNumber}</Text> : null}

        <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
        <TextInput style={styles.input} value={form.date} onChangeText={(value) => setForm((prev) => ({ ...prev, date: value }))} />
        <Text style={styles.label}>Shift</Text>
        <Picker selectedValue={form.shift} onValueChange={(value) => setForm((prev) => ({ ...prev, shift: value }))}>
          <Picker.Item label="Morning" value="Morning" />
          <Picker.Item label="Evening" value="Evening" />
        </Picker>
        <Text style={styles.label}>Animal Type</Text>
        <Picker selectedValue={form.animalType} onValueChange={(value) => setForm((prev) => ({ ...prev, animalType: value }))}>
          <Picker.Item label="Cow" value="Cow" />
          <Picker.Item label="Buffalo" value="Buffalo" />
        </Picker>

        <Text style={styles.label}>Milk Quantity (L)</Text>
        <TextInput style={styles.input} keyboardType="decimal-pad" value={form.quantityLiters} onChangeText={(value) => setForm((prev) => ({ ...prev, quantityLiters: value }))} />
        <Text style={styles.label}>FAT</Text>
        <TextInput style={styles.input} keyboardType="decimal-pad" value={form.fat} onChangeText={(value) => setForm((prev) => ({ ...prev, fat: value }))} />
        <Text style={styles.label}>SNF</Text>
        <TextInput style={styles.input} keyboardType="decimal-pad" value={form.snf} onChangeText={(value) => setForm((prev) => ({ ...prev, snf: value }))} />

        <Text style={styles.preview}>Rate/L (live estimate): ₹{liveRate.toFixed(2)}</Text>
        <Text style={styles.preview}>Total Amount: ₹{totalAmount.toFixed(2)}</Text>
        <TouchableOpacity style={styles.saveBtn} onPress={onSave} disabled={milkStatus === 'loading'}>
          <Text style={styles.saveText}>{milkStatus === 'loading' ? 'Saving...' : 'Save Collection'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.historyTitle}>Today History</Text>
      <FlatList
        data={entries}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={<Text style={styles.helper}>No records for selected date.</Text>}
        renderItem={({ item }) => (
          <View style={styles.historyCard}>
            <Text style={styles.historyName}>{item.farmerId?.fullName || item.farmerCode}</Text>
            <Text style={styles.helper}>
              {item.shift} · {item.animalType} · {Number(item.quantityLiters).toFixed(2)}L · ₹{Number(item.amountInr).toFixed(2)}
            </Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 10 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12 },
  label: { fontSize: 13, color: '#334155', marginTop: 6, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: '#fff' },
  helper: { color: '#64748b', marginTop: 4 },
  preview: { marginTop: 8, fontWeight: '700', color: '#0f766e' },
  saveBtn: { marginTop: 12, backgroundColor: '#2563eb', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '700' },
  historyTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  historyCard: { backgroundColor: '#fff', borderRadius: 10, padding: 10, marginBottom: 8 },
  historyName: { fontWeight: '700', color: '#0f172a' }
});

export default MilkEntryScreen;
