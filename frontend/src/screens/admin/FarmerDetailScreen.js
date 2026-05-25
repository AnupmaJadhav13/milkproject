import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Phone, SquarePen } from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows } from '../../theme';

const Field = ({ label, value }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value || '-'}</Text>
  </View>
);

const FarmerDetailScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const farmer = route?.params?.farmer || {};
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 600); }, []);

  const onCall = () => {
    const cleaned = String(farmer.mobileNumber || '').replace(/[^\d+]/g, '');
    if (!cleaned) return Alert.alert('No number', 'This farmer has no mobile number.');
    return Linking.openURL(`tel:${cleaned}`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color={colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.brand}>Sarvasvaa Milk</Text>
          <Text style={styles.title}>Farmer Details</Text>
        </View>
        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditFarmer', { farmer })}>
          <SquarePen size={16} color={colors.primary} strokeWidth={2.5} />
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        <View style={styles.card}>
          <Text style={styles.name}>{farmer.fullName || '-'}</Text>
          <Text style={styles.code}>{farmer.farmerCode || '-'}</Text>
          <View style={[styles.statusBadge, farmer.status === 'Active' ? styles.active : styles.inactive]}>
            <Text style={styles.statusText}>{farmer.status || 'Unknown'}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Field label="Mobile" value={farmer.mobileNumber} />
          <Field label="Animal Type" value={farmer.animalType} />
          <Field label="Center" value={farmer.assignedCenter?.name} />
        </View>

        <TouchableOpacity style={styles.callBtn} onPress={onCall}>
          <Phone size={18} color={colors.surface} strokeWidth={2.5} />
          <Text style={styles.callText}>Call Farmer</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

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
  brand: { fontSize: typography.xs, color: colors.textMuted, fontWeight: '600' },
  title: { fontSize: typography.h3, fontWeight: '800', color: colors.text },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primaryXLight, borderWidth: 1, borderColor: colors.teal100,
    borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: 7
  },
  editText: { color: colors.primary, fontWeight: '700', fontSize: typography.xs },
  content: { padding: spacing.lg },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.divider, ...shadows.xs
  },
  name: { fontSize: typography.h2, fontWeight: '800', color: colors.text },
  code: { color: colors.primary, fontWeight: '700', marginTop: 4 },
  statusBadge: { alignSelf: 'flex-start', borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 5, marginTop: spacing.sm },
  active: { backgroundColor: colors.successLight },
  inactive: { backgroundColor: colors.lightGray },
  statusText: { color: colors.text, fontWeight: '700', fontSize: typography.xs },
  field: { marginBottom: spacing.sm },
  label: { fontSize: typography.xs, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase' },
  value: { fontSize: typography.body, color: colors.text, fontWeight: '600', marginTop: 2 },
  callBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 14
  },
  callText: { color: colors.surface, fontWeight: '800', fontSize: typography.body }
});

export default FarmerDetailScreen;
