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
  Info,
  Search,
  Shield,
  ShieldCheck,
  X,
} from 'lucide-react-native';
import { colors } from '../../../core/theme/colors';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { showSuccessToast, showErrorToast } from '../../../core/utils/toast';
import { DatePickerModal } from '../../leads/components/DatePickerModal';
import {
  INSURANCE_COMPANIES,
  INSURANCE_TYPES,
  REMINDER_DAYS_OPTIONS,
  insuranceService,
} from '../insuranceService';
import { PendingInsuranceDeal } from '../types';

interface AddInsuranceModalProps {
  visible: boolean;
  deal: PendingInsuranceDeal | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddInsuranceModal: React.FC<AddInsuranceModalProps> = ({
  visible,
  deal,
  onClose,
  onSuccess,
}) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Keyboard avoidance tracking
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const getTodayDisplay = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const calculateExpiryFromStart = (startDisplay: string): string => {
    if (!startDisplay) return '';
    const parts = startDisplay.split('/');
    if (parts.length !== 3) return '';
    const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    if (isNaN(d.getTime())) return '';
    d.setFullYear(d.getFullYear() + 1);
    d.setDate(d.getDate() - 1);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const toIsoDate = (displayDate: string): string => {
    if (!displayDate) return '';
    const parts = displayDate.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return displayDate;
  };

  const [companyList, setCompanyList] = useState<string[]>([]);
  const [companySearch, setCompanySearch] = useState('');
  const [company, setCompany] = useState('');
  const [showCompanyPicker, setShowCompanyPicker] = useState(false);

  const [policyNumber, setPolicyNumber] = useState('');
  const [insuranceType, setInsuranceType] = useState('Standard');
  const [showTypePicker, setShowTypePicker] = useState(false);

  const [regChassisNo, setRegChassisNo] = useState('');
  const [startDate, setStartDate] = useState(getTodayDisplay());
  const [expiryDate, setExpiryDate] = useState(() => calculateExpiryFromStart(getTodayDisplay()));
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);

