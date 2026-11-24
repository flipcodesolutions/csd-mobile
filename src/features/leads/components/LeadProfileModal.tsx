import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Award,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Edit3,
  Eye,
  FileText,
  FolderKanban,
  Gift,
  Mail,
  MapPin,
  Phone,
  PhoneCall,
  Receipt,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { CustomerLead } from '../types';
import { leadApi } from '../leadService';
import { quotationApi, quotationService } from '../../quotations/quotationService';
import followUpService from '../../followups/followUpService';
import { isValidFollowUpOutcome, normalizeOutcome } from '../../followups/types';

interface LeadProfileModalProps {
  visible: boolean;
  lead: CustomerLead | null;
  onClose: () => void;
  onCall: (phone: string) => void;
  onConvertToDeal: (lead: CustomerLead) => void;
  onLogFollowUp?: (lead: CustomerLead) => void;
  onSendQuotation?: (lead: CustomerLead) => void;
  onEditLead?: (lead: CustomerLead) => void;
}

export const LeadProfileModal: React.FC<LeadProfileModalProps> = ({
  visible,
  lead,
  onClose,
  onCall,
  onConvertToDeal,
  onLogFollowUp,
  onSendQuotation,
  onEditLead,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  // Full Lead details from GET /api/leads/:id
  const [fullLead, setFullLead] = useState<any>(null);

  // Accordion Expand/Collapse States
  const [followUpsOpen, setFollowUpsOpen] = useState(true);
  const [quotationsOpen, setQuotationsOpen] = useState(true);
  const [assignmentsOpen, setAssignmentsOpen] = useState(true);
  const [insuranceOpen, setInsuranceOpen] = useState(true);
  const [dealLedgerOpen, setDealLedgerOpen] = useState(true);

  // Sub-data states
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoadingSubData, setIsLoadingSubData] = useState(false);
  const [downloadingPdfId, setDownloadingPdfId] = useState<number | null>(null);
  const [isDeletingFollowUpId, setIsDeletingFollowUpId] = useState<number | null>(null);
  const [isDeletingQuotationId, setIsDeletingQuotationId] = useState<number | null>(null);

  const formatFollowUpDateTime = (item: any) => {
    if (item.created_at) {
      try {
        const d = new Date(item.created_at);
        if (!isNaN(d.getTime())) {
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
          return `${yyyy}-${mm}-${dd} at ${timeStr}`;
        }
      } catch {}
    }
    const dateStr = item.follow_up_date || '';
    const timeStr = item.follow_up_time ? ` at ${item.follow_up_time}` : '';
    return `${dateStr}${timeStr}`.trim() || 'Date Recorded';
  };

  const handleViewInvoiceBill = (inv: any) => {
    Alert.alert(
      `Invoice #${inv.receipt_number || inv.invoice_number || inv.id}`,
      `Date: ${inv.payment_date || (inv.created_at ? inv.created_at.split('T')[0] : '-')}\n` +
      `Payment Type: ${inv.payment_type || inv.type || 'Payment'}\n` +
      `Payment Mode: ${inv.payment_mode || inv.mode || 'UPI'}\n` +
      `Reference / UTR: ${inv.transaction_reference || inv.utr_number || inv.reference || '-'}\n` +
      `Amount Paid: ₹${Number(inv.amount || 0).toLocaleString('en-IN')}\n` +
      `Status: ${inv.status || 'Paid'}\n` +
      (inv.notes ? `Notes: ${inv.notes}` : ''),
      [{ text: 'Close', style: 'cancel' }]
    );
  };

  const handleDeleteFollowUp = (fu: any) => {
    triggerHaptic('notificationWarning');
    Alert.alert(
      'Delete Follow-Up',
      'Are you sure you want to delete this follow-up record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeletingFollowUpId(fu.id);
              await followUpService.delete(fu.id);
              setFollowUps((prev) => prev.filter((item) => item.id !== fu.id));
              Alert.alert('Deleted', 'Follow-up interaction deleted successfully.');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete follow-up.');
            } finally {
              setIsDeletingFollowUpId(null);
            }
          },
        },
      ]
    );
  };

  const handleDeleteQuotation = (q: any) => {
    triggerHaptic('notificationWarning');
    Alert.alert(
      'Delete Quotation',
      `Are you sure you want to delete quotation #${q.quotation_number || q.id}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeletingQuotationId(q.id);
              await quotationService.delete(q.id);
              setQuotations((prev) => prev.filter((item) => item.id !== q.id));
              Alert.alert('Deleted', 'Quotation deleted successfully.');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete quotation.');
            } finally {
              setIsDeletingQuotationId(null);
            }
          },
        },
      ]
    );
  };

  const fetchProfileDetails = useCallback(async (leadId: number) => {
    setIsLoadingSubData(true);
    try {
      const [fullLeadRes, fuRes, qRes, aRes] = await Promise.allSettled([
        leadApi.getById(leadId),
        leadApi.getFollowUps(leadId),
        quotationApi.getAll({ lead_id: leadId }),
        leadApi.getAssignmentHistory(leadId),
      ]);

      if (fullLeadRes.status === 'fulfilled' && fullLeadRes.value) {
        const leadObj = fullLeadRes.value.data || fullLeadRes.value;
        setFullLead(leadObj);
      }
      if (fuRes.status === 'fulfilled') {
        const rawList = Array.isArray(fuRes.value)
          ? fuRes.value
          : fuRes.value?.data || [];
        setFollowUps(rawList);
      }
      if (qRes.status === 'fulfilled') {
        const qList = Array.isArray(qRes.value)
          ? qRes.value
          : qRes.value?.data || [];
        setQuotations(qList);
      }
      if (aRes.status === 'fulfilled') {
        const aList = Array.isArray(aRes.value)
          ? aRes.value
          : aRes.value?.data || [];
        setAssignments(aList);
      }
    } catch (err) {
      console.log('Error loading lead profile subdata:', err);
    } finally {
      setIsLoadingSubData(false);
    }
  }, []);

  useEffect(() => {
    if (visible && lead) {
      fetchProfileDetails(lead.id);
    }
  }, [visible, lead, fetchProfileDetails]);

  const handleDownloadPdf = async (quotationId: number) => {
    try {
      setDownloadingPdfId(quotationId);
      triggerHaptic('selection');
      await quotationApi.downloadPdf(quotationId);
      Alert.alert('Quotation PDF', `Quotation #${quotationId} PDF downloaded.`);
    } catch (err: any) {
      Alert.alert('Download Error', err?.message || 'Could not download PDF.');
    } finally {
      setDownloadingPdfId(null);
    }
  };

  if (!visible || !lead) return null;

  const targetLead = fullLead || lead;
  const insurancePolicies = Array.isArray(targetLead?.insurances)
    ? targetLead.insurances
    : Array.isArray(targetLead?.latest_deal?.insurances)
    ? targetLead.latest_deal.insurances
    : [];

  const activeDeal =
    targetLead?.latest_deal ||
    (Array.isArray(targetLead?.deals) && targetLead.deals.length > 0 ? targetLead.deals[0] : null);
  const dealPayments = Array.isArray(activeDeal?.payments) ? activeDeal.payments : [];

  const brandName = targetLead.brand_name || 'MARUTI SUZUKI';
  const modelVariant =
    targetLead.model_variant ||
    (`${targetLead.model_name || ''} ${targetLead.variant_name || ''}`.trim() || '-');
  const segmentShort =
    targetLead.vehicle_segment === '2 Wheeler' ||
    (targetLead as any).vehicle_segment_display === '2W'
      ? '2W'
      : '4W';
  const assignedRep = targetLead.assigned_user_name || 'Unassigned';
  const budgetText =
    targetLead.budget && targetLead.budget !== 'CSD Entitlement'
      ? typeof targetLead.budget === 'number'
        ? `₹${targetLead.budget.toLocaleString('en-IN')}`
        : `₹${targetLead.budget}`
      : 'Not Specified';

  const timelineText = targetLead.purchase_timeline || 'Not Specified';
  const birthday = targetLead.birth_date || targetLead.birthday;
  const anniversary = targetLead.anniversary_date;
  const homeTown = targetLead.home_town || targetLead.city || '-';
  const posting = targetLead.posting || 'Not Specified';

  // Use clean status directly from DB/API, mapping Deal Won to 'Deal & Booking'
  const statusProp = (lead as any).status;
  const statusFromString = typeof statusProp === 'string' ? statusProp : statusProp?.name;
  const rawStatus =
    lead.status_name ||
    lead.lead_status ||
    statusFromString ||
    (lead.is_converted ? 'Deal & Booking' : 'New');
  const lowerStatus = rawStatus.toLowerCase().trim();
  let currentLeadStatus = rawStatus;
  if (lowerStatus.includes('discount')) {
    currentLeadStatus = 'Follow-up';
  } else if (
    lowerStatus.includes('deal') ||
    lowerStatus.includes('won') ||
    lowerStatus.includes('book')
  ) {
    currentLeadStatus = 'Deal & Booking';
  } else if (lowerStatus.includes('follow')) {
    currentLeadStatus = 'Follow-up';
  } else if (lowerStatus.includes('quotation')) {
    currentLeadStatus = 'Quotation Sent';
  } else if (lowerStatus.includes('lost')) {
    currentLeadStatus = 'Lost';
  } else if (lowerStatus.includes('new')) {
    currentLeadStatus = 'New';
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
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

          {/* Navigation Header */}
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
              <View>
                <View style={styles.headerTitleRow}>
                  <Text style={[styles.leadIdBadge, { color: colors.primary }]}>
                    LEAD #{lead.id}
                  </Text>
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                        borderColor: isDark ? '#334155' : '#CBD5E1',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        {
                          color:
                            lead.priority === 'Hot'
                              ? '#EF4444'
                              : colors.textPrimary,
                        },
                      ]}
                    >
                      {currentLeadStatus}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.sheetTitle,
                    { color: colors.textPrimary },
                  ]}
                >
                  Lead Profile
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.closeBtn,
                {
                  backgroundColor: isDark ? '#162030' : '#F1F5F9',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
              onPress={onClose}
              hitSlop={{ top: 18, bottom: 18, left: 18, right: 18 }}
              activeOpacity={0.7}
            >
              <Text style={[styles.closeIcon, { color: colors.textPrimary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Action Buttons Toolbar */}
          <View
            style={[
              styles.quickActionsBar,
              {
                backgroundColor: isDark ? '#101726' : '#F8FAFC',
                borderBottomColor: isDark ? '#1E293B' : '#E2E8F0',
              },
            ]}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickActionsScroll}
            >
              <TouchableOpacity
                style={[styles.actionBtnHeader, { backgroundColor: '#2563EB' }]}
                onPress={() => {
                  triggerHaptic('selection');
                  onClose();
                  onLogFollowUp?.(lead);
                }}
              >
                <PhoneCall size={12} color="#FFFFFF" strokeWidth={2.2} />
                <Text style={styles.actionBtnHeaderText}>Log Follow-Up</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtnHeader, { backgroundColor: '#0284C7' }]}
                onPress={() => {
                  triggerHaptic('selection');
                  onClose();
                  onSendQuotation?.(lead);
                }}
              >
                <FileText size={12} color="#FFFFFF" strokeWidth={2.2} />
                <Text style={styles.actionBtnHeaderText}>Create Quotation</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtnHeader, { backgroundColor: '#16A34A' }]}
                onPress={() => {
                  triggerHaptic('selection');
                  onClose();
                  onConvertToDeal(lead);
                }}
              >
                <Award size={12} color="#FFFFFF" strokeWidth={2.2} />
                <Text style={styles.actionBtnHeaderText}>Convert Deal</Text>
              </TouchableOpacity>

              {/* Task 1: Lead Edit button next to Convert to Deal */}
              <TouchableOpacity
                style={[styles.actionBtnHeader, { backgroundColor: '#D97706' }]}
                onPress={() => {
                  triggerHaptic('selection');
                  onClose();
                  onEditLead?.(lead);
                }}
              >
                <Edit3 size={12} color="#FFFFFF" strokeWidth={2.2} />
                <Text style={styles.actionBtnHeaderText}>Edit Lead</Text>
              </TouchableOpacity>

              {/* View Full Lead Detail Screen */}
              <TouchableOpacity
                style={[styles.actionBtnHeader, { backgroundColor: '#58632A' }]}
                onPress={() => {
                  triggerHaptic('selection');
                  onClose();
                  (navigation.getParent() as any)?.navigate('LeadDetail', { leadId: lead.id });
                }}
              >
                <Eye size={12} color="#FFFFFF" strokeWidth={2.2} />
                <Text style={styles.actionBtnHeaderText}>Full Detail View</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Scrollable Content with large bottom padding for smooth scroll-up */}
          <ScrollView
            style={styles.sheetContent}
            contentContainerStyle={[
              styles.sheetContentContainer,
              { paddingBottom: Math.max(insets.bottom, 24) + 100 },
            ]}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            {/* Birthday / Anniversary Banner if present */}
            {(birthday || anniversary) && (
              <View
                style={[
                  styles.celebrationBanner,
                  {
                    backgroundColor: isDark
                      ? 'rgba(234, 179, 8, 0.12)'
                      : '#FEFCE8',
                    borderColor: isDark ? '#EAB308' : '#FDE047',
                  },
                ]}
              >
                <Sparkles size={16} color="#EAB308" strokeWidth={2.2} />
                <View style={{ flex: 1 }}>
                  {birthday && (
                    <Text style={[styles.celebrationText, { color: isDark ? '#FDE047' : '#854D0E' }]}>
                      🎂 Birthday: {birthday}
                    </Text>
                  )}
                  {anniversary && (
                    <Text style={[styles.celebrationText, { color: isDark ? '#FDE047' : '#854D0E' }]}>
                      💍 Anniversary: {anniversary}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* 1. Customer Information Card */}
            <View
              style={[
                styles.profileCard,
                {
                  backgroundColor: isDark ? '#101726' : '#FFFFFF',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.indicator, { backgroundColor: colors.primary }]} />
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  Customer Information
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
                  Customer Name:
                </Text>
                <Text style={[styles.metaValue, { color: colors.textPrimary }]}>
                  {lead.name}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
                  Phone:
                </Text>
                <TouchableOpacity
                  onPress={() => onCall(lead.phone)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                >
                  <Phone size={13} color={colors.primary} />
                  <Text
                    style={[
                      styles.metaValue,
                      { color: colors.primary, textDecorationLine: 'underline' },
                    ]}
                  >
                    {lead.phone}
                  </Text>
                </TouchableOpacity>
              </View>

              {lead.email ? (
                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
                    Email:
                  </Text>
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`mailto:${lead.email}`)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                  >
                    <Mail size={13} color={colors.primary} />
                    <Text
                      style={[
                        styles.metaValue,
                        { color: colors.primary, textDecorationLine: 'underline' },
                      ]}
                    >
                      {lead.email}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
                  Home Town:
                </Text>
                <Text style={[styles.metaValue, { color: colors.textPrimary }]}>
                  {homeTown}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
                  Posting Location:
                </Text>
                <Text style={[styles.metaValue, { color: colors.textPrimary }]}>
                  {posting}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
                  Lead Source:
                </Text>
                <Text style={[styles.metaValue, { color: colors.textPrimary }]}>
                  {lead.source_name || (lead.source as any)?.name || 'Direct / Showroom'}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
                  Assigned Executive:
                </Text>
                <Text style={[styles.metaValue, { color: colors.textPrimary }]}>
                  {assignedRep}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
                  Created Date:
                </Text>
                <Text style={[styles.metaValue, { color: colors.textSecondary }]}>
                  {lead.created_at ? lead.created_at.split('T')[0] : 'Recent'}
                </Text>
              </View>
            </View>

            {/* 2. Vehicle Requirements Card */}
            <View
              style={[
                styles.profileCard,
                {
                  backgroundColor: isDark ? '#101726' : '#FFFFFF',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  marginTop: 12,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.indicator, { backgroundColor: '#38BDF8' }]} />
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  Vehicle & Requirements
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
                  Vehicle Segment:
                </Text>
                <Text style={[styles.metaValue, { color: colors.textPrimary }]}>
                  {lead.vehicle_segment} ({segmentShort})
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
                  Brand:
                </Text>
                <Text style={[styles.metaValue, { color: colors.textPrimary }]}>
                  {brandName}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
                  Model & Variant:
                </Text>
                <Text style={[styles.metaValue, { color: colors.textPrimary, fontWeight: '800' }]}>
                  {modelVariant}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
                  Purchase Timeline:
                </Text>
                <Text style={[styles.metaValue, { color: colors.textPrimary }]}>
                  {timelineText}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
                  Expected Budget:
                </Text>
                <Text style={[styles.metaValue, { color: '#16A34A', fontWeight: '800' }]}>
                  {budgetText}
                </Text>
              </View>
            </View>

            {/* 3. Collapsible Accordions */}

            {/* Accordion Section A: Follow-up & Interaction History */}
            <View
              style={[
                styles.accordionCard,
                {
                  backgroundColor: isDark ? '#101726' : '#FFFFFF',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  marginTop: 14,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.accordionHeader}
                onPress={() => {
                  triggerHaptic('selection');
                  setFollowUpsOpen(!followUpsOpen);
                }}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <PhoneCall size={16} color={colors.primary} />
                  <Text style={[styles.accordionTitle, { color: colors.textPrimary }]}>
                    Follow-Up History ({followUps.length})
                  </Text>
                </View>
                {followUpsOpen ? (
                  <ChevronUp size={18} color={colors.textSecondary} />
                ) : (
                  <ChevronDown size={18} color={colors.textSecondary} />
                )}
              </TouchableOpacity>

              {followUpsOpen && (
                <View style={styles.accordionBody}>
                  {isLoadingSubData ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 10 }} />
                  ) : followUps.length === 0 ? (
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      No follow-up interactions recorded yet.
                    </Text>
                  ) : (
                    followUps.map((fu, idx) => {
                      const dateStr = formatFollowUpDateTime(fu);
                      const nextActionStr = fu.next_follow_up_date
                        ? `${fu.next_follow_up_date}${fu.next_follow_up_time ? ' ' + fu.next_follow_up_time : ''}`
                        : null;
                      return (
                        <View
                          key={fu.id || idx}
                          style={[
                            styles.followUpCard,
                            {
                              backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                              borderColor: isDark ? '#1E293B' : '#E2E8F0',
                            },
                          ]}
                        >
                          {/* Top Row: Dual Badges on Left, Date + Delete on Right */}
                          <View style={styles.followUpTopRow}>
                            <View style={styles.followUpBadgesRow}>
                              {/* Badge 1: Type (Olive Green) */}
                              <View style={styles.followUpTypeBadge}>
                                <Text style={styles.followUpTypeBadgeText}>
                                  {fu.type || 'Phone Call'}
                                </Text>
                              </View>
                              {/* Badge 2: Outcome / Status (Soft Cyan) */}
                              {!!(fu.status || fu.outcome || fu.last_call_outcome) && (
                                <View
                                  style={[
                                    styles.followUpOutcomeBadge,
                                    {
                                      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : '#E0F2FE',
                                      borderColor: isDark ? '#0284C7' : '#BAE6FD',
                                    },
                                  ]}
                                >
                                  <Text style={styles.followUpOutcomeBadgeText}>
                                    {normalizeOutcome(fu.outcome || fu.status || fu.last_call_outcome) ||
                                      fu.outcome ||
                                      fu.status ||
                                      'Interested / Call Back'}
                                  </Text>
                                </View>
                              )}
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <Text style={[styles.followUpDateText, { color: colors.textSecondary }]}>
                                {dateStr}
                              </Text>
                              <TouchableOpacity
                                style={[
                                  styles.trashIconBtn,
                                  { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2' },
                                ]}
                                onPress={() => handleDeleteFollowUp(fu)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                disabled={isDeletingFollowUpId === fu.id}
                                activeOpacity={0.7}
                              >
                                {isDeletingFollowUpId === fu.id ? (
                                  <ActivityIndicator size="small" color="#DC2626" />
                                ) : (
                                  <Trash2 size={13} color="#DC2626" strokeWidth={2.2} />
                                )}
                              </TouchableOpacity>
                            </View>
                          </View>

                          {/* Middle: Notes */}
                          <Text style={[styles.followUpNotesText, { color: colors.textPrimary }]}>
                            {fu.notes || 'No discussion notes logged.'}
                          </Text>

                          {/* Footer: Logged By & Next Action */}
                          <View
                            style={[
                              styles.followUpFooterRow,
                              { borderTopColor: isDark ? '#1E293B' : '#F1F5F9' },
                            ]}
                          >
                            <Text style={[styles.followUpLoggedByText, { color: colors.textSecondary }]}>
                              Logged By: {fu.user_name || fu.assigned_user_name || 'Admin User (Super Admin)'}
                            </Text>
                            {nextActionStr && (
                              <View
                                style={[
                                  styles.followUpNextBadge,
                                  { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7' },
                                ]}
                              >
                                <Clock size={10} color="#D97706" strokeWidth={2.2} />
                                <Text style={styles.followUpNextText}>
                                  Next: {nextActionStr}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>
              )}
            </View>

            {/* Accordion Section B: Quotations Sent */}
            <View
              style={[
                styles.accordionCard,
                {
                  backgroundColor: isDark ? '#101726' : '#FFFFFF',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  marginTop: 10,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.accordionHeader}
                onPress={() => {
                  triggerHaptic('selection');
                  setQuotationsOpen(!quotationsOpen);
                }}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <FileText size={16} color="#0284C7" />
                  <Text style={[styles.accordionTitle, { color: colors.textPrimary }]}>
                    Quotations Sent ({quotations.length})
                  </Text>
                </View>
                {quotationsOpen ? (
                  <ChevronUp size={18} color={colors.textSecondary} />
                ) : (
                  <ChevronDown size={18} color={colors.textSecondary} />
                )}
              </TouchableOpacity>

              {quotationsOpen && (
                <View style={styles.accordionBody}>
                  {isLoadingSubData ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 10 }} />
                  ) : quotations.length === 0 ? (
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      No quotations generated for this lead.
                    </Text>
                  ) : (
                    quotations.map((q, idx) => (
                      <View
                        key={q.id || idx}
                        style={[
                          styles.quotationItem,
                          {
                            backgroundColor: isDark ? '#131B2E' : '#F8FAFC',
                            borderColor: isDark ? '#1E293B' : '#E2E8F0',
                          },
                        ]}
                      >
                        <View style={styles.qTopRow}>
                          <View>
                            <Text style={[styles.qNumber, { color: colors.textPrimary }]}>
                              Quotation #{q.quotation_number || q.id}
                            </Text>
                            <Text style={[styles.qDate, { color: colors.textSecondary }]}>
                              {q.created_at ? q.created_at.split('T')[0] : 'Recent'}
                            </Text>
                          </View>
                          <Text style={[styles.qTotal, { color: colors.primary }]}>
                            ₹{Number(q.final_on_road_price || q.grand_total || q.total_amount || q.total || 0).toLocaleString('en-IN')}
                          </Text>
                        </View>

                        <Text style={[styles.qVehicle, { color: colors.textSecondary }]} numberOfLines={1}>
                          {q.variant_name || q.model_name || modelVariant}
                        </Text>

                        <View style={styles.qActionRow}>
                          <TouchableOpacity
                            style={[styles.pdfBtn, { backgroundColor: isDark ? '#1E293B' : '#E0F2FE' }]}
                            onPress={() => handleDownloadPdf(q.id)}
                            disabled={downloadingPdfId === q.id}
                          >
                            {downloadingPdfId === q.id ? (
                              <ActivityIndicator size="small" color="#0284C7" />
                            ) : (
                              <>
                                <Download size={12} color="#0284C7" />
                                <Text style={styles.pdfBtnText}>Download PDF</Text>
                              </>
                            )}
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.deleteQuotationBtn,
                              { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2' },
                            ]}
                            onPress={() => handleDeleteQuotation(q)}
                            disabled={isDeletingQuotationId === q.id}
                            activeOpacity={0.7}
                          >
                            {isDeletingQuotationId === q.id ? (
                              <ActivityIndicator size="small" color="#DC2626" />
                            ) : (
                              <>
                                <Trash2 size={12} color="#DC2626" strokeWidth={2.2} />
                                <Text style={styles.deleteQuotationBtnText}>Delete</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>

            {/* Accordion Section C: Executive Assignment History */}
            <View
              style={[
                styles.accordionCard,
                {
                  backgroundColor: isDark ? '#101726' : '#FFFFFF',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  marginTop: 10,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.accordionHeader}
                onPress={() => {
                  triggerHaptic('selection');
                  setAssignmentsOpen(!assignmentsOpen);
                }}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Users size={16} color="#10B981" />
                  <Text style={[styles.accordionTitle, { color: colors.textPrimary }]}>
                    Assignment History ({assignments.length > 0 ? assignments.length : 1})
                  </Text>
                </View>
                {assignmentsOpen ? (
                  <ChevronUp size={18} color={colors.textSecondary} />
                ) : (
                  <ChevronDown size={18} color={colors.textSecondary} />
                )}
              </TouchableOpacity>

              {assignmentsOpen && (
                <View style={styles.accordionBody}>
                  {isLoadingSubData ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 10 }} />
                  ) : assignments.length > 0 ? (
                    assignments.map((a, idx) => (
                      <View
                        key={a.id || idx}
                        style={[
                          styles.assignmentItem,
                          {
                            borderBottomColor: isDark ? '#1E293B' : '#F1F5F9',
                            borderBottomWidth: idx < assignments.length - 1 ? 1 : 0,
                          },
                        ]}
                      >
                        <Text style={[styles.assigneeText, { color: colors.textPrimary }]}>
                          Assigned to: {a.assigned_to_name || a.user_name || 'Executive'}
                        </Text>
                        <Text style={[styles.assignMeta, { color: colors.textSecondary }]}>
                          By: {a.assigned_by_name || 'Admin'} • {a.created_at ? a.created_at.split('T')[0] : 'Recent'}
                        </Text>
                        {a.remarks && (
                          <Text style={[styles.assignRemarks, { color: colors.textSecondary }]}>
                            Remarks: {a.remarks}
                          </Text>
                        )}
                      </View>
                    ))
                  ) : (
                    // Always show active current assignment info when no historical log exists
                    <View style={styles.activeAssignmentBox}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={[styles.assigneeText, { color: colors.textPrimary }]}>
                          Active Executive: {assignedRep}
                        </Text>
                        <View style={[styles.activePill, { backgroundColor: isDark ? '#064E3B' : '#ECFDF5' }]}>
                          <Text style={{ fontSize: 9, fontWeight: '800', color: '#10B981' }}>CURRENT</Text>
                        </View>
                      </View>
                      <Text style={[styles.assignMeta, { color: colors.textSecondary }]}>
                        Lead Allocation: {lead.created_at ? lead.created_at.split('T')[0] : 'Registration'}
                      </Text>
                      <Text style={[styles.assignRemarks, { color: colors.textSecondary }]}>
                        Assigned representative for defense canteen procurement & follow-ups.
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Accordion Section D: Insurance Policies & History (Screenshot 2) */}
            <View
              style={[
                styles.accordionCard,
                {
                  backgroundColor: isDark ? '#101726' : '#FFFFFF',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  marginTop: 10,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.accordionHeader}
                onPress={() => {
                  triggerHaptic('selection');
                  setInsuranceOpen(!insuranceOpen);
                }}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <ShieldCheck size={16} color="#059669" />
                  <Text style={[styles.accordionTitle, { color: colors.textPrimary }]}>
                    Insurance Policies & History ({insurancePolicies.length})
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity
                    style={[
                      styles.headerQueueBtn,
                      {
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                        borderColor: isDark ? '#334155' : '#CBD5E1',
                      },
                    ]}
                    onPress={() => {
                      onClose();
                      navigation?.navigate('pending-insurance');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.headerQueueBtnText,
                        { color: isDark ? '#94A3B8' : '#334155' },
                      ]}
                    >
                      🛡️ Queue
                    </Text>
                  </TouchableOpacity>
                  {insuranceOpen ? (
                    <ChevronUp size={18} color={colors.textSecondary} />
                  ) : (
                    <ChevronDown size={18} color={colors.textSecondary} />
                  )}
                </View>
              </TouchableOpacity>

              {insuranceOpen && (
                <View style={styles.accordionBody}>
                  {insurancePolicies.length === 0 ? (
                    <View
                      style={[
                        styles.insuranceEmptyBox,
                        {
                          backgroundColor: isDark ? '#131B2E' : '#F8FAFC',
                          borderColor: isDark ? '#1E293B' : '#E2E8F0',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.shieldIconCircle,
                          { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                        ]}
                      >
                        <Shield
                          size={32}
                          color={isDark ? '#64748B' : '#94A3B8'}
                          strokeWidth={1.8}
                        />
                      </View>
                      <Text style={[styles.insuranceEmptyTitle, { color: colors.textPrimary }]}>
                        No Insurance Policy Linked Yet
                      </Text>
                      <Text
                        style={[styles.insuranceEmptySub, { color: colors.textSecondary }]}
                      >
                        This customer does not have an active insurance policy on record.
                      </Text>
                      <TouchableOpacity
                        style={styles.checkPendingInsuranceBtn}
                        onPress={() => {
                          onClose();
                          navigation?.navigate('pending-insurance');
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.checkPendingInsuranceBtnText}>
                          🛡️ Check Pending Insurance Deals
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={{ gap: 8, marginTop: 4 }}>
                      {insurancePolicies.map((pol: any, idx: number) => (
                        <View
                          key={pol.id || idx}
                          style={[
                            styles.policyCard,
                            {
                              backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                              borderColor: isDark ? '#1E293B' : '#E2E8F0',
                            },
                          ]}
                        >
                          <View style={styles.policyCardHeader}>
                            <View
                              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                            >
                              <Text
                                style={[
                                  styles.policyProviderName,
                                  { color: colors.textPrimary },
                                ]}
                              >
                                {pol.provider_name ||
                                  pol.company_name ||
                                  pol.insurance_company?.name ||
                                  'Insurance'}
                              </Text>
                              <Text style={styles.policyNumber}>
                                #{pol.policy_number || 'POL-PENDING'}
                              </Text>
                            </View>
                            <View style={styles.policyStatusBadge}>
                              <Text style={styles.policyStatusText}>
                                {pol.status || 'Active'}
                              </Text>
                            </View>
                          </View>

                          <View
                            style={[
                              styles.policyMetaGrid,
                              { borderTopColor: isDark ? '#1E293B' : '#F1F5F9' },
                            ]}
                          >
                            <View style={styles.policyMetaItem}>
                              <Text style={styles.policyMetaLabel}>Plan / Type</Text>
                              <Text
                                style={[
                                  styles.policyMetaVal,
                                  { color: colors.textPrimary },
                                ]}
                              >
                                {pol.plan_type || pol.insurance_plan || 'Comprehensive'}
                              </Text>
                            </View>
                            <View style={styles.policyMetaItem}>
                              <Text style={styles.policyMetaLabel}>Chassis / Reg</Text>
                              <Text
                                style={[
                                  styles.policyMetaVal,
                                  { color: colors.textPrimary },
                                ]}
                              >
                                {pol.vehicle_reg_no ||
                                  pol.chassis_no ||
                                  targetLead?.chassis_number ||
                                  '-'}
                              </Text>
                            </View>
                            <View style={styles.policyMetaItem}>
                              <Text style={styles.policyMetaLabel}>Validity</Text>
                              <Text
                                style={[
                                  styles.policyMetaVal,
                                  { color: colors.textPrimary },
                                ]}
                              >
                                {pol.policy_start_date || 'Start'} →{' '}
                                {pol.policy_expiry_date || 'Expiry'}
                              </Text>
                            </View>
                            <View style={styles.policyMetaItem}>
                              <Text style={styles.policyMetaLabel}>Premium Amount</Text>
                              <Text
                                style={[
                                  styles.policyMetaVal,
                                  { color: '#059669', fontWeight: '700' },
                                ]}
                              >
                                {pol.premium_amount
                                  ? `₹${Number(pol.premium_amount).toLocaleString('en-IN')}`
                                  : '-'}
                              </Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Accordion Section E: Deal Ledger & Invoices (Screenshot 2) */}
            <View
              style={[
                styles.accordionCard,
                {
                  backgroundColor: isDark ? '#101726' : '#FFFFFF',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  marginTop: 10,
                  marginBottom: 30,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.accordionHeader}
                onPress={() => {
                  triggerHaptic('selection');
                  setDealLedgerOpen(!dealLedgerOpen);
                }}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <FolderKanban size={16} color="#0284C7" />
                  <Text style={[styles.accordionTitle, { color: colors.textPrimary }]}>
                    Deal Ledger & Invoices {activeDeal ? `(${dealPayments.length})` : '(No Deal)'}
                  </Text>
                </View>
                {dealLedgerOpen ? (
                  <ChevronUp size={18} color={colors.textSecondary} />
                ) : (
                  <ChevronDown size={18} color={colors.textSecondary} />
                )}
              </TouchableOpacity>

              {dealLedgerOpen && (
                <View style={styles.accordionBody}>
                  {!activeDeal ? (
                    <View style={[styles.invoicesEmptyBox, { paddingVertical: 18 }]}>
                      <Text
                        style={[styles.invoicesEmptyText, { color: colors.textSecondary }]}
                      >
                        No deal or booking created for this customer yet.
                      </Text>
                      <TouchableOpacity
                        style={[styles.checkPendingInsuranceBtn, { marginTop: 10 }]}
                        onPress={() => {
                          onClose();
                          onConvertToDeal(lead);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.checkPendingInsuranceBtnText}>
                          🏆 Convert Lead to Deal
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View>
                      {/* Deal Header Info */}
                      <View style={styles.dealLedgerHeader}>
                        <View style={{ flex: 1 }}>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 6,
                              flexWrap: 'wrap',
                            }}
                          >
                            <Text
                              style={[
                                styles.dealLedgerTitle,
                                { color: colors.textPrimary },
                              ]}
                            >
                              {activeDeal.deal_number || `DEAL-${activeDeal.id}`}
                            </Text>
                            <View style={styles.dealStageBadge}>
                              <Text style={styles.dealStageBadgeText}>
                                {activeDeal.delivery_stage ||
                                  activeDeal.status ||
                                  'Booking Confirmed'}
                              </Text>
                            </View>
                          </View>
                          <Text
                            style={[
                              styles.dealLedgerSubtitle,
                              { color: colors.textSecondary },
                            ]}
                          >
                            Customer: {targetLead.name} •{' '}
                            {activeDeal.vehicle_name || modelVariant || 'Vehicle'}
                          </Text>
                        </View>
                      </View>

                      {/* Header Buttons: Deals & Invoices */}
                      <View style={styles.dealLedgerHeaderBtns}>
                        <TouchableOpacity
                          style={[
                            styles.dealHeaderActionBtn,
                            {
                              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                              borderColor: isDark ? '#334155' : '#CBD5E1',
                            },
                          ]}
                          onPress={() => {
                            onClose();
                            navigation?.navigate('deals');
                          }}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.dealHeaderActionBtnText,
                              { color: isDark ? '#94A3B8' : '#334155' },
                            ]}
                          >
                            🏆 Deals & Bookings
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.dealHeaderActionBtn,
                            {
                              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                              borderColor: isDark ? '#334155' : '#CBD5E1',
                            },
                          ]}
                          onPress={() => {
                            onClose();
                            navigation?.navigate('generate-invoice');
                          }}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.dealHeaderActionBtnText,
                              { color: isDark ? '#94A3B8' : '#334155' },
                            ]}
                          >
                            All Invoices
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* 3 Summary Financial KPI Cards */}
                      <View style={[styles.dealKpiCardsRow, { marginTop: 10 }]}>
                        {/* Card 1: NET DEAL AMOUNT */}
                        <View
                          style={[
                            styles.dealKpiCardWhite,
                            {
                              backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                              borderColor: isDark ? '#1E293B' : '#E2E8F0',
                            },
                          ]}
                        >
                          <Text style={styles.dealKpiLabel}>NET DEAL AMOUNT</Text>
                          <Text
                            style={[
                              styles.dealKpiAmount,
                              { color: colors.textPrimary },
                            ]}
                          >
                            ₹
                            {Number(
                              activeDeal.net_amount ||
                                activeDeal.total_amount ||
                                0
                            ).toLocaleString('en-IN')}
                          </Text>
                          <Text style={styles.dealKpiSub} numberOfLines={1}>
                            {activeDeal.vehicle_name || modelVariant || 'Vehicle'}
                          </Text>
                        </View>

                        {/* Card 2: TOTAL PAID */}
                        <View
                          style={[
                            styles.dealKpiCardGreen,
                            {
                              backgroundColor: isDark ? '#064E3B' : '#ECFDF5',
                              borderColor: isDark ? '#047857' : '#A7F3D0',
                            },
                          ]}
                        >
                          <Text style={[styles.dealKpiLabel, { color: '#10B981' }]}>
                            TOTAL PAID
                          </Text>
                          <Text style={[styles.dealKpiAmount, { color: '#10B981' }]}>
                            ₹
                            {Number(
                              activeDeal.total_paid ||
                                activeDeal.paid_amount ||
                                0
                            ).toLocaleString('en-IN')}
                          </Text>
                          <Text style={[styles.dealKpiSub, { color: '#10B981' }]}>
                            {dealPayments.length} Invoices Cleared
                          </Text>
                        </View>

                        {/* Card 3: BALANCE DUE */}
                        <View
                          style={[
                            styles.dealKpiCardRed,
                            {
                              backgroundColor: isDark ? '#7F1D1D' : '#FEF2F2',
                              borderColor: isDark ? '#B91C1C' : '#FECACA',
                            },
                          ]}
                        >
                          <Text style={[styles.dealKpiLabel, { color: '#EF4444' }]}>
                            BALANCE DUE
                          </Text>
                          <Text style={[styles.dealKpiAmount, { color: '#EF4444' }]}>
                            ₹
                            {Number(
                              activeDeal.balance_due ??
                                Math.max(
                                  0,
                                  (activeDeal.net_amount ||
                                    activeDeal.total_amount ||
                                    0) -
                                    (activeDeal.total_paid ||
                                      activeDeal.paid_amount ||
                                      0)
                                )
                            ).toLocaleString('en-IN')}
                          </Text>
                          <Text style={[styles.dealKpiSub, { color: '#EF4444' }]}>
                            Pending Receivables
                          </Text>
                        </View>
                      </View>

                      {/* Invoices List / Table */}
                      <View
                        style={[
                          styles.invoicesContainer,
                          { borderTopColor: isDark ? '#1E293B' : '#F1F5F9' },
                        ]}
                      >
                        <View style={styles.invoicesHeaderRow}>
                          <View
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                          >
                            <Receipt size={14} color="#0284C7" />
                            <Text
                              style={[
                                styles.invoicesHeaderText,
                                { color: colors.textPrimary },
                              ]}
                            >
                              All Invoices Issued ({dealPayments.length})
                            </Text>
                          </View>
                        </View>

                        {dealPayments.length === 0 ? (
                          <View style={styles.invoicesEmptyBox}>
                            <Text
                              style={[
                                styles.invoicesEmptyText,
                                { color: colors.textSecondary },
                              ]}
                            >
                              No invoices issued for this deal yet.
                            </Text>
                          </View>
                        ) : (
                          <View style={{ gap: 6 }}>
                            {dealPayments.map((p: any, idx: number) => (
                              <View
                                key={p.id || idx}
                                style={[
                                  styles.invoiceItemCard,
                                  {
                                    backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                                    borderColor: isDark ? '#1E293B' : '#E2E8F0',
                                  },
                                ]}
                              >
                                <View style={styles.invoiceItemTopRow}>
                                  <View
                                    style={{
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      gap: 6,
                                    }}
                                  >
                                    <Text style={styles.invoiceIndexText}>
                                      #{idx + 1}
                                    </Text>
                                    <Text
                                      style={[
                                        styles.invoiceNumberText,
                                        { color: colors.textPrimary },
                                      ]}
                                    >
                                      {p.receipt_number ||
                                        p.invoice_number ||
                                        `DAL-INV-${p.id}`}
                                    </Text>
                                  </View>
                                  <View style={styles.invoicePaidBadge}>
                                    <Text style={styles.invoicePaidBadgeText}>
                                      {p.status || 'Paid'}
                                    </Text>
                                  </View>
                                </View>

                                <View style={styles.invoiceDetailsGrid}>
                                  <View style={styles.invoiceDetailCol}>
                                    <Text style={styles.invoiceDetailLabel}>DATE</Text>
                                    <Text
                                      style={[
                                        styles.invoiceDetailVal,
                                        { color: colors.textPrimary },
                                      ]}
                                    >
                                      {p.payment_date ||
                                        (p.created_at
                                          ? p.created_at.split('T')[0]
                                          : '-')}
                                    </Text>
                                  </View>
                                  <View style={styles.invoiceDetailCol}>
                                    <Text style={styles.invoiceDetailLabel}>
                                      PAYMENT TYPE
                                    </Text>
                                    <Text
                                      style={[
                                        styles.invoiceDetailVal,
                                        { color: colors.textPrimary },
                                      ]}
                                    >
                                      {p.payment_type || p.type || 'Payment'}
                                    </Text>
                                  </View>
                                  <View style={styles.invoiceDetailCol}>
                                    <Text style={styles.invoiceDetailLabel}>
                                      PAYMENT MODE
                                    </Text>
                                    <Text
                                      style={[
                                        styles.invoiceDetailVal,
                                        { color: colors.textPrimary },
                                      ]}
                                    >
                                      {p.payment_mode || p.mode || 'UPI'}
                                    </Text>
                                  </View>
                                  <View style={styles.invoiceDetailCol}>
                                    <Text style={styles.invoiceDetailLabel}>
                                      REFERENCE / UTR
                                    </Text>
                                    <Text
                                      style={[
                                        styles.invoiceDetailVal,
                                        { color: colors.textPrimary },
                                      ]}
                                    >
                                      {p.transaction_reference ||
                                        p.utr_number ||
                                        p.reference ||
                                        '-'}
                                    </Text>
                                  </View>
                                </View>

                                <View
                                  style={[
                                    styles.invoiceBottomActionRow,
                                    {
                                      borderTopColor: isDark
                                        ? '#1E293B'
                                        : '#F1F5F9',
                                    },
                                  ]}
                                >
                                  <View>
                                    <Text style={styles.invoiceAmountLabel}>
                                      AMOUNT PAID
                                    </Text>
                                    <Text style={styles.invoiceAmountVal}>
                                      ₹{Number(p.amount || 0).toLocaleString('en-IN')}
                                    </Text>
                                  </View>
                                  <TouchableOpacity
                                    style={styles.viewBillBtn}
                                    onPress={() => handleViewInvoiceBill(p)}
                                    activeOpacity={0.8}
                                  >
                                    <FileText size={12} color="#0284C7" />
                                    <Text style={styles.viewBillBtnText}>View Bill</Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              )}
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
    height: '92%',
    maxHeight: '94%',
    width: '100%',
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
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImg: {
    width: 24,
    height: 24,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  leadIdBadge: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 1,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 12,
    fontWeight: '700',
  },
  quickActionsBar: {
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  quickActionsScroll: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    gap: 8,
  },
  actionBtnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 5,
  },
  actionBtnHeaderText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  sheetContent: {
    flex: 1,
  },
  sheetContentContainer: {
    padding: 14,
  },
  celebrationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  celebrationText: {
    fontSize: 11,
    fontWeight: '700',
  },
  profileCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
  },
  indicator: {
    width: 4,
    height: 14,
    borderRadius: 2,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  accordionCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  accordionTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  accordionBody: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150,150,150,0.2)',
    paddingTop: 8,
  },
  emptyText: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 8,
  },
  timelineCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
  },
  tlHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  tlType: {
    fontSize: 11,
    fontWeight: '800',
  },
  tlDot: {
    fontSize: 12,
  },
  tlDate: {
    fontSize: 11,
    fontWeight: '500',
  },
  outcomeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  outcomeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  tlNotes: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  tlNextActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  tlNextText: {
    fontSize: 10,
    fontWeight: '600',
  },
  quotationItem: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
  },
  qTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qNumber: {
    fontSize: 12,
    fontWeight: '800',
  },
  qDate: {
    fontSize: 10,
    fontWeight: '500',
  },
  qTotal: {
    fontSize: 13,
    fontWeight: '800',
  },
  qVehicle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  qActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  pdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pdfBtnText: {
    color: '#0284C7',
    fontSize: 10,
    fontWeight: '700',
  },
  trashIconBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteQuotationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  deleteQuotationBtnText: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: '700',
  },
  assignmentItem: {
    paddingVertical: 8,
  },
  activeAssignmentBox: {
    paddingVertical: 6,
  },
  activePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  assigneeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  assignMeta: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  assignRemarks: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },

  // Follow-Up Card Styles (Matching Screenshot 1)
  followUpCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
  },
  followUpTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  followUpBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
  },
  followUpTypeBadge: {
    backgroundColor: '#58632A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  followUpTypeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  followUpOutcomeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  followUpOutcomeBadgeText: {
    color: '#0284C7',
    fontSize: 10,
    fontWeight: '700',
  },
  followUpDateText: {
    fontSize: 11,
    fontWeight: '500',
  },
  followUpNotesText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 8,
  },
  followUpFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    flexWrap: 'wrap',
    gap: 6,
  },
  followUpLoggedByText: {
    fontSize: 11,
    fontWeight: '500',
  },
  followUpNextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  followUpNextText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '700',
  },

  // Screenshot 2: Insurance Section Styles
  headerQueueBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  headerQueueBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  insuranceEmptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    marginTop: 6,
  },
  shieldIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  insuranceEmptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  insuranceEmptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 14,
  },
  checkPendingInsuranceBtn: {
    backgroundColor: '#58632A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  checkPendingInsuranceBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  policyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
  },
  policyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  policyProviderName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  policyNumber: {
    fontSize: 11,
    color: '#64748B',
  },
  policyStatusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  policyStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  policyMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  policyMetaItem: {
    width: '48%',
  },
  policyMetaLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  policyMetaVal: {
    fontSize: 11,
    color: '#0F172A',
    fontWeight: '600',
  },

  // Screenshot 2: Deal Ledger & Invoices Styles
  dealLedgerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  dealLedgerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  dealStageBadge: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dealStageBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#065F46',
  },
  dealLedgerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  dealLedgerHeaderBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  dealHeaderActionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  dealHeaderActionBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  dealKpiCardsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  dealKpiCardWhite: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 8,
  },
  dealKpiCardGreen: {
    flex: 1,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    padding: 8,
  },
  dealKpiCardRed: {
    flex: 1,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 8,
  },
  dealKpiLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
  },
  dealKpiAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  dealKpiSub: {
    fontSize: 9,
    color: '#64748B',
  },
  invoicesContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  invoicesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  invoicesHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  invoicesEmptyBox: {
    padding: 12,
    alignItems: 'center',
  },
  invoicesEmptyText: {
    fontSize: 11,
    color: '#64748B',
  },
  invoiceItemCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 9,
    marginBottom: 6,
  },
  invoiceItemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  invoiceIndexText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  invoiceNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  invoicePaidBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  invoicePaidBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#16A34A',
  },
  invoiceDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  invoiceDetailCol: {
    width: '48%',
  },
  invoiceDetailLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: '#64748B',
  },
  invoiceDetailVal: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1E293B',
  },
  invoiceBottomActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  invoiceAmountLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: '#64748B',
  },
  invoiceAmountVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
  },
  viewBillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    backgroundColor: '#F0F9FF',
  },
  viewBillBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
  },
});

export default LeadProfileModal;

