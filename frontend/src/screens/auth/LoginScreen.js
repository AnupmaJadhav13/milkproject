import React, { useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Formik } from 'formik';
import Toast from 'react-native-toast-message';
import { loginSchema } from '../../validation/schemas';
import { loginUser } from '../../redux/slices/authSlice';
import LoadingIndicator from '../../components/LoadingIndicator';
import { colors, radius, spacing, typography, shadows } from '../../theme';

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
      {status === 'loading' && <LoadingIndicator message="Signing in..." />}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    padding: spacing.lg
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.card
  },
  heading: {
    fontSize: typography.h2,
    fontWeight: '800',
    color: colors.text
  },
  subheading: {
    marginTop: spacing.xs,
    color: colors.textMuted,
    marginBottom: spacing.lg
  },
  input: {
    height: 50,
    width: '100%',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    color: colors.text,
    backgroundColor: colors.surfaceMuted
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    marginTop: spacing.xs
  },
  buttonText: {
    color: colors.surface,
    fontWeight: '700'
  },
  error: {
    color: colors.danger,
    marginBottom: spacing.xs
  }
});

export default LoginScreen;
