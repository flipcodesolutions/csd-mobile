import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  Check,
  Menu,
  Moon,
  Plus,
  Search,
  SlidersHorizontal,
  Sun,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../core/theme/ThemeContext';
import { triggerHaptic } from '../../core/utils/haptics';
import { exportCsvToFile } from '../../core/utils/csvExporter';
import { FabSpeedDial } from '../../shared';
import { leadApi } from './leadService';
import { dealApi } from '../deals/dealService';
import {
  brandApi,
  leadSourceApi,
  leadStatusApi,
  modelApi,
  userApi,
  variantApi,
} from '../masters/masterService';

import {
  BrandItem,
  CustomerLead,
  ModelItem,
  SourceItem,
  StatusItem,
  UserItem,
  VariantItem,
  LEAD_STATUS_OPTIONS,
} from './types';

import { KpiMetricsDeck } from './components/KpiMetricsDeck';
import { LeadCard } from './components/LeadCard';
import { LeadsFilterModal } from './components/LeadsFilterModal';
import { ConvertToDealModal } from './components/ConvertToDealModal';
import { EditProspectModal } from './components/EditProspectModal';
import { LeadProfileModal } from './components/LeadProfileModal';
import { FollowUpModal } from './components/FollowUpModal';
import { LeadActionsModal } from './components/LeadActionsModal';
import { SendQuotationModal } from './components/SendQuotationModal';
import { CreateLeadScreen } from './CreateLeadScreen';

interface LeadsScreenProps {
  onOpenDrawer?: () => void;
  navigation?: any;
}

const getCleanLeadStatus = (item: CustomerLead, statusesList?: StatusItem[]): string => {
  const statusProp = (item as any).status;
  const statusFromString = typeof statusProp === 'string' ? statusProp : statusProp?.name;
  let raw =
    item.status_name ||
    item.lead_status ||
    statusFromString ||
    '';

  if (!raw && item.status_id && statusesList && statusesList.length > 0) {
    const found = statusesList.find((s) => s.id === item.status_id);
    if (found?.name) raw = found.name;
  }

  if (!raw && item.is_converted) {
    return 'Deal & Booking';
  }

  if (!raw) return 'New';

  const lower = raw.toLowerCase().trim();

  // Exclude discount approval statuses from lead status
  if (lower.includes('discount')) {
    return 'Follow-up';
  }

  // Convert any "Deal Won" / booking variation to "Deal & Booking"
  if (
    lower === 'deal won' ||
    lower === 'deal_won' ||
    lower.includes('deal won') ||
    lower.includes('deal') ||
    lower.includes('book') ||
    lower.includes('won')
  ) {
    return 'Deal & Booking';
  }

  if (lower.includes('follow')) {
    return 'Follow-up';
  }

  if (lower.includes('quotation')) {
    return 'Quotation Sent';
  }

  if (lower.includes('lost')) {
    return 'Lost';
  }

  if (lower.includes('new')) {
    return 'New';
  }

  return raw;
};


type StatusTabKey = 'All' | 'New' | 'Follow-up' | 'Quotation Sent' | 'Deal & Booking' | 'Lost';

interface StatusTabDef {
  key: StatusTabKey;
  label: string;
  icon: string;
}

const STATUS_TABS: StatusTabDef[] = [
  { key: 'All', label: 'All', icon: '' },
  { key: 'New', label: 'New', icon: '✨' },
  { key: 'Follow-up', label: 'Follow-up', icon: '📞' },
  { key: 'Quotation Sent', label: 'Quotation Sent', icon: '📄' },
  { key: 'Deal & Booking', label: 'Deal & Booking', icon: '🏆' },
  { key: 'Lost', label: 'Lost', icon: '❌' },
];

