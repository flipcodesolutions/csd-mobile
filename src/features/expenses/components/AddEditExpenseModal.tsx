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
  CreditCard,
  FileText,
  Info,
  Receipt,
  Search,
  ShieldCheck,
  Wallet,
  X,
} from 'lucide-react-native';
import { colors } from '../../../core/theme/colors';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { showErrorToast, showSuccessToast, showWarningToast } from '../../../core/utils/toast';
import { DatePickerModal } from '../../leads/components/DatePickerModal';
import {
  CreateExpensePayload,
  ExpenseCategory,
  ExpenseRecord,
  UpdateExpensePayload,
} from '../types';
import { DEFAULT_FALLBACK_CATEGORIES, expenseService } from '../expenseService';

interface AddEditExpenseModalProps {
  visible: boolean;
  editingItem: ExpenseRecord | null;
  categories: ExpenseCategory[];
  loggedInUserName?: string;
  onClose: () => void;
  onSubmit: (payload: CreateExpensePayload | UpdateExpensePayload, isEdit: boolean) => Promise<void>;
}

export const AddEditExpenseModal: React.FC<AddEditExpenseModalProps> = ({
  visible,
  editingItem,
  categories,
  loggedInUserName = 'Admin User',
  onClose,
  onSubmit,
}) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

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

  // Form Fields
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [partyName, setPartyName] = useState('');
  const [payBy, setPayBy] = useState(loggedInUserName);
  const [paymentType, setPaymentType] = useState<'Online' | 'Offline'>('Online');
  const [referenceNo, setReferenceNo] = useState('');
  const [remark, setRemark] = useState('');
  const [expenseDate, setExpenseDate] = useState(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryList, setCategoryList] = useState<ExpenseCategory[]>(
    categories.length > 0 ? categories : DEFAULT_FALLBACK_CATEGORIES
  );
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Sync with prop updates
  useEffect(() => {
    if (categories && categories.length > 0) {
      setCategoryList(categories);
    }
  }, [categories]);

  // Fetch fresh dynamic categories from backend API whenever modal opens
  useEffect(() => {
    if (visible) {
      setLoadingCategories(true);
      expenseService
        .getCategories()
        .then((fresh) => {
          if (fresh && fresh.length > 0) {
            setCategoryList(fresh);
            if (!editingItem && !selectedCatId) {
              setSelectedCatId(fresh[0].id);
              setTitle(fresh[0].name || fresh[0].title || '');
            }
          }
        })
        .catch((err) => {
          console.warn('Failed to load dynamic categories in modal:', err);
        })
        .finally(() => {
          setLoadingCategories(false);
        });
    }
  }, [visible]);

  // Convert "DD/MM/YYYY" to "YYYY-MM-DD"
  const toIsoDate = (dStr: string): string => {
    if (!dStr) return new Date().toISOString().split('T')[0];
    if (dStr.includes('/')) {
      const parts = dStr.split('/');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    return dStr;
  };

  // Convert "YYYY-MM-DD" to "DD/MM/YYYY"
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

  // Populate form on open
  useEffect(() => {
    if (visible) {
      if (editingItem) {
        setSelectedCatId(editingItem.category_id || (editingItem.category?.id as any) || null);
        setTitle(editingItem.title || editingItem.category?.name || '');
        setAmount(String(editingItem.amount || ''));
        setInvoiceNo(editingItem.invoice_no || editingItem.reference_no || '');
        setPartyName(editingItem.party_name || editingItem.description || '');
        setPayBy(editingItem.pay_by || loggedInUserName);
        setPaymentType(editingItem.payment_type || (editingItem.payment_method === 'Cash' ? 'Offline' : 'Online'));
        setReferenceNo(editingItem.reference_no || '');
        setRemark(editingItem.remark || '');
        setExpenseDate(toDisplayDate(editingItem.date || editingItem.expense_date));
      } else {
        const activeList = categoryList.length > 0 ? categoryList : categories;
        const defaultCat = activeList.length > 0 ? activeList[0] : DEFAULT_FALLBACK_CATEGORIES[0];
        setSelectedCatId(defaultCat ? defaultCat.id : 1);
        setTitle(defaultCat ? (defaultCat.name || defaultCat.title || '') : '');
        setAmount('');
        setInvoiceNo('');
        setPartyName('');
        setPayBy(loggedInUserName);
        setPaymentType('Online');
        setReferenceNo('');
        setRemark('');
        setExpenseDate(toDisplayDate(null));
      }
      setIsSubmitting(false);
    }
  }, [visible, editingItem?.id, loggedInUserName, categoryList.length]);

  const handleSave = async () => {
    if (!title.trim()) {
      showWarningToast('Required Field', 'Please select an Expense Title from master list.');
      return;
    }
    if (!amount.trim() || Number(amount) <= 0) {
      showWarningToast('Required Field', 'Please enter a valid expense amount.');
      return;
    }
    if (!invoiceNo.trim()) {
      showWarningToast('Required Field', 'Please enter the invoice or bill number.');
      return;
    }
    if (!partyName.trim()) {
      showWarningToast('Required Field', 'Please enter the party or vendor name.');
      return;
    }
    if (paymentType === 'Online' && !referenceNo.trim()) {
      showWarningToast('Required Field', 'Reference No (UTR / Txn ID) is required for Online payment.');
      return;
    }

    const catId = selectedCatId || (categories.length > 0 ? categories[0].id : 1);
    const isoDate = toIsoDate(expenseDate);

    // Matches exact description structure from web ERP: "Party Name - Remark / Invoice"
    const descriptionText = partyName.trim()
      ? `${partyName.trim()}${remark.trim() ? ` - ${remark.trim()}` : ''}`
      : (remark.trim() || title.trim());

    const payload: CreateExpensePayload = {
      expense_date: isoDate,
      category_id: Number(catId),
      title: title.trim(),
      description: descriptionText,
      amount: parseFloat(amount),
      payment_method: paymentType === 'Offline' ? 'Cash' : 'Bank Transfer',
      reference_no: paymentType === 'Online' ? referenceNo.trim() : (invoiceNo.trim() || undefined),
      status: 'Paid',
    };

    try {
      setIsSubmitting(true);
      await onSubmit(payload, Boolean(editingItem));
      triggerHaptic('notificationSuccess');
      showSuccessToast(
        editingItem ? 'Expense updated successfully!' : `Expense for "${partyName}" recorded successfully!`
      );
      onClose();
    } catch (err: any) {
      console.error('Submit Expense Error:', err);
      const errMsg =
        err.response?.data?.message ||
        (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(', ') : null) ||
        'Failed to save expense record.';
      showErrorToast(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categoryList.filter((c) =>
    !categorySearch.trim() ||
    (c.name || c.title || '').toLowerCase().includes(categorySearch.trim().toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: isDark ? '#131C27' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : colors.border,
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
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.headerIconBox,
                  { backgroundColor: isDark ? 'rgba(88, 99, 42, 0.25)' : '#EFF3DF' },
                ]}
              >
                <Receipt size={20} color={colors.primary} />
              </View>
              <View>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: isDark ? '#F1F5F9' : '#0F172A' },
                  ]}
                >
                  {editingItem ? 'Edit Expense Entry' : 'Add Expense Entry'}
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

          {/* Form Body */}
          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={[
              styles.formContent,
              keyboardVisible && { paddingBottom: 60 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Row 1: Expense Title & Amount */}
            <View style={styles.fieldRow}>
              {/* Expense Title (Category Master Dropdown) */}
              <View style={styles.fieldCol}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: isDark ? '#E2E8F0' : '#1E293B' },
                  ]}
                >
                  Expense Title <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[
                    styles.selectBox,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      borderColor: isDark ? '#334155' : '#CBD5E1',
                    },
                  ]}
                  onPress={() => setShowCategoryPicker(true)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.selectValue,
                      { color: isDark ? '#F1F5F9' : '#0F172A' },
                    ]}
                    numberOfLines={1}
                  >
                    {title || 'Select Category...'}
                  </Text>
                  <ChevronDown size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                </TouchableOpacity>
                <Text style={styles.helperText}>Master Category Title</Text>
              </View>

              {/* Amount */}
              <View style={styles.fieldCol}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: isDark ? '#E2E8F0' : '#1E293B' },
                  ]}
                >
                  Amount (₹) <Text style={styles.required}>*</Text>
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
                  <View
                    style={[
                      styles.currencyPrefix,
                      { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.currencySymbol,
                        { color: isDark ? '#CBD5E1' : '#334155' },
                      ]}
                    >
                      ₹
                    </Text>
                  </View>
                  <TextInput
                    style={[
                      styles.currencyInput,
                      { color: isDark ? '#F1F5F9' : '#0F172A' },
                    ]}
                    placeholder="0.00"
                    placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                  />
                </View>
              </View>
            </View>

            {/* Row 2: Invoice No & Expense Date */}
            <View style={styles.fieldRow}>
              {/* Invoice No */}
              <View style={styles.fieldCol}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: isDark ? '#E2E8F0' : '#1E293B' },
                  ]}
                >
                  Invoice No <Text style={styles.required}>*</Text>
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
                  value={invoiceNo}
                  onChangeText={setInvoiceNo}
                />
              </View>

              {/* Expense Date */}
              <View style={styles.fieldCol}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: isDark ? '#E2E8F0' : '#1E293B' },
                  ]}
                >
                  Expense Date <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[
                    styles.selectBox,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      borderColor: isDark ? '#334155' : '#CBD5E1',
                    },
                  ]}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.selectValue,
                      { color: isDark ? '#F1F5F9' : '#0F172A' },
                    ]}
                  >
                    {expenseDate}
                  </Text>
                  <Calendar size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Row 3: Party / Vendor Name & Pay By */}
            <View style={styles.fieldRow}>
              {/* Party / Vendor Name */}
              <View style={styles.fieldCol}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: isDark ? '#E2E8F0' : '#1E293B' },
                  ]}
                >
                  Party / Vendor Name <Text style={styles.required}>*</Text>
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
                  value={partyName}
                  onChangeText={setPartyName}
                />
              </View>

              {/* Pay By */}
              <View style={styles.fieldCol}>
                <View style={styles.labelWithBadgeRow}>
                  <Text
                    style={[
                      styles.fieldLabel,
                      { color: isDark ? '#E2E8F0' : '#1E293B' },
                    ]}
                  >
                    Pay By <Text style={styles.required}>*</Text>
                  </Text>
                  <View
                    style={[
                      styles.autoBadge,
                      { backgroundColor: isDark ? '#0F172A' : '#E0F2FE' },
                    ]}
                  >
                    <Text style={styles.autoBadgeText}>Auto-Detected</Text>
                  </View>
                </View>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: isDark ? '#0F172A' : '#F1F5F9',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                      color: isDark ? '#94A3B8' : '#475569',
                    },
                  ]}
                  value={payBy}
                  onChangeText={setPayBy}
                />
              </View>
            </View>

            {/* Row 4: Payment Type (Radio Options) */}
            <View style={styles.formSection}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: isDark ? '#E2E8F0' : '#1E293B' },
                ]}
              >
                Payment Type <Text style={styles.required}>*</Text>
              </Text>
              <View
                style={[
                  styles.radioGroup,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                  },
                ]}
              >
                {/* Option 1: Online */}
                <TouchableOpacity
                  style={[
                    styles.radioItem,
                    paymentType === 'Online' && styles.radioItemActive,
                  ]}
                  onPress={() => {
                    triggerHaptic('selection');
                    setPaymentType('Online');
                  }}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      paymentType === 'Online' && {
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    {paymentType === 'Online' && (
                      <View
                        style={[
                          styles.radioInner,
                          { backgroundColor: colors.primary },
                        ]}
                      />
                    )}
                  </View>
                  <CreditCard size={15} color={paymentType === 'Online' ? colors.primary : '#64748B'} />
                  <Text
                    style={[
                      styles.radioLabel,
                      { color: isDark ? '#F1F5F9' : '#0F172A' },
                      paymentType === 'Online' && {
                        color: colors.primary,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    Online (UPI / NEFT / Net Banking)
                  </Text>
                </TouchableOpacity>

                {/* Option 2: Offline */}
                <TouchableOpacity
                  style={[
                    styles.radioItem,
                    paymentType === 'Offline' && styles.radioItemActive,
                  ]}
                  onPress={() => {
                    triggerHaptic('selection');
                    setPaymentType('Offline');
                  }}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      paymentType === 'Offline' && {
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    {paymentType === 'Offline' && (
                      <View
                        style={[
                          styles.radioInner,
                          { backgroundColor: colors.primary },
                        ]}
                      />
                    )}
                  </View>
                  <Wallet size={15} color={paymentType === 'Offline' ? colors.primary : '#64748B'} />
                  <Text
                    style={[
                      styles.radioLabel,
                      { color: isDark ? '#F1F5F9' : '#0F172A' },
                      paymentType === 'Offline' && {
                        color: colors.primary,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    Offline (Cash)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Row 5: Conditional Online Transaction Details Card */}
            {paymentType === 'Online' && (
              <View
                style={[
                  styles.onlineDetailsCard,
                  {
                    backgroundColor: isDark
                      ? 'rgba(88, 99, 42, 0.1)'
                      : '#F8FBF0',
                    borderColor: isDark
                      ? 'rgba(88, 99, 42, 0.4)'
                      : '#DCE9A2',
                  },
                ]}
              >
                <View style={styles.cardHeaderRow}>
                  <ShieldCheck size={16} color={colors.primary} />
                  <Text
                    style={[
                      styles.cardHeaderTitle,
                      { color: colors.primary },
                    ]}
                  >
                    Online Transaction Details
                  </Text>
                </View>

                <View style={styles.fieldRow}>
                  {/* Reference No / UTR */}
                  <View style={styles.fieldCol}>
                    <Text
                      style={[
                        styles.fieldLabel,
                        { color: isDark ? '#E2E8F0' : '#1E293B' },
                      ]}
                    >
                      Reference No / UTR / Txn ID <Text style={styles.required}>*</Text>
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
                      value={referenceNo}
                      onChangeText={setReferenceNo}
                    />
                  </View>

                  {/* Remark */}
                  <View style={styles.fieldCol}>
                    <Text
                      style={[
                        styles.fieldLabel,
                        { color: isDark ? '#E2E8F0' : '#1E293B' },
                      ]}
                    >
                      Remark
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
                      value={remark}
                      onChangeText={setRemark}
                    />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Modal Footer */}
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
                  backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
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
                styles.saveBtn,
                { backgroundColor: colors.primary },
                isSubmitting && { opacity: 0.7 },
              ]}
              onPress={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.saveBtnText}>
                    {editingItem ? 'Save Changes' : 'Save Expense'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={showDatePicker}
        title="Select Expense Date"
        initialDate={toIsoDate(expenseDate)}
        allowFuture={true}
        allowPast={true}
        onClose={() => setShowDatePicker(false)}
        onSelectDate={(d) => {
          setExpenseDate(toDisplayDate(d));
          setShowDatePicker(false);
        }}
      />

      {/* Category Selection Modal (Keyboard Aware) */}
      <Modal
        visible={showCategoryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowCategoryPicker(false);
          setCategorySearch('');
        }}
      >
        <KeyboardAvoidingView
          style={styles.pickerOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => {
              setShowCategoryPicker(false);
              setCategorySearch('');
            }}
          />
          <View
            style={[
              styles.pickerContainer,
              {
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                paddingBottom: keyboardVisible ? 12 : Math.max(insets.bottom, 24),
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
                Select Expense Master Title
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCategoryPicker(false);
                  setCategorySearch('');
                }}
              >
                <X size={20} color={isDark ? '#94A3B8' : '#64748B'} />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.searchBox,
                {
                  backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                },
              ]}
            >
              <Search size={15} color={isDark ? '#94A3B8' : '#64748B'} />
              <TextInput
                style={[
                  styles.searchInput,
                  { color: isDark ? '#F1F5F9' : '#0F172A' },
                ]}
                placeholder="Search category master..."
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                value={categorySearch}
                onChangeText={setCategorySearch}
              />
              {categorySearch ? (
                <TouchableOpacity onPress={() => setCategorySearch('')}>
                  <X size={15} color={isDark ? '#94A3B8' : '#64748B'} />
                </TouchableOpacity>
              ) : null}
            </View>

            <ScrollView
              style={{ maxHeight: keyboardVisible ? 180 : 300 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {loadingCategories ? (
                <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={{ fontSize: 12, color: isDark ? '#94A3B8' : '#64748B', marginTop: 6 }}>
                    Loading categories...
                  </Text>
                </View>
              ) : filteredCategories.length === 0 ? (
                <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, color: isDark ? '#94A3B8' : '#64748B' }}>
                    No matching categories found
                  </Text>
                </View>
              ) : (
                filteredCategories.map((cat) => {
                  const isSelected = selectedCatId === cat.id;
                  return (
                    <TouchableOpacity
                      key={`cat-${cat.id}`}
                      style={[
                        styles.pickerItem,
                        isSelected && {
                          backgroundColor: isDark
                            ? 'rgba(88, 99, 42, 0.2)'
                            : '#EFF3DF',
                        },
                      ]}
                      onPress={() => {
                        setSelectedCatId(cat.id);
                        setTitle(cat.name || cat.title || '');
                        setShowCategoryPicker(false);
                        setCategorySearch('');
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          { color: isDark ? '#F1F5F9' : '#0F172A' },
                          isSelected && {
                            color: colors.primary,
                            fontWeight: '700',
                          },
                        ]}
                      >
                        {cat.name || cat.title}
                      </Text>
                      {isSelected && <Check size={18} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContainer: {
    borderRadius: 16,
    borderWidth: 1,
    maxHeight: '92%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16.5,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 11.5,
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  formScroll: {
    maxHeight: 520,
  },
  formContent: {
    padding: 18,
    gap: 14,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldCol: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  required: {
    color: '#EF4444',
  },
  labelWithBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  autoBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  autoBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#0284C7',
  },
  selectBox: {
    height: 44,
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectValue: {
    fontSize: 13.5,
    fontWeight: '600',
    flex: 1,
  },
  currencyInputRow: {
    height: 44,
    borderRadius: 9,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  currencyPrefix: {
    width: 36,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderColor: '#E2E8F0',
  },
  currencySymbol: {
    fontSize: 14,
    fontWeight: '700',
  },
  currencyInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 13.5,
    fontWeight: '700',
  },
  textInput: {
    height: 44,
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  helperText: {
    fontSize: 10.5,
    color: '#94A3B8',
    marginTop: 4,
  },
  formSection: {
    marginTop: 2,
  },
  radioGroup: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  radioItemActive: {
    backgroundColor: 'rgba(88, 99, 42, 0.08)',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  radioLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  onlineDetailsCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cardHeaderTitle: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    height: 42,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    height: 42,
    borderRadius: 9,
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
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
    marginBottom: 10,
  },
  pickerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
  },
  pickerItemText: {
    fontSize: 13.5,
  },
});
