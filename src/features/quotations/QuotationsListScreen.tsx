import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Calendar,
  Download,
  FileSpreadsheet,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react-native';
import { useTheme } from '../../core/theme/ThemeContext';
import { triggerHaptic } from '../../core/utils/haptics';
import { showErrorToast, showSuccessToast } from '../../core/utils/toast';
import { exportCsvToFile } from '../../core/utils/csvExporter';
import { DatePickerModal } from '../leads/components/DatePickerModal';
import { FabSpeedDial } from '../../shared/FabSpeedDial';
import { Quotation, QuotationFormData } from './types';
import { quotationService } from './quotationService';
import { QuotationCard } from './components/QuotationCard';
import { QuotationSheetView } from './components/QuotationSheetView';
import { EmailQuotationModal } from './components/EmailQuotationModal';
import { LeadProfileModal } from '../leads/components/LeadProfileModal';
import { ConvertToDealModal } from '../leads/components/ConvertToDealModal';
import { CustomerLead } from '../leads/types';
import { leadApi } from '../leads/leadService';
import { dealApi } from '../deals/dealService';

interface QuotationsListScreenProps {
  onNavigateToCreate?: () => void;
  onOpenDrawer?: () => void;
  onSelectLead?: (leadId: number) => void;
}

// Status Filters - All Status, Pending, Email Sent, Print
const STATUS_FILTERS = [
  { key: 'all', label: 'All Status' },
  { key: 'pending', label: 'Pending' },
  { key: 'sent', label: 'Email Sent' },
  { key: 'print', label: 'Print' },
];

