import React, { useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Formik } from 'formik';
import Toast from 'react-native-toast-message';
import { farmerSchema } from '../../validation/schemas';
import { createFarmer } from '../../redux/slices/farmerSlice';
import { fetchCenters } from '../../redux/slices/centerSlice';

const AddFarmerScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const centers = useSelector((state) => state.centers.list);

  useEffect(() => {
    if (token) dispatch(fetchCenters(token));
  }, [dispatch, token]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Add Farmer</Text>
      <Formik
        initialValues={{
          fullName: '',
          mobileNumber: '',
          alternativeNumber: '',
          address: '',
          village: '',
          aadhaarNumber: '',
          gender: '',
          bankName: '',
          ifscCode: '',
          accountNumber: '',
          accountHolderName: '',
          branchName: '',
          assignedCenter: '',
          animalType: '',
          status: 'Active',
          notes: ''
        }}
        validationSchema={farmerSchema}
        onSubmit={async (values) => {
          try {
            await dispatch(createFarmer({ data: values, token })).unwrap();
            Toast.show({
              type: 'success',
              text1: 'Success',
              text2: 'Farmer added successfully',
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
            {[
              { name: 'fullName', label: 'Full Name' },
              { name: 'mobileNumber', label: 'Mobile Number' },
              { name: 'alternativeNumber', label: 'Alternative Number' },
              { name: 'address', label: 'Address' },
              { name: 'village', label: 'Village' },
              { name: 'aadhaarNumber', label: 'Aadhaar Number' },
              { name: 'gender', label: 'Gender' }
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
              { name: 'accountHolderName', label: 'Account Holder Name' },
              { name: 'branchName', label: 'Branch Name' }
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
              <TextInput
                value={values.assignedCenter}
                onChangeText={handleChange('assignedCenter')}
                onBlur={handleBlur('assignedCenter')}
                placeholder="Assigned Center ID"
                style={styles.input}
                placeholderTextColor="#94a3b8"
              />
              {touched.assignedCenter && errors.assignedCenter ? <Text style={styles.error}>{errors.assignedCenter}</Text> : null}
            </View>
            <TextInput
              value={values.animalType}
              onChangeText={handleChange('animalType')}
              onBlur={handleBlur('animalType')}
              placeholder="Animal Type (Cow, Buffalo, Both)"
              style={styles.input}
              placeholderTextColor="#94a3b8"
            />
            {touched.animalType && errors.animalType ? <Text style={styles.error}>{errors.animalType}</Text> : null}
            <TextInput
              value={values.status}
              onChangeText={handleChange('status')}
              onBlur={handleBlur('status')}
              placeholder="Status (Active/Inactive)"
              style={styles.input}
              placeholderTextColor="#94a3b8"
            />
            <TextInput
              value={values.notes}
              onChangeText={handleChange('notes')}
              onBlur={handleBlur('notes')}
              placeholder="Notes"
              style={[styles.input, styles.multiline]}
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={3}
            />
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
