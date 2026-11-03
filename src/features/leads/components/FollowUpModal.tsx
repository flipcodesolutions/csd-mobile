import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  Clock,
  Mail,
  MessageSquare,
  Phone,
  Sparkles,
  Store,
  Tag,
  User,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { StartAlignedInput } from '../../../shared';
import { CustomerLead } from '../types';
import { TimePickerModal } from './TimePickerModal';
import { DatePickerModal } from './DatePickerModal';

export const INTERACTION_TYPES = [
  { label: 'Phone Call', icon: Phone },
  { label: 'WhatsApp', icon: MessageSquare },
  { label: 'Showroom Walk-in', icon: Store },
  { label: 'Email', icon: Mail },
] as const;

export const CALL_OUTCOMES = [
  'Interested / Call Back',
  'Quotation Requested',
  'Negotiation / Price Discussion',
  'Not Reachable / Busy',
  'Lost to Competitor / Lost of Lead',
  'Deal Won / Booking',
] as const;

interface FollowUpModalProps {
  visible: boolean;
  lead: CustomerLead | null;
  onClose: () => void;
  onSubmit: (
    leadId: number,
    followUpData: {
      lead_id: number;
      type: string;
      outcome: string;
      follow_up_date: string;
      follow_up_time: string;
      next_follow_up_date: string;
      next_follow_up_time: string;
      notes: string;
      is_discount_requested: boolean;
      discount_amount: number | null;
      reason: string;
      customer_name?: string;
      phone?: string;
      status?: string;
    }
  ) => Promise<void>;
}

