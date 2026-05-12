import { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { Picker } from '@react-native-picker/picker';
import { House, Store, Users, Salad, Phone, LogOut } from 'lucide-react-native';
import { fetchFarmersByCenter } from '../../redux/slices/farmerSlice';
import { createMilkEntry, fetchMilkEntries } from '../../redux/slices/milkSlice';
import { logout } from '../../redux/slices/authSlice';
import { colors, radius, spacing, shadows } from '../../theme';

const MilkEntryScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const farmers = useSelector((state) => state.farmers.list);
  const entries = useSelector((state) => state.milk.entries);
  const milkStatus = useSelector((state) => state.milk.status);
  const [form, setForm] = useState({
    farmerId: '',
    shift: 'Morning',
    animalType: 'Cow',
    quantityLiters: '',
    fat: '',
    snf: '',
    date: new Date().toISOString().slice(0, 10)
  });

  useEffect(() => {
    if (token && user?.assignedCenter) {
      dispatch(fetchFarmersByCenter({ centerId: user.assignedCenter, token }));
      dispatch(fetchMilkEntries({ token, params: { date: form.date } }));
    }
  }, [dispatch, token, user?.assignedCenter, form.date]);

  const selectedFarmer = useMemo(() => farmers.find((f) => f._id === form.farmerId), [farmers, form.farmerId]);
  const liveRate = useMemo(() => {
    const fat = Number(form.fat || 0);
    const snf = Number(form.snf || 0);
    const base = 30;
    const fatDiffSteps = Math.round((fat - 3.0) * 10);
    const snfDiffSteps = Math.round((snf - 7.5) * 10);
    return Number((base + fatDiffSteps * 0.3 + snfDiffSteps * 0.5).toFixed(2));
  }, [form.fat, form.snf]);
  const totalAmount = useMemo(() => Number((Number(form.quantityLiters || 0) * liveRate).toFixed(2)), [form.quantityLiters, liveRate]);

  const onSave = async () => {
    if (!form.farmerId || !form.quantityLiters || !form.fat || !form.snf) {
      Toast.show({ type: 'error', text1: 'Please fill all required fields' });
      return;
    }
    try {
      await dispatch(
        createMilkEntry({
          token,
          data: {
            farmerId: form.farmerId,
            shift: form.shift,
            animalType: form.animalType,
            quantityLiters: Number(form.quantityLiters),
            fat: Number(form.fat),
            snf: Number(form.snf),
            date: form.date
          }
        })
      ).unwrap();
      Toast.show({ type: 'success', text1: 'Milk record saved' });
      setForm((prev) => ({ ...prev, quantityLiters: '', fat: '', snf: '' }));
      dispatch(fetchMilkEntries({ token, params: { date: form.date } }));
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Save failed', text2: String(error) });
    }
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'C'}</Text>
            </View>
            <Text style={styles.brandText}>Sarvasvaa Milk</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={18} color={colors.danger} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Daily Milk Collection</Text>
        <Text style={styles.subtitle}>Record milk collection from farmers</Text>

        {/* Entry Form Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Collection Details</Text>

          <Text style={styles.label}>Farmer</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={form.farmerId} onValueChange={(value) => setForm((prev) => ({ ...prev, farmerId: value }))}>
              <Picker.Item label="Select farmer by code" value="" />
              {farmers.map((f) => (
                <Picker.Item key={f._id} label={`${f.farmerCode} - ${f.fullName}`} value={f._id} />
              ))}
            </Picker>
          </View>
          {selectedFarmer ? (
            <View style={styles.helperRow}>
              <Phone size={14} color={colors.textMuted} strokeWidth={2} />
              <Text style={styles.helper}>{selectedFarmer.mobileNumber}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>Date</Text>
          <TextInput style={styles.input} value={form.date} onChangeText={(value) => setForm((prev) => ({ ...prev, date: value }))} placeholder="YYYY-MM-DD" />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Shift</Text>
              <View style={styles.pickerContainer}>
                <Picker selectedValue={form.shift} onValueChange={(value) => setForm((prev) => ({ ...prev, shift: value }))}>
                  <Picker.Item label="Morning" value="Morning" />
                  <Picker.Item label="Evening" value="Evening" />
                </Picker>
              </View>
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Animal Type</Text>
              <View style={styles.pickerContainer}>
                <Picker selectedValue={form.animalType} onValueChange={(value) => setForm((prev) => ({ ...prev, animalType: value }))}>
                  <Picker.Item label="Cow" value="Cow" />
                  <Picker.Item label="Buffalo" value="Buffalo" />
                </Picker>
              </View>
            </View>
          </View>

          <Text style={styles.label}>Milk Quantity (Liters)</Text>
          <TextInput style={styles.input} keyboardType="decimal-pad" value={form.quantityLiters} onChangeText={(value) => setForm((prev) => ({ ...prev, quantityLiters: value }))} placeholder="0.00" />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>FAT %</Text>
              <TextInput style={styles.input} keyboardType="decimal-pad" value={form.fat} onChangeText={(value) => setForm((prev) => ({ ...prev, fat: value }))} placeholder="0.0" />
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>SNF %</Text>
              <TextInput style={styles.input} keyboardType="decimal-pad" value={form.snf} onChangeText={(value) => setForm((prev) => ({ ...prev, snf: value }))} placeholder="0.0" />
            </View>
          </View>

          {/* Live Calculation */}
          <View style={styles.calculationCard}>
            <View style={styles.calculationRow}>
              <Text style={styles.calculationLabel}>Rate per Liter</Text>
              <Text style={styles.calculationValue}>₹{liveRate.toFixed(2)}</Text>
            </View>
            <View style={styles.calculationRow}>
              <Text style={styles.calculationLabelBold}>Total Amount</Text>
              <Text style={styles.calculationValueBold}>₹{totalAmount.toFixed(2)}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={onSave} disabled={milkStatus === 'loading'}>
            <Text style={styles.saveText}>{milkStatus === 'loading' ? 'Saving...' : '✓ Save Collection'}</Text>
          </TouchableOpacity>
        </View>

        {/* Today's History */}
        <Text style={styles.historyTitle}>Today's Collections</Text>
        {entries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No records for selected date</Text>
          </View>
        ) : (
          entries.map((item) => (
            <View key={item._id} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <View style={styles.farmerAvatar}>
                  <Text style={styles.farmerAvatarText}>
                    {(item.farmerId?.fullName || item.farmerCode || 'F').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyName}>{item.farmerId?.fullName || item.farmerCode}</Text>
                  <Text style={styles.historyDetails}>
                    {item.shift} · {item.animalType}
                  </Text>
                </View>
                <View style={styles.historyAmount}>
                  <Text style={styles.historyAmountValue}>₹{Number(item.amountInr).toFixed(2)}</Text>
                  <Text style={styles.historyQuantity}>{Number(item.quantityLiters).toFixed(2)}L</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CollectionHeadHome')}>
          <View style={styles.navIconContainer}>
            <House size={22} color={colors.textMuted} strokeWidth={2} />
          </View>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <View style={[styles.navIconContainer, styles.navIconActive]}>
            <Store size={22} color={colors.surface} strokeWidth={2} />
          </View>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Milk Entry</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('FoodEntry')}>
          <View style={styles.navIconContainer}>
            <Salad size={22} color={colors.textMuted} strokeWidth={2} />
          </View>
          <Text style={styles.navLabel}>Food Entry</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CollectionHeadFarmers')}>
          <View style={styles.navIconContainer}>
            <Users size={22} color={colors.textMuted} strokeWidth={2} />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.surface
  },
  brandText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text
  },
  logoutButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.danger
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.sm
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: spacing.lg
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.md
  },
  label: {
    fontSize: 13,
    color: colors.darkGray,
    marginTop: spacing.sm,
    marginBottom: 6,
    fontWeight: '600'
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    fontSize: 15,
    color: colors.text
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    overflow: 'hidden'
  },
  helper: {
    color: colors.textMuted,
    fontSize: 13,
    marginLeft: 6
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  halfWidth: {
    flex: 1
  },
  calculationCard: {
    backgroundColor: colors.lightBlue,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '20'
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  calculationLabel: {
    fontSize: 14,
    color: colors.textMuted
  },
  calculationValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary
  },
  calculationLabelBold: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text
  },
  calculationValueBold: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary
  },
  saveBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.success,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    ...shadows.small
  },
  saveText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 16
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.md
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.card
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.sm
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14
  },
  historyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.small
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  farmerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm
  },
  farmerAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.surface
  },
  historyInfo: {
    flex: 1
  },
  historyName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2
  },
  historyDetails: {
    fontSize: 13,
    color: colors.textMuted
  },
  historyAmount: {
    alignItems: 'flex-end'
  },
  historyAmountValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.success,
    marginBottom: 2
  },
  historyQuantity: {
    fontSize: 12,
    color: colors.textMuted
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
  navIconActive: {
    backgroundColor: colors.primary
  },
  navLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600'
  },
  navLabelActive: {
    color: colors.primary
  }
});

export default MilkEntryScreen;
