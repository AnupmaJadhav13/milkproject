import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  FlatList, Alert, ActivityIndicator, TextInput, Modal, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ChevronLeft, FileText, BarChart2, Share2, Search, Calendar } from 'lucide-react-native';
import { fetchCenterReport, fetchFarmerReport, clearReports } from '../../redux/slices/reportSlice';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { generateCenterReportPDF, generateFarmerReportPDF, printAndSharePDF } from '../../utils/pdfGenerator';

const REPORT_TYPES = [
  { key: 'center', label: 'Center Wise', icon: BarChart2, desc: 'Avg milk, FAT, SNF, total amount by center' },
  { key: 'farmer', label: 'Farmer Wise', icon: FileText, desc: 'Daily collection records for a farmer' }
];

// ─── Date Input ───────────────────────────────────────────────────────────────
const DateInput = ({ label, value, onChange }) => {
  const [show, setShow] = useState(false);
  const today = new Date();
  const dateObj = value ? new Date(value) : today;
  const display = value
    ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Select date';
  return (
    <View style={styles.dateInputBox}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity style={styles.dateInputRow} onPress={() => setShow(true)}>
        <Calendar size={14} color={colors.primary} />
        <Text style={[styles.dateInput, { color: value ? colors.text : colors.textMuted }]}>{display}</Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={dateObj}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={today}
          onChange={(_, d) => { setShow(false); if (d) onChange(d.toISOString().split('T')[0]); }}
        />
      )}
    </View>
  );
};

