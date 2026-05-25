import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { ChevronLeft, Settings, NotepadText, Save, ChevronDown, Store } from 'lucide-react-native';
import { rateChartApi } from '../../api/api';
import { fetchCenters } from '../../redux/slices/centerSlice';
import { colors, radius, spacing, shadows, typography } from '../../theme';

// ─── helpers ─────────────────────────────────────────────────────────────────
const stepRange = (min, max, step) => {
  const out = [];
  for (let v = min; v <= max + step / 2; v += step)
    out.push(Math.round(v * 100) / 100);
  return out;
};

const buildMatrix = (s) => {
  const fats = stepRange(s.fatMin, s.fatMax, 0.1);
  const snfs = stepRange(s.snfMin, s.snfMax, 0.1);
  const rows = fats.map((fat) => {
    const fatSteps = Math.round((fat - s.fatMin) / 0.1);
    return {
      fat,
      cells: snfs.map((snf) => {
        const snfSteps = Math.round((snf - s.snfMin) / 0.1);
        const rate = s.baseRate + fatSteps * s.fatStepInr + snfSteps * s.snfStepInr;
        return { snf, rate: Math.round(rate * 100) / 100 };
      })
    };
  });
  return { fats, snfs, rows };
};

// ─── CenterPicker ─────────────────────────────────────────────────────────────
const CenterPicker = ({ centers, selectedId, onSelect }) => {
  const [open, setOpen] = useState(false);
  const selected = centers.find((c) => c._id === selectedId);

  return (
    <View style={cp.wrapper}>
      <TouchableOpacity style={cp.trigger} onPress={() => setOpen((v) => !v)} activeOpacity={0.8}>
        <Store size={16} color={colors.primary} strokeWidth={2.5} />
        <Text style={[cp.triggerText, !selected && { color: colors.textMuted }]} numberOfLines={1}>
          {selected ? selected.name : 'Select a Collection Center'}
        </Text>
        <ChevronDown size={16} color={colors.textMuted} strokeWidth={2.5}
          style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }} />
      </TouchableOpacity>

      {open && (
        <View style={cp.dropdown}>
          {centers.map((c) => (
            <TouchableOpacity
              key={c._id}
              style={[cp.option, c._id === selectedId && cp.optionActive]}
              onPress={() => { onSelect(c._id); setOpen(false); }}
            >
              <Text style={[cp.optionText, c._id === selectedId && cp.optionTextActive]}>
                {c.name}
              </Text>
              <Text style={cp.optionCode}>{c.centerCode}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};
const cp = StyleSheet.create({
  wrapper:         { marginBottom: spacing.md, zIndex: 100 },
  trigger:         { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface,
                     borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.primary,
                     paddingHorizontal: spacing.md, paddingVertical: 13, ...shadows.xs },
  triggerText:     { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  dropdown:        { position: 'absolute', top: 52, left: 0, right: 0, backgroundColor: colors.surface,
                     borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
                     ...shadows.medium, zIndex: 200 },
  option:          { paddingHorizontal: spacing.md, paddingVertical: 12,
                     borderBottomWidth: 1, borderBottomColor: colors.divider,
                     flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optionActive:    { backgroundColor: colors.primaryXLight },
  optionText:      { fontSize: 14, fontWeight: '600', color: colors.text },
  optionTextActive:{ color: colors.primary },
  optionCode:      { fontSize: 12, color: colors.textMuted },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
const RateChartScreen = ({ navigation }) => {
  const token    = useSelector((s) => s.auth.token);
  const dispatch = useDispatch();
  const centers  = useSelector((s) => s.centers.list);
  const insets   = useSafeAreaInsets();

  const [selectedCenterId, setSelectedCenterId] = useState('');
  const [settings,   setSettings]   = useState(null);
  const [isDefault,  setIsDefault]  = useState(false); // true = not yet saved for this center
  const [loading,    setLoading]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Editable inputs
  const [baseInput,    setBaseInput]    = useState('');
  const [fatStepInput, setFatStepInput] = useState('');
  const [snfStepInput, setSnfStepInput] = useState('');

  // Load centers list once
  useEffect(() => {
    if (token) dispatch(fetchCenters(token));
  }, [dispatch, token]);

  // Load rate chart whenever selected center changes
  const loadChart = useCallback(async (centerId) => {
    if (!centerId) return;
    setLoading(true);
    try {
      const { data } = await rateChartApi.get(token, centerId);
      setSettings(data);
      setIsDefault(!!data._isDefault);
      setBaseInput(String(data.baseRate ?? 30));
      setFatStepInput(String(data.fatStepInr ?? 0.3));
      setSnfStepInput(String(data.snfStepInr ?? 0.5));
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleSelectCenter = (id) => {
    setSelectedCenterId(id);
    setSettings(null);
    loadChart(id);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChart(selectedCenterId);
    setRefreshing(false);
  };

  // Live matrix preview
  const matrix = useMemo(() => {
    if (!settings) return null;
    return buildMatrix({
      ...settings,
      baseRate:   Number(baseInput)    || settings.baseRate,
      fatStepInr: Number(fatStepInput) || settings.fatStepInr,
      snfStepInr: Number(snfStepInput) || settings.snfStepInr,
    });
  }, [settings, baseInput, fatStepInput, snfStepInput]);

  const onSave = async () => {
    if (!selectedCenterId) {
      Alert.alert('No Center Selected', 'Please select a collection center first.');
      return;
    }
    const base    = Number(baseInput);
    const fatStep = Number(fatStepInput);
    const snfStep = Number(snfStepInput);
    if (isNaN(base)    || base    <= 0) { Alert.alert('Invalid', 'Base rate must be > 0');    return; }
    if (isNaN(fatStep) || fatStep <  0) { Alert.alert('Invalid', 'FAT step must be ≥ 0');     return; }
    if (isNaN(snfStep) || snfStep <  0) { Alert.alert('Invalid', 'SNF step must be ≥ 0');     return; }

    setSaving(true);
    try {
      const { data } = await rateChartApi.update(
        { baseRate: base, fatStepInr: fatStep, snfStepInr: snfStep },
        token,
        selectedCenterId
      );
      setSettings(data);
      setIsDefault(false);
      Alert.alert('Saved', `Rate chart saved for ${centers.find(c => c._id === selectedCenterId)?.name || 'center'}.`);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const selectedCenter = centers.find((c) => c._id === selectedCenterId);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: 60 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft size={20} color={colors.text} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.brandText}>Sarvasvaa Milk</Text>
          <View style={{ width: 36 }} />
        </View>

        <Text style={styles.title}>Rate Chart</Text>
        <Text style={styles.subtitle}>
          Each collection center has its own milk rate chart. Select a center to view or edit its rates.
        </Text>

        {/* ── Center Selector ── */}
        <View style={styles.sectionLabel}>
          <Store size={15} color={colors.primary} strokeWidth={2.5} />
          <Text style={styles.sectionLabelText}>Select Collection Center</Text>
        </View>
        <CenterPicker
          centers={centers}
          selectedId={selectedCenterId}
          onSelect={handleSelectCenter}
        />

        {/* ── No center selected placeholder ── */}
        {!selectedCenterId && (
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderIcon}>🏪</Text>
            <Text style={styles.placeholderTitle}>No center selected</Text>
            <Text style={styles.placeholderSub}>
              Select a collection center above to view or configure its milk rate chart.
            </Text>
          </View>
        )}

        {/* ── Loading ── */}
        {selectedCenterId && loading && (
          <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.primary} />
        )}

        {/* ── Rate chart for selected center ── */}
        {selectedCenterId && !loading && settings && (
          <>
            {/* Center badge */}
            <View style={styles.centerBadge}>
              <View style={styles.centerBadgeDot} />
              <Text style={styles.centerBadgeText}>
                Editing: <Text style={{ color: colors.primary, fontWeight: '800' }}>{selectedCenter?.name}</Text>
                {' '}({selectedCenter?.centerCode})
              </Text>
              {isDefault && (
                <View style={styles.defaultPill}>
                  <Text style={styles.defaultPillText}>Default rates — not saved yet</Text>
                </View>
              )}
            </View>

            {/* Config card */}
            <View style={styles.configCard}>
              <View style={styles.cardHeader}>
                <Settings size={18} color={colors.primary} strokeWidth={2} />
                <Text style={styles.cardTitle}>Base Configuration</Text>
              </View>

              <Text style={styles.fieldLabel}>Base Rate (₹ per Liter)</Text>
              <View style={styles.rateRow}>
                <Text style={styles.rupee}>₹</Text>
                <TextInput
                  value={baseInput}
                  onChangeText={setBaseInput}
                  keyboardType="decimal-pad"
                  style={styles.rateInput}
                  placeholder="30.00"
                  placeholderTextColor={colors.textDisabled}
                />
              </View>

              <View style={styles.stepRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>FAT Step (₹)</Text>
                  <TextInput
                    value={fatStepInput}
                    onChangeText={setFatStepInput}
                    keyboardType="decimal-pad"
                    style={styles.stepInput}
                    placeholder="0.30"
                    placeholderTextColor={colors.textDisabled}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>SNF Step (₹)</Text>
                  <TextInput
                    value={snfStepInput}
                    onChangeText={setSnfStepInput}
                    keyboardType="decimal-pad"
                    style={styles.stepInput}
                    placeholder="0.50"
                    placeholderTextColor={colors.textDisabled}
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={onSave} disabled={saving}>
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <><Save size={17} color="#fff" strokeWidth={2.5} /><Text style={styles.saveBtnText}>Save for {selectedCenter?.name}</Text></>
                }
              </TouchableOpacity>
            </View>

            {/* Rate matrix */}
            {matrix && (
              <View style={styles.matrixCard}>
                <View style={styles.cardHeader}>
                  <NotepadText size={18} color={colors.primary} strokeWidth={2} />
                  <Text style={styles.cardTitle}>Rate Matrix Preview</Text>
                </View>
                <Text style={styles.matrixNote}>
                  Base ₹{Number(baseInput) || settings.baseRate} · FAT +₹{Number(fatStepInput) || settings.fatStepInr}/0.1 · SNF +₹{Number(snfStepInput) || settings.snfStepInr}/0.1
                </Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View>
                    {/* Header row */}
                    <View style={styles.matrixRow}>
                      <View style={[styles.cell, styles.cornerCell]}>
                        <Text style={styles.cornerText}>SNF→{'\n'}↓FAT</Text>
                      </View>
                      {matrix.snfs.map((snf) => (
                        <View key={snf} style={[styles.cell, styles.headerCell]}>
                          <Text style={styles.headerCellText}>{snf.toFixed(1)}</Text>
                        </View>
                      ))}
                    </View>
                    {/* Data rows */}
                    <ScrollView style={{ maxHeight: 380 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                      {matrix.rows.map((row) => (
                        <View key={row.fat} style={styles.matrixRow}>
                          <View style={[styles.cell, styles.rowHeaderCell]}>
                            <Text style={styles.rowHeaderText}>{row.fat.toFixed(1)}</Text>
                          </View>
                          {row.cells.map((c) => (
                            <View key={`${row.fat}-${c.snf}`} style={[styles.cell, styles.dataCell]}>
                              <Text style={styles.dataCellText}>{c.rate.toFixed(2)}</Text>
                            </View>
                          ))}
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                </ScrollView>
                <Text style={styles.matrixFooter}>Scroll horizontally and vertically to view all rates</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.bg },
  content:    { paddingHorizontal: spacing.lg },

  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  backBtn:    { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', ...shadows.xs },
  brandText:  { fontSize: 16, fontWeight: '700', color: colors.text },

  title:      { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: spacing.xs },
  subtitle:   { fontSize: 13, color: colors.textMuted, lineHeight: 20, marginBottom: spacing.lg },

  sectionLabel:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.xs },
  sectionLabelText: { fontSize: 13, fontWeight: '700', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.5 },

  placeholderCard:  { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', marginTop: spacing.lg, ...shadows.card },
  placeholderIcon:  { fontSize: 48, marginBottom: spacing.sm },
  placeholderTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 6 },
  placeholderSub:   { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },

  centerBadge:     { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, backgroundColor: colors.primaryXLight,
                     borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 10,
                     marginBottom: spacing.md, borderWidth: 1, borderColor: colors.teal100 },
  centerBadgeDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  centerBadgeText: { fontSize: 13, color: colors.text, fontWeight: '600', flex: 1 },
  defaultPill:     { backgroundColor: colors.warningLight, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: colors.warning },
  defaultPillText: { fontSize: 11, color: colors.warning, fontWeight: '700' },

  configCard:  { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, ...shadows.card },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  cardTitle:   { fontSize: 16, fontWeight: '700', color: colors.text },

  fieldLabel:  { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  rateRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceMuted,
                 borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  rupee:       { fontSize: 18, fontWeight: '700', color: colors.text, marginRight: 6 },
  rateInput:   { flex: 1, height: 50, fontSize: 16, color: colors.text, fontWeight: '600' },
  stepRow:     { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  stepInput:   { backgroundColor: colors.surfaceMuted, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
                 paddingHorizontal: spacing.md, height: 44, fontSize: 15, color: colors.text },

  saveBtn:     { flexDirection: 'row', backgroundColor: colors.primary, borderRadius: radius.md,
                 paddingVertical: 13, alignItems: 'center', justifyContent: 'center', gap: 8, ...shadows.sm },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  matrixCard:    { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, ...shadows.card },
  matrixNote:    { fontSize: 12, color: colors.textMuted, marginBottom: spacing.sm },
  matrixRow:     { flexDirection: 'row' },
  cell:          { width: 58, height: 38, justifyContent: 'center', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  cornerCell:    { backgroundColor: colors.lightGray },
  cornerText:    { fontSize: 9, fontWeight: '700', color: colors.textMuted, textAlign: 'center' },
  headerCell:    { backgroundColor: colors.primaryXLight },
  headerCellText:{ fontSize: 10, fontWeight: '700', color: colors.primary },
  rowHeaderCell: { backgroundColor: colors.accentLight },
  rowHeaderText: { fontSize: 11, fontWeight: '700', color: colors.accent },
  dataCell:      { backgroundColor: colors.surface },
  dataCellText:  { fontSize: 10, color: colors.text, fontWeight: '600' },
  matrixFooter:  { fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
});

export default RateChartScreen;
