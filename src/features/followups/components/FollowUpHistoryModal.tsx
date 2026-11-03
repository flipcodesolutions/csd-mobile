import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Calendar,
  CheckCircle,
  Clock,
  Hourglass,
  PhoneCall,
  Plus,
  User,
  X,
  XCircle,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { FollowUpItem } from '../types';
import { leadApi } from '../../leads/leadService';

export interface FollowUpHistoryModalProps {
  visible: boolean;
  item: FollowUpItem | null;
  onClose: () => void;
  onLogNewFollowUp: (item: FollowUpItem) => void;
  onCall: (phone: string) => void;
}

export const FollowUpHistoryModal: React.FC<FollowUpHistoryModalProps> = ({
  visible,
  item,
  onClose,
  onLogNewFollowUp,
  onCall,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!item) return;
    setLoading(true);
    try {
      const leadId = item.lead_id || item.id;
      if (leadId) {
        const res = await leadApi.getFollowUps(leadId);
        const list = Array.isArray(res) ? res : res?.data || [];
        if (list.length > 0) {
          setHistoryList(list);
          return;
        }
      }
      setHistoryList([item]);
    } catch {
      setHistoryList([item]);
    } finally {
      setLoading(false);
    }
  }, [item]);

  useEffect(() => {
    if (visible && item) {
      fetchHistory();
    } else {
      setHistoryList([]);
    }
  }, [visible, item, fetchHistory]);

  if (!visible || !item) return null;

  const totalCalls = Math.max(item.calls_count || 1, historyList.length);

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
              backgroundColor: isDark ? '#101726' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
              paddingBottom: Math.max(insets.bottom + 12, 20),
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
                    backgroundColor: isDark ? '#162030' : '#F8FAFC',
                    borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  },
                ]}
              >
                <Clock size={18} color={colors.primary} strokeWidth={2.2} />
              </View>

              <View style={{ marginLeft: 10, flexShrink: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text
                    style={[
                      styles.sheetTitle,
                      { color: isDark ? '#F8FAFC' : '#0D1554' },
                    ]}
                    numberOfLines={1}
                  >
                    {item.customer_name}
                  </Text>
                  <View
                    style={[
                      styles.callsBadge,
                      {
                        backgroundColor: isDark ? 'rgba(88, 99, 42, 0.25)' : '#F5F8EE',
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    <Text style={[styles.callsBadgeText, { color: colors.primary }]}>
                      {totalCalls} {totalCalls === 1 ? 'Interaction' : 'Interactions'}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[
                    styles.sheetSub,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                  numberOfLines={1}
                >
                  {item.phone} {item.city ? `• ${item.city}` : ''} {item.vehicle ? `• ${item.vehicle}` : ''}
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
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color={colors.textSecondary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Timeline History Body */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Loading previous follow-up calls...
                </Text>
              </View>
            ) : historyList.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={{ fontSize: 24, marginBottom: 6 }}>📞</Text>
                <Text style={[styles.emptyTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                  No previous interactions found
                </Text>
                <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                  This is the first interaction recorded for this lead.
                </Text>
              </View>
            ) : (
              <View style={styles.timelineList}>
                {historyList.map((entry, idx) => {
                  const outcomeText =
                    entry.outcome || entry.status || entry.last_call_outcome || 'Interested / Call Back';
                  const dateStr =
                    entry.follow_up_date ||
                    entry.date ||
                    (entry.created_at ? entry.created_at.split('T')[0] : 'Today');
                  const timeStr = entry.follow_up_time || entry.time || '';
                  const typeText = entry.type || entry.interaction_type || 'Phone Call';
                  const repName =
                    entry.rep ||
                    entry.user_name ||
                    entry.user?.name ||
                    entry.assigned_user_name ||
                    item.rep ||
                    'Admin User';

                  const isDiscountReq = Boolean(
                    entry.is_discount_requested ||
                    entry.discount_amount ||
                    entry.requested_discount
                  );
                  const discAmt = entry.discount_amount || entry.requested_discount;
                  const discStatus =
                    entry.discount_status || entry.discount_approval_status || 'pending';

                  return (
                    <View
                      key={entry.id || idx}
                      style={[
                        styles.timelineCard,
                        {
                          backgroundColor: isDark ? '#162030' : '#F8FAFC',
                          borderColor: isDark ? '#1E293B' : '#E2E8F0',
                        },
                      ]}
                    >
                      {/* Interaction Index & Date Header */}
                      <View style={styles.entryHeader}>
                        <View style={styles.entryIndexBadge}>
                          <Text style={styles.entryIndexText}>#{historyList.length - idx}</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Calendar size={11} color={colors.textSecondary} />
                            <Text
                              style={[
                                styles.entryDateText,
                                { color: isDark ? '#E2E8F0' : '#1E293B', marginLeft: 4 },
                              ]}
                            >
                              {dateStr} {timeStr ? `• ${timeStr}` : ''}
                            </Text>
                          </View>
                          <Text style={[styles.entryTypeText, { color: colors.textSecondary }]}>
                            via {typeText}
                          </Text>
                        </View>

                        {/* Outcome Pill */}
                        <View
                          style={[
                            styles.outcomePill,
                            {
                              backgroundColor: isDark ? 'rgba(217, 119, 6, 0.15)' : '#FEF3C7',
                              borderColor: isDark ? '#D97706' : '#FDE68A',
                            },
                          ]}
                        >
                          <Text style={styles.outcomePillText}>{outcomeText}</Text>
                        </View>
                      </View>

                      {/* Notes / Conversation Summary */}
                      {entry.notes ? (
                        <View
                          style={[
                            styles.notesBox,
                            {
                              backgroundColor: isDark ? '#101726' : '#FFFFFF',
                              borderColor: isDark ? '#1E293B' : '#F1F5F9',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.notesContent,
                              { color: isDark ? '#CBD5E1' : '#334155' },
                            ]}
                          >
                            "{entry.notes}"
                          </Text>
                        </View>
                      ) : null}

                      {/* Discount Row if any */}
                      {isDiscountReq && discAmt ? (
                        <View style={styles.discountRow}>
                          <View
                            style={[
                              styles.discPill,
                              {
                                backgroundColor:
                                  discStatus === 'approved'
                                    ? isDark
                                      ? 'rgba(16, 185, 129, 0.15)'
                                      : '#DCFCE7'
                                    : discStatus === 'rejected'
                                    ? isDark
                                      ? 'rgba(239, 68, 68, 0.15)'
                                      : '#FEE2E2'
                                    : isDark
                                    ? 'rgba(217, 119, 6, 0.15)'
                                    : '#FEF3C7',
                                borderColor:
                                  discStatus === 'approved'
                                    ? '#16A34A'
                                    : discStatus === 'rejected'
                                    ? '#DC2626'
                                    : '#D97706',
                              },
                            ]}
                          >
                            {discStatus === 'approved' ? (
                              <CheckCircle size={10} color="#16A34A" strokeWidth={2.5} style={{ marginRight: 3 }} />
                            ) : discStatus === 'rejected' ? (
                              <XCircle size={10} color="#DC2626" strokeWidth={2.5} style={{ marginRight: 3 }} />
                            ) : (
                              <Hourglass size={10} color="#D97706" strokeWidth={2.5} style={{ marginRight: 3 }} />
                            )}
                            <Text
                              style={[
                                styles.discText,
                                {
                                  color:
                                    discStatus === 'approved'
                                      ? '#16A34A'
                                      : discStatus === 'rejected'
                                      ? '#DC2626'
                                      : '#D97706',
                                },
                              ]}
                            >
                              {discStatus === 'approved'
                                ? `Discount ₹${Number(discAmt).toLocaleString('en-IN')} (Approved)`
                                : discStatus === 'rejected'
                                ? 'Discount Request Rejected'
                                : `Discount ₹${Number(discAmt).toLocaleString('en-IN')} (Pending Approval)`}
                            </Text>
                          </View>
                        </View>
                      ) : null}

                      {/* Footer: Next Action Schedule & Logged By */}
                      <View style={styles.entryFooter}>
                        {entry.next_follow_up_date ? (
                          <View style={styles.nextScheduleRow}>
                            <Clock size={11} color="#D97706" strokeWidth={2.2} />
                            <Text style={styles.nextScheduleText}>
                              Next: {entry.next_follow_up_date} {entry.next_follow_up_time || '10:00 AM'}
                            </Text>
                          </View>
                        ) : null}

                        <View style={styles.repRow}>
                          <User size={10} color={colors.textSecondary} />
                          <Text
                            style={[
                              styles.repName,
                              { color: isDark ? '#94A3B8' : '#64748B', marginLeft: 3 },
                            ]}
                            numberOfLines={1}
                          >
                            {repName}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Bottom Actions Toolbar */}
          <View
            style={[
              styles.bottomToolbar,
              {
                backgroundColor: isDark ? '#162030' : '#F8FAFC',
                borderTopColor: isDark ? '#1E293B' : '#E2E8F0',
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.actionBtnSecondary,
                {
                  backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                },
              ]}
              onPress={() => {
                triggerHaptic('impactMedium');
                onCall(item.phone);
              }}
              activeOpacity={0.7}
            >
              <PhoneCall size={14} color="#16A34A" strokeWidth={2.2} />
              <Text
                style={[
                  styles.actionBtnSecondaryText,
                  { color: isDark ? '#F1F5F9' : '#0F172A', marginLeft: 6 },
                ]}
              >
                Call Customer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtnPrimary,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => {
                triggerHaptic('impactLight');
                onClose();
                setTimeout(() => {
                  onLogNewFollowUp(item);
                }, 120);
              }}
              activeOpacity={0.8}
            >
              <Plus size={15} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.actionBtnPrimaryText}>
                Log Follow-Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    maxHeight: '85%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: 8,
  },
  grabHandleRow: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  grabHandle: {
    width: 36,
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
    marginRight: 8,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  callsBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  callsBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  sheetSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    maxHeight: 460,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
  },
  emptyBox: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 11.5,
    marginTop: 4,
  },
  timelineList: {
    gap: 12,
  },
  timelineCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  entryIndexBadge: {
    backgroundColor: '#0D1554',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  entryIndexText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
  },
  entryDateText: {
    fontSize: 12,
    fontWeight: '700',
  },
  entryTypeText: {
    fontSize: 10.5,
    fontWeight: '500',
    marginTop: 1,
    marginLeft: 15,
  },
  outcomePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  outcomePillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#D97706',
  },
  notesBox: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  notesContent: {
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  discountRow: {
    marginTop: 8,
  },
  discPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  discText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  entryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.15)',
    flexWrap: 'wrap',
    gap: 6,
  },
  nextScheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nextScheduleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  repRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  repName: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  bottomToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionBtnSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionBtnPrimary: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 10,
    gap: 4,
  },
  actionBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