// ─── Summary Card ─────────────────────────────────────────────────────────────
const SummaryCard = ({ label, value, color }) => (
  <View style={[styles.summaryCard, color && { borderLeftColor: color, borderLeftWidth: 3 }]}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={[styles.summaryValue, color && { color }]}>{value}</Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const ReportsScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { token } = useSelector((s) => s.auth);
  const { centerReport, farmerReport, status } = useSelector((s) => s.reports);
  const { list: centers } = useSelector((s) => s.centers);
  const { list: farmers } = useSelector((s) => s.farmers);

  const [reportType, setReportType] = useState('center');
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

  // Center selection
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [centerSearch, setCenterSearch] = useState('');
  const [showCenterPicker, setShowCenterPicker] = useState(false);

  // Farmer selection
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [farmerSearch, setFarmerSearch] = useState('');
  const [showFarmerPicker, setShowFarmerPicker] = useState(false);

  const [sharing, setSharing] = useState(false);

  const filteredCenters = centers.filter(c =>
    !centerSearch || c.name.toLowerCase().includes(centerSearch.toLowerCase()) ||
    c.centerCode.toLowerCase().includes(centerSearch.toLowerCase())
  );

  const filteredFarmers = farmers.filter(f =>
    !farmerSearch || f.fullName.toLowerCase().includes(farmerSearch.toLowerCase()) ||
    f.farmerCode.toLowerCase().includes(farmerSearch.toLowerCase())
  );

  const handleGenerate = useCallback(() => {
    if (!fromDate || !toDate) {
      Alert.alert('Validation', 'Please select From Date and To Date');
      return;
    }
    if (reportType === 'center') {
      if (!selectedCenter) {
        Alert.alert('Validation', 'Please select a Collection Center');
        return;
      }
      dispatch(fetchCenterReport({ centerId: selectedCenter._id, token, params: { fromDate, toDate } }));
    } else {
      if (!selectedFarmer) {
        Alert.alert('Validation', 'Please select a Farmer');
        return;
      }
      dispatch(fetchFarmerReport({ farmerId: selectedFarmer._id, token, params: { fromDate, toDate } }));
    }
  }, [reportType, selectedCenter, selectedFarmer, fromDate, toDate, token, dispatch]);

  const handleShare = async () => {
    const data = reportType === 'center' ? centerReport : farmerReport;
    if (!data) {
      Alert.alert('No Report', 'Please generate a report first');
      return;
    }
    setSharing(true);
    try {
      let html;
      let filename;
      if (reportType === 'center') {
        html = generateCenterReportPDF(data);
        const cName = (selectedCenter?.name || 'Center').replace(/\s+/g, '_');
        filename = `Milk_Collection_Report_${cName}_${fromDate}_${toDate}`;
      } else {
        html = generateFarmerReportPDF(data);
        const fName = (selectedFarmer?.fullName || 'Farmer').replace(/\s+/g, '_');
        const fCode = selectedFarmer?.farmerCode || '';
        filename = `Milk_Collection_Report_${fName}_${fCode}_${fromDate}_${toDate}`;
      }
      const result = await printAndSharePDF(html, filename);
      if (!result.success) {
        Alert.alert('Share Failed', result.error || 'Could not share report');
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setSharing(false);
  };

  const isLoading = status === 'loading';
  const currentReport = reportType === 'center' ? centerReport : farmerReport;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={20} color={colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.brandText}>Sarvasvaa Milk</Text>
          <Text style={styles.headerTitle}>Reports</Text>
        </View>
        {currentReport && (
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} disabled={sharing}>
            {sharing
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Share2 size={18} color={colors.primary} strokeWidth={2.5} />
            }
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Report Type Tabs */}
        <View style={styles.typeTabs}>
          {REPORT_TYPES.map((t) => {
            const Icon = t.icon;
            const active = reportType === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.typeTab, active && styles.typeTabActive]}
                onPress={() => { setReportType(t.key); dispatch(clearReports()); }}
              >
                <Icon size={16} color={active ? '#fff' : colors.textMuted} strokeWidth={2.5} />
                <Text style={[styles.typeTabText, active && styles.typeTabTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Filters */}
        <View style={styles.filtersCard}>
          <Text style={styles.filtersTitle}>Report Filters</Text>

          {/* Date Range */}
          <View style={styles.dateRow}>
            <DateInput label="From Date" value={fromDate} onChange={setFromDate} />
            <DateInput label="To Date" value={toDate} onChange={setToDate} />
          </View>

          {/* Center Selector */}
          {reportType === 'center' && (
            <View style={styles.selectorBox}>
              <Text style={styles.fieldLabel}>Collection Center *</Text>
              <TouchableOpacity
                style={styles.selectorBtn}
                onPress={() => setShowCenterPicker(true)}
              >
                <Text style={[styles.selectorBtnText, !selectedCenter && { color: colors.textMuted }]}>
                  {selectedCenter ? `${selectedCenter.name} (${selectedCenter.centerCode})` : 'Select Center...'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Farmer Selector */}
          {reportType === 'farmer' && (
            <View style={styles.selectorBox}>
              <Text style={styles.fieldLabel}>Farmer *</Text>
              <TouchableOpacity
                style={styles.selectorBtn}
                onPress={() => setShowFarmerPicker(true)}
              >
                <Text style={[styles.selectorBtnText, !selectedFarmer && { color: colors.textMuted }]}>
                  {selectedFarmer ? `${selectedFarmer.fullName} (${selectedFarmer.farmerCode})` : 'Select Farmer...'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate} disabled={isLoading}>
            {isLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.generateBtnText}>Generate Report</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Report Results */}
        {currentReport && reportType === 'center' && (
          <CenterReportView data={centerReport} />
        )}
        {currentReport && reportType === 'farmer' && (
          <FarmerReportView data={farmerReport} />
        )}

        {/* Share button at bottom */}
        {currentReport && (
          <TouchableOpacity style={styles.shareBottomBtn} onPress={handleShare} disabled={sharing}>
            {sharing
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Share2 size={18} color="#fff" strokeWidth={2.5} />
                  <Text style={styles.shareBottomBtnText}>Share Report as PDF</Text>
                </>
            }
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Center Picker Modal */}
      <Modal visible={showCenterPicker} animationType="slide" transparent>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Select Collection Center</Text>
            <View style={styles.searchRow}>
              <Search size={14} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search centers..."
                value={centerSearch}
                onChangeText={setCenterSearch}
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <FlatList
              data={filteredCenters}
              keyExtractor={(i) => i._id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => { setSelectedCenter(item); setShowCenterPicker(false); setCenterSearch(''); }}
                >
                  <Text style={styles.pickerItemName}>{item.name}</Text>
                  <Text style={styles.pickerItemSub}>{item.centerCode} · {item.village}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.pickerEmpty}>No centers found</Text>}
            />
            <TouchableOpacity style={styles.pickerClose} onPress={() => setShowCenterPicker(false)}>
              <Text style={styles.pickerCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Farmer Picker Modal */}
      <Modal visible={showFarmerPicker} animationType="slide" transparent>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Select Farmer</Text>
            <View style={styles.searchRow}>
              <Search size={14} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or code..."
                value={farmerSearch}
                onChangeText={setFarmerSearch}
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <FlatList
              data={filteredFarmers}
              keyExtractor={(i) => i._id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => { setSelectedFarmer(item); setShowFarmerPicker(false); setFarmerSearch(''); }}
                >
                  <Text style={styles.pickerItemName}>{item.fullName}</Text>
                  <Text style={styles.pickerItemSub}>{item.farmerCode} · {item.animalType}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.pickerEmpty}>No farmers found</Text>}
            />
            <TouchableOpacity style={styles.pickerClose} onPress={() => setShowFarmerPicker(false)}>
              <Text style={styles.pickerCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─── Center Report View ───────────────────────────────────────────────────────
const CenterReportView = ({ data }) => {
  const { center, dateRange, summary, farmerSummary } = data;
  return (
    <View>
      <View style={styles.reportHeader}>
        <Text style={styles.reportTitle}>{center?.name}</Text>
        <Text style={styles.reportSub}>{dateRange?.fromDate} → {dateRange?.toDate}</Text>
      </View>

      <View style={styles.summaryGrid}>
        <SummaryCard label="Total Farmers" value={summary?.totalFarmers || 0} />
        <SummaryCard label="Total Milk" value={`${Number(summary?.totalMilkLiters || 0).toFixed(2)} L`} color={colors.primary} />
        <SummaryCard label="Avg FAT" value={Number(summary?.avgFat || 0).toFixed(2)} color="#f59e0b" />
        <SummaryCard label="Avg SNF" value={Number(summary?.avgSnf || 0).toFixed(2)} color={colors.info} />
        <SummaryCard label="Total Entries" value={summary?.totalCollectionEntries || 0} />
        <SummaryCard label="Total Amount" value={`₹${Number(summary?.totalCollectionAmount || 0).toLocaleString('en-IN')}`} color={colors.success} />
      </View>

      <Text style={styles.tableTitle}>Farmer-wise Breakdown</Text>
      {(farmerSummary || []).map((f, i) => (
        <View key={f.farmerId || i} style={styles.tableRow}>
          <View style={styles.tableRowLeft}>
            <Text style={styles.tableRowName}>{f.farmerName || '—'}</Text>
            <Text style={styles.tableRowSub}>{f.farmerCode} · {f.totalDays} days</Text>
          </View>
          <View style={styles.tableRowRight}>
            <Text style={styles.tableRowAmount}>₹{Number(f.totalAmount || 0).toLocaleString('en-IN')}</Text>
            <Text style={styles.tableRowSub}>{Number(f.totalLiters || 0).toFixed(1)} L · FAT {Number(f.avgFat || 0).toFixed(1)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

// ─── Farmer Report View ───────────────────────────────────────────────────────
const FarmerReportView = ({ data }) => {
  const { farmer, dateRange, summary, reportRows } = data;
  const [search, setSearch] = useState('');

  const filtered = (reportRows || []).filter(r =>
    !search || r.date.includes(search) || r.shift.toLowerCase().includes(search.toLowerCase()) ||
    r.animalType.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View>
      <View style={styles.reportHeader}>
        <Text style={styles.reportTitle}>{farmer?.fullName}</Text>
        <Text style={styles.reportSub}>
          {farmer?.farmerCode} · {farmer?.center?.name} · {dateRange?.fromDate} → {dateRange?.toDate}
        </Text>
      </View>

      <View style={styles.summaryGrid}>
        <SummaryCard label="Milk Days" value={summary?.totalMilkDays || 0} color={colors.primary} />
        <SummaryCard label="Total Milk" value={`${Number(summary?.totalMilkLiters || 0).toFixed(2)} L`} />
        <SummaryCard label="Avg FAT" value={Number(summary?.avgFat || 0).toFixed(2)} color="#f59e0b" />
        <SummaryCard label="Avg SNF" value={Number(summary?.avgSnf || 0).toFixed(2)} color={colors.info} />
        <SummaryCard label="Morning" value={summary?.morningEntries || 0} />
        <SummaryCard label="Evening" value={summary?.eveningEntries || 0} />
        <SummaryCard label="Total Amount" value={`₹${Number(summary?.totalAmount || 0).toLocaleString('en-IN')}`} color={colors.success} />
      </View>

      {/* Search */}
      <View style={styles.tableSearchRow}>
        <Search size={14} color={colors.textMuted} />
        <TextInput
          style={styles.tableSearch}
          placeholder="Filter by date, shift, animal..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <Text style={styles.tableTitle}>Daily Collection Records ({filtered.length})</Text>

      {/* Table header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Date</Text>
        <Text style={styles.tableHeaderCell}>Shift</Text>
        <Text style={styles.tableHeaderCell}>Animal</Text>
        <Text style={styles.tableHeaderCell}>Milk L</Text>
        <Text style={styles.tableHeaderCell}>FAT</Text>
        <Text style={styles.tableHeaderCell}>SNF</Text>
        <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Amount</Text>
      </View>

      {filtered.map((r, i) => (
        <View key={i} style={[styles.tableDataRow, i % 2 === 0 && { backgroundColor: colors.surfaceMuted }]}>
          <Text style={[styles.tableDataCell, { flex: 1.5 }]}>{r.date}</Text>
          <Text style={styles.tableDataCell}>{r.shift}</Text>
          <Text style={styles.tableDataCell}>{r.animalType}</Text>
          <Text style={styles.tableDataCell}>{Number(r.milkLiter || 0).toFixed(1)}</Text>
          <Text style={styles.tableDataCell}>{Number(r.fat || 0).toFixed(1)}</Text>
          <Text style={styles.tableDataCell}>{Number(r.snf || 0).toFixed(1)}</Text>
          <Text style={[styles.tableDataCell, { flex: 1.5, color: colors.success, fontWeight: '700' }]}>
            ₹{Number(r.totalAmount || 0).toLocaleString('en-IN')}
          </Text>
        </View>
      ))}

      {/* Total row */}
      <View style={[styles.tableDataRow, { backgroundColor: colors.primaryXLight }]}>
        <Text style={[styles.tableDataCell, { flex: 1.5, fontWeight: '800', color: colors.primary }]}>TOTAL</Text>
        <Text style={styles.tableDataCell} />
        <Text style={styles.tableDataCell} />
        <Text style={[styles.tableDataCell, { fontWeight: '800' }]}>
          {Number(summary?.totalMilkLiters || 0).toFixed(1)}
        </Text>
        <Text style={[styles.tableDataCell, { fontWeight: '800' }]}>
          {Number(summary?.avgFat || 0).toFixed(1)}
        </Text>
        <Text style={[styles.tableDataCell, { fontWeight: '800' }]}>
          {Number(summary?.avgSnf || 0).toFixed(1)}
        </Text>
        <Text style={[styles.tableDataCell, { flex: 1.5, fontWeight: '800', color: colors.success }]}>
          ₹{Number(summary?.totalAmount || 0).toLocaleString('en-IN')}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    backgroundColor: colors.surface, ...shadows.small
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.primaryXLight,
    justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm
  },
  headerTitles: { flex: 1 },
  brandText: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  shareBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.primaryXLight,
    justifyContent: 'center', alignItems: 'center'
  },
  scroll: { flex: 1 },

  typeTabs: {
    flexDirection: 'row', margin: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.md,
    padding: 4, ...shadows.xs
  },
  typeTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: radius.sm
  },
  typeTabActive: { backgroundColor: colors.primary },
  typeTabText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  typeTabTextActive: { color: '#fff' },

  filtersCard: {
    marginHorizontal: spacing.md, backgroundColor: colors.surface,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md,
    ...shadows.card
  },
  filtersTitle: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 12 },
  dateRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  dateInputBox: { flex: 1 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginBottom: 4 },
  dateInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.surfaceMuted, borderRadius: radius.sm,
    paddingHorizontal: 10, paddingVertical: 9,
    borderWidth: 1, borderColor: colors.border
  },
  dateInput: { flex: 1, fontSize: 13, color: colors.text },
  selectorBox: { marginBottom: 12 },
  selectorBtn: {
    backgroundColor: colors.surfaceMuted, borderRadius: radius.sm,
    paddingHorizontal: spacing.md, paddingVertical: 11,
    borderWidth: 1, borderColor: colors.border
  },
  selectorBtnText: { fontSize: 14, color: colors.text, fontWeight: '500' },
  generateBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: 13, alignItems: 'center'
  },
  generateBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  reportHeader: {
    marginHorizontal: spacing.md, marginBottom: 8,
    backgroundColor: colors.primary, borderRadius: radius.md,
    padding: spacing.md
  },
  reportTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  reportSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  summaryGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    marginHorizontal: spacing.md, gap: 8, marginBottom: 12
  },
  summaryCard: {
    backgroundColor: colors.surface, borderRadius: radius.sm,
    padding: 10, minWidth: '30%', flex: 1,
    ...shadows.xs, borderWidth: 1, borderColor: colors.divider
  },
  summaryLabel: { fontSize: 10, color: colors.textMuted, textTransform: 'uppercase', fontWeight: '600' },
  summaryValue: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 2 },

  tableTitle: {
    fontSize: 13, fontWeight: '700', color: colors.text,
    marginHorizontal: spacing.md, marginBottom: 6
  },
  tableRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: colors.surface, marginHorizontal: spacing.md,
    marginBottom: 4, borderRadius: radius.sm, padding: 10,
    borderWidth: 1, borderColor: colors.divider
  },
  tableRowLeft: { flex: 1 },
  tableRowRight: { alignItems: 'flex-end' },
  tableRowName: { fontSize: 14, fontWeight: '700', color: colors.text },
  tableRowAmount: { fontSize: 15, fontWeight: '800', color: colors.success },
  tableRowSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },

  tableSearchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: spacing.md, marginBottom: 8,
    backgroundColor: colors.surface, borderRadius: radius.sm,
    paddingHorizontal: 10, paddingVertical: 8,
    borderWidth: 1, borderColor: colors.border
  },
  tableSearch: { flex: 1, fontSize: 13, color: colors.text },

  tableHeader: {
    flexDirection: 'row', backgroundColor: colors.primary,
    marginHorizontal: spacing.md, borderRadius: radius.sm,
    paddingVertical: 8, paddingHorizontal: 6, marginBottom: 2
  },
  tableHeaderCell: {
    flex: 1, fontSize: 9, fontWeight: '700', color: '#fff',
    textTransform: 'uppercase', textAlign: 'center'
  },
  tableDataRow: {
    flexDirection: 'row', marginHorizontal: spacing.md,
    paddingVertical: 7, paddingHorizontal: 6,
    borderBottomWidth: 1, borderBottomColor: colors.divider
  },
  tableDataCell: {
    flex: 1, fontSize: 11, color: colors.text, textAlign: 'center'
  },

  shareBottomBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, margin: spacing.md, backgroundColor: colors.primary,
    borderRadius: radius.md, paddingVertical: 14, ...shadows.card
  },
  shareBottomBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Picker Modal
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  pickerContainer: {
    backgroundColor: colors.surface, borderTopLeftRadius: 22,
    borderTopRightRadius: 22, padding: spacing.lg, maxHeight: '75%'
  },
  pickerTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 12 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surfaceMuted, borderRadius: radius.sm,
    paddingHorizontal: 10, paddingVertical: 8,
    borderWidth: 1, borderColor: colors.border, marginBottom: 10
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  pickerItem: {
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.divider
  },
  pickerItemName: { fontSize: 15, fontWeight: '700', color: colors.text },
  pickerItemSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  pickerEmpty: { textAlign: 'center', color: colors.textMuted, padding: 20 },
  pickerClose: {
    marginTop: 12, backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm, paddingVertical: 12, alignItems: 'center'
  },
  pickerCloseText: { color: colors.textMuted, fontWeight: '700' }
});

export default ReportsScreen;
