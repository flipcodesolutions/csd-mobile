import React from 'react';
import {
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Calendar,
  Car,
  Clock,
  Edit3,
  FileText,
  IndianRupee,
  MessageCircle,
  Phone,
  RefreshCw,
  Shield,
  ShieldCheck,
  User,
  X,
} from 'lucide-react-native';
import { colors } from '../../../core/theme/colors';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { formatIndianCurrency } from '../insuranceService';
import { InsuranceRecord } from '../types';

interface InsuranceDetailModalProps {
  visible: boolean;
  record: InsuranceRecord | null;
  onClose: () => void;
  onEdit?: (record: InsuranceRecord) => void;
  onRenew?: (record: InsuranceRecord) => void;
}

export const InsuranceDetailModal: React.FC<InsuranceDetailModalProps> = ({
  visible,
  record,
  onClose,
  onEdit,
  onRenew,
}) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  if (!record) return null;

  const toDisplayDate = (isoStr?: string | null): string => {
    if (!isoStr) return '—';
    if (isoStr.includes('-')) {
      const parts = isoStr.split('T')[0].split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoStr;
  };

  const getDaysRemaining = () => {
    const expStr = record.policy_expiry_date || record.insurance_expire_date;
    if (!expStr) return null;
    const expDate = new Date(expStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expDate.setHours(0, 0, 0, 0);
    const diff = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysRemaining = getDaysRemaining();

  const getStatusBadge = () => {
    if (daysRemaining !== null) {
      if (daysRemaining < 0) {
        return { label: 'Expired', bg: '#FEE2E2', text: '#DC2626' };
      }
      if (daysRemaining <= 15) {
        return {
          label: daysRemaining === 0 ? 'Expires Today' : `Expires in ${daysRemaining}d`,
          bg: '#FEF3C7',
          text: '#D97706',
        };
      }
    }
    if (record.renewal_status === 'Renewed') {
      return { label: 'Renewed', bg: '#DBEAFE', text: '#2563EB' };
    }
    return { label: 'Active', bg: '#DCFCE7', text: '#16A34A' };
  };

  const statusBadge = getStatusBadge();

  const historyList =
    record.renewal_history && record.renewal_history.length > 0
      ? record.renewal_history
      : record.policy_number || record.insurance_company
      ? [
          {
            id: record.id,
            insurance_company: record.insurance_company || '—',
            policy_number: record.policy_number || '—',
            insurance_type: record.insurance_type || 'Comprehensive',
            policy_start_date:
              record.policy_start_date || record.delivery_date || '—',
            policy_expiry_date:
              record.policy_expiry_date ||
              record.insurance_expire_date ||
              '—',
            premium_amount: record.premium_amount || 0,
            renewed_at: record.created_at
              ? record.created_at.replace('T', ' ').slice(0, 16)
              : '—',
            notes:
              record.notes ||
              `Insurance policy linked for deal #${record.deal?.deal_number || record.deal_id || ''}`,
          },
        ]
      : [];

  const handleCall = () => {
    const phone = record.customer_phone || record.customer_number;
    if (phone) {
      triggerHaptic('impactLight');
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleWhatsApp = () => {
    const phone = record.customer_phone || record.customer_number;
    if (phone) {
      triggerHaptic('impactLight');
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const expDate = toDisplayDate(record.policy_expiry_date || record.insurance_expire_date);
      const text = encodeURIComponent(
        `Dear ${record.customer_name},\nThis is a friendly reminder regarding your vehicle insurance policy (#${record.policy_number || ''}) for ${record.model_variant || 'your vehicle'}, which expires on ${expDate}.\nPlease contact us to renew your policy.\n- Defence Autolink Team`
      );
      Linking.openURL(`https://wa.me/91${cleanPhone.slice(-10)}?text=${text}`);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: isDark ? '#131C27' : '#FFFFFF',
              borderColor: isDark ? 'rgba(217, 221, 204, 0.2)' : colors.border,
              paddingBottom: Math.max(insets.bottom, 16),
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
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <Shield size={20} color={colors.primary} />
              </View>
              <View style={styles.headerTextGroup}>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: isDark ? '#F1F5F9' : '#0F172A' },
                  ]}
                  numberOfLines={1}
                >
                  Policy Details
                </Text>
                <Text
                  style={[
                    styles.modalSubtitle,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                  numberOfLines={1}
                >
                  #{record.policy_number || 'POL-PENDING'}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusBadge.bg },
                ]}
              >
                <Text style={[styles.statusBadgeText, { color: statusBadge.text }]}>
                  {statusBadge.label}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.closeBtn}
              >
                <X size={20} color={isDark ? '#94A3B8' : '#64748B'} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Customer Information Section */}
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                },
              ]}
            >
              <View style={styles.sectionTitleRow}>
                <User size={15} color={colors.primary} />
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: isDark ? '#F1F5F9' : '#0F172A' },
                  ]}
                >
                  Customer Particulars
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name:</Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: isDark ? '#F1F5F9' : '#0F172A', fontWeight: '700' },
                  ]}
                >
                  {record.customer_name}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mobile:</Text>
                <View style={styles.phoneActionRow}>
                  <Text
                    style={[
                      styles.infoValue,
                      { color: isDark ? '#F1F5F9' : '#0F172A' },
                    ]}
                  >
                    {record.customer_phone || record.customer_number || '—'}
                  </Text>
                  {(record.customer_phone || record.customer_number) && (
                    <View style={styles.quickContactRow}>
                      <TouchableOpacity
                        onPress={handleCall}
                        style={[styles.contactPill, { backgroundColor: '#DCFCE7' }]}
                      >
                        <Phone size={13} color="#16A34A" />
                        <Text style={[styles.contactPillText, { color: '#16A34A' }]}>
                          Call
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleWhatsApp}
                        style={[styles.contactPill, { backgroundColor: '#D1FAE5' }]}
                      >
                        <MessageCircle size={13} color="#059669" />
                        <Text style={[styles.contactPillText, { color: '#059669' }]}>
                          WhatsApp
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>City / Location:</Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: isDark ? '#CBD5E1' : '#475569' },
                  ]}
                >
                  {record.customer_city || record.customer_address || '—'}
                </Text>
              </View>

              {record.customer_email && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Email:</Text>
                  <Text
                    style={[
                      styles.infoValue,
                      { color: isDark ? '#CBD5E1' : '#475569' },
                    ]}
                  >
                    {record.customer_email}
                  </Text>
                </View>
              )}
            </View>

            {/* Vehicle Details Section */}
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                },
              ]}
            >
              <View style={styles.sectionTitleRow}>
                <Car size={15} color={colors.orange} />
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: isDark ? '#F1F5F9' : '#0F172A' },
                  ]}
                >
                  Vehicle Information
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Model & Variant:</Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: isDark ? '#F1F5F9' : '#0F172A', fontWeight: '600' },
                  ]}
                >
                  {record.model_variant || record.vehicle_name || '—'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Reg / Vehicle #:</Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: isDark ? '#F1F5F9' : '#0F172A' },
                  ]}
                >
                  {record.vehicle_number || record.registration_number || '—'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>VIN / Chassis #:</Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: isDark ? '#CBD5E1' : '#475569' },
                  ]}
                >
                  {record.vin_chassis_number || '—'}
                </Text>
              </View>

              {record.engine_number && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Engine #:</Text>
                  <Text
                    style={[
                      styles.infoValue,
                      { color: isDark ? '#CBD5E1' : '#475569' },
                    ]}
                  >
                    {record.engine_number}
                  </Text>
                </View>
              )}
            </View>

            {/* Insurance Policy Particulars */}
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                },
              ]}
            >
              <View style={styles.sectionTitleRow}>
                <ShieldCheck size={15} color="#2563EB" />
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: isDark ? '#F1F5F9' : '#0F172A' },
                  ]}
                >
                  Policy Particulars
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Insurance Company:</Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: isDark ? '#F1F5F9' : '#0F172A', fontWeight: '700' },
                  ]}
                >
                  {record.insurance_company || '—'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Policy Number:</Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: colors.primary, fontWeight: '700' },
                  ]}
                >
                  {record.policy_number || '—'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Coverage Plan:</Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: isDark ? '#F1F5F9' : '#0F172A' },
                  ]}
                >
                  {record.insurance_type || 'Comprehensive'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Premium Amount:</Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: '#16A34A', fontWeight: '700', fontSize: 15 },
                  ]}
                >
                  ₹{formatIndianCurrency(record.premium_amount || 0)}
                </Text>
              </View>

              {record.idv_amount ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>IDV Amount:</Text>
                  <Text
                    style={[
                      styles.infoValue,
                      { color: isDark ? '#F1F5F9' : '#0F172A' },
                    ]}
                  >
                    ₹{formatIndianCurrency(record.idv_amount)}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Schedule & Renewal Dates */}
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                },
              ]}
            >
              <View style={styles.sectionTitleRow}>
                <Clock size={15} color="#D97706" />
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: isDark ? '#F1F5F9' : '#0F172A' },
                  ]}
                >
                  Dates & Schedule
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Policy Start Date:</Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: isDark ? '#F1F5F9' : '#0F172A' },
                  ]}
                >
                  {toDisplayDate(record.policy_start_date || record.delivery_date)}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Policy Expiry Date:</Text>
                <Text
                  style={[
                    styles.infoValue,
                    {
                      color: daysRemaining !== null && daysRemaining <= 15 ? '#DC2626' : isDark ? '#F1F5F9' : '#0F172A',
                      fontWeight: '700',
                    },
                  ]}
                >
                  {toDisplayDate(record.policy_expiry_date || record.insurance_expire_date)}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Reminder Date:</Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: isDark ? '#CBD5E1' : '#475569' },
                  ]}
                >
                  {toDisplayDate(record.reminder_date) ||
                    `${record.reminder_days_before || 15} Days Before Expiry`}
                </Text>
              </View>
            </View>

            {/* Notes */}
            {record.notes ? (
              <View
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                  },
                ]}
              >
                <View style={styles.sectionTitleRow}>
                  <FileText size={15} color={colors.primary} />
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: isDark ? '#F1F5F9' : '#0F172A' },
                    ]}
                  >
                    Remarks / Notes
                  </Text>
                </View>
                <Text
                  style={[
                    styles.notesText,
                    { color: isDark ? '#CBD5E1' : '#475569' },
                  ]}
                >
                  {record.notes}
                </Text>
              </View>
            ) : null}

            {/* Previous Policies & Renewal History */}
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                },
              ]}
            >
              <View style={styles.historyHeaderRow}>
                <View style={styles.sectionTitleRow}>
                  <Clock size={15} color={colors.primary} />
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: isDark ? '#F1F5F9' : '#0F172A' },
                    ]}
                  >
                    Previous Policies & Renewal History
                  </Text>
                </View>
                <View
                  style={[
                    styles.historyCountBadge,
                    {
                      backgroundColor: isDark
                        ? 'rgba(88, 99, 42, 0.25)'
                        : '#EFF3DF',
                      borderColor: isDark
                        ? 'rgba(88, 99, 42, 0.4)'
                        : '#DCE9A2',
                    },
                  ]}
                >
                  <Text style={styles.historyCountBadgeText}>
                    {historyList.length} Previous Policy Record(s)
                  </Text>
                </View>
              </View>

              {historyList.length > 0 ? (
                <View style={styles.historyList}>
                  {historyList.map((hist, idx) => (
                    <View
                      key={hist.id || idx}
                      style={[
                        styles.historyItemCard,
                        {
                          backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                          borderColor: isDark ? '#334155' : '#E2E8F0',
                        },
                      ]}
                    >
                      <View style={styles.historyTopRow}>
                        <View style={styles.historyIndexPill}>
                          <Text style={styles.historyIndexText}>#{idx + 1}</Text>
                        </View>
                        <Text
                          style={[
                            styles.historyCompanyText,
                            { color: isDark ? '#F1F5F9' : '#0F172A' },
                          ]}
                          numberOfLines={1}
                        >
                          {hist.insurance_company}
                        </Text>
                        <View style={styles.historyCoverageBadge}>
                          <Text style={styles.historyCoverageText}>
                            {hist.insurance_type || 'Comprehensive'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.historyDetailsGrid}>
                        <View style={styles.historyDetailCol}>
                          <Text style={styles.historyDetailLabel}>
                            Policy Number
                          </Text>
                          <Text style={styles.historyPolicyNum}>
                            {hist.policy_number || '—'}
                          </Text>
                        </View>

                        <View style={styles.historyDetailCol}>
                          <Text style={styles.historyDetailLabel}>Premium</Text>
                          <Text style={styles.historyPremiumText}>
                            ₹{formatIndianCurrency(hist.premium_amount || 0)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.historyDetailsGrid}>
                        <View style={styles.historyDetailCol}>
                          <Text style={styles.historyDetailLabel}>Period</Text>
                          <Text
                            style={[
                              styles.historyDetailVal,
                              { color: isDark ? '#CBD5E1' : '#475569' },
                            ]}
                          >
                            {toDisplayDate(hist.policy_start_date)} to{' '}
                            {toDisplayDate(hist.policy_expiry_date)}
                          </Text>
                        </View>

                        <View style={styles.historyDetailCol}>
                          <Text style={styles.historyDetailLabel}>
                            Renewed On
                          </Text>
                          <Text
                            style={[
                              styles.historyDetailVal,
                              { color: isDark ? '#94A3B8' : '#64748B' },
                            ]}
                          >
                            {hist.renewed_at || toDisplayDate(record.created_at)}
                          </Text>
                        </View>
                      </View>

                      {hist.notes ? (
                        <View style={styles.historyNotesBox}>
                          <Text style={styles.historyDetailLabel}>Remarks</Text>
                          <Text
                            style={[
                              styles.historyNotesText,
                              { color: isDark ? '#94A3B8' : '#64748B' },
                            ]}
                          >
                            {hist.notes}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyHistoryBox}>
                  <Text
                    style={[
                      styles.emptyHistoryText,
                      { color: isDark ? '#94A3B8' : '#64748B' },
                    ]}
                  >
                    No previous renewal history records yet. (This is the original policy)
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View
            style={[
              styles.modalFooter,
              { borderTopColor: isDark ? '#1E293B' : '#E2E8F0' },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.footerBtn,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                },
              ]}
              onPress={onClose}
            >
              <Text
                style={[
                  styles.footerBtnText,
                  { color: isDark ? '#CBD5E1' : '#475569' },
                ]}
              >
                Close
              </Text>
            </TouchableOpacity>

            {onEdit && (
              <TouchableOpacity
                style={[
                  styles.footerBtn,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#EFF3DF',
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => {
                  onClose();
                  onEdit(record);
                }}
              >
                <Edit3 size={15} color={colors.primary} />
                <Text
                  style={[
                    styles.footerBtnText,
                    { color: colors.primary, fontWeight: '700' },
                  ]}
                >
                  Edit
                </Text>
              </TouchableOpacity>
            )}

            {onRenew && (
              <TouchableOpacity
                style={[
                  styles.footerBtn,
                  { backgroundColor: colors.orange, borderColor: colors.orange },
                ]}
                onPress={() => {
                  onClose();
                  onRenew(record);
                }}
              >
                <RefreshCw size={15} color="#FFFFFF" />
                <Text style={[styles.footerBtnText, { color: '#FFFFFF', fontWeight: '700' }]}>
                  Renew Policy
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(88, 99, 42, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTextGroup: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    flexGrow: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  sectionCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    textAlign: 'right',
  },
  phoneActionRow: {
    alignItems: 'flex-end',
    gap: 4,
  },
  quickContactRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  contactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  contactPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  notesText: {
    fontSize: 13,
    lineHeight: 18,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 6,
  },
  historyCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  historyCountBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  historyList: {
    gap: 8,
  },
  historyItemCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    gap: 6,
  },
  historyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyIndexPill: {
    backgroundColor: 'rgba(88, 99, 42, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  historyIndexText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  historyCompanyText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  historyCoverageBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historyCoverageText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#334155',
  },
  historyDetailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  historyDetailCol: {
    flex: 1,
  },
  historyDetailLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginBottom: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  historyPolicyNum: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  historyPremiumText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
  historyDetailVal: {
    fontSize: 11,
    fontWeight: '500',
  },
  historyNotesBox: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 4,
  },
  historyNotesText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  emptyHistoryBox: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHistoryText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
  },
  footerBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
