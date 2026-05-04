import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { rateChartApi } from '../../api/api';

const stepRange = (min, max, step) => {
  const out = [];
  for (let v = min; v <= max + step / 2; v += step) {
    out.push(Math.round(v * 100) / 100);
  }
  return out;
};

const buildMatrix = (settings) => {
  const {
    baseRate,
    fatStepInr,
    snfStepInr,
    fatMin,
    fatMax,
    snfMin,
    snfMax
  } = settings;
  const fats = stepRange(fatMin, fatMax, 0.1);
  const snfs = stepRange(snfMin, snfMax, 0.1);
  const rows = fats.map((fat) => {
    const fatSteps = Math.round((fat - fatMin) / 0.1);
    return {
      fat,
      cells: snfs.map((snf) => {
        const snfSteps = Math.round((snf - snfMin) / 0.1);
        const rate = baseRate + fatSteps * fatStepInr + snfSteps * snfStepInr;
        return { snf, rate: Math.round(rate * 100) / 100 };
      })
    };
  });
  return { fats, snfs, rows };
};

const RateChartScreen = () => {
  const token = useSelector((state) => state.auth.token);
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [baseInput, setBaseInput] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { data } = await rateChartApi.get(token);
      setSettings(data);
      setBaseInput(String(data.baseRate ?? ''));
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Error', text2: e.message });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const matrix = useMemo(() => {
    if (!settings) return null;
    return buildMatrix({
      ...settings,
      baseRate: Number(baseInput) || settings.baseRate
    });
  }, [settings, baseInput]);

  const onSave = async () => {
    const n = Number(baseInput);
    if (Number.isNaN(n) || n < 0) {
      Toast.show({ type: 'error', text1: 'Invalid base rate' });
      return;
    }
    setSaving(true);
    try {
      const { data } = await rateChartApi.update({ baseRate: n }, token);
      setSettings(data);
      Toast.show({ type: 'success', text1: 'Rate chart updated' });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Error', text2: e.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top + 24 }]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.muted}>Loading rate chart…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.heading}>Milk rate chart</Text>
      <Text style={styles.sub}>
        Fat {settings.fatMin}–{settings.fatMax} (step 0.1): +₹{settings.fatStepInr} per step · SNF {settings.snfMin}–{settings.snfMax}: +₹
        {settings.snfStepInr} per step. Base rate at Fat {settings.fatMin}, SNF {settings.snfMin}.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Starting rate (₹) at Fat {settings.fatMin} & SNF {settings.snfMin}</Text>
        <TextInput
          value={baseInput}
          onChangeText={setBaseInput}
          keyboardType="decimal-pad"
          style={styles.input}
          placeholder="e.g. 32.50"
        />
        <TouchableOpacity style={styles.saveBtn} onPress={onSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save base rate</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.tableTitle}>Rate matrix (₹)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator style={styles.hScroll}>
        <View>
          <View style={styles.headerRow}>
            <View style={[styles.cornerCell, styles.cell]}>
              <Text style={styles.headerText}>Fat \\ SNF</Text>
            </View>
            {matrix.snfs.map((snf) => (
              <View key={snf} style={[styles.cell, styles.headerCell]}>
                <Text style={styles.headerText}>{snf.toFixed(1)}</Text>
              </View>
            ))}
          </View>
          <ScrollView style={styles.vScroll} nestedScrollEnabled>
            {matrix.rows.map((row) => (
              <View key={row.fat} style={styles.dataRow}>
                <View style={[styles.cell, styles.rowHeader]}>
                  <Text style={styles.rowHeaderText}>{row.fat.toFixed(1)}</Text>
                </View>
                {row.cells.map((c) => (
                  <View key={`${row.fat}-${c.snf}`} style={[styles.cell, styles.dataCell]}>
                    <Text style={styles.rateText}>{c.rate.toFixed(2)}</Text>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingBottom: 24
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9'
  },
  muted: { marginTop: 8, color: '#64748b' },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8
  },
  sub: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2
  },
  label: { fontWeight: '600', color: '#334155', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 16,
    backgroundColor: '#f8fafc'
  },
  saveBtn: {
    marginTop: 12,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center'
  },
  saveText: { color: '#fff', fontWeight: '700' },
  tableTitle: { fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  hScroll: { flexGrow: 0 },
  vScroll: { maxHeight: 420 },
  headerRow: { flexDirection: 'row' },
  dataRow: { flexDirection: 'row' },
  cornerCell: { minWidth: 56, backgroundColor: '#e2e8f0' },
  cell: {
    width: 56,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#cbd5e1'
  },
  headerCell: { backgroundColor: '#dbeafe' },
  rowHeader: { backgroundColor: '#e0f2fe' },
  headerText: { fontSize: 10, fontWeight: '700', color: '#1e3a8a' },
  rowHeaderText: { fontSize: 11, fontWeight: '700', color: '#0369a1' },
  dataCell: { backgroundColor: '#fff' },
  rateText: { fontSize: 10, color: '#0f172a' }
});

export default RateChartScreen;
