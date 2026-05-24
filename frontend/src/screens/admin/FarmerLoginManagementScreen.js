
import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, FlatList, ActivityIndicator, Alert, Switch, RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Toast from 'react-native-toast-message';
import { ChevronLeft, Key, Users, ShieldCheck, Eye, EyeOff } from 'lucide-react-native';
import { farmerApi, farmerAuthApi } from '../../api/api';
import { colors, radius, spacing, typography, shadows } from '../../theme';

const passwordSchema = Yup.object().shape({
  password: Yup.string()
    .min(4, 'Password must be at least 4 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords do not match')
    .required('Please confirm password')
});

const FarmerLoginManagementScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const token = useSelector((s) => s.auth.token);

  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState(null);
  const [enablingAll, setEnablingAll] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [settingPassword, setSettingPassword] = useState(false);

  const loadFarmers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await farmerApi.getAll(token, {});
      setFarmers(res.data || []);
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Error', text2: e.message });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { loadFarmers(); }, [loadFarmers]));

  const handleSetPassword = async (values, { resetForm }) => {
    setSettingPassword(true);
    try {
      await farmerAuthApi.setPassword({ password: values.password }, token);
      Toast.show({
        type: 'success',
        text1: 'Password Updated',
        text2: 'Common farmer password set successfully for all farmers'
      });
      resetForm();
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Failed', text2: e.message });
    } finally {
      setSettingPassword(false);
    }
  };

  const handleToggleLogin = async (farmer, value) => {
    setTogglingId(farmer._id);
    try {
      await farmerAuthApi.toggleLogin(farmer._id, { loginEnabled: value }, token);
      setFarmers((prev) =>
        prev.map((f) => f._id === farmer._id ? { ...f, loginEnabled: value } : f)
      );
      Toast.show({
        type: 'success',
        text1: value ? 'Login Enabled' : 'Login Disabled',
        text2: `${farmer.fullName} login ${value ? 'enabled' : 'disabled'}`
      });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Error', text2: e.message });
    } finally {
      setTogglingId(null);
    }
  };

  const handleEnableAll = () => {
    Alert.alert(
      'Enable All Farmers',
      'Enable login for ALL farmers? They will use their mobile number as username.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Enable All',
          onPress: async () => {
            setEnablingAll(true);
            try {
              const res = await farmerAuthApi.enableAll(token);
              await loadFarmers();
              Toast.show({
                type: 'success',
                text1: 'All Enabled',
                text2: res.data?.message || 'Login enabled for all farmers'
              });
            } catch (e) {
              Toast.show({ type: 'error', text1: 'Error', text2: e.message });
            } finally {
              setEnablingAll(false);
            }
          }
        }
      ]
    );
  };

  
  const enabledCount = farmers.filter((f) => f.loginEnabled).length;

  const renderFarmer = ({ item }) => (
    <View style={styles.farmerCard}>
      <View style={styles.farmerLeft}>
        <View style={styles.farmerAvatar}>
          <Text style={styles.farmerAvatarText}>
            {item.fullName?.charAt(0)?.toUpperCase() || 'F'}
          </Text>
        </View>
        <View style={styles.farmerInfo}>
          <Text style={styles.farmerName}>{item.fullName}</Text>
          <Text style={styles.farmerMeta}>{item.mobileNumber} · {item.farmerCode}</Text>
          <View style={[
            styles.loginStatusBadge,
            { backgroundColor: item.loginEnabled ? colors.successLight : colors.surfaceMuted }
          ]}>
            <Text style={[
              styles.loginStatusText,
              { color: item.loginEnabled ? colors.success : colors.textMuted }
            ]}>
              {item.loginEnabled ? '✓ Login Active' : '✗ Login Disabled'}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.farmerRight}>
        {togglingId === item._id ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Switch
            value={!!item.loginEnabled}
            onValueChange={(val) => handleToggleLogin(item, val)}
            trackColor={{ false: colors.border, true: colors.primary + '66' }}
            thumbColor={item.loginEnabled ? colors.primary : colors.textMuted}
          />
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color={colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Farmer Login Management</Text>
          <Text style={styles.headerSub}>Set passwords & control access</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadFarmers} tintColor={colors.primary} />}
      >
      
        {/* Set Common Password Card */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Key size={18} color={colors.primary} strokeWidth={2.5} />
            <Text style={styles.cardTitle}>Set Common Farmer Password</Text>
          </View>
          <Text style={styles.cardSubtitle}>
            All farmers will use this same password. Username = their mobile number.
          </Text>

          <Formik
            initialValues={{ password: '', confirmPassword: '' }}
            validationSchema={passwordSchema}
            onSubmit={handleSetPassword}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
              <>
                <Text style={styles.fieldLabel}>New Password *</Text>
                <View style={[
                  styles.inputWrap,
                  touched.password && errors.password && styles.inputError
                ]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter common password (min 4 chars)"
                    value={values.password}
                    onChangeText={handleChange('password')}
                    onBlur={handleBlur('password')}
                    secureTextEntry={!showPassword}
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    {showPassword
                      ? <EyeOff size={18} color={colors.textMuted} strokeWidth={2} />
                      : <Eye size={18} color={colors.textMuted} strokeWidth={2} />
                    }
                  </TouchableOpacity>
                </View>
                {touched.password && errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}

                <Text style={styles.fieldLabel}>Confirm Password *</Text>
                <View style={[
                  styles.inputWrap,
                  touched.confirmPassword && errors.confirmPassword && styles.inputError
                ]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter password"
                    value={values.confirmPassword}
                    onChangeText={handleChange('confirmPassword')}
                    onBlur={handleBlur('confirmPassword')}
                    secureTextEntry={!showConfirm}
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                    {showConfirm
                      ? <EyeOff size={18} color={colors.textMuted} strokeWidth={2} />
                      : <Eye size={18} color={colors.textMuted} strokeWidth={2} />
                    }
                  </TouchableOpacity>
                </View>
                {touched.confirmPassword && errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}

                <TouchableOpacity
                  style={[styles.primaryBtn, settingPassword && styles.btnDisabled]}
                  onPress={handleSubmit}
                  disabled={settingPassword}
                >
                  {settingPassword
                    ? <ActivityIndicator color={colors.white} />
                    : (
                      <>
                        <ShieldCheck size={16} color={colors.white} strokeWidth={2.5} />
                        <Text style={styles.primaryBtnText}>Update Password for All Farmers</Text>
                      </>
                    )
                  }
                </TouchableOpacity>
              </>
            )}
          </Formik>
        </View>

        {/* Enable All Button */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Users size={18} color={colors.success} strokeWidth={2.5} />
            <Text style={styles.cardTitle}>Bulk Enable Login</Text>
          </View>
          <Text style={styles.cardSubtitle}>
            Enable login access for all farmers at once. Make sure you've set the common password first.
          </Text>
          <TouchableOpacity
            style={[styles.successBtn, enablingAll && styles.btnDisabled]}
            onPress={handleEnableAll}
            disabled={enablingAll}
          >
            {enablingAll
              ? <ActivityIndicator color={colors.white} />
              : <Text style={styles.successBtnText}>Enable Login for All Farmers</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Individual Farmer Access — moved to standalone list below cards */}
      </ScrollView>

      {/* Farmer list outside scroll card for cleaner look */}
      <View style={{ flex: 1, paddingHorizontal: spacing.lg }}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search farmer by name, mobile, code..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={colors.textMuted}
        />
        {loading ? (
          <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item._id}
            renderItem={renderFarmer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            ListEmptyComponent={<Text style={styles.emptyText}>No farmers found</Text>}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md, backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.divider, ...shadows.xs
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 11, backgroundColor: colors.primaryXLight,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: typography.h3, fontWeight: '800', color: colors.text },
  headerSub: { fontSize: typography.xs, color: colors.textMuted, fontWeight: '500' },
  content: { padding: spacing.lg, paddingBottom: 40 },
  statsBar: {
    flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.lg, ...shadows.card,
    borderWidth: 1, borderColor: colors.divider
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: typography.h2, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: typography.xs, color: colors.textMuted, fontWeight: '500', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: colors.divider },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg,
    marginBottom: spacing.lg, ...shadows.card, borderWidth: 1, borderColor: colors.divider
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  cardTitle: { fontSize: typography.body, fontWeight: '800', color: colors.text },
  cardSubtitle: { fontSize: typography.xs, color: colors.textMuted, marginBottom: spacing.md, lineHeight: 18 },
  fieldLabel: { fontSize: typography.xs, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: spacing.sm },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surfaceMuted, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md,
    marginBottom: 4
  },
  inputError: { borderColor: colors.danger, backgroundColor: colors.dangerLight },
  input: { flex: 1, fontSize: typography.body, color: colors.text, paddingVertical: spacing.sm },
  eyeBtn: { padding: spacing.xs },
  errorText: { color: colors.danger, fontSize: typography.xs, marginBottom: spacing.xs, fontWeight: '500' },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.md, marginTop: spacing.md, ...shadows.sm
  },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: typography.small },
  successBtn: {
    backgroundColor: colors.success, borderRadius: radius.lg,
    paddingVertical: spacing.md, alignItems: 'center', ...shadows.sm
  },
  successBtnText: { color: colors.white, fontWeight: '700', fontSize: typography.small },
  btnDisabled: { opacity: 0.6 },
  searchInput: {
    backgroundColor: colors.surfaceMuted, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, fontSize: typography.small, color: colors.text,
    marginBottom: spacing.md
  },
  farmerCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider
  },
  farmerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  farmerAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm
  },
  farmerAvatarText: { color: colors.white, fontWeight: '700', fontSize: typography.small },
  farmerInfo: { flex: 1 },
  farmerName: { fontSize: typography.small, fontWeight: '700', color: colors.text },
  farmerMeta: { fontSize: typography.xs, color: colors.textMuted, marginTop: 1 },
  loginStatusBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: radius.full, marginTop: 4
  },
  loginStatusText: { fontSize: 10, fontWeight: '700' },
  farmerRight: { marginLeft: spacing.sm },
  emptyText: { textAlign: 'center', color: colors.textMuted, paddingVertical: spacing.xl }
});

export default FarmerLoginManagementScreen;
