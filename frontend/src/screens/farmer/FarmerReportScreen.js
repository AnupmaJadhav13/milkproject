import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Platform, Linking
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FileText, Calendar, ChevronLeft, Share2 } from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { fetchFarmerReport } from '../../redux/slices/farmerDashboardSlice';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import Toast from 'react-native-toast-message';

const fmt = (d) => d.toISOString().split('T')[0];
const fmtDisplay = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const FarmerReportScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const token = useSelector((s) => s.auth.token);
  const user = useSelector((s) => s.auth.user);
  const { report, reportStatus } = useSelector((s) => s.farmerDashboard);

  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [fromDate, setFromDate] = useState(firstOfMonth);
  const [toDate, setToDate] = useState(today);
  const [showFrom, setShowFrom] = useState(false);
  const [showTo, setShowTo] = useState(false);
  const [generating, setGenerating] = useState(false);

  const entries = report.data || [];
  const summary = report.summary || {};

  const handleGenerate = () => {
    if (fromDate > toDate) {
      Toast.show({ type: 'error', text1: 'चुकीच्या तारखा', text2: 'सुरुवातीची तारीख शेवटच्या तारखेपेक्षा आधी असावी' });
      return;
    }
    dispatch(fetchFarmerReport({ token, params: { from: fmt(fromDate), to: fmt(toDate) } }));
  };

  // ── Build HTML for PDF ────────────────────────────────────────────────────
  const buildReportHTML = () => {
    const rows = entries.map((e, i) => `
      <tr style="background:${i % 2 === 0 ? '#F4F7F6' : '#fff'}">
        <td>${fmtDisplay(e.date)}</td>
        <td>${e.shift === 'Morning' ? 'सकाळ' : 'संध्याकाळ'}</td>
        <td>${e.animalType === 'Cow' ? 'गाय' : 'म्हैस'}</td>
        <td>${e.quantityLiters}</td>
        <td>${e.fat}</td>
        <td>${e.snf}</td>
        <td>₹${e.ratePerLiter}</td>
        <td><b>₹${Number(e.amountInr || 0).toFixed(2)}</b></td>
      </tr>`).join('');

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; padding: 20px; color: #1A2B28; font-size: 13px; }
  .header { text-align: center; border-bottom: 3px solid #2C7A6E; padding-bottom: 14px; margin-bottom: 18px; }
  .brand { font-size: 24px; font-weight: 800; color: #2C7A6E; letter-spacing: -0.5px; }
  .subtitle { font-size: 13px; color: #7A9690; margin-top: 4px; }
  .meta-box { background: #F4F7F6; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .meta-row { font-size: 12px; } .meta-row b { color: #2C7A6E; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #2C7A6E; color: white; padding: 9px 6px; text-align: center; font-size: 11px; }
  td { border: 1px solid #D9E8E5; padding: 7px 6px; text-align: center; font-size: 11px; }
  .summary-box { background: #E6F3F1; border-radius: 8px; padding: 14px; }
  .summary-title { font-size: 14px; font-weight: 700; color: #2C7A6E; margin-bottom: 10px; }
  .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .summary-item { background: white; border-radius: 6px; padding: 10px; text-align: center; }
  .summary-val { font-size: 16px; font-weight: 800; color: #2C7A6E; }
  .summary-lbl { font-size: 10px; color: #7A9690; margin-top: 2px; }
  .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #7A9690; border-top: 1px solid #D9E8E5; padding-top: 10px; }
</style>
</head>
<body>
<div class="header">
  <div class="brand">Sarvasvaa Milk</div>
  <div class="subtitle">शेतकरी दूध संकलन अहवाल · Farmer Milk Collection Report</div>
</div>
<div class="meta-box">
  <div class="meta-row"><b>शेतकरी:</b> ${user?.name || '—'}</div>
  <div class="meta-row"><b>कोड:</b> ${user?.farmerCode || '—'}</div>
  <div class="meta-row"><b>मोबाइल:</b> ${user?.phoneNumber || '—'}</div>
  <div class="meta-row"><b>केंद्र:</b> ${user?.centerName || '—'}</div>
  <div class="meta-row"><b>सुरुवात:</b> ${fmtDisplay(fromDate)}</div>
  <div class="meta-row"><b>शेवट:</b> ${fmtDisplay(toDate)}</div>
</div>
<table>
  <thead>
    <tr>
      <th>दिनांक</th><th>वेळ</th><th>प्राणी</th>
      <th>दूध (L)</th><th>FAT</th><th>SNF</th><th>दर</th><th>रक्कम</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
<div class="summary-box">
  <div class="summary-title">सारांश · Summary</div>
  <div class="summary-grid">
    <div class="summary-item"><div class="summary-val">${summary.totalMilkLiters || 0} L</div><div class="summary-lbl">एकूण दूध</div></div>
    <div class="summary-item"><div class="summary-val">₹${summary.totalAmountInr || 0}</div><div class="summary-lbl">एकूण रक्कम</div></div>
    <div class="summary-item"><div class="summary-val">${summary.avgFat || 0}</div><div class="summary-lbl">सरासरी FAT</div></div>
    <div class="summary-item"><div class="summary-val">${summary.avgSnf || 0}</div><div class="summary-lbl">सरासरी SNF</div></div>
    <div class="summary-item"><div class="summary-val">${summary.cowMilkLiters || 0} L</div><div class="summary-lbl">गाय दूध</div></div>
    <div class="summary-item"><div class="summary-val">${summary.buffaloMilkLiters || 0} L</div><div class="summary-lbl">म्हैस दूध</div></div>
    <div class="summary-item"><div class="summary-val">${summary.totalCollectionDays || 0}</div><div class="summary-lbl">संकलन दिवस</div></div>
    <div class="summary-item"><div class="summary-val">${summary.totalEntries || 0}</div><div class="summary-lbl">एकूण नोंदी</div></div>
  </div>
</div>
<div class="footer">Sarvasvaa Milk · Generated on ${new Date().toLocaleDateString('en-IN')} · ${user?.name || ''}</div>
</body>
</html>`;
  };

  // ── PDF Export ────────────────────────────────────────────────────────────
  const generatePDF = async () => {
    if (entries.length === 0) {
      Toast.show({ type: 'error', text1: 'डेटा नाही', text2: 'प्रथम अहवाल तयार करा' });
      return;
    }
    setGenerating(true);
    try {
      const { uri } = await Print.printToFileAsync({ html: buildReportHTML(), base64: false });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'अहवाल शेअर करा' });
      } else {
        Alert.alert('PDF तयार झाला', `फाइल: ${uri}`);
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'PDF तयार करणे अयशस्वी', text2: err.message });
    } finally {
      setGenerating(false);
    }
  };

  // ── WhatsApp Share ────────────────────────────────────────────────────────
  const shareWhatsApp = async () => {
    if (entries.length === 0) {
      Toast.show({ type: 'error', text1: 'डेटा नाही', text2: 'प्रथम अहवाल तयार करा' });
      return;
    }
    const msg =
      `*Sarvasvaa Milk — दूध संकलन अहवाल*\n` +
      `शेतकरी: ${user?.name || '—'} (${user?.farmerCode || '—'})\n` +
      `कालावधी: ${fmtDisplay(fromDate)} ते ${fmtDisplay(toDate)}\n\n` +
      `📊 *सारांश*\n` +
      `• एकूण दूध: ${summary.totalMilkLiters || 0} L\n` +
      `• एकूण रक्कम: ₹${summary.totalAmountInr || 0}\n` +
      `• सरासरी FAT: ${summary.avgFat || 0}\n` +
      `• सरासरी SNF: ${summary.avgSnf || 0}\n` +
      `• गाय दूध: ${summary.cowMilkLiters || 0} L\n` +
      `• म्हैस दूध: ${summary.buffaloMilkLiters || 0} L\n` +
      `• संकलन दिवस: ${summary.totalCollectionDays || 0}\n` +
      `• एकूण नोंदी: ${summary.totalEntries || 0}\n\n` +
      `_Sarvasvaa Milk Farmer Group_`;

    const url = `whatsapp://send?text=${encodeURIComponent(msg)}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Toast.show({ type: 'error', text1: 'WhatsApp उपलब्ध नाही', text2: 'WhatsApp इन्स्टॉल करा' });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color={colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>अहवाल</Text>
          <Text style={styles.headerSub}>Milk Collection Report</Text>
        </View>
        {entries.length > 0 && (
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.whatsappBtn} onPress={shareWhatsApp}>
              <Text style={styles.whatsappBtnText}>💬</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn} onPress={generatePDF} disabled={generating}>
              {generating
                ? <ActivityIndicator size="small" color={colors.primary} />
                : (
                  <>
                    <Share2 size={13} color={colors.primary} strokeWidth={2.5} />
                    <Text style={styles.shareBtnText}>PDF</Text>
                  </>
                )
              }
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Date Filter Card */}
        <View style={styles.filterCard}>
          <Text style={styles.filterTitle}>कालावधी निवडा · Select Period</Text>
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>सुरुवात</Text>
              <TouchableOpacity style={styles.dateBtn} onPress={() => setShowFrom(true)}>
                <Calendar size={14} color={colors.primary} strokeWidth={2.5} />
                <Text style={styles.dateBtnText}>{fmtDisplay(fromDate)}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.dateSep}>→</Text>
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>शेवट</Text>
              <TouchableOpacity style={styles.dateBtn} onPress={() => setShowTo(true)}>
                <Calendar size={14} color={colors.primary} strokeWidth={2.5} />
                <Text style={styles.dateBtnText}>{fmtDisplay(toDate)}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.generateBtn, reportStatus === 'loading' && styles.generateBtnDisabled]}
            onPress={handleGenerate}
            disabled={reportStatus === 'loading'}
          >
            {reportStatus === 'loading'
              ? <ActivityIndicator color={colors.white} />
              : (
                <>
                  <FileText size={16} color={colors.white} strokeWidth={2.5} />
                  <Text style={styles.generateBtnText}>अहवाल तयार करा</Text>
                </>
              )
            }
          </TouchableOpacity>
        </View>

        {showFrom && (
          <DateTimePicker
            value={fromDate} mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={toDate}
            onChange={(_, d) => { setShowFrom(false); if (d) setFromDate(d); }}
          />
        )}
        {showTo && (
          <DateTimePicker
            value={toDate} mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={fromDate} maximumDate={today}
            onChange={(_, d) => { setShowTo(false); if (d) setToDate(d); }}
          />
        )}

        {/* Summary Card */}
        {entries.length > 0 && (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>सारांश · Summary</Text>
              <View style={styles.summaryGrid}>
                {[
                  { label: 'एकूण दूध', value: `${summary.totalMilkLiters || 0} L`, color: colors.primary },
                  { label: 'एकूण रक्कम', value: `₹${summary.totalAmountInr || 0}`, color: colors.success },
                  { label: 'सरासरी FAT', value: summary.avgFat || 0, color: colors.primary },
                  { label: 'सरासरी SNF', value: summary.avgSnf || 0, color: colors.primary },
                  { label: 'गाय दूध', value: `${summary.cowMilkLiters || 0} L`, color: colors.warning },
                  { label: 'म्हैस दूध', value: `${summary.buffaloMilkLiters || 0} L`, color: colors.info },
                  { label: 'संकलन दिवस', value: summary.totalCollectionDays || 0, color: colors.primary },
                  { label: 'एकूण नोंदी', value: summary.totalEntries || 0, color: colors.textSecondary },
                ].map((item, i) => (
                  <View key={i} style={styles.summaryItem}>
                    <Text style={[styles.summaryVal, { color: item.color }]}>{item.value}</Text>
                    <Text style={styles.summaryLbl}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Data Table */}
            <View style={styles.tableCard}>
              <Text style={styles.tableTitle}>दिनांकनिहाय नोंदी · Date-wise Records</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                  <View style={styles.tableHeader}>
                    {['दिनांक', 'वेळ', 'प्राणी', 'दूध(L)', 'FAT', 'SNF', 'दर', 'रक्कम'].map((h, i) => (
                      <Text key={i} style={[styles.tableHeaderCell, i === 0 && { width: 80 }]}>{h}</Text>
                    ))}
                  </View>
                  {entries.map((entry, i) => (
                    <View key={entry._id} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
                      <Text style={[styles.tableCell, { width: 80 }]}>{fmtDisplay(entry.date)}</Text>
                      <Text style={styles.tableCell}>{entry.shift === 'Morning' ? 'सकाळ' : 'सं'}</Text>
                      <Text style={styles.tableCell}>{entry.animalType === 'Cow' ? 'गाय' : 'म्हैस'}</Text>
                      <Text style={styles.tableCell}>{entry.quantityLiters}</Text>
                      <Text style={styles.tableCell}>{entry.fat}</Text>
                      <Text style={styles.tableCell}>{entry.snf}</Text>
                      <Text style={styles.tableCell}>₹{entry.ratePerLiter}</Text>
                      <Text style={[styles.tableCell, styles.tableCellAmount]}>₹{Number(entry.amountInr || 0).toFixed(0)}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Share Buttons */}
            <View style={styles.shareRow}>
              <TouchableOpacity style={styles.whatsappShareBtn} onPress={shareWhatsApp}>
                <Text style={styles.whatsappShareBtnText}>💬 WhatsApp वर शेअर करा</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pdfShareBtn, generating && styles.generateBtnDisabled]}
                onPress={generatePDF}
                disabled={generating}
              >
                {generating
                  ? <ActivityIndicator color={colors.white} size="small" />
                  : <Text style={styles.pdfShareBtnText}>📄 PDF डाउनलोड करा</Text>
                }
              </TouchableOpacity>
            </View>
          </>
        )}

        {reportStatus !== 'loading' && entries.length === 0 && report.fromDate && (
          <View style={styles.empty}>
            <FileText size={40} color={colors.textMuted} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>डेटा नाही</Text>
            <Text style={styles.emptyText}>निवडलेल्या कालावधीसाठी दूध नोंदी नाहीत</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const today = new Date();

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md, backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.divider, ...shadows.xs
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 11, backgroundColor: colors.primaryXLight,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: typography.h3, fontWeight: '800', color: colors.text },
  headerSub: { fontSize: typography.xs, color: colors.textMuted, fontWeight: '500' },
  headerActions: { flexDirection: 'row', gap: spacing.xs },
  whatsappBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#25D366' + '22',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#25D366' + '44'
  },
  whatsappBtnText: { fontSize: 16 },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primaryXLight, paddingHorizontal: spacing.sm,
    paddingVertical: 6, borderRadius: radius.md, borderWidth: 1, borderColor: colors.teal100
  },
  shareBtnText: { fontSize: typography.xs, color: colors.primary, fontWeight: '700' },
  content: { padding: spacing.lg, paddingBottom: 40 },
  filterCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg,
    marginBottom: spacing.lg, ...shadows.card, borderWidth: 1, borderColor: colors.divider
  },
  filterTitle: { fontSize: typography.small, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  dateRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginBottom: spacing.md },
  dateField: { flex: 1 },
  dateLabel: { fontSize: typography.xs, color: colors.textMuted, fontWeight: '600', marginBottom: 4 },
  dateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.surfaceMuted, borderRadius: radius.md,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderWidth: 1, borderColor: colors.border
  },
  dateBtnText: { fontSize: typography.xs, color: colors.text, fontWeight: '600', flex: 1 },
  dateSep: { fontSize: typography.body, color: colors.textMuted, fontWeight: '700', paddingBottom: 4 },
  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.md, ...shadows.sm
  },
  generateBtnDisabled: { opacity: 0.6 },
  generateBtnText: { color: colors.white, fontWeight: '700', fontSize: typography.body },
  summaryCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg,
    marginBottom: spacing.lg, ...shadows.card, borderWidth: 1, borderColor: colors.divider
  },
  summaryTitle: { fontSize: typography.small, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  summaryItem: {
    width: '47%', backgroundColor: colors.primaryXLight, borderRadius: radius.lg,
    padding: spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: colors.teal100
  },
  summaryVal: { fontSize: typography.h3, fontWeight: '800' },
  summaryLbl: { fontSize: 10, color: colors.textMuted, fontWeight: '500', marginTop: 2 },
  tableCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.md,
    marginBottom: spacing.lg, ...shadows.card, borderWidth: 1, borderColor: colors.divider
  },
  tableTitle: { fontSize: typography.small, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  tableHeader: {
    flexDirection: 'row', backgroundColor: colors.primary,
    paddingVertical: spacing.xs, paddingHorizontal: 4, borderRadius: radius.sm
  },
  tableHeaderCell: {
    width: 52, fontSize: 9, fontWeight: '700', color: colors.white,
    textAlign: 'center', paddingHorizontal: 2
  },
  tableRow: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 4 },
  tableRowAlt: { backgroundColor: colors.surfaceMuted },
  tableCell: { width: 52, fontSize: 9, color: colors.text, textAlign: 'center', paddingHorizontal: 2 },
  tableCellAmount: { fontWeight: '700', color: colors.success },
  shareRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  whatsappShareBtn: {
    flex: 1, backgroundColor: '#25D366', borderRadius: radius.lg,
    paddingVertical: spacing.md, alignItems: 'center', ...shadows.sm
  },
  whatsappShareBtnText: { color: colors.white, fontWeight: '700', fontSize: typography.xs },
  pdfShareBtn: {
    flex: 1, backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.md, alignItems: 'center', ...shadows.sm
  },
  pdfShareBtnText: { color: colors.white, fontWeight: '700', fontSize: typography.xs },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: typography.h3, fontWeight: '700', color: colors.textSecondary, marginTop: spacing.md },
  emptyText: { fontSize: typography.small, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' }
});

export default FarmerReportScreen;
