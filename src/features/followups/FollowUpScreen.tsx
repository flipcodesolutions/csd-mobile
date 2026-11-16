import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import {
  Calendar,
  Download,
  Filter,
  PhoneCall,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../core/theme/ThemeContext';
import { triggerHaptic } from '../../core/utils/haptics';
import { exportCsvToFile } from '../../core/utils/csvExporter';
import { DatePickerModal } from '../leads/components/DatePickerModal';
import { FabSpeedDial } from '../../shared';
import { leadApi } from '../leads/leadService';
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
} from '../leads/types';
import { LeadProfileModal } from '../leads/components/LeadProfileModal';
import { FollowUpModal } from '../leads/components/FollowUpModal';
import { SendQuotationModal } from '../leads/components/SendQuotationModal';
import { ConvertToDealModal } from '../leads/components/ConvertToDealModal';
import { EditProspectModal } from '../leads/components/EditProspectModal';
import { followUpService } from './followUpService';
import {
  CreateFollowUpPayload,
  FollowUpItem,
  FollowUpStats,
  FollowUpTab,
  isValidFollowUpOutcome,
  normalizeOutcome,
} from './types';
import { FollowUpStatusDeck } from './components/FollowUpStatusDeck';
import { FollowUpsFilterModal } from './components/FollowUpsFilterModal';
import { FollowUpCard } from './components/FollowUpCard';
import { LogCallModal } from './components/LogCallModal';
import { FollowUpActionsModal } from './components/FollowUpActionsModal';
import { FollowUpHistoryModal } from './components/FollowUpHistoryModal';

interface FollowUpScreenProps {
  navigation?: any;
  onOpenDrawer?: () => void;
  onNavigateToQuotation?: (leadId?: number) => void;
}

