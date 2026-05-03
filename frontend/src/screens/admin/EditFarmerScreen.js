import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Formik } from 'formik';
import { useDispatch, useSelector } from 'react-redux';
import { farmerSchema } from '../../validation/schemas';
import { updateFarmer } from '../../redux/slices/farmerSlice';

const EditFarmerScreen = ({ route, navigation }) => {
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
          fullName: farmer.fullName || '',
          mobileNumber: farmer.mobileNumber || '',
          alternativeNumber: farmer.alternativeNumber || '',
          address: farmer.address || '',
          village: farmer.village || '',
          aadhaarNumber: farmer.aadhaarNumber || '',
          gender: farmer.gender || '',
          bankName: farmer.bankName || '',
          ifscCode: farmer.ifscCode || '',
          accountNumber: farmer.accountNumber || '',
          accountHolderName: farmer.accountHolderName || '',
          branchName: farmer.branchName || '',
          assignedCenter: farmer.assignedCenter?._id || '',
          animalType: farmer.animalType || '',
          status: farmer.status || 'Active',
          notes: farmer.notes || ''
        }}
        onSubmit={async (values) => {
          try {
            await dispatch(updateFarmer({ id: farmer._id, data: values, token })).unwrap();
            navigation.goBack();
          } catch (error) {
            Alert.alert('Error', error);
          }
        }}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <>
            {['fullName', 'mobileNumber', 'alternativeNumber', 'address', 'village', 'aadhaarNumber', 'gender', 'bankName', 'ifscCode', 'accountNumber', 'accountHolderName', 'branchName', 'assignedCenter', 'animalType', 'status'].map((field) => (
              <View key={field} style={styles.field}>
                <TextInput
                  value={values[field]}
                  onChangeText={handleChange(field)}
                  onBlur={handleBlur(field)}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                  style={styles.input}
                  placeholderTextColor="#94a3b8"
                />
                {touched[field] && errors[field] ? <Text style={styles.error}>{errors[field]}</Text> : null}
              </View>
            ))}
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
    marginTop: 12,
    textAlign: 'center'
  }
});

export default EditFarmerScreen;
