import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Calendar,
  Check,
  ChevronDown,
  Edit3,
  Search,
  X,
} from 'lucide-react-native';
import { colors } from '../../../core/theme/colors';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { showSuccessToast, showErrorToast } from '../../../core/utils/toast';
import { DatePickerModal } from '../../leads/components/DatePickerModal';
import {
  INSURANCE_TYPES,
  REMINDER_DAYS_OPTIONS,
  insuranceService,
} from '../insuranceService';
import { InsuranceRecord } from '../types';

interface EditInsuranceModalProps {
  visible: boolean;
  record: InsuranceRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditInsuranceModal: React.FC<EditInsuranceModalProps> = ({
  visible,
  record,
  onClose,
  onSuccess,
}) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Keyboard avoidance tracking
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardVisible(true);
        if (e?.endCoordinates?.height) {
          setKeyboardHeight(e.endCoordinates.height);
        }
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const toDisplayDate = (isoStr?: string | null): string => {
    if (!isoStr) {
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }
    if (isoStr.includes('-')) {
      const parts = isoStr.split('T')[0].split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoStr;
  };

  const toIsoDate = (displayStr?: string): string => {
    if (!displayStr) return '';
    const parts = displayStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return displayStr;
  };

  const [companyList, setCompanyList] = useState<string[]>([]);
  const [companySearch, setCompanySearch] = useState('');
  const [company, setCompany] = useState('');
  const [showCompanyPicker, setShowCompanyPicker] = useState(false);

  const [policyNumber, setPolicyNumber] = useState('');
  const [insuranceType, setInsuranceType] = useState('Standard');
  const [showTypePicker, setShowTypePicker] = useState(false);

  const [regNo, setRegNo] = useState('');
  const [startDate, setStartDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);

  const [premiumAmount, setPremiumAmount] = useState('');
  const [reminderDays, setReminderDays] = useState(15);
  const [showReminderPicker, setShowReminderPicker] = useState(false);

  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load companies dynamically from backend / masters
  useEffect(() => {
    if (visible) {
      insuranceService.getCompanies().then((res) => {
        if (res && res.length > 0) {
          setCompanyList(res);
          setCompany((curr) => (curr && res.includes(curr) ? curr : (curr || res[0])));
        }
      });
    }
  }, [visible]);

  useEffect(() => {
    if (visible && record) {
      setCompany(record.insurance_company || '');
      setPolicyNumber(record.policy_number || '');
      setInsuranceType(record.insurance_type || 'Standard');
      setRegNo(
        record.vehicle_number ||
          record.registration_number ||
          record.vin_chassis_number ||
          ''
      );
      setStartDate(toDisplayDate(record.policy_start_date || record.delivery_date));
      setExpiryDate(toDisplayDate(record.policy_expiry_date || record.insurance_expire_date));
      setPremiumAmount(record.premium_amount ? String(record.premium_amount) : '');
      setReminderDays(record.reminder_days_before || 15);
      setNotes('');
    }
  }, [visible, record?.id]);

  // Auto-calculated reminder date from expiry date - reminder days
  const getCalculatedReminderDisplay = (): string => {
    if (!expiryDate) return '';
    const isoExp = toIsoDate(expiryDate);
    if (!isoExp) return '';
    const d = new Date(isoExp);
    if (isNaN(d.getTime())) return '';
    d.setDate(d.getDate() - Number(reminderDays || 15));
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const calculatedReminderDate = getCalculatedReminderDisplay();

  const handleSubmit = async () => {
    if (!record) return;

    if (!policyNumber.trim()) {
      showErrorToast('Policy Number is required');
      return;
    }

    triggerHaptic('notificationSuccess');
    setIsSubmitting(true);

    try {
      const isoStart = toIsoDate(startDate);
      const isoExpiry = toIsoDate(expiryDate);
      const isoReminder = toIsoDate(calculatedReminderDate);

      await insuranceService.updateInsurance(record.id, {
        vehicle_number: regNo.trim() || undefined,
        policy_number: policyNumber.trim(),
        insurance_company: company,
        insurance_type: insuranceType,
        policy_start_date: isoStart,
        policy_expiry_date: isoExpiry,
        premium_amount: premiumAmount ? Number(premiumAmount) : undefined,
        reminder_days_before: reminderDays,
        reminder_date: isoReminder,
        notes: notes.trim() || undefined,
      });

      showSuccessToast('Insurance record updated successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Update Insurance Error:', err);
      showErrorToast(
        err?.response?.data?.message || err?.message || 'Failed to update insurance record'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!record) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: isDark ? '#131C27' : '#FFFFFF',
              borderColor: isDark ? 'rgba(217, 221, 204, 0.2)' : colors.border,
              paddingBottom: keyboardVisible ? 10 : Math.max(insets.bottom, 16),
            },
          ]}
        >
          {/* Header - matching SS 2 */}
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: isDark ? '#1E293B' : '#E2E8F0' },
            ]}
          >
            <View style={styles.headerTitleRow}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: isDark ? 'rgba(88, 99, 42, 0.2)' : '#EFF3DF' },
                ]}
              >
                <Edit3 size={18} color={colors.primary} />
              </View>
              <View style={styles.headerTextGroup}>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: isDark ? '#F1F5F9' : '#0F172A' },
                  ]}
                >
                  Edit Insurance Record #{record.id}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.closeBtn}
            >
              <X size={20} color={isDark ? '#94A3B8' : '#64748B'} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={[
              styles.scrollContent,
              keyboardVisible ? { paddingBottom: 60 } : undefined,
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Read-only Context (matching SS 2: Customer Name & Vehicle Model) */}
            <View
              style={[
                styles.readOnlyContextBox,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                },
              ]}
            >
              <View style={styles.readOnlyRow}>
                <View style={styles.readOnlyCol}>
                  <Text style={styles.readOnlyLabel}>Customer Name:</Text>
                  <Text
                    style={[
                      styles.readOnlyValue,
                      { color: isDark ? '#F1F5F9' : '#0F172A' },
                    ]}
                  >
                    {record.customer_name || 'N/A'}
                  </Text>
                </View>
                <View style={styles.readOnlyCol}>
                  <Text style={styles.readOnlyLabel}>Vehicle Model:</Text>
                  <Text
                    style={[
                      styles.readOnlyValue,
                      { color: isDark ? '#F1F5F9' : '#0F172A' },
                    ]}
                  >
                    {record.model_variant || 'Standard'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Row 1: Vehicle Registration Number & Policy Number */}
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text
                  style={[
                    styles.formLabel,
                    { color: isDark ? '#E2E8F0' : '#1E293B' },
                  ]}
                >
                  Vehicle Registration Number
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      borderColor: isDark ? '#334155' : '#CBD5E1',
                      color: isDark ? '#F1F5F9' : '#0F172A',
                    },
                  ]}
                  value={regNo}
                  onChangeText={setRegNo}
                  placeholder="e.g. GJ-01-AB-1234"
                  placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                />
              </View>

              <View style={styles.col}>
                <Text
                  style={[
                    styles.formLabel,
                    { color: isDark ? '#E2E8F0' : '#1E293B' },
                  ]}
                >
                  Policy Number <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      borderColor: isDark ? '#334155' : '#CBD5E1',
                      color: isDark ? '#F1F5F9' : '#0F172A',
                    },
                  ]}
                  value={policyNumber}
                  onChangeText={setPolicyNumber}
                  placeholder="e.g. POL-2026-987654"
                  placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                />
              </View>
            </View>

            {/* Row 2: Insurance Company & Insurance Type */}
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text
                  style={[
                    styles.formLabel,
                    { color: isDark ? '#E2E8F0' : '#1E293B' },
                  ]}
                >
                  Insurance Company
                </Text>
                <TouchableOpacity
                  style={[
                    styles.selectInput,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      borderColor: isDark ? '#334155' : '#CBD5E1',
                    },
                  ]}
                  onPress={() => setShowCompanyPicker(true)}
                >
                  <Text
                    style={[
                      styles.selectValue,
                      { color: isDark ? '#F1F5F9' : '#0F172A' },
                    ]}
                    numberOfLines={1}
                  >
                    {company}
                  </Text>
                  <ChevronDown size={18} color={isDark ? '#94A3B8' : '#64748B'} />
                </TouchableOpacity>
              </View>

              <View style={styles.col}>
                <Text
                  style={[
                    styles.formLabel,
                    { color: isDark ? '#E2E8F0' : '#1E293B' },
                  ]}
                >
                  Insurance Type
                </Text>
                <TouchableOpacity
                  style={[
                    styles.selectInput,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      borderColor: isDark ? '#334155' : '#CBD5E1',
                    },
                  ]}
                  onPress={() => setShowTypePicker(true)}
                >
                  <Text
                    style={[
                      styles.selectValue,
                      { color: isDark ? '#F1F5F9' : '#0F172A' },
                    ]}
                    numberOfLines={1}
                  >
                    {insuranceType}
                  </Text>
                  <ChevronDown size={18} color={isDark ? '#94A3B8' : '#64748B'} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Row 3: Policy Start Date & Policy Expiry Date */}
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text
                  style={[
                    styles.formLabel,
                    { color: isDark ? '#E2E8F0' : '#1E293B' },
                  ]}
                >
                  Policy Start Date
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dateBtn,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      borderColor: isDark ? '#334155' : '#CBD5E1',
                    },
                  ]}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text
                    style={[
                      styles.dateText,
                      { color: isDark ? '#F1F5F9' : '#0F172A' },
                    ]}
                  >
                    {startDate || 'dd/mm/yyyy'}
                  </Text>
                  <Calendar size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                </TouchableOpacity>
              </View>

              <View style={styles.col}>
                <Text
                  style={[
                    styles.formLabel,
                    { color: isDark ? '#E2E8F0' : '#1E293B' },
                  ]}
                >
                  Policy Expiry Date
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dateBtn,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      borderColor: isDark ? '#334155' : '#CBD5E1',
                    },
                  ]}
                  onPress={() => setShowExpiryDatePicker(true)}
                >
                  <Text
                    style={[
                      styles.dateText,
                      { color: isDark ? '#F1F5F9' : '#0F172A' },
                    ]}
                  >
                    {expiryDate || 'dd/mm/yyyy'}
                  </Text>
                  <Calendar size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Row 4: Premium Amount (₹) & Reminder Interval */}
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text
                  style={[
                    styles.formLabel,
                    { color: isDark ? '#E2E8F0' : '#1E293B' },
                  ]}
                >
                  Premium Amount (₹)
                </Text>
                <View
                  style={[
                    styles.currencyInputRow,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      borderColor: isDark ? '#334155' : '#CBD5E1',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.currencyPrefix,
                      { color: isDark ? '#94A3B8' : '#64748B' },
                    ]}
                  >
                    ₹
                  </Text>
                  <TextInput
                    style={[
                      styles.currencyInput,
                      { color: isDark ? '#F1F5F9' : '#0F172A' },
                    ]}
                    placeholder="0"
                    placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                    keyboardType="numeric"
                    value={premiumAmount}
                    onChangeText={setPremiumAmount}
                  />
                </View>
              </View>

              <View style={styles.col}>
                <Text
                  style={[
                    styles.formLabel,
                    { color: isDark ? '#E2E8F0' : '#1E293B' },
                  ]}
                >
                  Reminder Interval
                </Text>
                <TouchableOpacity
                  style={[
                    styles.selectInput,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      borderColor: isDark ? '#334155' : '#CBD5E1',
                    },
                  ]}
                  onPress={() => setShowReminderPicker(true)}
                >
                  <Text
                    style={[
                      styles.selectValue,
                      { color: isDark ? '#F1F5F9' : '#0F172A' },
                    ]}
                    numberOfLines={1}
                  >
                    {REMINDER_DAYS_OPTIONS.find((r) => r.value === reminderDays)?.label ||
                      `${reminderDays} Days Before`}
                  </Text>
                  <ChevronDown size={18} color={isDark ? '#94A3B8' : '#64748B'} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Row 5: Calculated Reminder Date */}
            <View style={styles.formGroup}>
              <Text
                style={[
                  styles.formLabel,
                  { color: isDark ? '#E2E8F0' : '#1E293B' },
                ]}
              >
                Calculated Reminder Date
              </Text>
              <View
                style={[
                  styles.readOnlyInputBox,
                  {
                    backgroundColor: isDark ? '#0F172A' : '#F1F5F9',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dateText,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                >
                  {calculatedReminderDate || '—'}
                </Text>
                <Calendar size={16} color={isDark ? '#64748B' : '#94A3B8'} />
              </View>
            </View>

            {/* Notes / Remarks */}
            <View style={styles.formGroup}>
              <Text
                style={[
                  styles.formLabel,
                  { color: isDark ? '#E2E8F0' : '#1E293B' },
                ]}
              >
                Notes / Remarks
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                    color: isDark ? '#F1F5F9' : '#0F172A',
                  },
                ]}
                placeholder="Enter remarks..."
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </ScrollView>

          {/* Action Buttons - Cancel & Save Changes */}
          <View
            style={[
              styles.modalFooter,
              { borderTopColor: isDark ? '#1E293B' : '#E2E8F0' },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.cancelBtn,
                {
                  borderColor: isDark ? '#475569' : '#CBD5E1',
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                },
              ]}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text
                style={[
                  styles.cancelBtnText,
                  { color: isDark ? '#CBD5E1' : '#475569' },
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitBtn,
                { backgroundColor: colors.primary, opacity: isSubmitting ? 0.8 : 1 },
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Check size={18} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.submitBtnText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Date Pickers */}
      <DatePickerModal
        visible={showStartDatePicker}
        title="Start Date"
        initialDate={toIsoDate(startDate)}
        allowPast={true}
        allowFuture={true}
        onClose={() => setShowStartDatePicker(false)}
        onSelectDate={(d) => {
          setStartDate(toDisplayDate(d));
          setShowStartDatePicker(false);
        }}
      />
      <DatePickerModal
        visible={showExpiryDatePicker}
        title="Expiry Date"
        initialDate={toIsoDate(expiryDate)}
        allowPast={true}
        allowFuture={true}
        onClose={() => setShowExpiryDatePicker(false)}
        onSelectDate={(d) => {
          setExpiryDate(toDisplayDate(d));
          setShowExpiryDatePicker(false);
        }}
      />

      {/* Provider Selector with dynamic search & custom option */}
      <Modal
        visible={showCompanyPicker}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => {
          Keyboard.dismiss();
          setShowCompanyPicker(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.pickerOverlay}
        >
          <TouchableOpacity
            style={styles.overlayBackdrop}
            activeOpacity={1}
            onPress={() => {
              Keyboard.dismiss();
              setShowCompanyPicker(false);
            }}
          />
          <View
            style={[
              styles.pickerContainer,
              { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
              Platform.OS === 'android' && keyboardVisible && {
                marginBottom: Math.max(keyboardHeight, 20),
              },
            ]}
          >
            <View style={styles.pickerHeader}>
              <Text
                style={[
                  styles.pickerTitle,
                  { color: isDark ? '#F1F5F9' : '#0F172A' },
                ]}
              >
                Select Insurance Provider
              </Text>
              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  setShowCompanyPicker(false);
                }}
              >
                <X size={20} color={isDark ? '#94A3B8' : '#64748B'} />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.companySearchRow,
                {
                  backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                },
              ]}
            >
              <Search size={15} color={isDark ? '#94A3B8' : '#64748B'} />
              <TextInput
                style={[
                  styles.companySearchInput,
                  { color: isDark ? '#F1F5F9' : '#0F172A' },
                ]}
                placeholder="Search or enter company..."
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                value={companySearch}
                onChangeText={setCompanySearch}
              />
              {companySearch ? (
                <TouchableOpacity onPress={() => setCompanySearch('')}>
                  <X size={15} color={isDark ? '#94A3B8' : '#64748B'} />
                </TouchableOpacity>
              ) : null}
            </View>

            <ScrollView style={{ maxHeight: 340 }}>
              {companySearch.trim() &&
              !companyList.some(
                (c) => c.toLowerCase() === companySearch.trim().toLowerCase()
              ) ? (
                <TouchableOpacity
                  style={[
                    styles.pickerItem,
                    {
                      backgroundColor: isDark
                        ? 'rgba(88, 99, 42, 0.15)'
                        : '#EFF3DF',
                    },
                  ]}
                  onPress={() => {
                    const customComp = companySearch.trim();
                    setCompany(customComp);
                    setCompanyList((prev) => [customComp, ...prev]);
                    setShowCompanyPicker(false);
                    setCompanySearch('');
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      { color: colors.primary, fontWeight: '700' },
                    ]}
                  >
                    + Use &quot;{companySearch.trim()}&quot;
                  </Text>
                </TouchableOpacity>
              ) : null}

              {companyList
                .filter((item) =>
                  !companySearch.trim() ||
                  item.toLowerCase().includes(companySearch.trim().toLowerCase())
                )
                .map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.pickerItem,
                      company === item && {
                        backgroundColor: isDark
                          ? 'rgba(88, 99, 42, 0.2)'
                          : '#EFF3DF',
                      },
                    ]}
                    onPress={() => {
                      setCompany(item);
                      setShowCompanyPicker(false);
                      setCompanySearch('');
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        { color: isDark ? '#F1F5F9' : '#0F172A' },
                        company === item && {
                          color: colors.primary,
                          fontWeight: '700',
                        },
                      ]}
                    >
                      {item}
                    </Text>
                    {company === item && (
                      <Check size={18} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Type Selector */}
      <Modal
        visible={showTypePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTypePicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowTypePicker(false)}
        >
          <View
            style={[
              styles.pickerContainer,
              { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
            ]}
          >
            <View style={styles.pickerHeader}>
              <Text
                style={[
                  styles.pickerTitle,
                  { color: isDark ? '#F1F5F9' : '#0F172A' },
                ]}
              >
                Select Coverage Type
              </Text>
              <TouchableOpacity onPress={() => setShowTypePicker(false)}>
                <X size={20} color={isDark ? '#94A3B8' : '#64748B'} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 280 }}>
              {INSURANCE_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.pickerItem,
                    insuranceType === t && {
                      backgroundColor: isDark
                        ? 'rgba(88, 99, 42, 0.2)'
                        : '#EFF3DF',
                    },
                  ]}
                  onPress={() => {
                    setInsuranceType(t);
                    setShowTypePicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      { color: isDark ? '#F1F5F9' : '#0F172A' },
                      insuranceType === t && {
                        color: colors.primary,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {t}
                  </Text>
                  {insuranceType === t && (
                    <Check size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Reminder Days Picker */}
      <Modal
        visible={showReminderPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReminderPicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowReminderPicker(false)}
        >
          <View
            style={[
              styles.pickerContainer,
              { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
            ]}
          >
            <View style={styles.pickerHeader}>
              <Text
                style={[
                  styles.pickerTitle,
                  { color: isDark ? '#F1F5F9' : '#0F172A' },
                ]}
              >
                Reminder Notification Window
              </Text>
              <TouchableOpacity onPress={() => setShowReminderPicker(false)}>
                <X size={20} color={isDark ? '#94A3B8' : '#64748B'} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 240 }}>
              {REMINDER_DAYS_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.pickerItem,
                    reminderDays === opt.value && {
                      backgroundColor: isDark
                        ? 'rgba(88, 99, 42, 0.2)'
                        : '#EFF3DF',
                    },
                  ]}
                  onPress={() => {
                    setReminderDays(opt.value);
                    setShowReminderPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      { color: isDark ? '#F1F5F9' : '#0F172A' },
                      reminderDays === opt.value && {
                        color: colors.primary,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {reminderDays === opt.value && (
                    <Check size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTextGroup: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    flexGrow: 1,
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  readOnlyContextBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  readOnlyRow: {
    flexDirection: 'row',
    gap: 12,
  },
  readOnlyCol: {
    flex: 1,
  },
  readOnlyLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  readOnlyValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  formGroup: {
    marginBottom: 13,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 13,
  },
  col: {
    flex: 1,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  required: {
    color: '#DC2626',
    fontWeight: '700',
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 42,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  selectValue: {
    fontSize: 13,
    flex: 1,
  },
  textInput: {
    height: 42,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 42,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  dateText: {
    fontSize: 13,
  },
  currencyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  currencyPrefix: {
    fontSize: 13,
    fontWeight: '700',
    marginRight: 4,
  },
  currencyInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  readOnlyInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 42,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  textArea: {
    minHeight: 72,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  pickerContainer: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 14,
    paddingBottom: 28,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  companySearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  companySearchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  pickerItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
