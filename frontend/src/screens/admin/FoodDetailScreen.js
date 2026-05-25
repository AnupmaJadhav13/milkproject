import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Salad, Calendar, Beef, ShoppingBag, Tag, Weight, IndianRupee, CreditCard, FileText, Building2 } from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows } from '../../theme';

const InfoRow = ({ icon, label, value, accent }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIconWrap}>
      {icon}
    </View>
    <View style={styles.infoTextWrap}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, accent && { color: accent, fontWeight: '800' }]}>
        {value || '—'}
      </Text>
    </View>
  </View>
);

const SectionHeader = ({ title }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

const FoodDetailScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const item = route?.params?.foodRecord || {};

  const totalAmount = Number(item.totalAmount || 0);
  const rate = Number(item.rate || 0);
  const quantity = Number(item.quantity || 0);

  const isPaid = item.paymentStatus === 'Paid';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ── Teal Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.brand}>Sarvasvaa Milk</Text>
          <Text style={styles.title}>Food Details</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Hero Card ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconRing}>
            <Salad size={30} color="#fff" strokeWidth={2} />
          </View>
          <Text style={styles.heroName}>{item.farmerId?.fullName || '—'}</Text>
          <View style={styles.heroCenterRow}>
            <Building2 size={13} color="rgba(255,255,255,0.75)" strokeWidth={2} />
            <Text style={styles.heroCenter}>{item.collectionCenterId?.name || '—'}</Text>
          </View>

          {/* Amount pill */}
          <View style={styles.amountPill}>
            <Text style={styles.amountPillText}>₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
          </View>

          {/* Payment status badge */}
          <View style={[styles.paymentBadge, isPaid ? styles.paymentBadgePaid : styles.paymentBadgePending]}>
            <View style={[styles.paymentDot, { backgroundColor: isPaid ? '#22c55e' : '#f59e0b' }]} />
            <Text style={[styles.paymentBadgeText, { color: isPaid ? '#22c55e' : '#f59e0b' }]}>
              {item.paymentStatus || 'Pending'}
            </Text>
          </View>
        </View>

        {/* ── Food Info ── */}
        <SectionHeader title="Food Information" />
        <View style={styles.card}>
          <InfoRow
            icon={<Calendar size={16} color="#3aafa9" strokeWidth={2} />}
            label="Date"
            value={item.date ? new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
          />
       
          <View style={styles.divider} />
          <InfoRow
            icon={<Tag size={16} color="#3aafa9" strokeWidth={2} />}
            label="Brand"
            value={item.brandName}
          />
          <View style={styles.divider} />
          <InfoRow
            icon={<Weight size={16} color="#3aafa9" strokeWidth={2} />}
            label="Quantity"
            value={`${quantity} ${item.unit || ''}`}
          />
        </View>

        {/* ── Pricing ── */}
        <SectionHeader title="Pricing" />
        <View style={styles.card}>
          <InfoRow
            icon={<IndianRupee size={16} color="#f59e0b" strokeWidth={2} />}
            label="Rate per Unit"
            value={`₹${rate.toFixed(2)}`}
            accent="#f59e0b"
          />
          <View style={styles.divider} />

          {/* Total highlight row */}
          <View style={styles.totalRow}>
            <View style={styles.infoIconWrap}>
              <IndianRupee size={16} color="#3aafa9" strokeWidth={2} />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>
                ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />
          <InfoRow
            icon={<CreditCard size={16} color={isPaid ? '#22c55e' : '#f59e0b'} strokeWidth={2} />}
            label="Payment Status"
            value={item.paymentStatus}
            accent={isPaid ? '#22c55e' : '#f59e0b'}
          />
        </View>

        {/* ── Notes ── */}
        {item.notes ? (
          <>
            <SectionHeader title="Notes" />
            <View style={styles.notesCard}>
              <FileText size={16} color={colors.textMuted} strokeWidth={2} />
              <Text style={styles.notesText}>{item.notes}</Text>
            </View>
          </>
        ) : null}

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3aafa9',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    gap: 10,
  },
  backBtn: {
    width: 36, height: 36,
    justifyContent: 'center', alignItems: 'center',
  },
  brand: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  title: { fontSize: 18, fontWeight: '800', color: '#fff' },

  content: { padding: spacing.lg, paddingBottom: 48 },

  // Hero card
  heroCard: {
    backgroundColor: '#3aafa9',
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  heroIconRing: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  heroName: { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 4 },
  heroCenterRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 16 },
  heroCenter: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  amountPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  amountPillText: { fontSize: 20, fontWeight: '800', color: '#fff' },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  paymentBadgePaid:    { backgroundColor: 'rgba(34,197,94,0.15)' },
  paymentBadgePending: { backgroundColor: 'rgba(245,158,11,0.15)' },
  paymentDot: { width: 7, height: 7, borderRadius: 4 },
  paymentBadgeText: { fontSize: 13, fontWeight: '700' },

  // Section header
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 2,
  },

  // Info card
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    gap: 12,
  },
  infoIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#f0fdfb',
    justifyContent: 'center', alignItems: 'center',
  },
  infoTextWrap: { flex: 1 },
  infoLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600', marginBottom: 2 },
  infoValue: { fontSize: 15, color: colors.text, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginLeft: 46 },

  // Total row highlight
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    gap: 12,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#3aafa9',
  },

  // Notes
  notesCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    ...shadows.card,
    marginBottom: spacing.lg,
  },
  notesText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
    fontWeight: '500',
  },
});

export default FoodDetailScreen;