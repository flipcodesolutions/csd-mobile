import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertCircle,
  Calendar,
  Check,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  Lock,
  Plus,
  Trash2,
  X,
} from 'lucide-react-native';
import { CreateDealPaymentPayload, Deal, DealItem } from '../types';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { showErrorToast, showSuccessToast } from '../../../core/utils/toast';
import { dealService } from '../dealService';
import { appStorage } from '../../../core/storage/storage';
import { DatePickerModal } from '../../leads/components/DatePickerModal';

interface AddDealInvoiceModalProps {
  visible: boolean;
  deal: Deal | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const PAYMENT_TYPE_OPTIONS = [
  'Part Payment',
  'Token Advance',
  'Down Payment',
  'Final Settlement',
  'Full Payment',
];

export const PAYMENT_MODE_OPTIONS = [
  'UPI / GPay / QR',
  'NEFT / RTGS',
  'Cash',
  'Cheque',
  'Card',
];

export const AddDealInvoiceModal: React.FC<AddDealInvoiceModalProps> = ({
  visible,
  deal,
  onClose,
  onSuccess,
}) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [paymentType, setPaymentType] = useState('Part Payment');
  const [showTypePicker, setShowTypePicker] = useState(false);

  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI / GPay / QR');
  const [showModePicker, setShowModePicker] = useState(false);

  const [receivedBy, setReceivedBy] = useState('Admin User');
  const [transactionRef, setTransactionRef] = useState('');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [remarks, setRemarks] = useState('');

