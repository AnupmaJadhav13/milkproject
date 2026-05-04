import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Formik } from 'formik';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { centerSchema } from '../../validation/schemas';
import { createCenter } from '../../redux/slices/centerSlice';

const AddCenterScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Add Collection Center</Text>
      <Formik
        validationSchema={centerSchema}
        initialValues={{
          name: '',
          centerCode: '',
          fullAddress: '',
          village: '',
          taluka: '',
          district: '',
          state: '',
          pincode: '',
          gpsLocation: '',
          latitude: '',
          longitude: '',
          status: 'Active',
          collectionHead: {
            fullName: '',
            mobileNumber: '',
            alternativeMobileNumber: '',
            username: '',
            password: ''
          }
        }}
        onSubmit={async (values) => {
          try {
            await dispatch(createCenter({ data: values, token })).unwrap();
            Toast.show({
              type: 'success',
              text1: 'Success',
              text2: 'Collection center added successfully',
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
            {['name', 'centerCode', 'fullAddress', 'village', 'taluka', 'district', 'state', 'pincode', 'gpsLocation', 'latitude', 'longitude'].map((field) => (
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
            <Text style={styles.sectionTitle}>Collection Head Details</Text>
            {[
              { name: 'collectionHead.fullName', label: 'Head Name' },
              { name: 'collectionHead.mobileNumber', label: 'Phone Number' },
              { name: 'collectionHead.alternativeMobileNumber', label: 'Alternate Phone Number' },
              { name: 'collectionHead.username', label: 'Username' },
              { name: 'collectionHead.password', label: 'Password', secure: true }
            ].map((field) => (
              <View key={field.name} style={styles.field}>
                <TextInput
                  value={field.name === 'collectionHead.password' ? values.collectionHead.password : values.collectionHead[field.name.split('.').pop()]}
                  onChangeText={handleChange(field.name)}
                  onBlur={handleBlur(field.name)}
                  placeholder={field.label}
                  secureTextEntry={field.secure}
                  style={styles.input}
                  placeholderTextColor="#94a3b8"
                />
                {field.name.includes('.') && touched.collectionHead?.[field.name.split('.').pop()] && errors.collectionHead?.[field.name.split('.').pop()] ? (
                  <Text style={styles.error}>{errors.collectionHead[field.name.split('.').pop()]}</Text>
                ) : null}
              </View>
            ))}
            <View style={styles.statusRow}>
              <Text style={styles.label}>Status</Text>
              <Text style={styles.statusText}>{values.status}</Text>
            </View>
            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Save Center</Text>
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
  label: {
    color: '#475569',
    marginBottom: 6
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10
  },
  statusText: {
    color: '#2563eb',
    fontWeight: '700'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 16,
    marginBottom: 10
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
    marginTop: 4,
    color: '#dc2626'
  }
});

export default AddCenterScreen;
