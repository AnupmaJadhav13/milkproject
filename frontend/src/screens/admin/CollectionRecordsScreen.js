import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, FlatList, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchMilkEntries } from '../../redux/slices/milkSlice';
import { fetchCenters } from '../../redux/slices/centerSlice';
import LoadingIndicator from '../../components/LoadingIndicator';

const CollectionRecordsScreen = ({ route }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const entries = useSelector((state) => state.milk.entries);
  const summary = useSelector((state) => state.milk.summary);
  const status = useSelector((state) => state.milk.status);
  const centers = useSelector((state) => state.centers.list);
  const initialCenter = route?.params?.centerId || '';
  const [filters, setFilters] = useState({
    centerId: initialCenter,
    date: '',
    shift: '',
    animalType: '',
    farmerCode: ''
  });

  console.log('=== FILTERS STATE ===');
  console.log('Current filters:', JSON.stringify(filters));
  console.log('Initial center from route:', initialCenter);
  console.log('=====================');

  useEffect(() => {
    if (token) dispatch(fetchCenters(token));
  }, [dispatch, token]);

  useEffect(() => {
    if (!token) return;
    const params = {};
    if (filters.centerId) params.centerId = filters.centerId;
    if (filters.date) params.date = filters.date;
    if (filters.shift) params.shift = filters.shift;
    if (filters.animalType) params.animalType = filters.animalType;
    if (filters.farmerCode.trim()) params.farmerCode = filters.farmerCode.trim();
    console.log('=== FETCHING MILK ENTRIES ===');
    console.log('API params:', JSON.stringify(params));
    console.log('=============================');
    dispatch(fetchMilkEntries({ token, params }));
  }, [dispatch, token, filters]);

  const cards = useMemo(() => {
    console.log('=== COLLECTION RECORDS SCREEN ===');
    console.log('Summary from Redux:', JSON.stringify(summary, null, 2));
    console.log('Entries count:', entries.length);
    console.log('=================================');
    return [
      { label: 'Total milk', value: `${Number(summary?.totalMilkLiters || 0).toFixed(2)} L` },
      { label: 'Cow milk', value: `${Number(summary?.cowMilkLiters || 0).toFixed(2)} L` },
      { label: 'Buffalo milk', value: `${Number(summary?.buffaloMilkLiters || 0).toFixed(2)} L` },
      { label: 'Morning', value: `${Number(summary?.morningMilkLiters || 0).toFixed(2)} L` },
      { label: 'Evening', value: `${Number(summary?.eveningMilkLiters || 0).toFixed(2)} L` },
      { label: 'Total amount', value: `₹${Number(summary?.totalAmountInr || 0).toFixed(2)}` }
    ];
  }, [summary, entries.length]);

  if (status === 'loading' && entries.length === 0) return <LoadingIndicator />;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>Collection Records</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersWrap}>
        <View style={styles.filterBox}>
          <Text style={styles.filterLabel}>Center</Text>
          <Picker
            selectedValue={filters.centerId}
            onValueChange={(value) => setFilters((prev) => ({ ...prev, centerId: value }))}
            style={styles.picker}
          >
            <Picker.Item label="All centers" value="" />
            {centers.map((c) => (
              <Picker.Item key={c._id} label={`${c.name} (${c.centerCode})`} value={c._id} />
            ))}
          </Picker>
        </View>
        <View style={styles.filterBox}>
          <Text style={styles.filterLabel}>Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={filters.date}
            onChangeText={(value) => setFilters((prev) => ({ ...prev, date: value }))}
            placeholder="2026-05-06"
          />
        </View>
        <View style={styles.filterBox}>
          <Text style={styles.filterLabel}>Shift</Text>
          <Picker selectedValue={filters.shift} onValueChange={(value) => setFilters((prev) => ({ ...prev, shift: value }))} style={styles.picker}>
            <Picker.Item label="All" value="" />
            <Picker.Item label="Morning" value="Morning" />
            <Picker.Item label="Evening" value="Evening" />
          </Picker>
        </View>
        <View style={styles.filterBox}>
          <Text style={styles.filterLabel}>Animal</Text>
          <Picker selectedValue={filters.animalType} onValueChange={(value) => setFilters((prev) => ({ ...prev, animalType: value }))} style={styles.picker}>
            <Picker.Item label="All" value="" />
            <Picker.Item label="Cow" value="Cow" />
            <Picker.Item label="Buffalo" value="Buffalo" />
          </Picker>
        </View>
      </ScrollView>
      <TextInput
        style={[styles.input, { marginHorizontal: 16, marginBottom: 8 }]}
        value={filters.farmerCode}
        onChangeText={(value) => setFilters((prev) => ({ ...prev, farmerCode: value }))}
        placeholder="Search farmer code"
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.summaryWrap}>
        {cards.map((card) => (
          <View key={card.label} style={styles.card}>
            <Text style={styles.cardLabel}>{card.label}</Text>
            <Text style={styles.cardValue}>{card.value}</Text>
          </View>
        ))}
      </ScrollView>

      <FlatList
        data={entries}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListEmptyComponent={<Text style={styles.empty}>No collection records found.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.rowTitle}>{item.farmerId?.fullName || item.farmerCode}</Text>
            <Text style={styles.rowSub}>{item.collectionCenterId?.name} · {item.shift} · {item.animalType}</Text>
            <Text style={styles.rowSub}>
              {new Date(item.date).toLocaleDateString()} · {Number(item.quantityLiters).toFixed(2)} L · FAT {item.fat} · SNF {item.snf}
            </Text>
            <Text style={styles.amount}>₹{Number(item.amountInr || 0).toFixed(2)} (@₹{Number(item.ratePerLiter || 0).toFixed(2)}/L)</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginHorizontal: 16, marginBottom: 10 },
  filtersWrap: { marginBottom: 6 },
  filterBox: { width: 220, marginHorizontal: 8, backgroundColor: '#fff', borderRadius: 12, padding: 8 },
  filterLabel: { fontSize: 12, color: '#475569', marginBottom: 4 },
  picker: { height: 44 },
  input: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1', paddingHorizontal: 12, paddingVertical: 10 },
  summaryWrap: { marginBottom: 8, marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginHorizontal: 8, minWidth: 130 },
  cardLabel: { color: '#64748b', fontSize: 12 },
  cardValue: { fontSize: 17, fontWeight: '800', color: '#0f172a', marginTop: 4 },
  row: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10 },
  rowTitle: { fontWeight: '700', color: '#0f172a' },
  rowSub: { marginTop: 3, color: '#475569' },
  amount: { marginTop: 4, color: '#0f766e', fontWeight: '700' },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 20 }
});

export default CollectionRecordsScreen;
