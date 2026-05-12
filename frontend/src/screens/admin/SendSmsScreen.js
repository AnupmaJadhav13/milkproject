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
  Alert,
  LinearGradient
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { smsApi } from '../../api/api';
import { colors, radius, spacing, typography, shadows, gradients } from '../../theme';

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
        {/* Header Section */}
        <View style={styles.headerSection}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={12}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.heading}>Send SMS</Text>
            <Text style={styles.subtitle}>Send notifications to farmers and collection heads</Text>
          </View>
        </View>

        {/* Message Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Message</Text>
          
          <Text style={styles.fieldLabel}>Message title</Text>
          <TextInput
            style={styles.input}
            placeholder="Short title (optional, shown first in SMS)"
            value={messageTitle}
            onChangeText={setMessageTitle}
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.fieldLabel}>Template</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={templateId} onValueChange={onTemplateChange}>
              {SMS_TEMPLATES.map((t) => (
                <Picker.Item key={t.id} label={t.label} value={t.id} />
              ))}
            </Picker>
          </View>

          <Text style={styles.fieldLabel}>SMS message content</Text>
          <View style={styles.messageContainer}>
            <TextInput
              style={styles.messageInput}
              placeholder="Type your message…"
              value={messageBody}
              onChangeText={setMessageBody}
              multiline
              textAlignVertical="top"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={styles.counterContainer}>
            <Text style={styles.counter}>
              {charCount} characters · ~{smsSegments} SMS segment{smsSegments !== 1 ? 's' : ''} (160 chars each)
            </Text>
          </View>
        </View>

        {/* Recipients Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recipients</Text>
          
          <Text style={styles.fieldLabel}>Send to</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={userType} onValueChange={setUserType}>
              {USER_TYPES.map((u) => (
                <Picker.Item key={u.value} label={u.label} value={u.value} />
              ))}
            </Picker>
          </View>

          <Text style={styles.fieldLabel}>Search (optional)</Text>
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Name, mobile, code…"
              value={search}
              onChangeText={setSearch}
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.selectButton} onPress={selectAllVisible}>
              <Text style={styles.selectButtonText}>Select all</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.clearButton} onPress={clearSelection}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>

          {loadingRecipients ? (
            <ActivityIndicator style={{ marginVertical: 16 }} color={colors.primary} />
          ) : recipients.length === 0 ? (
            <Text style={styles.emptyText}>No one in this list yet. Adjust search or add farmers / centers with mobile numbers.</Text>
          ) : (
            recipients.map((item) => {
              const idStr = String(item.id);
              const checked = selectedIds.has(idStr);
              return (
                <TouchableOpacity
                  key={idStr}
                  style={[styles.recipientCard, checked && styles.recipientCardSelected]}
                  onPress={() => toggleId(item.id)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.checkbox, checked && styles.checkboxSelected]}>
                    {checked && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <View style={styles.recipientInfo}>
                    <Text style={styles.recipientName}>{item.label}</Text>
                    <Text style={styles.recipientDetails}>
                      {item.phone}
                      {item.sublabel ? ` · ${item.sublabel}` : ''}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
          <Text style={styles.selectionHint}>Tap rows to select or deselect · Selected: {selectedIds.size}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.previewButton} 
            onPress={() => setPreviewOpen(true)} 
            disabled={!fullMessage.trim()}
          >
            <Text style={styles.previewButtonText}>Preview SMS</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.sendButton} 
            onPress={onSend} 
            disabled={sending || !canSend()}
          >
            {sending ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.sendButtonText}>Send SMS</Text>
            )}
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
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setPreviewOpen(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { 
    flex: 1, 
    backgroundColor: colors.bg 
  },
  scroll: { 
    paddingHorizontal: spacing.lg, 
    paddingBottom: 40 
  },
  
  // Header Section
  headerSection: {
    marginBottom: spacing.lg
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  backButtonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: typography.h3
  },
  headerContent: {
    marginLeft: spacing.sm
  },
  heading: { 
    fontSize: typography.h1, 
    fontWeight: '800', 
    color: colors.text, 
    marginBottom: spacing.xs 
  },
  subtitle: { 
    color: colors.textMuted, 
    fontSize: typography.body, 
    lineHeight: 21 
  },
  
  // Section Cards
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card
  },
  sectionTitle: { 
    fontSize: typography.h3, 
    fontWeight: '700', 
    color: colors.text, 
    marginBottom: spacing.lg 
  },
  fieldLabel: { 
    fontSize: typography.small, 
    fontWeight: '600', 
    color: colors.text, 
    marginBottom: spacing.sm, 
    marginTop: spacing.md 
  },
  
  // Picker and Input Styles
  pickerContainer: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.body,
    color: colors.text,
    marginBottom: spacing.md
  },
  
  // Search Section
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md
  },
  searchIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
    color: colors.textMuted
  },
  searchInput: {
    flex: 1,
    fontSize: typography.body,
    color: colors.text,
    paddingVertical: spacing.md
  },
  
  // Action Buttons Row
  actionButtonsRow: { 
    flexDirection: 'row', 
    marginTop: spacing.md, 
    marginBottom: spacing.lg,
    gap: spacing.md
  },
  selectButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    ...shadows.small
  },
  selectButtonText: { 
    color: colors.surface, 
    fontWeight: '700', 
    fontSize: typography.small 
  },
  clearButton: { 
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center'
  },
  clearButtonText: { 
    color: colors.text, 
    fontWeight: '700', 
    fontSize: typography.small 
  },
  
  // Recipient Cards
  recipientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border
  },
  recipientCardSelected: { 
    borderColor: colors.primary, 
    backgroundColor: colors.successLight 
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.md,
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkboxSelected: { 
    backgroundColor: colors.primary, 
    borderColor: colors.primary 
  },
  checkmark: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 14
  },
  recipientInfo: { 
    flex: 1 
  },
  recipientName: { 
    fontWeight: '700', 
    color: colors.text, 
    fontSize: typography.body 
  },
  recipientDetails: { 
    color: colors.textMuted, 
    fontSize: typography.small, 
    marginTop: spacing.xs 
  },
  emptyText: { 
    textAlign: 'center', 
    color: colors.textMuted, 
    paddingVertical: spacing.xl,
    fontSize: typography.body 
  },
  selectionHint: { 
    fontSize: typography.caption, 
    color: colors.textMuted, 
    marginTop: spacing.md, 
    marginBottom: spacing.sm 
  },
  
  // Message Section
  messageContainer: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md
  },
  messageInput: {
    fontSize: typography.body,
    color: colors.text,
    minHeight: 120,
    textAlignVertical: 'top'
  },
  counterContainer: { 
    marginTop: spacing.sm, 
    marginBottom: spacing.md 
  },
  counter: { 
    fontSize: typography.caption, 
    color: colors.textMuted 
  },
  
  // Main Action Buttons
  actionButtonsContainer: { 
    flexDirection: 'row', 
    marginTop: spacing.lg,
    gap: spacing.md
  },
  previewButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    ...shadows.small
  },
  previewButtonText: { 
    color: colors.primary, 
    fontWeight: '700',
    fontSize: typography.body
  },
  sendButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small
  },
  sendButtonText: { 
    color: colors.surface, 
    fontWeight: '800', 
    fontSize: typography.body 
  },
  
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '70%',
    ...shadows.medium
  },
  modalTitle: { 
    fontSize: typography.h3, 
    fontWeight: '800', 
    marginBottom: spacing.md, 
    color: colors.text 
  },
  modalScroll: { 
    maxHeight: 320 
  },
  modalBody: { 
    fontSize: typography.body, 
    color: colors.text, 
    lineHeight: 22 
  },
  modalCloseButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center'
  },
  modalCloseText: { 
    color: colors.surface, 
    fontWeight: '700' 
  }
});

export default SendSmsScreen;
