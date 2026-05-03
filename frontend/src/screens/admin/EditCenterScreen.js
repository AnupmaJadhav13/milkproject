import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Formik } from 'formik';
import { useDispatch, useSelector } from 'react-redux';
import { centerSchema } from '../../validation/schemas';
import { updateCenter } from '../../redux/slices/centerSlice';

const EditCenterScreen = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const center = route.params?.center;

  if (!center) {
    return <Text style={styles.error}>Center not found</Text>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Edit Collection Center</Text>
      <Formik
        validationSchema={centerSchema}
        initialValues={{
          name: center.name || '',
          centerCode: center.centerCode || '',
          fullAddress: center.fullAddress || '',
          village: center.village || '',
          taluka: center.taluka || '',
          district: center.district || '',
          state: center.state || '',
          pincode: center.pincode || '',
          gpsLocation: center.gpsLocation || '',
          latitude: String(center.latitude || ''),
          longitude: String(center.longitude || ''),
          status: center.status || 'Active'
        }}
        onSubmit={async (values) => {
          try {
            await dispatch(updateCenter({ id: center._id, data: values, token })).unwrap();
            navigation.goBack();
          } catch (error) {
            Alert.alert('Error', error);
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
            <View style={styles.statusRow}>
              <Text style={styles.label}>Status</Text>
              <Text style={styles.statusText}>{values.status}</Text>
            </View>
            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Update Center</Text>
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10
  },
  label: {
    color: '#475569',
    marginBottom: 6
  },
  statusText: {
    color: '#2563eb',
    fontWeight: '700'
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

export default EditCenterScreen;
