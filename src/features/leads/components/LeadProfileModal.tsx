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
import {
  Award,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Eye,
  FileText,
  Gift,
  Mail,
  MapPin,
  Phone,
  PhoneCall,
  Shield,
  Sparkles,
  User,
  Users,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { CustomerLead } from '../types';
import { leadApi } from '../leadService';
import { quotationApi } from '../../quotations/quotationService';

interface LeadProfileModalProps {
  visible: boolean;
  lead: CustomerLead | null;
  onClose: () => void;
  onCall: (phone: string) => void;
  onConvertToDeal: (lead: CustomerLead) => void;
  onLogFollowUp?: (lead: CustomerLead) => void;
  onSendQuotation?: (lead: CustomerLead) => void;
}

export const LeadProfileModal: React.FC<LeadProfileModalProps> = ({
  visible,
  lead,
  onClose,
  onCall,
  onConvertToDeal,
  onLogFollowUp,
  onSendQuotation,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Accordion Expand/Collapse States
  const [followUpsOpen, setFollowUpsOpen] = useState(true);
  const [quotationsOpen, setQuotationsOpen] = useState(true);
  const [assignmentsOpen, setAssignmentsOpen] = useState(true);

  // Sub-data states
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoadingSubData, setIsLoadingSubData] = useState(false);
  const [downloadingPdfId, setDownloadingPdfId] = useState<number | null>(null);

  const fetchProfileDetails = useCallback(async (leadId: number) => {
    setIsLoadingSubData(true);
    try {
      const [fuRes, qRes, aRes] = await Promise.allSettled([
        leadApi.getFollowUps(leadId),
        quotationApi.getAll({ lead_id: leadId }),
        leadApi.getAssignmentHistory(leadId),
      ]);

      if (fuRes.status === 'fulfilled') {
        const list = Array.isArray(fuRes.value)
          ? fuRes.value
          : fuRes.value?.data || [];
        setFollowUps(list);
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

  const brandName = lead.brand_name || 'MARUTI SUZUKI';
  const modelVariant =
    lead.model_variant ||
    `${lead.model_name || 'Brezza'} ${lead.variant_name || 'ZXi'}`.trim();
  const segmentShort =
    lead.vehicle_segment === '2 Wheeler' ||
    (lead as any).vehicle_segment_display === '2W'
      ? '2W'
      : '4W';
  const assignedRep = lead.assigned_user_name || 'Admin User (Super Admin)';
  const budgetText =
    lead.budget && lead.budget !== 'CSD Entitlement'
      ? typeof lead.budget === 'number'
        ? `₹${lead.budget.toLocaleString('en-IN')}`
        : `₹${lead.budget}`
      : 'Not Specified';

  const timelineText = lead.purchase_timeline || 'Immediate (< 7 Days)';
  const birthday = lead.birth_date || lead.birthday;
  const anniversary = lead.anniversary_date;
  const homeTown = lead.home_town || lead.city || 'Delhi';
  const posting = lead.posting || 'Not Specified';

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
                    followUps.map((fu, idx) => (
                      <View
                        key={fu.id || idx}
                        style={[
                          styles.timelineCard,
                          {
                            backgroundColor: isDark ? '#131B2E' : '#F8FAFC',
                            borderColor: isDark ? '#1E293B' : '#E2E8F0',
                          },
                        ]}
                      >
                        <View style={styles.tlHeaderRow}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.tlType, { color: colors.primary }]}>
                              {fu.type || 'Phone Call'}
                            </Text>
                            <Text style={[styles.tlDot, { color: colors.borderSubtle }]}>•</Text>
                            <Text style={[styles.tlDate, { color: colors.textSecondary }]}>
                              {fu.follow_up_date || fu.created_at?.split('T')[0]}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.outcomeBadge,
                              { backgroundColor: isDark ? '#1E293B' : '#EFF6FF' },
                            ]}
                          >
                            <Text style={styles.outcomeBadgeText}>
                              {fu.outcome || fu.status || 'Completed'}
                            </Text>
                          </View>
                        </View>

                        <Text style={[styles.tlNotes, { color: colors.textPrimary }]}>
                          {fu.notes || 'No discussion notes logged.'}
                        </Text>

                        {fu.next_follow_up_date && (
                          <View style={styles.tlNextActionRow}>
                            <Clock size={11} color={colors.textSecondary} />
                            <Text style={[styles.tlNextText, { color: colors.textSecondary }]}>
                              Next Action: {fu.next_follow_up_date} {fu.next_follow_up_time || ''}
                            </Text>
                          </View>
                        )}
                      </View>
                    ))
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
                            ₹{Number(q.grand_total || q.total_amount || 0).toLocaleString('en-IN')}
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
                  marginBottom: 30,
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
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
  },
  actionBtnHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
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
});

export default LeadProfileModal;

