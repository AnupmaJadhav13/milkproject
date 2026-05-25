import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, StatusBar, Image } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Formik } from 'formik';
import Toast from 'react-native-toast-message';
import { Eye, EyeOff } from 'lucide-react-native';
import { loginSchema } from '../../validation/schemas';
import { loginUser } from '../../redux/slices/authSlice';
import LoadingIndicator from '../../components/LoadingIndicator';
import { colors, radius, spacing, typography, shadows } from '../../theme';

const LoginScreen = () => {
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (error) {
      const errorMessage = typeof error === 'string' ? error : error.message || 'Login failed';
      Toast.show({ type: 'error', text1: 'Login Failed', text2: errorMessage, position: 'top', visibilityTime: 4000 });
    }
  }, [error]);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <View style={styles.content}>

        {/* Brand Header */}
        <View style={styles.brandSection}>
          <Image 
            source={require('../../../assets/sarvaalogo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>Sarvasvaa Milk</Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSubtitle}>Sign in to your account</Text>

          <Formik
            initialValues={{ username: '', password: '' }}
            validationSchema={loginSchema}
            onSubmit={(values) => dispatch(loginUser(values))}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
              <>
                {/* Username */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Username</Text>
                  <View style={[styles.inputWrap, touched.username && errors.username && styles.inputError]}>
                    <View style={styles.inputIcon}>
                      <Text style={styles.inputIconText}>@</Text>
                    </View>
                    <TextInput
                      value={values.username}
                      onChangeText={handleChange('username')}
                      onBlur={handleBlur('username')}
                      placeholder="Username or mobile number"
                      style={styles.input}
                      placeholderTextColor={colors.textDisabled}
                      autoCapitalize="none"
                      keyboardType="default"
                    />
                  </View>
                  {touched.username && errors.username ? (
                    <Text style={styles.errorText}>{errors.username}</Text>
                  ) : null}
                </View>

                {/* Password */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={[styles.inputWrap, touched.password && errors.password && styles.inputError]}>
                    <View style={styles.inputIcon}>
                      <Text style={styles.inputIconText}>*</Text>
                    </View>
                    <TextInput
                      value={values.password}
                      onChangeText={handleChange('password')}
                      onBlur={handleBlur('password')}
                      placeholder="Enter your password"
                      secureTextEntry={!showPassword}
                      style={styles.input}
                      placeholderTextColor={colors.textDisabled}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                      {showPassword
                        ? <EyeOff size={18} color={colors.textMuted} strokeWidth={2} />
                        : <Eye size={18} color={colors.textMuted} strokeWidth={2} />
                      }
                    </TouchableOpacity>
                  </View>
                  {touched.password && errors.password ? (
                    <Text style={styles.errorText}>{errors.password}</Text>
                  ) : null}
                </View>

                <TouchableOpacity
                  style={[styles.signInBtn, status === 'loading' && styles.signInBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={status === 'loading'}
                >
                  <Text style={styles.signInBtnText}>
                    {status === 'loading' ? 'Signing in...' : 'Sign In'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </Formik>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Farmer? Use your mobile number</Text>
        </View>
      </View>

      {status === 'loading' && <LoadingIndicator message="Signing in..." />}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: spacing.md,
  },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  logoSymbol: {
    fontSize: 32,
    color: colors.white,
  },
  brandName: {
    fontSize: typography.h1,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: typography.small,
    color: colors.textMuted,
    marginTop: 4,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  cardTitle: {
    fontSize: typography.h2,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: typography.small,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: spacing.lg,
    fontWeight: '400',
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.small,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
    letterSpacing: 0.2,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    height: 52,
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerLight,
  },
  inputIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primaryXLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  inputIconText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  input: {
    flex: 1,
    fontSize: typography.body,
    color: colors.text,
    height: 52,
  },
  eyeBtn: {
    padding: 4,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.xs,
    marginTop: spacing.xxs,
    fontWeight: '500',
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
    marginTop: -spacing.xs,
  },
  forgotText: {
    fontSize: typography.small,
    color: colors.primary,
    fontWeight: '600',
  },
  signInBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  signInBtnDisabled: {
    opacity: 0.65,
  },
  signInBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: typography.body,
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    fontSize: typography.small,
    color: colors.textMuted,
  },
  footerLink: {
    fontSize: typography.small,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default LoginScreen;