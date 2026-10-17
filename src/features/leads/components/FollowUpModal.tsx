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
import {
  Building2,
  Calendar,
  Check,
  Clock,
  Mail,
  MessageCircle,
  Phone,
} from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { CustomerLead } from '../types';

export const INTERACTION_TYPES = [
  { label: 'Phone Call', icon: Phone },
  { label: 'Showroom Visit', icon: Building2 },
  { label: 'WhatsApp', icon: MessageCircle },
  { label: 'Email', icon: Mail },
] as const;

export const OUTCOME_STATUSES = [
  'Interested / Call Back',
  'Quotation Requested',
  'Ready for Booking',
  'Not Answering / Busy',
  'Price Too High',
  'Bought Competitor Car',
  'Showroom Visit Done',
] as const;

export type InteractionType = (typeof INTERACTION_TYPES)[number]['label'];
export type OutcomeStatus = (typeof OUTCOME_STATUSES)[number];

interface FollowUpModalProps {
  visible: boolean;
  lead: CustomerLead | null;
  onClose: () => void;
  onSubmit: (
    leadId: number,
    followUpData: {
      type: string;
      outcome: string;
      status: string;
      follow_up_date: string;
      follow_up_time?: string;
      next_follow_up_date?: string;
      next_follow_up_time?: string;
      notes: string;
      customer_name?: string;
      phone?: string;
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

  const [interactionType, setInteractionType] =
    useState<InteractionType>('Phone Call');
  const [outcomeStatus, setOutcomeStatus] =
    useState<OutcomeStatus>('Interested / Call Back');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('11:00 AM');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setFollowUpDate(
        new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
      );
      setFollowUpTime('11:00 AM');
      setInteractionType('Phone Call');
      setOutcomeStatus('Interested / Call Back');
      setNotes('');
    }
  }, [visible, lead]);

  const handleSubmit = async () => {
    if (!lead) return;
    if (!notes.trim()) {
      Alert.alert('Required Field', 'Please enter follow-up discussion summary & next action.');
      return;
    }

    try {
      setIsSubmitting(true);
      triggerHaptic('impactMedium');
      await onSubmit(lead.id, {
        type: interactionType,
        outcome: outcomeStatus,
        status: outcomeStatus,
        follow_up_date: followUpDate,
        follow_up_time: followUpTime,
        next_follow_up_date: followUpDate,
        next_follow_up_time: followUpTime,
        notes: notes.trim(),
        customer_name: lead.name,
        phone: lead.phone,
      });
      setNotes('');
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to log follow-up activity.');
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
              styles.modalBox,
              {
                backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                borderColor: isDark ? '#1E293B' : '#E2E8F0',
              },
            ]}
          >
            {/* Header */}
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: isDark ? '#1E293B' : '#F1F5F9' },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  Log Follow-Up Activity
                </Text>
                <Text
                  style={[styles.modalSub, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {lead.name} (#{lead.id}) • {lead.phone}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.closeBtn,
                  {
                    backgroundColor: isDark ? '#162030' : '#F1F5F9',
                    borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  },
                ]}
                hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                activeOpacity={0.7}
                onPress={() => {
                  triggerHaptic('impactLight');
                  onClose();
                }}
              >
                <Text style={[styles.closeIcon, { color: colors.textPrimary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Form Content */}
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* 1. Interaction Type */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  INTERACTION TYPE
                </Text>
                <View style={styles.typeGrid}>
                  {INTERACTION_TYPES.map((item) => {
                    const isSel = interactionType === item.label;
                    const IconComp = item.icon;
                    return (
                      <TouchableOpacity
                        key={item.label}
                        style={[
                          styles.typeChip,
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
                              : '#E2E8F0',
                          },
                        ]}
                        onPress={() => {
                          triggerHaptic('selection');
                          setInteractionType(item.label);
                        }}
                        activeOpacity={0.7}
                      >
                        {isSel ? (
                          <Check size={14} color="#FFFFFF" strokeWidth={2.6} />
                        ) : (
                          <IconComp
                            size={14}
                            color={isDark ? '#94A3B8' : '#475569'}
                            strokeWidth={2}
                          />
                        )}
                        <Text
                          style={[
                            styles.typeChipText,
                            {
                              color: isSel
                                ? '#FFFFFF'
                                : isDark
                                ? '#CBD5E1'
                                : '#334155',
                              fontWeight: isSel ? '700' : '600',
                            },
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 2. Follow-Up Outcome Status */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  FOLLOW-UP OUTCOME STATUS
                </Text>
                <View style={styles.statusChipsRow}>
                  {OUTCOME_STATUSES.map((st) => {
                    const isSel = outcomeStatus === st;
                    return (
                      <TouchableOpacity
                        key={st}
                        style={[
                          styles.statusChip,
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
                              : '#E2E8F0',
                          },
                        ]}
                        onPress={() => {
                          triggerHaptic('selection');
                          setOutcomeStatus(st);
                        }}
                        activeOpacity={0.7}
                      >
                        {isSel && (
                          <Check
                            size={12}
                            color="#FFFFFF"
                            strokeWidth={2.6}
                            style={{ marginRight: 4 }}
                          />
                        )}
                        <Text
                          style={[
                            styles.statusChipText,
                            {
                              color: isSel
                                ? '#FFFFFF'
                                : isDark
                                ? '#CBD5E1'
                                : '#334155',
                              fontWeight: isSel ? '700' : '500',
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

              {/* 3. Next Scheduled Follow-Up Date & Time */}
              <View style={styles.dateTimeRow}>
                {/* Date */}
                <View style={[styles.fieldGroup, { flex: 1.2 }]}>
                  <View style={styles.labelRow}>
                    <Calendar size={12} color={colors.textSecondary} strokeWidth={2} />
                    <Text
                      style={[styles.fieldLabel, { color: colors.textSecondary, marginLeft: 4 }]}
                    >
                      NEXT FOLLOW-UP DATE
                    </Text>
                  </View>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#101726' : '#FFFFFF',
                        borderColor: isDark ? '#1E293B' : '#CBD5E1',
                        color: colors.textPrimary,
                      },
                    ]}
                    value={followUpDate}
                    onChangeText={setFollowUpDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                {/* Time */}
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <View style={styles.labelRow}>
                    <Clock size={12} color={colors.textSecondary} strokeWidth={2} />
                    <Text
                      style={[styles.fieldLabel, { color: colors.textSecondary, marginLeft: 4 }]}
                    >
                      TIME
                    </Text>
                  </View>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#101726' : '#FFFFFF',
                        borderColor: isDark ? '#1E293B' : '#CBD5E1',
                        color: colors.textPrimary,
                      },
                    ]}
                    value={followUpTime}
                    onChangeText={setFollowUpTime}
                    placeholder="11:00 AM"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              {/* 4. Discussion Summary & Next Action */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  DISCUSSION SUMMARY & NEXT ACTION <Text style={styles.reqStar}>*</Text>
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
                  placeholder="Spoke with officer. Interested in Brezza ZXi automatic. Requested CSD on-road quotation by WhatsApp..."
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </ScrollView>

            {/* Footer */}
            <View
              style={[
                styles.modalFooter,
                { borderTopColor: isDark ? '#1E293B' : '#F1F5F9' },
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
                <Text style={[styles.cancelText, { color: colors.textPrimary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveBtn,
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
                  <Text style={styles.saveText}>Save Follow-Up Activity</Text>
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
    justifyContent: 'center',
    padding: 16,
  },
  modalBox: {
    maxHeight: '90%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 11,
    fontWeight: '500',
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
  scrollArea: {
    maxHeight: 460,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  reqStar: {
    color: '#EF4444',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  typeChipText: {
    fontSize: 12,
  },
  statusChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusChipText: {
    fontSize: 11,
  },
  dateTimeRow: {
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
    minHeight: 76,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    fontSize: 12,
    fontWeight: '500',
    textAlignVertical: 'top',
  },
  modalFooter: {
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
  cancelText: {
    fontSize: 12,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});

export default FollowUpModal;
