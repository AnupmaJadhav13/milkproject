import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Modal, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { Formik } from 'formik';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import { LogOut, House, Store, Salad, Users } from 'lucide-react-native';
import { foodSchema } from '../../validation/schemas';
import { createFoodRecord } from '../../redux/slices/foodSlice';
import { fetchFarmersByCenter } from '../../redux/slices/farmerSlice';
import { logout } from '../../redux/slices/authSlice';
import { SearchBar, LoadingIndicator } from '../../components';
import { colors, radius, spacing, typography, shadows } from '../../theme';

const FoodEntryScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const farmers = useSelector((state) => state.farmers.list);
  const foodStatus = useSelector((state) => state.food.status);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [farmerModalVisible, setFarmerModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const formikRef = useRef(null);

  useEffect(() => {
    if (token && user?.assignedCenter) {
      dispatch(fetchFarmersByCenter({ centerId: user.assignedCenter, token }));
    }
  }, [dispatch, token, user]);

  const filteredFarmers = farmers.filter(farmer =>
    farmer.farmerCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (values) => {
    try {
      const data = {
        ...values,
        date: selectedDate.toISOString()
      };
      await dispatch(createFoodRecord({ data, token })).unwrap();
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Food record created successfully',
        position: 'top',
        visibilityTime: 3000,
      });
      navigation.goBack();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error,
        position: 'top',
        visibilityTime: 4000,
      });
    }
  };

  const calculateTotal = (quantity, rate) => {
    if (quantity && rate) {
      return (parseFloat(quantity) * parseFloat(rate)).toFixed(2);
    }
    return '0.00';
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

        <Text style={styles.title}>Add Food Record</Text>
        <Text style={styles.subtitle}>Record food purchases for farmers</Text>

      <Formik
        innerRef={formikRef}
        initialValues={{
          farmerId: '',
          animalType: '',
          foodType: '',
          brandName: '',
          quantity: '',
          unit: '',
          rate: '',
          paymentStatus: 'Pending',
          notes: ''
        }}
        validationSchema={foodSchema}
        onSubmit={handleSubmit}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
          <View style={styles.card}>
            {/* Farmer Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Farmer</Text>
              <TouchableOpacity
                style={styles.farmerSelector}
                onPress={() => setFarmerModalVisible(true)}
              >
                <Text style={styles.farmerSelectorText}>
                  {selectedFarmer ? `${selectedFarmer.farmerCode || 'N/A'} - ${selectedFarmer.fullName}` : 'Select Farmer'}
                </Text>
              </TouchableOpacity>
              {touched.farmerId && errors.farmerId && (
                <Text style={styles.errorText}>{errors.farmerId}</Text>
              )}
            </View>
            {selectedFarmer && (
              <View style={styles.farmerDetailsCard}>
                <Text style={styles.farmerDetailLabel}>📱 {selectedFarmer.mobileNumber}</Text>
              </View>
            )}

            {/* Animal Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Animal Type</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={values.animalType}
                  onValueChange={(value) => setFieldValue('animalType', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Animal Type" value="" />
                  <Picker.Item label="Cow" value="Cow" />
                  <Picker.Item label="Buffalo" value="Buffalo" />
                </Picker>
              </View>
              {touched.animalType && errors.animalType && (
                <Text style={styles.errorText}>{errors.animalType}</Text>
              )}
            </View>

            {/* Food Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Food Type</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={values.foodType}
                  onValueChange={(value) => setFieldValue('foodType', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Food Type" value="" />
                  <Picker.Item label="Cattle Feed" value="Cattle Feed" />
                  <Picker.Item label="Buffalo Feed" value="Buffalo Feed" />
                  <Picker.Item label="Mineral Mix" value="Mineral Mix" />
                  <Picker.Item label="Dry Fodder" value="Dry Fodder" />
                  <Picker.Item label="Green Fodder" value="Green Fodder" />
                  <Picker.Item label="Protein Mix" value="Protein Mix" />
                  <Picker.Item label="Other" value="Other" />
                </Picker>
              </View>
              {touched.foodType && errors.foodType && (
                <Text style={styles.errorText}>{errors.foodType}</Text>
              )}
            </View>

            {/* Brand Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Brand Name (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter brand name"
                value={values.brandName}
                onChangeText={handleChange('brandName')}
                onBlur={handleBlur('brandName')}
              />
            </View>

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                {/* Quantity */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Quantity</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    keyboardType="numeric"
                    value={values.quantity}
                    onChangeText={handleChange('quantity')}
                    onBlur={handleBlur('quantity')}
                  />
                  {touched.quantity && errors.quantity && (
                    <Text style={styles.errorText}>{errors.quantity}</Text>
                  )}
                </View>
              </View>

              <View style={styles.halfWidth}>
                {/* Unit */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Unit</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={values.unit}
                      onValueChange={(value) => setFieldValue('unit', value)}
                      style={styles.picker}
                    >
                      <Picker.Item label="Select" value="" />
                      <Picker.Item label="Bag" value="Bag" />
                      <Picker.Item label="KG" value="KG" />
                      <Picker.Item label="Packet" value="Packet" />
                      <Picker.Item label="Liter" value="Liter" />
                    </Picker>
                  </View>
                  {touched.unit && errors.unit && (
                    <Text style={styles.errorText}>{errors.unit}</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Rate */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Rate Per Unit (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                keyboardType="numeric"
                value={values.rate}
                onChangeText={handleChange('rate')}
                onBlur={handleBlur('rate')}
              />
              {touched.rate && errors.rate && (
                <Text style={styles.errorText}>{errors.rate}</Text>
              )}
            </View>

            {/* Total Amount */}
            <View style={styles.calculationCard}>
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabelBold}>Total Amount</Text>
                <Text style={styles.calculationValueBold}>₹{calculateTotal(values.quantity, values.rate)}</Text>
              </View>
            </View>

            {/* Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>{selectedDate.toDateString()}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowDatePicker(false);
                    if (date) setSelectedDate(date);
                  }}
                />
              )}
            </View>

            {/* Payment Status */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Payment Status</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={values.paymentStatus}
                  onValueChange={(value) => setFieldValue('paymentStatus', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Pending" value="Pending" />
                  <Picker.Item label="Paid" value="Paid" />
                </Picker>
              </View>
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter notes"
                multiline
                numberOfLines={3}
                value={values.notes}
                onChangeText={handleChange('notes')}
                onBlur={handleBlur('notes')}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={foodStatus === 'loading'}
            >
              {foodStatus === 'loading' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>✓ Submit Record</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </Formik>

      {/* Farmer Selection Modal */}
      <Modal
        visible={farmerModalVisible}
        animationType="slide"
        onRequestClose={() => setFarmerModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Farmer</Text>
            <TouchableOpacity onPress={() => setFarmerModalVisible(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <SearchBar
            placeholder="Search by farmer code..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <FlatList
            data={filteredFarmers}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.farmerItem}
                onPress={() => {
                  setSelectedFarmer(item);
                  if (formikRef.current) {
                    formikRef.current.setFieldValue('farmerId', item._id);
                  }
                  setFarmerModalVisible(false);
                }}
              >
                <View style={styles.farmerItemAvatar}>
                  <Text style={styles.farmerItemAvatarText}>{item.fullName?.charAt(0).toUpperCase() || 'F'}</Text>
                </View>
                <View style={styles.farmerItemInfo}>
                  <Text style={styles.farmerCode}>{item.farmerCode || 'N/A'}</Text>
                  <Text style={styles.farmerName}>{item.fullName}</Text>
                  <Text style={styles.farmerMobile}>📱 {item.mobileNumber}</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No farmers found</Text>}
          />
        </View>
      </Modal>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CollectionHeadHome')}>
          <View style={styles.navIconContainer}>
            <House size={22} color={colors.textMuted} strokeWidth={2} />
          </View>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MilkEntry')}>
          <View style={styles.navIconContainer}>
            <Store size={22} color={colors.textMuted} strokeWidth={2} />
          </View>
          <Text style={styles.navLabel}>Milk Entry</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <View style={[styles.navIconContainer, styles.navIconActive]}>
            <Salad size={22} color={colors.surface} strokeWidth={2} />
          </View>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Food Entry</Text>
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
  inputGroup: {
    marginBottom: spacing.md
  },
  label: {
    fontSize: 13,
    color: colors.darkGray,
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
  farmerSelector: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.surface
  },
  farmerSelectorText: {
    fontSize: 15,
    color: colors.text
  },
  farmerDetailsCard: {
    backgroundColor: colors.lightBlue,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.sm
  },
  farmerDetailLabel: {
    fontSize: 13,
    color: colors.textMuted
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
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary + '20'
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
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
  dateButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.surface
  },
  dateText: {
    fontSize: 15,
    color: colors.text
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top'
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4
  },
  submitButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.success,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    ...shadows.small
  },
  submitButtonText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 16
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text
  },
  modalClose: {
    fontSize: 24,
    color: colors.textMuted
  },
  farmerItem: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.small
  },
  farmerItemAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm
  },
  farmerItemAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.surface
  },
  farmerItemInfo: {
    flex: 1
  },
  farmerCode: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 2
  },
  farmerName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2
  },
  farmerMobile: {
    fontSize: 13,
    color: colors.textMuted
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
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

export default FoodEntryScreen;