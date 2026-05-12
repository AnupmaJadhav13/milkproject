import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Formik } from 'formik';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { centerSchema } from '../../validation/schemas';
import { updateCenter } from '../../redux/slices/centerSlice';

const EditCenterScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const center = route.params?.center;

  if (!center) {
    return <Text style={styles.error}>Center not found</Text>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Edit Collection Center</Text>
      <Formik
        validationSchema={centerSchema}
        initialValues={{
          name: center.name || '',
          centerCode: center.centerCode || '',
          fullAddress: center.fullAddress || '',
          village: center.village || '',
          district: center.district || '',
          state: center.state || '',
          pincode: center.pincode || '',
          status: center.status || 'Active',
          collectionHead: {
            fullName: center.collectionHead?.fullName || '',
            mobileNumber: center.collectionHead?.mobileNumber || '',
            alternativeMobileNumber: center.collectionHead?.alternativeMobileNumber || '',
            username: center.collectionHead?.username || '',
            password: ''
          }
        }}
        onSubmit={async (values) => {
          try {
            const payload = { ...values };
            if (payload.collectionHead) {
              if (payload.collectionHead.password === '') {
                delete payload.collectionHead.password;
              }
              const hasHeadData = payload.collectionHead.username || payload.collectionHead.fullName || payload.collectionHead.mobileNumber || payload.collectionHead.alternativeMobileNumber;
              if (!hasHeadData) {
                delete payload.collectionHead;
              }
            }
            await dispatch(updateCenter({ id: center._id, data: payload, token })).unwrap();
            Toast.show({
              type: 'success',
              text1: 'Success',
              text2: 'Collection center updated successfully',
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
              <Text style={styles.label}>Center Code</Text>
              <TextInput value={values.centerCode} style={[styles.input, styles.readOnlyInput]} editable={false} />
            </View>
            {['name', 'fullAddress', 'village', 'district', 'state', 'pincode'].map((field) => (
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
  readOnlyInput: {
    backgroundColor: '#e2e8f0',
    color: '#334155'
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 16,
    marginBottom: 10
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
