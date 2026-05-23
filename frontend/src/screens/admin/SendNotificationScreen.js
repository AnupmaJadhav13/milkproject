import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { ChevronLeft, Bell, Send } from 'lucide-react-native';
import { notificationApi } from '../../api/api';
import { colors, radius, spacing, typography, shadows } from '../../theme';

const USER_TYPES = [
  { value: 'farmer', label: 'Farmers' },
  { value: 'collection_head', label: 'Collection Heads' }
];

const TEMPLATES = [
  { id: '__none', label: 'Select template (optional)', title: '', body: '' },
  {
    id: 'payment_done',
    label: 'Payment done',
    title: 'पेमेंट पूर्ण झाले',
    body: 'नमस्कार, आपली दूध रक्कम यशस्वीरित्या जमा करण्यात आली आहे. अधिक माहितीसाठी आपल्या केंद्राशी संपर्क साधा.\nSarvasvaa Milk'
  },
  {
    id: 'advance_reminder',
    label: 'Advance reminder',
    title: 'आगाऊ रक्कम',
    body: 'नमस्कार, आपल्या आगाऊ रकमेची परतफेड प्रलंबित आहे. कृपया आपल्या संकलन केंद्राशी संपर्क साधा.\nSarvasvaa Milk'
  },
  {
    id: 'bonus',
    label: 'Bonus announcement',
    title: 'बोनस घोषणा',
    body: 'शुभ वार्ता! पात्र शेतकऱ्यांसाठी बोनस योजना सुरू आहे. पात्रता व तपशीलासाठी आपल्या संकलन केंद्राशी संपर्क साधा.\nSarvasvaa Milk'
  },
  {
    id: 'center_notice',
    label: 'Center notice',
    title: 'केंद्र सूचना',
    body: 'आपल्या संकलन केंद्राकडून महत्त्वाची सूचना. कृपया केंद्रावर दिलेल्या सूचनांचे पालन करा.\nSarvasvaa Milk'
  }
];

const SendNotificationScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const token = useSelector((s) => s.auth.token);
  const [userType, setUserType] = useState('farmer');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [templateId, setTemplateId] = useState('__none');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setSelectedIds(new Set()); }, [userType, debouncedSearch]);

  const loadRecipients = useCallback(async () => {
    if (!token) return;
    setLoadingRecipients(true);
    try {
      const params = { type: userType };
      if (debouncedSearch) params.search = debouncedSearch;
      const { data } = await notificationApi.getRecipients(token, params);
      setRecipients(data.recipients || []);
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Error', text2: e.message });
      setRecipients([]);
    } finally {
      setLoadingRecipients(false);
    }
  }, [token, userType, debouncedSearch]);

  useEffect(() => { loadRecipients(); }, [loadRecipients]);

  const fullMessage = useMemo(() => {
    const t = title.trim();
    const b = body.trim();
    return t && b ? `${t}\n\n${b}` : t || b;
  }, [title, body]);

  const toggleId = (id) => {
    const idStr = String(id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(idStr) ? next.delete(idStr) : next.add(idStr);
      return next;
    });
  };

  const onTemplateChange = (id) => {
    setTemplateId(id);
    const tpl = TEMPLATES.find((item) => item.id === id);
    if (tpl && tpl.id !== '__none') {
      setTitle(tpl.title);
      setBody(tpl.body);
    }
  };

  const canSend = fullMessage.trim().length > 0 && selectedIds.size > 0;

  const onSend = () => {
    if (!canSend) {
      Toast.show({ type: 'error', text1: 'Select at least one recipient and enter a message' });
      return;
    }
    Alert.alert('Send Notification', `Send this notification to ${selectedIds.size} recipients?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send',
        onPress: async () => {
          setSending(true);
          try {
            const result = await notificationApi.send({
              userType,
              recipientMode: 'multiple',
              ids: Array.from(selectedIds),
              title: title.trim(),
              message: body.trim()
            }, token);
            Toast.show({
              type: 'success',
              text1: 'Notification sent successfully',
              text2: `${result?.data?.sentCount || selectedIds.size} recipients were notified.`
            });
            setSelectedIds(new Set());
          } catch (e) {
            Toast.show({ type: 'error', text1: 'Failed to send notification', text2: e.message });
          } finally {
            setSending(false);
          }
        }
      }
    ]);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft size={22} color={colors.primary} strokeWidth={2.5} />
          </TouchableOpacity>
          <View>
            <Text style={styles.heading}>Send Notification</Text>
            <Text style={styles.subtitle}>Marathi message content is sent to selected farmers.</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Message</Text>
          <Text style={styles.fieldLabel}>Template (optional)</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={templateId} onValueChange={onTemplateChange}>
              {TEMPLATES.map((item) => <Picker.Item key={item.id} label={item.label} value={item.id} />)}
            </Picker>
          </View>
          <Text style={styles.fieldLabel}>Title *</Text>
          <TextInput style={styles.input} placeholder="Notification title" value={title} onChangeText={setTitle} placeholderTextColor={colors.textMuted} />
          <Text style={styles.fieldLabel}>Message *</Text>
          <View style={styles.msgWrap}>
            <TextInput
              style={styles.msgInput}
              placeholder="Type your message..."
              value={body}
              onChangeText={setBody}
              multiline
              textAlignVertical="top"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recipients</Text>
          <Text style={styles.fieldLabel}>Send to</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={userType} onValueChange={setUserType}>
              {USER_TYPES.map((item) => <Picker.Item key={item.value} label={item.label} value={item.value} />)}
            </Picker>
          </View>
          <Text style={styles.fieldLabel}>Search</Text>
          <TextInput style={styles.input} placeholder="Name, mobile, code..." value={search} onChangeText={setSearch} placeholderTextColor={colors.textMuted} />

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.selectAllBtn} onPress={() => setSelectedIds(new Set(recipients.map((r) => String(r.id))))}>
              <Text style={styles.selectAllText}>Select all</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.clearBtn} onPress={() => setSelectedIds(new Set())}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>

          {loadingRecipients ? (
            <ActivityIndicator style={{ marginVertical: 16 }} color={colors.primary} />
          ) : recipients.length === 0 ? (
            <Text style={styles.emptyText}>No recipients found. Change search or add farmers.</Text>
          ) : recipients.map((item) => {
            const idStr = String(item.id);
            const checked = selectedIds.has(idStr);
            return (
              <TouchableOpacity key={idStr} style={[styles.recipientCard, checked && styles.recipientCardSelected]} onPress={() => toggleId(item.id)} activeOpacity={0.85}>
                <View style={[styles.checkbox, checked && styles.checkboxSelected]}>{checked && <Text style={styles.checkmark}>✓</Text>}</View>
                <View style={styles.recipientInfo}>
                  <Text style={styles.recipientName}>{item.label}</Text>
                  <Text style={styles.recipientSub}>{item.phone}{item.sublabel ? ` · ${item.sublabel}` : ''}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
          <Text style={styles.selectionHint}>Selected: {selectedIds.size}</Text>
        </View>

        <View style={styles.actionBtns}>
          <TouchableOpacity style={styles.previewBtn} onPress={() => setPreviewOpen(true)} disabled={!fullMessage.trim()}>
            <Bell size={16} color={colors.primary} strokeWidth={2.5} />
            <Text style={styles.previewBtnText}>Preview</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.sendBtn, (!canSend || sending) && styles.sendBtnDisabled]} onPress={onSend} disabled={!canSend || sending}>
            {sending ? <ActivityIndicator color={colors.white} /> : (
              <>
                <Send size={16} color={colors.white} strokeWidth={2.5} />
                <Text style={styles.sendBtnText}>Send</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={previewOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Notification Preview</Text>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalBody}>{fullMessage || '-'}</Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setPreviewOpen(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, gap: spacing.sm },
  backBtn: { width: 38, height: 38, borderRadius: 11, backgroundColor: colors.primaryXLight, alignItems: 'center', justifyContent: 'center' },
  heading: { fontSize: typography.h2, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: typography.xs, color: colors.textMuted, fontWeight: '500' },
  sectionCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.lg, ...shadows.card },
  sectionTitle: { fontSize: typography.h3, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  fieldLabel: { fontSize: typography.xs, fontWeight: '600', color: colors.text, marginBottom: spacing.xs, marginTop: spacing.sm },
  pickerWrap: { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: spacing.sm },
  input: { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: typography.body, color: colors.text, marginBottom: spacing.sm },
  msgWrap: { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  msgInput: { fontSize: typography.body, color: colors.text, minHeight: 100, textAlignVertical: 'top' },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.sm },
  selectAllBtn: { flex: 1, backgroundColor: colors.primary, paddingVertical: spacing.sm, borderRadius: radius.lg, alignItems: 'center', ...shadows.xs },
  selectAllText: { color: colors.white, fontWeight: '700', fontSize: typography.xs },
  clearBtn: { flex: 1, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.sm, borderRadius: radius.lg, alignItems: 'center' },
  clearText: { color: colors.text, fontWeight: '700', fontSize: typography.xs },
  recipientCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.xs, borderWidth: 1, borderColor: colors.border },
  recipientCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryXLight },
  checkbox: { width: 22, height: 22, borderRadius: radius.xs, borderWidth: 2, borderColor: colors.border, marginRight: spacing.sm, justifyContent: 'center', alignItems: 'center' },
  checkboxSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { color: colors.white, fontWeight: '700', fontSize: 13 },
  recipientInfo: { flex: 1 },
  recipientName: { fontWeight: '700', color: colors.text, fontSize: typography.small },
  recipientSub: { color: colors.textMuted, fontSize: typography.xs, marginTop: 2 },
  emptyText: { textAlign: 'center', color: colors.textMuted, paddingVertical: spacing.lg },
  selectionHint: { fontSize: typography.xs, color: colors.textMuted, marginTop: spacing.sm },
  actionBtns: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  previewBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.primary, borderRadius: radius.lg, paddingVertical: spacing.md, ...shadows.xs },
  previewBtnText: { color: colors.primary, fontWeight: '700', fontSize: typography.small },
  sendBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: spacing.md, ...shadows.sm },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: colors.white, fontWeight: '800', fontSize: typography.small },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg },
  modalCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, maxHeight: '70%', ...shadows.modal },
  modalTitle: { fontSize: typography.h3, fontWeight: '800', marginBottom: spacing.md, color: colors.text },
  modalScroll: { maxHeight: 300 },
  modalBody: { fontSize: typography.body, color: colors.text, lineHeight: 22 },
  modalCloseBtn: { marginTop: spacing.lg, backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: spacing.md, alignItems: 'center' },
  modalCloseText: { color: colors.white, fontWeight: '700' }
});

export default SendNotificationScreen;