export const FollowUpModal: React.FC<FollowUpModalProps> = ({
  visible,
  lead,
  onClose,
  onSubmit,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [interactionType, setInteractionType] = useState<string>('Phone Call');
  const [outcome, setOutcome] = useState<string>('Interested / Call Back');

  // Dates & Times
  const [interactionDate, setInteractionDate] = useState('');
  const [interactionTime, setInteractionTime] = useState('02:30 PM');
  const [nextActionDate, setNextActionDate] = useState('');
  const [nextActionTime, setNextActionTime] = useState('10:00 AM');

  // Notes
  const [notes, setNotes] = useState('');

  // Picker states
  const [timePickerTarget, setTimePickerTarget] = useState<'interaction' | 'nextAction' | null>(null);
  const [datePickerTarget, setDatePickerTarget] = useState<'interaction' | 'nextAction' | null>(null);

  // Discount Request
  const [isDiscountRequested, setIsDiscountRequested] = useState(false);
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountReason, setDiscountReason] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible && lead) {
      setCustomerName(lead.name || '');
      setPhone(lead.phone || '');

      const today = new Date().toISOString().split('T')[0];
      const threeDaysLater = new Date(Date.now() + 86400000 * 3)
        .toISOString()
        .split('T')[0];

      setInteractionDate(today);
      setInteractionTime('02:30 PM');
      setNextActionDate(threeDaysLater);
      setNextActionTime('10:00 AM');

      setInteractionType('Phone Call');
      setOutcome('Interested / Call Back');
      setNotes('');
      setIsDiscountRequested(false);
      setDiscountAmount('');
      setDiscountReason('');
    }
  }, [visible, lead]);

  const handleSubmit = async () => {
    if (!lead) return;
    if (!notes.trim()) {
      Alert.alert('Required Field', 'Please enter call notes & conversation summary.');
      return;
    }
    if (isDiscountRequested && !discountAmount.trim()) {
      Alert.alert(
        'Required Field',
        'Please enter the requested discount amount in ₹.'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(lead.id, {
        lead_id: lead.id,
        type: interactionType,
        outcome,
        status: outcome,
        follow_up_date: interactionDate,
        follow_up_time: interactionTime,
        next_follow_up_date: nextActionDate,
        next_follow_up_time: nextActionTime,
        notes: notes.trim(),
        is_discount_requested: isDiscountRequested,
        discount_amount: isDiscountRequested
          ? parseFloat(discountAmount.replace(/,/g, '')) || null
          : null,
        reason: discountReason.trim(),
        customer_name: customerName,
        phone,
      });
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to log follow-up.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible || !lead) return null;

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
              styles.headerRow,
              { borderBottomColor: isDark ? '#1E293B' : '#F1F5F9' },
            ]}
          >
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                  Log Customer Follow-Up
                </Text>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: isDark
                        ? 'rgba(59, 130, 246, 0.15)'
                        : '#EFF6FF',
                      borderColor: isDark ? '#3B82F6' : '#BFDBFE',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: isDark ? '#60A5FA' : '#2563EB' },
                    ]}
                  >
                    DISCOUNT INTEGRATION
                  </Text>
                </View>
              </View>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                Record call interaction, outcomes & discount demands
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
            {/* Prospect Pre-filled Meta Card */}
            <View
              style={[
                styles.prospectCard,
                {
                  backgroundColor: isDark ? '#101726' : '#F8FAFC',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
            >
              <View style={styles.twoColRow}>
                <View style={styles.colCell}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    CUSTOMER NAME
                  </Text>
                  <StartAlignedInput
                    style={[
                      styles.inputDisabled,
                      {
                        backgroundColor: isDark ? '#162030' : '#F1F5F9',
                        borderColor: isDark ? '#1E293B' : '#E2E8F0',
                        color: colors.textPrimary,
                      },
                    ]}
                    value={customerName}
                    editable={false}
                  />
                </View>
                <View style={styles.colCell}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    PHONE NUMBER
                  </Text>
                  <StartAlignedInput
                    style={[
                      styles.inputDisabled,
                      {
                        backgroundColor: isDark ? '#162030' : '#F1F5F9',
                        borderColor: isDark ? '#1E293B' : '#E2E8F0',
                        color: colors.textPrimary,
                      },
                    ]}
                    value={phone}
                    editable={false}
                  />
                </View>
              </View>
            </View>

            {/* Interaction Type Selection */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                INTERACTION TYPE <Text style={styles.reqStar}>*</Text>
              </Text>
              <View style={styles.typesRow}>
                {INTERACTION_TYPES.map((t) => {
                  const isSel = interactionType === t.label;
                  const IconComp = t.icon;
                  return (
                    <TouchableOpacity
                      key={t.label}
                      style={[
                        styles.typeBtn,
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
                      onPress={() => setInteractionType(t.label)}
                    >
                      <IconComp
                        size={14}
                        color={isSel ? '#FFFFFF' : colors.textSecondary}
                        strokeWidth={2}
                      />
                      <Text
                        style={[
                          styles.typeBtnText,
                          {
                            color: isSel
                              ? '#FFFFFF'
                              : isDark
                              ? '#94A3B8'
                              : '#475569',
                          },
                        ]}
                      >
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Call Outcome */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                CALL OUTCOME <Text style={styles.reqStar}>*</Text>
              </Text>
              <View style={styles.outcomesGrid}>
                {CALL_OUTCOMES.map((oc) => {
                  const isSel = outcome === oc;
                  return (
                    <TouchableOpacity
                      key={oc}
                      style={[
                        styles.outcomeChip,
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
                      onPress={() => setOutcome(oc)}
                    >
                      <Text
                        style={[
                          styles.outcomeChipText,
                          {
                            color: isSel
                              ? '#FFFFFF'
                              : isDark
                              ? '#94A3B8'
                              : '#475569',
                          },
                        ]}
                      >
                        {oc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Interaction Date & Time */}
            <View style={styles.twoColRow}>
              <View style={styles.colCell}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  INTERACTION DATE
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
                    setDatePickerTarget('interaction');
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      color: interactionDate ? colors.textPrimary : colors.textMuted,
                      fontSize: 13,
                      fontWeight: '500',
                    }}
                  >
                    {interactionDate || 'YYYY-MM-DD'}
                  </Text>
                  <Calendar size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.colCell}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  INTERACTION TIME
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
                    setTimePickerTarget('interaction');
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      color: interactionTime ? colors.textPrimary : colors.textMuted,
                      fontSize: 13,
                      fontWeight: '600',
                    }}
                  >
                    {interactionTime || '02:30 PM'}
                  </Text>
                  <Clock size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Next Action Date & Time */}
            <View style={styles.twoColRow}>
              <View style={styles.colCell}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  NEXT ACTION DATE
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
                    setDatePickerTarget('nextAction');
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      color: nextActionDate ? colors.textPrimary : colors.textMuted,
                      fontSize: 13,
                      fontWeight: '500',
                    }}
                  >
                    {nextActionDate || 'YYYY-MM-DD'}
                  </Text>
                  <Calendar size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.colCell}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  NEXT ACTION TIME
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
                    setTimePickerTarget('nextAction');
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      color: nextActionTime ? colors.textPrimary : colors.textMuted,
                      fontSize: 13,
                      fontWeight: '600',
                    }}
                  >
                    {nextActionTime || '10:00 AM'}
                  </Text>
                  <Clock size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Call Notes & Conversation Summary */}
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
                placeholder="Key discussion points, variant preference, price sensitivity, next steps..."
                placeholderTextColor={colors.textMuted}
              />
            </View>

            {/* Discount Request Switch Card */}
            <View
              style={[
                styles.discountBox,
                {
                  backgroundColor: isDiscountRequested
                    ? isDark
                      ? 'rgba(234, 179, 8, 0.12)'
                      : '#FEFCE8'
                    : isDark
                    ? '#101726'
                    : '#F8FAFC',
                  borderColor: isDiscountRequested
                    ? isDark
                      ? '#EAB308'
                      : '#FDE047'
                    : isDark
                    ? '#1E293B'
                    : '#E2E8F0',
                },
              ]}
            >
              <View style={styles.discountSwitchRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Tag
                      size={15}
                      color={isDiscountRequested ? '#EAB308' : colors.textSecondary}
                      strokeWidth={2}
                    />
                    <Text
                      style={[
                        styles.discountTitle,
                        {
                          color: isDiscountRequested
                            ? isDark
                              ? '#FDE047'
                              : '#854D0E'
                            : colors.textPrimary,
                        },
                      ]}
                    >
                      Customer Demanded Discount?
                    </Text>
                  </View>
                  <Text style={[styles.discountSub, { color: colors.textSecondary }]}>
                    Sends approval notification to Sales Manager & Admin
                  </Text>
                </View>
                <Switch
                  value={isDiscountRequested}
                  onValueChange={(val) => {
                    triggerHaptic('selection');
                    setIsDiscountRequested(val);
                  }}
                  trackColor={{ false: '#71717A', true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* Conditional Discount Fields */}
              {isDiscountRequested && (
                <View style={styles.discountFields}>
                  <View style={styles.fieldGroup}>
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                      REQUESTED DISCOUNT AMOUNT (₹) <Text style={styles.reqStar}>*</Text>
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
                      value={discountAmount}
                      onChangeText={setDiscountAmount}
                      placeholder="e.g. 15000"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                      DISCOUNT REASON / JUSTIFICATION
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
                      value={discountReason}
                      onChangeText={setDiscountReason}
                      placeholder="e.g. Closing today if ₹15k dealer discount given"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer */}
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
              style={[styles.submitBtn, { backgroundColor: colors.primary }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Save Follow-Up Interaction</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Time Picker Modal */}
      <TimePickerModal
        visible={timePickerTarget !== null}
        title={
          timePickerTarget === 'interaction'
            ? 'Select Interaction Time'
            : 'Select Next Action Time'
        }
        initialTime={
          timePickerTarget === 'interaction' ? interactionTime : nextActionTime
        }
        onClose={() => setTimePickerTarget(null)}
        onSelectTime={(formattedTime) => {
          if (timePickerTarget === 'interaction') {
            setInteractionTime(formattedTime);
          } else if (timePickerTarget === 'nextAction') {
            setNextActionTime(formattedTime);
          }
        }}
      />

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={datePickerTarget !== null}
        title={
          datePickerTarget === 'interaction'
            ? 'Select Interaction Date'
            : 'Select Next Action Date'
        }
        initialDate={
          datePickerTarget === 'interaction' ? interactionDate : nextActionDate
        }
        allowFuture={true}
        onClose={() => setDatePickerTarget(null)}
        onSelectDate={(formattedDate) => {
          if (datePickerTarget === 'interaction') {
            setInteractionDate(formattedDate);
          } else if (datePickerTarget === 'nextAction') {
            setNextActionDate(formattedDate);
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
  headerRow: {
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
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  headerSubtitle: {
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
  prospectCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
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
  input: {
    height: 42,
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '600',
  },
  inputDisabled: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12,
    fontWeight: '600',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  colCell: {
    flex: 1,
  },
  typesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
    paddingHorizontal: 2,
  },
  typeBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  outcomesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  outcomeChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  outcomeChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inputMultiline: {
    minHeight: 70,
    borderRadius: 9,
    borderWidth: 1,
    padding: 10,
    fontSize: 12,
    fontWeight: '500',
    textAlignVertical: 'top',
  },
  discountBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 4,
    marginBottom: 10,
  },
  discountSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  discountTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  discountSub: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  discountFields: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150,150,150,0.3)',
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

export default FollowUpModal;
