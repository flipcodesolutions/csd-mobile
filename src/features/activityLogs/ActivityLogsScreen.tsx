import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Clock,
  Filter,
  RotateCcw,
  Search,
  Trash2,
  X,
  ShieldAlert,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../core/theme/colors';
import { useTheme } from '../../core/theme/ThemeContext';
import { triggerHaptic } from '../../core/utils/haptics';
import { showErrorToast, showSuccessToast } from '../../core/utils/toast';
import { activityLogService } from './activityLogService';
import { ActivityLog, ActivityLogFilterOptions } from './types';
import { ActivityLogCard } from './components/ActivityLogCard';
import { ActivityLogFilterModal } from './components/ActivityLogFilterModal';
import { PurgeLogsModal } from './components/PurgeLogsModal';

interface ActivityLogsScreenProps {
  onOpenDrawer?: () => void;
}

export const ActivityLogsScreen: React.FC<ActivityLogsScreenProps> = () => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  // Data states
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // Pagination states
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);

  // Filter & Search states
  const [search, setSearch] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string | number>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Dropdown options
  const [filterOptions, setFilterOptions] = useState<ActivityLogFilterOptions>({
    modules: [],
    actions: [],
    users: [],
  });

  // Modals
  const [filterModalVisible, setFilterModalVisible] = useState<boolean>(false);
  const [purgeModalVisible, setPurgeModalVisible] = useState<boolean>(false);
  const [isPurging, setIsPurging] = useState<boolean>(false);

  // Count active filters (excluding default "all" and empty dates)
  const activeFiltersCount =
    (selectedUser !== 'all' ? 1 : 0) +
    (selectedModule !== 'all' ? 1 : 0) +
    (selectedAction !== 'all' ? 1 : 0) +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0);

  // Fetch filter options on mount
  useEffect(() => {
    activityLogService.getFilterOptions().then(res => {
      if (res && res.status && res.data) {
        setFilterOptions(res.data);
      }
    });
  }, []);

  // Fetch Activity Logs
  const fetchLogs = useCallback(
    async (
      pageNum: number = 1,
      isPull: boolean = false,
      customSearch?: string,
    ) => {
      if (isPull) {
        setIsRefreshing(true);
      } else if (pageNum === 1) {
        setIsLoading(true);
      }

      const q = customSearch !== undefined ? customSearch : search;

      try {
        const res = await activityLogService.getLogs({
          page: pageNum,
          per_page: 15,
          search: q,
          user_id: selectedUser,
          module: selectedModule,
          action: selectedAction,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        });

        if (res && res.status) {
          const list = res.data || [];
          if (pageNum === 1) {
            setLogs(list);
          } else {
            setLogs(prev => {
              const existingIds = new Set(prev.map(item => item.id));
              const newItems = list.filter(item => !existingIds.has(item.id));
              return [...prev, ...newItems];
            });
          }

          setPage(pageNum);
          if (res.pagination) {
            setTotalRecords(Number(res.pagination.total) || list.length);
            setTotalPages(Number(res.pagination.last_page) || 1);
            setHasMore(
              (Number(res.pagination.current_page) || pageNum) <
                (Number(res.pagination.last_page) || 1),
            );
          } else {
            setTotalRecords(list.length);
            setHasMore(list.length >= 15);
          }
        }
      } catch (err) {
        console.warn('Error fetching activity logs:', err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [search, selectedUser, selectedModule, selectedAction, startDate, endDate],
  );

  // Initial load & when filters change
  useEffect(() => {
    fetchLogs(1, false);
  }, [selectedUser, selectedModule, selectedAction, startDate, endDate]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchLogs(1, false, search);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Pull to refresh
  const handleRefresh = () => {
    triggerHaptic('impactLight');
    fetchLogs(1, true);
  };

  // Load more pagination
  const handleLoadMore = () => {
    if (!isLoading && !isLoadingMore && hasMore && page < totalPages) {
      setIsLoadingMore(true);
      fetchLogs(page + 1, false);
    }
  };

  // Purge Old Logs Action
  const handleConfirmPurge = async () => {
    try {
      setIsPurging(true);
      const res = await activityLogService.cleanOldLogs(2);
      showSuccessToast(
        'Logs Cleaned',
        res.message || 'Successfully purged activity logs older than 2 months.',
      );
      setPurgeModalVisible(false);
      fetchLogs(1, false);
    } catch (err: any) {
      console.warn('Purge logs error:', err);
      showErrorToast(
        'Purge Failed',
        err?.response?.data?.message || 'Unable to clean old activity logs.',
      );
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: isDark ? '#080D1A' : '#F7F7F5' },
      ]}
    >
      <FlatList
        ref={flatListRef}
        data={logs}
        keyExtractor={item => `log-${item.id}`}
        renderItem={({ item, index }) => (
          <ActivityLogCard item={item} index={index} />
        )}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom + 90, 110),
        }}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            {/* 1. Header Bar: Title + Subtitle + Action Buttons (Delete 2 Month Old, Refresh) */}
            <View style={styles.topControlRow}>
              <View style={styles.titleCol}></View>
            </View>

            {/* 2. Search & Unified Filter Row */}
            <View style={styles.searchFilterRow}>
              {/* Search Bar */}
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
                  color={isDark ? '#94A3B8' : '#64748B'}
                  strokeWidth={2}
                />
                <TextInput
                  style={[
                    styles.searchInput,
                    { color: isDark ? '#F8FAFC' : '#0F172A' },
                  ]}
                  placeholder="Search detail, IP, user name..."
                  placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                  value={search}
                  onChangeText={setSearch}
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <X size={14} color={isDark ? '#94A3B8' : '#64748B'} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Filter Button */}
              <TouchableOpacity
                style={[
                  styles.filterBtn,
                  activeFiltersCount > 0 && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                  activeFiltersCount === 0 && {
                    backgroundColor: isDark ? '#101726' : '#FFFFFF',
                    borderColor: isDark ? '#1E293B' : '#CBD5E1',
                  },
                ]}
                onPress={() => {
                  triggerHaptic('impactLight');
                  setFilterModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Filter
                  size={14}
                  color={
                    activeFiltersCount > 0
                      ? '#FFFFFF'
                      : isDark
                      ? '#94A3B8'
                      : '#475569'
                  }
                  strokeWidth={2.2}
                />
                <Text
                  style={[
                    styles.filterBtnText,
                    {
                      color:
                        activeFiltersCount > 0
                          ? '#FFFFFF'
                          : isDark
                          ? '#94A3B8'
                          : '#475569',
                    },
                  ]}
                >
                  Filters
                  {activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 3. Record Count Bar */}
            <View style={styles.countRow}>
              <View
                style={[
                  styles.countPill,
                  {
                    backgroundColor: isDark
                      ? 'rgba(88, 99, 42, 0.18)'
                      : '#EFF3DF',
                    borderColor: isDark ? 'rgba(88, 99, 42, 0.35)' : '#DCE9A2',
                  },
                ]}
              >
                <Text style={styles.countPillText}>
                  Activity Records: {totalRecords} Records
                </Text>
              </View>

              {/* Action Buttons: Delete 2 Month Old + Refresh */}
              <View style={styles.actionCluster}>
                <TouchableOpacity
                  style={[
                    styles.purgeBtn,
                    {
                      backgroundColor: isDark
                        ? 'rgba(220, 38, 38, 0.12)'
                        : '#FEF2F2',
                      borderColor: isDark
                        ? 'rgba(220, 38, 38, 0.35)'
                        : '#FECACA',
                    },
                  ]}
                  onPress={() => {
                    triggerHaptic('notificationWarning');
                    setPurgeModalVisible(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Trash2 size={13} color="#DC2626" />
                  <Text style={styles.purgeBtnText}>Delete 2 Month Old</Text>
                </TouchableOpacity>

                {/* <TouchableOpacity
                  style={[
                    styles.refreshBtn,
                    {
                      backgroundColor: isDark ? '#101726' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#CBD5E1',
                    },
                  ]}
                  onPress={handleRefresh}
                  activeOpacity={0.7}
                >
                  <RotateCcw size={13} color={colors.primary} />
                </TouchableOpacity> */}
              </View>

              {activeFiltersCount > 0 && (
                <TouchableOpacity
                  style={styles.clearFiltersBtn}
                  onPress={() => {
                    triggerHaptic('impactLight');
                    setSelectedUser('all');
                    setSelectedModule('all');
                    setSelectedAction('all');
                    setStartDate('');
                    setEndDate('');
                  }}
                >
                  <Text style={styles.clearFiltersText}>Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View
              style={[
                styles.emptyBox,
                {
                  backgroundColor: isDark ? '#101726' : '#FFFFFF',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
            >
              <ShieldAlert size={36} color={colors.primary} />
              <Text
                style={[
                  styles.emptyTitle,
                  { color: isDark ? '#F8FAFC' : '#0F172A' },
                ]}
              >
                No activity logs found
              </Text>
              <Text
                style={[
                  styles.emptySubtitle,
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
              >
                {search || activeFiltersCount > 0
                  ? 'Try clearing your search query or adjusting your filters.'
                  : 'No system activities have been logged yet.'}
              </Text>
            </View>
          ) : (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text
                style={[
                  styles.loadingText,
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
              >
                Loading audit trail...
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          logs.length > 0 ? (
            <View style={styles.footerCountBox}>
              <Text
                style={[
                  styles.footerCountText,
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
              >
                Showing 1 - {logs.length} of {totalRecords} records
              </Text>
              {isLoadingMore && (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={{ marginTop: 8 }}
                />
              )}
            </View>
          ) : undefined
        }
      />

      {/* Filter Modal */}
      <ActivityLogFilterModal
        visible={filterModalVisible}
        filterOptions={filterOptions}
        selectedUser={selectedUser}
        selectedModule={selectedModule}
        selectedAction={selectedAction}
        startDate={startDate}
        endDate={endDate}
        onClose={() => setFilterModalVisible(false)}
        onApply={f => {
          setSelectedUser(f.user_id);
          setSelectedModule(f.module);
          setSelectedAction(f.action);
          setStartDate(f.start_date);
          setEndDate(f.end_date);
        }}
        onReset={() => {
          setSelectedUser('all');
          setSelectedModule('all');
          setSelectedAction('all');
          setStartDate('');
          setEndDate('');
        }}
      />

      {/* Purge Old Logs Modal */}
      <PurgeLogsModal
        visible={purgeModalVisible}
        isPurging={isPurging}
        onClose={() => setPurgeModalVisible(false)}
        onConfirm={handleConfirmPurge}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    gap: 10,
  },
  topControlRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  titleCol: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  screenSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 15,
  },
  actionCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  purgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    height: 34,
    borderRadius: 7,
    borderWidth: 1,
  },
  purgeBtnText: {
    color: '#DC2626',
    fontSize: 11.5,
    fontWeight: '700',
  },
  refreshBtn: {
    width: 34,
    height: 34,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBox: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    paddingVertical: 0,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: 4,
  },
  countPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  countPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.primary,
  },
  clearFiltersBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearFiltersText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#DC2626',
  },
  emptyBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginTop: 24,
    marginHorizontal: 16,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footerCountBox: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  footerCountText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
});