  const [premiumAmount, setPremiumAmount] = useState('');
  const [reminderDays, setReminderDays] = useState(15);
  const [showReminderPicker, setShowReminderPicker] = useState(false);

  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      insuranceService.getCompanies().then((res) => {
        if (res && res.length > 0) {
          setCompanyList(res);
          setCompany((current) => (current && res.includes(current) ? current : res[0]));
        }
      });
    }
  }, [visible]);

  useEffect(() => {
    if (visible && deal) {
      const today = getTodayDisplay();
      setStartDate(today);
      setExpiryDate(calculateExpiryFromStart(today));
      setPolicyNumber('');
      setInsuranceType('Standard');
      setRegChassisNo(deal.registration_number || deal.vin_chassis_number || '');
      setPremiumAmount('');
      setReminderDays(15);
      setNotes(`Insurance added post deal conversion for deal #${deal.deal_number}`);
    }
  }, [visible, deal?.id]);

  const handleStartDateChange = (selectedDate: string) => {
    setStartDate(selectedDate);
    const calculated = calculateExpiryFromStart(selectedDate);
    setExpiryDate(calculated);
  };

  const handleSubmit = async () => {
    if (!deal) return;

    if (!company) {
      showErrorToast('Please select an Insurance Company');
      return;
    }
    if (!policyNumber.trim()) {
      showErrorToast('Please enter Policy Number');
      return;
    }
    if (!startDate) {
      showErrorToast('Please select Policy Start Date');
      return;
    }

    triggerHaptic('notificationSuccess');
    setIsSubmitting(true);

    try {
      const isoStart = toIsoDate(startDate);
      const isoExpiry = toIsoDate(expiryDate);

      // Compute reminder date
      let reminderDateStr: string | undefined = undefined;
      if (isoExpiry) {
        const expD = new Date(isoExpiry);
        expD.setDate(expD.getDate() - reminderDays);
        reminderDateStr = expD.toISOString().split('T')[0];
      }

      await insuranceService.createInsurance({
        deal_id: deal.id,
        customer_name: deal.customer_name,
        customer_phone: deal.customer_phone,
        customer_email: deal.customer_email || null,
        customer_city: deal.customer_city || null,
        model_variant: deal.model_variant,
        color: deal.color || 'Standard',
        insurance_company: company,
        policy_number: policyNumber.trim(),
        insurance_type: insuranceType,
        vehicle_number: regChassisNo.trim() || undefined,
        registration_number: regChassisNo.trim() || undefined,
        vin_chassis_number: deal.vin_chassis_number || undefined,
        engine_number: deal.engine_number || undefined,
        policy_start_date: isoStart,
        policy_expiry_date: isoExpiry,
        reminder_days_before: reminderDays,
        reminder_date: reminderDateStr,
        premium_amount: premiumAmount ? Number(premiumAmount) : undefined,
        notes: notes.trim() || undefined,
      });

      showSuccessToast('Insurance Policy created and linked successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Create Insurance Error:', err);
      showErrorToast(
        err?.response?.data?.message || err?.message || 'Failed to link insurance policy'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!deal) return null;

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
          {/* Header */}
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: isDark ? '#1E293B' : '#E2E8F0' },
            ]}
          >
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <ShieldCheck size={20} color={colors.primary} />
              </View>
              <View style={styles.headerTextGroup}>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: isDark ? '#F1F5F9' : '#0F172A' },
                  ]}
                >
                  Add Insurance Policy
                </Text>
                <Text
                  style={[
                    styles.modalSubtitle,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                >
                  Deal: #{deal.deal_number} • Customer: {deal.customer_name}
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
            {/* Customer Particulars Snapshot (Gray Card) */}
            <View
              style={[
                styles.snapshotCard,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                },
              ]}
            >
              <View style={styles.snapshotRow}>
                <Text
                  style={[
                    styles.snapshotItem,
                    { color: isDark ? '#CBD5E1' : '#334155' },
                  ]}
                >
                  <Text style={styles.snapshotLabel}>Customer: </Text>
                  {deal.customer_name}
                </Text>
                <Text
                  style={[
                    styles.snapshotItem,
                    { color: isDark ? '#CBD5E1' : '#334155' },
                  ]}
                >
                  <Text style={styles.snapshotLabel}>Mobile: </Text>
                  {deal.customer_phone || '—'}
                </Text>
                <Text
                  style={[
                    styles.snapshotItem,
                    { color: isDark ? '#CBD5E1' : '#334155' },
                  ]}
                >
                  <Text style={styles.snapshotLabel}>City: </Text>
                  {deal.customer_city || '—'}
                </Text>
              </View>
              <View style={[styles.snapshotRow, { marginTop: 6 }]}>
                <Text
                  style={[
                    styles.snapshotItem,
                    { color: isDark ? '#CBD5E1' : '#334155' },
                  ]}
                >
                  <Text style={styles.snapshotLabel}>Vehicle: </Text>
                  {deal.model_variant}
                </Text>
                <Text
                  style={[
                    styles.snapshotItem,
                    { color: isDark ? '#CBD5E1' : '#334155' },
                  ]}
                >
                  <Text style={styles.snapshotLabel}>Chassis / Reg: </Text>
                  {deal.vin_chassis_number || deal.registration_number || '—'}
                </Text>
              </View>
            </View>

            {/* Insurance Provider / Company */}
            <View style={styles.formGroup}>
              <Text
                style={[
                  styles.formLabel,
                  { color: isDark ? '#E2E8F0' : '#1E293B' },
                ]}
              >
                Insurance Provider / Company <Text style={styles.required}>*</Text>
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
                  {company || 'Select Insurance Company'}
                </Text>
                <ChevronDown size={18} color={isDark ? '#94A3B8' : '#64748B'} />
              </TouchableOpacity>
            </View>

            {/* Policy Number */}
            <View style={styles.formGroup}>
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
                placeholder="e.g. POL-2026-987654"
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                value={policyNumber}
                onChangeText={setPolicyNumber}
              />
            </View>

            {/* Insurance Plan / Type */}
            <View style={styles.formGroup}>
              <Text
                style={[
                  styles.formLabel,
                  { color: isDark ? '#E2E8F0' : '#1E293B' },
                ]}
              >
                Insurance Plan / Type
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
                >
                  {insuranceType}
                </Text>
                <ChevronDown size={18} color={isDark ? '#94A3B8' : '#64748B'} />
              </TouchableOpacity>
            </View>

            {/* Vehicle Reg / Chassis No */}
            <View style={styles.formGroup}>
              <Text
                style={[
                  styles.formLabel,
                  { color: isDark ? '#E2E8F0' : '#1E293B' },
                ]}
              >
                Vehicle Reg / Chassis No
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
                placeholder="e.g. GJ01AB1234 or Chassis"
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                value={regChassisNo}
                onChangeText={setRegChassisNo}
              />
            </View>

            {/* Policy Dates: Start & Expiry */}
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text
                  style={[
                    styles.formLabel,
                    { color: isDark ? '#E2E8F0' : '#1E293B' },
                  ]}
                >
                  Policy Start Date <Text style={styles.required}>*</Text>
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
                    {startDate}
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
                  Policy Expiry Date <Text style={styles.required}>*</Text>
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
                    {expiryDate}
                  </Text>
                  <Calendar size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Premium Amount (₹) */}
            <View style={styles.formGroup}>
              <Text
                style={[
                  styles.formLabel,
                  { color: isDark ? '#E2E8F0' : '#1E293B' },
                ]}
              >
                Premium Amount (₹)
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
                placeholder="e.g. 28500"
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                keyboardType="numeric"
                value={premiumAmount}
                onChangeText={setPremiumAmount}
              />
            </View>

            {/* Reminder Notification */}
            <View style={styles.formGroup}>
              <Text
                style={[
                  styles.formLabel,
                  { color: isDark ? '#E2E8F0' : '#1E293B' },
                ]}
              >
                Reminder Notification (Days Before)
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
                >
                  {REMINDER_DAYS_OPTIONS.find((r) => r.value === reminderDays)?.label ||
                    '15 Days Before (Default)'}
                </Text>
                <ChevronDown size={18} color={isDark ? '#94A3B8' : '#64748B'} />
              </TouchableOpacity>
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
                placeholder="Enter any notes or policy remarks..."
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </ScrollView>

          {/* Action Buttons */}
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
                  <Text style={styles.submitBtnText}>Save & Link Insurance</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Start Date Picker */}
      <DatePickerModal
        visible={showStartDatePicker}
        title="Policy Start Date"
        initialDate={startDate}
        allowPast={true}
        allowFuture={true}
        onClose={() => setShowStartDatePicker(false)}
        onSelectDate={(d) => {
          handleStartDateChange(d);
          setShowStartDatePicker(false);
        }}
      />

      {/* Expiry Date Picker */}
      <DatePickerModal
        visible={showExpiryDatePicker}
        title="Policy Expiry Date"
        initialDate={expiryDate}
        allowPast={true}
        allowFuture={true}
        onClose={() => setShowExpiryDatePicker(false)}
        onSelectDate={(d) => {
          setExpiryDate(d);
          setShowExpiryDatePicker(false);
        }}
      />

      {/* Company Selection Modal */}
      <Modal
        visible={showCompanyPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCompanyPicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowCompanyPicker(false)}
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
                Select Insurance Provider
              </Text>
              <TouchableOpacity onPress={() => setShowCompanyPicker(false)}>
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
        </TouchableOpacity>
      </Modal>

      {/* Type Selection Modal */}
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
                Select Insurance Plan / Type
              </Text>
              <TouchableOpacity onPress={() => setShowTypePicker(false)}>
                <X size={20} color={isDark ? '#94A3B8' : '#64748B'} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 260 }}>
              {INSURANCE_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.pickerItem,
                    insuranceType === t && {
                      backgroundColor: isDark ? 'rgba(88, 99, 42, 0.2)' : '#EFF3DF',
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
                      insuranceType === t && { color: colors.primary, fontWeight: '700' },
                    ]}
                  >
                    {t}
                  </Text>
                  {insuranceType === t && <Check size={18} color={colors.primary} />}
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
                      backgroundColor: isDark ? 'rgba(88, 99, 42, 0.2)' : '#EFF3DF',
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
                      reminderDays === opt.value && { color: colors.primary, fontWeight: '700' },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {reminderDays === opt.value && <Check size={18} color={colors.primary} />}
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
    backgroundColor: 'rgba(88, 99, 42, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTextGroup: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
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
  snapshotCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  snapshotRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  snapshotItem: {
    fontSize: 12,
  },
  snapshotLabel: {
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
    fontSize: 13,
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
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  selectValue: {
    fontSize: 14,
    flex: 1,
  },
  textInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  dateText: {
    fontSize: 14,
  },
  textArea: {
    minHeight: 76,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
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
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    height: 42,
    borderRadius: 8,
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
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
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
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

