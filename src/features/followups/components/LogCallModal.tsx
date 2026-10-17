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
  ChevronDown,
  DollarSign,
  MessageSquare,
  PhoneCall,
  PhoneForwarded,
  ShieldAlert,
  User,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { StartAlignedInput } from '../../../shared';
import { CustomerLead } from '../../leads/types';
import {
  CreateFollowUpPayload,
  FollowUpItem,
  InteractionType,
  OutcomeStatus,
} from '../types';

export const OUTCOME_OPTIONS: OutcomeStatus[] = [
  'Interested / Call Back',
  'Quotation Requested',
  'Ready for Booking',
  'Not Answering / Busy',
  'Price Too High',
  'Bought Competitor Car',
  'Showroom Visit Done',
];

export const INTERACTION_TYPES: InteractionType[] = [
  'Phone Call',
  'Showroom Visit',
  'WhatsApp',
  'Email',
];

interface LogCallModalProps {
  visible: boolean;
  prefillItem?: FollowUpItem | null;
  leads: CustomerLead[];
  onClose: () => void;
  onSubmit: (payload: CreateFollowUpPayload) => Promise<void>;
}

export const LogCallModal: React.FC<LogCallModalProps> = ({
  visible,
  prefillItem,
  leads,
  onClose,
  onSubmit,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Form State
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [outcome, setOutcome] = useState<OutcomeStatus>('Interested / Call Back');
  const [interactionType, setInteractionType] = useState<InteractionType>('Phone Call');
  const [nextDate, setNextDate] = useState('');
  const [nextTime, setNextTime] = useState('10:00 AM');
  const [notes, setNotes] = useState('');

  // Discount Approval Request Sub-panel
  const [requestDiscount, setRequestDiscount] = useState(false);
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountReason, setDiscountReason] = useState('');

  const [showLeadPicker, setShowLeadPicker] = useState(false);
  const [leadSearchQuery, setLeadSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      if (prefillItem) {
        setSelectedLeadId(prefillItem.lead_id || null);
        setCustomerName(prefillItem.customer_name || '');
        setPhone(prefillItem.phone || '');
        setVehicle(prefillItem.vehicle || '');
        setOutcome(
          (prefillItem.status as OutcomeStatus) || 'Interested / Call Back'
        );
        setInteractionType(prefillItem.type || 'Phone Call');
        setNextDate(
          prefillItem.next_follow_up_date ||
            new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
        );
        setNextTime(prefillItem.next_follow_up_time || '10:00 AM');
        setNotes(prefillItem.notes ? `Re: ${prefillItem.notes}` : '');
        setRequestDiscount(!!prefillItem.is_discount_requested);
        setDiscountAmount(
          prefillItem.discount_amount ? prefillItem.discount_amount.toString() : ''
        );
        setDiscountReason(prefillItem.discount_reason || '');
      } else {
        setSelectedLeadId(null);
        setCustomerName('');
        setPhone('');
        setVehicle('');
        setOutcome('Interested / Call Back');
        setInteractionType('Phone Call');
        setNextDate(
          new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
        );
        setNextTime('10:00 AM');
        setNotes('');
        setRequestDiscount(false);
        setDiscountAmount('');
        setDiscountReason('');
      }
      setShowLeadPicker(false);
      setLeadSearchQuery('');
    }
  }, [visible, prefillItem]);

  const handleSelectLead = (ld: CustomerLead) => {
    triggerHaptic('selection');
    setSelectedLeadId(ld.id);
    setCustomerName(ld.name);
    setPhone(ld.phone);
    setVehicle(
      ld.model_variant ||
        `${ld.brand_name || ''} ${ld.model_name || ''}`.trim()
    );
    setShowLeadPicker(false);
  };

  const handleSubmit = async () => {
    if (!customerName.trim()) {
      Alert.alert('Required Field', 'Please enter customer name.');
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      Alert.alert(
        'Required Field',
        'Please enter a valid 10-digit mobile phone number.'
      );
      return;
    }
    if (!notes.trim()) {
      Alert.alert(
        'Required Field',
        'Please enter call discussion summary & notes.'
      );
      return;
    }
    if (requestDiscount && (!discountAmount || parseFloat(discountAmount) <= 0)) {
      Alert.alert(
        'Required Field',
        'Please enter the requested discount amount in ₹.'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      triggerHaptic('impactMedium');

      const today = new Date();
      const followUpDate = today.toISOString().split('T')[0];
      const followUpTime = today.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      const payload: CreateFollowUpPayload = {
        lead_id: selectedLeadId,
        customer_name: customerName.trim(),
        phone: phone.trim(),
        follow_up_date: followUpDate,
        follow_up_time: followUpTime,
        type: interactionType,
        notes: notes.trim(),
        next_follow_up_date: nextDate || followUpDate,
        next_follow_up_time: nextTime || '10:00 AM',
        status: outcome,
        lead_status_name: requestDiscount ? 'Discount Pending' : 'In Follow-Up',
        is_discount_requested: requestDiscount,
        discount_amount: requestDiscount ? parseFloat(discountAmount) : undefined,
        reason: requestDiscount ? discountReason.trim() : undefined,
      };

      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to log call interaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredLeads = leads.filter((l) => {
    if (!leadSearchQuery) return true;
    const q = leadSearchQuery.toLowerCase();
    return (
      l.name.toLowerCase().includes(q) ||
      l.phone.includes(q) ||
      (l.model_variant && l.model_variant.toLowerCase().includes(q))
    );
  });

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

          {/* Header */}
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
              <View style={{ marginLeft: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text
                    style={[
                      styles.sheetTitle,
                      { color: isDark ? '#FFFFFF' : '#0F172A' },
                    ]}
                  >
                    Log Call Interaction
                  </Text>
                  <View
                    style={[
                      styles.deskBadge,
                      {
                        backgroundColor: isDark
                          ? 'rgba(88, 99, 42, 0.25)'
                          : 'rgba(88, 99, 42, 0.1)',
                      },
                    ]}
                  >
                    <Text style={[styles.deskBadgeText, { color: colors.primary }]}>
                      CALL DESK
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.sheetSub,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                >
                  Defence Autolink • Customer Interaction Hub
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeBtn,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={16} color={colors.textSecondary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={[
              styles.formContent,
              { paddingBottom: Math.max(insets.bottom + 20, 36) },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* 1. Choose Existing Customer Lead (Optional) */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                CHOOSE EXISTING CUSTOMER LEAD (OPTIONAL)
              </Text>
              <TouchableOpacity
                style={[
                  styles.selectorTrigger,
                  {
                    backgroundColor: isDark ? '#101726' : '#FFFFFF',
                    borderColor: isDark ? '#1E293B' : '#CBD5E1',
                  },
                ]}
                onPress={() => {
                  triggerHaptic('impactLight');
                  setShowLeadPicker(!showLeadPicker);
                }}
                activeOpacity={0.7}
              >
                <User size={14} color={colors.textSecondary} strokeWidth={2} />
                <Text
                  style={[
                    styles.selectorTriggerText,
                    {
                      color: selectedLeadId
                        ? colors.textPrimary
                        : colors.textMuted,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {selectedLeadId
                    ? `${customerName} (${phone}) - ${vehicle || 'Vehicle'}`
                    : 'Tap to select an existing lead...'}
                </Text>
                <ChevronDown
                  size={14}
                  color={colors.textSecondary}
                  strokeWidth={2}
                />
              </TouchableOpacity>

              {/* Collapsible Lead Search & Picker */}
              {showLeadPicker && (
                <View
                  style={[
                    styles.pickerContainer,
                    {
                      backgroundColor: isDark ? '#0B111E' : '#F8FAFC',
                      borderColor: isDark ? '#1E293B' : '#CBD5E1',
                    },
                  ]}
                >
                  <TextInput
                    style={[
                      styles.pickerSearchInput,
                      {
                        backgroundColor: isDark ? '#162030' : '#FFFFFF',
                        borderColor: isDark ? '#1E293B' : '#E2E8F0',
                        color: colors.textPrimary,
                      },
                    ]}
                    value={leadSearchQuery}
                    onChangeText={setLeadSearchQuery}
                    placeholder="Search lead by name, phone or model..."
                    placeholderTextColor={colors.textMuted}
                  />

                  <ScrollView
                    style={{ maxHeight: 180 }}
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                  >
                    <TouchableOpacity
                      style={[
                        styles.pickerItem,
                        { borderBottomColor: isDark ? '#1E293B' : '#E2E8F0' },
                      ]}
                      onPress={() => {
                        setSelectedLeadId(null);
                        setCustomerName('');
                        setPhone('');
                        setVehicle('');
                        setShowLeadPicker(false);
                      }}
                    >
                      <Text style={[styles.pickerItemName, { color: colors.textMuted }]}>
                        — None (Enter Customer Manually) —
                      </Text>
                    </TouchableOpacity>

                    {filteredLeads.map((ld) => (
                      <TouchableOpacity
                        key={ld.id}
                        style={[
                          styles.pickerItem,
                          {
                            borderBottomColor: isDark ? '#1E293B' : '#E2E8F0',
                            backgroundColor:
                              selectedLeadId === ld.id
                                ? isDark
                                  ? 'rgba(88, 99, 42, 0.2)'
                                  : '#F5F8EE'
                                : 'transparent',
                          },
                        ]}
                        onPress={() => handleSelectLead(ld)}
                      >
                        <Text
                          style={[
                            styles.pickerItemName,
                            { color: colors.textPrimary },
                          ]}
                          numberOfLines={1}
                        >
                          {ld.name} ({ld.phone})
                        </Text>
                        <Text
                          style={[
                            styles.pickerItemSub,
                            { color: colors.textSecondary },
                          ]}
                          numberOfLines={1}
                        >
                          {ld.model_variant || `${ld.brand_name || ''} ${ld.model_name || ''}`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* 2. Customer Name & Phone Number */}
            <View style={styles.twoColRow}>
              <View style={[styles.fieldGroup, { flex: 1.1 }]}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  CUSTOMER NAME <Text style={styles.reqStar}>*</Text>
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
                  value={customerName}
                  onChangeText={setCustomerName}
                  placeholder="e.g. Maj. Rohit Sharma"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  PHONE NUMBER <Text style={styles.reqStar}>*</Text>
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
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                  placeholder="9876543210"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            {/* 3. Call Outcome Selection (7 Web Options) */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                CALL OUTCOME MILESTONE <Text style={styles.reqStar}>*</Text>
              </Text>
              <View style={styles.chipsRow}>
                {OUTCOME_OPTIONS.map((item) => {
                  const isActive = outcome === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.chipOption,
                        {
                          backgroundColor: isActive
                            ? colors.primary
                            : isDark
                            ? '#101726'
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
                        setOutcome(item);
                      }}
                      activeOpacity={0.7}
                    >
                      {isActive && (
                        <Check
                          size={12}
                          color="#FFFFFF"
                          strokeWidth={2.5}
                          style={{ marginRight: 4 }}
                        />
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
                            fontWeight: isActive ? '700' : '500',
                          },
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 4. Interaction Channel (4 Web Options) */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                INTERACTION CHANNEL <Text style={styles.reqStar}>*</Text>
              </Text>
              <View style={styles.chipsRow}>
                {INTERACTION_TYPES.map((type) => {
                  const isActive = interactionType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.chipOption,
                        {
                          backgroundColor: isActive
                            ? colors.primary
                            : isDark
                            ? '#101726'
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
                        setInteractionType(type);
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
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 5. Next Action Date & Next Action Time */}
            <View style={styles.twoColRow}>
              <View style={[styles.fieldGroup, { flex: 1.2 }]}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  NEXT ACTION DATE
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
                  value={nextDate}
                  onChangeText={setNextDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  NEXT ACTION TIME
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
                  value={nextTime}
                  onChangeText={setNextTime}
                  placeholder="10:00 AM"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            {/* 6. Discussion Summary & Notes */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                CALL NOTES & CONVERSATION SUMMARY <Text style={styles.reqStar}>*</Text>
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
                textAlignVertical="top"
                placeholder="Enter summary of discussion, objections, delivery timeline, or loan sanction details..."
                placeholderTextColor={colors.textMuted}
              />
            </View>

            {/* 7. Special Discount Approval Sub-panel (Web Section 7 & 8) */}
            <View
              style={[
                styles.discountBox,
                {
                  backgroundColor: isDark ? '#101726' : '#F8FAFC',
                  borderColor: requestDiscount
                    ? isDark
                      ? '#F59E0B'
                      : '#FDE68A'
                    : isDark
                    ? '#1E293B'
                    : '#E2E8F0',
                },
              ]}
            >
              <TouchableOpacity
                style={styles.discountToggleRow}
                activeOpacity={0.8}
                onPress={() => {
                  triggerHaptic('selection');
                  setRequestDiscount(!requestDiscount);
                }}
              >
                <View style={styles.discountHeaderLeft}>
                  <ShieldAlert
                    size={18}
                    color={requestDiscount ? '#F59E0B' : colors.textSecondary}
                    strokeWidth={2.2}
                  />
                  <View style={{ marginLeft: 8 }}>
                    <Text
                      style={[
                        styles.discountTitle,
                        { color: isDark ? '#F8FAFC' : '#0F172A' },
                      ]}
                    >
                      Customer Demanded Discount?
                    </Text>
                    <Text
                      style={[
                        styles.discountSubtitle,
                        { color: isDark ? '#94A3B8' : '#64748B' },
                      ]}
                    >
                      Dispatches approval alert to Sales Manager & Admin
                    </Text>
                  </View>
                </View>

                <Switch
                  value={requestDiscount}
                  onValueChange={(val) => {
                    triggerHaptic('selection');
                    setRequestDiscount(val);
                  }}
                  trackColor={{
                    false: isDark ? '#334155' : '#CBD5E1',
                    true: colors.primary,
                  }}
                  thumbColor="#FFFFFF"
                />
              </TouchableOpacity>

              {requestDiscount && (
                <View style={styles.discountFields}>
                  <View style={styles.fieldGroup}>
                    <Text
                      style={[
                        styles.fieldLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      REQUESTED DISCOUNT AMOUNT (₹) <Text style={styles.reqStar}>*</Text>
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
                      value={discountAmount}
                      onChangeText={setDiscountAmount}
                      keyboardType="numeric"
                      placeholder="e.g. 25000"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text
                      style={[
                        styles.fieldLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      DISCOUNT REASON / JUSTIFICATION
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
                      value={discountReason}
                      onChangeText={setDiscountReason}
                      placeholder="e.g. Officer comparing with local dealer; ready to book immediately"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.footerRow}>
              <TouchableOpacity
                style={[
                  styles.cancelBtn,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                  },
                ]}
                onPress={onClose}
                activeOpacity={0.7}
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
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <PhoneCall size={16} color="#FFFFFF" strokeWidth={2.2} />
                    <Text style={styles.submitBtnText}>
                      Log Call Interaction
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
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
    maxHeight: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  grabHandleRow: {
    alignItems: 'center',
    paddingVertical: 8,
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
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImg: {
    width: 24,
    height: 24,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  deskBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  deskBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sheetSub: {
    fontSize: 10.5,
    fontWeight: '500',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formScroll: {
    flexGrow: 0,
  },
  formContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 14,
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
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '500',
  },
  selectorTrigger: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  selectorTriggerText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
  },
  pickerContainer: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 8,
    marginTop: 4,
    gap: 8,
  },
  pickerSearchInput: {
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12,
  },
  pickerItem: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
  },
  pickerItemName: {
    fontSize: 12,
    fontWeight: '700',
  },
  pickerItemSub: {
    fontSize: 10,
    marginTop: 1,
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
  discountBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  discountToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  discountHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  discountTitle: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  discountSubtitle: {
    fontSize: 10,
    marginTop: 1,
  },
  discountFields: {
    marginTop: 8,
    gap: 10,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
