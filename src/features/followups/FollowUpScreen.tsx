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
import {
  Calendar,
  Download,
  Filter,
  PhoneCall,
  Plus,
  RotateCcw,
  Search,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../core/theme/ThemeContext';
import { triggerHaptic } from '../../core/utils/haptics';
import { leadApi } from '../leads/leadService';
import { CustomerLead } from '../leads/types';
import { Prospect360Modal } from '../leads/components/Prospect360Modal';
import { followUpService } from './followUpService';
import {
  CreateFollowUpPayload,
  FollowUpItem,
  FollowUpStats,
  FollowUpTab,
} from './types';
import { FollowUpKpiDeck } from './components/FollowUpKpiDeck';
import { FollowUpCard } from './components/FollowUpCard';
import { LogCallModal } from './components/LogCallModal';
import { FollowUpActionsModal } from './components/FollowUpActionsModal';

interface FollowUpScreenProps {
  onOpenDrawer?: () => void;
  onNavigateToQuotation?: (leadId?: number) => void;
}

export const FollowUpScreen: React.FC<FollowUpScreenProps> = ({
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
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDateFilters, setShowDateFilters] = useState(false);

  // Modals
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [activePrefillItem, setActivePrefillItem] = useState<FollowUpItem | null>(null);

  const [actionsModalVisible, setActionsModalVisible] = useState(false);
  const [selectedActionItem, setSelectedActionItem] = useState<FollowUpItem | null>(null);

  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [activeProfileLead, setActiveProfileLead] = useState<CustomerLead | null>(null);

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
  }, [activeTab, searchTerm, startDate, endDate]);

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

  const handleOpenActions = useCallback((item: FollowUpItem) => {
    triggerHaptic('impactLight');
    setSelectedActionItem(item);
    setActionsModalVisible(true);
  }, []);

  const handleViewProfile = useCallback(
    (item: FollowUpItem) => {
      triggerHaptic('selection');
      // If item has full lead attached or we find it in leadsList
      const matched =
        item.lead || leadsList.find((l) => l.id === item.lead_id);
      if (matched) {
        setActiveProfileLead(matched);
        setProfileModalVisible(true);
      } else {
        // Construct a synthetic lead object from follow-up attributes
        const syntheticLead: CustomerLead = {
          id: item.lead_id || item.id,
          name: item.customer_name,
          phone: item.phone,
          city: item.city || 'Delhi Cantonment',
          vehicle_segment: '4 Wheeler',
          model_variant: item.vehicle || 'CSD Entitlement',
          priority: item.priority || 'Hot',
          status_name: item.status,
          assigned_user_name: item.rep || 'Alexander Vance',
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

  const handleExportCSV = () => {
    triggerHaptic('impactLight');
    Alert.alert(
      'Export Follow-Ups CSV',
      `Exporting ${items.length} follow-up records with contact history, outcomes, scheduled dates, and discount notes to follow_ups_${new Date().toISOString().split('T')[0]}.csv`,
      [{ text: 'Download CSV', onPress: () => triggerHaptic('selection') }]
    );
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
      {/* 1. Header Toolbar */}
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: isDark ? '#101726' : '#FFFFFF',
            borderBottomColor: isDark ? '#1E293B' : '#E2E8F0',
          },
        ]}
      >
        <View>
          <Text
            style={[
              styles.screenTitle,
              { color: isDark ? '#FFFFFF' : '#0F172A' },
            ]}
          >
            Follow-Up & Call Desk
          </Text>
          <Text
            style={[
              styles.screenSubtitle,
              { color: isDark ? '#94A3B8' : '#64748B' },
            ]}
          >
            Unified Telecalling Queue & Interaction Notes
          </Text>
        </View>

        <View style={styles.headerActions}>
          {/* Export CSV Button */}
          <TouchableOpacity
            style={[
              styles.iconBtn,
              {
                backgroundColor: isDark ? '#162030' : '#F1F5F9',
                borderColor: isDark ? '#1E293B' : '#CBD5E1',
              },
            ]}
            onPress={handleExportCSV}
            activeOpacity={0.7}
          >
            <Download size={14} color={colors.textPrimary} strokeWidth={2.2} />
          </TouchableOpacity>

          {/* Log Call Button */}
          <TouchableOpacity
            style={[
              styles.logNewBtn,
              { backgroundColor: colors.primary },
            ]}
            onPress={handleOpenLogNew}
            activeOpacity={0.8}
          >
            <Plus size={14} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.logNewBtnText}>Log Call</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => `followup-${item.id}`}
        renderItem={({ item }) => (
          <FollowUpCard
            item={item}
            onCall={handleCall}
            onLogNext={handleOpenLogNext}
            onSendQuotation={handleSendQuotation}
            onViewProfile={handleViewProfile}
            onOpenActions={handleOpenActions}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom + 24, 40),
        }}
        ListHeaderComponent={
          <>
            {/* 2. KPI Summary Deck */}
            <FollowUpKpiDeck
              stats={stats}
              activeTab={activeTab}
              onSelectTab={(tab) => {
                setActiveTab(tab);
              }}
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

                {/* Date Filter Toggle */}
                <TouchableOpacity
                  style={[
                    styles.dateToggleBtn,
                    {
                      backgroundColor:
                        startDate || endDate || showDateFilters
                          ? isDark
                            ? 'rgba(88, 99, 42, 0.25)'
                            : '#F5F8EE'
                          : isDark
                          ? '#101726'
                          : '#FFFFFF',
                      borderColor:
                        startDate || endDate
                          ? colors.primary
                          : isDark
                          ? '#1E293B'
                          : '#CBD5E1',
                    },
                  ]}
                  onPress={() => setShowDateFilters(!showDateFilters)}
                  activeOpacity={0.7}
                >
                  <Calendar
                    size={14}
                    color={startDate || endDate ? colors.primary : colors.textPrimary}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              </View>

              {/* Collapsible Date Range Picker */}
              {showDateFilters && (
                <View
                  style={[
                    styles.dateRangeBox,
                    {
                      backgroundColor: isDark ? '#101726' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                >
                  <View style={styles.dateInputsRow}>
                    <View style={styles.dateCol}>
                      <Text
                        style={[
                          styles.dateLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        FROM DATE
                      </Text>
                      <TextInput
                        style={[
                          styles.dateInput,
                          {
                            backgroundColor: isDark ? '#162030' : '#F8FAFC',
                            borderColor: isDark ? '#1E293B' : '#CBD5E1',
                            color: colors.textPrimary,
                          },
                        ]}
                        value={startDate}
                        onChangeText={setStartDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>

                    <View style={styles.dateCol}>
                      <Text
                        style={[
                          styles.dateLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        TO DATE
                      </Text>
                      <TextInput
                        style={[
                          styles.dateInput,
                          {
                            backgroundColor: isDark ? '#162030' : '#F8FAFC',
                            borderColor: isDark ? '#1E293B' : '#CBD5E1',
                            color: colors.textPrimary,
                          },
                        ]}
                        value={endDate}
                        onChangeText={setEndDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>
                  </View>

                  {(startDate || endDate) && (
                    <TouchableOpacity
                      style={styles.clearDatesBtn}
                      onPress={() => {
                        setStartDate('');
                        setEndDate('');
                      }}
                    >
                      <RotateCcw size={11} color={colors.primary} />
                      <Text
                        style={[styles.clearDatesText, { color: colors.primary }]}
                      >
                        Reset Date Filters
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* 4. Tab Selector Pills */}
              <View style={styles.tabsRow}>
                {tabs.map((t) => {
                  const isActive = activeTab === t.id;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={[
                        styles.tabPill,
                        {
                          backgroundColor: isActive
                            ? colors.primary
                            : isDark
                            ? '#101726'
                            : '#FFFFFF',
                          borderColor: isActive
                            ? colors.primaryDark
                            : isDark
                            ? '#1E293B'
                            : '#CBD5E1',
                        },
                      ]}
                      onPress={() => {
                        triggerHaptic('selection');
                        setActiveTab(t.id);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.tabText,
                          {
                            color: isActive
                              ? '#FFFFFF'
                              : isDark
                              ? '#CBD5E1'
                              : '#475569',
                            fontWeight: isActive ? '800' : '600',
                          },
                        ]}
                      >
                        {t.label}
                      </Text>
                      <View
                        style={[
                          styles.countBadge,
                          {
                            backgroundColor: isActive
                              ? '#FFFFFF'
                              : isDark
                              ? '#1E293B'
                              : '#F1F5F9',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.countBadgeText,
                            {
                              color: isActive
                                ? colors.primaryDark
                                : isDark
                                ? '#CBD5E1'
                                : '#64748B',
                            },
                          ]}
                        >
                          {t.count}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
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
        onCallAndLog={(item) => {
          handleCall(item.phone);
          handleOpenLogNext(item);
        }}
        onSendQuotation={handleSendQuotation}
        onViewProfile={handleViewProfile}
      />

      <Prospect360Modal
        visible={profileModalVisible}
        lead={activeProfileLead}
        onClose={() => setProfileModalVisible(false)}
        onCall={handleCall}
        onConvertToDeal={() => {
          setProfileModalVisible(false);
          Alert.alert(
            'Convert to Deal',
            'To convert this lead into an official deal dossier, open the Leads Pipeline workbench.'
          );
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
});
