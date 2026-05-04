import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { smsApi } from '../../api/api';

const USER_TYPES = [
  { value: 'farmer', label: 'Farmers' },
  { value: 'collection_head', label: 'Collection heads' }
];

const SMS_TEMPLATES = [
  { id: '__none', label: '— Select template (optional) —', title: '', body: '' },
  {
    id: 'milk_pay',
    label: 'Milk payment reminder',
    title: 'Milk payment reminder',
    body: 'Dear farmer, your milk payment is pending. Please visit your collection center to settle dues at the earliest. Thank you.'
  },
  {
    id: 'bonus',
    label: 'Bonus announcement',
    title: 'Bonus announcement',
    body: 'Good news! A bonus scheme is active for eligible farmers. Contact your collection center for details and eligibility.'
  },
  {
    id: 'center_notice',
    label: 'Collection center notice',
    title: 'Center notice',
    body: 'Important notice from your collection center. Please read carefully and follow instructions shared at the center.'
  },
  {
    id: 'holiday',
    label: 'Holiday notice',
    title: 'Holiday schedule',
    body: 'Please note a change in collection schedule due to a public holiday. Contact your center for revised timings.'
  },
  {
    id: 'emergency',
    label: 'Emergency message',
    title: 'Urgent notice',
    body: 'Urgent: Please contact your collection center immediately regarding an important update.'
  },
  {
    id: 'feed',
    label: 'Feed availability update',
    title: 'Feed update',
    body: 'Update on cattle feed availability at your collection center. Visit or call the center for stock and rates.'
  }
];

const buildFullMessage = (title, body) => {
  const t = (title || '').trim();
  const b = (body || '').trim();
  if (t && b) return `${t}\n\n${b}`;
  if (t) return t;
  return b;
};

const SendSmsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const token = useSelector((state) => state.auth.token);

  const [userType, setUserType] = useState('farmer');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [recipients, setRecipients] = useState([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const [messageTitle, setMessageTitle] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [templateId, setTemplateId] = useState('__none');

  const [previewOpen, setPreviewOpen] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [userType, debouncedSearch]);

  const loadRecipients = useCallback(async () => {
    if (!token) return;
    setLoadingRecipients(true);
    try {
      const params = { type: userType };
      if (debouncedSearch) params.search = debouncedSearch;
      const { data } = await smsApi.getRecipients(token, params);
      setRecipients(data.recipients || []);
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Recipients', text2: e.message });
      setRecipients([]);
    } finally {
      setLoadingRecipients(false);
    }
  }, [token, userType, debouncedSearch]);

  useEffect(() => {
    loadRecipients();
  }, [loadRecipients]);

  const fullMessage = useMemo(() => buildFullMessage(messageTitle, messageBody), [messageTitle, messageBody]);
  const charCount = fullMessage.length;
  const smsSegments = Math.ceil(charCount / 160) || 1;

  const toggleId = (id) => {
    const idStr = String(id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(idStr)) next.delete(idStr);
      else next.add(idStr);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedIds(new Set(recipients.map((r) => String(r.id))));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const onTemplateChange = (tid) => {
    setTemplateId(tid);
    const tpl = SMS_TEMPLATES.find((t) => t.id === tid);
    if (tpl && tpl.id !== '__none') {
      setMessageTitle(tpl.title);
      setMessageBody(tpl.body);
    }
  };

  const canSend = () => Boolean(fullMessage.trim()) && selectedIds.size > 0;

  const onSend = () => {
    if (!canSend()) {
      Toast.show({ type: 'error', text1: 'Select at least one recipient and enter a message' });
      return;
    }
    Alert.alert('Send SMS', `Send to ${selectedIds.size} recipient(s)?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send',
        onPress: async () => {
          setSending(true);
          try {
            await smsApi.send(
              {
                userType,
                recipientMode: 'multiple',
                ids: Array.from(selectedIds),
                title: messageTitle.trim(),
                message: messageBody.trim()
              },
              token
            );
            Toast.show({ type: 'success', text1: 'SMS sent', text2: 'Notification delivered via SMS gateway.' });
            clearSelection();
          } catch (e) {
            Toast.show({ type: 'error', text1: 'Send failed', text2: e.message });
          } finally {
            setSending(false);
          }
        }
      }
    ]);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.backLinkText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>Send SMS notifications</Text>
        <Text style={styles.intro}>
          Choose Farmers or Collection heads, search if needed, tap rows or use Select all, then write your message and send.
        </Text>

        <Text style={styles.section}>Recipients</Text>
        <Text style={styles.fieldLabel}>Send to</Text>
        <View style={styles.pickerWrap}>
          <Picker selectedValue={userType} onValueChange={setUserType}>
            {USER_TYPES.map((u) => (
              <Picker.Item key={u.value} label={u.label} value={u.value} />
            ))}
          </Picker>
        </View>

        <Text style={styles.fieldLabel}>Search (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Name, mobile, code…"
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#94a3b8"
        />

        <View style={styles.rowBtns}>
          <TouchableOpacity style={[styles.smallBtn, styles.smallBtnLeft]} onPress={selectAllVisible}>
            <Text style={styles.smallBtnText}>Select all</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.smallBtn, styles.smallBtnGhost]} onPress={clearSelection}>
            <Text style={styles.smallBtnGhostText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {loadingRecipients ? (
          <ActivityIndicator style={{ marginVertical: 16 }} color="#2563eb" />
        ) : recipients.length === 0 ? (
          <Text style={styles.empty}>No one in this list yet. Adjust search or add farmers / centers with mobile numbers.</Text>
        ) : (
          recipients.map((item) => {
            const idStr = String(item.id);
            const checked = selectedIds.has(idStr);
            return (
              <TouchableOpacity
                key={idStr}
                style={[styles.recipientRow, checked && styles.recipientRowOn]}
                onPress={() => toggleId(item.id)}
                activeOpacity={0.85}
              >
                <View style={[styles.checkbox, checked && styles.checkboxOn]} />
                <View style={styles.recipientText}>
                  <Text style={styles.recipientLabel}>{item.label}</Text>
                  <Text style={styles.recipientSub}>
                    {item.phone}
                    {item.sublabel ? ` · ${item.sublabel}` : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <Text style={styles.hint}>Tap rows to select or deselect · Selected: {selectedIds.size}</Text>

        <Text style={styles.section}>Message details</Text>
        <Text style={styles.fieldLabel}>Message title</Text>
        <TextInput
          style={styles.input}
          placeholder="Short title (optional, shown first in SMS)"
          value={messageTitle}
          onChangeText={setMessageTitle}
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.fieldLabel}>Template</Text>
        <View style={styles.pickerWrap}>
          <Picker selectedValue={templateId} onValueChange={onTemplateChange}>
            {SMS_TEMPLATES.map((t) => (
              <Picker.Item key={t.id} label={t.label} value={t.id} />
            ))}
          </Picker>
        </View>

        <Text style={styles.fieldLabel}>SMS message content</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Type your message…"
          value={messageBody}
          onChangeText={setMessageBody}
          multiline
          textAlignVertical="top"
          placeholderTextColor="#94a3b8"
        />
        <View style={styles.counterRow}>
          <Text style={styles.counter}>
            {charCount} characters · ~{smsSegments} SMS segment{smsSegments !== 1 ? 's' : ''} (160 chars each)
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.previewBtn} onPress={() => setPreviewOpen(true)} disabled={!fullMessage.trim()}>
            <Text style={styles.previewBtnText}>Preview SMS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sendBtn} onPress={onSend} disabled={sending || !canSend()}>
            {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendBtnText}>Send SMS</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={previewOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>SMS preview</Text>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalBody}>{fullMessage || '—'}</Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => setPreviewOpen(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f1f5f9' },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  backLink: { alignSelf: 'flex-start', marginBottom: 8, paddingVertical: 4 },
  backLinkText: { color: '#2563eb', fontWeight: '700', fontSize: 15 },
  heading: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  intro: { color: '#64748b', fontSize: 14, lineHeight: 21, marginBottom: 20 },
  section: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginTop: 8, marginBottom: 10 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6, marginTop: 10 },
  pickerWrap: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    overflow: 'hidden'
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a'
  },
  textarea: { minHeight: 120, marginTop: 0 },
  rowBtns: { flexDirection: 'row', marginTop: 12, marginBottom: 8 },
  smallBtn: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center'
  },
  smallBtnLeft: { marginRight: 8 },
  smallBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  smallBtnGhost: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1' },
  smallBtnGhostText: { color: '#475569', fontWeight: '700', fontSize: 13 },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  recipientRowOn: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#94a3b8',
    marginRight: 12
  },
  checkboxOn: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  recipientText: { flex: 1 },
  recipientLabel: { fontWeight: '700', color: '#0f172a', fontSize: 15 },
  recipientSub: { color: '#64748b', fontSize: 13, marginTop: 2 },
  empty: { textAlign: 'center', color: '#94a3b8', paddingVertical: 20 },
  hint: { fontSize: 12, color: '#64748b', marginTop: 8, marginBottom: 8 },
  counterRow: { marginTop: 6, marginBottom: 16 },
  counter: { fontSize: 12, color: '#64748b' },
  actions: { flexDirection: 'row', marginTop: 8 },
  previewBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 10
  },
  previewBtnText: { color: '#2563eb', fontWeight: '700' },
  sendBtn: {
    flex: 1,
    backgroundColor: '#16a34a',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sendBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    padding: 24
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    maxHeight: '70%'
  },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12, color: '#0f172a' },
  modalScroll: { maxHeight: 320 },
  modalBody: { fontSize: 15, color: '#334155', lineHeight: 22 },
  modalClose: {
    marginTop: 16,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center'
  },
  modalCloseText: { color: '#fff', fontWeight: '700' }
});

export default SendSmsScreen;
