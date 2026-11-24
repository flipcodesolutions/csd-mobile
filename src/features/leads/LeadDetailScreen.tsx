import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
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
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../core/theme/colors';
import { leadApi, salesExecutiveApi } from './leadService';
import { dealApi } from '../deals/dealService';
import followUpService from '../followups/followUpService';
import {
  Award,
  Clock,
  CreditCard,
  Download,
  Edit3,
  Eye,
  FileText,
  FolderKanban,
  Phone,
  PhoneCall,
  Plus,
  Receipt,
  Shield,
  ShieldCheck,
  Trash2,
} from 'lucide-react-native';
import { quotationApi, quotationService } from '../quotations/quotationService';
import {
  brandApi,
  leadSourceApi,
  leadStatusApi,
  modelApi,
  userApi,
  variantApi,
} from '../masters/masterService';
import { SendQuotationModal } from './components/SendQuotationModal';
import { EditProspectModal } from './components/EditProspectModal';
import { ConvertToDealModal } from './components/ConvertToDealModal';
import { FollowUpModal } from './components/FollowUpModal';
import { QuotationSheetView } from '../quotations/components/QuotationSheetView';
import { QuotationFormData } from '../quotations/types';
import { SourceItem, StatusItem, UserItem } from './types';

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
  const navigation = useNavigation<any>();
  const [lead, setLead] = useState<any>(null);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [selectedQuotationForPreview, setSelectedQuotationForPreview] = useState<any | null>(null);
  const [isDownloadingPdfId, setIsDownloadingPdfId] = useState<number | null>(null);
  const [isDeletingQuotationId, setIsDeletingQuotationId] = useState<number | null>(null);
  const [brandsList, setBrandsList] = useState<any[]>([]);
  const [modelsList, setModelsList] = useState<any[]>([]);
  const [variantsList, setVariantsList] = useState<any[]>([]);
  const [sourcesList, setSourcesList] = useState<SourceItem[]>([]);
  const [statusesList, setStatusesList] = useState<StatusItem[]>([]);
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [showEditLeadModal, setShowEditLeadModal] = useState(false);
  const [showDealModal, setShowDealModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSaveFollowUpModal = async (
    targetLeadId: number,
    followUpData: any
  ) => {
    setIsSubmitting(true);
    try {
      const payload: any = {
        follow_up_date: followUpData.follow_up_date,
        follow_up_time: followUpData.follow_up_time || null,
        type: followUpData.type,
        notes: followUpData.notes || '',
        next_follow_up_date: followUpData.next_follow_up_date || null,
        next_follow_up_time: followUpData.next_follow_up_date ? followUpData.next_follow_up_time : null,
        status: followUpData.outcome || followUpData.status,
        lead_status_name: followUpData.status || null,
        is_discount_requested: followUpData.is_discount_requested,
        discount_amount: followUpData.discount_amount,
        reason: followUpData.reason,
      };

      const res = await salesExecutiveApi.createFollowUp(targetLeadId, payload);
      if (res && res.status) {
        Alert.alert('Success', 'Follow-up interaction recorded successfully!');
        setShowFollowUpModal(false);
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
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const fetchDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const [leadRes, historyRes, quoteRes] = await Promise.all([
        leadApi.getById(leadId).catch(() => salesExecutiveApi.getLeadDetails(leadId)),
        salesExecutiveApi.getFollowUps(leadId).catch(() => ({ data: [] })),
        quotationApi.getAll({ lead_id: leadId }).catch(() => ({ data: [] })),
      ]);

      const leadData = leadRes?.data || leadRes;
      if (leadData && (leadData.id || leadRes?.status)) {
        setLead(leadData);
        setFormLeadStatus(leadData.status_name || 'In Follow-Up');
      } else {
        Alert.alert('Error', 'Lead not found or access denied.', [{ text: 'OK', onPress: onBack }]);
      }

      const followUpList =
        historyRes && historyRes.status && Array.isArray(historyRes.data) && historyRes.data.length > 0
          ? historyRes.data
          : Array.isArray(leadRes?.data?.follow_ups) && leadRes.data.follow_ups.length > 0
          ? leadRes.data.follow_ups
          : historyRes?.data || [];
      setFollowUps(followUpList);

      const qItems = Array.isArray(quoteRes) ? quoteRes : quoteRes?.data || [];
      setQuotations(Array.isArray(qItems) ? qItems : []);
    } catch (error: any) {
      console.log('Error fetching lead details:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Unable to load lead details.', [
        { text: 'OK', onPress: onBack },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [leadId, onBack]);

  const loadMasters = useCallback(async () => {
    try {
      const [bRes, mRes, vRes, sRes, stRes, uRes] = await Promise.all([
        brandApi.getAll({ per_page: 100 }).catch(() => ({ data: [] })),
        modelApi.getAll({ per_page: 100 }).catch(() => ({ data: [] })),
        variantApi.getAll({ per_page: 100 }).catch(() => ({ data: [] })),
        leadSourceApi.getAll().catch(() => ({ data: [] })),
        leadStatusApi.getAll().catch(() => ({ data: [] })),
        userApi.getAll().catch(() => ({ data: [] })),
      ]);
      setBrandsList(Array.isArray(bRes?.data) ? bRes.data : bRes?.data?.data || []);
      setModelsList(Array.isArray(mRes?.data) ? mRes.data : mRes?.data?.data || []);
      setVariantsList(Array.isArray(vRes?.data) ? vRes.data : vRes?.data?.data || []);
      setSourcesList(Array.isArray(sRes?.data) ? sRes.data : Array.isArray(sRes) ? sRes : (sRes as any)?.data?.data || []);
      setStatusesList(Array.isArray(stRes?.data) ? stRes.data : Array.isArray(stRes) ? stRes : (stRes as any)?.data?.data || []);
      setUsersList(Array.isArray(uRes?.data) ? uRes.data : Array.isArray(uRes) ? uRes : (uRes as any)?.data?.data || []);
    } catch (e) {
      console.log('Error loading masters for quotation modal:', e);
    }
  }, []);

  const handleSaveEditedLead = async (formData: any) => {
    if (!lead?.id) return;
    try {
      await leadApi.update(lead.id, formData);
      setShowEditLeadModal(false);
      Alert.alert('Success', 'Lead details updated successfully.');
      fetchDetails();
    } catch (err: any) {
      Alert.alert(
        'Update Failed',
        err?.response?.data?.message || err?.message || 'Could not update lead.'
      );
    }
  };

  const handleConvertToDeal = async (dealData: any) => {
    try {
      await dealApi.create(dealData);
      setShowDealModal(false);
      Alert.alert('Deal Created!', 'Lead converted to deal dossier successfully.');
      fetchDetails();
    } catch (err: any) {
      Alert.alert(
        'Conversion Failed',
        err?.response?.data?.message || err?.message || 'Failed to convert lead to deal.'
      );
    }
  };

  useEffect(() => {
    fetchDetails();
    loadMasters();
  }, [fetchDetails, loadMasters]);

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

  const handleDeleteFollowUp = (item: any) => {
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
              await followUpService.delete(item.id);
              setFollowUps((prev) => prev.filter((f) => f.id !== item.id));
              Alert.alert('Deleted', 'Follow-up deleted successfully.');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete follow-up.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteQuotation = (q: any) => {
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

  const handleDownloadPdf = async (quotationId: number, quotationNo?: string) => {
    try {
      setIsDownloadingPdfId(quotationId);
      await quotationService.downloadPdf(quotationId, quotationNo);
      Alert.alert('Success', `Quotation #${quotationNo || quotationId} PDF downloaded.`);
    } catch (err: any) {
      Alert.alert('Download Error', err?.message || 'Could not download PDF.');
    } finally {
      setIsDownloadingPdfId(null);
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

  const previewFormData: QuotationFormData | null = selectedQuotationForPreview
    ? {
        leadId: lead?.id || null,
        clientName: lead?.name || selectedQuotationForPreview.customer_name || '',
        clientMobile: lead?.phone || selectedQuotationForPreview.customer_phone || '',
        clientEmail: lead?.email || selectedQuotationForPreview.customer_email || '',
        cityJurisdiction: lead?.city || selectedQuotationForPreview.customer_address || '',
        quotationDate:
          selectedQuotationForPreview.quotation_date ||
          (selectedQuotationForPreview.created_at
            ? selectedQuotationForPreview.created_at.split('T')[0]
            : ''),
        brandId: selectedQuotationForPreview.brand_id || null,
        brandName: selectedQuotationForPreview.brand_name || lead?.brand_name || '',
        modelId: selectedQuotationForPreview.model_id || null,
        modelName: selectedQuotationForPreview.model_name || lead?.model_name || '',
        variantId: selectedQuotationForPreview.variant_id || null,
        variantName: selectedQuotationForPreview.variant_name || lead?.variant_name || '',
        sheetCarTitle: selectedQuotationForPreview.brand_name || lead?.brand_name || '',
        sheetModelTitle:
          selectedQuotationForPreview.variant_name ||
          selectedQuotationForPreview.model_name ||
          lead?.model_variant ||
          '',
        fuelType: selectedQuotationForPreview.fuel_type || 'PETROL',
        executiveName: selectedQuotationForPreview.executive_name || lead?.assigned_user_name || '',
        executivePhone: selectedQuotationForPreview.executive_phone || '',
        breakdown: {
          csdPrice: String(
            selectedQuotationForPreview.csd_base_price ||
              selectedQuotationForPreview.ex_showroom_price ||
              ''
          ),
          gjRto: String(
            selectedQuotationForPreview.gj_rto ||
              selectedQuotationForPreview.rto_charges ||
              ''
          ),
          bhRto: String(selectedQuotationForPreview.bh_rto || ''),
          crtm: String(selectedQuotationForPreview.crtm || ''),
          insurance: String(selectedQuotationForPreview.insurance_charges || ''),
          accessories: String(selectedQuotationForPreview.accessories_charges || ''),
          warranty: String(
            selectedQuotationForPreview.warranty ||
              selectedQuotationForPreview.extended_warranty ||
              ''
          ),
          diffAmtCash: String(selectedQuotationForPreview.diff_amt_cash || ''),
          msReward: String(selectedQuotationForPreview.discount_amount || ''),
        },
        grandTotal: Number(
          selectedQuotationForPreview.final_on_road_price ||
            selectedQuotationForPreview.grand_total ||
            selectedQuotationForPreview.total_amount ||
            selectedQuotationForPreview.total ||
            0
        ),
      }
    : null;

  const insurancePolicies = Array.isArray(lead?.insurances)
    ? lead.insurances
    : Array.isArray(lead?.latest_deal?.insurances)
    ? lead.latest_deal.insurances
    : [];

  const activeDeal =
    lead?.latest_deal ||
    (Array.isArray(lead?.deals) && lead.deals.length > 0 ? lead.deals[0] : null);
  const dealPayments = Array.isArray(activeDeal?.payments) ? activeDeal.payments : [];

  return (
    <View style={styles.container}>
      {/* 1. Sub-Header Navigation */}
      <View style={styles.subHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backIcon}>‹</Text>
          <Text style={styles.backLabel}>My Leads</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={styles.leadIdBadge}>
            <Text style={styles.leadIdText}>Lead #{lead.id}</Text>
          </View>

          {/* Edit Lead Button directly on Lead Detail Page */}
          <TouchableOpacity
            style={styles.editLeadTopBtn}
            onPress={() => setShowEditLeadModal(true)}
            activeOpacity={0.8}
          >
            <Edit3 size={13} color="#FFFFFF" strokeWidth={2.4} />
            <Text style={styles.editLeadTopBtnText}>Edit Lead</Text>
          </TouchableOpacity>

          {/* Convert to Deal Button next to Edit Lead */}
          <TouchableOpacity
            style={[styles.editLeadTopBtn, { backgroundColor: '#16A34A' }]}
            onPress={() => setShowDealModal(true)}
            activeOpacity={0.8}
          >
            <Award size={13} color="#FFFFFF" strokeWidth={2.4} />
            <Text style={styles.editLeadTopBtnText}>Convert to Deal</Text>
          </TouchableOpacity>
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

            <TouchableOpacity
              style={styles.quickEditBtn}
              onPress={() => setShowEditLeadModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.quickActionIcon}>✏️</Text>
              <Text style={styles.quickEditText}>Edit Lead</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickEditBtn, { backgroundColor: '#DCFCE7', borderColor: '#16A34A' }]}
              onPress={() => setShowDealModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.quickActionIcon}>🏆</Text>
              <Text style={[styles.quickEditText, { color: '#16A34A' }]}>Convert Deal</Text>
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
            <TouchableOpacity style={styles.nextBannerAction} onPress={() => setShowFollowUpModal(true)}>
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

        {/* 5. Follow-Up History Section (Replicates Screenshot 1) */}
        <View style={styles.sectionCard}>
          <View style={styles.historyHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <PhoneCall size={16} color={colors.primary} />
              <Text style={styles.sectionTitle}>
                Follow-Up History ({followUps.length})
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addInlineBtn}
              onPress={() => setShowFollowUpModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.addInlineText}>+ Log Call / Interaction</Text>
            </TouchableOpacity>
          </View>

          {followUps.length === 0 ? (
            <View style={styles.emptyHistoryBox}>
              <Text style={styles.emptyHistoryIcon}>💬</Text>
              <Text style={styles.emptyHistoryText}>No follow-ups recorded yet.</Text>
              <TouchableOpacity
                style={styles.addFirstBtn}
                onPress={() => setShowFollowUpModal(true)}
              >
                <Text style={styles.addFirstBtnText}>+ Add First Follow-Up</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.timelineList}>
              {followUps.map((item, idx) => {
                const dateStr = formatFollowUpDateTime(item);
                const nextActionStr = item.next_follow_up_date
                  ? `${item.next_follow_up_date}${item.next_follow_up_time ? ' ' + item.next_follow_up_time : ''}`
                  : null;
                return (
                  <View key={item.id || idx} style={styles.followUpCard}>
                    {/* Top Row: Dual Badges on Left, Date + Delete Trash on Right */}
                    <View style={styles.followUpTopRow}>
                      <View style={styles.followUpBadgesRow}>
                        {/* Badge 1: Type (Olive Green) */}
                        <View style={styles.followUpTypeBadge}>
                          <Text style={styles.followUpTypeBadgeText}>
                            {item.type || 'Phone Call'}
                          </Text>
                        </View>
                        {/* Badge 2: Outcome / Status (Soft Cyan) */}
                        {!!(item.status || item.outcome) && (
                          <View style={styles.followUpOutcomeBadge}>
                            <Text style={styles.followUpOutcomeBadgeText}>
                              {item.status || item.outcome}
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={styles.followUpDateText}>
                          {dateStr}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleDeleteFollowUp(item)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          activeOpacity={0.7}
                        >
                          <Trash2 size={13} color="#DC2626" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Middle: Interaction Notes */}
                    <Text style={styles.followUpNotesText}>
                      {item.notes || 'No interaction notes provided.'}
                    </Text>

                    {/* Bottom Footer: Logged By user & Next Action Clock Pill */}
                    <View style={styles.followUpFooterRow}>
                      <Text style={styles.followUpLoggedByText}>
                        Logged By: {item.user_name || item.assigned_user_name || 'Admin User (Super Admin)'}
                      </Text>
                      {nextActionStr && (
                        <View style={styles.followUpNextBadge}>
                          <Clock size={10} color="#D97706" strokeWidth={2.2} />
                          <Text style={styles.followUpNextText}>
                            Next: {nextActionStr}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* 6. Quotations Sent Section (Matches dev.defenceautolink.com/admin/leads/:id) */}
        <View style={styles.sectionCard}>
          <View style={styles.historyHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <FileText size={16} color="#0284C7" />
              <Text style={styles.sectionTitle}>
                Quotations Sent ({quotations.length})
              </Text>
            </View>
            <TouchableOpacity
              style={styles.generateQuoteBtn}
              onPress={() => setShowQuotationModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.generateQuoteBtnText}>+ Generate New Quotation</Text>
            </TouchableOpacity>
          </View>

          {quotations.length === 0 ? (
            <View style={styles.emptyHistoryBox}>
              <Text style={styles.emptyHistoryIcon}>📄</Text>
              <Text style={styles.emptyHistoryText}>No quotations sent for this lead yet.</Text>
              <TouchableOpacity
                style={styles.addFirstBtn}
                onPress={() => setShowQuotationModal(true)}
              >
                <Text style={styles.addFirstBtnText}>+ Create First Quotation</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.timelineList}>
              {quotations.map((q, idx) => (
                <View key={q.id || idx} style={styles.quotationCard}>
                  {/* Row 1: Quotation # & Status Badge */}
                  <View style={styles.qTopRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.qIndexText}>#{idx + 1}</Text>
                      <Text style={styles.qNumberText}>
                        {q.quotation_number || `QT-${q.id}`}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.qStatusBadge,
                        {
                          backgroundColor:
                            q.status === 'accepted'
                              ? 'rgba(34, 197, 94, 0.15)'
                              : q.status === 'sent'
                              ? 'rgba(59, 130, 246, 0.15)'
                              : q.status === 'print'
                              ? 'rgba(168, 85, 247, 0.15)'
                              : 'rgba(245, 158, 11, 0.15)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.qStatusText,
                          {
                            color:
                              q.status === 'accepted'
                                ? '#16A34A'
                                : q.status === 'sent'
                                ? '#2563EB'
                                : q.status === 'print'
                                ? '#9333EA'
                                : '#D97706',
                          },
                        ]}
                      >
                        {q.status || 'pending'}
                      </Text>
                    </View>
                  </View>

                  {/* Row 2: Date & Vehicle */}
                  <View style={styles.qMetaRow}>
                    <Text style={styles.qDateText}>
                      📅 {q.quotation_date || (q.created_at ? q.created_at.split('T')[0] : 'Recent')}
                    </Text>
                    <Text style={styles.qVehicleText} numberOfLines={1}>
                      🚗 {q.variant_name || q.model_name || lead?.model_variant || 'Vehicle'}
                    </Text>
                  </View>

                  {/* Row 3: Total Amount & Action Buttons */}
                  <View style={styles.qBottomRow}>
                    <View>
                      <Text style={styles.qAmountLabel}>Total Amount</Text>
                      <Text style={styles.qAmountText}>
                        ₹{Number(q.final_on_road_price || q.grand_total || q.total_amount || q.total || 0).toLocaleString('en-IN')}
                      </Text>
                    </View>

                    <View style={styles.qActionBtns}>
                      {/* PDF Download Button */}
                      <TouchableOpacity
                        style={styles.qActionBtnPdf}
                        onPress={() => handleDownloadPdf(q.id, q.quotation_number)}
                        disabled={isDownloadingPdfId === q.id}
                        activeOpacity={0.7}
                      >
                        {isDownloadingPdfId === q.id ? (
                          <ActivityIndicator size="small" color="#DC2626" />
                        ) : (
                          <>
                            <Download size={13} color="#DC2626" />
                            <Text style={styles.qActionBtnPdfText}>PDF</Text>
                          </>
                        )}
                      </TouchableOpacity>

                      {/* View Button */}
                      <TouchableOpacity
                        style={styles.qActionBtnView}
                        onPress={() => setSelectedQuotationForPreview(q)}
                        activeOpacity={0.7}
                      >
                        <Eye size={13} color="#0284C7" />
                        <Text style={styles.qActionBtnViewText}>View</Text>
                      </TouchableOpacity>

                      {/* Delete Button */}
                      <TouchableOpacity
                        style={styles.qActionBtnDelete}
                        onPress={() => handleDeleteQuotation(q)}
                        disabled={isDeletingQuotationId === q.id}
                        activeOpacity={0.7}
                      >
                        {isDeletingQuotationId === q.id ? (
                          <ActivityIndicator size="small" color="#DC2626" />
                        ) : (
                          <Trash2 size={13} color="#DC2626" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 7. Insurance Policies & History Section (Screenshot 2) */}
        <View style={styles.sectionCard}>
          <View style={styles.historyHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={16} color="#059669" />
              <Text style={styles.sectionTitle}>
                Insurance Policies & History ({insurancePolicies.length})
              </Text>
            </View>
            <TouchableOpacity
              style={styles.headerQueueBtn}
              onPress={() => navigation?.navigate('pending-insurance')}
              activeOpacity={0.8}
            >
              <Text style={styles.headerQueueBtnText}>🛡️ Pending Insurance Queue</Text>
            </TouchableOpacity>
          </View>

          {insurancePolicies.length === 0 ? (
            <View style={styles.insuranceEmptyBox}>
              <View style={styles.shieldIconCircle}>
                <Shield size={36} color="#94A3B8" strokeWidth={1.8} />
              </View>
              <Text style={styles.insuranceEmptyTitle}>No Insurance Policy Linked Yet</Text>
              <Text style={styles.insuranceEmptySub}>
                This customer does not have an active insurance policy on record.
              </Text>
              <TouchableOpacity
                style={styles.checkPendingInsuranceBtn}
                onPress={() => navigation?.navigate('pending-insurance')}
                activeOpacity={0.8}
              >
                <Text style={styles.checkPendingInsuranceBtnText}>
                  🛡️ Check Pending Insurance Deals
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {insurancePolicies.map((pol: any, idx: number) => (
                <View key={pol.id || idx} style={styles.policyCard}>
                  <View style={styles.policyCardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.policyProviderName}>
                        {pol.provider_name || pol.company_name || pol.insurance_company?.name || 'Insurance'}
                      </Text>
                      <Text style={styles.policyNumber}>#{pol.policy_number || 'POL-PENDING'}</Text>
                    </View>
                    <View style={styles.policyStatusBadge}>
                      <Text style={styles.policyStatusText}>{pol.status || 'Active'}</Text>
                    </View>
                  </View>

                  <View style={styles.policyMetaGrid}>
                    <View style={styles.policyMetaItem}>
                      <Text style={styles.policyMetaLabel}>Plan / Type</Text>
                      <Text style={styles.policyMetaVal}>{pol.plan_type || pol.insurance_plan || 'Comprehensive'}</Text>
                    </View>
                    <View style={styles.policyMetaItem}>
                      <Text style={styles.policyMetaLabel}>Chassis / Reg</Text>
                      <Text style={styles.policyMetaVal}>{pol.vehicle_reg_no || pol.chassis_no || lead?.chassis_number || '-'}</Text>
                    </View>
                    <View style={styles.policyMetaItem}>
                      <Text style={styles.policyMetaLabel}>Validity</Text>
                      <Text style={styles.policyMetaVal}>
                        {pol.policy_start_date || 'Start'} → {pol.policy_expiry_date || 'Expiry'}
                      </Text>
                    </View>
                    <View style={styles.policyMetaItem}>
                      <Text style={styles.policyMetaLabel}>Premium Amount</Text>
                      <Text style={[styles.policyMetaVal, { color: '#059669', fontWeight: '700' }]}>
                        {pol.premium_amount ? `₹${Number(pol.premium_amount).toLocaleString('en-IN')}` : '-'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 8. Deal Ledger & Invoices Section (Screenshot 2) */}
        {activeDeal && (
          <View style={styles.sectionCard}>
            {/* Header */}
            <View style={styles.dealLedgerHeader}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <FolderKanban size={16} color="#0284C7" />
                  <Text style={styles.dealLedgerTitle}>
                    Deal Ledger & Invoices: {activeDeal.deal_number || `DEAL-${activeDeal.id}`}
                  </Text>
                  <View style={styles.dealStageBadge}>
                    <Text style={styles.dealStageBadgeText}>
                      {activeDeal.delivery_stage || activeDeal.status || 'Booking Confirmed'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.dealLedgerSubtitle}>
                  Customer: {lead.name} • {activeDeal.vehicle_name || lead.model_variant || 'Vehicle'}
                </Text>
              </View>

              <View style={styles.dealLedgerHeaderBtns}>
                <TouchableOpacity
                  style={styles.dealHeaderActionBtn}
                  onPress={() => navigation?.navigate('deals')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dealHeaderActionBtnText}>🏆 Deals & Bookings</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dealHeaderActionBtn}
                  onPress={() => navigation?.navigate('generate-invoice')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dealHeaderActionBtnText}>All Invoices</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 3 Summary Financial KPI Cards */}
            <View style={styles.dealKpiCardsRow}>
              {/* Card 1: NET DEAL AMOUNT */}
              <View style={styles.dealKpiCardWhite}>
                <Text style={styles.dealKpiLabel}>NET DEAL AMOUNT</Text>
                <Text style={styles.dealKpiAmount}>
                  ₹{Number(activeDeal.net_amount || activeDeal.total_amount || 0).toLocaleString('en-IN')}
                </Text>
                <Text style={styles.dealKpiSub} numberOfLines={1}>
                  {activeDeal.vehicle_name || lead.model_variant || 'Vehicle'}
                </Text>
              </View>

              {/* Card 2: TOTAL PAID */}
              <View style={styles.dealKpiCardGreen}>
                <Text style={[styles.dealKpiLabel, { color: '#059669' }]}>TOTAL PAID</Text>
                <Text style={[styles.dealKpiAmount, { color: '#059669' }]}>
                  ₹{Number(activeDeal.total_paid || activeDeal.paid_amount || 0).toLocaleString('en-IN')}
                </Text>
                <Text style={[styles.dealKpiSub, { color: '#059669' }]}>
                  {dealPayments.length} Invoices Cleared
                </Text>
              </View>

              {/* Card 3: BALANCE DUE */}
              <View style={styles.dealKpiCardRed}>
                <Text style={[styles.dealKpiLabel, { color: '#DC2626' }]}>BALANCE DUE</Text>
                <Text style={[styles.dealKpiAmount, { color: '#DC2626' }]}>
                  ₹{Number(
                    activeDeal.balance_due ??
                    Math.max(
                      0,
                      (activeDeal.net_amount || activeDeal.total_amount || 0) -
                      (activeDeal.total_paid || activeDeal.paid_amount || 0)
                    )
                  ).toLocaleString('en-IN')}
                </Text>
                <Text style={[styles.dealKpiSub, { color: '#DC2626' }]}>
                  Pending Receivables
                </Text>
              </View>
            </View>

            {/* Invoices List / Table */}
            <View style={styles.invoicesContainer}>
              <View style={styles.invoicesHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Receipt size={14} color="#0284C7" />
                  <Text style={styles.invoicesHeaderText}>
                    All Invoices Issued for this Deal ({dealPayments.length} Invoices)
                  </Text>
                </View>
              </View>

              {dealPayments.length === 0 ? (
                <View style={styles.invoicesEmptyBox}>
                  <Text style={styles.invoicesEmptyText}>No invoices issued for this deal yet.</Text>
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  {dealPayments.map((p: any, idx: number) => (
                    <View key={p.id || idx} style={styles.invoiceItemCard}>
                      <View style={styles.invoiceItemTopRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.invoiceIndexText}>#{idx + 1}</Text>
                          <Text style={styles.invoiceNumberText}>
                            {p.receipt_number || p.invoice_number || `DAL-INV-${p.id}`}
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
                          <Text style={styles.invoiceDetailVal}>
                            {p.payment_date || (p.created_at ? p.created_at.split('T')[0] : '-')}
                          </Text>
                        </View>
                        <View style={styles.invoiceDetailCol}>
                          <Text style={styles.invoiceDetailLabel}>PAYMENT TYPE</Text>
                          <Text style={styles.invoiceDetailVal}>{p.payment_type || p.type || 'Payment'}</Text>
                        </View>
                        <View style={styles.invoiceDetailCol}>
                          <Text style={styles.invoiceDetailLabel}>PAYMENT MODE</Text>
                          <Text style={styles.invoiceDetailVal}>{p.payment_mode || p.mode || 'UPI'}</Text>
                        </View>
                        <View style={styles.invoiceDetailCol}>
                          <Text style={styles.invoiceDetailLabel}>REFERENCE / UTR</Text>
                          <Text style={styles.invoiceDetailVal}>{p.transaction_reference || p.utr_number || p.reference || '-'}</Text>
                        </View>
                      </View>

                      <View style={styles.invoiceBottomActionRow}>
                        <View>
                          <Text style={styles.invoiceAmountLabel}>AMOUNT PAID</Text>
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
      </ScrollView>

      {/* 6. Sticky Floating + Add Follow-Up Button */}
      <View style={styles.stickyFooter}>
        <TouchableOpacity
          style={styles.stickyAddBtn}
          activeOpacity={0.8}
          onPress={() => setShowFollowUpModal(true)}
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
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalContainer, { maxHeight: '92%' }]}>
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

            <ScrollView
              style={{ flexShrink: 1 }}
              contentContainerStyle={[styles.modalBody, keyboardVisible ? { paddingBottom: 60 } : undefined]}
              keyboardShouldPersistTaps="handled"
            >
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

      {/* Send Quotation Modal */}
      <SendQuotationModal
        visible={showQuotationModal}
        lead={lead}
        brands={brandsList}
        models={modelsList}
        variants={variantsList}
        onClose={() => setShowQuotationModal(false)}
        onSuccess={() => {
          setShowQuotationModal(false);
          fetchDetails();
        }}
      />

      {/* Edit Prospect Modal for Lead Detail Screen */}
      <EditProspectModal
        visible={showEditLeadModal}
        lead={lead}
        brands={brandsList}
        models={modelsList}
        variants={variantsList}
        sources={sourcesList}
        statuses={statusesList}
        users={usersList}
        onClose={() => setShowEditLeadModal(false)}
        onSubmit={handleSaveEditedLead}
      />

      {/* Convert to Deal Modal for Lead Detail Screen */}
      <ConvertToDealModal
        visible={showDealModal}
        lead={lead}
        onClose={() => setShowDealModal(false)}
        onSubmit={handleConvertToDeal}
      />

      {/* Quotation Sheet Preview Modal */}
      {previewFormData && (
        <QuotationSheetView
          visible={selectedQuotationForPreview !== null}
          data={previewFormData}
          quotationId={selectedQuotationForPreview?.id}
          quotationNo={selectedQuotationForPreview?.quotation_number}
          onClose={() => setSelectedQuotationForPreview(null)}
        />
      )}

      {/* Follow-Up Modal (No icons on type, full discount integration, date/time pickers) */}
      <FollowUpModal
        visible={showFollowUpModal}
        lead={lead}
        onClose={() => setShowFollowUpModal(false)}
        onSubmit={handleSaveFollowUpModal}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 221, 204, 0.2)',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: colors.headerTitle,
    marginRight: 4,
    fontWeight: '700',
  },
  backLabel: {
    fontSize: 14,
    color: colors.headerTitle,
    fontWeight: '600',
  },
  leadIdBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(217, 221, 204, 0.2)',
  },
  leadIdText: {
    color: colors.headerTitle,
    fontSize: 12,
    fontWeight: '700',
  },
  editLeadTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#58632A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#7A8842',
  },
  editLeadTopBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 90,
    gap: 12,
  },
  heroCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
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
    backgroundColor: colors.primary,
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
    color: colors.textPrimary,
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
    backgroundColor: 'rgba(0, 0, 128, 0.08)',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  quickActionIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  quickCallText: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: '700',
  },
  quickEditBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(88, 99, 42, 0.1)',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#58632A',
  },
  quickEditText: {
    color: '#58632A',
    fontSize: 13,
    fontWeight: '700',
  },
  quickEmailBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 128, 0.08)',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  quickEmailText: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: '700',
  },
  nextBanner: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.orange,
    borderWidth: 1,
    borderColor: 'rgba(238, 104, 0, 0.2)',
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
    color: colors.orange,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  nextBannerDate: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 1,
  },
  nextBannerAction: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  nextBannerActionText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    color: colors.textMuted,
    fontSize: 13,
  },
  detailValue: {
    color: colors.textPrimary,
    fontSize: 13,
  },
  detailValueBold: {
    color: colors.textPrimary,
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
    backgroundColor: 'rgba(88, 99, 42, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  addInlineText: {
    color: colors.primary,
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
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 10,
  },
  addFirstBtn: {
    backgroundColor: colors.primary,
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
    backgroundColor: colors.inputBg,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    backgroundColor: colors.card,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeBadgeText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  timelineDate: {
    color: colors.textMuted,
    fontSize: 11,
  },
  timelineNotes: {
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  noNotesText: {
    color: colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  timelineFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  nextScheduledText: {
    color: colors.orange,
    fontSize: 11,
    fontWeight: '600',
  },
  loggedByText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stickyAddBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
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
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.headerBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 221, 204, 0.2)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.headerTitle,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseText: {
    color: colors.headerTitle,
    fontSize: 16,
    fontWeight: '700',
  },
  modalBody: {
    padding: 16,
    gap: 10,
  },
  modalLeadInfo: {
    backgroundColor: colors.inputBg,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalLeadName: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  modalLeadModel: {
    color: colors.orange,
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
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: colors.textPrimary,
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
    backgroundColor: colors.inputBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeSelectChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryHover,
  },
  typeSelectText: {
    color: colors.textMuted,
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
    borderTopColor: colors.border,
  },
  modalCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  modalSubmitBtn: {
    flex: 2,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primaryHover,
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
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.textMuted,
    marginTop: 12,
    fontSize: 13,
  },
  backBtnInline: {
    marginTop: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  generateQuoteBtn: {
    backgroundColor: '#58632A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  generateQuoteBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  quotationCard: {
    backgroundColor: colors.inputBg,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  qTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qIndexText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  qNumberText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0284C7',
  },
  qStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  qStatusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  qMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qDateText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  qVehicleText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  qBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  qAmountLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },
  qAmountText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#16A34A',
  },
  qActionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qActionBtnPdf: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  qActionBtnPdfText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  qActionBtnView: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    backgroundColor: '#F0F9FF',
  },
  qActionBtnViewText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  qActionBtnDelete: {
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Follow-Up Screen 1 replication
  followUpCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  },
  followUpTypeBadge: {
    backgroundColor: '#58632A', // Defence Army Olive
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  followUpTypeBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  followUpOutcomeBadge: {
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  followUpOutcomeBadgeText: {
    color: '#0284C7',
    fontSize: 11,
    fontWeight: '700',
  },
  followUpDateText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
  },
  followUpNotesText: {
    color: '#1E293B',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
  },
  followUpFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  followUpLoggedByText: {
    color: '#64748B',
    fontSize: 11,
  },
  followUpNextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
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
    paddingVertical: 28,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  shieldIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  insuranceEmptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  insuranceEmptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  checkPendingInsuranceBtn: {
    backgroundColor: '#58632A',
    paddingHorizontal: 16,
    paddingVertical: 9,
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
    padding: 12,
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
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '600',
  },

  // Screenshot 2: Deal Ledger & Invoices Styles
  dealLedgerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  dealLedgerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  dealStageBadge: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dealStageBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  dealLedgerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  dealLedgerHeaderBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dealHeaderActionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
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
    gap: 8,
    marginBottom: 16,
  },
  dealKpiCardWhite: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
  },
  dealKpiCardGreen: {
    flex: 1,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    padding: 10,
  },
  dealKpiCardRed: {
    flex: 1,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 10,
  },
  dealKpiLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 3,
  },
  dealKpiAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  dealKpiSub: {
    fontSize: 10,
    color: '#64748B',
  },
  invoicesContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  invoicesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  invoicesHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  invoicesEmptyBox: {
    padding: 16,
    alignItems: 'center',
  },
  invoicesEmptyText: {
    fontSize: 12,
    color: '#64748B',
  },
  invoiceItemCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
  },
  invoiceItemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  invoiceIndexText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  invoiceNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  invoicePaidBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  invoicePaidBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },
  invoiceDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  invoiceDetailCol: {
    width: '48%',
  },
  invoiceDetailLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
  },
  invoiceDetailVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E293B',
  },
  invoiceBottomActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  invoiceAmountLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
  },
  invoiceAmountVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },
  viewBillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    backgroundColor: '#F0F9FF',
  },
  viewBillBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
});

export const LeadDetailScreen = SalesExecutiveLeadDetailScreen;
export default LeadDetailScreen;
