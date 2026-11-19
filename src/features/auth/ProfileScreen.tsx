import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Phone,
  Shield,
  User,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../core/theme/colors';
import { useTheme } from '../../core/theme/ThemeContext';
import { triggerHaptic } from '../../core/utils/haptics';
import { showErrorToast, showSuccessToast } from '../../core/utils/toast';
import { appStorage } from '../../core/storage/storage';
import { authService, UserProfile } from './authService';

interface ProfileScreenProps {
  onOpenDrawer?: () => void;
  onLogout?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onOpenDrawer,
  onLogout,
}) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Profile data state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);

  // Section 1: Contact details form
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [isSavingContact, setIsSavingContact] = useState<boolean>(false);

  // Section 2: Change password form
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState<boolean>(false);

  // Logout modal state
  const [logoutModalVisible, setLogoutModalVisible] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  // Load profile from storage cache then fetch fresh API
  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      // 1. Initial cached profile from storage
      const cached = await appStorage.getUserProfile();
      if (cached && isMounted) {
        setProfile(cached);
        setEmail(cached.email || '');
        setPhone(cached.phone || '');
      }

      // 2. Fresh fetch from backend
      try {
        const res = await authService.getProfile();
        if (isMounted && res) {
          const fresh = res.data || res.user || res;
          if (fresh) {
            setProfile((prev) => ({ ...prev, ...fresh }));
            if (fresh.email) setEmail(fresh.email);
            if (fresh.phone) setPhone(fresh.phone);
          }
        }
      } catch (err) {
        console.warn('Failed to load fresh profile:', err);
      } finally {
        if (isMounted) setIsLoadingProfile(false);
      }
    };

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  // Display fields
  const userName = profile?.name || 'Admin User';
  const userRole =
    typeof profile?.role === 'string'
      ? profile.role
      : profile?.role?.title || profile?.role?.name || 'Super Admin';
  const initial = userName.trim().charAt(0).toUpperCase() || 'A';
  const userStatus = profile?.status || 'Active';

  // Save Contact Details
  const handleSaveContact = async () => {
    if (!email.trim()) {
      showErrorToast('Validation Error', 'Please enter a valid email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showErrorToast('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (!phone.trim()) {
      showErrorToast('Validation Error', 'Please enter your mobile phone number.');
      return;
    }

    try {
      setIsSavingContact(true);
      triggerHaptic('impactLight');
      const res = await authService.updateProfile({ email, phone });
      triggerHaptic('notificationSuccess');
      showSuccessToast(
        'Profile Updated',
        res?.message || 'Your contact information has been updated successfully.'
      );
      setProfile((prev) => (prev ? { ...prev, email: email.trim(), phone: phone.trim() } : null));
    } catch (err: any) {
      console.warn('Update profile error:', err);
      const errors = err?.response?.data?.errors;
      let msg = err?.response?.data?.message || 'Failed to update contact details.';
      if (errors && typeof errors === 'object') {
        const firstKey = Object.keys(errors)[0];
        if (firstKey && Array.isArray(errors[firstKey])) {
          msg = errors[firstKey][0];
        }
      }
      showErrorToast('Update Failed', msg);
    } finally {
      setIsSavingContact(false);
    }
  };

  // Update Password
  const handleUpdatePassword = async () => {
    if (!currentPassword) {
      showErrorToast('Validation Error', 'Please enter your current password.');
      return;
    }
    if (!newPassword) {
      showErrorToast('Validation Error', 'Please enter a new password.');
      return;
    }
    if (newPassword.length < 6) {
      showErrorToast('Validation Error', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword === currentPassword) {
      showErrorToast(
        'Validation Error',
        'New password must be different from your current password.'
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      showErrorToast('Validation Error', 'New password and confirmation do not match.');
      return;
    }

    try {
      setIsUpdatingPassword(true);
      triggerHaptic('impactLight');
      const res = await authService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });

      triggerHaptic('notificationSuccess');
      showSuccessToast(
        'Password Changed',
        res?.message || 'Your password has been changed successfully!'
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.warn('Change password error:', err);
      const errors = err?.response?.data?.errors;
      let msg = err?.response?.data?.message || 'Failed to change password. Please verify current password.';
      if (errors && typeof errors === 'object') {
        const firstKey = Object.keys(errors)[0];
        if (firstKey && Array.isArray(errors[firstKey])) {
          msg = errors[firstKey][0];
        }
      }
      showErrorToast('Change Failed', msg);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Confirm Logout
  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      triggerHaptic('notificationWarning');
      await authService.logout();
      setLogoutModalVisible(false);
      showSuccessToast('Logged Out', 'You have been successfully signed out.');
      if (onLogout) {
        onLogout();
      }
    } catch (e) {
      setLogoutModalVisible(false);
      if (onLogout) onLogout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const passwordsMatch = !confirmPassword || newPassword === confirmPassword;

  return (
    <KeyboardAvoidingView
      style={[
        styles.screen,
        { backgroundColor: isDark ? '#080D1A' : '#F7F7F5' },
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 80, 100) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Title Bar */}
        <View style={styles.headerBar}>
          <Text
            style={[
              styles.screenTitle,
              { color: isDark ? '#F8FAFC' : '#0F172A' },
            ]}
          >
            Account Profile & Security
          </Text>
          <Text
            style={[
              styles.screenSubtitle,
              { color: isDark ? '#94A3B8' : '#64748B' },
            ]}
          >
            Manage personal credentials, contact info, and security details.
          </Text>
        </View>

        {/* 1. Top Hero Profile Card Matching Screenshot 2 */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: isDark ? '#101726' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
            },
          ]}
        >
          <View style={styles.heroInner}>
            {/* Big Circular Avatar with Initial */}
            <View
              style={[
                styles.avatarCircle,
                {
                  backgroundColor: isDark ? '#0F172A' : '#131C27',
                  borderColor: isDark ? '#334155' : '#1E293B',
                },
              ]}
            >
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>

            {/* Profile Info Block */}
            <View style={styles.heroInfoCol}>
              <View style={styles.nameRoleRow}>
                <Text
                  style={[
                    styles.heroName,
                    { color: isDark ? '#F8FAFC' : '#0F172A' },
                  ]}
                  numberOfLines={1}
                >
                  {userName}
                </Text>
                {/* Role Badge Pill */}
                <View
                  style={[
                    styles.rolePill,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#131C27',
                    },
                  ]}
                >
                  <Text style={styles.rolePillText}>{userRole}</Text>
                </View>
              </View>

              {/* Email & Phone Contact Meta Row */}
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Mail size={12} color={isDark ? '#94A3B8' : '#64748B'} />
                  <Text
                    style={[
                      styles.metaText,
                      { color: isDark ? '#94A3B8' : '#64748B' },
                    ]}
                    numberOfLines={1}
                  >
                    {email || 'admin@example.com'}
                  </Text>
                </View>

                {phone ? (
                  <View style={styles.metaItem}>
                    <Phone size={12} color={isDark ? '#94A3B8' : '#64748B'} />
                    <Text
                      style={[
                        styles.metaText,
                        { color: isDark ? '#94A3B8' : '#64748B' },
                      ]}
                      numberOfLines={1}
                    >
                      {phone}
                    </Text>
                  </View>
                ) : null}

                {/* Status Dot */}
                <View style={styles.metaItem}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>{userStatus}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 2. Section 1: Information (Contact Details) Card */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: isDark ? '#101726' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
            },
          ]}
        >
          {/* Section Header */}
          <View
            style={[
              styles.sectionHeader,
              { borderBottomColor: isDark ? '#1E293B' : '#F1F5F9' },
            ]}
          >
            <View style={styles.sectionHeaderIconBox}>
              <User size={15} color="#0284C7" strokeWidth={2.4} />
            </View>
            <Text
              style={[
                styles.sectionTitle,
                { color: isDark ? '#F8FAFC' : '#0F172A' },
              ]}
            >
              Information
            </Text>
          </View>

          <View style={styles.formBody}>
            {/* Field 1: Full Name (LOCKED) */}
            <View style={styles.fieldGroup}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: isDark ? '#CBD5E1' : '#334155' },
                ]}
              >
                Full Name
              </Text>
              <View
                style={[
                  styles.lockedInputBox,
                  {
                    backgroundColor: isDark ? '#0B111D' : '#F8FAFC',
                    borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  },
                ]}
              >
                <User size={14} color={isDark ? '#64748B' : '#94A3B8'} />
                <Text
                  style={[
                    styles.lockedInputText,
                    { color: isDark ? '#94A3B8' : '#475569' },
                  ]}
                >
                  {userName}
                </Text>
                <Lock size={14} color={isDark ? '#64748B' : '#94A3B8'} />
              </View>
              <Text
                style={[
                  styles.helperText,
                  { color: isDark ? '#64748B' : '#94A3B8' },
                ]}
              >
                Managed by System Administrator (Locked)
              </Text>
            </View>

            {/* Field 2: Assigned Workspace Role (LOCKED) */}
            <View style={styles.fieldGroup}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: isDark ? '#CBD5E1' : '#334155' },
                ]}
              >
                Assigned Workspace Role
              </Text>
              <View
                style={[
                  styles.lockedInputBox,
                  {
                    backgroundColor: isDark ? '#0B111D' : '#F8FAFC',
                    borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  },
                ]}
              >
                <Shield size={14} color={isDark ? '#64748B' : '#94A3B8'} />
                <Text
                  style={[
                    styles.lockedInputText,
                    { color: isDark ? '#94A3B8' : '#475569' },
                  ]}
                >
                  {userRole}
                </Text>
                <Lock size={14} color={isDark ? '#64748B' : '#94A3B8'} />
              </View>
              <Text
                style={[
                  styles.helperText,
                  { color: isDark ? '#64748B' : '#94A3B8' },
                ]}
              >
                Managed by System Administrator (Locked)
              </Text>
            </View>

            {/* Field 3: Email Address (EDITABLE) */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelWithBadgeRow}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: isDark ? '#CBD5E1' : '#334155' },
                  ]}
                >
                  Email Address *
                </Text>
                <View
                  style={[
                    styles.editableBadge,
                    {
                      backgroundColor: isDark
                        ? 'rgba(22, 163, 74, 0.15)'
                        : '#DCFCE7',
                    },
                  ]}
                >
                  <Text style={styles.editableBadgeText}>✏️ Editable</Text>
                </View>
              </View>

              <View
                style={[
                  styles.editableInputBox,
                  {
                    backgroundColor: isDark ? '#162032' : '#FFFFFF',
                    borderColor: isDark ? '#1E293B' : '#CBD5E1',
                  },
                ]}
              >
                <Mail size={14} color={colors.primary} />
                <TextInput
                  style={[
                    styles.inputField,
                    { color: isDark ? '#F8FAFC' : '#0F172A' },
                  ]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="admin@example.com"
                  placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Field 4: Mobile / Phone Number (EDITABLE) */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelWithBadgeRow}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: isDark ? '#CBD5E1' : '#334155' },
                  ]}
                >
                  Mobile / Phone Number *
                </Text>
                <View
                  style={[
                    styles.editableBadge,
                    {
                      backgroundColor: isDark
                        ? 'rgba(22, 163, 74, 0.15)'
                        : '#DCFCE7',
                    },
                  ]}
                >
                  <Text style={styles.editableBadgeText}>✏️ Editable</Text>
                </View>
              </View>

              <View
                style={[
                  styles.editableInputBox,
                  {
                    backgroundColor: isDark ? '#162032' : '#FFFFFF',
                    borderColor: isDark ? '#1E293B' : '#CBD5E1',
                  },
                ]}
              >
                <Phone size={14} color={colors.primary} />
                <TextInput
                  style={[
                    styles.inputField,
                    { color: isDark ? '#F8FAFC' : '#0F172A' },
                  ]}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+91 98000 11112"
                  placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Save Contact Details CTA Button */}
            <TouchableOpacity
              style={[
                styles.saveContactBtn,
                { backgroundColor: colors.primary },
                isSavingContact && styles.btnDisabled,
              ]}
              onPress={handleSaveContact}
              disabled={isSavingContact}
              activeOpacity={0.8}
            >
              {isSavingContact ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Check size={16} color="#FFFFFF" strokeWidth={2.4} />
                  <Text style={styles.saveContactBtnText}>Save Contact Details</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Section 2: Change Password Card */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: isDark ? '#101726' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
            },
          ]}
        >
          {/* Section Header */}
          <View
            style={[
              styles.sectionHeader,
              { borderBottomColor: isDark ? '#1E293B' : '#F1F5F9' },
            ]}
          >
            <View
              style={[
                styles.sectionHeaderIconBox,
                { backgroundColor: isDark ? 'rgba(234, 88, 12, 0.15)' : '#FFEDD5' },
              ]}
            >
              <KeyRound size={15} color="#EA580C" strokeWidth={2.4} />
            </View>
            <Text
              style={[
                styles.sectionTitle,
                { color: isDark ? '#F8FAFC' : '#0F172A' },
              ]}
            >
              Change Password
            </Text>
          </View>

          <View style={styles.formBody}>
            {/* Input 1: Current Password */}
            <View style={styles.fieldGroup}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: isDark ? '#CBD5E1' : '#334155' },
                ]}
              >
                Current Password *
              </Text>
              <View
                style={[
                  styles.editableInputBox,
                  {
                    backgroundColor: isDark ? '#162032' : '#FFFFFF',
                    borderColor: isDark ? '#1E293B' : '#CBD5E1',
                  },
                ]}
              >
                <Lock size={14} color={isDark ? '#94A3B8' : '#64748B'} />
                <TextInput
                  style={[
                    styles.inputField,
                    { color: isDark ? '#F8FAFC' : '#0F172A' },
                  ]}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter your current password"
                  placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                  secureTextEntry={!showCurrentPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {showCurrentPassword ? (
                    <EyeOff size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                  ) : (
                    <Eye size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Input 2: New Password */}
            <View style={styles.fieldGroup}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: isDark ? '#CBD5E1' : '#334155' },
                ]}
              >
                New Password *
              </Text>
              <View
                style={[
                  styles.editableInputBox,
                  {
                    backgroundColor: isDark ? '#162032' : '#FFFFFF',
                    borderColor: isDark ? '#1E293B' : '#CBD5E1',
                  },
                ]}
              >
                <KeyRound size={14} color={isDark ? '#94A3B8' : '#64748B'} />
                <TextInput
                  style={[
                    styles.inputField,
                    { color: isDark ? '#F8FAFC' : '#0F172A' },
                  ]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Create strong new password (min. 6 chars)"
                  placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {showNewPassword ? (
                    <EyeOff size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                  ) : (
                    <Eye size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                  )}
                </TouchableOpacity>
              </View>
              <Text
                style={[
                  styles.helperText,
                  { color: isDark ? '#64748B' : '#94A3B8' },
                ]}
              >
                Minimum 6 characters
              </Text>
            </View>

            {/* Input 3: Confirm New Password */}
            <View style={styles.fieldGroup}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: isDark ? '#CBD5E1' : '#334155' },
                ]}
              >
                Confirm New Password *
              </Text>
              <View
                style={[
                  styles.editableInputBox,
                  {
                    backgroundColor: isDark ? '#162032' : '#FFFFFF',
                    borderColor: !passwordsMatch
                      ? '#DC2626'
                      : isDark
                      ? '#1E293B'
                      : '#CBD5E1',
                  },
                ]}
              >
                <CheckCircle2
                  size={14}
                  color={
                    confirmPassword && passwordsMatch
                      ? '#16A34A'
                      : isDark
                      ? '#94A3B8'
                      : '#64748B'
                  }
                />
                <TextInput
                  style={[
                    styles.inputField,
                    { color: isDark ? '#F8FAFC' : '#0F172A' },
                  ]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-type your new password to verify"
                  placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                  ) : (
                    <Eye size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                  )}
                </TouchableOpacity>
              </View>

              {!passwordsMatch ? (
                <Text style={styles.errorText}>Passwords do not match.</Text>
              ) : null}
            </View>

            {/* Update Password CTA Button */}
            <TouchableOpacity
              style={[
                styles.updatePasswordBtn,
                {
                  backgroundColor: isDark ? '#1E293B' : '#131C27',
                  borderColor: isDark ? '#334155' : '#1E293B',
                },
                isUpdatingPassword && styles.btnDisabled,
              ]}
              onPress={handleUpdatePassword}
              disabled={isUpdatingPassword}
              activeOpacity={0.8}
            >
              {isUpdatingPassword ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <KeyRound size={15} color="#FFFFFF" strokeWidth={2.2} />
                  <Text style={styles.updatePasswordBtnText}>Update Password</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. Bottom Logout Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity
            style={[
              styles.logoutBtn,
              {
                backgroundColor: isDark
                  ? 'rgba(220, 38, 38, 0.12)'
                  : '#FEF2F2',
                borderColor: isDark
                  ? 'rgba(220, 38, 38, 0.35)'
                  : '#FECACA',
              },
            ]}
            onPress={() => {
              triggerHaptic('notificationWarning');
              setLogoutModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <LogOut size={16} color="#DC2626" strokeWidth={2.2} />
            <Text style={styles.logoutBtnText}>Log Out of Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isLoggingOut) setLogoutModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => {
              if (!isLoggingOut) setLogoutModalVisible(false);
            }}
          />

          <View
            style={[
              styles.logoutDialog,
              {
                backgroundColor: isDark ? '#101726' : '#FFFFFF',
                borderColor: isDark ? '#1E293B' : '#E2E8F0',
              },
            ]}
          >
            <View style={styles.logoutDialogHeader}>
              <View style={styles.logoutIconBox}>
                <AlertTriangle size={20} color="#DC2626" strokeWidth={2.4} />
              </View>
              <Text
                style={[
                  styles.logoutDialogTitle,
                  { color: isDark ? '#F8FAFC' : '#0F172A' },
                ]}
              >
                Confirm Logout
              </Text>
            </View>

            <Text
              style={[
                styles.logoutDialogBody,
                { color: isDark ? '#94A3B8' : '#64748B' },
              ]}
            >
              Are you sure you want to log out of your Defence Autolink account?
            </Text>

            <View style={styles.logoutDialogFooter}>
              <TouchableOpacity
                style={[
                  styles.logoutCancelBtn,
                  {
                    backgroundColor: isDark ? '#162032' : '#F1F5F9',
                    borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  },
                ]}
                onPress={() => setLogoutModalVisible(false)}
                disabled={isLoggingOut}
              >
                <Text
                  style={[
                    styles.logoutCancelText,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.logoutConfirmBtn, isLoggingOut && styles.btnDisabled]}
                onPress={handleConfirmLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <LogOut size={15} color="#FFFFFF" strokeWidth={2.2} />
                    <Text style={styles.logoutConfirmText}>Log Out</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 14,
  },
  headerBar: {
    marginBottom: 4,
  },
  screenTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  screenSubtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  heroCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  heroInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  heroInfoCol: {
    flex: 1,
    gap: 4,
  },
  nameRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  heroName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  rolePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  rolePillText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionHeaderIconBox: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  formBody: {
    padding: 16,
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  labelWithBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editableBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  editableBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },
  lockedInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  lockedInputText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  editableInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  inputField: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 11,
    marginTop: 1,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  saveContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 42,
    borderRadius: 8,
    marginTop: 6,
  },
  saveContactBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  updatePasswordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 6,
  },
  updatePasswordBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  logoutContainer: {
    marginTop: 4,
    marginBottom: 16,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
  },
  logoutBtnText: {
    color: '#DC2626',
    fontSize: 13.5,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoutDialog: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  logoutDialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoutIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutDialogTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  logoutDialogBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  logoutDialogFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  logoutCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  logoutCancelText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  logoutConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  logoutConfirmText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
});

