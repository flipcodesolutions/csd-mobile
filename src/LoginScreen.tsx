import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from './colors';
import { DEFAULT_API_URL } from './lib/axios';
import { authApi } from './lib/apiServices';

interface Props {
  onBackToSplash?: () => void;
  onLoginSuccess?: (email: string, user?: any) => void;
}

export const LoginScreen: React.FC<Props> = ({ onBackToSplash, onLoginSuccess }) => {
  // Form State
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Login Submit Handler using centralized authApi
  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const data = await authApi.login({
        email: email.trim(),
        password: password,
      });

      console.log('Login Response:', data);

      if (data && data.status) {
        const user = data.data?.user || { email: email.trim() };
        setSuccessMessage('Login successful!');

        setTimeout(() => {
          onLoginSuccess?.(user?.email || email.trim(), user);
        }, 500);
      } else {
        setErrorMessage(data?.message || 'Login failed.');
      }
    } catch (error: any) {
      console.log('Login Error:', error);

      if (error?.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else if (error?.message) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Unable to connect to server.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header with Logo */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brandTitle}>
            Defence <Text style={styles.brandAccent}>Autolink</Text>
          </Text>
          <Text style={styles.brandSubtitle}>Dealership CRM Portal</Text>
        </View>

        {/* Main Login Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>
          <Text style={styles.cardSubtitle}>
            Enter your credentials to continue
          </Text>

          {/* Error Message Banner */}
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
            </View>
          ) : null}

          {/* Success Message Banner */}
          {successMessage ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>✅ {successMessage}</Text>
            </View>
          ) : null}

          {/* Quick Demo Preset Pills */}
          <View style={{ marginBottom: 12 }}>
            <Text style={{ color: colors.textMuted, fontSize: 11, marginBottom: 6, fontWeight: '600' }}>
              QUICK DEMO FILL (5 ROLES):
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: email === 'admin@example.com' ? colors.primary : '#EAECE4',
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: 6,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: email === 'admin@example.com' ? colors.primaryHover : colors.border,
                }}
                onPress={() => {
                  setEmail('admin@example.com');
                  setPassword('password');
                  setErrorMessage('');
                }}
              >
                <Text style={{ color: email === 'admin@example.com' ? '#fff' : colors.textPrimary, fontSize: 11, fontWeight: '700' }}>👑 Super Admin</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: email === 'neha.sharma@carcrm.com' ? colors.primary : '#EAECE4',
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: 6,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: email === 'neha.sharma@carcrm.com' ? colors.primaryHover : colors.border,
                }}
                onPress={() => {
                  setEmail('neha.sharma@carcrm.com');
                  setPassword('password');
                  setErrorMessage('');
                }}
              >
                <Text style={{ color: email === 'neha.sharma@carcrm.com' ? '#fff' : colors.textPrimary, fontSize: 11, fontWeight: '700' }}>👔 Manager</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: email === 'david.miller@carcrm.com' ? colors.primary : '#EAECE4',
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: 6,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: email === 'david.miller@carcrm.com' ? colors.primaryHover : colors.border,
                }}
                onPress={() => {
                  setEmail('david.miller@carcrm.com');
                  setPassword('password');
                  setErrorMessage('');
                }}
              >
                <Text style={{ color: email === 'david.miller@carcrm.com' ? '#fff' : colors.textPrimary, fontSize: 11, fontWeight: '700' }}>💼 Sales Exec</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: email === 'pooja.iyer@carcrm.com' ? colors.primary : '#EAECE4',
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: 6,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: email === 'pooja.iyer@carcrm.com' ? colors.primaryHover : colors.border,
                }}
                onPress={() => {
                  setEmail('pooja.iyer@carcrm.com');
                  setPassword('password');
                  setErrorMessage('');
                }}
              >
                <Text style={{ color: email === 'pooja.iyer@carcrm.com' ? '#fff' : colors.textPrimary, fontSize: 11, fontWeight: '700' }}>🛎️ Reception</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: email === 'amit.patel@carcrm.com' ? colors.primary : '#EAECE4',
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: 6,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: email === 'amit.patel@carcrm.com' ? colors.primaryHover : colors.border,
                }}
                onPress={() => {
                  setEmail('amit.patel@carcrm.com');
                  setPassword('password');
                  setErrorMessage('');
                }}
              >
                <Text style={{ color: email === 'amit.patel@carcrm.com' ? '#fff' : colors.textPrimary, fontSize: 11, fontWeight: '700' }}>📊 Accountant</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="name@dealership.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrorMessage('');
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isLoading}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <View style={styles.passwordHeader}>
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.showHideText}>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="••••••••••••"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrorMessage('');
              }}
              secureTextEntry={!showPassword}
              editable={!isLoading}
            />
          </View>

          {/* Remember Me & Server Status Row */}
          <View style={styles.rememberRow}>
            <View style={styles.switchWrap}>
              <Switch
                value={rememberMe}
                onValueChange={setRememberMe}
                trackColor={{ false: '#333', true: colors.primary }}
                thumbColor={rememberMe ? colors.orange : '#aaa'}
                disabled={isLoading}
              />
              <Text style={styles.rememberText}>Remember device</Text>
            </View>

            <Text style={styles.apiEndpointHint}>{DEFAULT_API_URL}</Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.textWhite} size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Sign In ➔</Text>
            )}
          </TouchableOpacity>

          {/* Back to Splash Button */}
          {onBackToSplash && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onBackToSplash}
              disabled={isLoading}
            >
              <Text style={styles.backBtnText}>View Splash Screen</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Defence Autolink CRM • Version 2.4.0-PRO
          </Text>
          <Text style={styles.footerSubText}>
            Secure Automotive Dealership Cloud Gateway
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBox: {
    width: 110,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    marginBottom: 12,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  brandAccent: {
    color: colors.orange,
  },
  brandSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 16,
  },
  errorBox: {
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '500',
  },
  successBox: {
    backgroundColor: 'rgba(22, 163, 74, 0.12)',
    borderWidth: 1,
    borderColor: colors.green,
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  successText: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  showHideText: {
    fontSize: 11,
    color: colors.orange,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    color: colors.textPrimary,
    fontSize: 14,
  },
  rememberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 8,
  },
  switchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rememberText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  apiEndpointHint: {
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primaryHover,
    borderRadius: 8,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  backBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  backBtnText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    gap: 2,
  },
  footerText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  footerSubText: {
    fontSize: 10,
    color: colors.textMuted,
  },
});
