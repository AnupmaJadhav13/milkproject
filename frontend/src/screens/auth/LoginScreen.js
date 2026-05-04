import React, { useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Formik } from 'formik';
import Toast from 'react-native-toast-message';
import { loginSchema } from '../../validation/schemas';
import { loginUser } from '../../redux/slices/authSlice';
import LoadingIndicator from '../../components/LoadingIndicator';

const LoginScreen = () => {
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.auth);

  useEffect(() => {
    if (error) {
      const errorMessage = typeof error === 'string' ? error : error.message || 'Login failed';
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: errorMessage,
        position: 'top',
        visibilityTime: 4000,
      });
    }
  }, [error]);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.card}>
        <Text style={styles.heading}>Dairy Management Login</Text>
        <Text style={styles.subheading}>Enter your credentials to continue</Text>
        <Formik
          initialValues={{ username: '', password: '' }}
          validationSchema={loginSchema}
          onSubmit={(values) => dispatch(loginUser(values))}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <>
              <TextInput
                value={values.username}
                onChangeText={handleChange('username')}
                onBlur={handleBlur('username')}
                placeholder="Username"
                style={styles.input}
                placeholderTextColor="#94a3b8"
              />
              {touched.username && errors.username ? <Text style={styles.error}>{errors.username}</Text> : null}
              <TextInput
                value={values.password}
                onChangeText={handleChange('password')}
                onBlur={handleBlur('password')}
                placeholder="Password"
                secureTextEntry
                style={styles.input}
                placeholderTextColor="#94a3b8"
              />
              {touched.password && errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}
              <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={status === 'loading'}>
                <Text style={styles.buttonText}>{status === 'loading' ? 'Signing in...' : 'Sign In'}</Text>
              </TouchableOpacity>
            </>
          )}
        </Formik>
      </View>
      {status === 'loading' && <LoadingIndicator />}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    padding: 24
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a'
  },
  subheading: {
    marginTop: 8,
    color: '#475569',
    marginBottom: 24
  },
  input: {
    height: 50,
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginBottom: 12,
    paddingHorizontal: 16,
    color: '#0f172a'
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    marginTop: 8
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700'
  },
  error: {
    color: '#dc2626',
    marginBottom: 8
  }
});

export default LoginScreen;
