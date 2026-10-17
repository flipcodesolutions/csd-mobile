import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../core/theme/ThemeContext';
import { CustomerLead } from '../types';

interface QuickViewLeadModalProps {
  visible: boolean;
  lead: CustomerLead | null;
  onClose: () => void;
  onCall: (phone: string) => void;
  onConvertDeal: (lead: CustomerLead) => void;
  onSendQuotation: (lead: CustomerLead) => void;
  onView360: (lead: CustomerLead) => void;
}

export const QuickViewLeadModal: React.FC<QuickViewLeadModalProps> = ({
  visible,
  lead,
  onClose,
  onCall,
  onConvertDeal,
  onSendQuotation,
  onView360,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  if (!visible || !lead) return null;

  const sourceTitle =
    lead.source?.title ||
    lead.source?.name ||
    lead.source_name ||
    lead.lead_source ||
    'Direct';

  const isHot = lead.priority === 'Hot';
  const isWarm = lead.priority === 'Warm';

  const isDealWon =
    lead.is_converted ||
    lead.status_name === 'Deal Won' ||
    lead.status_name === 'Booked' ||
    lead.status_name === 'Delivered';

  const formattedDate = lead.created_at
    ? lead.created_at.split('T')[0]
    : '2026-10-10';

  const handleAction = (actionFn: (lead: CustomerLead) => void) => {
    onClose();
    setTimeout(() => {
      actionFn(lead);
    }, 120);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View
              style={[
                styles.modalContent,
                {
                  backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  paddingBottom: Math.max(insets.bottom, 16) + 6,
                },
              ]}
            >
              {/* Drag Handle */}
              <View style={styles.dragHandleWrapper}>
                <View
                  style={[
                    styles.dragHandle,
                    { backgroundColor: isDark ? '#334155' : '#CBD5E1' },
                  ]}
                />
              </View>

              {/* Modal Header */}
              <View
                style={[
                  styles.headerRow,
                  { borderBottomColor: isDark ? '#1E293B' : '#F1F5F9' },
                ]}
              >
                <View>
                  <Text
                    style={[styles.headerTitle, { color: colors.textPrimary }]}
                  >
                    Quick Prospect View
                  </Text>
                  <Text
                    style={[styles.headerId, { color: colors.textSecondary }]}
                  >
                    Lead #{lead.id} • Created {formattedDate}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                  style={[
                    styles.closeBtn,
                    { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.closeBtnText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Prospect Details Card */}
              <View
                style={[
                  styles.profileCard,
                  {
                    backgroundColor: isDark ? '#101726' : '#F8FAFC',
                    borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  },
                ]}
              >
                {/* Name & Priority */}
                <View style={styles.cardHeaderRow}>
                  <Text
                    style={[styles.clientName, { color: colors.textPrimary }]}
                  >
                    {lead.name}
                  </Text>
                  <View style={styles.badgesCluster}>
                    <View
                      style={[
                        styles.priorityBadge,
                        {
                          backgroundColor: isHot
                            ? isDark
                              ? 'rgba(239, 68, 68, 0.15)'
                              : '#FEF2F2'
                            : isWarm
                            ? isDark
                              ? 'rgba(245, 158, 11, 0.15)'
                              : '#FFFBEB'
                            : isDark
                            ? '#1E293B'
                            : '#F1F5F9',
                          borderColor: isHot
                            ? isDark
                              ? 'rgba(239, 68, 68, 0.4)'
                              : '#FECDD3'
                            : isWarm
                            ? isDark
                              ? 'rgba(245, 158, 11, 0.35)'
                              : '#FDE68A'
                            : isDark
                            ? '#334155'
                            : '#CBD5E1',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.priorityText,
                          {
                            color: isHot
                              ? isDark
                                ? '#F87171'
                                : '#DC2626'
                              : isWarm
                              ? isDark
                                ? '#FBBF24'
                                : '#D97706'
                              : colors.textSecondary,
                          },
                        ]}
                      >
                        {isHot ? '🔥 Hot' : isWarm ? '☀️ Warm' : '❄️ Cold'}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.stageBadge,
                        {
                          backgroundColor: isDealWon
                            ? isDark
                              ? 'rgba(16, 185, 129, 0.15)'
                              : '#ECFDF5'
                            : isDark
                            ? '#1E293B'
                            : '#F1F5F9',
                          borderColor: isDealWon
                            ? isDark
                              ? 'rgba(16, 185, 129, 0.35)'
                              : '#A7F3D0'
                            : isDark
                            ? '#334155'
                            : '#CBD5E1',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.stageText,
                          {
                            color: isDealWon
                              ? isDark
                                ? '#34D399'
                                : '#059669'
                              : colors.textSecondary,
                          },
                        ]}
                      >
                        {lead.status_name || (isDealWon ? 'Deal Won' : 'New')}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Contact & Location */}
                <View style={styles.contactRow}>
                  <Text
                    style={[styles.contactItem, { color: colors.textSecondary }]}
                  >
                    📞 {lead.phone}
                  </Text>
                  <Text style={[styles.bullet, { color: colors.borderSubtle }]}>
                    •
                  </Text>
                  <Text
                    style={[styles.contactItem, { color: colors.textSecondary }]}
                  >
                    📍 {lead.city || 'CSD Beneficiary'}
                  </Text>
                </View>

                {/* Vehicle Requirement & Lead Source Badge */}
                <View style={styles.vehicleBlock}>
                  <Text
                    style={[styles.vehicleTitle, { color: colors.textPrimary }]}
                  >
                    🚗 {lead.model_variant || 'Vehicle Inquiry'}
                  </Text>
                  <View style={styles.tagPillsRow}>
                    <View
                      style={[
                        styles.brandPill,
                        {
                          backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.brandPillText,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {lead.brand_name || lead.vehicle_segment}
                      </Text>
                    </View>

                    {/* Lead Source Badge (Matching Web) */}
                    <View
                      style={[
                        styles.sourcePill,
                        {
                          backgroundColor: isDark ? '#0F172A' : '#1E293B',
                        },
                      ]}
                    >
                      <Text style={styles.sourcePillText}>
                        📡 {sourceTitle}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Assigned Executive */}
                <View style={styles.assignRow}>
                  <Text
                    style={[styles.assignLabel, { color: colors.textSecondary }]}
                  >
                    Assigned Executive:
                  </Text>
                  <Text
                    style={[styles.assignValue, { color: colors.textPrimary }]}
                  >
                    👤 {lead.assigned_user_name || 'Admin User'}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={[
                    styles.primaryCallBtn,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => {
                    onClose();
                    onCall(lead.phone);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryCallText}>✆ Call Now</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.secondaryActionBtn,
                    {
                      borderColor: colors.primary,
                      backgroundColor: isDark
                        ? 'rgba(189, 207, 121, 0.12)'
                        : '#F5F8EE',
                    },
                  ]}
                  onPress={() => handleAction(onConvertDeal)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.secondaryActionText,
                      { color: isDark ? colors.primary : colors.primaryDark },
                    ]}
                  >
                    🏆 Convert Deal
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.auxRow}>
                <TouchableOpacity
                  style={[
                    styles.auxBtn,
                    {
                      backgroundColor: isDark ? '#101726' : '#F8FAFC',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                  onPress={() => handleAction(onSendQuotation)}
                >
                  <Text style={styles.auxBtnText}>🧾 Send Quotation</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.auxBtn,
                    {
                      backgroundColor: isDark ? '#101726' : '#F8FAFC',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                  onPress={() => handleAction(onView360)}
                >
                  <Text style={styles.auxBtnText}>👤 Full 360° Profile</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  dragHandleWrapper: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    includeFontPadding: false,
  },
  headerId: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    includeFontPadding: false,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  profileCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  clientName: {
    fontSize: 17,
    fontWeight: '800',
    includeFontPadding: false,
  },
  badgesCluster: {
    flexDirection: 'row',
    gap: 6,
  },
  priorityBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
    includeFontPadding: false,
  },
  stageBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  stageText: {
    fontSize: 11,
    fontWeight: '600',
    includeFontPadding: false,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  contactItem: {
    fontSize: 13,
    fontWeight: '600',
    includeFontPadding: false,
  },
  bullet: {
    fontSize: 12,
  },
  vehicleBlock: {
    marginVertical: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
  },
  vehicleTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
    includeFontPadding: false,
  },
  tagPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  brandPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  brandPillText: {
    fontSize: 11,
    fontWeight: '600',
    includeFontPadding: false,
  },
  sourcePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sourcePillText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700',
    includeFontPadding: false,
  },
  assignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  assignLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  assignValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  primaryCallBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCallText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    includeFontPadding: false,
  },
  secondaryActionBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '800',
    includeFontPadding: false,
  },
  auxRow: {
    flexDirection: 'row',
    gap: 10,
  },
  auxBtn: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auxBtnText: {
    fontSize: 12,
    fontWeight: '700',
    includeFontPadding: false,
  },
});
