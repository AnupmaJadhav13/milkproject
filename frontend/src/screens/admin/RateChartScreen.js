import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { ChevronLeft, Settings, NotepadText, Save, ChevronDown, Store, Plus, X } from 'lucide-react-native';
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
    return {
      fat,
      cells: snfs.map((snf) => {
        const rate = calculateRatePreview(fat, snf, s);
        return { snf, rate: Math.round(rate * 100) / 100 };
      })
    };
  });
  return { fats, snfs, rows };
};

// Calculate rate using tiered steps (same logic as backend)
const calculateRatePreview = (fat, snf, settings) => {
  if (!settings || !settings.fatSteps || !settings.snfSteps) {
    return settings?.baseRate || 0;
  }
  
  const fatBonus = calculateTieredBonus(
    fat, 
    settings.fatSteps, 
    settings.fatMin || 3.0, 
    settings.fatMax || 5.5
  );
  const snfBonus = calculateTieredBonus(
    snf, 
    settings.snfSteps, 
    settings.snfMin || 7.5, 
    settings.snfMax || 9.0
  );
  return (settings.baseRate || 0) + fatBonus + snfBonus;
};

const calculateTieredBonus = (value, steps, minValue, maxValue) => {
  if (!steps || steps.length === 0) return 0;
  
  const clampedValue = Math.max(minValue, Math.min(maxValue, value));
  const sortedSteps = [...steps].sort((a, b) => a.fromValue - b.fromValue);
  
  let totalBonus = 0;
  let currentValue = minValue;
  
  for (let i = 0; i < sortedSteps.length; i++) {
    const step = sortedSteps[i];
    const stepStart = step.fromValue;
    const stepRate = step.stepRate;
    const stepEnd = i < sortedSteps.length - 1 ? sortedSteps[i + 1].fromValue : maxValue;
    
    if (clampedValue <= stepStart) break;
    
    const rangeStart = Math.max(currentValue, stepStart);
    const rangeEnd = Math.min(clampedValue, stepEnd);
    
    if (rangeEnd > rangeStart) {
      const stepsInRange = Math.round((rangeEnd - rangeStart) * 10);
      totalBonus += stepsInRange * stepRate;
    }
    
    currentValue = rangeEnd;
    if (currentValue >= clampedValue) break;
  }
  
  return Number(totalBonus.toFixed(2));
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

// ─── StepBuilder Component ────────────────────────────────────────────────────
const StepBuilder = ({ title, steps, onStepsChange, minValue, maxValue }) => {
  const addStep = () => {
    const lastStep = steps.length > 0 ? steps[steps.length - 1] : null;
    const newFromValue = lastStep ? lastStep.fromValue + 0.5 : minValue;
    onStepsChange([...steps, { fromValue: newFromValue, stepRate: 0.3 }]);
  };

  const removeStep = (index) => {
    if (steps.length === 1) {
      Alert.alert('Cannot Remove', 'At least one step is required');
      return;
    }
    onStepsChange(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index, field, value) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: parseFloat(value) || 0 };
    onStepsChange(updated);
  };

  return (
    <View style={sb.container}>
      <View style={sb.header}>
        <Text style={sb.title}>{title}</Text>
        <TouchableOpacity style={sb.addBtn} onPress={addStep}>
          <Plus size={16} color={colors.primary} strokeWidth={2.5} />
          <Text style={sb.addBtnText}>Add Step</Text>
        </TouchableOpacity>
      </View>

      {steps.map((step, index) => (
        <View key={index} style={sb.stepRow}>
          <View style={sb.stepInputs}>
            <View style={sb.inputGroup}>
              <Text style={sb.inputLabel}>From</Text>
              <TextInput
                value={String(step.fromValue)}
                onChangeText={(val) => updateStep(index, 'fromValue', val)}
                keyboardType="decimal-pad"
                style={sb.input}
                placeholder="3.0"
              />
            </View>
            <View style={sb.inputGroup}>
              <Text style={sb.inputLabel}>Step Rate (₹)</Text>
              <TextInput
                value={String(step.stepRate)}
                onChangeText={(val) => updateStep(index, 'stepRate', val)}
                keyboardType="decimal-pad"
                style={sb.input}
                placeholder="0.30"
              />
            </View>
          </View>
          {steps.length > 1 && (
            <TouchableOpacity style={sb.deleteBtn} onPress={() => removeStep(index)}>
              <X size={18} color={colors.error} strokeWidth={2.5} />
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
};

const sb = StyleSheet.create({
  container:   { marginBottom: spacing.md },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  title:       { fontSize: 14, fontWeight: '700', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.5 },
  addBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primaryXLight,
                 paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm },
  addBtnText:  { fontSize: 12, fontWeight: '700', color: colors.primary },
  stepRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm,
                 backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: spacing.sm },
  stepInputs:  { flex: 1, flexDirection: 'row', gap: spacing.sm },
  inputGroup:  { flex: 1 },
  inputLabel:  { fontSize: 11, fontWeight: '600', color: colors.textMuted, marginBottom: 4 },
  input:       { backgroundColor: colors.surface, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border,
                 paddingHorizontal: spacing.sm, paddingVertical: 8, fontSize: 14, color: colors.text },
  deleteBtn:   { padding: 8, backgroundColor: colors.errorLight, borderRadius: radius.sm },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
const RateChartScreen = ({ navigation }) => {
  const token    = useSelector((s) => s.auth.token);
  const dispatch = useDispatch();
  const centers  = useSelector((s) => s.centers.list);
  const insets   = useSafeAreaInsets();

  const [selectedCenterId, setSelectedCenterId] = useState('');
  const [selectedAnimalType, setSelectedAnimalType] = useState('Cow'); // 'Cow' or 'Buffalo'
  const [settings,   setSettings]   = useState(null);
  const [isDefault,  setIsDefault]  = useState(false); // true = not yet saved for this center
  const [loading,    setLoading]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Editable inputs
  const [baseInput, setBaseInput] = useState('');
  const [fatSteps, setFatSteps] = useState([{ fromValue: 3.0, stepRate: 0.3 }]);
  const [snfSteps, setSnfSteps] = useState([{ fromValue: 7.5, stepRate: 0.5 }]);

  // Track original values to detect changes
  const [originalData, setOriginalData] = useState(null);

  // Load centers list once
  useEffect(() => {
    if (token) dispatch(fetchCenters(token));
  }, [dispatch, token]);

  // Detect unsaved changes
  useEffect(() => {
    if (!originalData) return;
    
    const hasChanges = 
      baseInput !== String(originalData.baseRate) ||
      JSON.stringify(fatSteps) !== JSON.stringify(originalData.fatSteps) ||
      JSON.stringify(snfSteps) !== JSON.stringify(originalData.snfSteps);
    
    setHasUnsavedChanges(hasChanges);
  }, [baseInput, fatSteps, snfSteps, originalData]);

  // Load rate chart whenever selected center or animal type changes
  const loadChart = useCallback(async (centerId, animalType) => {
    if (!centerId) return;
    setLoading(true);
    try {
      const { data } = await rateChartApi.get(token, centerId, animalType);
      setSettings(data);
      setIsDefault(!!data._isDefault);
      const baseRate = data.baseRate ?? (animalType === 'Buffalo' ? 35 : 30);
      const defaultFatSteps = data.fatSteps || [{ fromValue: animalType === 'Buffalo' ? 5.0 : 3.0, stepRate: animalType === 'Buffalo' ? 0.5 : 0.3 }];
      const defaultSnfSteps = data.snfSteps || [{ fromValue: animalType === 'Buffalo' ? 8.0 : 7.5, stepRate: animalType === 'Buffalo' ? 0.6 : 0.5 }];
      
      setBaseInput(String(baseRate));
      setFatSteps(defaultFatSteps);
      setSnfSteps(defaultSnfSteps);
      
      // Store original data for change detection
      setOriginalData({
        baseRate: String(baseRate),
        fatSteps: defaultFatSteps,
        snfSteps: defaultSnfSteps
      });
      
      setHasUnsavedChanges(false);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleSelectCenter = (id) => {
    // Warn about unsaved changes
    if (hasUnsavedChanges && selectedCenterId) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Do you want to save them before switching centers?',
        [
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              setSelectedCenterId(id);
              setSettings(null);
              setHasUnsavedChanges(false);
              loadChart(id, selectedAnimalType);
            }
          },
          {
            text: 'Save & Switch',
            onPress: async () => {
              await onSave();
              setSelectedCenterId(id);
              setSettings(null);
              loadChart(id, selectedAnimalType);
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } else {
      setSelectedCenterId(id);
      setSettings(null);
      loadChart(id, selectedAnimalType);
    }
  };

  const handleSelectAnimalType = (type) => {
    // Warn about unsaved changes
    if (hasUnsavedChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Do you want to save them before switching animal types?',
        [
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              setSelectedAnimalType(type);
              setHasUnsavedChanges(false);
              if (selectedCenterId) {
                loadChart(selectedCenterId, type);
              }
            }
          },
          {
            text: 'Save & Switch',
            onPress: async () => {
              await onSave();
              setSelectedAnimalType(type);
              if (selectedCenterId) {
                loadChart(selectedCenterId, type);
              }
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } else {
      setSelectedAnimalType(type);
      if (selectedCenterId) {
        loadChart(selectedCenterId, type);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChart(selectedCenterId, selectedAnimalType);
    setRefreshing(false);
  };

  // Live matrix preview
  const matrix = useMemo(() => {
    if (!settings) return null;
    
    // Ensure all required fields exist
    const matrixSettings = {
      baseRate: Number(baseInput) || settings.baseRate || 30,
      fatSteps: fatSteps || settings.fatSteps || [],
      snfSteps: snfSteps || settings.snfSteps || [],
      fatMin: settings.fatMin || (selectedAnimalType === 'Buffalo' ? 5.0 : 3.0),
      fatMax: settings.fatMax || (selectedAnimalType === 'Buffalo' ? 7.0 : 5.5),
      snfMin: settings.snfMin || (selectedAnimalType === 'Buffalo' ? 8.0 : 7.5),
      snfMax: settings.snfMax || (selectedAnimalType === 'Buffalo' ? 9.5 : 9.0),
    };
    
    return buildMatrix(matrixSettings);
  }, [settings, baseInput, fatSteps, snfSteps, selectedAnimalType]);

  const onSave = async () => {
    if (!selectedCenterId) {
      Alert.alert('No Center Selected', 'Please select a collection center first.');
      return;
    }
    const base = Number(baseInput);
    if (isNaN(base) || base <= 0) { 
      Alert.alert('Invalid', 'Base rate must be > 0'); 
      return; 
    }

    // Validate steps
    for (const step of fatSteps) {
      if (isNaN(step.fromValue) || isNaN(step.stepRate)) {
        Alert.alert('Invalid', 'All FAT step values must be valid numbers');
        return;
      }
    }
    for (const step of snfSteps) {
      if (isNaN(step.fromValue) || isNaN(step.stepRate)) {
        Alert.alert('Invalid', 'All SNF step values must be valid numbers');
        return;
      }
    }

    setSaving(true);
    try {
      const payload = { 
        baseRate: base, 
        fatSteps: fatSteps.map(s => ({ 
          fromValue: Number(s.fromValue), 
          stepRate: Number(s.stepRate) 
        })),
        snfSteps: snfSteps.map(s => ({ 
          fromValue: Number(s.fromValue), 
          stepRate: Number(s.stepRate) 
        }))
      };
      
      const { data } = await rateChartApi.update(
        payload,
        token,
        selectedCenterId,
        selectedAnimalType
      );
      setSettings(data);
      setIsDefault(false);
      
      // Update original data to reflect saved state
      setOriginalData({
        baseRate: String(base),
        fatSteps: fatSteps.map(s => ({ 
          fromValue: Number(s.fromValue), 
          stepRate: Number(s.stepRate) 
        })),
        snfSteps: snfSteps.map(s => ({ 
          fromValue: Number(s.fromValue), 
          stepRate: Number(s.stepRate) 
        }))
      });
      setHasUnsavedChanges(false);
      
      Alert.alert('Saved', `${selectedAnimalType} rate chart saved for ${centers.find(c => c._id === selectedCenterId)?.name || 'center'}.`);
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
          Configure tiered rate steps for each collection center. Different rates for Cow and Buffalo milk.
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

        {/* ── Animal Type Selector ── */}
        {selectedCenterId && (
          <View style={styles.animalTypeContainer}>
            <TouchableOpacity
              style={[styles.animalTypeBtn, selectedAnimalType === 'Cow' && styles.animalTypeBtnActive]}
              onPress={() => handleSelectAnimalType('Cow')}
            >
              <Text style={[styles.animalTypeText, selectedAnimalType === 'Cow' && styles.animalTypeTextActive]}>
                🐄 Cow
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.animalTypeBtn, selectedAnimalType === 'Buffalo' && styles.animalTypeBtnActive]}
              onPress={() => handleSelectAnimalType('Buffalo')}
            >
              <Text style={[styles.animalTypeText, selectedAnimalType === 'Buffalo' && styles.animalTypeTextActive]}>
                🐃 Buffalo
              </Text>
            </TouchableOpacity>
          </View>
        )}

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
                {' '}({selectedCenter?.centerCode}) - {selectedAnimalType}
              </Text>
              {isDefault && (
                <View style={styles.defaultPill}>
                  <Text style={styles.defaultPillText}>Default rates — not saved yet</Text>
                </View>
              )}
            </View>

            {/* Range info */}
            <View style={styles.rangeInfo}>
              <Text style={styles.rangeInfoText}>
                {selectedAnimalType === 'Cow' 
                  ? '🐄 Cow: FAT 3.0-5.5% • SNF 7.5-9.0%'
                  : '🐃 Buffalo: FAT 5.0-7.0% • SNF 8.0-9.5%'
                }
              </Text>
            </View>

            {/* Config card */}
            <View style={styles.configCard}>
              <View style={styles.cardHeader}>
                <Settings size={18} color={colors.primary} strokeWidth={2} />
                <Text style={styles.cardTitle}>Base Configuration</Text>
              </View>

              <Text style={styles.fieldLabel}>Starting Amount (₹ per Liter)</Text>
              <View style={styles.rateRow}>
                <Text style={styles.rupee}>₹</Text>
                <TextInput
                  value={baseInput}
                  onChangeText={setBaseInput}
                  keyboardType="decimal-pad"
                  style={styles.rateInput}
                  placeholder={selectedAnimalType === 'Buffalo' ? '35.00' : '30.00'}
                  placeholderTextColor={colors.textDisabled}
                />
              </View>

              <StepBuilder
                title="FAT Steps"
                steps={fatSteps}
                onStepsChange={setFatSteps}
                minValue={settings.fatMin}
                maxValue={settings.fatMax}
              />

              <StepBuilder
                title="SNF Steps"
                steps={snfSteps}
                onStepsChange={setSnfSteps}
                minValue={settings.snfMin}
                maxValue={settings.snfMax}
              />

              {hasUnsavedChanges && (
                <View style={styles.unsavedWarning}>
                  <Text style={styles.unsavedWarningText}>⚠️ You have unsaved changes</Text>
                </View>
              )}

              <TouchableOpacity 
                style={[styles.saveBtn, hasUnsavedChanges && styles.saveBtnHighlight]} 
                onPress={onSave} 
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <><Save size={17} color="#fff" strokeWidth={2.5} /><Text style={styles.saveBtnText}>Save {selectedAnimalType} Rates{hasUnsavedChanges ? ' *' : ''}</Text></>
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
                  Base ₹{Number(baseInput) || settings.baseRate} with tiered FAT and SNF steps
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

  animalTypeContainer: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  animalTypeBtn:       { flex: 1, paddingVertical: 12, borderRadius: radius.md, backgroundColor: colors.surface,
                         borderWidth: 2, borderColor: colors.border, alignItems: 'center', ...shadows.xs },
  animalTypeBtnActive: { backgroundColor: colors.primaryXLight, borderColor: colors.primary },
  animalTypeText:      { fontSize: 15, fontWeight: '700', color: colors.textMuted },
  animalTypeTextActive:{ color: colors.primary },

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

  rangeInfo:       { backgroundColor: colors.accentLight, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 8, marginBottom: spacing.md },
  rangeInfoText:   { fontSize: 12, fontWeight: '600', color: colors.accent, textAlign: 'center' },

  configCard:  { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, ...shadows.card },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  cardTitle:   { fontSize: 16, fontWeight: '700', color: colors.text },

  fieldLabel:  { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  rateRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceMuted,
                 borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  rupee:       { fontSize: 18, fontWeight: '700', color: colors.text, marginRight: 6 },
  rateInput:   { flex: 1, height: 50, fontSize: 16, color: colors.text, fontWeight: '600' },

  unsavedWarning:     { backgroundColor: colors.warningLight, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 8, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.warning },
  unsavedWarningText: { fontSize: 12, fontWeight: '600', color: colors.warning, textAlign: 'center' },

  saveBtn:     { flexDirection: 'row', backgroundColor: colors.primary, borderRadius: radius.md,
                 paddingVertical: 13, alignItems: 'center', justifyContent: 'center', gap: 8, ...shadows.sm, marginTop: spacing.md },
  saveBtnHighlight: { backgroundColor: colors.warning, ...shadows.medium },
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
