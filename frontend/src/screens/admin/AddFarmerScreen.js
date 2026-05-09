import React, { useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { Formik } from 'formik';
import { Picker } from '@react-native-picker/picker';
import Toast from 'react-native-toast-message';
import { farmerSchema } from '../../validation/schemas';
import { fetchFarmers } from '../../redux/slices/farmerSlice';
import { createFarmer } from '../../redux/slices/farmerSlice';
const AddFarmerScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const farmerList = useSelector((state) => state.farmers.list);
  const selectedCenterId = route?.params?.centerId || '';
  const selectedCenterName = route?.params?.centerName || '';
  const selectedCenterCode = route?.params?.centerCode || '';
  const nextCode = `FARM-${String((farmerList?.length || 0) + 1).padStart(4, '0')}`;

  useEffect(() => {
    if (token) {
      dispatch(fetchFarmers({ token, params: {} }));
    }
  }, [dispatch, token]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Add Farmer</Text>
      <Formik
        initialValues={{
          farmerCode: nextCode,
          fullName: '',
          mobileNumber: '',
          alternativeNumber: '',
          address: '',
          village: '',
          bankName: '',
          ifscCode: '',
          accountNumber: '',
          accountHolderName: '',
          assignedCenter: selectedCenterId,
          assignedCenterCode: selectedCenterCode,
          animalType: 'Cow',
          status: 'Active'
        }}
        validationSchema={farmerSchema}
        onSubmit={async (values) => {
          try {
            const { farmerCode: _fc, ...payload } = values;
            await dispatch(createFarmer({ data: payload, token })).unwrap();
            Toast.show({
              type: 'success',
              text1: 'Success',
              text2: 'Farmer added successfully',
              position: 'top',
              visibilityTime: 3000,
            });
            navigation.navigate('FarmerList', { 
              centerId: selectedCenterId, 
              centerCode: selectedCenterCode, 
              centerName: selectedCenterName,
              refresh: Date.now()
            });
          } catch (error) {
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: error,
              position: 'top',
              visibilityTime: 4000,
            });
          }
        }}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>Farmer Code (Auto Generated)</Text>
              <TextInput value={nextCode} style={[styles.input, styles.readOnlyInput]} editable={false} />
            </View>
            {[
              { name: 'fullName', label: 'Full Name' },
              { name: 'mobileNumber', label: 'Mobile Number' },
              { name: 'alternativeNumber', label: 'Alternative Number' },
              { name: 'address', label: 'Address' },
              { name: 'village', label: 'Village' }
            ].map((field) => (
              <View key={field.name} style={styles.field}>
                <TextInput
                  value={values[field.name]}
                  onChangeText={handleChange(field.name)}
                  onBlur={handleBlur(field.name)}
                  placeholder={field.label}
                  style={styles.input}
                  placeholderTextColor="#94a3b8"
                />
                {touched[field.name] && errors[field.name] ? <Text style={styles.error}>{errors[field.name]}</Text> : null}
              </View>
            ))}
            <Text style={styles.sectionLabel}>Bank Details</Text>
            {[
              { name: 'bankName', label: 'Bank Name' },
              { name: 'ifscCode', label: 'IFSC Code' },
              { name: 'accountNumber', label: 'Account Number' },
              { name: 'accountHolderName', label: 'Account Holder Name' }
            ].map((field) => (
              <View key={field.name} style={styles.field}>
                <TextInput
                  value={values[field.name]}
                  onChangeText={handleChange(field.name)}
                  onBlur={handleBlur(field.name)}
                  placeholder={field.label}
                  style={styles.input}
                  placeholderTextColor="#94a3b8"
                />
                {touched[field.name] && errors[field.name] ? <Text style={styles.error}>{errors[field.name]}</Text> : null}
              </View>
            ))}
            <Text style={styles.sectionLabel}>Dairy Details</Text>
            <View style={styles.field}>
              <Text style={styles.label}>Animal Type</Text>
              <View style={styles.pickerWrap}>
                <Picker selectedValue={values.animalType} onValueChange={handleChange('animalType')}>
                  <Picker.Item label="Cow" value="Cow" />
                  <Picker.Item label="Buffalo" value="Buffalo" />
                  <Picker.Item label="Both" value="Both" />
                </Picker>
              </View>
              {touched.animalType && errors.animalType ? <Text style={styles.error}>{errors.animalType}</Text> : null}
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.pickerWrap}>
                <Picker selectedValue={values.status} onValueChange={handleChange('status')}>
                  <Picker.Item label="Active" value="Active" />
                  <Picker.Item label="Inactive" value="Inactive" />
                </Picker>
              </View>
              {touched.status && errors.status ? <Text style={styles.error}>{errors.status}</Text> : null}
            </View>
            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Create Farmer</Text>
            </TouchableOpacity>
          </>
        )}
      </Formik>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  content: {
    padding: 20
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 18
  },
  sectionLabel: {
    marginTop: 12,
    marginBottom: 8,
    color: '#334155',
    fontWeight: '700'
  },
  field: {
    marginBottom: 14
  },
  input: {
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 16,
    color: '#0f172a',
    marginBottom: 6
  },
  label: {
    marginBottom: 8,
    color: '#334155',
    fontWeight: '600'
  },
  pickerWrap: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    overflow: 'hidden',
    marginBottom: 6
  },
  readOnlyInput: {
    backgroundColor: '#e2e8f0',
    color: '#334155'
  },
  multiline: {
    minHeight: 90,
    textAlignVertical: 'top'
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    marginTop: 10
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700'
  },
  error: {
    color: '#dc2626',
    marginBottom: 4
  }
});

export default AddFarmerScreen;
