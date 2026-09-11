import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../colors';
import { salesExecutiveApi } from '../lib/apiServices';

interface Props {
  leadId: number;
  onBack: () => void;
}

const FOLLOW_UP_TYPES = ['Call', 'Meeting', 'WhatsApp', 'Email', 'Visit', 'Other'];
const STATUS_OPTIONS = ['Completed', 'Pending', 'Cancelled'];
const LEAD_STATUS_OPTIONS = [
  'In Follow-Up',
  'Test Drive Scheduled',
  'Quotation Sent',
  'Negotiation',
  'Deal Won',
  'Deal Lost',
];

export const SalesExecutiveLeadDetailScreen: React.FC<Props> = ({ leadId, onBack }) => {
  const [lead, setLead] = useState<any>(null);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const [formDate, setFormDate] = useState(todayStr);
  const [formTime, setFormTime] = useState('14:30');
  const [formType, setFormType] = useState('Call');
  const [formNotes, setFormNotes] = useState('');
  const [formNextDate, setFormNextDate] = useState('');
  const [formNextTime, setFormNextTime] = useState('11:00');
  const [formStatus, setFormStatus] = useState('Completed');
  const [formLeadStatus, setFormLeadStatus] = useState('');

  const fetchDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const [leadRes, historyRes] = await Promise.all([
        salesExecutiveApi.getLeadDetails(leadId),
        salesExecutiveApi.getFollowUps(leadId).catch(() => ({ data: [] })),
      ]);

      if (leadRes && leadRes.status && leadRes.data) {
        setLead(leadRes.data);
        setFormLeadStatus(leadRes.data.status_name || 'In Follow-Up');
      } else {
        Alert.alert('Error', 'Lead not found or access denied.', [{ text: 'OK', onPress: onBack }]);
      }

      if (historyRes && historyRes.status) {
        setFollowUps(historyRes.data || []);
      }
    } catch (error: any) {
      console.log('Error fetching lead details:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Unable to load lead details.', [
        { text: 'OK', onPress: onBack },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [leadId, onBack]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleCall = (phone: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert('Error', 'Unable to launch phone dialer.');
    });
  };

  const handleEmail = (email: string) => {
    if (!email) return;
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert('Error', 'Unable to launch email client.');
    });
  };

  const handleSaveFollowUp = async () => {
    if (!formDate) {
      Alert.alert('Validation', 'Please enter follow-up date (YYYY-MM-DD).');
      return;
    }
    if (!formType) {
      Alert.alert('Validation', 'Please select an interaction type.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        follow_up_date: formDate,
        follow_up_time: formTime || null,
        type: formType,
        notes: formNotes || '',
        next_follow_up_date: formNextDate || null,
        next_follow_up_time: formNextDate ? formNextTime : null,
        status: formStatus,
        lead_status_name: formLeadStatus || null,
      };

      const res = await salesExecutiveApi.createFollowUp(leadId, payload);
      if (res && res.status) {
        Alert.alert('Success', 'Follow-up interaction recorded successfully!');
        setShowModal(false);
        setFormNotes('');
        setFormNextDate('');
        fetchDetails();
      } else {
        Alert.alert('Error', res?.message || 'Failed to save follow-up.');
      }
    } catch (error: any) {
      console.log('Error saving follow-up:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to save follow-up.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'hot':
        return '#ef4444';
      case 'warm':
        return '#f59e0b';
      case 'cold':
        return '#38bdf8';
      default:
        return '#94a3b8';
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'deal won':
      case 'converted':
        return { bg: 'rgba(34, 197, 94, 0.2)', text: '#22c55e' };
      case 'deal lost':
        return { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' };
      case 'in follow-up':
      case 'in follow up':
        return { bg: 'rgba(59, 130, 246, 0.2)', text: '#3b82f6' };
      default:
        return { bg: 'rgba(148, 163, 184, 0.2)', text: '#94a3b8' };
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading lead details...</Text>
      </View>
    );
  }

  if (!lead) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Lead not available.</Text>
        <TouchableOpacity style={styles.backBtnInline} onPress={onBack}>
          <Text style={styles.backBtnText}>← Back to Leads</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const nextDate =
    lead.latest_follow_up?.next_follow_up_date ||
    (followUps.length > 0 && followUps[0]?.next_follow_up_date);
  const nextTime =
    lead.latest_follow_up?.next_follow_up_time ||
    (followUps.length > 0 && followUps[0]?.next_follow_up_time);

  return (
    <View style={styles.container}>
      {/* 1. Sub-Header Navigation */}
      <View style={styles.subHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backIcon}>‹</Text>
          <Text style={styles.backLabel}>My Leads</Text>
        </TouchableOpacity>

        <View style={styles.leadIdBadge}>
          <Text style={styles.leadIdText}>Lead #{lead.id}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 2. Customer Hero Header */}
        <View style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View style={styles.heroAvatar}>
              <Text style={styles.heroAvatarText}>{lead.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>{lead.name}</Text>
              <View style={styles.heroBadges}>
                <View
                  style={[
                    styles.heroPriorityBadge,
                    { borderColor: getPriorityColor(lead.priority) },
                  ]}
                >
                  <Text
                    style={[styles.heroPriorityText, { color: getPriorityColor(lead.priority) }]}
                  >
                    ● {lead.priority || 'Standard'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.heroStatusBadge,
                    { backgroundColor: getStatusBadgeStyle(lead.status_name).bg },
                  ]}
                >
                  <Text
                    style={[
                      styles.heroStatusText,
                      { color: getStatusBadgeStyle(lead.status_name).text },
                    ]}
                  >
                    {lead.status_name || 'New'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Action Dial / Message Buttons */}
          <View style={styles.quickActionRow}>
            <TouchableOpacity style={styles.quickCallBtn} onPress={() => handleCall(lead.phone)}>
              <Text style={styles.quickActionIcon}>📞</Text>
              <Text style={styles.quickCallText}>Call {lead.phone}</Text>
            </TouchableOpacity>

            {lead.email && (
              <TouchableOpacity
                style={styles.quickEmailBtn}
                onPress={() => handleEmail(lead.email)}
              >
                <Text style={styles.quickActionIcon}>✉️</Text>
                <Text style={styles.quickEmailText}>Email</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 3. Next Follow-Up Callout Banner (if scheduled) */}
        {nextDate && (
          <View style={styles.nextBanner}>
            <View style={styles.nextBannerLeft}>
              <Text style={styles.nextBannerIcon}>⏰</Text>
              <View>
                <Text style={styles.nextBannerTitle}>SCHEDULED NEXT FOLLOW-UP</Text>
                <Text style={styles.nextBannerDate}>
                  {nextDate} {nextTime ? `at ${nextTime}` : ''}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.nextBannerAction} onPress={() => setShowModal(true)}>
              <Text style={styles.nextBannerActionText}>Log Outcome</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 4. Requirement Details Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🚗 Vehicle Requirement</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Model & Variant</Text>
            <Text style={styles.detailValueBold}>{lead.model_variant || '-'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Segment / Brand</Text>
            <Text style={styles.detailValue}>
              {lead.vehicle_segment} • {lead.brand_name || '-'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Purchase Timeline</Text>
            <Text style={[styles.detailValue, { color: '#f59e0b', fontWeight: '700' }]}>
              {lead.purchase_timeline || 'Standard'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>
              {lead.city || '-'}
              {lead.state ? `, ${lead.state}` : ''}
            </Text>
          </View>
        </View>

        {/* 5. Follow-Up History Section */}
        <View style={styles.sectionCard}>
          <View style={styles.historyHeader}>
            <Text style={styles.sectionTitle}>📋 Follow-Up History ({followUps.length})</Text>
            <TouchableOpacity
              style={styles.addInlineBtn}
              onPress={() => setShowModal(true)}
            >
              <Text style={styles.addInlineText}>+ Log Note</Text>
            </TouchableOpacity>
          </View>

          {followUps.length === 0 ? (
            <View style={styles.emptyHistoryBox}>
              <Text style={styles.emptyHistoryIcon}>💬</Text>
              <Text style={styles.emptyHistoryText}>No follow-ups recorded yet.</Text>
              <TouchableOpacity
                style={styles.addFirstBtn}
                onPress={() => setShowModal(true)}
              >
                <Text style={styles.addFirstBtnText}>+ Add First Follow-Up</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.timelineList}>
              {followUps.map((item, idx) => (
                <View key={item.id || idx} style={styles.timelineCard}>
                  <View style={styles.timelineHeader}>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>
                        {item.type === 'Call'
                          ? '📞 Call'
                          : item.type === 'Meeting'
                          ? '🤝 Meeting'
                          : item.type === 'WhatsApp'
                          ? '💬 WhatsApp'
                          : item.type}
                      </Text>
                    </View>
                    <Text style={styles.timelineDate}>
                      {item.follow_up_date} {item.follow_up_time ? `• ${item.follow_up_time}` : ''}
                    </Text>
                  </View>

                  {item.notes ? (
                    <Text style={styles.timelineNotes}>{item.notes}</Text>
                  ) : (
                    <Text style={styles.noNotesText}>No interaction notes provided.</Text>
                  )}

                  <View style={styles.timelineFooter}>
                    {item.next_follow_up_date ? (
                      <Text style={styles.nextScheduledText}>
                        Next: {item.next_follow_up_date}
                        {item.next_follow_up_time ? ` (${item.next_follow_up_time})` : ''}
                      </Text>
                    ) : (
                      <Text style={styles.loggedByText}>Outcome: {item.status}</Text>
                    )}
                    <Text style={styles.loggedByText}>
                      By: {item.user_name || 'Executive'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 6. Sticky Floating + Add Follow-Up Button */}
      <View style={styles.stickyFooter}>
        <TouchableOpacity
          style={styles.stickyAddBtn}
          activeOpacity={0.8}
          onPress={() => setShowModal(true)}
        >
          <Text style={styles.stickyAddIcon}>＋</Text>
          <Text style={styles.stickyAddText}>Add Follow-Up</Text>
        </TouchableOpacity>
      </View>

      {/* ------------------------------------------------------------------
          + ADD FOLLOW-UP MODAL
          ------------------------------------------------------------------ */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Follow-Up Interaction</Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              {/* Customer Info Snippet */}
              <View style={styles.modalLeadInfo}>
                <Text style={styles.modalLeadName}>{lead.name}</Text>
                <Text style={styles.modalLeadModel}>🚗 {lead.model_variant}</Text>
              </View>

              {/* Follow-Up Date & Time */}
              <View style={styles.inputRow}>
                <View style={styles.inputCol}>
                  <Text style={styles.inputLabel}>Date (YYYY-MM-DD) *</Text>
                  <TextInput
                    style={styles.input}
                    value={formDate}
                    onChangeText={setFormDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#64748b"
                  />
                </View>
                <View style={styles.inputCol}>
                  <Text style={styles.inputLabel}>Time</Text>
                  <TextInput
                    style={styles.input}
                    value={formTime}
                    onChangeText={setFormTime}
                    placeholder="HH:MM"
                    placeholderTextColor="#64748b"
                  />
                </View>
              </View>

              {/* Interaction Type Chips */}
              <Text style={styles.inputLabel}>Interaction Type *</Text>
              <View style={styles.typeSelectorRow}>
                {FOLLOW_UP_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeSelectChip, formType === t && styles.typeSelectChipActive]}
                    onPress={() => setFormType(t)}
                  >
                    <Text
                      style={[
                        styles.typeSelectText,
                        formType === t && styles.typeSelectTextActive,
                      ]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Outcome Status Chips */}
              <Text style={styles.inputLabel}>Interaction Outcome Status *</Text>
              <View style={styles.typeSelectorRow}>
                {STATUS_OPTIONS.map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.typeSelectChip,
                      formStatus === st && styles.typeSelectChipActive,
                    ]}
                    onPress={() => setFormStatus(st)}
                  >
                    <Text
                      style={[
                        styles.typeSelectText,
                        formStatus === st && styles.typeSelectTextActive,
                      ]}
                    >
                      {st}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Discussion Notes */}
              <Text style={styles.inputLabel}>Discussion Notes / Key Details</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLines={4}
                value={formNotes}
                onChangeText={setFormNotes}
                placeholder="Enter summary of discussion, customer requirements, test drive feedback..."
                placeholderTextColor="#64748b"
                textAlignVertical="top"
              />

              {/* Next Follow-Up Date & Time */}
              <View style={styles.inputRow}>
                <View style={styles.inputCol}>
                  <Text style={[styles.inputLabel, { color: '#f59e0b' }]}>
                    Next Follow-Up Date
                  </Text>
                  <TextInput
                    style={[styles.input, { borderColor: '#f59e0b' }]}
                    value={formNextDate}
                    onChangeText={setFormNextDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#64748b"
                  />
                </View>
                <View style={styles.inputCol}>
                  <Text style={[styles.inputLabel, { color: '#f59e0b' }]}>Next Time</Text>
                  <TextInput
                    style={[styles.input, { borderColor: '#f59e0b' }]}
                    value={formNextTime}
                    onChangeText={setFormNextTime}
                    placeholder="11:00"
                    placeholderTextColor="#64748b"
                  />
                </View>
              </View>

              {/* Update Lead Pipeline Status */}
              <Text style={styles.inputLabel}>Update Lead Pipeline Status</Text>
              <View style={styles.typeSelectorRow}>
                {LEAD_STATUS_OPTIONS.map((ls) => (
                  <TouchableOpacity
                    key={ls}
                    style={[
                      styles.typeSelectChip,
                      formLeadStatus === ls && styles.typeSelectChipActive,
                    ]}
                    onPress={() => setFormLeadStatus(ls)}
                  >
                    <Text
                      style={[
                        styles.typeSelectText,
                        formLeadStatus === ls && styles.typeSelectTextActive,
                      ]}
                    >
                      {ls}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowModal(false)}
                disabled={isSubmitting}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSaveFollowUp}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalSubmitText}>Save Follow-Up</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#3b82f6',
    marginRight: 4,
    fontWeight: '700',
  },
  backLabel: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  leadIdBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  leadIdText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 90,
    gap: 12,
  },
  heroCard: {
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1f293d',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  heroAvatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  heroInfo: {
    flex: 1,
  },
  heroName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  heroBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  heroPriorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  heroPriorityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  heroStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  heroStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickCallBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  quickActionIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  quickCallText: {
    color: '#4ade80',
    fontSize: 13,
    fontWeight: '700',
  },
  quickEmailBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  quickEmailText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '700',
  },
  nextBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nextBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nextBannerIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  nextBannerTitle: {
    fontSize: 10,
    color: '#f59e0b',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  nextBannerDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 1,
  },
  nextBannerAction: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  nextBannerActionText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1f293d',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 41, 59, 0.4)',
  },
  detailLabel: {
    color: '#94a3b8',
    fontSize: 13,
  },
  detailValue: {
    color: '#ffffff',
    fontSize: 13,
  },
  detailValueBold: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addInlineBtn: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  addInlineText: {
    color: '#3b82f6',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyHistoryBox: {
    alignItems: 'center',
    padding: 24,
  },
  emptyHistoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyHistoryText: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 10,
  },
  addFirstBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addFirstBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  timelineList: {
    gap: 10,
  },
  timelineCard: {
    backgroundColor: '#131b2e',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  typeBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  timelineDate: {
    color: '#94a3b8',
    fontSize: 11,
  },
  timelineNotes: {
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  noNotesText: {
    color: '#64748b',
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  timelineFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  nextScheduledText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '600',
  },
  loggedByText: {
    color: '#94a3b8',
    fontSize: 11,
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    backgroundColor: '#111827',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  stickyAddBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  stickyAddIcon: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    marginRight: 6,
  },
  stickyAddText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '700',
  },
  modalBody: {
    padding: 16,
    gap: 10,
  },
  modalLeadInfo: {
    backgroundColor: '#1e293b',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalLeadName: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  modalLeadModel: {
    color: '#f59e0b',
    fontWeight: '600',
    fontSize: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputCol: {
    flex: 1,
  },
  inputLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#131b2e',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#ffffff',
    fontSize: 13,
  },
  textArea: {
    height: 75,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  typeSelectChip: {
    backgroundColor: '#131b2e',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  typeSelectChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#3b82f6',
  },
  typeSelectText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  typeSelectTextActive: {
    color: '#ffffff',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  modalCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalCancelText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  modalSubmitBtn: {
    flex: 2,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalSubmitText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#090d16',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 13,
  },
  backBtnInline: {
    marginTop: 12,
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});
