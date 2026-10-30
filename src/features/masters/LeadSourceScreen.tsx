import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { Search, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../core/theme/ThemeContext';
import { triggerHaptic } from '../../core/utils/haptics';
import { exportCsvToFile } from '../../core/utils/csvExporter';
import { showSuccessToast } from '../../core/utils/toast';
import { FabSpeedDial } from '../../shared';
import { leadSourceApi } from './masterService';
import {
  CreateLeadSourcePayload,
  LeadSource,
  LeadSourceStats,
  UpdateLeadSourcePayload,
} from './types';
import { LeadSourceKpiDeck } from './components/LeadSourceKpiDeck';
import { LeadSourceCard } from './components/LeadSourceCard';
import { AddEditLeadSourceModal } from './components/AddEditLeadSourceModal';
import { DeleteLeadSourceModal } from './components/DeleteLeadSourceModal';

const DEFAULT_SEED_SOURCES: LeadSource[] = [
  { id: 1, title: 'Showroom Walk-in', name: 'Showroom Walk-in', status: 'Active' },
  { id: 2, title: 'Website Inquiry', name: 'Website Inquiry', status: 'Active' },
  { id: 3, title: 'Facebook Ads', name: 'Facebook Ads', status: 'Active' },
  { id: 4, title: 'Instagram Campaign', name: 'Instagram Campaign', status: 'Active' },
  { id: 5, title: 'Defence Reference', name: 'Defence Reference', status: 'Active' },
  { id: 6, title: 'Canteen Telecalling', name: 'Canteen Telecalling', status: 'Active' },
  { id: 7, title: 'Google Search Ads', name: 'Google Search Ads', status: 'Active' },
  { id: 8, title: 'Newspaper Print', name: 'Newspaper Print', status: 'Inactive' },
];

interface LeadSourceScreenProps {
  onOpenDrawer?: () => void;
}

export const LeadSourceScreen: React.FC<LeadSourceScreenProps> = () => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  // Data states
  const [sources, setSources] = useState<LeadSource[]>(DEFAULT_SEED_SOURCES);
  const [stats, setStats] = useState<LeadSourceStats>({
    total_channels: 0,
    active_channels: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Search state
  const [search, setSearch] = useState('');

  // Modals state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<LeadSource | null>(null);

  // Delete modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LeadSource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Fetch Stats API
  const fetchStats = async () => {
    try {
      const res = await leadSourceApi.getStats();
      if (res && res.status && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.log('Error fetching lead source stats:', err);
    }
  };

  // 2. Fetch Lead Sources API
  const fetchSources = async (
    pageNumber = 1,
    isPull = false,
    newPerPage = perPage,
    overrideSearch?: string
  ) => {
    if (isPull) {
      setIsRefreshing(true);
    } else if (pageNumber === 1) {
      setIsLoading(true);
    }

    const currentSearch = overrideSearch !== undefined ? overrideSearch : search;

    try {
      const res = await leadSourceApi.getAll({
        page: pageNumber,
        per_page: newPerPage,
        search: currentSearch.trim() || undefined,
      });

      const raw = res;
      const rawList =
        raw && raw.status && Array.isArray(raw.data)
          ? raw.data
          : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.data?.data)
          ? raw.data.data
          : Array.isArray(raw)
          ? raw
          : [];

      const pagination =
        raw?.pagination ||
        raw?.data?.pagination ||
        (typeof raw?.current_page === 'number' ? raw : null) ||
        (typeof raw?.data?.current_page === 'number' ? raw.data : null);

      const parsed: LeadSource[] = rawList.map((s: any) => ({
        id: Number(s.id),
        title: s.title || s.name || 'Marketing Channel',
        name: s.title || s.name,
        status: s.status || 'Active',
        created_at: s.created_at,
      }));

      if (parsed.length > 0 || currentSearch) {
        setSources(parsed);
      } else if (sources.length === 0) {
        setSources(DEFAULT_SEED_SOURCES);
      }

      setPage(pageNumber);

      if (pagination) {
        const tot = Number(pagination.total) || parsed.length;
        const curP = Number(pagination.current_page) || pageNumber;
        const lastP = Number(pagination.last_page) || Math.max(1, Math.ceil(tot / newPerPage));
        setTotalCount(tot);
        setTotalPages(lastP);
        setHasMore(curP < lastP);
      } else {
        setHasMore(parsed.length >= newPerPage);
        const computedTotal = pageNumber === 1 ? parsed.length : Math.max(parsed.length, totalCount);
        setTotalCount(computedTotal);
        setTotalPages(Math.max(1, Math.ceil(computedTotal / newPerPage)));
      }
    } catch (err: any) {
      console.log('Error fetching lead sources:', err);
      if (sources.length === 0) setSources(DEFAULT_SEED_SOURCES);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchSources(1, false, perPage);
  }, []);

  const onRefresh = useCallback(() => {
    fetchStats();
    fetchSources(1, true, perPage);
  }, [search, perPage]);



  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore && !isLoading && !isRefreshing) {
      setIsLoadingMore(true);
      leadSourceApi.getAll({
        page: page + 1,
        per_page: perPage,
        search: search.trim() || undefined,
      }).then((res) => {
        const raw = res;
        const rawList =
          raw && raw.status && Array.isArray(raw.data)
            ? raw.data
            : Array.isArray(raw?.data)
            ? raw.data
            : Array.isArray(raw?.data?.data)
            ? raw.data.data
            : Array.isArray(raw)
            ? raw
            : [];
        const parsed: LeadSource[] = rawList.map((s: any) => ({
          id: Number(s.id),
          title: s.title || s.name || 'Marketing Channel',
          name: s.title || s.name,
          status: s.status || 'Active',
          created_at: s.created_at,
        }));
        setSources((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const newItems = parsed.filter((item) => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
        setPage((prev) => prev + 1);
        const pagination =
          raw?.pagination ||
          raw?.data?.pagination ||
          (typeof raw?.current_page === 'number' ? raw : null);
        if (pagination) {
          setHasMore((Number(pagination.current_page) || page + 1) < (Number(pagination.last_page) || 1));
        } else {
          setHasMore(parsed.length >= perPage);
        }
      }).catch((err) => {
        console.log('Error loading more lead sources:', err);
      }).finally(() => {
        setIsLoadingMore(false);
      });
    }
  };

  // Fallback Computed Stats
  const computedStats: LeadSourceStats = useMemo(() => {
    const total = sources.length;
    const active = sources.filter((s) => s.status === 'Active').length;
    return {
      total_channels: stats.total_channels > 0 ? stats.total_channels : total,
      active_channels: stats.active_channels > 0 ? stats.active_channels : active,
    };
  }, [sources, stats]);

  // Client-Side Filter
  const filteredSources = useMemo(() => {
    return sources.filter((s) => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      return s.title.toLowerCase().includes(q);
    });
  }, [sources, search]);

  // Add / Edit Handlers
  const handleOpenAdd = () => {
    triggerHaptic('impactLight');
    setEditingItem(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (item: LeadSource) => {
    triggerHaptic('selection');
    setEditingItem(item);
    setModalVisible(true);
  };

  const handleSaveSource = async (
    payload: CreateLeadSourcePayload | UpdateLeadSourcePayload
  ) => {
    try {
      if (editingItem) {
        await leadSourceApi.update(editingItem.id, payload);
        setSources((prev) =>
          prev.map((s) =>
            s.id === editingItem.id
              ? {
                  ...s,
                  title: payload.title,
                  name: payload.title,
                  status: payload.status,
                }
              : s
          )
        );
        triggerHaptic('notificationSuccess');
        showSuccessToast('Channel Updated', `Lead source "${payload.title}" updated.`);
      } else {
        const res = await leadSourceApi.create(payload as CreateLeadSourcePayload);
        const newId =
          res?.data?.id || (sources.length > 0 ? Math.max(...sources.map((s) => s.id)) + 1 : 1);
        const newSource: LeadSource = {
          id: newId,
          title: payload.title,
          name: payload.title,
          status: payload.status,
        };
        setSources((prev) => [newSource, ...prev]);
        triggerHaptic('notificationSuccess');
        showSuccessToast('Channel Saved', `Lead source "${payload.title}" registered.`);
      }
    } catch (err: any) {
      console.log('Error saving lead source:', err);
      throw err;
    }
  };

  // Delete Handlers
  const handleOpenDelete = (item: LeadSource) => {
    setDeleteTarget(item);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await leadSourceApi.delete(deleteTarget.id);
      setSources((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      triggerHaptic('notificationSuccess');
      setDeleteModalVisible(false);
      setDeleteTarget(null);
      showSuccessToast(
        'Channel Deleted',
        `Lead source "${deleteTarget.title}" removed from catalog.`
      );
    } catch (err: any) {
      console.log('Error deleting lead source:', err);
      // Demo optimistic delete
      setSources((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteModalVisible(false);
      setDeleteTarget(null);
      showSuccessToast(
        'Channel Deleted',
        `Lead source "${deleteTarget.title}" removed from catalog.`
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Export CSV Action
  const handleExportCSV = async () => {
    triggerHaptic('selection');
    const rows = filteredSources.map((s) => [
      String(s.id),
      s.title || s.name || '',
      s.status || 'Active',
    ]);
    await exportCsvToFile({
      filename: `lead_sources_${new Date().toISOString().split('T')[0]}`,
      headers: ['ID', 'Channel Name', 'Status'],
      rows,
    });
  };

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: isDark ? '#080D1A' : '#F7F7F5' },
      ]}
    >
      {/* FlatList of Lead Sources */}
      <FlatList
        ref={flatListRef}
        data={filteredSources}
        keyExtractor={(item) => `lead-src-${item.id}`}
        renderItem={({ item, index }) => (
          <LeadSourceCard
            item={item}
            index={index}
            onEdit={handleOpenEdit}
            onDelete={handleOpenDelete}
          />
        )}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
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
            {/* Top KPI Deck */}
            <LeadSourceKpiDeck
              stats={computedStats}
              totalFallback={sources.length}
            />

            {/* Filter Toolbar */}
            <View style={styles.filterSection}>
              {/* Search Box */}
              <View
                style={[
                  styles.searchBox,
                  {
                    backgroundColor: isDark ? '#101726' : '#FFFFFF',
                    borderColor: isDark ? '#1E293B' : '#CBD5E1',
                  },
                ]}
              >
                <Search size={14} color={colors.textSecondary} strokeWidth={2} />
                <TextInput
                  style={[
                    styles.searchInput,
                    { color: isDark ? '#F8FAFC' : '#0F172A' },
                  ]}
                  value={search}
                  onChangeText={setSearch}
                  onSubmitEditing={() => {
                    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                    fetchSources(1, false, perPage, search);
                  }}
                  returnKeyType="search"
                  placeholder="Search marketing channel title..."
                  placeholderTextColor={colors.textMuted}
                />
                {search ? (
                  <TouchableOpacity
                    onPress={() => {
                      setSearch('');
                      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                      fetchSources(1, false, perPage, '');
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={14} color={colors.textSecondary} strokeWidth={2} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Total Count Badge */}
              <View style={styles.countRow}>
                <View
                  style={[
                    styles.countBadge,
                    {
                      backgroundColor: isDark
                        ? 'rgba(88, 99, 42, 0.25)'
                        : '#F5F8EE',
                      borderColor: isDark ? '#3F4912' : '#DCE9A2',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.countBadgeText,
                      { color: isDark ? '#DCE9A2' : colors.primaryDark },
                    ]}
                  >
                    {totalCount || filteredSources.length} Acquisition Channels Active
                  </Text>
                </View>
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text
                style={[
                  styles.emptyText,
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
              >
                Loading marketing channels directory...
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>📡</Text>
              <Text
                style={[
                  styles.emptyTitle,
                  { color: isDark ? '#F8FAFC' : '#0F172A' },
                ]}
              >
                No Channels Found
              </Text>
              <Text
                style={[
                  styles.emptyText,
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
              >
                {search
                  ? `No marketing channels match "${search}".`
                  : 'No lead sources registered in directory.'}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          isLoadingMore ? (
            <View style={{ paddingVertical: 20, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : !hasMore && sources.length > 5 ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '500',
                  color: isDark ? '#64748B' : '#94A3B8',
                }}
              >
                All {totalCount || sources.length} channels loaded
              </Text>
            </View>
          ) : undefined
        }
      />

      {/* 3. Add / Edit Modal */}
      <AddEditLeadSourceModal
        visible={modalVisible}
        editingItem={editingItem}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSaveSource}
      />

      {/* 4. Delete Confirmation Modal */}
      <DeleteLeadSourceModal
        visible={deleteModalVisible}
        targetSource={deleteTarget}
        isDeleting={isDeleting}
        onClose={() => {
          setDeleteModalVisible(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
      />

      {/* Floating Speed Dial */}
      <FabSpeedDial
        primaryAction={{
          label: 'Add Source',
          onPress: handleOpenAdd,
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
  screen: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  screenTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 5,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  filterSection: {
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
  },
  searchBox: {
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 16,
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
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  countBadgeText: {
    fontSize: 11,
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