export const FollowUpScreen: React.FC<FollowUpScreenProps> = ({
  navigation,
  onOpenDrawer,
  onNavigateToQuotation,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Data States
  const [items, setItems] = useState<FollowUpItem[]>([]);
  const [leadsList, setLeadsList] = useState<CustomerLead[]>([]);
  const [stats, setStats] = useState<FollowUpStats>({
    overdue: 0,
    due_today: 0,
    upcoming: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState<FollowUpTab>('all');
  const [selectedOutcome, setSelectedOutcome] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [isTrashView, setIsTrashView] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<'from' | 'to' | null>(null);

  // Modals
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [activePrefillItem, setActivePrefillItem] = useState<FollowUpItem | null>(null);

  const [actionsModalVisible, setActionsModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<FollowUpItem | null>(null);
  const [selectedActionItem, setSelectedActionItem] = useState<FollowUpItem | null>(null);
  const [historyCounts, setHistoryCounts] = useState<Record<number, number>>({});

  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [activeProfileLead, setActiveProfileLead] = useState<CustomerLead | null>(null);

  // Modals for actions inside LeadProfileModal
  const [dealModalVisible, setDealModalVisible] = useState(false);
  const [activeDealLead, setActiveDealLead] = useState<CustomerLead | null>(null);

  const [leadFollowUpModalVisible, setLeadFollowUpModalVisible] = useState(false);
  const [activeLeadForFollowUp, setActiveLeadForFollowUp] = useState<CustomerLead | null>(null);

  const [quotationModalVisible, setQuotationModalVisible] = useState(false);
  const [activeQuotationLead, setActiveQuotationLead] = useState<CustomerLead | null>(null);

  const [editLeadModalVisible, setEditLeadModalVisible] = useState(false);
  const [editingLead, setEditingLead] = useState<CustomerLead | null>(null);

  const [brandsList, setBrandsList] = useState<BrandItem[]>([]);
  const [modelsList, setModelsList] = useState<ModelItem[]>([]);
  const [variantsList, setVariantsList] = useState<VariantItem[]>([]);
  const [sourcesList, setSourcesList] = useState<SourceItem[]>([]);
  const [statusesList, setStatusesList] = useState<StatusItem[]>([]);
  const [usersList, setUsersList] = useState<UserItem[]>([]);

  // Fetch masters for in-modal quotation and edit lead
  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [bRes, mRes, vRes, sRes, stRes, uRes] = await Promise.allSettled([
          brandApi.getAll({ per_page: 100 }),
          modelApi.getAll({ per_page: 100 }),
          variantApi.getAll({ per_page: 100 }),
          leadSourceApi.getAll(),
          leadStatusApi.getAll(),
          userApi.getAll(),
        ]);
        if (bRes.status === 'fulfilled') {
          const val: any = bRes.value;
          setBrandsList(Array.isArray(val?.data) ? val.data : val?.data?.data || []);
        }
        if (mRes.status === 'fulfilled') {
          const val: any = mRes.value;
          setModelsList(Array.isArray(val?.data) ? val.data : val?.data?.data || []);
        }
        if (vRes.status === 'fulfilled') {
          const val: any = vRes.value;
          setVariantsList(Array.isArray(val?.data) ? val.data : val?.data?.data || []);
        }
        if (sRes.status === 'fulfilled') {
          const val: any = sRes.value;
          setSourcesList(Array.isArray(val?.data) ? val.data : Array.isArray(val) ? val : []);
        }
        if (stRes.status === 'fulfilled') {
          const val: any = stRes.value;
          setStatusesList(Array.isArray(val?.data) ? val.data : Array.isArray(val) ? val : []);
        }
        if (uRes.status === 'fulfilled') {
          const val: any = uRes.value;
          setUsersList(Array.isArray(val?.data) ? val.data : Array.isArray(val) ? val : []);
        }
      } catch (e) {
        console.log('Error fetching masters in FollowUpScreen:', e);
      }
    };
    fetchMasters();
  }, []);

  // Synchronize history counts
  const handleHistoryCountFetched = useCallback((leadId: number, count: number) => {
    setHistoryCounts((prev) => ({ ...prev, [leadId]: count }));
    setItems((prev) =>
      prev.map((it) => (it.lead_id === leadId ? { ...it, calls_count: count } : it))
    );
  }, []);

  // Calculate live counts for the 8 Status Cards
  const outcomeCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: items.length,
      'Interested / Call Back': 0,
      'Quotation Requested': 0,
      'Quotation Sent': 0,
      'Price Negotiation': 0,
      'Not Reachable / Busy': 0,
      'Deal Won': 0,
      'Lost to Competitor': 0,
    };

    items.forEach((item) => {
      const canonical = normalizeOutcome(item.status);
      if (canonical && counts[canonical] !== undefined) {
        counts[canonical] += 1;
      }
    });

    return counts;
  }, [items]);

  // Filter items by selected call outcome
  const displayedItems = useMemo(() => {
    if (selectedOutcome === 'all') return items;
    return items.filter(
      (item) => normalizeOutcome(item.status) === selectedOutcome
    );
  }, [items, selectedOutcome]);

  // Active filters count for badge
  const activeFiltersCount =
    (activeTab !== 'all' ? 1 : 0) +
    (selectedOutcome !== 'all' ? 1 : 0) +
    (startDate || endDate ? 1 : 0);

  // Fetch Leads for Dropdown Selection
  const loadLeads = useCallback(async () => {
    try {
      const res = await leadApi.getAll({ per_page: 100 });
      if (res?.data && Array.isArray(res.data)) {
        setLeadsList(res.data);
      }
    } catch (err) {
      console.log('Failed to fetch leads for follow-up dropdown:', err);
    }
  }, []);

  // Fetch Follow-Ups List
  const loadFollowUps = useCallback(async () => {
    try {
      setLoading(true);
      const res = await followUpService.getAll({
        tab: activeTab === 'all' ? undefined : activeTab,
        search: searchTerm.trim() || undefined,
        from_date: startDate || undefined,
        to_date: endDate || undefined,
        per_page: 50,
        status: isTrashView ? 'deleted' : undefined,
      });

      setItems(res.data);
      if (res.kpis) {
        setStats(res.kpis);
      }
    } catch (err: any) {
      console.log('Failed to fetch follow-ups:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, searchTerm, startDate, endDate, isTrashView]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadFollowUps();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadFollowUps]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    triggerHaptic('impactLight');
    loadFollowUps();
  }, [loadFollowUps]);

  // Handlers
  const handleCall = useCallback((phone: string) => {
    const cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned) {
      Linking.openURL(`tel:${cleaned}`).catch(() => {
        Alert.alert('Dialer Error', `Could not initiate call to ${cleaned}`);
      });
    }
  }, []);

  const handleOpenLogNew = useCallback(() => {
    triggerHaptic('impactMedium');
    setActivePrefillItem(null);
    setLogModalVisible(true);
  }, []);

  const handleOpenLogNext = useCallback((item: FollowUpItem) => {
    triggerHaptic('selection');
    setActivePrefillItem(item);
    setLogModalVisible(true);
  }, []);

  const handleOpenHistory = useCallback((item: FollowUpItem) => {
    triggerHaptic('selection');
    setSelectedHistoryItem(item);
    setHistoryModalVisible(true);
  }, []);

  const handleOpenActions = useCallback((item: FollowUpItem) => {
    triggerHaptic('impactLight');
    setSelectedActionItem(item);
    setActionsModalVisible(true);
  }, []);

  const handleViewProfile = useCallback(
    async (item: FollowUpItem) => {
      triggerHaptic('selection');
      if (item.lead_id) {
        try {
          const res = await leadApi.getById(item.lead_id);
          const fullLead = res?.data || res;
          if (fullLead && (fullLead.name || fullLead.id)) {
            setActiveProfileLead(fullLead);
            setProfileModalVisible(true);
            return;
          }
        } catch (e) {
          console.log('Using local lead data for profile:', e);
        }
      }

      const matched = item.lead || leadsList.find((l) => l.id === item.lead_id);
      if (matched) {
        setActiveProfileLead(matched);
        setProfileModalVisible(true);
      } else {
        const syntheticLead: CustomerLead = {
          id: item.lead_id || item.id,
          name: item.customer_name,
          phone: item.phone,
          city: item.city || '',
          vehicle_segment: '4 Wheeler',
          model_variant: item.vehicle || '',
          brand_name: item.brand_name || '',
          priority: item.priority || 'Hot',
          status_name: item.status,
          assigned_user_name: item.rep || '',
          notes: item.notes,
        };
        setActiveProfileLead(syntheticLead);
        setProfileModalVisible(true);
      }
    },
    [leadsList]
  );

  const handleSendQuotation = useCallback(
    (item: FollowUpItem) => {
      triggerHaptic('selection');
      if (onNavigateToQuotation) {
        onNavigateToQuotation(item.lead_id || undefined);
      } else {
        Alert.alert(
          'CSD Quotation Engine',
          `Generating formal quotation dossier for ${item.customer_name} (${item.vehicle || 'Vehicle'}). Redirecting to quotation desk...`
        );
      }
    },
    [onNavigateToQuotation]
  );

  const handleRestoreFollowUp = useCallback(async (item: FollowUpItem) => {
    triggerHaptic('notificationWarning');
    Alert.alert(
      'Restore Follow-Up',
      `Are you sure you want to restore the follow-up record for ${item.customer_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'default',
          onPress: async () => {
            try {
              await followUpService.restore(item.id);
              setItems((prev) => prev.filter((i) => i.id !== item.id));
              Alert.alert('Restored', 'Follow-up interaction restored successfully.');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to restore follow-up.');
            }
          },
        },
      ]
    );
  }, []);

  const handleSaveCallInteraction = async (payload: CreateFollowUpPayload) => {
    try {
      await followUpService.create(payload);
      Alert.alert(
        'Follow-Up Recorded!',
        payload.is_discount_requested
          ? `Follow-up logged and discount approval request (₹${payload.discount_amount?.toLocaleString(
              'en-IN'
            )}) dispatched to Sales Manager & Admin!`
          : `Call interaction with ${payload.customer_name} logged successfully.`
      );
      loadFollowUps();
    } catch (err: any) {
      Alert.alert('Log Error', err?.message || 'Failed to submit follow-up.');
    }
  };

  const handleExportCSV = async () => {
    triggerHaptic('impactLight');
    const rows = items.map((item) => [
      item.id,
      item.customer_name || 'N/A',
      item.phone || 'N/A',
      item.type || 'N/A',
      item.next_follow_up_date || item.follow_up_date || 'N/A',
      item.notes || 'N/A',
      item.status || 'Active',
    ]);
    await exportCsvToFile({
      filename: `follow_ups_${new Date().toISOString().split('T')[0]}`,
      headers: ['ID', 'Customer Name', 'Phone', 'Stage', 'Next Follow-up', 'Notes', 'Status'],
      rows,
    });
  };

  // Handlers for action buttons inside LeadProfileModal (View Details)
  const handleConvertToDeal = async (dealData: any) => {
    try {
      await dealApi.create(dealData);
      setDealModalVisible(false);
      Alert.alert('Deal Created!', 'Lead converted to deal dossier successfully.');
      loadFollowUps();
    } catch (err: any) {
      Alert.alert(
        'Conversion Failed',
        err?.response?.data?.message || err?.message || 'Failed to convert lead to deal.'
      );
    }
  };

  const handleSaveFollowUpForLead = async (leadId: number, followUpData: any) => {
    try {
      await leadApi.addFollowUp(leadId, followUpData);
      setLeadFollowUpModalVisible(false);
      Alert.alert('Logged', 'Follow-up interaction logged successfully.');
      loadFollowUps();
    } catch (err: any) {
      Alert.alert(
        'Follow-Up Error',
        err?.response?.data?.message || err?.message || 'Failed to log follow-up.'
      );
    }
  };

  const handleSendQuotationForLead = (lead: CustomerLead) => {
    setProfileModalVisible(false);
    if (onNavigateToQuotation) {
      onNavigateToQuotation(lead.id);
    } else if (navigation) {
      (navigation as any).navigate('send-quotation', { leadId: lead.id });
    } else {
      setActiveQuotationLead(lead);
      setQuotationModalVisible(true);
    }
  };

  const handleSaveEditedLead = async (formData: any) => {
    if (!editingLead?.id) return;
    try {
      await leadApi.update(editingLead.id, formData);
      setEditLeadModalVisible(false);
      Alert.alert('Success', 'Lead details updated successfully.');
      loadFollowUps();
    } catch (err: any) {
      Alert.alert(
        'Update Failed',
        err?.response?.data?.message || err?.message || 'Failed to update lead.'
      );
    }
  };

  const tabs: { id: FollowUpTab; label: string; count: number }[] = [
    { id: 'all', label: 'All Follow-ups', count: stats.total },
    { id: 'overdue', label: 'Overdue', count: stats.overdue },
    { id: 'today', label: 'Due Today', count: stats.due_today },
    { id: 'upcoming', label: 'Upcoming', count: stats.upcoming },
  ];

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: isDark ? '#080D1A' : '#F7F7F5' },
      ]}
    >
      <FlatList
        data={displayedItems}
        keyExtractor={(item) => `followup-${item.id}`}
        renderItem={({ item }) => {
          const syncCount =
            historyCounts[item.lead_id || item.id] || item.calls_count || 1;
          const enhancedItem = { ...item, calls_count: syncCount };
          return (
            <FollowUpCard
              item={enhancedItem}
              isTrashView={isTrashView}
              onRestore={handleRestoreFollowUp}
              onCall={handleCall}
              onLogNext={handleOpenLogNext}
              onSendQuotation={handleSendQuotation}
              onViewProfile={handleViewProfile}
              onOpenActions={handleOpenActions}
              onOpenHistory={handleOpenHistory}
            />
          );
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom + 90, 110),
        }}
        ListHeaderComponent={
          <>
            {/* 2. 8 Status Cards Deck */}
            <FollowUpStatusDeck
              counts={outcomeCounts}
              selectedStatus={selectedOutcome}
              onSelectStatus={(status) => setSelectedOutcome(status)}
            />

            {/* 3. Search & Filter Bar */}
            <View style={styles.filterSection}>
              <View style={styles.searchRow}>
                <View
                  style={[
                    styles.searchBox,
                    {
                      backgroundColor: isDark ? '#101726' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#CBD5E1',
                    },
                  ]}
                >
                  <Search
                    size={14}
                    color={colors.textSecondary}
                    strokeWidth={2}
                  />
                  <TextInput
                    style={[
                      styles.searchInput,
                      { color: isDark ? '#F8FAFC' : '#0F172A' },
                    ]}
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    placeholder="Search customer, phone, vehicle..."
                    placeholderTextColor={colors.textMuted}
                  />
                  {searchTerm ? (
                    <TouchableOpacity
                      onPress={() => setSearchTerm('')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X
                        size={14}
                        color={colors.textSecondary}
                        strokeWidth={2}
                      />
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Leads-Style Filter Trigger Button */}
                <TouchableOpacity
                  style={[
                    styles.filterTriggerBtn,
                    {
                      backgroundColor:
                        activeFiltersCount > 0
                          ? colors.primary
                          : isDark
                          ? '#101726'
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
                      ? `Filter (${activeFiltersCount})`
                      : 'Filter'}
                  </Text>
                </TouchableOpacity>

                {/* Trash View Toggle Button */}
                <TouchableOpacity
                  style={[
                    styles.trashTriggerBtn,
                    {
                      backgroundColor: isTrashView
                        ? '#EF4444'
                        : isDark
                        ? '#101726'
                        : '#FFFFFF',
                      borderColor: isTrashView
                        ? '#DC2626'
                        : isDark
                        ? '#1E293B'
                        : '#CBD5E1',
                    },
                  ]}
                  onPress={() => {
                    triggerHaptic('impactMedium');
                    setIsTrashView(!isTrashView);
                  }}
                  activeOpacity={0.8}
                >
                  <Trash2
                    size={15}
                    color={isTrashView ? '#FFFFFF' : '#EF4444'}
                    strokeWidth={2.2}
                  />
                </TouchableOpacity>
              </View>

              {/* Trash Mode Banner */}
              {isTrashView && (
                <View
                  style={[
                    styles.trashBanner,
                    {
                      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
                      borderColor: '#EF4444',
                    },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    <Trash2 size={14} color="#DC2626" strokeWidth={2.4} />
                    <Text style={styles.trashBannerText}>
                      Trash Folder — Viewing Deleted Follow-Ups
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic('selection');
                      setIsTrashView(false);
                    }}
                    style={styles.exitTrashBtn}
                  >
                    <Text style={styles.exitTrashBtnText}>Exit Trash</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Active Filter Chips */}
              {activeFiltersCount > 0 && (
                <View style={styles.activeFilterChipsRow}>
                  {selectedOutcome !== 'all' && (
                    <View
                      style={[
                        styles.activeFilterChip,
                        {
                          backgroundColor: isDark
                            ? 'rgba(88, 99, 42, 0.25)'
                            : '#F5F8EE',
                          borderColor: colors.primary,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.activeFilterChipText,
                          { color: colors.primary },
                        ]}
                      >
                        Status: {selectedOutcome}
                      </Text>
                      <TouchableOpacity
                        onPress={() => setSelectedOutcome('all')}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <X size={12} color={colors.primary} strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                  )}

                  {activeTab !== 'all' && (
                    <View
                      style={[
                        styles.activeFilterChip,
                        {
                          backgroundColor: isDark
                            ? 'rgba(88, 99, 42, 0.25)'
                            : '#F5F8EE',
                          borderColor: colors.primary,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.activeFilterChipText,
                          { color: colors.primary },
                        ]}
                      >
                        Due: {activeTab.toUpperCase()}
                      </Text>
                      <TouchableOpacity
                        onPress={() => setActiveTab('all')}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <X size={12} color={colors.primary} strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                  )}

                  {(startDate || endDate) && (
                    <View
                      style={[
                        styles.activeFilterChip,
                        {
                          backgroundColor: isDark
                            ? 'rgba(88, 99, 42, 0.25)'
                            : '#F5F8EE',
                          borderColor: colors.primary,
                        },
                      ]}
                    >
                      <Calendar size={11} color={colors.primary} />
                      <Text
                        style={[
                          styles.activeFilterChipText,
                          { color: colors.primary },
                        ]}
                      >
                        {startDate} {endDate && endDate !== startDate ? `to ${endDate}` : ''}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setStartDate('');
                          setEndDate('');
                        }}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <X size={12} color={colors.primary} strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic('impactLight');
                      setSelectedOutcome('all');
                      setActiveTab('all');
                      setStartDate('');
                      setEndDate('');
                    }}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    style={styles.clearAllFilterBtn}
                  >
                    <Text
                      style={[
                        styles.clearAllFilterText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Reset
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text
                style={[
                  styles.emptyText,
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
              >
                Loading follow-up queue...
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 28, marginBottom: 8 }}>📞</Text>
              <Text
                style={[
                  styles.emptyTitle,
                  { color: isDark ? '#F8FAFC' : '#0F172A' },
                ]}
              >
                No Follow-Ups Found
              </Text>
              <Text
                style={[
                  styles.emptyText,
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
              >
                {searchTerm || startDate || endDate
                  ? 'No records match your active search and date filters.'
                  : `No ${activeTab} follow-up calls scheduled.`}
              </Text>
            </View>
          )
        }
      />

      {/* 5. Modals */}
      <LogCallModal
        visible={logModalVisible}
        prefillItem={activePrefillItem}
        leads={leadsList}
        onClose={() => setLogModalVisible(false)}
        onSubmit={handleSaveCallInteraction}
      />

      <FollowUpActionsModal
        visible={actionsModalVisible}
        item={selectedActionItem}
        onClose={() => setActionsModalVisible(false)}
        onCall={(phone) => handleCall(phone)}
        onCallAndLog={(item) => {
          handleCall(item.phone);
          handleOpenLogNext(item);
        }}
        onLogAction={(item) => handleOpenLogNext(item)}
        onSendQuotation={handleSendQuotation}
        onViewProfile={handleViewProfile}
      />

      <FollowUpHistoryModal
        visible={historyModalVisible}
        item={selectedHistoryItem}
        onClose={() => setHistoryModalVisible(false)}
        onCall={handleCall}
        onLogNewFollowUp={(item) => {
          setHistoryModalVisible(false);
          handleOpenLogNext(item);
        }}
        onHistoryCountFetched={handleHistoryCountFetched}
      />

      <FollowUpsFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedOutcome={selectedOutcome}
        setSelectedOutcome={setSelectedOutcome}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        timingStats={stats}
        outcomeCounts={outcomeCounts}
        activeFiltersCount={activeFiltersCount}
        onReset={() => {
          setActiveTab('all');
          setSelectedOutcome('all');
          setStartDate('');
          setEndDate('');
        }}
        onApply={() => {
          setFilterModalVisible(false);
        }}
      />

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
        onLogFollowUp={(ld) => {
          setProfileModalVisible(false);
          setActiveLeadForFollowUp(ld);
          setLeadFollowUpModalVisible(true);
        }}
        onSendQuotation={(ld) => {
          handleSendQuotationForLead(ld);
        }}
        onEditLead={(ld) => {
          setProfileModalVisible(false);
          setEditingLead(ld);
          setEditLeadModalVisible(true);
        }}
      />

      <EditProspectModal
        visible={editLeadModalVisible}
        lead={editingLead}
        brands={brandsList}
        models={modelsList}
        variants={variantsList}
        sources={sourcesList}
        statuses={statusesList}
        users={usersList}
        onClose={() => setEditLeadModalVisible(false)}
        onSubmit={handleSaveEditedLead}
      />

      <FollowUpModal
        visible={leadFollowUpModalVisible}
        lead={activeLeadForFollowUp}
        onClose={() => setLeadFollowUpModalVisible(false)}
        onSubmit={handleSaveFollowUpForLead}
      />

      <SendQuotationModal
        visible={quotationModalVisible}
        lead={activeQuotationLead}
        brands={brandsList}
        models={modelsList}
        variants={variantsList}
        onClose={() => setQuotationModalVisible(false)}
        onSuccess={() => {
          setQuotationModalVisible(false);
          loadFollowUps();
        }}
      />

      <ConvertToDealModal
        visible={dealModalVisible}
        lead={activeDealLead}
        onClose={() => setDealModalVisible(false)}
        onSubmit={handleConvertToDeal}
      />

      {/* Material 3 Expressive FAB Menu */}
      <FabSpeedDial
        primaryAction={{
          label: 'Log Call',
          onPress: handleOpenLogNew,
        }}
        secondaryAction={{
          label: 'Download CSV',
          onPress: handleExportCSV,
        }}
      />
    
      {/* Date Filter Calendar Modal */}
      <DatePickerModal
        visible={datePickerTarget !== null}
        title={datePickerTarget === 'from' ? 'Select Start Date (From)' : 'Select End Date (To)'}
        initialDate={(datePickerTarget === 'from' ? startDate : endDate) || new Date().toISOString().split('T')[0]}
        allowFuture={true}
        allowPast={true}
        onClose={() => setDatePickerTarget(null)}
        onSelectDate={(formattedDate) => {
          if (datePickerTarget === 'from') {
            setStartDate(formattedDate);
          } else {
            setEndDate(formattedDate);
          }
          setDatePickerTarget(null);
        }}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  screenTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 10.5,
    fontWeight: '500',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 5,
  },
  logNewBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBox: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '500',
    height: '100%',
  },
  filterTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  filterTriggerText: {
    fontSize: 12,
    fontWeight: '700',
    includeFontPadding: false,
  },
  activeFilterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  activeFilterChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  clearAllFilterBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearAllFilterText: {
    fontSize: 11,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  activeDateChipRow: {
    marginHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
  },
  activeDateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  activeDateText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dateToggleBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateRangeBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    gap: 8,
  },
  dateInputsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateCol: {
    flex: 1,
    gap: 4,
  },
  dateLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  datePickerBtn: {
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  datePickerBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateInput: {
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12,
  },
  clearDatesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
  },
  clearDatesText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  tabText: {
    fontSize: 11,
  },
  countBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  trashTriggerBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    width: 40,
    borderRadius: 8,
    borderWidth: 1,
  },
  trashBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
    marginBottom: 6,
  },
  trashBannerText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
  exitTrashBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  exitTrashBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
