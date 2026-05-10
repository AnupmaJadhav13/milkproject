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
import { colors, radius, spacing, shadows } from '../../theme';

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

const RateChartScreen = ({ navigation }) => {
  const token = useSelector((state) => state.auth.token);
  const { user } = useSelector((state) => state.auth);
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [baseInput, setBaseInput] = useState('');
  const [fatStepInput, setFatStepInput] = useState('');
  const [snfStepInput, setSnfStepInput] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { data } = await rateChartApi.get(token);
      setSettings(data);
      setBaseInput(String(data.baseRate ?? ''));
      setFatStepInput(String(data.fatStepInr ?? ''));
      setSnfStepInput(String(data.snfStepInr ?? ''));
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
      baseRate: Number(baseInput) || settings.baseRate,
      fatStepInr: Number(fatStepInput) || settings.fatStepInr,
      snfStepInr: Number(snfStepInput) || settings.snfStepInr
    });
  }, [settings, baseInput, fatStepInput, snfStepInput]);

  const onSave = async () => {
    const base = Number(baseInput);
    const fatStep = Number(fatStepInput);
    const snfStep = Number(snfStepInput);
    
    if (Number.isNaN(base) || base < 0) {
      Toast.show({ type: 'error', text1: 'Invalid base rate' });
      return;
    }
    if (Number.isNaN(fatStep) || fatStep < 0) {
      Toast.show({ type: 'error', text1: 'Invalid FAT step' });
      return;
    }
    if (Number.isNaN(snfStep) || snfStep < 0) {
      Toast.show({ type: 'error', text1: 'Invalid SNF step' });
      return;
    }

    setSaving(true);
    try {
      const { data } = await rateChartApi.update({ 
        baseRate: base, 
        fatStepInr: fatStep, 
        snfStepInr: snfStep 
      }, token);
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
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.muted}>Loading rate chart…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.brandText}>Sarvasvaa Milk</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Title & Subtitle */}
        <Text style={styles.title}>Milk rate chart</Text>
        <Text style={styles.subtitle}>
          Configure the baseline purchasing rates for milk based on Fat and SNF incremental steps. 
          The matrix below automatically generates incremental rates from your starting rate. 
          Ensure your base rate aligns with current market standards.
        </Text>

        {/* Base Configuration Card */}
        <View style={styles.configCard}>
          <View style={styles.configHeader}>
            <Text style={styles.configIcon}>⚙️</Text>
            <Text style={styles.configTitle}>Base Configuration</Text>
          </View>

          <Text style={styles.configSubtitle}>Starting rate (per Liter)</Text>
          <View style={styles.rateInputRow}>
            <Text style={styles.rupeeSymbol}>₹</Text>
            <TextInput
              value={baseInput}
              onChangeText={setBaseInput}
              keyboardType="decimal-pad"
              style={styles.rateInput}
              placeholder="35.50"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.stepInputsRow}>
            <View style={styles.stepInputBox}>
              <Text style={styles.stepLabel}>Fat Step (+)</Text>
              <TextInput
                value={fatStepInput}
                onChangeText={setFatStepInput}
                keyboardType="decimal-pad"
                style={styles.stepInput}
                placeholder="0.50"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={styles.stepInputBox}>
              <Text style={styles.stepLabel}>SNF Step (+)</Text>
              <TextInput
                value={snfStepInput}
                onChangeText={setSnfStepInput}
                keyboardType="decimal-pad"
                style={styles.stepInput}
                placeholder="0.25"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={onSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.saveButtonIcon}>💾</Text>
                <Text style={styles.saveButtonText}>Save Configuration</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Matrix Overview */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <Text style={styles.overviewIcon}>📊</Text>
            <Text style={styles.overviewTitle}>Matrix Overview</Text>
          </View>

          <View style={styles.overviewGrid}>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>Min Fat</Text>
              <Text style={styles.overviewValue}>{settings.fatMin}%</Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>Max Fat</Text>
              <Text style={styles.overviewValue}>{settings.fatMax}%</Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>Min SNF</Text>
              <Text style={styles.overviewValue}>{settings.snfMin}%</Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>Max SNF</Text>
              <Text style={styles.overviewValue}>{settings.snfMax}%</Text>
            </View>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <Text style={styles.infoText}>
              The matrix below displays computed rates per liter. Top row represents SNF % (Fixed), 
              left column represents Fat % (Fixed). Values highlight the progressive increment based on your step configuration.
            </Text>
          </View>
        </View>

        {/* Generated Rate Matrix */}
        <View style={styles.matrixCard}>
          <View style={styles.matrixHeader}>
            <View style={styles.matrixHeaderLeft}>
              <Text style={styles.matrixIcon}>📋</Text>
              <Text style={styles.matrixTitle}>Generated Rate Matrix</Text>
            </View>
            <View style={styles.matrixActions}>
              <TouchableOpacity style={styles.matrixActionButton}>
                <Text style={styles.matrixActionIcon}>⬇️</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.matrixActionButton}>
                <Text style={styles.matrixActionIcon}>🖨️</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator style={styles.matrixScroll}>
            <View>
              {/* Header Row */}
              <View style={styles.matrixRow}>
                <View style={[styles.matrixCell, styles.matrixHeaderCell, styles.matrixCornerCell]}>
                  <Text style={styles.matrixHeaderText}>SNF →{'\n'}↓ FAT</Text>
                </View>
                {matrix.snfs.map((snf) => (
                  <View key={snf} style={[styles.matrixCell, styles.matrixHeaderCell]}>
                    <Text style={styles.matrixHeaderText}>{snf.toFixed(1)}</Text>
                  </View>
                ))}
              </View>

              {/* Data Rows */}
              <ScrollView style={styles.matrixDataScroll} nestedScrollEnabled>
                {matrix.rows.map((row) => (
                  <View key={row.fat} style={styles.matrixRow}>
                    <View style={[styles.matrixCell, styles.matrixRowHeaderCell]}>
                      <Text style={styles.matrixRowHeaderText}>{row.fat.toFixed(1)}</Text>
                    </View>
                    {row.cells.map((c) => (
                      <View key={`${row.fat}-${c.snf}`} style={[styles.matrixCell, styles.matrixDataCell]}>
                        <Text style={styles.matrixDataText}>{c.rate.toFixed(2)}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </ScrollView>
            </View>
          </ScrollView>

          <Text style={styles.matrixFooter}>
            Scroll horizontally and vertically to view more rates
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('AdminDashboard')}>
          <View style={styles.navIconContainer}>
            <Text style={styles.navIcon}>📊</Text>
          </View>
          <Text style={styles.navLabel}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CollectionRecords')}>
          <View style={styles.navIconContainer}>
            <Text style={styles.navIcon}>📦</Text>
          </View>
          <Text style={styles.navLabel}>Collections</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('AllPays')}>
          <View style={styles.navIconContainer}>
            <Text style={styles.navIcon}>💳</Text>
          </View>
          <Text style={styles.navLabel}>Payments</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('FarmerList')}>
          <View style={styles.navIconContainer}>
            <Text style={styles.navIcon}>👥</Text>
          </View>
          <Text style={styles.navLabel}>Farmers</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg
  },
  scrollView: {
    flex: 1
  },
  content: {
    padding: spacing.lg
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg
  },
  muted: { 
    marginTop: 8, 
    color: colors.textMuted 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small
  },
  backIcon: {
    fontSize: 20,
    color: colors.text,
    fontWeight: '700'
  },
  brandText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text
  },
  headerSpacer: {
    width: 36
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: spacing.lg
  },
  configCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card
  },
  configHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  configIcon: {
    fontSize: 20,
    marginRight: spacing.xs
  },
  configTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text
  },
  configSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.xs
  },
  rateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md
  },
  rupeeSymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginRight: spacing.xs
  },
  rateInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: colors.text,
    fontWeight: '600'
  },
  stepInputsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  stepInputBox: {
    flex: 1
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.xs
  },
  stepInput: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 44,
    fontSize: 15,
    color: colors.text
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small
  },
  saveButtonIcon: {
    fontSize: 16,
    marginRight: spacing.xs
  },
  saveButtonText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 15
  },
  overviewCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  overviewIcon: {
    fontSize: 20,
    marginRight: spacing.xs
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  overviewItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.lightBlue,
    borderRadius: radius.sm,
    padding: spacing.md,
    alignItems: 'center'
  },
  overviewLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 4
  },
  overviewValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.lightGray,
    borderRadius: radius.sm,
    padding: spacing.sm
  },
  infoIcon: {
    fontSize: 16,
    marginRight: spacing.xs
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16
  },
  matrixCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card
  },
  matrixHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  matrixHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  matrixIcon: {
    fontSize: 20,
    marginRight: spacing.xs
  },
  matrixTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text
  },
  matrixActions: {
    flexDirection: 'row',
    gap: spacing.xs
  },
  matrixActionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center'
  },
  matrixActionIcon: {
    fontSize: 14
  },
  matrixScroll: {
    flexGrow: 0
  },
  matrixDataScroll: {
    maxHeight: 400
  },
  matrixRow: {
    flexDirection: 'row'
  },
  matrixCell: {
    width: 60,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border
  },
  matrixHeaderCell: {
    backgroundColor: colors.lightBlue
  },
  matrixCornerCell: {
    backgroundColor: colors.lightGray
  },
  matrixHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center'
  },
  matrixRowHeaderCell: {
    backgroundColor: colors.lightPurple
  },
  matrixRowHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent
  },
  matrixDataCell: {
    backgroundColor: colors.surface
  },
  matrixDataText: {
    fontSize: 10,
    color: colors.text,
    fontWeight: '600'
  },
  matrixFooter: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.medium
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: spacing.xs
  },
  navIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4
  },
  navIcon: {
    fontSize: 20
  },
  navLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600'
  }
});

export default RateChartScreen;
