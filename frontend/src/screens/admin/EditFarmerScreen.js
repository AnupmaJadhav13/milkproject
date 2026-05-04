import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Formik } from 'formik';
import { useDispatch, useSelector } from 'react-redux';
import { Picker } from '@react-native-picker/picker';
import Toast from 'react-native-toast-message';
import { farmerSchema } from '../../validation/schemas';
import { updateFarmer } from '../../redux/slices/farmerSlice';

const EditFarmerScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const farmer = route.params?.farmer;

  if (!farmer) {
    return <Text style={styles.error}>Farmer not available</Text>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Edit Farmer</Text>
      <Formik
        validationSchema={farmerSchema}
        initialValues={{
          farmerCode: farmer.farmerCode || '',
          fullName: farmer.fullName || '',
          mobileNumber: farmer.mobileNumber || '',
          alternativeNumber: farmer.alternativeNumber || '',
          address: farmer.address || '',
          village: farmer.village || '',
          bankName: farmer.bankName || '',
          ifscCode: farmer.ifscCode || '',
          accountNumber: farmer.accountNumber || '',
          accountHolderName: farmer.accountHolderName || '',
          assignedCenterCode: farmer.assignedCenterCode || farmer.assignedCenter?.centerCode || '',
          assignedCenter: farmer.assignedCenter?._id || '',
          animalType: farmer.animalType || '',
          status: farmer.status || 'Active'
        }}
        onSubmit={async (values) => {
          try {
            const { farmerCode: _fc, ...payload } = values;
            await dispatch(updateFarmer({ id: farmer._id, data: payload, token })).unwrap();
            Toast.show({
              type: 'success',
              text1: 'Success',
              text2: 'Farmer updated successfully',
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
        }}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>Farmer Code</Text>
              <TextInput value={values.farmerCode} style={[styles.input, styles.readOnlyInput]} editable={false} />
            </View>
            {[
              { key: 'fullName', label: 'Full Name' },
              { key: 'mobileNumber', label: 'Mobile Number' },
              { key: 'alternativeNumber', label: 'Alternative Number' },
              { key: 'address', label: 'Address' },
              { key: 'village', label: 'Village' },
              { key: 'bankName', label: 'Bank Name' },
              { key: 'ifscCode', label: 'IFSC Code' },
              { key: 'accountNumber', label: 'Account Number' },
              { key: 'accountHolderName', label: 'Account Holder Name' }
            ].map(({ key, label }) => (
              <View key={key} style={styles.field}>
                <Text style={styles.label}>{label}</Text>
                <TextInput
                  value={values[key]}
                  onChangeText={handleChange(key)}
                  onBlur={handleBlur(key)}
                  placeholder={label}
                  style={styles.input}
                  placeholderTextColor="#94a3b8"
                />
                {touched[key] && errors[key] ? <Text style={styles.fieldError}>{errors[key]}</Text> : null}
              </View>
            ))}
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
              <Text style={styles.buttonText}>Update Farmer</Text>
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
    color: '#0f172a'
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
    overflow: 'hidden'
  },
  readOnlyInput: {
    backgroundColor: '#e2e8f0',
    color: '#334155'
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
  fieldError: {
    color: '#dc2626',
    marginTop: 4,
    fontSize: 12
  },
  error: {
    color: '#dc2626',
    marginTop: 12,
    textAlign: 'center'
  }
});

export default EditFarmerScreen;
