import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Calendar,
  Cake,
  Check,
  Heart,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Users,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../core/theme/ThemeContext';
import { triggerHaptic } from '../../core/utils/haptics';
import { showErrorToast, showSuccessToast } from '../../core/utils/toast';
import { leadApi } from './leadService';
import { CustomerLead } from './types';
import { CustomerDateCard } from './components/CustomerDateCard';
import {
  CustomerDatesFilterModal,
  CustomerDatesFilterState,
} from './components/CustomerDatesFilterModal';
import { DatePickerModal } from './components/DatePickerModal';

interface CustomerDatesManagerScreenProps {
  onOpenDrawer?: () => void;
  navigation?: any;
}

interface KpiSummaryCardProps {
  title: string;
  count: number;
  subtext: string;
  icon: any;
  iconColor: string;
  iconBg: string;
  isActive: boolean;
  onPress: () => void;
}

const KpiSummaryCard: React.FC<KpiSummaryCardProps> = ({
  title,
  count,
  subtext,
  icon: Icon,
  iconColor,
  iconBg,
  isActive,
  onPress,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <TouchableOpacity
      onPress={() => {
        triggerHaptic('selection');
        onPress();
      }}
      activeOpacity={0.75}
      style={[
        styles.kpiCard,
        {
          backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
          borderColor: isActive
            ? '#58632A'
            : isDark
              ? '#1E293B'
              : '#E2E8F0',
        },
        isActive && styles.kpiCardActive,
      ]}
    >
      <View style={styles.kpiCardTop}>
        <Text style={[styles.kpiCardTitle, { color: colors.textSecondary }]}>
          {title}
        </Text>
        <View style={[styles.kpiIconBox, { backgroundColor: iconBg }]}>
          <Icon size={18} color={iconColor} strokeWidth={2.4} />
        </View>
      </View>

      <Text
        style={[
          styles.kpiCountText,
          { color: isActive ? '#58632A' : colors.textPrimary },
        ]}
      >
        {count} Leads
      </Text>

      <View style={styles.kpiSubtextRow}>
        {isActive ? (
          <View style={styles.activeFilterPill}>
            <Check size={11} color="#58632A" strokeWidth={3} />
            <Text style={styles.activeFilterPillText}>Currently Active</Text>
          </View>
        ) : (
          <Text style={[styles.kpiSubtext, { color: colors.textSecondary }]}>
            {subtext}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export const CustomerDatesManagerScreen: React.FC<CustomerDatesManagerScreenProps> = ({
  onOpenDrawer,
  navigation,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // 1. Leads Data & Pagination States
  const [leads, setLeads] = useState<CustomerLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 2. Draft Dates Store (Local inline edits before/after save)
  const [draftDates, setDraftDates] = useState<
    Record<number, { birth_date: string | null; anniversary_date: string | null }>
  >({});
  const [savingLeadIds, setSavingLeadIds] = useState<Record<number, boolean>>({});

  // 3. Search & Filter Modal States
  const [search, setSearch] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterState, setFilterState] = useState<CustomerDatesFilterState>({
    filterType: 'all',
    dateField: 'any',
    fromDate: null,
    toDate: null,
  });

  // 4. Date Picker Modal State
  const [datePickerConfig, setDatePickerConfig] = useState<{
    visible: boolean;
    title: string;
    initialDate?: string;
    allowFuture: boolean;
    allowPast: boolean;
    onSelectDate: (d: string) => void;
  }>({
    visible: false,
    title: 'Select Date',
    allowFuture: true,
    allowPast: true,
    onSelectDate: () => {},
  });

  // Initial Data Fetch
  useEffect(() => {
    fetchLeads(1, false);
  }, []);

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
      });

      let list: CustomerLead[] = [];
      if (Array.isArray(res)) {
        list = res;
      } else if (Array.isArray(res?.data)) {
        list = res.data;
      } else if (Array.isArray(res?.data?.data)) {
        list = res.data.data;
      } else if (Array.isArray(res?.leads)) {
        list = res.leads;
      }

      const pagination = res?.pagination || res?.data?.pagination;

      if (pageNumber === 1) {
        setLeads(list);
      } else {
        setLeads((prev) => {
          const safePrev = Array.isArray(prev) ? prev : [];
          const existingIds = new Set(safePrev.map((l) => l.id));
          const newItems = list.filter((l) => !existingIds.has(l.id));
          return [...safePrev, ...newItems];
        });
      }

      setPage(pageNumber);

      if (pagination) {
        setHasMore(pagination.current_page < pagination.last_page);
      } else {
        setHasMore(list.length >= 25);
      }
    } catch (err) {
      console.log('Failed to fetch leads for dates manager:', err);
      showErrorToast('Error', 'Unable to load leads. Please check connection.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  const handleRefresh = async () => {
    triggerHaptic('impactLight');
    setIsRefreshing(true);
    await fetchLeads(1, false);
  };

  const handleLoadMore = () => {
    if (!isLoading && !isLoadingMore && hasMore) {
      fetchLeads(page + 1, true);
    }
  };

  // -------------------------------------------------------------
  // KPI Metrics Calculation across loaded leads
  // -------------------------------------------------------------
  const kpiCounts = useMemo(() => {
    const safeLeads = Array.isArray(leads) ? leads : [];
    let total = safeLeads.length;
    let missingDob = 0;
    let missingAnniv = 0;
    let missingBoth = 0;
    let hasBoth = 0;

    safeLeads.forEach((l) => {
      if (!l || !l.id) return;
      const currentBirth = draftDates[l.id]?.birth_date !== undefined
        ? draftDates[l.id].birth_date
        : l.birth_date || l.birthday;
      const currentAnniv = draftDates[l.id]?.anniversary_date !== undefined
        ? draftDates[l.id].anniversary_date
        : l.anniversary_date;

      const hasDob = Boolean(currentBirth);
      const hasAnn = Boolean(currentAnniv);

      if (!hasDob) missingDob++;
      if (!hasAnn) missingAnniv++;
      if (!hasDob && !hasAnn) missingBoth++;
      if (hasDob && hasAnn) hasBoth++;
    });

    return { total, missingDob, missingAnniv, missingBoth, hasBoth };
  }, [leads, draftDates]);

  // -------------------------------------------------------------
  // Filtered Leads List Logic
  // -------------------------------------------------------------
  const filteredLeads = useMemo(() => {
    const safeLeads = Array.isArray(leads) ? leads : [];
    return safeLeads.filter((item) => {
      if (!item) return false;
      // 1. Text Search Filter
      const q = search.trim().toLowerCase();
      if (q) {
        const nameMatch = (item.name || '').toLowerCase().includes(q);
        const phoneMatch = (item.phone || '').toLowerCase().includes(q);
        const cityMatch = (item.city || item.home_town || '').toLowerCase().includes(q);
        const postingMatch = (item.posting || '').toLowerCase().includes(q);
        const vehicleMatch = (item.model_variant || item.brand_name || '').toLowerCase().includes(q);
        if (!nameMatch && !phoneMatch && !cityMatch && !postingMatch && !vehicleMatch) {
          return false;
        }
      }

      // Effective dates (accounting for in-memory unsaved edits)
      const currentBirth = draftDates[item.id]?.birth_date !== undefined
        ? draftDates[item.id].birth_date
        : item.birth_date || item.birthday;
      const currentAnniv = draftDates[item.id]?.anniversary_date !== undefined
        ? draftDates[item.id].anniversary_date
        : item.anniversary_date;

      const hasDob = Boolean(currentBirth);
      const hasAnn = Boolean(currentAnniv);

      // 2. Preset Filter Check
      switch (filterState.filterType) {
        case 'missing_dob':
          if (hasDob) return false;
          break;
        case 'missing_anniversary':
          if (hasAnn) return false;
          break;
        case 'missing_both':
          if (hasDob || hasAnn) return false;
          break;
        case 'has_both':
          if (!hasDob || !hasAnn) return false;
          break;
        case 'all':
        default:
          break;
      }

      // 3. Date Range Filter Check (From - To)
      if (filterState.fromDate || filterState.toDate) {
        const from = filterState.fromDate || '0000-00-00';
        const to = filterState.toDate || '9999-99-99';

        const checkInRange = (targetIso?: string | null) => {
          if (!targetIso) return false;
          const clean = targetIso.split('T')[0];
          return clean >= from && clean <= to;
        };

        if (filterState.dateField === 'birth_date') {
          if (!checkInRange(currentBirth)) return false;
        } else if (filterState.dateField === 'anniversary_date') {
          if (!checkInRange(currentAnniv)) return false;
        } else if (filterState.dateField === 'created_at') {
          if (!checkInRange(item.created_at)) return false;
        } else {
          // 'any'
          const dobMatch = checkInRange(currentBirth);
          const annivMatch = checkInRange(currentAnniv);
          if (!dobMatch && !annivMatch) return false;
        }
      }

      return true;
    });
  }, [leads, search, filterState, draftDates]);

  // -------------------------------------------------------------
  // Date Picker Openers
  // -------------------------------------------------------------
  const openBirthDatePicker = useCallback((lead: CustomerLead) => {
    const currentVal = draftDates[lead.id]?.birth_date !== undefined
      ? draftDates[lead.id].birth_date
      : (lead.birth_date || lead.birthday || '').split('T')[0];

    setDatePickerConfig({
      visible: true,
      title: `Set Birth Date (DOB) - ${lead.name}`,
      initialDate: currentVal || undefined,
      allowFuture: false, // Birth dates cannot be in the future
      allowPast: true,
      onSelectDate: (dateStr: string) => {
        setDraftDates((prev) => ({
          ...prev,
          [lead.id]: {
            birth_date: dateStr,
            anniversary_date: prev[lead.id]?.anniversary_date !== undefined
              ? prev[lead.id].anniversary_date
              : (lead.anniversary_date || '').split('T')[0] || null,
          },
        }));
      },
    });
  }, [draftDates]);

  const openAnniversaryDatePicker = useCallback((lead: CustomerLead) => {
    const currentVal = draftDates[lead.id]?.anniversary_date !== undefined
      ? draftDates[lead.id].anniversary_date
      : (lead.anniversary_date || '').split('T')[0];

    setDatePickerConfig({
      visible: true,
      title: `Set Anniversary Date - ${lead.name}`,
      initialDate: currentVal || undefined,
      allowFuture: true,
      allowPast: true,
      onSelectDate: (dateStr: string) => {
        setDraftDates((prev) => ({
          ...prev,
          [lead.id]: {
            birth_date: prev[lead.id]?.birth_date !== undefined
              ? prev[lead.id].birth_date
              : (lead.birth_date || lead.birthday || '').split('T')[0] || null,
            anniversary_date: dateStr,
          },
        }));
      },
    });
  }, [draftDates]);

  const handleClearBirthDate = useCallback((lead: CustomerLead) => {
    setDraftDates((prev) => ({
      ...prev,
      [lead.id]: {
        birth_date: null,
        anniversary_date: prev[lead.id]?.anniversary_date !== undefined
          ? prev[lead.id].anniversary_date
          : (lead.anniversary_date || '').split('T')[0] || null,
      },
    }));
  }, []);

  const handleClearAnniversaryDate = useCallback((lead: CustomerLead) => {
    setDraftDates((prev) => ({
      ...prev,
      [lead.id]: {
        birth_date: prev[lead.id]?.birth_date !== undefined
          ? prev[lead.id].birth_date
          : (lead.birth_date || lead.birthday || '').split('T')[0] || null,
        anniversary_date: null,
      },
    }));
  }, []);

  // -------------------------------------------------------------
  // Save Dates Handler (PATCH /api/leads/{id}/dates)
  // -------------------------------------------------------------
  const handleSaveDates = useCallback(async (lead: CustomerLead) => {
    const draft = draftDates[lead.id];
    const birthDateToSave = draft?.birth_date !== undefined
      ? draft.birth_date
      : (lead.birth_date || lead.birthday || '').split('T')[0] || null;
    const annivDateToSave = draft?.anniversary_date !== undefined
      ? draft.anniversary_date
      : (lead.anniversary_date || '').split('T')[0] || null;

    try {
      setSavingLeadIds((prev) => ({ ...prev, [lead.id]: true }));

      await leadApi.updateDates(lead.id, {
        birth_date: birthDateToSave,
        anniversary_date: annivDateToSave,
      });

      // Update lead in state
      setLeads((prev) =>
        prev.map((l) =>
          l.id === lead.id
            ? {
                ...l,
                birth_date: birthDateToSave || undefined,
                birthday: birthDateToSave || undefined,
                anniversary_date: annivDateToSave || undefined,
              }
            : l
        )
      );

      // Clear draft for this lead
      setDraftDates((prev) => {
        const next = { ...prev };
        delete next[lead.id];
        return next;
      });

      showSuccessToast(
        'Lead dates updated successfully.',
        `Dates saved for ${lead.name || 'customer'}`
      );
    } catch (err: any) {
      console.log('Error saving dates:', err);
      const errMsg = err?.response?.data?.message || 'Could not update lead dates.';
      showErrorToast('Save Failed', errMsg);
    } finally {
      setSavingLeadIds((prev) => ({ ...prev, [lead.id]: false }));
    }
  }, [draftDates]);

  // Active filters count for filter button badge
  const activeFiltersCount =
    (filterState.filterType !== 'all' ? 1 : 0) +
    (filterState.fromDate ? 1 : 0) +
    (filterState.toDate ? 1 : 0) +
    (filterState.dateField !== 'any' ? 1 : 0);

  const resetAllFilters = () => {
    triggerHaptic('impactLight');
    setSearch('');
    setFilterState({
      filterType: 'all',
      dateField: 'any',
      fromDate: null,
      toDate: null,
    });
  };

  // Render individual lead card
  const renderItem = useCallback(
    ({ item, index }: { item: CustomerLead; index: number }) => {
      const draft = draftDates[item.id];
      const draftBirth = draft?.birth_date !== undefined
        ? draft.birth_date
        : (item.birth_date || item.birthday || '').split('T')[0] || null;
      const draftAnniv = draft?.anniversary_date !== undefined
        ? draft.anniversary_date
        : (item.anniversary_date || '').split('T')[0] || null;

      return (
        <CustomerDateCard
          item={item}
          index={index}
          draftBirthDate={draftBirth}
          draftAnniversaryDate={draftAnniv}
          isSaving={savingLeadIds[item.id]}
          onPickBirthDate={openBirthDatePicker}
          onPickAnniversaryDate={openAnniversaryDatePicker}
          onClearBirthDate={handleClearBirthDate}
          onClearAnniversaryDate={handleClearAnniversaryDate}
          onSaveDates={handleSaveDates}
        />
      );
    },
    [
      draftDates,
      savingLeadIds,
      openBirthDatePicker,
      openAnniversaryDatePicker,
      handleClearBirthDate,
      handleClearAnniversaryDate,
      handleSaveDates,
    ]
  );

  // -------------------------------------------------------------
  // List Header Component (KPI Cards Deck + Search Bar + Chips)
  // Everything scrolls up together with the cards!
  // -------------------------------------------------------------
  const renderListHeader = useMemo(() => {
    return (
      <View style={styles.listHeaderWrapper}>
        {/* KPI METRIC CARDS DECK (4 Cards from Web View) */}
        <View style={styles.kpiDeckContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.kpiDeckScroll}
          >
            {/* Card 1: ALL CUSTOMER LEADS */}
            <KpiSummaryCard
              title="ALL CUSTOMER LEADS"
              count={kpiCounts.total}
              subtext="Total leads in database"
              icon={Users}
              iconColor="#58632A"
              iconBg={isDark ? '#232D14' : '#EEF2E6'}
              isActive={filterState.filterType === 'all'}
              onPress={() => setFilterState((prev) => ({ ...prev, filterType: 'all' }))}
            />

            {/* Card 2: MISSING BIRTH DATE */}
            <KpiSummaryCard
              title="MISSING BIRTH DATE"
              count={kpiCounts.missingDob}
              subtext="DOB not entered yet"
              icon={Cake}
              iconColor="#E11D48"
              iconBg={isDark ? '#3E101D' : '#FFE4E6'}
              isActive={filterState.filterType === 'missing_dob'}
              onPress={() => setFilterState((prev) => ({ ...prev, filterType: 'missing_dob' }))}
            />

            {/* Card 3: MISSING ANNIVERSARY */}
            <KpiSummaryCard
              title="MISSING ANNIVERSARY"
              count={kpiCounts.missingAnniv}
              subtext="Anniversary not entered yet"
              icon={Heart}
              iconColor="#2563EB"
              iconBg={isDark ? '#10223D' : '#DBEAFE'}
              isActive={filterState.filterType === 'missing_anniversary'}
              onPress={() => setFilterState((prev) => ({ ...prev, filterType: 'missing_anniversary' }))}
            />

            {/* Card 4: MISSING BOTH DATES */}
            <KpiSummaryCard
              title="MISSING BOTH DATES"
              count={kpiCounts.missingBoth}
              subtext="Neither Date Set"
              icon={Calendar}
              iconColor="#DC2626"
              iconBg={isDark ? '#3E1212' : '#FEE2E2'}
              isActive={filterState.filterType === 'missing_both'}
              onPress={() => setFilterState((prev) => ({ ...prev, filterType: 'missing_both' }))}
            />
          </ScrollView>
        </View>

        {/* SEARCH BAR & FILTER TRIGGER ROW */}
        <View style={styles.searchFilterRow}>
          <View
            style={[
              styles.searchBarContainer,
              {
                backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                borderColor: isDark ? '#1E293B' : '#E2E8F0',
              },
            ]}
          >
            <Search size={16} color={colors.textSecondary} strokeWidth={2.2} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search name, phone, city..."
              placeholderTextColor={colors.textSecondary}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearch('')}
                style={styles.clearSearchBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={14} color="#64748B" strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Button */}
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('impactLight');
              setFilterModalVisible(true);
            }}
            activeOpacity={0.8}
            style={[
              styles.filterTriggerBtn,
              {
                backgroundColor: activeFiltersCount > 0 ? '#58632A' : isDark ? '#131B2E' : '#FFFFFF',
                borderColor: activeFiltersCount > 0 ? '#58632A' : isDark ? '#1E293B' : '#E2E8F0',
              },
            ]}
          >
            <SlidersHorizontal
              size={16}
              color={activeFiltersCount > 0 ? '#FFFFFF' : colors.textPrimary}
              strokeWidth={2.4}
            />
            {activeFiltersCount > 0 && (
              <View style={styles.activeFilterBadgeCircle}>
                <Text style={styles.activeFilterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Records Count Pill */}
          <View
            style={[
              styles.recordsCountPill,
              {
                backgroundColor: isDark ? '#1E293B' : '#EEF2E6',
                borderColor: isDark ? '#334155' : '#DCE9A2',
              },
            ]}
          >
            <Text style={[styles.recordsCountText, { color: '#58632A' }]}>
              {filteredLeads.length} Records
            </Text>
          </View>
        </View>

        {/* Active Filter Chips Bar (if filters active) */}
        {activeFiltersCount > 0 && (
          <View style={styles.activeFiltersBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeChipsScroll}>
              {filterState.filterType !== 'all' && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterChipText}>
                    {filterState.filterType === 'missing_dob'
                      ? 'Missing DOB'
                      : filterState.filterType === 'missing_anniversary'
                        ? 'Missing Anniversary'
                        : filterState.filterType === 'missing_both'
                          ? 'Missing Both Dates'
                          : 'Has Both Dates'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setFilterState((p) => ({ ...p, filterType: 'all' }))}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <X size={12} color="#58632A" strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              )}

              {filterState.fromDate && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterChipText}>
                    From: {filterState.fromDate}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setFilterState((p) => ({ ...p, fromDate: null }))}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <X size={12} color="#58632A" strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              )}

              {filterState.toDate && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterChipText}>
                    To: {filterState.toDate}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setFilterState((p) => ({ ...p, toDate: null }))}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <X size={12} color="#58632A" strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity onPress={resetAllFilters} style={styles.clearAllFiltersBtn}>
                <Text style={styles.clearAllFiltersText}>Clear all</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
      </View>
    );
  }, [
    kpiCounts,
    filterState,
    search,
    colors,
    isDark,
    activeFiltersCount,
    filteredLeads.length,
  ]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#0A0F1D' : '#F7F7F5',
        },
      ]}
    >
      {/* ----------------------------------------------------------- */}
      {/* SCROLLABLE LEADS LIST (Everything scrolls up together!)      */}
      {/* ----------------------------------------------------------- */}
      <FlatList
        data={filteredLeads}
        keyExtractor={(item, index) => (item?.id ? item.id.toString() : index.toString())}
        renderItem={renderItem}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#58632A" />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading customer celebration dates...
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View
                style={[
                  styles.emptyIconCircle,
                  { backgroundColor: isDark ? '#1E293B' : '#EEF2E6' },
                ]}
              >
                <Calendar size={32} color="#58632A" strokeWidth={2} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                No Customer Leads Found
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                No records match the active search or date filters.
              </Text>
              {(activeFiltersCount > 0 || search.length > 0) && (
                <TouchableOpacity
                  onPress={resetAllFilters}
                  style={[styles.resetEmptyBtn, { backgroundColor: '#58632A' }]}
                >
                  <RotateCcw size={14} color="#FFFFFF" strokeWidth={2.2} />
                  <Text style={styles.resetEmptyBtnText}>Reset All Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom + 60, 80) },
        ]}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews={true}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.loadMoreFooter}>
              <ActivityIndicator size="small" color="#58632A" />
              <Text style={[styles.loadMoreText, { color: colors.textSecondary }]}>
                Loading more leads...
              </Text>
            </View>
          ) : undefined
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#58632A"
            colors={['#58632A']}
          />
        }
      />

      {/* ----------------------------------------------------------- */}
      {/* FILTER MODAL                                               */}
      {/* ----------------------------------------------------------- */}
      <CustomerDatesFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filters={filterState}
        counts={{
          total: kpiCounts.total,
          missingDob: kpiCounts.missingDob,
          missingAnniv: kpiCounts.missingAnniv,
          missingBoth: kpiCounts.missingBoth,
          hasBoth: kpiCounts.hasBoth,
          filteredCount: filteredLeads.length,
        }}
        onApply={(newFilters) => setFilterState(newFilters)}
        onOpenDatePicker={(field, initialVal, onSelect) => {
          setDatePickerConfig({
            visible: true,
            title: field === 'from' ? 'Select Start Date' : 'Select End Date',
            initialDate: initialVal || undefined,
            allowFuture: true,
            allowPast: true,
            onSelectDate: onSelect,
          });
        }}
      />

      {/* ----------------------------------------------------------- */}
      {/* REUSABLE DATE PICKER MODAL                                  */}
      {/* ----------------------------------------------------------- */}
      <DatePickerModal
        visible={datePickerConfig.visible}
        title={datePickerConfig.title}
        initialDate={datePickerConfig.initialDate}
        allowFuture={datePickerConfig.allowFuture}
        allowPast={datePickerConfig.allowPast}
        onClose={() => setDatePickerConfig((prev) => ({ ...prev, visible: false }))}
        onSelectDate={(dateStr) => {
          datePickerConfig.onSelectDate(dateStr);
          setDatePickerConfig((prev) => ({ ...prev, visible: false }));
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listHeaderWrapper: {
    paddingBottom: 4,
  },
  kpiDeckContainer: {
    paddingVertical: 10,
  },
  kpiDeckScroll: {
    paddingHorizontal: 14,
    gap: 10,
  },
  kpiCard: {
    width: 155,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
    gap: 4,
  },
  kpiCardActive: {
    borderColor: '#58632A',
    backgroundColor: '#FAFBF8',
  },
  kpiCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiCardTitle: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.4,
    maxWidth: 95,
  },
  kpiIconBox: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiCountText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 4,
  },
  kpiSubtextRow: {
    marginTop: 2,
    minHeight: 18,
    justifyContent: 'center',
  },
  kpiSubtext: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  activeFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeFilterPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#58632A',
  },
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 2,
  },
  filterTriggerBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeFilterBadgeCircle: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#EE6800',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  activeFilterBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  recordsCountPill: {
    paddingHorizontal: 9,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
  },
  recordsCountText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  activeFiltersBar: {
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  activeChipsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#EEF2E6',
    borderWidth: 1,
    borderColor: '#DCE9A2',
  },
  activeFilterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#58632A',
  },
  clearAllFiltersBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  clearAllFiltersText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textDecorationLine: 'underline',
  },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 4,
    flexGrow: 1,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    gap: 8,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  resetEmptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  resetEmptyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadMoreFooter: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  loadMoreText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
