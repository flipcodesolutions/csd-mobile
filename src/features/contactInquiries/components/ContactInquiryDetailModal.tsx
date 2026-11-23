import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {
  Calendar,
  Clock,
  Mail,
  MessageCircle,
  Phone,
  Tag,
  Trash2,
  User,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { ContactInquiry } from '../types';
import { formatInquiryDate } from './ContactInquiryCard';

interface ContactInquiryDetailModalProps {
  visible: boolean;
  inquiry: ContactInquiry | null;
  onClose: () => void;
  onCall: (phone: string) => void;
  onEmail: (email: string, subject?: string) => void;
  onWhatsApp: (phone: string, name?: string) => void;
  onDelete: (item: ContactInquiry) => void;
}

export const ContactInquiryDetailModal: React.FC<ContactInquiryDetailModalProps> = ({
  visible,
  inquiry,
  onClose,
  onCall,
  onEmail,
  onWhatsApp,
  onDelete,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  if (!visible || !inquiry) return null;

  const isNew =
    (inquiry.status || '').toLowerCase() === 'new' ||
    (inquiry.status || '').toLowerCase() === 'unread';

  const formattedDate = formatInquiryDate(inquiry.created_at);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View
              style={[
                styles.modalContent,
                {
                  backgroundColor: isDark ? '#101726' : '#FFFFFF',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  paddingBottom: Math.max(insets.bottom + 16, 24),
                },
              ]}
            >
              {/* Modal Drag Handle */}
              <View style={styles.dragHandleContainer}>
                <View
                  style={[
                    styles.dragHandle,
                    { backgroundColor: isDark ? '#334155' : '#CBD5E1' },
                  ]}
                />
              </View>

              {/* Modal Header */}
              <View style={styles.header}>
                <View style={styles.headerTitleGroup}>
                  <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                    Inquiry Details
                  </Text>
                  <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                    Web Contact Form Submission
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={onClose}
                  style={[
                    styles.closeBtn,
                    { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                  ]}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={18} color={colors.textSecondary} strokeWidth={2.4} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {/* 1. Customer Snapshot Card */}
                <View
                  style={[
                    styles.customerCard,
                    {
                      backgroundColor: isDark ? '#162032' : '#F8FAFC',
                      borderColor: isDark ? '#23324A' : '#E2E8F0',
                    },
                  ]}
                >
                  {/* Name and Status */}
                  <View style={styles.nameRow}>
                    <View style={styles.userIconCircle}>
                      <User size={16} color="#58632A" strokeWidth={2.4} />
                    </View>
                    <Text
                      style={[styles.customerName, { color: colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      {inquiry.name || 'Anonymous Customer'}
                    </Text>
                    {isNew ? (
                      <View style={styles.badgeNew}>
                        <View style={styles.newDot} />
                        <Text style={styles.badgeNewText}>New</Text>
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.badgeRead,
                          {
                            backgroundColor: isDark ? '#1E293B' : '#EDF2F7',
                            borderColor: isDark ? '#334155' : '#CBD5E1',
                          },
                        ]}
                      >
                        <Text style={[styles.badgeReadText, { color: colors.textSecondary }]}>
                          Read
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Phone Item */}
                  {Boolean(inquiry.phone) && (
                    <TouchableOpacity
                      style={styles.detailRow}
                      onPress={() => onCall(inquiry.phone)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.iconBoxOlive}>
                        <Phone size={13} color="#58632A" strokeWidth={2.4} />
                      </View>
                      <Text style={[styles.detailValueBold, { color: '#58632A' }]}>
                        {inquiry.phone}
                      </Text>
                      <Text style={styles.touchHint}>Tap to Call</Text>
                    </TouchableOpacity>
                  )}

                  {/* Email Item */}
                  {Boolean(inquiry.email) && (
                    <TouchableOpacity
                      style={styles.detailRow}
                      onPress={() => onEmail(inquiry.email, inquiry.subject)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.iconBoxBlue}>
                        <Mail size={13} color="#2563EB" strokeWidth={2.4} />
                      </View>
                      <Text
                        style={[styles.detailValue, { color: '#2563EB' }]}
                        numberOfLines={1}
                      >
                        {inquiry.email}
                      </Text>
                      <Text style={styles.touchHint}>Tap to Mail</Text>
                    </TouchableOpacity>
                  )}

                  {/* Date & Time */}
                  <View style={styles.detailRowStatic}>
                    <View style={styles.iconBoxGray}>
                      <Clock size={13} color="#64748B" strokeWidth={2.4} />
                    </View>
                    <Text style={[styles.detailValueMuted, { color: colors.textSecondary }]}>
                      Received: {formattedDate}
                    </Text>
                  </View>
                </View>

                {/* 2. Subject Badge */}
                {Boolean(inquiry.subject) && (
                  <View style={styles.sectionBlock}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                      SUBJECT / TOPIC
                    </Text>
                    <View
                      style={[
                        styles.subjectBox,
                        {
                          backgroundColor: isDark ? '#1C2612' : '#F4F7EB',
                          borderColor: isDark ? '#3A481B' : '#DCE9A2',
                        },
                      ]}
                    >
                      <Tag size={13} color="#58632A" strokeWidth={2.4} />
                      <Text style={styles.subjectText}>{inquiry.subject}</Text>
                    </View>
                  </View>
                )}

                {/* 3. Full Message Container */}
                <View style={styles.sectionBlock}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                    INQUIRY MESSAGE
                  </Text>
                  <View
                    style={[
                      styles.messageContainer,
                      {
                        backgroundColor: isDark ? '#162032' : '#F8FAFC',
                        borderColor: isDark ? '#23324A' : '#E2E8F0',
                      },
                    ]}
                  >
                    <Text
                      style={[styles.messageFullText, { color: colors.textPrimary }]}
                      selectable
                    >
                      {inquiry.message || 'No message content provided.'}
                    </Text>
                  </View>
                </View>

                {/* 4. Action Buttons (Big Call, WhatsApp, Email, Delete) */}
                <View style={styles.actionsContainer}>
                  {Boolean(inquiry.phone) && (
                    <TouchableOpacity
                      onPress={() => {
                        triggerHaptic('impactMedium');
                        onCall(inquiry.phone);
                      }}
                      activeOpacity={0.8}
                      style={[styles.primaryActionBtn, { backgroundColor: '#58632A' }]}
                    >
                      <Phone size={16} color="#FFFFFF" strokeWidth={2.4} />
                      <Text style={styles.primaryActionBtnText}>Call Customer</Text>
                    </TouchableOpacity>
                  )}

                  <View style={styles.secondaryActionsRow}>
                    {Boolean(inquiry.phone) && (
                      <TouchableOpacity
                        onPress={() => {
                          triggerHaptic('impactLight');
                          onWhatsApp(inquiry.phone, inquiry.name);
                        }}
                        activeOpacity={0.8}
                        style={[
                          styles.secondaryActionBtn,
                          {
                            backgroundColor: isDark ? '#122D1F' : '#ECFDF5',
                            borderColor: isDark ? '#1D5335' : '#A7F3D0',
                          },
                        ]}
                      >
                        <MessageCircle size={15} color="#16A34A" strokeWidth={2.4} />
                        <Text style={[styles.secondaryActionText, { color: '#16A34A' }]}>
                          WhatsApp
                        </Text>
                      </TouchableOpacity>
                    )}

                    {Boolean(inquiry.email) && (
                      <TouchableOpacity
                        onPress={() => {
                          triggerHaptic('impactLight');
                          onEmail(inquiry.email, inquiry.subject);
                        }}
                        activeOpacity={0.8}
                        style={[
                          styles.secondaryActionBtn,
                          {
                            backgroundColor: isDark ? '#10223D' : '#EFF6FF',
                            borderColor: isDark ? '#1D3B6B' : '#DBEAFE',
                          },
                        ]}
                      >
                        <Mail size={15} color="#2563EB" strokeWidth={2.4} />
                        <Text style={[styles.secondaryActionText, { color: '#2563EB' }]}>
                          Reply Email
                        </Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      onPress={() => {
                        triggerHaptic('impactHeavy');
                        onDelete(inquiry);
                      }}
                      activeOpacity={0.8}
                      style={[
                        styles.deleteActionBtn,
                        {
                          backgroundColor: isDark ? '#3B1219' : '#FEF2F2',
                          borderColor: isDark ? '#631B28' : '#FECACA',
                        },
                      ]}
                    >
                      <Trash2 size={15} color="#EF4444" strokeWidth={2.4} />
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
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
    maxHeight: '88%',
    paddingHorizontal: 20,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 8,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    padding: 7,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingVertical: 16,
  },
  customerCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EEF2E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  badgeNew: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 12,
  },
  newDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
    marginRight: 4,
  },
  badgeNewText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  badgeRead: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeReadText: {
    fontSize: 11,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  detailRowStatic: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  iconBoxOlive: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#EEF2E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  iconBoxBlue: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  iconBoxGray: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  detailValueBold: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  detailValueMuted: {
    fontSize: 13,
    fontWeight: '500',
  },
  touchHint: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  sectionBlock: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  subjectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  subjectText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#58632A',
  },
  messageContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    minHeight: 100,
  },
  messageFullText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400',
  },
  actionsContainer: {
    marginTop: 8,
    gap: 10,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
    shadowColor: '#58632A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryActionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  deleteActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

