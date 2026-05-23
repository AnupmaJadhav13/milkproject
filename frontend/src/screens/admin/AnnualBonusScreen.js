import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { annualBonusApi } from '../../api/api';

const AnnualBonusScreen = () => {
  const token = useSelector((state) => state.auth.token);
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [notifying, setNotifying] = useState(false);
  const [payload, setPayload] = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { data } = await annualBonusApi.getEligible(token);
      setPayload(data);
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Error', text2: e.message });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const onNotify = async () => {
    setNotifying(true);
    try {
      const { data } = await annualBonusApi.notify(token);
      Toast.show({
        type: 'success',
        text1: 'Notifications Sent',
        text2: `Sent to ${data.sentCount || 0} eligible farmer(s).`
      });
      await load();
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Error', text2: e.message });
    } finally {
      setNotifying(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top + 24 }]}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const list = payload?.eligible || [];

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.heading}>Annual bonus</Text>
      <Text style={styles.sub}>
        Farmers appear here when their recorded milk procurement at their center totals at least ₹{payload?.targetInr?.toLocaleString?.('en-IN') || '1,00,000'} over a
        period of at least {payload?.minSpanDays || 365} days (from first to last entry). Milk entries are logged separately per day.
      </Text>

      <TouchableOpacity style={styles.notifyBtn} onPress={onNotify} disabled={notifying}>
        {notifying ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.notifyText}>Send Notifications to Eligible Farmers</Text>
        )}
      </TouchableOpacity>

      <FlatList
        data={list}
        keyExtractor={(item) => String(item.farmerId)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No eligible farmers yet. Add daily milk collection records to track progress.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>
              {item.fullName} <Text style={styles.code}>({item.farmerCode})</Text>
            </Text>
            <Text style={styles.meta}>{item.centerName} · {item.centerCode}</Text>
            <Text style={styles.meta}>Total milk value: ₹{Math.round(item.totalInr).toLocaleString('en-IN')}</Text>
            <Text style={styles.meta}>
              Span: {item.spanDays} days · {new Date(item.firstDate).toLocaleDateString()} → {new Date(item.lastDate).toLocaleDateString()}
            </Text>
            <Text style={[styles.badge, item.notified ? styles.badgeOk : styles.badgePending]}>
              {item.notified ? `Notified ${item.notifiedAt ? new Date(item.notifiedAt).toLocaleDateString() : ''}` : 'Pending notification'}
            </Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f1f5f9', paddingHorizontal: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' },
  heading: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  sub: { color: '#475569', fontSize: 13, lineHeight: 20, marginBottom: 12 },
  notifyBtn: {
    backgroundColor: '#0d9488',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16
  },
  notifyText: { color: '#fff', fontWeight: '700' },
  list: { paddingBottom: 32 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  name: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  code: { color: '#2563eb', fontWeight: '700' },
  meta: { marginTop: 4, color: '#64748b', fontSize: 13 },
  badge: { marginTop: 10, fontSize: 12, fontWeight: '600' },
  badgeOk: { color: '#15803d' },
  badgePending: { color: '#b45309' },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 24 }
});

export default AnnualBonusScreen;