export const LeadsScreen: React.FC<LeadsScreenProps> = ({ onOpenDrawer, navigation }) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isNarrow = width < 360;

  // 1. Data States
  const [leads, setLeads] = useState<CustomerLead[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [models, setModels] = useState<ModelItem[]>([]);
  const [variants, setVariants] = useState<VariantItem[]>([]);
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [usersList, setUsersList] = useState<UserItem[]>([]);

  // 2. Search & Filter States
  const [search, setSearch] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<StatusTabKey>('All');
  const [createLeadModalVisible, setCreateLeadModalVisible] = useState(false);
  const [segmentFilter, setSegmentFilter] = useState<'All' | '4 Wheeler' | '2 Wheeler'>('All');
  const [priorityFilter, setPriorityFilter] = useState<'All' | 'Hot' | 'Warm' | 'Cold'>('All');
  const [stageFilter, setStageFilter] = useState<string>('All');
  const [brandFilter, setBrandFilter] = useState<string>('All');
  const [userFilter, setUserFilter] = useState<number | null>(null);

  // Filter Modal State
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // 3. Selection & Bulk Action States
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkAssignModal, setBulkAssignModal] = useState(false);
  const [bulkStatusModal, setBulkStatusModal] = useState(false);
  const [bulkPriorityModal, setBulkPriorityModal] = useState(false);
  const [bulkSelectedUser, setBulkSelectedUser] = useState<number | null>(null);
  const [bulkSelectedStatus, setBulkSelectedStatus] = useState<number | null>(null);
  const [bulkSelectedStatusName, setBulkSelectedStatusName] = useState<string>('Follow-up');
  const [bulkSelectedPriority, setBulkSelectedPriority] = useState<'Hot' | 'Warm' | 'Cold'>('Hot');
  const [isBulkExecuting, setIsBulkExecuting] = useState(false);

  // 4. Loading, Refreshing & Pagination
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalLeadsCount, setTotalLeadsCount] = useState(0);


  const handleOpenCreateLead = () => {
    triggerHaptic('impactLight');
    setEditingLead(null);
    setLeadModalVisible(true);
  };
  
  // 5. Action Modal States
  const [leadModalVisible, setLeadModalVisible] = useState(false);
  const [editingLead, setEditingLead] = useState<CustomerLead | null>(null);

  const [followUpModalVisible, setFollowUpModalVisible] = useState(false);
  const [activeFollowUpLead, setActiveFollowUpLead] = useState<CustomerLead | null>(null);

  const [dealModalVisible, setDealModalVisible] = useState(false);
  const [activeDealLead, setActiveDealLead] = useState<CustomerLead | null>(null);

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [activeDetailLead, setActiveDetailLead] = useState<CustomerLead | null>(null);

  const [actionsModalVisible, setActionsModalVisible] = useState(false);
  const [activeActionLead, setActiveActionLead] = useState<CustomerLead | null>(null);

  const [quotationModalVisible, setQuotationModalVisible] = useState(false);
  const [activeQuotationLead, setActiveQuotationLead] = useState<CustomerLead | null>(null);

  const [quickViewModalVisible, setQuickViewModalVisible] = useState(false);
  const [activeQuickViewLead, setActiveQuickViewLead] = useState<CustomerLead | null>(null);

  // Initial Data Fetch
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([fetchLeads(1, false), fetchMasters()]);
    } catch (err: any) {
      console.log('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeads = async (pageNumber: number = 1, isLoadMore: boolean = false) => {
    try {
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        if (pageNumber === 1 && !isRefreshing) setIsLoading(true);
      }

      const res = await leadApi.getAll({
        page: pageNumber,
        per_page: 50,
        search: search.trim() || undefined,
        priority: priorityFilter !== 'All' ? priorityFilter : undefined,
        vehicle_segment: segmentFilter !== 'All' ? segmentFilter : undefined,
      });
      console.log("this leads", res)

      const list = Array.isArray(res) ? res : res?.data || [];
      const pagination = res?.pagination;

      if (pageNumber === 1) {
        setLeads(list);
      } else {
        setLeads((prev) => {
          const existingIds = new Set(prev.map((l) => l.id));
          const newItems = list.filter((l: CustomerLead) => !existingIds.has(l.id));
          return [...prev, ...newItems];
        });
      }

      setPage(pageNumber);

      if (pagination) {
        setTotalLeadsCount(pagination.total || list.length);
        setHasMore(pagination.current_page < pagination.last_page);
      } else {
        setHasMore(list.length >= 15);
        setTotalLeadsCount((prev) => (pageNumber === 1 ? list.length : prev));
      }
    } catch (err) {
      console.log('Failed to fetch leads:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const fetchMasters = async () => {
    try {
      const [bRes, mRes, vRes, sRes, stRes, uRes] = await Promise.allSettled([
        brandApi.getAll(),
        modelApi.getAll(),
        variantApi.getAll(),
        leadSourceApi.getAll(),
        leadStatusApi.getAll(),
        userApi.getAll(),
      ]);

      if (bRes.status === 'fulfilled') setBrands(bRes.value?.data || bRes.value || []);
      if (mRes.status === 'fulfilled') setModels(mRes.value?.data || mRes.value || []);
      if (vRes.status === 'fulfilled') setVariants(vRes.value?.data || vRes.value || []);
      if (sRes.status === 'fulfilled') setSources(sRes.value?.data || sRes.value || []);
      if (stRes.status === 'fulfilled') setStatuses(stRes.value?.data || stRes.value || []);
      if (uRes.status === 'fulfilled') setUsersList(uRes.value?.data || uRes.value || []);
    } catch (err) {
      console.log('Error fetching masters:', err);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchLeads(1, false);
    setIsRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore && !isLoading && !isRefreshing) {
      fetchLeads(page + 1, true);
    }
  };


  // Status tab counts for horizontal filter pills
  const statusTabCounts = useMemo(() => {
    const counts: Record<StatusTabKey, number> = {
      All: leads.length,
      New: 0,
      'Follow-up': 0,
      'Quotation Sent': 0,
      'Deal & Booking': 0,
      Lost: 0,
    };

    leads.forEach((l) => {
      const clean = getCleanLeadStatus(l, statuses);
      if (clean === 'Deal & Booking') {
        counts['Deal & Booking']++;
      } else if (clean === 'Lost') {
        counts.Lost++;
      } else if (clean === 'Follow-up') {
        counts['Follow-up']++;
      } else if (clean === 'Quotation Sent') {
        counts['Quotation Sent']++;
      } else {
        counts.New++;
      }
    });

    return counts;
  }, [leads, statuses]);

  // Active Filters Count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (segmentFilter !== 'All') count++;
    if (priorityFilter !== 'All') count++;
    if (stageFilter !== 'All') count++;
    if (brandFilter !== 'All') count++;
    if (userFilter !== null) count++;
    return count;
  }, [segmentFilter, priorityFilter, stageFilter, brandFilter, userFilter]);

  const resetAllFilters = () => {
    setSegmentFilter('All');
    setPriorityFilter('All');
    setStageFilter('All');
    setBrandFilter('All');
    setUserFilter(null);
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((item) => {
      // 1. Search term
      const term = search.toLowerCase().trim();
      if (term) {
        const matchesName = item.name?.toLowerCase().includes(term);
        const matchesPhone = item.phone?.toLowerCase().includes(term);
        const matchesCity = (item.home_town || item.city)?.toLowerCase().includes(term);
        const matchesPosting = item.posting?.toLowerCase().includes(term);
        const matchesModel = item.model_variant?.toLowerCase().includes(term);
        const matchesBrand = item.brand_name?.toLowerCase().includes(term);
        const matchesId = item.id?.toString().includes(term);
        if (
          !matchesName &&
          !matchesPhone &&
          !matchesCity &&
          !matchesPosting &&
          !matchesModel &&
          !matchesBrand &&
          !matchesId
        ) {
          return false;
        }
      }

      // 2. Segment filter
      if (segmentFilter !== 'All' && item.vehicle_segment !== segmentFilter) {
        return false;
      }

      // 3. Priority filter
      if (priorityFilter !== 'All' && item.priority !== priorityFilter) {
        return false;
      }

      // 4. Stage / Lead Status filter (Matching static options from DB)
      if (stageFilter !== 'All') {
        const leadSt = getCleanLeadStatus(item, statuses);
        if (leadSt !== stageFilter) {
          return false;
        }
      }

      // 5. Brand filter
      if (brandFilter !== 'All' && item.brand_name?.toLowerCase() !== brandFilter.toLowerCase()) {
        return false;
      }

      // 6. User filter
      if (userFilter !== null && item.assigned_to !== userFilter) {
        return false;
      }

      return true;
    });
  }, [leads, search, segmentFilter, priorityFilter, stageFilter, brandFilter, userFilter, statuses]);

  // Stage counts (Static Status Options)
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {
      New: 0,
      'Follow-up': 0,
      'Quotation Sent': 0,
      'Deal & Booking': 0,
      Lost: 0,
    };
    leads.forEach((l) => {
      const st = getCleanLeadStatus(l, statuses);
      if (st === 'New') {
        counts['New']++;
      } else if (st === 'Follow-up') {
        counts['Follow-up']++;
      } else if (st === 'Quotation Sent') {
        counts['Quotation Sent']++;
      } else if (st === 'Deal & Booking') {
        counts['Deal & Booking']++;
      } else if (st === 'Lost') {
        counts['Lost']++;
      }
    });
    return counts;
  }, [leads, statuses]);

  // KPIs - Accurate counts reflecting dataset
  const isFiltered = activeFiltersCount > 0 || search.trim().length > 0;
  const currentDataset = isFiltered ? filteredLeads : leads;
  const totalCount = isFiltered ? filteredLeads.length : (totalLeadsCount || leads.length);
  const hotCount = useMemo(
    () => currentDataset.filter((l) => l.priority === 'Hot').length,
    [currentDataset]
  );
  const fourWheelerCount = useMemo(
    () =>
      currentDataset.filter(
        (l) => l.vehicle_segment === '4 Wheeler' || (l as any).vehicle_segment_display === '4W'
      ).length,
    [currentDataset]
  );
  const twoWheelerCount = useMemo(
    () =>
      currentDataset.filter(
        (l) => l.vehicle_segment === '2 Wheeler' || (l as any).vehicle_segment_display === '2W'
      ).length,
    [currentDataset]
  );

  // Selection toggle
  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.length === filteredLeads.length && filteredLeads.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredLeads.map((l) => l.id));
    }
  }, [selectedIds.length, filteredLeads]);

  // Actions
  const handleCall = useCallback((phone: string) => {
    if (!phone) {
      Alert.alert('Phone Missing', 'No contact phone available for this lead.');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Call Error', 'Could not open phone dialer.');
    });
  }, []);

  const handleOpenFollowUp = useCallback((ld: CustomerLead) => {
    setActiveFollowUpLead(ld);
    setFollowUpModalVisible(true);
  }, []);

  const handleOpenConvertDeal = useCallback((ld: CustomerLead) => {
    setActiveDealLead(ld);
    setDealModalVisible(true);
  }, []);

  const handleOpenSendQuotation = useCallback(
    (ld: CustomerLead) => {
      if (navigation) {
        (navigation as any).navigate('send-quotation', { leadId: ld.id });
      } else {
        setActiveQuotationLead(ld);
        setQuotationModalVisible(true);
      }
    },
    [navigation]
  );

  const handleOpenQuickView = useCallback((ld: CustomerLead) => {
    setActiveDetailLead(ld);
    setDetailModalVisible(true);
  }, []);

  const handleOpenEdit = useCallback((ld: CustomerLead) => {
    setEditingLead(ld);
    setLeadModalVisible(true);
  }, []);

  const handleOpen360 = useCallback((ld: CustomerLead) => {
    setActiveDetailLead(ld);
    setDetailModalVisible(true);
  }, []);

  const handleOpenActionsMenu = useCallback((ld: CustomerLead) => {
    setActiveActionLead(ld);
    setActionsModalVisible(true);
  }, []);

  const handleDeleteLead = useCallback((id: number, name: string) => {
    Alert.alert(
      'Delete Lead',
      `Are you sure you want to delete lead #${id} (${name})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await leadApi.delete(id);
              setLeads((prev) => prev.filter((l) => l.id !== id));
              setSelectedIds((prev) => prev.filter((item) => item !== id));
              Alert.alert('Success', 'Lead deleted successfully.');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete lead.');
            }
          },
        },
      ]
    );
  }, []);

  // Save / Update Lead
  const handleSaveLead = async (formData: any) => {
    if (editingLead) {
      await leadApi.update(editingLead.id, formData);
      setLeads((prev) =>
        prev.map((l) => (l.id === editingLead.id ? { ...l, ...formData } : l))
      );
      Alert.alert('Success', 'Lead updated successfully.');
    } else {
      const res = await leadApi.create(formData);
      const newLead = res?.data || res || { id: Date.now(), ...formData };
      setLeads((prev) => [newLead, ...prev]);
      Alert.alert('Success', 'New lead registered successfully.');
    }
  };

  // Convert to Deal
  const handleConvertToDeal = async (dealData: any) => {
    await dealApi.create(dealData);
    setLeads((prev) =>
      prev.map((l) =>
        l.id === dealData.lead_id
          ? { ...l, is_converted: true, status_name: 'Deal & Booking', lead_status: 'Deal & Booking' }
          : l
      )
    );
    Alert.alert('Deal Created!', 'Lead converted to deal successfully.');
  };

  // Follow-Up Submission
  const handleSaveFollowUp = async (leadId: number, followUpData: any) => {
    await leadApi.addFollowUp(leadId, followUpData);
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === leadId) {
          const prevFus = l.follow_ups || [];
          return {
            ...l,
            follow_ups: [{ id: Date.now(), ...followUpData }, ...prevFus],
          };
        }
        return l;
      })
    );
    Alert.alert('Logged', 'Follow-up discussion logged successfully.');
  };

  // Bulk Actions
  const handleExecuteBulkAssign = async () => {
    if (!bulkSelectedUser || selectedIds.length === 0) return;
    try {
      setIsBulkExecuting(true);
      await leadApi.bulkAssign(selectedIds, bulkSelectedUser);
      const assignedUserObj = usersList.find((u) => u.id === bulkSelectedUser);
      setLeads((prev) =>
        prev.map((l) =>
          selectedIds.includes(l.id)
            ? {
              ...l,
              assigned_to: bulkSelectedUser,
              assigned_user_name: assignedUserObj?.name,
            }
            : l
        )
      );
      setSelectedIds([]);
      setBulkAssignModal(false);
      Alert.alert('Success', 'Leads assigned successfully.');
    } catch (err: any) {
      Alert.alert('Bulk Error', err?.message || 'Failed to bulk assign leads.');
    } finally {
      setIsBulkExecuting(false);
    }
  };

  const handleExecuteBulkStatus = async () => {
    if (!bulkSelectedStatusName || selectedIds.length === 0) return;
    try {
      setIsBulkExecuting(true);
      const matchedStatus = statuses.find(
        (s) => s.name?.toLowerCase() === bulkSelectedStatusName.toLowerCase()
      );
      await leadApi.bulkStatus(selectedIds, matchedStatus?.id || null, bulkSelectedStatusName);
      setLeads((prev) =>
        prev.map((l) =>
          selectedIds.includes(l.id)
            ? {
                ...l,
                status_id: matchedStatus?.id || l.status_id,
                status_name: bulkSelectedStatusName,
                lead_status: bulkSelectedStatusName,
              }
            : l
        )
      );
      setSelectedIds([]);
      setBulkStatusModal(false);
      Alert.alert('Success', 'Lead statuses updated successfully.');
    } catch (err: any) {
      Alert.alert('Bulk Error', err?.message || 'Failed to update lead status.');
    } finally {
      setIsBulkExecuting(false);
    }
  };

  const handleExecuteBulkPriority = async () => {
    if (!bulkSelectedPriority || selectedIds.length === 0) return;
    try {
      setIsBulkExecuting(true);
      await leadApi.bulkPriority(selectedIds, bulkSelectedPriority);
      setLeads((prev) =>
        prev.map((l) =>
          selectedIds.includes(l.id)
            ? {
                ...l,
                priority: bulkSelectedPriority,
              }
            : l
        )
      );
      setSelectedIds([]);
      setBulkPriorityModal(false);
      Alert.alert('Success', `Priority updated to ${bulkSelectedPriority} for selected leads.`);
    } catch (err: any) {
      Alert.alert('Bulk Error', err?.message || 'Failed to update priority.');
    } finally {
      setIsBulkExecuting(false);
    }
  };

  const handleExecuteBulkDelete = () => {
    if (selectedIds.length === 0) return;
    Alert.alert(
      'Confirm Bulk Delete',
      `Are you sure you want to delete ${selectedIds.length} selected leads?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsBulkExecuting(true);
              await leadApi.bulkDelete(selectedIds);
              setLeads((prev) => prev.filter((l) => !selectedIds.includes(l.id)));
              setSelectedIds([]);
              Alert.alert('Deleted', 'Selected leads deleted successfully.');
            } catch (err: any) {
              Alert.alert('Bulk Delete Error', err?.message || 'Failed to delete leads.');
            } finally {
              setIsBulkExecuting(false);
            }
          },
        },
      ]
    );
  };

  const renderItem = useCallback(
    ({ item }: { item: CustomerLead }) => (
      <LeadCard
        item={item}
        isSelected={selectedIds.includes(item.id)}
        onToggleSelect={toggleSelect}
        onCall={handleCall}
        onOpenFollowUp={handleOpenFollowUp}
        onOpenConvertDeal={handleOpenConvertDeal}
        onOpenSendQuotation={handleOpenSendQuotation}
        onOpenQuickView={handleOpenQuickView}
        onOpenEdit={handleOpenEdit}
        onOpen360={handleOpen360}
        onOpenActionsMenu={handleOpenActionsMenu}
        onDelete={handleDeleteLead}
      />
    ),
    [
      selectedIds,
      toggleSelect,
      handleCall,
      handleOpenFollowUp,
      handleOpenConvertDeal,
      handleOpenSendQuotation,
      handleOpenQuickView,
      handleOpenEdit,
      handleOpen360,
      handleOpenActionsMenu,
      handleDeleteLead,
    ]
  );

  const handleExportCSV = async () => {
    triggerHaptic('impactLight');
    const rows = filteredLeads.map((l) => [
      l.id,
      l.name || 'N/A',
      l.phone || 'N/A',
      l.city || 'N/A',
      l.status_name || 'New',
      l.priority || 'Warm',
      l.brand_name || 'N/A',
      l.model_name || 'N/A',
      l.assigned_user_name || 'Unassigned',
    ]);
    await exportCsvToFile({
      filename: `customer_leads_${new Date().toISOString().split('T')[0]}`,
      headers: [
        'Lead ID',
        'Customer Name',
        'Phone',
        'City',
        'Pipeline Status',
        'Priority',
        'Brand',
        'Model',
        'Assigned To',
      ],
      rows,
    });
  };

  return (
    <View
      style={[
        styles.screenContainer,
        { backgroundColor: isDark ? '#080D1A' : '#FAF8FF' },
      ]}
    >
      {/* 2. Scrollable Leads Content Body */}
      <FlatList
        data={filteredLeads}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom + 90, 110) },
        ]}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews={true}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : undefined
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.listHeaderWrapper}>
            {/* KPI Cards Deck (Compact, Logo-themed) */}
            <KpiMetricsDeck
              totalCount={totalCount}
              hotCount={hotCount}
              fourWheelerCount={fourWheelerCount}
              twoWheelerCount={twoWheelerCount}
            />

            {/* Compact Action Bar: Search Input + Filter Button + +New Lead Button */}
            <View style={styles.actionBarRow}>
              {/* Search Bar Input */}
              <View
                style={[
                  styles.searchContainer,
                  {
                    backgroundColor: isDark ? '#101726' : '#FFFFFF',
                    borderColor: isDark ? '#1E293B' : '#CBD5E1',
                  },
                ]}
              >
                <Search size={14} color={colors.textMuted} strokeWidth={2} />
                <TextInput
                  style={[
                    styles.searchInput,
                    { color: colors.textPrimary },
                  ]}
                  placeholder="Search lead, model, phone..."
                  placeholderTextColor={colors.textMuted}
                  value={search}
                  onChangeText={setSearch}
                />
                {search.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic('impactLight');
                      setSearch('');
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={14} color={colors.textSecondary} strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Filter Button (Opens Dedicated Filter Modal) */}
              <TouchableOpacity
                style={[
                  styles.filterModalTriggerBtn,
                  {
                    backgroundColor:
                      activeFiltersCount > 0
                        ? colors.primary
                        : isDark
                          ? '#131B2E'
                          : '#FFFFFF',
                    borderColor:
                      activeFiltersCount > 0
                        ? colors.primaryDark
                        : isDark
                          ? '#1E293B'
                          : '#CBD5E1',
                  },
                ]}
                onPress={() => {
                  triggerHaptic('selection');
                  setFilterModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <SlidersHorizontal
                  size={14}
                  color={activeFiltersCount > 0 ? '#FFFFFF' : colors.textPrimary}
                  strokeWidth={2.2}
                />
                <Text
                  style={[
                    styles.filterTriggerText,
                    {
                      color:
                        activeFiltersCount > 0
                          ? '#FFFFFF'
                          : colors.textPrimary,
                      marginLeft: 5,
                    },
                  ]}
                >
                  {activeFiltersCount > 0
                    ? `Filters (${activeFiltersCount})`
                    : 'Filter'}
                </Text>
              </TouchableOpacity>

              {/* + New Lead Button */}
              <TouchableOpacity
                style={[
                  styles.newLeadBtn,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleOpenCreateLead}
                activeOpacity={0.8}
              >
                <Plus size={15} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={[styles.newLeadText, { marginLeft: 3 }]}>New</Text>
              </TouchableOpacity>
            </View>

            
            {/* Active Filters Pill Strip (Only shown when filters are applied) */}
            {activeFiltersCount > 0 && (
              <View style={styles.activeFiltersRow}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.activeFiltersScroll}
                >
                  {segmentFilter !== 'All' && (
                    <TouchableOpacity
                      style={[
                        styles.activeFilterChip,
                        {
                          backgroundColor: isDark ? '#1E293B' : '#F1F5E9',
                          borderColor: colors.primary,
                        },
                      ]}
                      onPress={() => setSegmentFilter('All')}
                    >
                      <Text
                        style={[
                          styles.activeFilterChipText,
                          {
                            color: isDark
                              ? colors.primary
                              : colors.primaryDark,
                          },
                        ]}
                      >
                        {segmentFilter === '4 Wheeler' ? '4W Cars' : '2W Bikes'}{' '}
                        ✕
                      </Text>
                    </TouchableOpacity>
                  )}

                  {priorityFilter !== 'All' && (
                    <TouchableOpacity
                      style={[
                        styles.activeFilterChip,
                        {
                          backgroundColor: isDark ? '#1E293B' : '#F1F5E9',
                          borderColor: colors.primary,
                        },
                      ]}
                      onPress={() => setPriorityFilter('All')}
                    >
                      <Text
                        style={[
                          styles.activeFilterChipText,
                          {
                            color: isDark
                              ? colors.primary
                              : colors.primaryDark,
                          },
                        ]}
                      >
                        {priorityFilter} Priority ✕
                      </Text>
                    </TouchableOpacity>
                  )}

                  {stageFilter !== 'All' && (
                    <TouchableOpacity
                      style={[
                        styles.activeFilterChip,
                        {
                          backgroundColor: isDark ? '#1E293B' : '#F1F5E9',
                          borderColor: colors.primary,
                        },
                      ]}
                      onPress={() => setStageFilter('All')}
                    >
                      <Text
                        style={[
                          styles.activeFilterChipText,
                          {
                            color: isDark
                              ? colors.primary
                              : colors.primaryDark,
                          },
                        ]}
                      >
                        {stageFilter} ✕
                      </Text>
                    </TouchableOpacity>
                  )}

                  {brandFilter !== 'All' && (
                    <TouchableOpacity
                      style={[
                        styles.activeFilterChip,
                        {
                          backgroundColor: isDark ? '#1E293B' : '#F1F5E9',
                          borderColor: colors.primary,
                        },
                      ]}
                      onPress={() => setBrandFilter('All')}
                    >
                      <Text
                        style={[
                          styles.activeFilterChipText,
                          {
                            color: isDark
                              ? colors.primary
                              : colors.primaryDark,
                          },
                        ]}
                      >
                        {brandFilter} ✕
                      </Text>
                    </TouchableOpacity>
                  )}

                  {userFilter !== null && (
                    <TouchableOpacity
                      style={[
                        styles.activeFilterChip,
                        {
                          backgroundColor: isDark ? '#1E293B' : '#F1F5E9',
                          borderColor: colors.primary,
                        },
                      ]}
                      onPress={() => setUserFilter(null)}
                    >
                      <Text
                        style={[
                          styles.activeFilterChipText,
                          {
                            color: isDark
                              ? colors.primary
                              : colors.primaryDark,
                          },
                        ]}
                      >
                        Rep Selected ✕
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={resetAllFilters}
                    style={styles.clearAllBtn}
                  >
                    <Text
                      style={[
                        styles.clearAllText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Clear All
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}

            {/* Select All / Batch Action Header */}
            {filteredLeads.length > 0 && (
              <View
                style={[
                  styles.batchActionBar,
                  { borderBottomColor: isDark ? '#1E293B' : '#F1F5F9' },
                ]}
              >
                <TouchableOpacity
                  style={styles.selectAllBtn}
                  onPress={() => {
                    triggerHaptic('selection');
                    toggleSelectAll();
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.batchCheckbox,
                      {
                        borderColor:
                          selectedIds.length > 0
                            ? colors.primary
                            : isDark
                              ? '#334155'
                              : '#CBD5E1',
                        backgroundColor:
                          selectedIds.length > 0
                            ? colors.primary
                            : isDark
                              ? '#101726'
                              : '#FFFFFF',
                      },
                    ]}
                  >
                    {selectedIds.length > 0 && (
                      <Check size={11} color="#FFFFFF" strokeWidth={3} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.selectAllText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {selectedIds.length > 0
                      ? `${selectedIds.length} Selected`
                      : `Select All (${filteredLeads.length})`}
                  </Text>
                </TouchableOpacity>

                {selectedIds.length > 0 && (
                  <View style={styles.batchActionButtons}>
                    {/* 1. Assign */}
                    <TouchableOpacity
                      style={[
                        styles.batchBtn,
                        {
                          backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                          borderColor: isDark ? '#1E293B' : '#CBD5E1',
                        },
                      ]}
                      onPress={() => setBulkAssignModal(true)}
                    >
                      <Text
                        style={[
                          styles.batchBtnText,
                          { color: colors.textPrimary },
                        ]}
                      >
                        Assign
                      </Text>
                    </TouchableOpacity>

                    {/* 2. Status */}
                    <TouchableOpacity
                      style={[
                        styles.batchBtn,
                        {
                          backgroundColor: colors.primary,
                          borderColor: colors.primaryDark,
                        },
                      ]}
                      onPress={() => setBulkStatusModal(true)}
                    >
                      <Text
                        style={[styles.batchBtnText, { color: '#FFFFFF' }]}
                      >
                        Status
                      </Text>
                    </TouchableOpacity>

                    {/* 3. Priority */}
                    <TouchableOpacity
                      style={[
                        styles.batchBtn,
                        {
                          backgroundColor: isDark ? '#1E293B' : '#FEF3C7',
                          borderColor: isDark ? '#F59E0B' : '#FDE68A',
                        },
                      ]}
                      onPress={() => setBulkPriorityModal(true)}
                    >
                      <Text
                        style={[
                          styles.batchBtnText,
                          { color: isDark ? '#FBBF24' : '#D97706' },
                        ]}
                      >
                        Priority
                      </Text>
                    </TouchableOpacity>

                    {/* 4. Delete */}
                    <TouchableOpacity
                      style={[
                        styles.batchBtn,
                        {
                          backgroundColor: isDark
                            ? 'rgba(239, 68, 68, 0.15)'
                            : '#FEE2E2',
                          borderColor: isDark ? '#EF4444' : '#FECDD3',
                        },
                      ]}
                      onPress={handleExecuteBulkDelete}
                    >
                      <Text
                        style={[styles.batchBtnText, { color: '#DC2626' }]}
                      >
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📁</Text>
              <Text
                style={[styles.emptyTitle, { color: colors.textPrimary }]}
              >
                No Prospects Found
              </Text>
              <Text
                style={[
                  styles.emptySubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                {search || activeFiltersCount > 0
                  ? 'Try clearing your search query or reset filters.'
                  : 'Start by tapping "+ New" to register a CSD prospect.'}
              </Text>
              {activeFiltersCount > 0 && (
                <TouchableOpacity
                  style={[
                    styles.resetEmptyBtn,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={resetAllFilters}
                >
                  <Text style={styles.resetEmptyText}>Reset All Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.loadingWrapper}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text
                style={[styles.loadingText, { color: colors.textSecondary }]}
              >
                Loading Leads Pipeline...
              </Text>
            </View>
          )
        }
      />

      {/* 3. Dedicated Leads Filter Modal */}
      <LeadsFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        segment={segmentFilter}
        setSegment={setSegmentFilter}
        priority={priorityFilter}
        setPriority={setPriorityFilter}
        stage={stageFilter}
        setStage={setStageFilter}
        selectedBrand={brandFilter}
        setSelectedBrand={setBrandFilter}
        selectedUser={userFilter}
        setSelectedUser={setUserFilter}
        brands={brands}
        users={usersList}
        stageCounts={stageCounts}
        activeFiltersCount={activeFiltersCount}
        onReset={resetAllFilters}
        onApply={() => setFilterModalVisible(false)}
      />

      {/* 4. Convert to Deal Modal */}
      <ConvertToDealModal
        visible={dealModalVisible}
        lead={activeDealLead}
        onClose={() => setDealModalVisible(false)}
        onSubmit={handleConvertToDeal}
      />

      {/* 5. Edit / Create Prospect Modal */}
      <EditProspectModal
        visible={leadModalVisible}
        lead={editingLead}
        brands={brands}
        models={models}
        variants={variants}
        sources={sources}
        statuses={statuses}
        users={usersList}
        onClose={() => setLeadModalVisible(false)}
        onSubmit={handleSaveLead}
      />

      {/* 6. Lead Profile Modal */}
      <LeadProfileModal
        visible={detailModalVisible}
        lead={activeDetailLead}
        onClose={() => setDetailModalVisible(false)}
        onCall={handleCall}
        onConvertToDeal={(ld) => {
          setDetailModalVisible(false);
          setActiveDealLead(ld);
          setDealModalVisible(true);
        }}
        onLogFollowUp={(ld) => {
          setDetailModalVisible(false);
          setActiveFollowUpLead(ld);
          setFollowUpModalVisible(true);
        }}
        onSendQuotation={(ld) => {
          setDetailModalVisible(false);
          if (navigation) {
            (navigation as any).navigate('send-quotation', { leadId: ld.id });
          } else {
            setActiveQuotationLead(ld);
            setQuotationModalVisible(true);
          }
        }}
      />

      {/* 7. Follow-Up Modal */}
      <FollowUpModal
        visible={followUpModalVisible}
        lead={activeFollowUpLead}
        onClose={() => setFollowUpModalVisible(false)}
        onSubmit={handleSaveFollowUp}
      />

      {/* 8. Lead Actions Dropdown Modal (Matching Web 3-Dots Screenshot 2) */}
      <LeadActionsModal
        visible={actionsModalVisible}
        lead={activeActionLead}
        onClose={() => setActionsModalVisible(false)}
        onView360={(ld) => {
          setActiveDetailLead(ld);
          setDetailModalVisible(true);
        }}
        onConvertDeal={(ld) => {
          setActiveDealLead(ld);
          setDealModalVisible(true);
        }}
        onLogFollowUp={(ld) => {
          setActiveFollowUpLead(ld);
          setFollowUpModalVisible(true);
        }}
        onSendQuotation={(ld) => {
          setActionsModalVisible(false);
          if (navigation) {
            (navigation as any).navigate('send-quotation', { leadId: ld.id });
          } else {
            setActiveQuotationLead(ld);
            setQuotationModalVisible(true);
          }
        }}
        onEditLead={(ld) => {
          setEditingLead(ld);
          setLeadModalVisible(true);
        }}
        onDeleteLead={(ld) => {
          handleDeleteLead(ld.id, ld.name);
        }}
      />

      {/* 9. Send Quotation Modal */}
      <SendQuotationModal
        visible={quotationModalVisible}
        lead={activeQuotationLead}
        brands={brands}
        models={models}
        variants={variants}
        onClose={() => setQuotationModalVisible(false)}
        onSuccess={() => {
          onRefresh();
        }}
      />

      {/* 8. Bulk Assign Modal */}
      <Modal
        visible={bulkAssignModal}
        transparent
        animationType="fade"
        onRequestClose={() => setBulkAssignModal(false)}
      >
        <View style={styles.bulkModalOverlay}>
          <View
            style={[
              styles.bulkModalContent,
              {
                backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                borderColor: isDark ? '#1E293B' : '#E2E8F0',
              },
            ]}
          >
            <Text
              style={[
                styles.bulkModalTitle,
                { color: colors.textPrimary },
              ]}
            >
              Assign {selectedIds.length} Leads
            </Text>
            <Text
              style={[
                styles.bulkModalSub,
                { color: colors.textSecondary },
              ]}
            >
              Select executive to assign chosen prospects:
            </Text>

            <ScrollView style={styles.bulkUserList}>
              {usersList.map((u) => {
                const isSelected = bulkSelectedUser === u.id;
                return (
                  <TouchableOpacity
                    key={u.id}
                    style={[
                      styles.bulkUserRow,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : isDark
                            ? '#101726'
                            : '#F8FAFC',
                        borderColor: isSelected
                          ? colors.primaryDark
                          : isDark
                            ? '#1E293B'
                            : '#E2E8F0',
                      },
                    ]}
                    onPress={() => setBulkSelectedUser(u.id)}
                  >
                    <Text
                      style={[
                        styles.bulkUserName,
                        {
                          color: isSelected
                            ? '#FFFFFF'
                            : colors.textPrimary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {u.name}
                    </Text>
                    <Text
                      style={[
                        styles.bulkUserRole,
                        {
                          color: isSelected
                            ? '#FFFFFF'
                            : colors.textSecondary,
                        },
                      ]}
                    >
                      {u.role_name || 'Executive'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.bulkActionButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.bulkCancelBtn,
                  {
                    borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    backgroundColor: isDark ? '#101726' : '#F1F5F9',
                  },
                ]}
                onPress={() => setBulkAssignModal(false)}
              >
                <Text
                  style={[
                    styles.bulkCancelText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.bulkConfirmBtn,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleExecuteBulkAssign}
                disabled={!bulkSelectedUser || isBulkExecuting}
              >
                {isBulkExecuting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.bulkConfirmText}>Assign Now</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 9. Bulk Status Modal */}
      <Modal
        visible={bulkStatusModal}
        transparent
        animationType="fade"
        onRequestClose={() => setBulkStatusModal(false)}
      >
        <View style={styles.bulkModalOverlay}>
          <View
            style={[
              styles.bulkModalContent,
              {
                backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                borderColor: isDark ? '#1E293B' : '#E2E8F0',
              },
            ]}
          >
            <Text
              style={[
                styles.bulkModalTitle,
                { color: colors.textPrimary },
              ]}
            >
              Update Status ({selectedIds.length} Leads)
            </Text>
            <Text
              style={[
                styles.bulkModalSub,
                { color: colors.textSecondary },
              ]}
            >
              Select new pipeline stage:
            </Text>

            <ScrollView style={styles.bulkUserList}>
              {LEAD_STATUS_OPTIONS.map((st) => {
                const isSelected = bulkSelectedStatusName === st;
                return (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.bulkUserRow,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : isDark
                            ? '#101726'
                            : '#F8FAFC',
                        borderColor: isSelected
                          ? colors.primaryDark
                          : isDark
                            ? '#1E293B'
                            : '#E2E8F0',
                      },
                    ]}
                    onPress={() => setBulkSelectedStatusName(st)}
                  >
                    <Text
                      style={[
                        styles.bulkUserName,
                        {
                          color: isSelected
                            ? '#FFFFFF'
                            : colors.textPrimary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {st}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.bulkActionButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.bulkCancelBtn,
                  {
                    borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    backgroundColor: isDark ? '#101726' : '#F1F5F9',
                  },
                ]}
                onPress={() => setBulkStatusModal(false)}
              >
                <Text
                  style={[
                    styles.bulkCancelText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.bulkConfirmBtn,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleExecuteBulkStatus}
                disabled={!bulkSelectedStatusName || isBulkExecuting}
              >
                {isBulkExecuting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.bulkConfirmText}>Update Stage</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 10. Bulk Priority Modal */}
      <Modal
        visible={bulkPriorityModal}
        transparent
        animationType="fade"
        onRequestClose={() => setBulkPriorityModal(false)}
      >
        <View style={styles.bulkModalOverlay}>
          <View
            style={[
              styles.bulkModalContent,
              {
                backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                borderColor: isDark ? '#1E293B' : '#E2E8F0',
              },
            ]}
          >
            <Text
              style={[
                styles.bulkModalTitle,
                { color: colors.textPrimary },
              ]}
            >
              Set Priority ({selectedIds.length} Leads)
            </Text>
            <Text
              style={[
                styles.bulkModalSub,
                { color: colors.textSecondary },
              ]}
            >
              Select lead priority / temperature:
            </Text>

            <View style={{ marginVertical: 12 }}>
              {(['Hot', 'Warm', 'Cold'] as const).map((p) => {
                const isSelected = bulkSelectedPriority === p;
                const pColor = p === 'Hot' ? '#EF4444' : p === 'Warm' ? '#F59E0B' : '#3B82F6';
                return (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.bulkUserRow,
                      {
                        backgroundColor: isSelected
                          ? pColor
                          : isDark
                            ? '#101726'
                            : '#F8FAFC',
                        borderColor: isSelected
                          ? pColor
                          : isDark
                            ? '#1E293B'
                            : '#E2E8F0',
                        marginBottom: 8,
                      },
                    ]}
                    onPress={() => setBulkSelectedPriority(p)}
                  >
                    <Text
                      style={[
                        styles.bulkUserName,
                        {
                          color: isSelected
                            ? '#FFFFFF'
                            : colors.textPrimary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {p === 'Hot' ? '🔥 Hot' : p === 'Warm' ? '⚡ Warm' : '❄️ Cold'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.bulkActionButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.bulkCancelBtn,
                  {
                    borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    backgroundColor: isDark ? '#101726' : '#F1F5F9',
                  },
                ]}
                onPress={() => setBulkPriorityModal(false)}
              >
                <Text
                  style={[
                    styles.bulkCancelText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.bulkConfirmBtn,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleExecuteBulkPriority}
                disabled={!bulkSelectedPriority || isBulkExecuting}
              >
                {isBulkExecuting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.bulkConfirmText}>Update Priority</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Material 3 Expressive FAB Menu */}
      <FabSpeedDial
        primaryAction={{
          label: 'Filter Leads',
          onPress: () => {
            triggerHaptic('selection');
            setFilterModalVisible(true);
          },
        }}
        secondaryAction={{
          label: 'Download CSV',
          onPress: handleExportCSV,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({

  // Horizontal Status Tabs Styles
  statusTabsContainer: {
    marginTop: 10,
    marginBottom: 6,
  },
  statusTabsScroll: {
    gap: 8,
    paddingHorizontal: 2,
  },
  statusTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusTabPillActive: {
    backgroundColor: '#0D1554',
    borderColor: '#0D1554',
    shadowColor: '#0D1554',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  statusTabPillInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  statusTabLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusTabLabelActive: {
    color: '#FFFFFF',
  },
  statusTabLabelInactive: {
    color: '#334155',
  },
  statusTabCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusTabCountBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  statusTabCountBadgeInactive: {
    backgroundColor: '#F1F5F9',
  },
  statusTabCountText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusTabCountTextActive: {
    color: '#FFFFFF',
  },
  statusTabCountTextInactive: {
    color: '#64748B',
  },

  // Bottom Floating Action Button (FAB)
  floatingCreateBtn: {
    position: 'absolute',
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0D1554',
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 28,
    shadowColor: '#0D1554',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 99,
  },
  floatingCreateBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  screenContainer: {
    flex: 1,
  },
  brandHeader: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  topStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  drawerBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerBtnText: {
    fontSize: 16,
    fontWeight: '800',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  brandLogoBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  brandLogoImg: {
    width: '100%',
    height: '100%',
  },
  csdTagPill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  csdTagText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.3,
    includeFontPadding: false,
  },
  brandHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  brandNameText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
    includeFontPadding: false,
  },
  oliveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  brandActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  themeSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  themeIcon: {
    fontSize: 11,
  },
  themeLabel: {
    fontSize: 10,
    fontWeight: '700',
    includeFontPadding: false,
  },
  hqAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hqText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    includeFontPadding: false,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 40,
  },
  listHeaderWrapper: {
    paddingBottom: 6,
  },
  actionBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 6,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    gap: 8,
  },
  searchLens: {
    fontSize: 13,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    height: 38,
    paddingVertical: 0,
    paddingTop: 0,
    paddingBottom: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  clearBtn: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  filterModalTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
  },
  filterTriggerIcon: {
    fontSize: 12,
    includeFontPadding: false,
  },
  filterTriggerText: {
    fontSize: 12,
    fontWeight: '700',
    includeFontPadding: false,
  },
  newLeadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  plusIcon: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    includeFontPadding: false,
  },
  newLeadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    includeFontPadding: false,
  },
  activeFiltersRow: {
    marginBottom: 6,
  },
  activeFiltersScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeFilterChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  activeFilterChipText: {
    fontSize: 10,
    fontWeight: '700',
    includeFontPadding: false,
  },
  clearAllBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  clearAllText: {
    fontSize: 10,
    fontWeight: '600',
  },
  batchActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  selectAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  batchCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  batchCheckMark: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    includeFontPadding: false,
    textAlign: 'center',
  },
  selectAllText: {
    fontSize: 11,
    fontWeight: '600',
    includeFontPadding: false,
  },
  batchActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  batchBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  batchBtnText: {
    fontSize: 10,
    fontWeight: '700',
    includeFontPadding: false,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 14,
  },
  resetEmptyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resetEmptyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    fontSize: 12,
    marginTop: 8,
  },
  bulkModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  bulkModalContent: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    maxHeight: '70%',
  },
  bulkModalTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  bulkModalSub: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  bulkUserList: {
    maxHeight: 240,
    marginBottom: 14,
  },
  bulkUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 6,
  },
  bulkUserName: {
    fontSize: 12,
  },
  bulkUserRole: {
    fontSize: 10,
  },
  bulkActionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  bulkCancelBtn: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulkCancelText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bulkConfirmBtn: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulkConfirmText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
