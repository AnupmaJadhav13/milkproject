import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Formik } from 'formik';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { updateFoodRecord } from '../../redux/slices/foodSlice';
import { foodSchema } from '../../validation/schemas';
import LoadingIndicator from '../../components/LoadingIndicator';

const EditFoodRecordScreen = ({ route, navigation }) => {
  const { record } = route.params || {};
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const status = useSelector((state) => state.food.status);

  if (!record) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No food record selected.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Edit Food Record</Text>
      <Formik
        initialValues={{
          farmerId: record.farmerId?._id || record.farmerId,
          animalType: record.animalType,
          foodType: record.foodType,
          brandName: record.brandName || '',
          quantity: record.quantity.toString(),
          unit: record.unit,
          rate: record.rate.toString(),
          paymentStatus: record.paymentStatus,
          notes: record.notes || '',
          date: new Date(record.date),
          showDatePicker: false
        }}
        validationSchema={foodSchema}
        onSubmit={async (values) => {
          try {
            const payload = {
              ...values,
              quantity: Number(values.quantity),
              rate: Number(values.rate),
              date: values.date.toISOString()
            };
            await dispatch(updateFoodRecord({ id: record._id, data: payload, token })).unwrap();
            Alert.alert('Success', 'Food record updated successfully');
            navigation.goBack();
          } catch (error) {
            Alert.alert('Error', error);
          }
        }}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Farmer</Text>
              <Text style={styles.readonly}>{record.farmerId?.fullName || record.farmerId}</Text>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Animal Type</Text>
              <View style={styles.pickerContainer}>
                <Picker selectedValue={values.animalType} onValueChange={(value) => setFieldValue('animalType', value)}>
                  <Picker.Item label="Cow" value="Cow" />
                  <Picker.Item label="Buffalo" value="Buffalo" />
                </Picker>
              </View>
              {touched.animalType && errors.animalType && <Text style={styles.errorText}>{errors.animalType}</Text>}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Food Type</Text>
              <View style={styles.pickerContainer}>
                <Picker selectedValue={values.foodType} onValueChange={(value) => setFieldValue('foodType', value)}>
                  <Picker.Item label="Cattle Feed" value="Cattle Feed" />
                  <Picker.Item label="Buffalo Feed" value="Buffalo Feed" />
                  <Picker.Item label="Mineral Mix" value="Mineral Mix" />
                  <Picker.Item label="Dry Fodder" value="Dry Fodder" />
                  <Picker.Item label="Green Fodder" value="Green Fodder" />
                  <Picker.Item label="Protein Mix" value="Protein Mix" />
                  <Picker.Item label="Other" value="Other" />
                </Picker>
              </View>
              {touched.foodType && errors.foodType && <Text style={styles.errorText}>{errors.foodType}</Text>}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={values.quantity}
                onChangeText={handleChange('quantity')}
                onBlur={handleBlur('quantity')}
              />
              {touched.quantity && errors.quantity && <Text style={styles.errorText}>{errors.quantity}</Text>}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Unit</Text>
              <View style={styles.pickerContainer}>
                <Picker selectedValue={values.unit} onValueChange={(value) => setFieldValue('unit', value)}>
                  <Picker.Item label="Bag" value="Bag" />
                  <Picker.Item label="KG" value="KG" />
                  <Picker.Item label="Packet" value="Packet" />
                  <Picker.Item label="Liter" value="Liter" />
                </Picker>
              </View>
              {touched.unit && errors.unit && <Text style={styles.errorText}>{errors.unit}</Text>}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Rate Per Unit</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={values.rate}
                onChangeText={handleChange('rate')}
                onBlur={handleBlur('rate')}
              />
              {touched.rate && errors.rate && <Text style={styles.errorText}>{errors.rate}</Text>}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Total Amount</Text>
              <Text style={styles.totalText}>₹{(Number(values.quantity) * Number(values.rate)).toFixed(2)}</Text>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => setFieldValue('showDatePicker', true)}>
                <Text style={styles.dateText}>{values.date.toDateString()}</Text>
              </TouchableOpacity>
              {values.showDatePicker && (
                <DateTimePicker
                  value={values.date}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setFieldValue('showDatePicker', false);
                    if (date) setFieldValue('date', date);
                  }}
                />
              )}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Payment Status</Text>
              <View style={styles.pickerContainer}>
                <Picker selectedValue={values.paymentStatus} onValueChange={(value) => setFieldValue('paymentStatus', value)}>
                  <Picker.Item label="Pending" value="Pending" />
                  <Picker.Item label="Paid" value="Paid" />
                </Picker>
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLines={3}
                value={values.notes}
                onChangeText={handleChange('notes')}
                onBlur={handleBlur('notes')}
              />
            </View>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={status === 'loading'}>
              {status === 'loading' ? <LoadingIndicator /> : <Text style={styles.submitButtonText}>Save Changes</Text>}
            </TouchableOpacity>
          </>
        )}
      </Formik>
    </ScrollView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  content: {
    padding: 20
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 20,
    color: '#0f172a'
  },
  inputGroup: {
    marginBottom: 16
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 12,
    fontSize: 16
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top'
  },
  readonly: {
    fontSize: 16,
    color: '#0f172a'
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff'
  },
  totalText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#15803d'
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff'
  },
  dateText: {
    fontSize: 16,
    color: '#0f172a'
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: '#2563eb',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center'
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  },
  errorText: {
    color: '#dc2626',
    marginTop: 8,
    fontSize: 14
  }
};

export default EditFoodRecordScreen;