import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Modal, FlatList } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Formik } from 'formik';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import { foodSchema } from '../../validation/schemas';
import { createFoodRecord } from '../../redux/slices/foodSlice';
import { fetchFarmers } from '../../redux/slices/farmerSlice';
import { SearchBar, LoadingIndicator } from '../../components';
import styles from './styles';

const FoodEntryScreen = ({ navigation }) => {
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

  useEffect(() => {
    if (token && user?.assignedCenter) {
      dispatch(fetchFarmers({ token, params: { center: user.assignedCenter } }));
    }
  }, [dispatch, token, user]);

  const filteredFarmers = farmers.filter(farmer =>
    farmer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    farmer.mobileNumber.includes(searchQuery)
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Add Food Record</Text>

      <Formik
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
          <>
            {/* Farmer Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Farmer</Text>
              <TouchableOpacity
                style={styles.farmerSelector}
                onPress={() => setFarmerModalVisible(true)}
              >
                <Text style={styles.farmerText}>
                  {selectedFarmer ? `${selectedFarmer.fullName} (${selectedFarmer.mobileNumber})` : 'Select Farmer'}
                </Text>
              </TouchableOpacity>
              {touched.farmerId && errors.farmerId && (
                <Text style={styles.errorText}>{errors.farmerId}</Text>
              )}
            </View>
            {selectedFarmer && (
              <View style={styles.farmerDetailsContainer}>
                <Text style={styles.farmerDetailLabel}>Farmer ID</Text>
                <Text style={styles.farmerDetailValue}>{selectedFarmer._id}</Text>
                <Text style={styles.farmerDetailLabel}>Mobile Number</Text>
                <Text style={styles.farmerDetailValue}>{selectedFarmer.mobileNumber}</Text>
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

            {/* Quantity */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter quantity"
                keyboardType="numeric"
                value={values.quantity}
                onChangeText={handleChange('quantity')}
                onBlur={handleBlur('quantity')}
              />
              {touched.quantity && errors.quantity && (
                <Text style={styles.errorText}>{errors.quantity}</Text>
              )}
            </View>

            {/* Unit */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Unit</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={values.unit}
                  onValueChange={(value) => setFieldValue('unit', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Unit" value="" />
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

            {/* Rate */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Rate Per Unit (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter rate"
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
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Total Amount (₹)</Text>
              <Text style={styles.totalText}>{calculateTotal(values.quantity, values.rate)}</Text>
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
                <LoadingIndicator />
              ) : (
                <Text style={styles.submitButtonText}>Submit Record</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </Formik>

      {/* Farmer Selection Modal */}
      <Modal
        visible={farmerModalVisible}
        animationType="slide"
        onRequestClose={() => setFarmerModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <SearchBar
            placeholder="Search farmers..."
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
                  setFieldValue('farmerId', item._id);
                  setFarmerModalVisible(false);
                }}
              >
                <Text style={styles.farmerName}>{item.fullName}</Text>
                <Text style={styles.farmerMobile}>{item.mobileNumber}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No farmers found</Text>}
          />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setFarmerModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default FoodEntryScreen;