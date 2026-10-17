import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Calendar,
  Check,
  CreditCard,
  FileText,
  Shield,
  ShieldCheck,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { StartAlignedInput } from '../../../shared';
import { CustomerLead } from '../types';
import { ConvertLeadDealPayload } from '../../deals/dealService';

export const DEAL_STAGES = ['Booked', 'Sanctioned', 'Delivered', 'Lost'] as const;
export const PAYMENT_MODES = ['upi', 'neft_rtgs', 'cheque', 'cash'] as const;
export const PAYMENT_TYPES = ['token_advance', 'down_payment', 'part_payment'] as const;
export const INSURANCE_TYPES = ['Comprehensive', 'Zero Depreciation', 'Third Party'] as const;

export const INSURANCE_COMPANIES = [
  'National Insurance',
  'HDFC ERGO',
  'ICICI Lombard',
  'New India Assurance',
  'Tata AIG',
  'SBI General',
  'Bajaj Allianz',
  'Other',
] as const;

interface ConvertToDealModalProps {
  visible: boolean;
  lead: CustomerLead | null;
  onClose: () => void;
  onSubmit: (dealData: ConvertLeadDealPayload) => Promise<void>;
}

export const ConvertToDealModal: React.FC<ConvertToDealModalProps> = ({
  visible,
  lead,
  onClose,
  onSubmit,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Deal Header & General
  const [dealTitle, setDealTitle] = useState('');
  const [dealStage, setDealStage] = useState<string>('Booked');
  const [color, setColor] = useState('Standard');
  const [vinChassis, setVinChassis] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');

  // Financials
  const [totalAmount, setTotalAmount] = useState('1250000');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [advanceAmount, setAdvanceAmount] = useState('50000');

  // Payment Receipt
  const [paymentMode, setPaymentMode] = useState<string>('upi');
  const [paymentType, setPaymentType] = useState<string>('token_advance');
  const [transactionRef, setTransactionRef] = useState('');
  const [bankName, setBankName] = useState('');

  // Insurance Policy (All nullable / completely optional per explicit instruction)
  const [hasInsurance, setHasInsurance] = useState(false);
  const [insCompany, setInsCompany] = useState('');
  const [insPolicyNumber, setInsPolicyNumber] = useState('');
  const [insType, setInsType] = useState<string>('Comprehensive');
  const [insPremium, setInsPremium] = useState('');
  const [insIdv, setInsIdv] = useState('');
  const [insStartDate, setInsStartDate] = useState('');
  const [insExpiryDate, setInsExpiryDate] = useState('');
  const [insNotes, setInsNotes] = useState('');

  // Notes
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible && lead) {
      setDealTitle(`CSD-${lead.id}-${lead.name.replace(/\s+/g, '').toUpperCase()}`);
      const rawBudget = typeof lead.budget === 'number' ? lead.budget : 1250000;
      setTotalAmount(rawBudget.toString());
      setDiscountAmount('0');
      setAdvanceAmount('50000');
      setDealStage('Booked');
      setColor('Standard');
      setVinChassis('');

      const today = new Date();
      const defDelivery = new Date(today.getTime() + 86400000 * 15)
        .toISOString()
        .split('T')[0];
      setDeliveryDate(defDelivery);

      setPaymentMode('upi');
      setPaymentType('token_advance');
      setTransactionRef('');
      setBankName('');

      // Reset Insurance State (all optional / nullable)
      setHasInsurance(false);
      setInsCompany('National Insurance');
      setInsPolicyNumber('');
      setInsType('Comprehensive');
      setInsPremium('');
      setInsIdv('');
      const todayStr = today.toISOString().split('T')[0];
      setInsStartDate(todayStr);
      const nextYear = new Date(today.getTime() + 86400000 * 365)
        .toISOString()
        .split('T')[0];
      setInsExpiryDate(nextYear);
      setInsNotes('');

      setNotes(`Converted from Lead #${lead.id} on ${todayStr}.`);
    }
  }, [visible, lead]);

  const parsedTotal = parseFloat(totalAmount) || 0;
  const parsedDiscount = parseFloat(discountAmount) || 0;
  const parsedAdvance = parseFloat(advanceAmount) || 0;
  const balanceAmount = Math.max(0, parsedTotal - parsedDiscount - parsedAdvance);

  const handleSubmit = async () => {
    if (!lead) return;
    if (!dealTitle.trim()) {
      Alert.alert('Required Field', 'Please enter a deal title or sanction number.');
      return;
    }
    if (parsedTotal <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid deal amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      triggerHaptic('impactMedium');

      // Build payload with optional / nullable insurance details
      const payload: ConvertLeadDealPayload = {
        lead_id: lead.id,
        deal_title: dealTitle.trim(),
        deal_stage: dealStage,
        total_amount: parsedTotal,
        discount_amount: parsedDiscount > 0 ? parsedDiscount : undefined,
        advance_amount: parsedAdvance,
        balance_amount: balanceAmount,
        color: color.trim() || undefined,
        vin_chassis_number: vinChassis.trim() || undefined,
        expected_delivery_date: deliveryDate || undefined,
        initial_payment:
          parsedAdvance > 0
            ? {
                amount: parsedAdvance,
                payment_type: paymentType,
                payment_mode: paymentMode,
                transaction_reference: transactionRef.trim() || undefined,
                bank_name: bankName.trim() || undefined,
              }
            : undefined,
        has_insurance: hasInsurance ? 'Yes' : 'No',
        // All insurance fields are strictly optional / nullable
        insurance: hasInsurance
          ? {
              company: insCompany.trim() || undefined,
              policy_number: insPolicyNumber.trim() || undefined,
              insurance_type: insType || undefined,
              premium_amount: parseFloat(insPremium) || undefined,
              idv: parseFloat(insIdv) || undefined,
              start_date: insStartDate.trim() || undefined,
              expiry_date: insExpiryDate.trim() || undefined,
              notes: insNotes.trim() || undefined,
            }
          : undefined,
        notes: notes.trim() || undefined,
      };

      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      Alert.alert('Deal Conversion Error', err?.message || 'Failed to convert lead to deal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible && !!lead}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        {lead && (
          <View
            style={[
              styles.sheetContainer,
              {
                backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                borderColor: isDark ? '#1E293B' : '#E2E8F0',
              },
            ]}
          >
            {/* Grab Handle */}
            <View style={styles.grabHandleRow}>
              <View
                style={[
                  styles.grabHandle,
                  { backgroundColor: isDark ? '#334155' : '#CBD5E1' },
                ]}
              />
            </View>

            {/* Sheet Header */}
            <View
              style={[
                styles.sheetHeader,
                { borderBottomColor: isDark ? '#1E293B' : '#F1F5F9' },
              ]}
            >
              <View style={styles.headerLeft}>
                <View
                  style={[
                    styles.logoBadge,
                    {
                      backgroundColor: isDark ? '#101726' : '#F8FAFC',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                >
                  <Image
                    source={require('../../../../assets/logo.png')}
                    style={styles.logoImg}
                    resizeMode="contain"
                  />
                </View>
                <View>
                  <View style={styles.headerTitleRow}>
                    <Text
                      style={[
                        styles.sheetTitle,
                        { color: colors.textPrimary },
                      ]}
                    >
                      Convert Lead to Deal
                    </Text>
                    <View
                      style={[
                        styles.tagPill,
                        {
                          backgroundColor: isDark
                            ? 'rgba(16, 185, 129, 0.15)'
                            : '#ECFDF5',
                          borderColor: isDark
                            ? 'rgba(16, 185, 129, 0.35)'
                            : '#A7F3D0',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tagPillText,
                          { color: isDark ? '#10B981' : '#059669' },
                        ]}
                      >
                        DEAL FLOW
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.sheetSub,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Defence Autolink • Official CSD Gateway
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.closeBtn,
                  {
                    backgroundColor: isDark ? '#162030' : '#F1F5F9',
                    borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  },
                ]}
                onPress={() => {
                  triggerHaptic('impactLight');
                  onClose();
                }}
                hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                activeOpacity={0.7}
              >
                <Text style={[styles.closeIcon, { color: colors.textPrimary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Form Scroll Content */}
            <ScrollView
              style={styles.formScroll}
              contentContainerStyle={styles.formContent}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
            >
              {/* 1. Customer & Vehicle Summary Card */}
              <View
                style={[
                  styles.summaryCard,
                  {
                    backgroundColor: isDark ? '#101726' : '#F8FAFC',
                    borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  },
                ]}
              >
                <View style={styles.summaryTop}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.custRow}>
                      <Text
                        style={[
                          styles.custName,
                          { color: colors.textPrimary },
                        ]}
                        numberOfLines={1}
                      >
                        {lead.name}
                      </Text>
                      <View
                        style={[
                          styles.verifiedBadge,
                          {
                            backgroundColor: isDark
                              ? 'rgba(16, 185, 129, 0.15)'
                              : '#ECFDF5',
                            borderColor: isDark
                              ? 'rgba(16, 185, 129, 0.35)'
                              : '#A7F3D0',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.verifiedText,
                            { color: isDark ? '#10B981' : '#059669' },
                          ]}
                        >
                          CSD Verified
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.custContact,
                        { color: colors.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      📞 {lead.phone} • {lead.city || 'Station N/A'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.segPill,
                      {
                        backgroundColor: isDark ? '#162030' : '#FFFFFF',
                        borderColor: isDark ? '#1E293B' : '#E2E8F0',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segText,
                        { color: colors.textPrimary },
                      ]}
                    >
                      {lead.vehicle_segment === '2 Wheeler' ? '2W' : '4W'}
                    </Text>
                  </View>
                </View>

                {/* Vehicle Sub-line */}
                <View
                  style={[
                    styles.vehicleLine,
                    { borderTopColor: isDark ? '#1E293B' : '#E2E8F0' },
                  ]}
                >
                  <Text style={[styles.vehicleBrand, { color: colors.gold }]}>
                    {lead.brand_name?.toUpperCase() || 'MARUTI SUZUKI'}
                  </Text>
                  <Text
                    style={[
                      styles.vehicleModel,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {lead.model_variant || `${lead.model_name || 'Vehicle'}`}
                  </Text>
                </View>
              </View>

              {/* 2. Deal Title / Sanction Number */}
              <View style={styles.fieldGroup}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  DEAL TITLE / SANCTION NUMBER <Text style={styles.reqStar}>*</Text>
                </Text>
                <StartAlignedInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#101726' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#CBD5E1',
                      color: colors.textPrimary,
                    },
                  ]}
                  value={dealTitle}
                  onChangeText={setDealTitle}
                  placeholder="e.g. CSD-SANCTION-2026-0041"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {/* 3. Initial Deal Stage */}
              <View style={styles.fieldGroup}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  INITIAL DEAL STAGE <Text style={styles.reqStar}>*</Text>
                </Text>
                <View style={styles.chipsRow}>
                  {DEAL_STAGES.map((st) => {
                    const isActive = dealStage === st;
                    return (
                      <TouchableOpacity
                        key={st}
                        style={[
                          styles.chipOption,
                          {
                            backgroundColor: isActive
                              ? colors.primary
                              : isDark
                              ? '#101726'
                              : '#F8FAFC',
                            borderColor: isActive
                              ? colors.primaryDark
                              : isDark
                              ? '#1E293B'
                              : '#E2E8F0',
                          },
                        ]}
                        onPress={() => {
                          triggerHaptic('selection');
                          setDealStage(st);
                        }}
                        activeOpacity={0.7}
                      >
                        {isActive && (
                          <Check size={12} color="#FFFFFF" strokeWidth={2.6} style={{ marginRight: 4 }} />
                        )}
                        <Text
                          style={[
                            styles.chipOptionText,
                            {
                              color: isActive
                                ? '#FFFFFF'
                                : isDark
                                ? '#CBD5E1'
                                : '#334155',
                              fontWeight: isActive ? '700' : '600',
                            },
                          ]}
                        >
                          {st}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 4. Vehicle Details (Color & VIN) */}
              <View style={styles.twoColRow}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    VEHICLE COLOR
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#101726' : '#FFFFFF',
                        borderColor: isDark ? '#1E293B' : '#CBD5E1',
                        color: colors.textPrimary,
                      },
                    ]}
                    value={color}
                    onChangeText={setColor}
                    placeholder="e.g. Pearl White"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    VIN / CHASSIS NO. (OPTIONAL)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#101726' : '#FFFFFF',
                        borderColor: isDark ? '#1E293B' : '#CBD5E1',
                        color: colors.textPrimary,
                      },
                    ]}
                    value={vinChassis}
                    onChangeText={setVinChassis}
                    placeholder="e.g. MA3EWB41S..."
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              {/* 5. Financial Breakdown */}
              <View style={styles.threeColRow}>
                <View style={[styles.fieldGroup, { flex: 1.2 }]}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    TOTAL AMOUNT (₹) *
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#101726' : '#FFFFFF',
                        borderColor: isDark ? '#1E293B' : '#CBD5E1',
                        color: colors.textPrimary,
                      },
                    ]}
                    value={totalAmount}
                    onChangeText={setTotalAmount}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    DISCOUNT (₹)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#101726' : '#FFFFFF',
                        borderColor: isDark ? '#1E293B' : '#CBD5E1',
                        color: colors.textPrimary,
                      },
                    ]}
                    value={discountAmount}
                    onChangeText={setDiscountAmount}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    TOKEN ADV. (₹)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#101726' : '#FFFFFF',
                        borderColor: isDark ? '#1E293B' : '#CBD5E1',
                        color: colors.textPrimary,
                      },
                    ]}
                    value={advanceAmount}
                    onChangeText={setAdvanceAmount}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Balance Calculation Box */}
              <View
                style={[
                  styles.balanceBox,
                  {
                    backgroundColor: isDark
                      ? 'rgba(16, 185, 129, 0.12)'
                      : '#ECFDF5',
                    borderColor: isDark
                      ? 'rgba(16, 185, 129, 0.3)'
                      : '#A7F3D0',
                  },
                ]}
              >
                <View>
                  <Text
                    style={[
                      styles.balanceLabel,
                      { color: isDark ? '#6EE7B7' : '#047857' },
                    ]}
                  >
                    OUTSTANDING BALANCE TO COLLECT
                  </Text>
                  <Text
                    style={[
                      styles.balanceSub,
                      { color: isDark ? '#A7F3D0' : '#065F46' },
                    ]}
                  >
                    Net = Total ({parsedTotal.toLocaleString('en-IN')}) - Discount ({parsedDiscount.toLocaleString('en-IN')}) - Advance ({parsedAdvance.toLocaleString('en-IN')})
                  </Text>
                </View>
                <Text
                  style={[
                    styles.balanceAmount,
                    { color: isDark ? '#10B981' : '#059669' },
                  ]}
                >
                  ₹{balanceAmount.toLocaleString('en-IN')}
                </Text>
              </View>

              {/* 6. Initial Payment Receipt Details */}
              <View
                style={[
                  styles.subSectionCard,
                  {
                    backgroundColor: isDark ? '#101726' : '#F8FAFC',
                    borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  },
                ]}
              >
                <View style={styles.subSectionHeader}>
                  <CreditCard size={15} color={colors.primary} strokeWidth={2.2} />
                  <Text style={[styles.subSectionTitle, { color: colors.textPrimary, marginLeft: 6 }]}>
                    INITIAL PAYMENT RECEIPT
                  </Text>
                </View>

                {/* Payment Mode */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    PAYMENT MODE
                  </Text>
                  <View style={styles.chipsRow}>
                    {PAYMENT_MODES.map((mode) => {
                      const isActive = paymentMode === mode;
                      const label = mode === 'neft_rtgs' ? 'NEFT / RTGS' : mode.toUpperCase();
                      return (
                        <TouchableOpacity
                          key={mode}
                          style={[
                            styles.chipOption,
                            {
                              backgroundColor: isActive
                                ? colors.primary
                                : isDark
                                ? '#162030'
                                : '#FFFFFF',
                              borderColor: isActive
                                ? colors.primaryDark
                                : isDark
                                ? '#1E293B'
                                : '#CBD5E1',
                            },
                          ]}
                          onPress={() => {
                            triggerHaptic('selection');
                            setPaymentMode(mode);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.chipOptionText,
                              {
                                color: isActive
                                  ? '#FFFFFF'
                                  : isDark
                                  ? '#CBD5E1'
                                  : '#334155',
                                fontWeight: isActive ? '700' : '600',
                              },
                            ]}
                          >
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Payment Type */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    PAYMENT TYPE
                  </Text>
                  <View style={styles.chipsRow}>
                    {PAYMENT_TYPES.map((pt) => {
                      const isActive = paymentType === pt;
                      const label = pt.replace('_', ' ').toUpperCase();
                      return (
                        <TouchableOpacity
                          key={pt}
                          style={[
                            styles.chipOption,
                            {
                              backgroundColor: isActive
                                ? colors.primary
                                : isDark
                                ? '#162030'
                                : '#FFFFFF',
                              borderColor: isActive
                                ? colors.primaryDark
                                : isDark
                                ? '#1E293B'
                                : '#CBD5E1',
                            },
                          ]}
                          onPress={() => {
                            triggerHaptic('selection');
                            setPaymentType(pt);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.chipOptionText,
                              {
                                color: isActive
                                  ? '#FFFFFF'
                                  : isDark
                                  ? '#CBD5E1'
                                  : '#334155',
                                fontWeight: isActive ? '700' : '600',
                              },
                            ]}
                          >
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Ref & Bank */}
                <View style={styles.twoColRow}>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                      UTR / REF NO. (OPTIONAL)
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: isDark ? '#162030' : '#FFFFFF',
                          borderColor: isDark ? '#1E293B' : '#CBD5E1',
                          color: colors.textPrimary,
                        },
                      ]}
                      value={transactionRef}
                      onChangeText={setTransactionRef}
                      placeholder="e.g. UTR9872164"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>

                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                      BANK NAME (OPTIONAL)
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: isDark ? '#162030' : '#FFFFFF',
                          borderColor: isDark ? '#1E293B' : '#CBD5E1',
                          color: colors.textPrimary,
                        },
                      ]}
                      value={bankName}
                      onChangeText={setBankName}
                      placeholder="e.g. SBI Military Branch"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>
              </View>

              {/* 7. Insurance Policy Information (MANDATORY: ALL FIELDS NULLABLE & OPTIONAL) */}
              <View
                style={[
                  styles.subSectionCard,
                  {
                    backgroundColor: isDark ? '#101726' : '#F8FAFC',
                    borderColor: hasInsurance
                      ? isDark
                        ? '#3B82F6'
                        : '#93C5FD'
                      : isDark
                      ? '#1E293B'
                      : '#E2E8F0',
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.insuranceToggleRow}
                  activeOpacity={0.8}
                  onPress={() => {
                    triggerHaptic('selection');
                    setHasInsurance((prev) => !prev);
                  }}
                >
                  <View style={styles.insHeaderLeft}>
                    <ShieldCheck
                      size={18}
                      color={hasInsurance ? (isDark ? '#60A5FA' : '#0284C7') : colors.textSecondary}
                      strokeWidth={2.2}
                    />
                    <View style={{ marginLeft: 8 }}>
                      <Text style={[styles.insTitle, { color: colors.textPrimary }]}>
                        Insurance Policy Information
                      </Text>
                      <Text style={[styles.insSubtitle, { color: colors.textSecondary }]}>
                        All insurance fields are completely optional & nullable
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={hasInsurance}
                    onValueChange={(val) => {
                      triggerHaptic('selection');
                      setHasInsurance(val);
                    }}
                    trackColor={{ false: isDark ? '#334155' : '#CBD5E1', true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </TouchableOpacity>

                {hasInsurance && (
                  <View style={styles.insFieldsWrapper}>
                    {/* Insurer Company Chips */}
                    <View style={styles.fieldGroup}>
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                        INSURANCE COMPANY (OPTIONAL)
                      </Text>
                      <View style={styles.chipsRow}>
                        {INSURANCE_COMPANIES.map((comp) => {
                          const isActive = insCompany === comp;
                          return (
                            <TouchableOpacity
                              key={comp}
                              style={[
                                styles.chipOption,
                                {
                                  backgroundColor: isActive
                                    ? colors.primary
                                    : isDark
                                    ? '#162030'
                                    : '#FFFFFF',
                                  borderColor: isActive
                                    ? colors.primaryDark
                                    : isDark
                                    ? '#1E293B'
                                    : '#CBD5E1',
                                },
                              ]}
                              onPress={() => {
                                triggerHaptic('selection');
                                setInsCompany(comp);
                              }}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={[
                                  styles.chipOptionText,
                                  {
                                    color: isActive
                                      ? '#FFFFFF'
                                      : isDark
                                      ? '#CBD5E1'
                                      : '#334155',
                                    fontWeight: isActive ? '700' : '500',
                                  },
                                ]}
                              >
                                {comp}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    {/* Policy Number & Insurance Type */}
                    <View style={styles.twoColRow}>
                      <View style={[styles.fieldGroup, { flex: 1 }]}>
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                          POLICY NUMBER (OPTIONAL)
                        </Text>
                        <TextInput
                          style={[
                            styles.input,
                            {
                              backgroundColor: isDark ? '#162030' : '#FFFFFF',
                              borderColor: isDark ? '#1E293B' : '#CBD5E1',
                              color: colors.textPrimary,
                            },
                          ]}
                          value={insPolicyNumber}
                          onChangeText={setInsPolicyNumber}
                          placeholder="e.g. POL-2026-90812"
                          placeholderTextColor={colors.textMuted}
                        />
                      </View>

                      <View style={[styles.fieldGroup, { flex: 1 }]}>
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                          INSURANCE TYPE (OPTIONAL)
                        </Text>
                        <TextInput
                          style={[
                            styles.input,
                            {
                              backgroundColor: isDark ? '#162030' : '#FFFFFF',
                              borderColor: isDark ? '#1E293B' : '#CBD5E1',
                              color: colors.textPrimary,
                            },
                          ]}
                          value={insType}
                          onChangeText={setInsType}
                          placeholder="Comprehensive / Zero Dep"
                          placeholderTextColor={colors.textMuted}
                        />
                      </View>
                    </View>

                    {/* Premium Amount & IDV */}
                    <View style={styles.twoColRow}>
                      <View style={[styles.fieldGroup, { flex: 1 }]}>
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                          PREMIUM (₹) (OPTIONAL)
                        </Text>
                        <TextInput
                          style={[
                            styles.input,
                            {
                              backgroundColor: isDark ? '#162030' : '#FFFFFF',
                              borderColor: isDark ? '#1E293B' : '#CBD5E1',
                              color: colors.textPrimary,
                            },
                          ]}
                          value={insPremium}
                          onChangeText={setInsPremium}
                          keyboardType="numeric"
                          placeholder="e.g. 32000"
                          placeholderTextColor={colors.textMuted}
                        />
                      </View>

                      <View style={[styles.fieldGroup, { flex: 1 }]}>
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                          IDV VALUE (₹) (OPTIONAL)
                        </Text>
                        <TextInput
                          style={[
                            styles.input,
                            {
                              backgroundColor: isDark ? '#162030' : '#FFFFFF',
                              borderColor: isDark ? '#1E293B' : '#CBD5E1',
                              color: colors.textPrimary,
                            },
                          ]}
                          value={insIdv}
                          onChangeText={setInsIdv}
                          keyboardType="numeric"
                          placeholder="e.g. 1150000"
                          placeholderTextColor={colors.textMuted}
                        />
                      </View>
                    </View>

                    {/* Policy Start Date & Expiry Date */}
                    <View style={styles.twoColRow}>
                      <View style={[styles.fieldGroup, { flex: 1 }]}>
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                          START DATE (OPTIONAL)
                        </Text>
                        <TextInput
                          style={[
                            styles.input,
                            {
                              backgroundColor: isDark ? '#162030' : '#FFFFFF',
                              borderColor: isDark ? '#1E293B' : '#CBD5E1',
                              color: colors.textPrimary,
                            },
                          ]}
                          value={insStartDate}
                          onChangeText={setInsStartDate}
                          placeholder="YYYY-MM-DD"
                          placeholderTextColor={colors.textMuted}
                        />
                      </View>

                      <View style={[styles.fieldGroup, { flex: 1 }]}>
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                          EXPIRY DATE (OPTIONAL)
                        </Text>
                        <TextInput
                          style={[
                            styles.input,
                            {
                              backgroundColor: isDark ? '#162030' : '#FFFFFF',
                              borderColor: isDark ? '#1E293B' : '#CBD5E1',
                              color: colors.textPrimary,
                            },
                          ]}
                          value={insExpiryDate}
                          onChangeText={setInsExpiryDate}
                          placeholder="YYYY-MM-DD"
                          placeholderTextColor={colors.textMuted}
                        />
                      </View>
                    </View>

                    {/* Insurance Remarks */}
                    <View style={styles.fieldGroup}>
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                        INSURANCE NOTES (OPTIONAL)
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            backgroundColor: isDark ? '#162030' : '#FFFFFF',
                            borderColor: isDark ? '#1E293B' : '#CBD5E1',
                            color: colors.textPrimary,
                          },
                        ]}
                        value={insNotes}
                        onChangeText={setInsNotes}
                        placeholder="Policy cover notes, add-ons included, etc."
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>
                  </View>
                )}
              </View>

              {/* 8. Expected Delivery Date */}
              <View style={styles.fieldGroup}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  EXPECTED DELIVERY DATE
                </Text>
                <StartAlignedInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#101726' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#CBD5E1',
                      color: colors.textPrimary,
                    },
                  ]}
                  value={deliveryDate}
                  onChangeText={setDeliveryDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {/* 9. Operational Notes & Sanction Comments */}
              <View style={styles.fieldGroup}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  OPERATIONAL NOTES & SANCTION COMMENTS
                </Text>
                <TextInput
                  style={[
                    styles.inputMultiline,
                    {
                      backgroundColor: isDark ? '#101726' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#CBD5E1',
                      color: colors.textPrimary,
                    },
                  ]}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  placeholder="Enter financing bank, sanction authority, or delivery instructions..."
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </ScrollView>

            {/* Action Footer */}
            <View
              style={[
                styles.footer,
                {
                  borderTopColor: isDark ? '#1E293B' : '#F1F5F9',
                  backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                  paddingBottom: Math.max(insets.bottom, 20) + 8,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.cancelBtn,
                  {
                    backgroundColor: isDark ? '#162030' : '#F1F5F9',
                    borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  },
                ]}
                onPress={() => {
                  triggerHaptic('impactLight');
                  onClose();
                }}
                disabled={isSubmitting}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.cancelBtnText,
                    { color: colors.textPrimary },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  {
                    backgroundColor: colors.primary,
                    opacity: isSubmitting ? 0.7 : 1,
                  },
                ]}
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    Convert & Generate Deal Dossier
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    maxHeight: '94%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  grabHandleRow: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  grabHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoBadge: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoImg: {
    width: 28,
    height: 28,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  tagPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  tagPillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sheetSub: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  formScroll: {
    maxHeight: 520,
  },
  formContent: {
    padding: 16,
    gap: 14,
  },
  summaryCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  custRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  custName: {
    fontSize: 15,
    fontWeight: '800',
  },
  verifiedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
  },
  custContact: {
    fontSize: 12,
    marginTop: 3,
  },
  segPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  segText: {
    fontSize: 11,
    fontWeight: '800',
  },
  vehicleLine: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  vehicleBrand: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  vehicleModel: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 1,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  reqStar: {
    color: '#EF4444',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipOptionText: {
    fontSize: 11,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
  },
  threeColRow: {
    flexDirection: 'row',
    gap: 8,
  },
  balanceBox: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  balanceSub: {
    fontSize: 10,
    marginTop: 2,
  },
  balanceAmount: {
    fontSize: 17,
    fontWeight: '900',
  },
  subSectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  subSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  insuranceToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  insHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  insTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  insSubtitle: {
    fontSize: 10,
    marginTop: 1,
  },
  insFieldsWrapper: {
    marginTop: 8,
    gap: 12,
  },
  input: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '600',
  },
  inputMultiline: {
    minHeight: 70,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    fontSize: 12,
    fontWeight: '500',
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});

export default ConvertToDealModal;
