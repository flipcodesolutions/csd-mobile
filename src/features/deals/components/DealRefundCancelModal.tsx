import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertTriangle,
  Banknote,
  Check,
  ChevronDown,
  RotateCcw,
  X,
} from 'lucide-react-native';
import { Deal } from '../types';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { showErrorToast, showSuccessToast } from '../../../core/utils/toast';
import { dealService } from '../dealService';

interface DealRefundCancelModalProps {
  visible: boolean;
  deal: Deal | null;
  onClose: () => void;
  onSuccess: () => void;
}

export interface PaymentModeOption {
  label: string;
  apiKey: string;
  isCash: boolean;
}

export const REFUND_PAYMENT_MODES: PaymentModeOption[] = [
  { label: 'Cash', apiKey: 'CASH', isCash: true },
  { label: 'Bank Transfer (NEFT/RTGS)', apiKey: 'NEFT/RTGS', isCash: false },
  { label: 'UPI / Google Pay / PhonePe', apiKey: 'UPI', isCash: false },
  { label: 'Cheque', apiKey: 'CHEQUE', isCash: false },
  { label: 'Other', apiKey: 'IMPS', isCash: false },
];

export const DealRefundCancelModal: React.FC<DealRefundCancelModalProps> = ({
  visible,
  deal,
  onClose,
  onSuccess,
}) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const totalPaid = Number(deal?.paid_amount ?? deal?.total_paid ?? 0);
  const netDealAmount = Number(deal?.net_amount ?? deal?.total_amount ?? 0);

  // Form States
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<PaymentModeOption>(REFUND_PAYMENT_MODES[1]); // Default to Bank Transfer
  const [showModeDropdown, setShowModeDropdown] = useState<boolean>(false);
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [bankName, setBankName] = useState<string>('HDFC Bank');
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Initialize values when deal opens
  useEffect(() => {
    if (deal && visible) {
      const paid = Number(deal.paid_amount ?? deal.total_paid ?? 0);
      setRefundAmount(String(paid));
      setSelectedMode(REFUND_PAYMENT_MODES[1]); // Default Bank Transfer
      setShowModeDropdown(false);
      setTransactionRef('');
      setBankName('HDFC Bank');
      setReason('');
      setNotes('');
      setSubmitting(false);
    }
  }, [deal, visible]);

  if (!visible || !deal) return null;

  const formatInr = (val?: number | string) => {
    const num = Number(val || 0);
    return '₹' + num.toLocaleString('en-IN');
  };

  const cleanAmountStr = String(refundAmount || '').replace(/[^0-9.]/g, '');
  const enteredRefundNum = parseFloat(cleanAmountStr) || 0;
  const isAmountOverPaid = enteredRefundNum > totalPaid;

  const handleSubmit = async () => {
    triggerHaptic('impactHeavy');

    const cleanAmount = String(refundAmount || '').replace(/[^0-9.]/g, '');
    const refundNum = parseFloat(cleanAmount) || 0;

    // 1. Validation: Refund Amount
    if (isNaN(refundNum) || refundNum < 0) {
      showErrorToast('Invalid Amount', 'Please enter a valid refund amount (0 or more).');
      return;
    }

    if (refundNum > totalPaid) {
      showErrorToast(
        'Amount Exceeded',
        `Refund amount (${formatInr(refundNum)}) cannot exceed total paid amount (${formatInr(totalPaid)}).`
      );
      return;
    }

    // 2. Validation: Payment Mode non-cash requires UTR if refund > 0
    if (!selectedMode.isCash && refundNum > 0 && !transactionRef.trim()) {
      showErrorToast(
        'Reference Required',
        'Please enter Transaction Ref / UTR / Cheque No for non-cash refund.'
      );
      return;
    }

    // 3. Validation: Cancellation Reason
    if (!reason.trim()) {
      showErrorToast(
        'Reason Required',
        'Please enter the reason for cancelling this deal.'
      );
      return;
    }

    // Confirmation Alert before destructive cancellation
    Alert.alert(
      'Confirm Deal Cancellation',
      `Are you sure you want to cancel Deal #${deal.deal_number || deal.id} for ${deal.customer_name}?\n\nRefund of ${formatInr(refundNum)} will be recorded via ${selectedMode.label}. This action cannot be undone.`,
      [
        { text: 'No, Keep Deal', style: 'cancel' },
        {
          text: 'Yes, Cancel & Refund',
          style: 'destructive',
          onPress: async () => {
            try {
              setSubmitting(true);
              const isCash = selectedMode.isCash;
              const ref = isCash
                ? 'CASH'
                : transactionRef.trim() || (refundNum === 0 ? 'N/A' : `REF-${Date.now().toString().slice(-6)}`);
              const bank = isCash
                ? 'Cash Counter'
                : bankName.trim() || 'HDFC Bank';

              const payload = {
                refund_amount: refundNum,
                cancellation_fee: 0,
                payment_mode: selectedMode.apiKey,
                transaction_reference: ref,
                bank_name: bank,
                reason: reason.trim() || 'Customer requested deal cancellation',
                notes: notes.trim() || reason.trim() || 'Cancelled via mobile app',
              };

              const res = await dealService.refundAndCancel(deal.id, payload);
              showSuccessToast(
                'Deal Cancelled Successfully',
                res?.message || `Refund of ${formatInr(refundNum)} recorded.`
              );
              onSuccess();
              onClose();
            } catch (err: any) {
              console.log('Error in refundAndCancel:', err?.response?.data || err?.message);
              let errMsg =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                'Failed to process cancellation and refund.';

              if (err?.response?.data?.errors && typeof err.response.data.errors === 'object') {
                const errorEntries = Object.entries(err.response.data.errors);
                const fieldMessages = errorEntries
                  .map(([field, msgs]) => `${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
                  .filter(Boolean);
                if (fieldMessages.length > 0) {
                  errMsg = fieldMessages.join('\n');
                }
              }
              showErrorToast('Cancellation Failed', errMsg);
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableWithoutFeedback onPress={() => setShowModeDropdown(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardAvoid}
          >
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: isDark ? '#111827' : '#FFFFFF',
                  borderColor: isDark ? '#374151' : '#E5E7EB',
                  marginBottom: Math.max(insets.bottom, 12),
                },
              ]}
            >
              {/* 1. Modal Header (matching Screenshot 2) */}
              <View
                style={[
                  styles.headerRow,
                  { borderBottomColor: isDark ? '#1F2937' : '#F3F4F6' },
                ]}
              >
                <View style={styles.headerLeft}>
                  <View style={styles.iconCircleRed}>
                    <RotateCcw size={16} color="#DC2626" strokeWidth={2.4} />
                  </View>
                  <View style={styles.headerTextGroup}>
                    <Text
                      style={[
                        styles.headerTitle,
                        { color: isDark ? '#FFFFFF' : '#111827' },
                      ]}
                      numberOfLines={1}
                    >
                      Money Return & Deal Cancellation
                    </Text>
                    <Text
                      style={[
                        styles.headerSubtitle,
                        { color: isDark ? '#9CA3AF' : '#6B7280' },
                      ]}
                      numberOfLines={1}
                    >
                      Deal #{deal.deal_number || deal.id} • Customer: {deal.customer_name}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={18} color={isDark ? '#9CA3AF' : '#6B7280'} strokeWidth={2.4} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollContent}
              >
                {/* 2. Top 3 Info Cards (NET DEAL AMOUNT, TOTAL PAID SO FAR, DELIVERY STAGE) */}
                <View style={styles.kpiCardsRow}>
                  {/* Card 1: NET DEAL AMOUNT */}
                  <View
                    style={[
                      styles.kpiMiniCard,
                      {
                        backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
                        borderColor: isDark ? '#374151' : '#E5E7EB',
                      },
                    ]}
                  >
                    <Text style={styles.kpiMiniLabel}>NET DEAL AMOUNT</Text>
                    <Text
                      style={[
                        styles.kpiMiniValueBold,
                        { color: isDark ? '#F3F4F6' : '#111827' },
                      ]}
                      numberOfLines={1}
                    >
                      {formatInr(netDealAmount)}
                    </Text>
                    <Text
                      style={[
                        styles.kpiMiniSubtext,
                        { color: isDark ? '#9CA3AF' : '#6B7280' },
                      ]}
                      numberOfLines={1}
                    >
                      {deal.model_variant || deal.vehicle_spec || 'Vehicle Deal'}
                    </Text>
                  </View>

                  {/* Card 2: TOTAL PAID SO FAR */}
                  <View
                    style={[
                      styles.kpiMiniCard,
                      {
                        backgroundColor: isDark ? '#064E3B20' : '#ECFDF5',
                        borderColor: isDark ? '#065F46' : '#A7F3D0',
                      },
                    ]}
                  >
                    <Text style={[styles.kpiMiniLabel, { color: '#047857' }]}>
                      TOTAL PAID SO FAR
                    </Text>
                    <Text style={[styles.kpiMiniValueBold, { color: '#059669' }]} numberOfLines={1}>
                      {formatInr(totalPaid)}
                    </Text>
                    <Text style={[styles.kpiMiniSubtext, { color: '#047857' }]} numberOfLines={1}>
                      Advance / Cleared Amount
                    </Text>
                  </View>

                  {/* Card 3: DELIVERY STAGE */}
                  <View
                    style={[
                      styles.kpiMiniCard,
                      {
                        backgroundColor: isDark ? '#7F1D1D20' : '#FEF2F2',
                        borderColor: isDark ? '#991B1B' : '#FECACA',
                      },
                    ]}
                  >
                    <Text style={[styles.kpiMiniLabel, { color: '#B91C1C' }]}>
                      DELIVERY STAGE
                    </Text>
                    <Text style={[styles.kpiMiniValueBold, { color: '#DC2626' }]} numberOfLines={1}>
                      Cancelling Deal
                    </Text>
                    <Text style={[styles.kpiMiniSubtext, { color: '#B91C1C' }]} numberOfLines={1}>
                      Balance Due will be set to ₹0
                    </Text>
                  </View>
                </View>

                {/* 3. Section: Refund Payment Details Container */}
                <View
                  style={[
                    styles.sectionCard,
                    {
                      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                      borderColor: isDark ? '#374151' : '#E5E7EB',
                    },
                  ]}
                >
                  <View style={styles.sectionHeader}>
                    <Banknote size={15} color="#15803D" strokeWidth={2.4} />
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: isDark ? '#F3F4F6' : '#111827' },
                      ]}
                    >
                      Refund Payment Details
                    </Text>
                  </View>

                  {/* Field 1: Refund Amount to Return */}
                  <View style={styles.fieldGroup}>
                    <Text
                      style={[
                        styles.fieldLabel,
                        { color: isDark ? '#D1D5DB' : '#374151' },
                      ]}
                    >
                      Refund Amount to Return (₹) <Text style={styles.requiredAsterisk}>*</Text>
                    </Text>
                    <View
                      style={[
                        styles.amountInputRow,
                        {
                          backgroundColor: isDark ? '#111827' : '#F9FAFB',
                          borderColor: isAmountOverPaid
                            ? '#DC2626'
                            : isDark
                              ? '#374151'
                              : '#D1D5DB',
                        },
                      ]}
                    >
                      <View style={styles.currencyPrefixBox}>
                        <Text style={styles.currencyPrefixText}>₹</Text>
                      </View>
                      <TextInput
                        style={[
                          styles.amountInput,
                          { color: isDark ? '#FFFFFF' : '#111827' },
                        ]}
                        keyboardType="numeric"
                        value={refundAmount}
                        onChangeText={setRefundAmount}
                        placeholder="0"
                        placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                      />
                    </View>
                    <Text
                      style={[
                        styles.helperSubtext,
                        isAmountOverPaid && { color: '#DC2626', fontWeight: '700' },
                      ]}
                    >
                      {isAmountOverPaid
                        ? `Amount cannot exceed customer paid amount (${formatInr(totalPaid)})`
                        : `Actual money returned to customer! (Max: ${formatInr(totalPaid)})`}
                    </Text>
                  </View>

                  {/* Field 2: Refund Payment Mode Dropdown */}
                  <View style={styles.fieldGroup}>
                    <Text
                      style={[
                        styles.fieldLabel,
                        { color: isDark ? '#D1D5DB' : '#374151' },
                      ]}
                    >
                      Refund Payment Mode <Text style={styles.requiredAsterisk}>*</Text>
                    </Text>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        triggerHaptic('selection');
                        setShowModeDropdown((prev) => !prev);
                      }}
                      style={[
                        styles.dropdownTrigger,
                        {
                          backgroundColor: isDark ? '#111827' : '#F9FAFB',
                          borderColor: showModeDropdown
                            ? '#2563EB'
                            : isDark
                              ? '#374151'
                              : '#D1D5DB',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dropdownTriggerText,
                          { color: isDark ? '#FFFFFF' : '#111827' },
                        ]}
                      >
                        {selectedMode.label}
                      </Text>
                      <ChevronDown
                        size={16}
                        color={isDark ? '#9CA3AF' : '#6B7280'}
                        strokeWidth={2.2}
                      />
                    </TouchableOpacity>

                    {/* Dropdown Options Menu */}
                    {showModeDropdown && (
                      <View
                        style={[
                          styles.dropdownMenu,
                          {
                            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                            borderColor: isDark ? '#374151' : '#E5E7EB',
                          },
                        ]}
                      >
                        {REFUND_PAYMENT_MODES.map((modeItem) => {
                          const isSelected = selectedMode.apiKey === modeItem.apiKey;
                          return (
                            <TouchableOpacity
                              key={modeItem.apiKey}
                              onPress={() => {
                                triggerHaptic('selection');
                                setSelectedMode(modeItem);
                                setShowModeDropdown(false);
                              }}
                              style={[
                                styles.dropdownOption,
                                isSelected && {
                                  backgroundColor: isDark ? '#2563EB30' : '#EFF6FF',
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.dropdownOptionText,
                                  {
                                    color: isSelected
                                      ? '#2563EB'
                                      : isDark
                                        ? '#E5E7EB'
                                        : '#1F2937',
                                    fontWeight: isSelected ? '700' : '500',
                                  },
                                ]}
                              >
                                {modeItem.label}
                              </Text>
                              {isSelected && (
                                <Check size={15} color="#2563EB" strokeWidth={2.6} />
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>

                  {/* ============================================================== */}
                  {/* CONDITIONAL FIELDS: When NOT Cash, display UTR and Bank fields! */}
                  {/* When Cash is selected, these fields are HIDDEN per requirement! */}
                  {/* ============================================================== */}
                  {!selectedMode.isCash && (
                    <>
                      {/* Field 3: Transaction Ref / UTR / Cheque No */}
                      <View style={styles.fieldGroup}>
                        <Text
                          style={[
                            styles.fieldLabel,
                            { color: isDark ? '#D1D5DB' : '#374151' },
                          ]}
                        >
                          Transaction Ref / UTR / Cheque No{' '}
                          <Text style={styles.requiredAsterisk}>*</Text>
                        </Text>
                        <TextInput
                          style={[
                            styles.textInput,
                            {
                              backgroundColor: isDark ? '#111827' : '#F9FAFB',
                              borderColor: isDark ? '#374151' : '#D1D5DB',
                              color: isDark ? '#FFFFFF' : '#111827',
                            },
                          ]}
                          placeholder="e.g. UTR123456789 / CHQ-9901"
                          placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                          value={transactionRef}
                          onChangeText={setTransactionRef}
                        />
                      </View>

                      {/* Field 4: Bank / Disbursed Account */}
                      <View style={styles.fieldGroup}>
                        <Text
                          style={[
                            styles.fieldLabel,
                            { color: isDark ? '#D1D5DB' : '#374151' },
                          ]}
                        >
                          Bank / Disbursed Account
                        </Text>
                        <TextInput
                          style={[
                            styles.textInput,
                            {
                              backgroundColor: isDark ? '#111827' : '#F9FAFB',
                              borderColor: isDark ? '#374151' : '#D1D5DB',
                              color: isDark ? '#FFFFFF' : '#111827',
                            },
                          ]}
                          placeholder="e.g. HDFC Bank"
                          placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                          value={bankName}
                          onChangeText={setBankName}
                        />
                      </View>
                    </>
                  )}

                  {/* Field 5: Cancellation Reason */}
                  <View style={styles.fieldGroup}>
                    <Text
                      style={[
                        styles.fieldLabel,
                        { color: isDark ? '#D1D5DB' : '#374151' },
                      ]}
                    >
                      Cancellation Reason <Text style={styles.requiredAsterisk}>*</Text>
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: isDark ? '#111827' : '#F9FAFB',
                          borderColor: isDark ? '#374151' : '#D1D5DB',
                          color: isDark ? '#FFFFFF' : '#111827',
                        },
                      ]}
                      placeholder="Enter cancellation reason..."
                      placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                      value={reason}
                      onChangeText={setReason}
                    />
                  </View>

                  {/* Field 6: Additional Notes / Remarks */}
                  <View style={styles.fieldGroup}>
                    <Text
                      style={[
                        styles.fieldLabel,
                        { color: isDark ? '#D1D5DB' : '#374151' },
                      ]}
                    >
                      Additional Notes / Remarks
                    </Text>
                    <TextInput
                      style={[
                        styles.textArea,
                        {
                          backgroundColor: isDark ? '#111827' : '#F9FAFB',
                          borderColor: isDark ? '#374151' : '#D1D5DB',
                          color: isDark ? '#FFFFFF' : '#111827',
                        },
                      ]}
                      placeholder="Optional cancellation notes or customer agreement reference..."
                      placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                      value={notes}
                      onChangeText={setNotes}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </View>
                </View>

                {/* 4. Warning Alert Notice Box (Matching Screenshot 2) */}
                <View style={styles.noticeBox}>
                  <AlertTriangle size={16} color="#D97706" strokeWidth={2.4} style={styles.noticeIcon} />
                  <Text style={styles.noticeText}>
                    <Text style={{ fontWeight: '800' }}>Notice:</Text> This action will mark this Deal as{' '}
                    <Text style={{ fontWeight: '800', color: '#B45309' }}>Cancelled</Text>, exclude it from{' '}
                    <Text style={{ fontWeight: '700' }}>Active Deals and Pipeline</Text>, set{' '}
                    <Text style={{ fontWeight: '700' }}>Pending Receivables to ₹0</Text>, and generate a Credit Note / Refund Voucher.
                  </Text>
                </View>
              </ScrollView>

              {/* 5. Bottom Action Buttons Toolbar */}
              <View
                style={[
                  styles.footerRow,
                  {
                    borderTopColor: isDark ? '#1F2937' : '#F3F4F6',
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={onClose}
                  disabled={submitting}
                  style={[
                    styles.cancelBtn,
                    {
                      borderColor: isDark ? '#374151' : '#D1D5DB',
                      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.cancelBtnText,
                      { color: isDark ? '#D1D5DB' : '#4B5563' },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={submitting || isAmountOverPaid}
                  style={[
                    styles.submitBtn,
                    {
                      backgroundColor: isAmountOverPaid
                        ? '#9CA3AF'
                        : '#DC2626',
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <RotateCcw size={15} color="#FFFFFF" strokeWidth={2.4} />
                      <Text style={styles.submitBtnText}>
                        Process Refund & Cancel Deal
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    width: '100%',
    maxHeight: '92%',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
    maxHeight: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  iconCircleRed: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  kpiCardsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  kpiMiniCard: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    minHeight: 74,
    justifyContent: 'space-between',
  },
  kpiMiniLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.3,
  },
  kpiMiniValueBold: {
    fontSize: 14,
    fontWeight: '900',
    marginVertical: 2,
  },
  kpiMiniSubtext: {
    fontSize: 9.5,
    fontWeight: '500',
  },
  sectionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  fieldGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  requiredAsterisk: {
    color: '#DC2626',
    fontWeight: '800',
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    height: 42,
  },
  currencyPrefixBox: {
    backgroundColor: '#EEF2E6',
    paddingHorizontal: 12,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#DCE9A2',
  },
  currencyPrefixText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#58632A',
  },
  amountInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 0,
  },
  helperSubtext: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 42,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  dropdownTriggerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dropdownMenu: {
    marginTop: 4,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  dropdownOptionText: {
    fontSize: 13,
  },
  textInput: {
    height: 42,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  textArea: {
    minHeight: 68,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 4,
  },
  noticeIcon: {
    marginTop: 2,
  },
  noticeText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    color: '#92400E',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  submitBtn: {
    flex: 2,
    height: 44,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