export const QuotationsListScreen: React.FC<QuotationsListScreenProps> = ({
  onNavigateToCreate,
  onOpenDrawer,
  onSelectLead,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Search & Filter States (Default activeStatus is 'all')
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');
  const [isTrashView, setIsTrashView] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [datePickerTarget, setDatePickerTarget] = useState<'from' | 'to' | null>(null);

  // Data States
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Preview & Email Modals
  const [previewQuote, setPreviewQuote] = useState<Quotation | null>(null);
  const [emailQuote, setEmailQuote] = useState<Quotation | null>(null);

  // Lead Profile Modal States (Matches 360° Lead Details from Leads Screen)
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [activeProfileLead, setActiveProfileLead] = useState<CustomerLead | null>(null);
  const [dealModalVisible, setDealModalVisible] = useState(false);
  const [activeDealLead, setActiveDealLead] = useState<CustomerLead | null>(null);

  const handleCall = (phone: string) => {
    const cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned) {
      Linking.openURL(`tel:${cleaned}`).catch(() => {});
    }
  };

  const handleConvertToDeal = async (dealData: any) => {
    try {
      await dealApi.create(dealData);
      setDealModalVisible(false);
      showSuccessToast('Deal Created', 'Lead converted to deal dossier successfully.');
      fetchQuotations(1);
    } catch (err: any) {
      Alert.alert(
        'Conversion Failed',
        err?.response?.data?.message || err?.message || 'Failed to convert lead to deal.'
      );
    }
  };

  const handleSelectCustomerLead = async (leadId: number, q?: Quotation) => {
    triggerHaptic();
    if (leadId) {
      try {
        const res = await leadApi.getById(leadId);
        const fullLead = res?.data || res;
        if (fullLead && (fullLead.name || fullLead.id)) {
          setActiveProfileLead(fullLead);
          setProfileModalVisible(true);
          return;
        }
      } catch (e) {
        console.log('Error fetching lead details for profile modal:', e);
      }
    }

    if (q) {
      const syntheticLead: CustomerLead = {
        id: leadId || q.id,
        name: q.customer_name || 'Customer',
        phone: q.customer_phone || '',
        email: q.customer_email || '',
        city: q.customer_address || '',
        vehicle_segment: '4 Wheeler',
        model_variant: q.variant_name || q.model_name || '',
        brand_name: q.brand_name || '',
        priority: 'Hot',
        status_name: q.status || 'Active',
        assigned_user_name: q.executive_name || '',
      };
      setActiveProfileLead(syntheticLead);
      setProfileModalVisible(true);
    }
  };

  const fetchQuotations = useCallback(
    async (pageNum = 1, isRefresh = false) => {
      try {
        if (pageNum === 1 && !isRefresh) setLoading(true);

        const res = await quotationService.getAll({
          page: pageNum,
          per_page: 15,
          search: searchQuery,
          status: activeStatus === 'all' ? undefined : activeStatus,
          from_date: fromDate,
          to_date: toDate,
          trash: isTrashView,
        });

        const items = res?.data?.data || res?.data || [];
        const records = Array.isArray(items) ? items : [];

        if (pageNum === 1) {
          setQuotations(records);
        } else {
          setQuotations((prev) => [...prev, ...records]);
        }

        const currentPage = res?.data?.current_page || pageNum;
        const lastPage = res?.data?.last_page || 1;
        setHasMore(currentPage < lastPage);
        setPage(pageNum);
      } catch (err: any) {
        console.log('Error fetching quotations:', err);
        if (pageNum === 1) {
          setQuotations((prev) => (prev.length > 0 ? prev : []));
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [searchQuery, activeStatus, isTrashView, fromDate, toDate]
  );

  useEffect(() => {
    fetchQuotations(1);
  }, [fetchQuotations]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchQuotations(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      setLoadingMore(true);
      fetchQuotations(page + 1);
    }
  };

  // Export to Excel / CSV
  const handleExportExcel = async () => {
    try {
      triggerHaptic();
      if (!quotations || quotations.length === 0) {
        showErrorToast('No Data', 'No quotations to export.');
        return;
      }

      const headers = [
        'Quotation No',
        'Customer Name',
        'Customer Phone',
        'Subject / Vehicle',
        'Quotation Date',
        'Grand Total (INR)',
        'Status',
      ];

      const rows = quotations.map((q) => [
        q.quotation_number || `QT-${q.id}`,
        q.customer_name || 'N/A',
        q.customer_phone || '',
        q.subject || `${q.brand_name || ''} ${q.model_name || ''}`,
        q.quotation_date || q.created_at?.slice(0, 10) || '',
        Number(q.final_on_road_price || q.grand_total || q.total_amount || q.total || 0),
        q.status || 'Sent',
      ]);

      const filename = `Quotations_Archive_${new Date().toISOString().slice(0, 10)}`;
      await exportCsvToFile({ filename, headers, rows });
    } catch (err: any) {
      showErrorToast('Export Failed', err.message || 'Could not export quotations.');
    }
  };

  // Convert Quotation to QuotationFormData for Sheet Preview
  const buildFormDataFromQuote = (q: Quotation): QuotationFormData => {
    const items = q.items || [];
    const getVal = (nameKeywords: string[]) => {
      for (const kw of nameKeywords) {
        const match = items.find((i) =>
          i.item_name?.toLowerCase().includes(kw.toLowerCase())
        );
        if (match) {
          const val = match.total ?? match.unit_price ?? (match as any).price;
          if (val !== undefined && val !== null && String(val) !== '') {
            return String(val);
          }
        }
      }
      return '';
    };

    const firstItem = items[0];

    const clientName =
      q.customer_name ||
      (q as any).client_name ||
      (q as any).lead?.name ||
      (q as any).customer?.name ||
      '';

    const clientMobile =
      q.customer_phone ||
      (q as any).client_mobile ||
      (q as any).lead?.phone ||
      '';

    const clientEmail =
      q.customer_email ||
      (q as any).client_email ||
      (q as any).lead?.email ||
      '';

    const cityJurisdiction =
      q.customer_address ||
      (q as any).city ||
      (q as any).lead?.city ||
      '';

    const executiveName =
      q.executive_name ||
      (q as any).user?.name ||
      (q as any).created_by_name ||
      (q as any).creator?.name ||
      'Admin User';

    const executivePhone =
      q.executive_phone ||
      (q as any).user?.phone ||
      (q as any).user?.mobile ||
      (q as any).creator?.phone ||
      '+91 98000 11111';

    const csdPriceVal =
      String(firstItem?.unit_price || (q as any).csd_base_price || (q as any).ex_showroom_price || q.subtotal || 0);

    const gjRtoVal =
      getVal(['gujarat', 'gj rto', 'gj_rto', 'rto & registration', 'rto']) ||
      String((q as any).gj_rto || (q as any).rto_charges || '');

    const bhRtoVal =
      getVal(['bh series', 'bh rto', 'bh_rto', 'bh']) ||
      String((q as any).bh_rto || '');

    const crtmVal =
      getVal(['crtm']) ||
      String((q as any).crtm || '');

    const insuranceVal =
      getVal(['insurance', 'zero-dep']) ||
      String((q as any).insurance_charges || (q as any).insurance || '');

    const accessoriesVal =
      getVal(['accessories', 'accessory']) ||
      String((q as any).accessories_charges || (q as any).accessories || '');

    const warrantyVal =
      getVal(['warranty', 'extended']) ||
      String((q as any).warranty || (q as any).extended_warranty || (q as any).warranty_tenure || '');

    const diffAmtCashVal =
      getVal(['difference', 'cash adjustment', 'diff_amt_cash', 'diff', 'cash']) ||
      String((q as any).diff_amt_cash || '');

    const msRewardVal =
      getVal(['reword', 'reward', 'discount', 'm.s']) ||
      String((q as any).discount_amount || (q as any).ms_reward || (q as any).ms_reword || (q as any).discount || '');

    return {
      leadId: q.lead_id || null,
      clientName,
      clientMobile,
      clientEmail,
      cityJurisdiction,
      quotationDate: q.quotation_date || q.created_at?.slice(0, 10) || '',
      brandId: null,
      brandName: q.brand_name || '',
      modelId: null,
      modelName: q.model_name || '',
      variantId: null,
      variantName: q.variant_name || '',
      sheetCarTitle: q.brand_name || firstItem?.item_name?.split('–')[0]?.trim() || '',
      sheetModelTitle: q.model_name || firstItem?.item_name?.split('–')[1]?.trim() || '',
      fuelType: 'PETROL',
      executiveName,
      executivePhone,
      breakdown: {
        csdPrice: csdPriceVal,
        gjRto: gjRtoVal,
        bhRto: bhRtoVal,
        crtm: crtmVal,
        insurance: insuranceVal,
        accessories: accessoriesVal,
        warranty: warrantyVal,
        diffAmtCash: diffAmtCashVal,
        msReward: msRewardVal,
      },
      grandTotal: Number(
        q.final_on_road_price || q.grand_total || q.total_amount || q.total || 0
      ),
    };
  };

  const handleView = async (q: Quotation) => {
    triggerHaptic();
    setPreviewQuote(q);
    try {
      const res = await quotationService.getById(q.id);
      const fullQuote = res?.data || res;
      if (fullQuote && fullQuote.id === q.id) {
        setPreviewQuote((prev) => (prev?.id === q.id ? { ...prev, ...fullQuote } : prev));
      }
    } catch (err) {
      console.log('Error fetching full quotation details for preview:', err);
    }
  };

  const handleOpenConvertDeal = async (q: Quotation) => {
    triggerHaptic();
    let targetLead: CustomerLead | null = null;
    const targetLeadId = q.lead_id || (q as any).leadId || (q as any).customer_id;
    if (targetLeadId) {
      try {
        const res = await leadApi.getById(targetLeadId);
        targetLead = res?.data || res;
      } catch (e) {
        console.log('Error fetching lead for convert to deal:', e);
      }
    }
    if (!targetLead) {
      targetLead = {
        id: targetLeadId || q.id,
        name: q.customer_name || 'Customer',
        phone: q.customer_phone || '',
        email: q.customer_email || '',
        city: q.customer_address || '',
        vehicle_segment: '4 Wheeler',
        model_variant: q.variant_name || q.model_name || '',
        brand_name: q.brand_name || '',
        priority: 'Hot',
        status_name: q.status || 'Active',
        assigned_user_name: q.executive_name || '',
      };
    }
    setActiveDealLead(targetLead);
    setDealModalVisible(true);
  };

  const handleDownload = async (q: Quotation) => {
    try {
      triggerHaptic();
      showSuccessToast('Downloading...', 'Initiating Quotation PDF download.');
      const path = await quotationService.downloadPdf(q.id, q.quotation_number);
      showSuccessToast('Downloaded', `Saved to ${path}`);
      // Task 1: Update status to 'print' on PDF download/print
      await quotationService.updateStatus(q.id, 'print').catch(() => {});
      setQuotations((prev) =>
        prev.map((item) => (item.id === q.id ? { ...item, status: 'print' } : item))
      );
    } catch (err: any) {
      showErrorToast('Download Failed', err?.message || 'Could not download PDF.');
    }
  };

  const handleDelete = (q: Quotation) => {
    triggerHaptic();
    Alert.alert(
      'Move to Trash',
      `Are you sure you want to move quotation ${q.quotation_number || q.id} to trash?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Move to Trash',
          style: 'destructive',
          onPress: async () => {
            try {
              await quotationService.delete(q.id);
              showSuccessToast('Moved to Trash', 'Quotation soft-deleted successfully.');
              setQuotations((prev) => prev.filter((item) => item.id !== q.id));
            } catch (err: any) {
              showErrorToast('Failed', err?.message || 'Could not delete quotation.');
            }
          },
        },
      ]
    );
  };

  const handleRestore = async (q: Quotation) => {
    triggerHaptic();
    try {
      await quotationService.restore(q.id);
      showSuccessToast('Restored', 'Quotation restored from trash.');
      setQuotations((prev) => prev.filter((item) => item.id !== q.id));
    } catch (err: any) {
      showErrorToast('Failed', err?.message || 'Could not restore quotation.');
    }
  };

  // Floating Action Items (Task 3)
  const fabActions = [
    {
      label: 'New Quote',
      icon: <Plus size={20} color="#FFFFFF" />,
      backgroundColor: '#1E3A8A',
      onPress: () => {
        triggerHaptic();
        onNavigateToCreate?.();
      },
    },
    {
      label: 'Export to Excel',
      icon: <FileSpreadsheet size={18} color="#FFFFFF" />,
      backgroundColor: '#059669',
      onPress: handleExportExcel,
    },
    {
      label: isTrashView ? 'Active Quotes' : 'Trash View',
      icon: <Trash2 size={18} color="#FFFFFF" />,
      backgroundColor: isTrashView ? '#2563EB' : '#EF4444',
      onPress: () => {
        triggerHaptic();
        setIsTrashView(!isTrashView);
      },
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
      {/* Top Bar Header (Task 3: Trash Icon only, New Quote moved to FAB) */}
      <View
        style={[
          styles.headerRow,
          {
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            borderBottomColor: isDark ? '#334155' : '#E2E8F0',
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Text style={[styles.screenHeading, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            Saved Quotations Archive
          </Text>
          <Text style={styles.screenSub}>
            {isTrashView ? 'Trash Folder (Deleted Records)' : 'Official vehicle quotes & PDF logs'}
          </Text>
        </View>

        <View style={styles.headerRight}>
          {/* Trash Icon Button Only */}
          <TouchableOpacity
            style={[
              styles.trashIconButton,
              isTrashView && styles.trashIconButtonActive,
              { borderColor: isTrashView ? '#EF4444' : isDark ? '#334155' : '#CBD5E1' },
            ]}
            onPress={() => {
              triggerHaptic();
              setIsTrashView(!isTrashView);
            }}
            activeOpacity={0.7}
          >
            <Trash2 size={18} color={isTrashView ? '#FFFFFF' : '#EF4444'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar & Date Filter Container */}
      <View
        style={[
          styles.filtersContainer,
          {
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            borderBottomColor: isDark ? '#334155' : '#E2E8F0',
          },
        ]}
      >
        {/* Search Input */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: isDark ? '#0F172A' : '#F1F5F9',
              borderColor: isDark ? '#334155' : '#CBD5E1',
            },
          ]}
        >
          <Search size={16} color="#94A3B8" />
          <TextInput
            style={[styles.searchInput, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
            placeholder="Search customer, phone, quote number..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => fetchQuotations(1)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Task 3: Date Range Filter Bar (Matching FollowUpScreen) */}
        <View style={styles.dateFilterRow}>
          <TouchableOpacity
            style={[
              styles.dateFilterBtn,
              fromDate ? styles.dateFilterBtnActive : null,
              {
                backgroundColor: isDark ? '#0F172A' : '#F1F5F9',
                borderColor: fromDate ? '#1E3A8A' : isDark ? '#334155' : '#CBD5E1',
              },
            ]}
            onPress={() => {
              triggerHaptic();
              setDatePickerTarget('from');
            }}
            activeOpacity={0.7}
          >
            <Calendar size={13} color={fromDate ? '#1E3A8A' : '#94A3B8'} />
            <Text
              style={[
                styles.dateFilterBtnText,
                { color: fromDate ? '#1E3A8A' : isDark ? '#CBD5E1' : '#64748B' },
              ]}
            >
              {fromDate ? `From: ${fromDate}` : 'From Date'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.dateFilterBtn,
              toDate ? styles.dateFilterBtnActive : null,
              {
                backgroundColor: isDark ? '#0F172A' : '#F1F5F9',
                borderColor: toDate ? '#1E3A8A' : isDark ? '#334155' : '#CBD5E1',
              },
            ]}
            onPress={() => {
              triggerHaptic();
              setDatePickerTarget('to');
            }}
            activeOpacity={0.7}
          >
            <Calendar size={13} color={toDate ? '#1E3A8A' : '#94A3B8'} />
            <Text
              style={[
                styles.dateFilterBtnText,
                { color: toDate ? '#1E3A8A' : isDark ? '#CBD5E1' : '#64748B' },
              ]}
            >
              {toDate ? `To: ${toDate}` : 'To Date'}
            </Text>
          </TouchableOpacity>

          {(fromDate || toDate) && (
            <TouchableOpacity
              style={styles.clearDateBtn}
              onPress={() => {
                triggerHaptic();
                setFromDate('');
                setToDate('');
              }}
              activeOpacity={0.7}
            >
              <RotateCcw size={13} color="#EF4444" />
              <Text style={styles.clearDateBtnText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Status Filter Horizontal Pills */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.statusPillsList}
          renderItem={({ item }) => {
            const isActive = activeStatus === item.key;
            return (
              <TouchableOpacity
                style={[
                  styles.statusPill,
                  isActive && styles.statusPillActive,
                  {
                    backgroundColor: isActive
                      ? '#1E3A8A'
                      : isDark
                      ? '#0F172A'
                      : '#F1F5F9',
                  },
                ]}
                onPress={() => {
                  triggerHaptic();
                  setActiveStatus(item.key);
                }}
              >
                <Text
                  style={[
                    styles.statusPillText,
                    isActive && styles.statusPillTextActive,
                    { color: isActive ? '#FFFFFF' : isDark ? '#CBD5E1' : '#475569' },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Quotations List with Complete Pagination */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.loadingText}>Loading quotations...</Text>
        </View>
      ) : (
        <FlatList
          data={quotations}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => (
            <QuotationCard
              quotation={item}
              isTrashView={isTrashView}
              onView={handleView}
              onDownload={handleDownload}
              onDelete={isTrashView ? handleDelete : undefined}
              onRestore={handleRestore}
              onSelectLead={handleSelectCustomerLead}
              onConvertToDeal={handleOpenConvertDeal}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No Quotations Found</Text>
              <Text style={styles.emptySub}>
                {isTrashView
                  ? 'Trash is empty.'
                  : 'Generate a new quotation using the builder form.'}
              </Text>
              {onNavigateToCreate && !isTrashView && (
                <TouchableOpacity
                  style={styles.emptyCreateBtn}
                  onPress={onNavigateToCreate}
                >
                  <Plus size={16} color="#FFFFFF" />
                  <Text style={styles.emptyCreateBtnText}>Create Quotation</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color="#1E3A8A"
                style={{ marginVertical: 16 }}
              />
            ) : undefined
          }
        />
      )}

      {/* Bottom Floating Action Speed Dial (Task 3) */}
      <FabSpeedDial
        actions={fabActions}
        bottomOffset={Math.max(insets.bottom + 12, 20)}
      />

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={datePickerTarget !== null}
        title={datePickerTarget === 'from' ? 'Select From Date' : 'Select To Date'}
        initialDate={datePickerTarget === 'from' ? fromDate : toDate}
        allowPast={true}
        allowFuture={true}
        onClose={() => setDatePickerTarget(null)}
        onSelectDate={(dateStr) => {
          if (datePickerTarget === 'from') {
            setFromDate(dateStr);
          } else if (datePickerTarget === 'to') {
            setToDate(dateStr);
          }
          setDatePickerTarget(null);
        }}
      />

      {/* Quotation Sheet Preview Modal */}
      {previewQuote && (
        <QuotationSheetView
          visible={!!previewQuote}
          data={buildFormDataFromQuote(previewQuote)}
          quotationId={previewQuote.id}
          quotationNo={previewQuote.quotation_number}
          onClose={() => setPreviewQuote(null)}
          onOpenEmail={() => {
            const q = previewQuote;
            setPreviewQuote(null);
            setEmailQuote(q);
          }}
        />
      )}

      {/* Email Modal */}
      {emailQuote && (
        <EmailQuotationModal
          visible={!!emailQuote}
          quotationId={emailQuote.id}
          initialEmail={emailQuote.customer_email}
          vehicleName={emailQuote.brand_name || 'Selected Vehicle'}
          onClose={() => setEmailQuote(null)}
          onSuccess={() => {
            const sentId = emailQuote.id;
            setEmailQuote(null);
            // Task 1: Update status to 'sent' on successful email dispatch
            quotationService.updateStatus(sentId, 'sent').catch(() => {});
            setQuotations((prev) =>
              prev.map((item) =>
                item.id === sentId ? { ...item, status: 'sent' } : item
              )
            );
          }}
        />
      )}

      {/* Lead Profile Modal (360° Lead Details, matching Leads screen) */}
      <LeadProfileModal
        visible={profileModalVisible}
        lead={activeProfileLead}
        onClose={() => setProfileModalVisible(false)}
        onCall={handleCall}
        onConvertToDeal={(ld) => {
          setProfileModalVisible(false);
          setActiveDealLead(ld);
          setDealModalVisible(true);
        }}
        onSendQuotation={() => {
          setProfileModalVisible(false);
          if (onNavigateToCreate) {
            onNavigateToCreate();
          }
        }}
      />

      {/* Convert to Deal Modal */}
      <ConvertToDealModal
        visible={dealModalVisible}
        lead={activeDealLead}
        onClose={() => setDealModalVisible(false)}
        onSubmit={handleConvertToDeal}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  screenHeading: {
    fontSize: 16,
    fontWeight: '800',
  },
  screenSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trashIconButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  trashIconButtonActive: {
    backgroundColor: '#EF4444',
  },
  filtersContainer: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  dateFilterRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dateFilterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  dateFilterBtnActive: {
    borderColor: '#1E3A8A',
  },
  dateFilterBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  clearDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
  },
  clearDateBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  statusPillsList: {
    gap: 6,
  },
  statusPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusPillActive: {
    backgroundColor: '#1E3A8A',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusPillTextActive: {
    fontWeight: '700',
  },
  listContent: {
    padding: 12,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  emptyBox: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
  },
  emptySub: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  emptyCreateBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
