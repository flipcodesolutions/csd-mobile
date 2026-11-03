import React, { useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Award,
  Building2,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  CreditCard,
  FileText,
  Percent,
  Plus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { StartAlignedInput } from '../../../shared';
import { CustomerLead, INSURANCE_TYPE_OPTIONS, REMINDER_DAYS_OPTIONS } from '../types';
import { ConvertLeadDealPayload } from '../../deals/dealService';
import { quotationApi } from '../../quotations/quotationService';
import { DatePickerModal } from './DatePickerModal';

// Indian Number to Words Helper
export function numberToWordsIndian(numVal: string | number): string {
  const n = parseInt(String(numVal).replace(/,/g, ''), 10);
  if (isNaN(n) || n === 0) return 'Zero Rupees Only';
  if (n < 0) return '';

  const single = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertTwo = (val: number): string => {
    if (val < 20) return single[val];
    return `${tens[Math.floor(val / 10)]} ${single[val % 10]}`.trim();
  };

  const convertThree = (val: number): string => {
    const h = Math.floor(val / 100);
    const rem = val % 100;
    let res = '';
    if (h > 0) res += `${single[h]} Hundred `;
    if (rem > 0) res += convertTwo(rem);
    return res.trim();
  };

  let num = n;
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const remainder = num;

  let words = '';
  if (crore > 0) words += `${convertTwo(crore)} Crore `;
  if (lakh > 0) words += `${convertTwo(lakh)} Lakh `;
  if (thousand > 0) words += `${convertTwo(thousand)} Thousand `;
  if (remainder > 0) words += `${convertThree(remainder)} `;

  return `${words.trim()} Rupees Only`;
}

export function formatIndianCurrency(val: string | number): string {
  const num = parseInt(String(val).replace(/,/g, ''), 10);
  if (isNaN(num)) return '₹0';
  return `₹${num.toLocaleString('en-IN')}`;
}

export const PAYMENT_TYPES = ['Token Advance', 'Down Payment', 'Part Payment'] as const;
export const PAYMENT_MODES = ['UPI / QR Code', 'NEFT / RTGS', 'Cash', 'Cheque'] as const;
export const TOP_INSURERS = ['HDFC ERGO', 'ICICI Lombard', 'Tata AIG', 'SBI General', 'Bajaj Allianz', 'New India Assurance'];

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

  // Quotation Linking
  const [quotations, setQuotations] = useState<any[]>([]);
  const [selectedQuotationId, setSelectedQuotationId] = useState<number | null>(null);
  const [isLoadingQuotations, setIsLoadingQuotations] = useState(false);

  // Section 1: Deal Pricing & Discount (default blank)
  const [totalAmount, setTotalAmount] = useState('');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [hasInsurance, setHasInsurance] = useState<'No' | 'Yes'>('No');

  // Section 2: Vehicle Specification & Delivery
  const [vehicleColor, setVehicleColor] = useState('Standard');
  const [vinChassis, setVinChassis] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [showDeliveryDatePicker, setShowDeliveryDatePicker] = useState(false);

  // Section 3: Initial Payment (Token Advance)
  const [advanceAmount, setAdvanceAmount] = useState('51000');
  const [paymentType, setPaymentType] = useState<string>('Token Advance');
  const [paymentMode, setPaymentMode] = useState<string>('UPI / QR Code');
  const [transactionRef, setTransactionRef] = useState('');
  const [bankName, setBankName] = useState('');
  const [receivedBy, setReceivedBy] = useState('Admin User');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Insurance Sub-Modal States
  const [insuranceModalVisible, setInsuranceModalVisible] = useState(false);
  const [insCompany, setInsCompany] = useState('');
  const [insPolicyNumber, setInsPolicyNumber] = useState('');
  const [insType, setInsType] = useState<string>('Comprehensive (1+3 Years)');
  const [insPremium, setInsPremium] = useState('24500');
  const [insVehicleNumber, setInsVehicleNumber] = useState('');
  const [insStartDate, setInsStartDate] = useState('');
  const [insExpiryDate, setInsExpiryDate] = useState('');
  const [insReminderDays, setInsReminderDays] = useState<string>('30 Days Before Expiry');
  const [insNotes, setInsNotes] = useState('');
  const [datePickerTarget, setDatePickerTarget] = useState<'insStart' | 'insExpiry' | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculated Remaining Balance
  const totalNum = parseInt(totalAmount.replace(/,/g, ''), 10) || 0;
  const discountNum = parseInt(discountAmount.replace(/,/g, ''), 10) || 0;
  const advanceNum = parseInt(advanceAmount.replace(/,/g, ''), 10) || 0;
  const pendingBalance = Math.max(0, totalNum - discountNum - advanceNum);

  // Auto-calculated First Renewal Reminder Date
  const firstRenewalReminderDate = useMemo(() => {
    if (!insExpiryDate) return 'Auto calculated from expiry date';
    const expiry = new Date(insExpiryDate);
    if (isNaN(expiry.getTime())) return 'Auto calculated from expiry date';

    const days = insReminderDays.includes('15')
      ? 15
      : insReminderDays.includes('30')
      ? 30
      : insReminderDays.includes('45')
      ? 45
      : 60;

    const reminder = new Date(expiry.getTime() - days * 86400000);
    return reminder.toISOString().split('T')[0];
  }, [insExpiryDate, insReminderDays]);

  // Load Lead data and Quotations on mount
  useEffect(() => {
    if (visible && lead) {
      // Default delivery date: Today + 15 days
      const d = new Date(Date.now() + 15 * 86400000);
      setDeliveryDate(d.toISOString().split('T')[0]);

      // Defaults (blank per requirements)
      setTotalAmount('');
      setDiscountAmount('0');
      setSelectedQuotationId(null);
      setVehicleColor('Standard');
      setVinChassis('');
      setHasInsurance('No');
      setPaymentType('Token Advance');
      setPaymentMode('UPI / QR Code');
      setTransactionRef('');
      setBankName('');
      setReceivedBy('Admin User');
      setPaymentNotes('');

      // Initial insurance default dates
      const todayStr = new Date().toISOString().split('T')[0];
      const expiryStr = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];
      setInsStartDate(todayStr);
      setInsExpiryDate(expiryStr);
      setInsCompany('');
      setInsPolicyNumber('');
      setInsVehicleNumber('');
      setInsNotes('');

      // Fetch quotations (do not auto-select, keep blank until user taps quotation)
      setIsLoadingQuotations(true);
      quotationApi
        .getAll({ lead_id: lead.id })
        .then((res: any) => {
          const list = Array.isArray(res) ? res : res?.data || [];
          setQuotations(list);
          setSelectedQuotationId(null);
        })
        .catch(() => {
          setQuotations([]);
          setSelectedQuotationId(null);
        })
        .finally(() => {
          setIsLoadingQuotations(false);
        });
    }
  }, [visible, lead]);

  const handleSelectQuotation = (q: any) => {
    triggerHaptic('selection');
    setSelectedQuotationId(q.id);
    const grand = q.grand_total || q.total_amount;
    if (grand) setTotalAmount(String(grand));
  };

  const handleClearQuotation = () => {
    triggerHaptic('selection');
    setSelectedQuotationId(null);
    setTotalAmount('');
  };

  // Convert deal final execution
  const executeConversion = async (insuranceDetails?: any) => {
    if (!lead) return;
    if (!totalAmount.trim() || totalNum <= 0) {
      Alert.alert('Required Field', 'Please enter a valid Total Deal Amount.');
      return;
    }
    if (!vehicleColor.trim()) {
      Alert.alert('Required Field', 'Please enter vehicle color.');
      return;
    }
    if (!deliveryDate.trim()) {
      Alert.alert('Required Field', 'Please select expected delivery date.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: ConvertLeadDealPayload = {
        lead_id: lead.id,
        quotation_id: selectedQuotationId || undefined,
        total_amount: totalNum,
        discount_amount: discountNum,
        color: vehicleColor.trim(),
        vin_chassis_number: vinChassis.trim() || undefined,
        expected_delivery_date: deliveryDate,
        has_insurance: hasInsurance,
        initial_payment: {
          amount: advanceNum,
          payment_type: paymentType.toLowerCase().replace(/\s+/g, '_'),
          payment_mode: paymentMode.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          transaction_reference: paymentMode === 'Cash' ? undefined : transactionRef,
          bank_name: paymentMode === 'Cash' ? undefined : bankName,
          notes: paymentNotes,
        },
        advance_amount: advanceNum,
        balance_amount: pendingBalance,
        deal_title: `DEAL-${lead.id}-${(lead.name || 'CUSTOMER').replace(/\s+/g, '').toUpperCase()}`,
        deal_stage: 'Booked',
        notes: `Converted to deal by ${receivedBy}. Advance Token: ₹${advanceNum}`,
      };

      if (hasInsurance === 'Yes' && insuranceDetails) {
        payload.insurance = insuranceDetails;
      }

      await onSubmit(payload);
      setInsuranceModalVisible(false);
      onClose();
    } catch (err: any) {
      Alert.alert('Conversion Failed', err?.message || 'Failed to convert lead to deal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrimaryConfirm = () => {
    triggerHaptic('impactMedium');
    if (hasInsurance === 'Yes') {
      // Open Insurance Policy Sub-Modal!
      setInsuranceModalVisible(true);
    } else {
      executeConversion();
    }
  };

  const handleInsuranceModalSubmit = () => {
    triggerHaptic('impactMedium');
    const insuranceData = {
      company: insCompany.trim() || undefined,
      policy_number: insPolicyNumber.trim() || undefined,
      insurance_type: insType,
      premium_amount: parseFloat(insPremium.replace(/,/g, '')) || undefined,
      vehicle_registration_number: insVehicleNumber.trim().toUpperCase() || undefined,
      start_date: insStartDate || undefined,
      expiry_date: insExpiryDate || undefined,
      renewal_reminder_days: insReminderDays,
      first_renewal_reminder_date: firstRenewalReminderDate,
      notes: insNotes.trim() || undefined,
    };
    executeConversion(insuranceData);
  };

  if (!visible || !lead) return null;

  const brandName = lead.brand_name || 'Hyundai';
  const modelVariant =
    lead.model_variant || `${lead.model_name || 'Venue'} ${lead.variant_name || 'SX'}`.trim();

  return (
    <Modal
      visible={visible}
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

          {/* Modal Header */}
          <View
            style={[
              styles.sheetHeader,
              { borderBottomColor: isDark ? '#1E293B' : '#F1F5F9' },
            ]}
          >
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Award size={18} color="#16A34A" strokeWidth={2.5} />
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                  Convert Lead to Deal & Booking
                </Text>
              </View>
              <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
                Lock vehicle booking, generate deal contract & record advance token
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={[
                styles.closeBtn,
                { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
              ]}
              activeOpacity={0.7}
            >
              <X size={16} color={colors.textSecondary} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>

          {/* Scrollable Form */}
          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.formContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Prospect Summary Card */}
            <View
              style={[
                styles.prospectSummaryCard,
                {
                  backgroundColor: isDark ? '#101726' : '#F8FAFC',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
            >
              <View style={styles.prospectMetaRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.metaHeaderTitle, { color: colors.textSecondary }]}>
                    CUSTOMER PROSPECT
                  </Text>
                  <Text style={[styles.prospectName, { color: colors.textPrimary }]}>
                    {lead.name}
                  </Text>
                  <Text style={[styles.prospectPhone, { color: colors.textSecondary }]}>
                    {lead.phone} • {lead.home_town || lead.city || 'Surendranagar'}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.metaHeaderTitle, { color: colors.textSecondary }]}>
                    VEHICLE MODEL
                  </Text>
                  <Text style={[styles.prospectVehicle, { color: colors.primary }]}>
                    {modelVariant}
                  </Text>
                  <Text style={[styles.prospectBrand, { color: colors.textSecondary }]}>
                    {brandName}
                  </Text>
                </View>
              </View>
            </View>

            {/* Quotation Selector Section */}
            {quotations.length > 0 && (
              <View style={styles.quotationSection}>
                <View style={styles.quotationSectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    LINK PREVIOUS QUOTATION ({quotations.length})
                  </Text>
                  {selectedQuotationId && (
                    <TouchableOpacity onPress={handleClearQuotation}>
                      <Text style={[styles.clearText, { color: colors.primary }]}>
                        Clear Selection
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.qChipsScroll}>
                  {quotations.map((q) => {
                    const isSel = selectedQuotationId === q.id;
                    return (
                      <TouchableOpacity
                        key={q.id}
                        style={[
                          styles.quotationCard,
                          {
                            backgroundColor: isSel
                              ? isDark
                                ? 'rgba(59, 130, 246, 0.15)'
                                : '#EFF6FF'
                              : isDark
                              ? '#101726'
                              : '#FFFFFF',
                            borderColor: isSel ? '#3B82F6' : isDark ? '#1E293B' : '#CBD5E1',
                          },
                        ]}
                        onPress={() => handleSelectQuotation(q)}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <Text style={[styles.qCardNumber, { color: isSel ? '#3B82F6' : colors.textPrimary }]}>
                            #{q.quotation_number || q.id}
                          </Text>
                          {isSel && <Check size={12} color="#3B82F6" strokeWidth={3} />}
                        </View>
                        <Text style={[styles.qCardAmount, { color: colors.primary }]}>
                          ₹{Number(q.grand_total || q.total_amount || 0).toLocaleString('en-IN')}
                        </Text>
                        <Text style={[styles.qCardDate, { color: colors.textSecondary }]}>
                          {q.created_at ? q.created_at.split('T')[0] : 'Recent'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* 1. Deal Pricing & Discount */}
            <View
              style={[
                styles.formSectionCard,
                {
                  backgroundColor: isDark ? '#101726' : '#FFFFFF',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
            >
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionIndicator, { backgroundColor: colors.primary }]} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  1. Deal Pricing & Discount
                </Text>
              </View>

              {/* Total Deal Amount */}
              <View style={styles.fieldGroup}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    TOTAL DEAL AMOUNT (₹) <Text style={styles.reqStar}>*</Text>
                  </Text>
                  <Text style={[styles.formattedPreview, { color: colors.primary }]}>
                    {formatIndianCurrency(totalAmount)}
                  </Text>
                </View>
                <StartAlignedInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#CBD5E1',
                      color: colors.textPrimary,
                    },
                  ]}
                  value={totalAmount}
                  onChangeText={setTotalAmount}
                  placeholder="e.g. 1450000"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                />
                <Text style={[styles.inWordsText, { color: colors.textSecondary }]}>
                  🗣️ {numberToWordsIndian(totalAmount)}
                </Text>
              </View>

              {/* Discount Amount */}
              <View style={styles.fieldGroup}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    DISCOUNT AMOUNT (₹)
                  </Text>
                  <Text style={[styles.formattedPreview, { color: '#D97706' }]}>
                    {formatIndianCurrency(discountAmount)}
                  </Text>
                </View>
                <StartAlignedInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#CBD5E1',
                      color: colors.textPrimary,
                    },
                  ]}
                  value={discountAmount}
                  onChangeText={setDiscountAmount}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                />
                {parseInt(discountAmount, 10) > 0 && (
                  <Text style={[styles.inWordsText, { color: colors.textSecondary }]}>
                    🗣️ {numberToWordsIndian(discountAmount)}
                  </Text>
                )}
              </View>

              {/* Insurance Included Radio Group */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  INSURANCE INCLUDED? (Default: No)
                </Text>
                <View style={styles.radioGroupRow}>
                  {(['No', 'Yes'] as const).map((opt) => {
                    const isSel = hasInsurance === opt;
                    return (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          styles.radioOption,
                          {
                            backgroundColor: isSel
                              ? colors.primary
                              : isDark
                              ? '#131B2E'
                              : '#F1F5F9',
                            borderColor: isSel
                              ? colors.primaryDark
                              : isDark
                              ? '#1E293B'
                              : '#CBD5E1',
                          },
                        ]}
                        onPress={() => setHasInsurance(opt)}
                      >
                        <Text
                          style={[
                            styles.radioOptionText,
                            {
                              color: isSel ? '#FFFFFF' : colors.textPrimary,
                            },
                          ]}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* 2. Vehicle Specification & Delivery */}
            <View
              style={[
                styles.formSectionCard,
                {
                  backgroundColor: isDark ? '#101726' : '#FFFFFF',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  marginTop: 12,
                },
              ]}
            >
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionIndicator, { backgroundColor: '#38BDF8' }]} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  2. Vehicle Specification & Delivery
                </Text>
              </View>

              {/* Vehicle Color */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  VEHICLE COLOR <Text style={styles.reqStar}>*</Text>
                </Text>
                <StartAlignedInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#CBD5E1',
                      color: colors.textPrimary,
                    },
                  ]}
                  value={vehicleColor}
                  onChangeText={setVehicleColor}
                  placeholder="Standard / Polar White / Phantom Black"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {/* Expected Delivery Date */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  EXPECTED DELIVERY DATE <Text style={styles.reqStar}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#CBD5E1',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingHorizontal: 12,
                    },
                  ]}
                  onPress={() => {
                    triggerHaptic('selection');
                    setShowDeliveryDatePicker(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      color: deliveryDate ? colors.textPrimary : colors.textMuted,
                      fontSize: 13,
                      fontWeight: '500',
                    }}
                  >
                    {deliveryDate || 'Select Delivery Date (YYYY-MM-DD)'}
                  </Text>
                  <Calendar size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 3. Initial Payment (Token Advance) */}
            <View
              style={[
                styles.formSectionCard,
                {
                  backgroundColor: isDark ? '#101726' : '#FFFFFF',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  marginTop: 12,
                },
              ]}
            >
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionIndicator, { backgroundColor: '#10B981' }]} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  3. Initial Payment (Token Advance)
                </Text>
              </View>

              {/* Advance Amount */}
              <View style={styles.fieldGroup}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    ADVANCE AMOUNT (₹) <Text style={styles.reqStar}>*</Text>
                  </Text>
                  <Text style={[styles.formattedPreview, { color: '#16A34A' }]}>
                    {formatIndianCurrency(advanceAmount)}
                  </Text>
                </View>
                <StartAlignedInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#CBD5E1',
                      color: colors.textPrimary,
                    },
                  ]}
                  value={advanceAmount}
                  onChangeText={setAdvanceAmount}
                  placeholder="e.g. 51000"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                />
                <Text style={[styles.inWordsText, { color: colors.textSecondary }]}>
                  🗣️ {numberToWordsIndian(advanceAmount)}
                </Text>
              </View>

              {/* Payment Type */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  PAYMENT TYPE
                </Text>
                <View style={styles.radioGroupRow}>
                  {PAYMENT_TYPES.map((pt) => {
                    const isSel = paymentType === pt;
                    return (
                      <TouchableOpacity
                        key={pt}
                        style={[
                          styles.radioOption,
                          {
                            backgroundColor: isSel
                              ? colors.primary
                              : isDark
                              ? '#131B2E'
                              : '#F1F5F9',
                            borderColor: isSel
                              ? colors.primaryDark
                              : isDark
                              ? '#1E293B'
                              : '#CBD5E1',
                          },
                        ]}
                        onPress={() => setPaymentType(pt)}
                      >
                        <Text
                          style={[
                            styles.radioOptionText,
                            {
                              color: isSel ? '#FFFFFF' : colors.textPrimary,
                              fontSize: 10,
                            },
                          ]}
                        >
                          {pt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Payment Mode */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  PAYMENT MODE
                </Text>
                <View style={styles.radioGroupRow}>
                  {PAYMENT_MODES.map((pm) => {
                    const isSel = paymentMode === pm;
                    return (
                      <TouchableOpacity
                        key={pm}
                        style={[
                          styles.radioOption,
                          {
                            backgroundColor: isSel
                              ? colors.primary
                              : isDark
                              ? '#131B2E'
                              : '#F1F5F9',
                            borderColor: isSel
                              ? colors.primaryDark
                              : isDark
                              ? '#1E293B'
                              : '#CBD5E1',
                          },
                        ]}
                        onPress={() => setPaymentMode(pm)}
                      >
                        <Text
                          style={[
                            styles.radioOptionText,
                            {
                              color: isSel ? '#FFFFFF' : colors.textPrimary,
                              fontSize: 10,
                            },
                          ]}
                        >
                          {pm}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Conditional Non-Cash Handling */}
              {paymentMode !== 'Cash' && (
                <>
                  <View style={styles.fieldGroup}>
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                      TRANSACTION REFERENCE / UTR
                    </Text>
                    <StartAlignedInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                          borderColor: isDark ? '#1E293B' : '#CBD5E1',
                          color: colors.textPrimary,
                        },
                      ]}
                      value={transactionRef}
                      onChangeText={setTransactionRef}
                      placeholder="e.g. UPI/98127391823/HDFC"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                      BANK NAME
                    </Text>
                    <StartAlignedInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                          borderColor: isDark ? '#1E293B' : '#CBD5E1',
                          color: colors.textPrimary,
                        },
                      ]}
                      value={bankName}
                      onChangeText={setBankName}
                      placeholder="e.g. HDFC Bank, SBI"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </>
              )}

              {/* Received By */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  RECEIVED BY (PERSON NAME)
                </Text>
                <StartAlignedInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#CBD5E1',
                      color: colors.textPrimary,
                    },
                  ]}
                  value={receivedBy}
                  onChangeText={setReceivedBy}
                  placeholder="Admin User"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {/* Payment Notes */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  PAYMENT NOTES / REMARKS
                </Text>
                <StartAlignedInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#CBD5E1',
                      color: colors.textPrimary,
                    },
                  ]}
                  value={paymentNotes}
                  onChangeText={setPaymentNotes}
                  placeholder="e.g. Booking token advance received"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {/* Live Balance Summary */}
              <View
                style={[
                  styles.balanceSummaryBox,
                  {
                    backgroundColor: isDark ? '#131B2E' : '#F0FDF4',
                    borderColor: isDark ? '#166534' : '#BBF7D0',
                  },
                ]}
              >
                <View style={styles.balanceRow}>
                  <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
                    Initial Paid:
                  </Text>
                  <Text style={[styles.balanceValue, { color: '#16A34A' }]}>
                    {formatIndianCurrency(advanceAmount)}
                  </Text>
                </View>
                <View style={styles.balanceRow}>
                  <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
                    Remaining Balance Pending:
                  </Text>
                  <Text style={[styles.balanceValue, { color: '#DC2626' }]}>
                    ₹{pendingBalance.toLocaleString('en-IN')}
                  </Text>
                </View>
                <Text style={[styles.pipelineNote, { color: colors.textSecondary }]}>
                  Lead will move to Deals Pipeline automatically.
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Modal Footer */}
          <View
            style={[
              styles.footer,
              {
                borderTopColor: isDark ? '#1E293B' : '#F1F5F9',
                backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                paddingBottom: Math.max(insets.bottom, 24) + 8,
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
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: '#16A34A' }]}
              onPress={handlePrimaryConfirm}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {hasInsurance === 'Yes'
                    ? 'Proceed to Insurance Policy ➔'
                    : 'Confirm & Convert Deal'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* =========================================
          SUB-MODAL: INSURANCE POLICY INFORMATION
      ========================================= */}
      <Modal
        visible={insuranceModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setInsuranceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setInsuranceModalVisible(false)}
          />
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

            {/* Header */}
            <View
              style={[
                styles.sheetHeader,
                { borderBottomColor: isDark ? '#1E293B' : '#F1F5F9' },
              ]}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={18} color={colors.primary} strokeWidth={2.2} />
                  <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                    Insurance Policy Information
                  </Text>
                </View>
                <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
                  Customer: {lead.name} • {lead.phone} | Vehicle: {modelVariant}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setInsuranceModalVisible(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={[
                  styles.closeBtn,
                  { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                ]}
              >
                <X size={16} color={colors.textSecondary} strokeWidth={2.2} />
              </TouchableOpacity>
            </View>

            {/* Scrollable Insurance Fields */}
            <ScrollView
              style={styles.formScroll}
              contentContainerStyle={styles.formContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Insurance Company */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  INSURANCE COMPANY (OPTIONAL)
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
                  value={insCompany}
                  onChangeText={setInsCompany}
                  placeholder="e.g. HDFC ERGO, ICICI Lombard, Tata AIG (optional)"
                  placeholderTextColor={colors.textMuted}
                />
                {/* Suggestions */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.insChipsScroll}>
                  {TOP_INSURERS.map((cmp) => (
                    <TouchableOpacity
                      key={cmp}
                      style={[
                        styles.insChip,
                        {
                          backgroundColor: insCompany === cmp ? colors.primary : isDark ? '#101726' : '#F1F5F9',
                          borderColor: isDark ? '#1E293B' : '#CBD5E1',
                        },
                      ]}
                      onPress={() => setInsCompany(cmp)}
                    >
                      <Text
                        style={[
                          styles.insChipText,
                          { color: insCompany === cmp ? '#FFFFFF' : colors.textPrimary },
                        ]}
                      >
                        {cmp}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Policy Number */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  POLICY NUMBER (OPTIONAL)
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
                  value={insPolicyNumber}
                  onChangeText={setInsPolicyNumber}
                  placeholder="e.g. POL-2026-987654 (optional)"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {/* Insurance Type (Screenshot 3 Matching Options) */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  INSURANCE TYPE (OPTIONAL)
                </Text>
                <View style={styles.insTypeContainer}>
                  {INSURANCE_TYPE_OPTIONS.map((t) => {
                    const isSel = insType === t;
                    return (
                      <TouchableOpacity
                        key={t}
                        style={[
                          styles.insTypeOption,
                          {
                            backgroundColor: isSel
                              ? colors.primary
                              : isDark
                              ? '#101726'
                              : '#F8FAFC',
                            borderColor: isSel
                              ? colors.primaryDark
                              : isDark
                              ? '#1E293B'
                              : '#CBD5E1',
                          },
                        ]}
                        onPress={() => setInsType(t)}
                      >
                        <Text
                          style={[
                            styles.insTypeText,
                            {
                              color: isSel ? '#FFFFFF' : colors.textPrimary,
                              fontWeight: isSel ? '700' : '500',
                            },
                          ]}
                        >
                          {t}
                        </Text>
                        {isSel && <Check size={14} color="#FFFFFF" strokeWidth={2.5} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Premium Amount & Vehicle Number */}
              <View style={styles.twoColRow}>
                <View style={styles.colCell}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    PREMIUM AMOUNT (₹) (OPTIONAL)
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
                    value={insPremium}
                    onChangeText={setInsPremium}
                    placeholder="e.g. 24500 (optional)"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.colCell}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    VEHICLE NUMBER (OPTIONAL)
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
                    value={insVehicleNumber}
                    onChangeText={setInsVehicleNumber}
                    placeholder="GJ-01-AB-1234"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              {/* Policy Start Date & Expiry Date (+1 Year Auto) */}
              <View style={styles.twoColRow}>
                <View style={styles.colCell}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    POLICY START DATE (OPTIONAL)
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#101726' : '#FFFFFF',
                        borderColor: isDark ? '#1E293B' : '#CBD5E1',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 12,
                      },
                    ]}
                    onPress={() => {
                      triggerHaptic('selection');
                      setDatePickerTarget('insStart');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        color: insStartDate ? colors.textPrimary : colors.textMuted,
                        fontSize: 13,
                        fontWeight: '500',
                      }}
                    >
                      {insStartDate || 'YYYY-MM-DD'}
                    </Text>
                    <Calendar size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.colCell}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    POLICY EXPIRY DATE (1 YEAR)
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#101726' : '#FFFFFF',
                        borderColor: isDark ? '#1E293B' : '#CBD5E1',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 12,
                      },
                    ]}
                    onPress={() => {
                      triggerHaptic('selection');
                      setDatePickerTarget('insExpiry');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        color: insExpiryDate ? colors.textPrimary : colors.textMuted,
                        fontSize: 13,
                        fontWeight: '500',
                      }}
                    >
                      {insExpiryDate || 'YYYY-MM-DD'}
                    </Text>
                    <Calendar size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Reminder Days Before (Screenshot 4 Matching Options) */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  REMINDER DAYS BEFORE (OPTIONAL)
                </Text>
                <View style={styles.radioGroupRow}>
                  {REMINDER_DAYS_OPTIONS.map((interval) => {
                    const isSel = insReminderDays === interval;
                    return (
                      <TouchableOpacity
                        key={interval}
                        style={[
                          styles.radioOption,
                          {
                            backgroundColor: isSel
                              ? colors.primary
                              : isDark
                              ? '#101726'
                              : '#F1F5F9',
                            borderColor: isSel
                              ? colors.primaryDark
                              : isDark
                              ? '#1E293B'
                              : '#CBD5E1',
                          },
                        ]}
                        onPress={() => setInsReminderDays(interval)}
                      >
                        <Text
                          style={[
                            styles.radioOptionText,
                            {
                              color: isSel ? '#FFFFFF' : colors.textPrimary,
                              fontSize: 9,
                            },
                          ]}
                        >
                          {interval}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* First Renewal Reminder Date Display */}
              <View
                style={[
                  styles.reminderDateBox,
                  {
                    backgroundColor: isDark ? '#101726' : '#F0F9FF',
                    borderColor: isDark ? '#0284C7' : '#BAE6FD',
                  },
                ]}
              >
                <Text style={[styles.reminderLabel, { color: colors.textSecondary }]}>
                  First Renewal Reminder Date:
                </Text>
                <Text style={[styles.reminderValue, { color: '#0284C7' }]}>
                  {firstRenewalReminderDate}
                </Text>
              </View>

              {/* Insurance Notes */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  INSURANCE NOTES (OPTIONAL)
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
                  value={insNotes}
                  onChangeText={setInsNotes}
                  placeholder="Insurance notes or IDV details (optional)..."
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </ScrollView>

            {/* Insurance Footer */}
            <View
              style={[
                styles.footer,
                {
                  borderTopColor: isDark ? '#1E293B' : '#F1F5F9',
                  backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                  paddingBottom: Math.max(insets.bottom, 24) + 8,
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
                onPress={() => setInsuranceModalVisible(false)}
                disabled={isSubmitting}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
                  Back
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: '#16A34A' }]}
                onPress={handleInsuranceModalSubmit}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    Save Policy & Convert Deal
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Expected Delivery Date Picker Modal */}
      <DatePickerModal
        visible={showDeliveryDatePicker}
        title="Select Expected Delivery Date"
        initialDate={deliveryDate}
        allowFuture={true}
        onClose={() => setShowDeliveryDatePicker(false)}
        onSelectDate={(formatted) => setDeliveryDate(formatted)}
      />

      {/* Insurance Policy Date Picker Modal */}
      <DatePickerModal
        visible={datePickerTarget !== null}
        title={
          datePickerTarget === 'insStart'
            ? 'Select Policy Start Date'
            : 'Select Policy Expiry Date'
        }
        initialDate={
          datePickerTarget === 'insStart' ? insStartDate : insExpiryDate
        }
        allowFuture={true}
        onClose={() => setDatePickerTarget(null)}
        onSelectDate={(formatted) => {
          if (datePickerTarget === 'insStart') {
            setInsStartDate(formatted);
            const d = new Date(formatted);
            if (!isNaN(d.getTime())) {
              const nextYear = new Date(d.getTime() + 365 * 86400000);
              setInsExpiryDate(nextYear.toISOString().split('T')[0]);
            }
          } else if (datePickerTarget === 'insExpiry') {
            setInsExpiryDate(formatted);
          }
        }}
      />
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
    maxHeight: '92%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  grabHandleRow: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  grabHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formScroll: {
    flexGrow: 0,
  },
  formContent: {
    padding: 14,
    paddingBottom: 20,
  },
  prospectSummaryCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  prospectMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaHeaderTitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  prospectName: {
    fontSize: 14,
    fontWeight: '800',
  },
  prospectPhone: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  prospectVehicle: {
    fontSize: 13,
    fontWeight: '800',
  },
  prospectBrand: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  quotationSection: {
    marginBottom: 12,
  },
  quotationSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  clearText: {
    fontSize: 11,
    fontWeight: '700',
  },
  qChipsScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  quotationCard: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 120,
  },
  qCardNumber: {
    fontSize: 11,
    fontWeight: '800',
  },
  qCardAmount: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  qCardDate: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  formSectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
  },
  sectionIndicator: {
    width: 4,
    height: 16,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  fieldGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  reqStar: {
    color: '#EF4444',
  },
  formattedPreview: {
    fontSize: 11,
    fontWeight: '800',
  },
  input: {
    height: 42,
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '600',
  },
  inWordsText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
  },
  radioGroupRow: {
    flexDirection: 'row',
    gap: 8,
  },
  radioOption: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  radioOptionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  colCell: {
    flex: 1,
  },
  balanceSummaryBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginTop: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  balanceValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  pipelineNote: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  insChipsScroll: {
    gap: 6,
    paddingVertical: 6,
  },
  insChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  insChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  insTypeContainer: {
    gap: 6,
  },
  insTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  insTypeText: {
    fontSize: 12,
  },
  reminderDateBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
  },
  reminderLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  reminderValue: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 11,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});

export default ConvertToDealModal;
