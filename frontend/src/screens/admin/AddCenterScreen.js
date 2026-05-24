import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Formik } from 'formik';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { Eye, EyeOff } from 'lucide-react-native';
import { centerSchema } from '../../validation/schemas';
import { createCenter, fetchCenters } from '../../redux/slices/centerSlice';

const AddCenterScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const centerList = useSelector((state) => state.centers.list);
  const nextCenterCode = `CTR-${String((centerList?.length || 0) + 1).padStart(4, '0')}`;
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (token) dispatch(fetchCenters(token));
  }, [dispatch, token]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Add Collection Center</Text>
      <Formik
        validationSchema={centerSchema}
        initialValues={{
          name: '',
          centerCode: nextCenterCode,
          fullAddress: '',
          village: '',
          district: '',
          state: '',
          pincode: '',
          status: 'Active',
          collectionHead: {
            fullName: '',
            mobileNumber: '',
            username: '',
            password: '',
          },
        }}
        onSubmit={async (values) => {
          try {
            await dispatch(createCenter({ data: values, token })).unwrap();
            Toast.show({ type: 'success', text1: 'Success', text2: 'Collection center added successfully', position: 'top', visibilityTime: 3000 });
            navigation.goBack();
          } catch (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: error, position: 'top', visibilityTime: 4000 });
          }
        }}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>Center Code (Auto Generated)</Text>
              <TextInput value={nextCenterCode} style={[styles.input, styles.readOnlyInput]} editable={false} />
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
              { name: 'collectionHead.mobileNumber', label: 'Phone Number', keyboard: 'phone-pad' },
              { name: 'collectionHead.username', label: 'Username' },
            ].map((field) => (
              <View key={field.name} style={styles.field}>
                <TextInput
                  value={values.collectionHead[field.name.split('.').pop()]}
                  onChangeText={handleChange(field.name)}
                  onBlur={handleBlur(field.name)}
                  placeholder={field.label}
                  keyboardType={field.keyboard || 'default'}
                  style={styles.input}
                  placeholderTextColor="#94a3b8"
                />
                {touched.collectionHead?.[field.name.split('.').pop()] && errors.collectionHead?.[field.name.split('.').pop()] ? (
                  <Text style={styles.error}>{errors.collectionHead[field.name.split('.').pop()]}</Text>
                ) : null}
              </View>
            ))}

            {/* Password with eye toggle */}
            <View style={styles.field}>
              <View style={styles.passwordWrap}>
                <TextInput
                  value={values.collectionHead.password}
                  onChangeText={handleChange('collectionHead.password')}
                  onBlur={handleBlur('collectionHead.password')}
                  placeholder="Password"
                  secureTextEntry={!showPassword}
                  style={styles.passwordInput}
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                  {showPassword
                    ? <EyeOff size={18} color="#94a3b8" strokeWidth={2} />
                    : <Eye size={18} color="#94a3b8" strokeWidth={2} />
                  }
                </TouchableOpacity>
              </View>
            </View>

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
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 18 },
  field: { marginBottom: 14 },
  label: { color: '#475569', marginBottom: 6, fontWeight: '600', fontSize: 13 },
  input: { height: 50, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#cbd5e1', paddingHorizontal: 16, color: '#0f172a', fontSize: 15 },
  readOnlyInput: { backgroundColor: '#e2e8f0', color: '#334155' },
  passwordWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#cbd5e1', paddingHorizontal: 16, height: 50 },
  passwordInput: { flex: 1, fontSize: 15, color: '#0f172a' },
  eyeBtn: { padding: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  statusText: { color: '#2563eb', fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginTop: 16, marginBottom: 10 },
  button: { backgroundColor: '#2563eb', borderRadius: 14, alignItems: 'center', justifyContent: 'center', height: 50, marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  error: { marginTop: 4, color: '#dc2626', fontSize: 12 },
});

export default AddCenterScreen;
