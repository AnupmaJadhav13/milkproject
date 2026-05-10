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
      <View style={styles.content}>
        {/* Logo & Brand */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoIconText}>🥛</Text>
          </View>
          <Text style={styles.brandTitle}>Sarvasvaa Milk</Text>
        </View>

        {/* Login Card */}
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
                {/* Username Field */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Username</Text>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputIcon}>👤</Text>
                    <TextInput
                      value={values.username}
                      onChangeText={handleChange('username')}
                      onBlur={handleBlur('username')}
                      placeholder="Enter your username"
                      style={styles.input}
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="none"
                    />
                  </View>
                  {touched.username && errors.username ? (
                    <Text style={styles.error}>{errors.username}</Text>
                  ) : null}
                </View>

                {/* Password Field */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputIcon}>🔒</Text>
                    <TextInput
                      value={values.password}
                      onChangeText={handleChange('password')}
                      onBlur={handleBlur('password')}
                      placeholder="Enter your password"
                      secureTextEntry
                      style={styles.input}
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                  {touched.password && errors.password ? (
                    <Text style={styles.error}>{errors.password}</Text>
                  ) : null}
                </View>

                {/* Forgot Password Link */}
                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                {/* Sign In Button */}
                <TouchableOpacity 
                  style={styles.button} 
                  onPress={handleSubmit} 
                  disabled={status === 'loading'}
                >
                  <Text style={styles.buttonText}>
                    {status === 'loading' ? 'Signing in...' : 'Sign In'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </Formik>
        </View>

        {/* Support Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Need help? </Text>
          <TouchableOpacity>
            <Text style={styles.footerLink}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </View>

      {status === 'loading' && <LoadingIndicator message="Signing in..." />}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl
  },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.card
  },
  logoIconText: {
    fontSize: 32
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadows.card
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center'
  },
  subheading: {
    marginTop: spacing.xs,
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    textAlign: 'center'
  },
  inputGroup: {
    marginBottom: spacing.md
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md
  },
  inputIcon: {
    fontSize: 18,
    marginRight: spacing.sm
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 15,
    color: colors.text
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    marginTop: spacing.xs
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.md
  },
  forgotPasswordText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600'
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    ...shadows.small
  },
  buttonText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 16
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl
  },
  footerText: {
    fontSize: 14,
    color: colors.textMuted
  },
  footerLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600'
  }
});

export default LoginScreen;