  // Invoice Items
  const [invoiceItems, setInvoiceItems] = useState<DealItem[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const formatInr = (val?: number | string) => {
    const num = Number(val || 0);
    return '₹' + num.toLocaleString('en-IN');
  };

  const isCash = paymentMode.toLowerCase().trim() === 'cash';

  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await appStorage.getUserProfile();
        if (u?.name) setReceivedBy(u.name);
      } catch (e) {}
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (deal && visible) {
      setErrorMessage('');
      const today = new Date();
      const yr = today.getFullYear();
      const mo = String(today.getMonth() + 1).padStart(2, '0');
      const rand = Math.floor(1000 + Math.random() * 9000);
      setInvoiceNumber(`DAL-/${yr}/${mo}/${rand}`);

      // Auto-prefill realistic UTR reference
      const randUtr = `UTR${Math.floor(100000000 + Math.random() * 900000000)}`;
      setTransactionRef(randUtr);

      const net = Number(deal.net_amount || deal.total_amount || 0);
      const paid = Number(deal.paid_amount || deal.total_paid || 0);
      const due = Number(
        deal.balance_due !== undefined
          ? deal.balance_due
          : deal.balance_amount !== undefined
          ? deal.balance_amount
          : Math.max(0, net - paid)
      );

      const defaultAmount = due > 0 ? String(due) : '50000';
      setAmountPaid(defaultAmount);

      const vehicleName = deal.model_variant || deal.model_name || 'Vehicle';
      setRemarks(
        `Part Payment payment for Deal ${deal.deal_number || deal.id} - Customer: ${deal.customer_name}`
      );

      // Default item
      setInvoiceItems([
        {
          description: `Part Payment for ${vehicleName} (${deal.deal_number || `DEAL-${deal.id}`})`,
          hsn_code: '998313',
          hsn: '998313',
          quantity: 1,
          rate: Number(defaultAmount),
          amount: Number(defaultAmount),
        },
      ]);
    }
  }, [deal, visible]);

  // Synchronize item amount when amountPaid changes
  const handleAmountPaidChange = (text: string) => {
    setAmountPaid(text);
    const num = parseFloat(text.replace(/[^0-9.-]+/g, '')) || 0;
    setInvoiceItems((prev) =>
      prev.map((item, idx) =>
        idx === 0
          ? {
              ...item,
              rate: num,
              amount: num * (item.quantity || 1),
            }
          : item
      )
    );
  };

  const handleAddItem = () => {
    triggerHaptic('selection');
    setInvoiceItems((prev) => [
      ...prev,
      {
        description: 'Accessories / Service Charge',
        hsn_code: '998313',
        hsn: '998313',
        quantity: 1,
        rate: 0,
        amount: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    triggerHaptic('impactLight');
    if (invoiceItems.length <= 1) {
      Alert.alert('Cannot Remove', 'At least one invoice line item is required.');
      return;
    }
    setInvoiceItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveInvoice = async () => {
    if (!deal) return;
    triggerHaptic();
    setErrorMessage('');

    const paidNum = parseFloat(amountPaid.replace(/[^0-9.-]+/g, '')) || 0;
    if (paidNum <= 0) {
      setErrorMessage('Please enter a valid amount paid greater than ₹0.');
      return;
    }

    const finalRef = (transactionRef || '').trim() ||
      (isCash ? 'CASH-RECEIPT' : `UTR${Math.floor(100000000 + Math.random() * 900000000)}`);

    setSubmitting(true);
    try {
      const payload: CreateDealPaymentPayload = {
        deal_id: deal.id,
        amount: paidNum,
        payment_date: invoiceDate,
        payment_type: paymentType,
        payment_mode: paymentMode,
        payment_reference: finalRef,
        transaction_reference: finalRef,
        received_by: isCash ? 'Admin User' : (receivedBy.trim() || 'Admin User'),
        bank_name: isCash ? 'Cash Counter' : (bankName.trim() || 'HDFC Bank'),
        remarks: remarks.trim() || undefined,
        invoice_number: invoiceNumber.trim() || undefined,
        items: invoiceItems.map((it) => ({
          description: it.description,
          hsn_code: it.hsn_code || it.hsn || '998313',
          quantity: Number(it.quantity || 1),
          rate: Number(it.rate || it.amount || 0),
          amount: Number(it.amount || it.rate || 0),
        })),
      };

      console.log('[AddDealInvoiceModal] Submitting invoice payment payload:', payload);
      await dealService.addPayment(payload);
      showSuccessToast('Invoice Generated', `Recorded payment of ${formatInr(paidNum)} for ${deal.deal_number}.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Could not record invoice payment.';
      console.log('[AddDealInvoiceModal] Invoice Generation Failed:', msg);
      setErrorMessage(msg);
      showErrorToast('Invoice Generation Failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!deal) return null;

  const netAmount = Number(deal.net_amount || deal.total_amount || 0);
  const alreadyPaid = Number(deal.paid_amount || deal.total_paid || 0);
  const balanceDue = Number(
    deal.balance_due !== undefined
      ? deal.balance_due
      : deal.balance_amount !== undefined
      ? deal.balance_amount
      : Math.max(0, netAmount - alreadyPaid)
  );

  const vehicleName = deal.model_variant || deal.model_name || 'Vehicle';
  const hasInsurance = deal.has_insurance === true || deal.has_insurance === 'Yes' || !!deal.insurance;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              maxHeight: '92%',
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: isDark ? '#334155' : '#E2E8F0' }]}>
            <View style={styles.headerLeft}>
              <FileSpreadsheet size={18} color="#D97706" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                  Generate Tax Invoice & Record Payment
                </Text>
                <Text style={styles.headerSub}>Links directly to Vehicle Deals & Bookings Database</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* 1. Select Vehicle Deal (Locked) */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.fieldLabel, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                  Select Vehicle Deal <Text style={styles.req}>*</Text>
                </Text>
                <View style={styles.lockedPill}>
                  <Lock size={10} color="#1E3A8A" />
                  <Text style={styles.lockedPillText}>Deal Locked</Text>
                </View>
              </View>
              <View
                style={[
                  styles.lockedDealBox,
                  {
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                  },
                ]}
              >
                <Lock size={14} color="#94A3B8" />
                <Text style={[styles.lockedDealText, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                  {deal.customer_name} ({deal.deal_number || `DEAL-${deal.id}`})
                </Text>
              </View>
            </View>

            {/* 2. Invoice Number & Invoice Date */}
            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={[styles.fieldLabel, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                  Invoice Number (DAL-/)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                      color: isDark ? '#FFFFFF' : '#0F172A',
                      borderColor: isDark ? '#334155' : '#CBD5E1',
                    },
                  ]}
                  value={invoiceNumber}
                  onChangeText={setInvoiceNumber}
                  placeholder="DAL-/2026/11/..."
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.gridCol}>
                <Text style={[styles.fieldLabel, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                  Invoice Date <Text style={styles.req}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[
                    styles.selector,
                    {
                      backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                      borderColor: isDark ? '#334155' : '#CBD5E1',
                    },
                  ]}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.selectorText,
                      { color: isDark ? '#FFFFFF' : '#0F172A' },
                    ]}
                  >
                    {invoiceDate}
                  </Text>
                  <Calendar size={15} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            {/* 3. Selected Deal Particulars Box (Task 2 Fix: Wrap & Fit Screen) */}
            <View
              style={[
                styles.particularsBox,
                {
                  backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                },
              ]}
            >
              <View style={styles.particularsHeader}>
                <Text style={styles.particularsTitle} numberOfLines={2}>
                  Selected Deal Particulars ({deal.deal_number || `DEAL-${deal.id}`})
                </Text>
                <View style={styles.stagePill}>
                  <Text style={styles.stagePillText}>
                    Stage: {(deal.delivery_stage || deal.deal_status || 'Booking Confirmed').replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>

              {/* Meta Grid */}
              <View style={styles.particularsGrid}>
                <View style={styles.metaCell}>
                  <Text style={styles.metaLabel}>Customer Name</Text>
                  <Text style={[styles.metaVal, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                    {deal.customer_name}
                  </Text>
                </View>

                <View style={styles.metaCell}>
                  <Text style={styles.metaLabel}>Customer Phone</Text>
                  <Text style={[styles.metaVal, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                    {deal.customer_phone || '-'}
                  </Text>
                </View>

                <View style={styles.metaCell}>
                  <Text style={styles.metaLabel}>City & State</Text>
                  <Text style={[styles.metaVal, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                    {deal.customer_city || deal.city || 'Gujarat'}
                  </Text>
                </View>

                <View style={styles.metaCell}>
                  <Text style={styles.metaLabel}>Vehicle Model & Variant</Text>
                  <Text style={[styles.metaVal, { color: '#0284C7', fontWeight: '800' }]}>
                    {vehicleName}
                  </Text>
                </View>

                <View style={styles.metaCell}>
                  <Text style={styles.metaLabel}>Color</Text>
                  <Text style={[styles.metaVal, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                    {deal.color || 'Standard'}
                  </Text>
                </View>

                <View style={styles.metaCell}>
                  <Text style={styles.metaLabel}>Insurance</Text>
                  <View
                    style={[
                      styles.insuranceTag,
                      hasInsurance ? { backgroundColor: '#DCFCE7' } : { backgroundColor: '#F1F5F9' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.insuranceTagText,
                        hasInsurance ? { color: '#15803D' } : { color: '#64748B' },
                      ]}
                    >
                      {hasInsurance ? 'Insurance: Yes' : 'Insurance: No'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Financial Breakdown Row */}
              <View style={styles.particularsFinRow}>
                <View style={styles.finCol}>
                  <Text style={styles.finColLabel}>Total Deal Net Amount</Text>
                  <Text style={[styles.finColVal, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                    {formatInr(netAmount)}
                  </Text>
                </View>

                <View style={styles.finCol}>
                  <Text style={styles.finColLabel}>Already Paid</Text>
                  <Text style={[styles.finColVal, { color: '#059669' }]}>
                    {formatInr(alreadyPaid)}
                  </Text>
                </View>

                <View style={styles.finCol}>
                  <Text style={styles.finColLabel}>Balance Due</Text>
                  <Text
                    style={[
                      styles.finColVal,
                      { color: balanceDue > 0 ? '#DC2626' : '#15803D' },
                    ]}
                  >
                    {formatInr(balanceDue)}
                  </Text>
                </View>
              </View>
            </View>

            {/* 4. Payment Type & Amount Paid */}
            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={[styles.fieldLabel, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                  Payment Type <Text style={styles.req}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[
                    styles.selector,
                    {
                      backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                      borderColor: isDark ? '#334155' : '#CBD5E1',
                    },
                  ]}
                  onPress={() => setShowTypePicker(!showTypePicker)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.selectorText, { color: isDark ? '#FFF' : '#0F172A' }]}>
                    {paymentType}
                  </Text>
                  <ChevronDown size={16} color="#64748B" />
                </TouchableOpacity>

                {showTypePicker && (
                  <View
                    style={[
                      styles.dropdownMenu,
                      {
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                        borderColor: isDark ? '#334155' : '#CBD5E1',
                      },
                    ]}
                  >
                    {PAYMENT_TYPE_OPTIONS.map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[
                          styles.dropdownItem,
                          paymentType === t && { backgroundColor: isDark ? '#334155' : '#EFF6FF' },
                        ]}
                        onPress={() => {
                          setPaymentType(t);
                          setShowTypePicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            { color: isDark ? '#FFFFFF' : '#0F172A' },
                            paymentType === t && { color: '#2563EB', fontWeight: '800' },
                          ]}
                        >
                          {t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.gridCol}>
                <Text style={[styles.fieldLabel, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                  Amount Paid (₹) <Text style={styles.req}>*</Text>{' '}
                  <Text style={styles.dueHint}>(Due: {formatInr(balanceDue)})</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                      color: isDark ? '#FFFFFF' : '#0F172A',
                      borderColor: isDark ? '#334155' : '#CBD5E1',
                      fontWeight: '800',
                    },
                  ]}
                  value={amountPaid}
                  onChangeText={handleAmountPaidChange}
                  keyboardType="numeric"
                  placeholder="e.g. 451000"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* 5. Payment Mode & Conditional Received By / UTR / Bank Name (Task 2 Requirement) */}
            <View style={styles.gridRow}>
              <View style={[styles.gridCol, isCash && { flex: 1 }]}>
                <Text style={[styles.fieldLabel, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                  Payment Mode <Text style={styles.req}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[
                    styles.selector,
                    {
                      backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                      borderColor: isDark ? '#334155' : '#CBD5E1',
                    },
                  ]}
                  onPress={() => setShowModePicker(!showModePicker)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.selectorText, { color: isDark ? '#FFF' : '#0F172A' }]}>
                    {paymentMode}
                  </Text>
                  <ChevronDown size={16} color="#64748B" />
                </TouchableOpacity>

                {showModePicker && (
                  <View
                    style={[
                      styles.dropdownMenu,
                      {
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                        borderColor: isDark ? '#334155' : '#CBD5E1',
                      },
                    ]}
                  >
                    {PAYMENT_MODE_OPTIONS.map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[
                          styles.dropdownItem,
                          paymentMode === m && { backgroundColor: isDark ? '#334155' : '#EFF6FF' },
                        ]}
                        onPress={() => {
                          setPaymentMode(m);
                          setShowModePicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            { color: isDark ? '#FFFFFF' : '#0F172A' },
                            paymentMode === m && { color: '#2563EB', fontWeight: '800' },
                          ]}
                        >
                          {m}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Received By is HIDDEN when paymentMode is Cash */}
              {!isCash && (
                <View style={styles.gridCol}>
                  <Text style={[styles.fieldLabel, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                    Received By <Text style={styles.req}>*</Text>
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                        color: isDark ? '#FFFFFF' : '#0F172A',
                        borderColor: isDark ? '#334155' : '#CBD5E1',
                      },
                    ]}
                    value={receivedBy}
                    onChangeText={setReceivedBy}
                    placeholder="Admin User"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              )}
            </View>

            {/* UTR & Bank Name - HIDDEN when paymentMode is Cash */}
            {!isCash && (
              <View style={styles.gridRow}>
                <View style={styles.gridCol}>
                  <Text style={[styles.fieldLabel, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                    UTR / Transaction Reference <Text style={styles.req}>*</Text>
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                        color: isDark ? '#FFFFFF' : '#0F172A',
                        borderColor: isDark ? '#334155' : '#CBD5E1',
                      },
                    ]}
                    value={transactionRef}
                    onChangeText={setTransactionRef}
                    placeholder="e.g. UTR192837482"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="characters"
                  />
                </View>

                <View style={styles.gridCol}>
                  <Text style={[styles.fieldLabel, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                    Bank Name
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                        color: isDark ? '#FFFFFF' : '#0F172A',
                        borderColor: isDark ? '#334155' : '#CBD5E1',
                      },
                    ]}
                    value={bankName}
                    onChangeText={setBankName}
                    placeholder="e.g. HDFC Bank"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>
            )}

            {/* Remarks / Internal Notes */}
            <View style={styles.formGroup}>
              <Text style={[styles.fieldLabel, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                Remarks / Internal Notes
              </Text>
              <TextInput
                style={[
                  styles.textarea,
                  {
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                  },
                ]}
                value={remarks}
                onChangeText={setRemarks}
                placeholder="Enter payment milestone remarks..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>

            {/* Invoice Line Item Details */}
            <View style={styles.itemsSection}>
              <View style={styles.itemsSectionHeader}>
                <Text style={[styles.itemsSectionTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                  Invoice Item Details
                </Text>
                <TouchableOpacity
                  style={styles.addItemBtn}
                  onPress={handleAddItem}
                  activeOpacity={0.7}
                >
                  <Plus size={13} color="#2563EB" />
                  <Text style={styles.addItemBtnText}>Add Item</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.itemsList}>
                {invoiceItems.map((item, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.itemCard,
                      {
                        backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                        borderColor: isDark ? '#334155' : '#E2E8F0',
                      },
                    ]}
                  >
                    <View style={styles.itemRowTop}>
                      <TextInput
                        style={[
                          styles.itemDescInput,
                          {
                            color: isDark ? '#FFFFFF' : '#0F172A',
                            backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                            borderColor: isDark ? '#334155' : '#E2E8F0',
                          },
                        ]}
                        value={item.description}
                        onChangeText={(txt) => {
                          setInvoiceItems((prev) =>
                            prev.map((it, i) => (i === idx ? { ...it, description: txt } : it))
                          );
                        }}
                        placeholder="Item Description"
                        placeholderTextColor="#94A3B8"
                      />
                      {invoiceItems.length > 1 && (
                        <TouchableOpacity
                          style={styles.removeItemBtn}
                          onPress={() => handleRemoveItem(idx)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Trash2 size={15} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={styles.itemRowBottom}>
                      <View style={[styles.itemMiniCol, { flex: 1.2 }]}>
                        <Text style={styles.itemMiniLabel}>HSN</Text>
                        <TextInput
                          style={[
                            styles.itemMiniInput,
                            {
                              color: isDark ? '#FFFFFF' : '#0F172A',
                              backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                              borderColor: isDark ? '#334155' : '#E2E8F0',
                            },
                          ]}
                          value={item.hsn_code || item.hsn}
                          onChangeText={(txt) => {
                            setInvoiceItems((prev) =>
                              prev.map((it, i) =>
                                i === idx ? { ...it, hsn_code: txt, hsn: txt } : it
                              )
                            );
                          }}
                          placeholder="998313"
                          placeholderTextColor="#94A3B8"
                        />
                      </View>

                      <View style={[styles.itemMiniCol, { flex: 0.8 }]}>
                        <Text style={styles.itemMiniLabel}>Qty</Text>
                        <TextInput
                          style={[
                            styles.itemMiniInput,
                            {
                              color: isDark ? '#FFFFFF' : '#0F172A',
                              backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                              borderColor: isDark ? '#334155' : '#E2E8F0',
                            },
                          ]}
                          value={String(item.quantity || 1)}
                          onChangeText={(txt) => {
                            const q = parseInt(txt, 10) || 1;
                            setInvoiceItems((prev) =>
                              prev.map((it, i) =>
                                i === idx ? { ...it, quantity: q, amount: q * (it.rate || 0) } : it
                              )
                            );
                          }}
                          keyboardType="numeric"
                        />
                      </View>

                      <View style={[styles.itemMiniCol, { flex: 1.5 }]}>
                        <Text style={styles.itemMiniLabel}>Rate (₹)</Text>
                        <TextInput
                          style={[
                            styles.itemMiniInput,
                            {
                              color: isDark ? '#FFFFFF' : '#0F172A',
                              backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                              borderColor: isDark ? '#334155' : '#E2E8F0',
                              fontWeight: '700',
                            },
                          ]}
                          value={String(item.rate || '')}
                          onChangeText={(txt) => {
                            const r = parseFloat(txt) || 0;
                            setInvoiceItems((prev) =>
                              prev.map((it, i) =>
                                i === idx ? { ...it, rate: r, amount: r * (it.quantity || 1) } : it
                              )
                            );
                          }}
                          keyboardType="numeric"
                        />
                      </View>

                      <View style={[styles.itemMiniCol, { flex: 1.5, alignItems: 'flex-end' }]}>
                        <Text style={styles.itemMiniLabel}>Amount (₹)</Text>
                        <Text style={[styles.itemAmountVal, { color: isDark ? '#60A5FA' : '#1E3A8A' }]}>
                          {formatInr(item.amount || item.rate || 0)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Error Banner */}
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <AlertCircle size={15} color="#DC2626" />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Footer Actions */}
          <View style={[styles.footerActions, { borderTopColor: isDark ? '#334155' : '#E2E8F0' }]}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, submitting && { opacity: 0.7 }]}
              onPress={handleSaveInvoice}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.saveBtnText}>Generate & Save Invoice</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={showDatePicker}
        title="Select Invoice Date"
        initialDate={invoiceDate}
        allowFuture={true}
        allowPast={true}
        onClose={() => setShowDatePicker(false)}
        onSelectDate={(d) => {
          setInvoiceDate(d);
          setShowDatePicker(false);
        }}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 14,
  },
  container: {
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 14,
  },
  formGroup: {
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  req: {
    color: '#EF4444',
  },
  dueHint: {
    fontSize: 10,
    fontWeight: '600',
    color: '#DC2626',
  },
  lockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lockedPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  lockedDealBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  lockedDealText: {
    fontSize: 13,
    fontWeight: '700',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  gridCol: {
    flex: 1,
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  selector: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 58,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    zIndex: 999,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  dropdownItemText: {
    fontSize: 12,
    fontWeight: '600',
  },
  particularsBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  particularsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  particularsTitle: {
    flex: 1,
    minWidth: 160,
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  stagePill: {
    backgroundColor: '#58632A',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  stagePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  particularsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 8,
    marginBottom: 12,
  },
  metaCell: {
    width: '50%',
  },
  metaLabel: {
    fontSize: 9,
    color: '#64748B',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  metaVal: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  insuranceTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginTop: 2,
  },
  insuranceTagText: {
    fontSize: 9,
    fontWeight: '700',
  },
  particularsFinRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  finCol: {
    alignItems: 'center',
  },
  finColLabel: {
    fontSize: 9,
    color: '#64748B',
    marginBottom: 2,
  },
  finColVal: {
    fontSize: 13,
    fontWeight: '900',
  },
  itemsSection: {
    marginTop: 4,
    marginBottom: 10,
  },
  itemsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemsSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
  },
  addItemBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  itemsList: {
    gap: 8,
  },
  itemCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  itemRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  itemDescInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
  },
  removeItemBtn: {
    padding: 4,
  },
  itemRowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemMiniCol: {},
  itemMiniLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  itemMiniInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 5,
    fontSize: 12,
    textAlign: 'center',
  },
  itemAmountVal: {
    fontSize: 13,
    fontWeight: '800',
    paddingVertical: 5,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    minHeight: 55,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#B91C1C',
  },
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#58632A',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
