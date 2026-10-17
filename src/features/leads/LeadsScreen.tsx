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
import { useTheme } from '../../core/theme/ThemeContext';
import { triggerHaptic } from '../../core/utils/haptics';
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
} from './types';

import { KpiMetricsDeck } from './components/KpiMetricsDeck';
import { LeadCard } from './components/LeadCard';
import { LeadsFilterModal } from './components/LeadsFilterModal';
import { ConvertToDealModal } from './components/ConvertToDealModal';
import { EditProspectModal } from './components/EditProspectModal';
import { Prospect360Modal } from './components/Prospect360Modal';
import { FollowUpModal } from './components/FollowUpModal';
import { LeadActionsModal } from './components/LeadActionsModal';
import { SendQuotationModal } from './components/SendQuotationModal';
import { QuickViewLeadModal } from './components/QuickViewLeadModal';

interface LeadsScreenProps {
  onOpenDrawer?: () => void;
}

export const LeadsScreen: React.FC<LeadsScreenProps> = ({ onOpenDrawer }) => {
  const { colors, isDark, toggleTheme } = useTheme();
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
  const [bulkSelectedUser, setBulkSelectedUser] = useState<number | null>(null);
  const [bulkSelectedStatus, setBulkSelectedStatus] = useState<number | null>(null);
  const [isBulkExecuting, setIsBulkExecuting] = useState(false);

  // 4. Loading, Refreshing & Pagination
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalLeadsCount, setTotalLeadsCount] = useState(0);

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
        per_page: 15,
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

  // KPIs
  const totalCount = totalLeadsCount || leads.length;
  const hotCount = useMemo(() => leads.filter((l) => l.priority === 'Hot').length, [leads]);
  const fourWheelerCount = useMemo(
    () => leads.filter((l) => l.vehicle_segment === '4 Wheeler').length,
    [leads]
  );
  const twoWheelerCount = useMemo(
    () => leads.filter((l) => l.vehicle_segment === '2 Wheeler').length,
    [leads]
  );

  // Stage counts
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {
      New: 0,
      'In Follow-Up': 0,
      Negotiation: 0,
      'Deal Won': 0,
      'Deal Lost': 0,
    };
    leads.forEach((l) => {
      const st = l.status_name || (l.is_converted ? 'Deal Won' : 'New');
      if (counts[st] !== undefined) {
        counts[st]++;
      } else {
        counts[st] = (counts[st] || 0) + 1;
      }
    });
    return counts;
  }, [leads]);

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
        const matchesCity = item.city?.toLowerCase().includes(term);
        const matchesModel = item.model_variant?.toLowerCase().includes(term);
        const matchesBrand = item.brand_name?.toLowerCase().includes(term);
        const matchesId = item.id?.toString().includes(term);
        if (!matchesName && !matchesPhone && !matchesCity && !matchesModel && !matchesBrand && !matchesId) {
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

      // 4. Stage filter
      if (stageFilter !== 'All') {
        const st = item.status_name || (item.is_converted ? 'Deal Won' : 'New');
        if (st.toLowerCase() !== stageFilter.toLowerCase()) {
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
  }, [leads, search, segmentFilter, priorityFilter, stageFilter, brandFilter, userFilter]);

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

  const handleOpenSendQuotation = useCallback((ld: CustomerLead) => {
    setActiveQuotationLead(ld);
    setQuotationModalVisible(true);
  }, []);

  const handleOpenQuickView = useCallback((ld: CustomerLead) => {
    setActiveQuickViewLead(ld);
    setQuickViewModalVisible(true);
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
          ? { ...l, is_converted: true, status_name: 'Deal Won' }
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
    if (!bulkSelectedStatus || selectedIds.length === 0) return;
    try {
      setIsBulkExecuting(true);
      await leadApi.bulkStatus(selectedIds, bulkSelectedStatus);
      const statusObj = statuses.find((s) => s.id === bulkSelectedStatus);
      setLeads((prev) =>
        prev.map((l) =>
          selectedIds.includes(l.id)
            ? {
              ...l,
              status_id: bulkSelectedStatus,
              status_name: statusObj?.name,
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
        contentContainerStyle={styles.listContent}
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
                onPress={() => {
                  triggerHaptic('impactLight');
                  setEditingLead(null);
                  setLeadModalVisible(true);
                }}
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

      {/* 6. Prospect 360° Profile Modal */}
      <Prospect360Modal
        visible={detailModalVisible}
        lead={activeDetailLead}
        onClose={() => setDetailModalVisible(false)}
        onCall={handleCall}
        onConvertToDeal={(ld) => {
          setDetailModalVisible(false);
          setActiveDealLead(ld);
          setDealModalVisible(true);
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
          setActiveQuotationLead(ld);
          setQuotationModalVisible(true);
        }}
        onQuickView={(ld) => {
          setActiveQuickViewLead(ld);
          setQuickViewModalVisible(true);
        }}
        onEditLead={(ld) => {
          setEditingLead(ld);
          setLeadModalVisible(true);
        }}
        onDeleteLead={(ld) => {
          handleDeleteLead(ld.id, ld.name);
        }}
      />

      {/* 9. Send Quotation Modal (Matching Web Screenshot 3) */}
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

      {/* 10. Quick View Prospect Modal */}
      <QuickViewLeadModal
        visible={quickViewModalVisible}
        lead={activeQuickViewLead}
        onClose={() => setQuickViewModalVisible(false)}
        onCall={handleCall}
        onConvertDeal={(ld) => {
          setQuickViewModalVisible(false);
          setActiveDealLead(ld);
          setDealModalVisible(true);
        }}
        onSendQuotation={(ld) => {
          setQuickViewModalVisible(false);
          setActiveQuotationLead(ld);
          setQuotationModalVisible(true);
        }}
        onView360={(ld) => {
          setQuickViewModalVisible(false);
          setActiveDetailLead(ld);
          setDetailModalVisible(true);
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
              {statuses.map((st) => {
                const isSelected = bulkSelectedStatus === st.id;
                return (
                  <TouchableOpacity
                    key={st.id}
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
                    onPress={() => setBulkSelectedStatus(st.id)}
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
                      {st.name}
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
                disabled={!bulkSelectedStatus || isBulkExecuting}
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
    </View>
  );
};

const styles = StyleSheet.create({
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
