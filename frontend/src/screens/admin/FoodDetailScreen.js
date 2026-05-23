import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Salad } from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows } from '../../theme';

const Row = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value || '-'}</Text>
  </View>
);

const FoodDetailScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const item = route?.params?.foodRecord || {};

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color={colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
        <View>
          <Text style={styles.brand}>Sarvasvaa Milk</Text>
          <Text style={styles.title}>Food Details</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.iconBox}>
            <Salad size={24} color={colors.primary} strokeWidth={2.5} />
          </View>
          <Text style={styles.name}>{item.farmerId?.fullName || '-'}</Text>
          <Text style={styles.code}>{item.collectionCenterId?.name || '-'}</Text>
        </View>
        <View style={styles.card}>
          <Row label="Date" value={item.date ? new Date(item.date).toLocaleDateString('en-IN') : '-'} />
          <Row label="Animal" value={item.animalType} />
          <Row label="Food" value={item.foodType} />
          <Row label="Brand" value={item.brandName} />
          <Row label="Quantity" value={`${item.quantity || 0} ${item.unit || ''}`} />
          <Row label="Rate" value={`₹${Number(item.rate || 0).toFixed(2)}`} />
          <Row label="Total" value={`₹${Number(item.totalAmount || 0).toFixed(2)}`} />
          <Row label="Payment Status" value={item.paymentStatus} />
          <Row label="Notes" value={item.notes} />
        </View>
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
  content: { padding: spacing.lg },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.divider, ...shadows.xs
  },
  iconBox: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: colors.primaryXLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm
  },
  name: { fontSize: typography.h2, fontWeight: '800', color: colors.text },
  code: { color: colors.textMuted, fontWeight: '600', marginTop: 4 },
  row: { marginBottom: spacing.sm },
  label: { fontSize: typography.xs, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase' },
  value: { fontSize: typography.body, color: colors.text, fontWeight: '600', marginTop: 2 }
});

export default FoodDetailScreen;
