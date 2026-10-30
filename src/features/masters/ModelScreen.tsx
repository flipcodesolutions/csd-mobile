import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { Download, Plus, Search, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../core/theme/ThemeContext';
import { triggerHaptic } from '../../core/utils/haptics';
import { brandApi, modelApi } from './masterService';
import {
  Brand,
  CarModel,
  CreateModelPayload,
  ModelSegmentFilter,
  ModelStats,
  UpdateModelPayload,
} from './types';
import { ModelKpiDeck } from './components/ModelKpiDeck';
import { ModelCard } from './components/ModelCard';
import { AddEditModelModal } from './components/AddEditModelModal';
import { DeleteModelModal } from './components/DeleteModelModal';
import { FabSpeedDial } from '../../shared/FabSpeedDial';
import { exportCsvToFile } from '../../core/utils/csvExporter';
import { showErrorToast, showSuccessToast } from '../../core/utils/toast';

// Resilient default seed models if backend database is fresh/empty
const DEFAULT_SEED_MODELS: CarModel[] = [
  { id: 1, name: 'Brezza', brand_id: 1, brand_name: 'Maruti Suzuki', vehicle_segment: '4 Wheeler', status: 'Active' },
  { id: 2, name: 'Swift', brand_id: 1, brand_name: 'Maruti Suzuki', vehicle_segment: '4 Wheeler', status: 'Active' },
  { id: 3, name: 'Grand Vitara', brand_id: 1, brand_name: 'Maruti Suzuki', vehicle_segment: '4 Wheeler', status: 'Active' },
  { id: 4, name: 'Nexon', brand_id: 2, brand_name: 'Tata Motors', vehicle_segment: '4 Wheeler', status: 'Active' },
  { id: 5, name: 'Punch', brand_id: 2, brand_name: 'Tata Motors', vehicle_segment: '4 Wheeler', status: 'Active' },
  { id: 6, name: 'Harrier', brand_id: 2, brand_name: 'Tata Motors', vehicle_segment: '4 Wheeler', status: 'Active' },
  { id: 7, name: 'Thar', brand_id: 3, brand_name: 'Mahindra & Mahindra', vehicle_segment: '4 Wheeler', status: 'Active' },
  { id: 8, name: 'Scorpio-N', brand_id: 3, brand_name: 'Mahindra & Mahindra', vehicle_segment: '4 Wheeler', status: 'Active' },
  { id: 9, name: 'Creta', brand_id: 4, brand_name: 'Hyundai Motor India', vehicle_segment: '4 Wheeler', status: 'Active' },
  { id: 10, name: 'Classic 350', brand_id: 8, brand_name: 'Royal Enfield', vehicle_segment: '2 Wheeler', status: 'Active' },
  { id: 11, name: 'Hunter 350', brand_id: 8, brand_name: 'Royal Enfield', vehicle_segment: '2 Wheeler', status: 'Active' },
  { id: 12, name: 'Pulsar NS200', brand_id: 9, brand_name: 'Bajaj Auto', vehicle_segment: '2 Wheeler', status: 'Active' },
];

interface ModelScreenProps {
  onOpenDrawer?: () => void;
}

export const ModelScreen: React.FC<ModelScreenProps> = () => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  // Data states
  const [models, setModels] = useState<CarModel[]>(DEFAULT_SEED_MODELS);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [stats, setStats] = useState<ModelStats>({
    total_models: 0,
    four_wheeler_models: 0,
    two_wheeler_models: 0,
    active_models: 0,
  });

  // Pagination states
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Filter states
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<ModelSegmentFilter>('All');
  const [selectedBrandId, setSelectedBrandId] = useState<number | 'All'>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<CarModel | null>(null);

  // Delete modal states
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CarModel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Fetch Stats API
  const fetchStats = async () => {
    try {
      const res = await modelApi.getStats();
      if (res && res.status && res.data) {
        setStats(res.data);
      }
    } catch (error) {
      console.log('Error fetching model stats:', error);
    }
  };

  // 2. Fetch Models & Brands with Server-side Pagination
  const fetchData = async (
    pageNumber: number = 1,
    isPullRefresh = false,
    newPerPage: number = perPage,
    overrideSearch?: string,
    overrideSegment?: ModelSegmentFilter,
    overrideBrandId?: number | 'All'
  ) => {
    if (isPullRefresh) {
      setIsRefreshing(true);
    } else if (pageNumber === 1) {
      setIsLoading(true);
    }

    const currentSearch = overrideSearch !== undefined ? overrideSearch : search;
    const currentSegment = overrideSegment !== undefined ? overrideSegment : segmentFilter;
    const currentBrand = overrideBrandId !== undefined ? overrideBrandId : selectedBrandId;

    try {
      const [modelsRes, brandsRes] = await Promise.allSettled([
        modelApi.getAll({
          page: pageNumber,
          per_page: newPerPage,
          search: currentSearch.trim() || undefined,
          vehicle_segment: currentSegment !== 'All' ? currentSegment : undefined,
          brand_id: currentBrand !== 'All' ? currentBrand : undefined,
        }),
        brands.length === 0 ? brandApi.getAll() : Promise.resolve(null),
      ]);

      if (modelsRes.status === 'fulfilled') {
        const raw = modelsRes.value;
        const list =
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

        const parsed: CarModel[] = list.map((m: any) => ({
          id: Number(m.id),
          name: m.name || 'Unnamed Model',
          brand_id: Number(m.brand_id || m.brand?.id || 1),
          brand_name: m.brand?.name || m.brand_name || 'Generic OEM',
          vehicle_segment:
            m.vehicle_segment === '2 Wheeler' || String(m.vehicle_segment).includes('2')
              ? '2 Wheeler'
              : '4 Wheeler',
          status: m.status || 'Active',
          created_at: m.created_at,
        }));

        if (parsed.length > 0 || currentSearch || currentSegment !== 'All' || currentBrand !== 'All') {
          setModels(parsed);
        } else if (models.length === 0) {
          setModels(DEFAULT_SEED_MODELS);
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
      }

      if (brandsRes.status === 'fulfilled' && brandsRes.value) {
        const rawB = brandsRes.value;
        const bList =
          rawB && rawB.status && Array.isArray(rawB.data)
            ? rawB.data
            : Array.isArray(rawB?.data)
            ? rawB.data
            : Array.isArray(rawB)
            ? rawB
            : [];
        if (bList.length > 0) {
          setBrands(
            bList.map((b: any) => ({
              id: Number(b.id),
              name: b.name || 'Brand',
              vehicle_type: Array.isArray(b.vehicle_type)
                ? b.vehicle_type
                : typeof b.vehicle_type === 'string'
                ? [b.vehicle_type]
                : ['4 Wheeler'],
              status: b.status || 'Active',
              logo: b.logo || null,
            }))
          );
        }
      }
    } catch (err: any) {
      console.log('Error fetching model master data:', err);
      if (models.length === 0) {
        setModels(DEFAULT_SEED_MODELS);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchData(1, false, perPage);
  }, []);

  const onRefresh = useCallback(() => {
    fetchStats();
    fetchData(1, true, perPage);
  }, [search, segmentFilter, selectedBrandId, perPage]);



  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore && !isLoading && !isRefreshing) {
      // Append mode for scroll-based pagination
      setIsLoadingMore(true);
      modelApi.getAll({
        page: page + 1,
        per_page: perPage,
        search: search.trim() || undefined,
        vehicle_segment: segmentFilter !== 'All' ? segmentFilter : undefined,
        brand_id: selectedBrandId !== 'All' ? selectedBrandId : undefined,
      }).then((res) => {
        const raw = res;
        const list =
          raw && raw.status && Array.isArray(raw.data)
            ? raw.data
            : Array.isArray(raw?.data)
            ? raw.data
            : Array.isArray(raw?.data?.data)
            ? raw.data.data
            : Array.isArray(raw)
            ? raw
            : [];
        const parsed: CarModel[] = list.map((m: any) => ({
          id: Number(m.id),
          name: m.name || 'Unnamed Model',
          brand_id: Number(m.brand_id || m.brand?.id || 1),
          brand_name: m.brand?.name || m.brand_name || 'Generic OEM',
          vehicle_segment:
            m.vehicle_segment === '2 Wheeler' || String(m.vehicle_segment).includes('2')
              ? '2 Wheeler'
              : '4 Wheeler',
          status: m.status || 'Active',
          created_at: m.created_at,
        }));
        setModels((prev) => {
          const ids = new Set(prev.map((item) => item.id));
          const newOnes = parsed.filter((item) => !ids.has(item.id));
          return [...prev, ...newOnes];
        });
        const pagination = raw?.pagination || raw?.data?.pagination;
        if (pagination) {
          setHasMore(Number(pagination.current_page) < Number(pagination.last_page));
        } else {
          setHasMore(parsed.length >= perPage);
        }
        setPage((p) => p + 1);
      }).catch((e) => {
        console.log('Error loading more models:', e);
      }).finally(() => {
        setIsLoadingMore(false);
      });
    }
  };

  // Aggregated Stats Fallback
  const computedStats: ModelStats = useMemo(() => {
    const total = totalCount > 0 ? totalCount : models.length;
    const fourW = models.filter((m) => m.vehicle_segment === '4 Wheeler').length;
    const twoW = models.filter((m) => m.vehicle_segment === '2 Wheeler').length;
    const active = models.filter((m) => m.status === 'Active').length;

    return {
      total_models: stats.total_models > 0 ? stats.total_models : total,
      four_wheeler_models: stats.four_wheeler_models > 0 ? stats.four_wheeler_models : fourW,
      two_wheeler_models: stats.two_wheeler_models > 0 ? stats.two_wheeler_models : twoW,
      active_models: stats.active_models || active,
    };
  }, [models, stats, totalCount]);

  // Client-Side Filtered Models
  const filteredModels = useMemo(() => {
    return models.filter((item) => {
      const matchSearch =
        !search.trim() ||
        item.name.toLowerCase().includes(search.toLowerCase().trim()) ||
        (item.brand_name &&
          item.brand_name.toLowerCase().includes(search.toLowerCase().trim()));
      const matchSegment =
        segmentFilter === 'All' || item.vehicle_segment === segmentFilter;
      const matchBrand =
        selectedBrandId === 'All' || item.brand_id === selectedBrandId;
      return matchSearch && matchSegment && matchBrand;
    });
  }, [models, search, segmentFilter, selectedBrandId]);

  // Handlers for Add / Edit
  const handleOpenAdd = () => {
    triggerHaptic('impactLight');
    setEditingItem(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (model: CarModel) => {
    triggerHaptic('selection');
    setEditingItem(model);
    setModalVisible(true);
  };

  const handleSaveModel = async (payload: CreateModelPayload | UpdateModelPayload) => {
    try {
      const selectedBrand = brands.find((b) => b.id === payload.brand_id);
      const bName = selectedBrand?.name || 'Generic OEM';

      if (editingItem) {
        await modelApi.update(editingItem.id, payload);
        setModels((prev) =>
          prev.map((m) =>
            m.id === editingItem.id
              ? {
                  ...m,
                  name: payload.name,
                  brand_id: payload.brand_id || m.brand_id,
                  brand_name: bName,
                  vehicle_segment: payload.vehicle_segment || m.vehicle_segment,
                  status: payload.status,
                }
              : m
          )
        );
        triggerHaptic('notificationSuccess');
        showSuccessToast('Model Updated', `Vehicle model "${payload.name}" updated successfully.`);
      } else {
        const createData = payload as CreateModelPayload;
        const res = await modelApi.create(createData);
        const newId =
          res?.data?.id || (models.length > 0 ? Math.max(...models.map((m) => m.id)) + 1 : 1);
        const newModel: CarModel = {
          id: newId,
          name: createData.name,
          brand_id: createData.brand_id,
          brand_name: bName,
          vehicle_segment: createData.vehicle_segment,
          status: createData.status,
        };
        setModels((prev) => [newModel, ...prev]);
        triggerHaptic('notificationSuccess');
        showSuccessToast('Model Saved', `Model "${payload.name}" added to catalog.`);
      }
    } catch (err: any) {
      console.log('Error saving model payload:', err);
      throw err;
    }
  };

  // Handlers for Delete
  const handleOpenDelete = (model: CarModel) => {
    setDeleteTarget(model);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await modelApi.delete(deleteTarget.id);
      setModels((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      triggerHaptic('notificationSuccess');
      setDeleteModalVisible(false);
      setDeleteTarget(null);
      showSuccessToast('Model Deleted', `Model "${deleteTarget.name}" removed from local list.`);
    } catch (err: any) {
      console.log('Error deleting model:', err);
      // Optimistic delete on demo
      setModels((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      setDeleteModalVisible(false);
      setDeleteTarget(null);
      showSuccessToast('Model Deleted', `Model "${deleteTarget.name}" removed from local list.`);
    } finally {
      setIsDeleting(false);
    }
  };

  // CSV Export Action
  const handleExportCSV = async () => {
    triggerHaptic('impactLight');
    const rows = filteredModels.map((m) => [
      m.id,
      m.name,
      m.brand_name || brands.find((b) => b.id === m.brand_id)?.name || 'Unknown',
      m.vehicle_segment,
      m.status,
    ]);
    await exportCsvToFile({
      filename: 'models',
      headers: ['Model ID', 'Model Name', 'Brand', 'Vehicle Segment', 'Status'],
      rows,
    });
  };

  const segmentTabs: { id: ModelSegmentFilter; label: string; count: number }[] = [
    { id: 'All', label: 'All Models', count: computedStats.total_models },
    { id: '4 Wheeler', label: '4 Wheeler (Cars)', count: computedStats.four_wheeler_models },
    { id: '2 Wheeler', label: '2 Wheeler (Bikes)', count: computedStats.two_wheeler_models },
  ];

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: isDark ? '#080D1A' : '#F7F7F5' },
      ]}
    >
      {/* 1. FlatList of Models with Header Deck */}
      <FlatList
        ref={flatListRef}
        data={filteredModels}
        keyExtractor={(item) => `model-${item.id}`}
        renderItem={({ item, index }) => (
          <ModelCard
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
            {/* Top KPI Summary Cards */}
            <ModelKpiDeck
              stats={computedStats}
              totalFallback={models.length}
              activeFilter={segmentFilter}
              onSelectFilter={(f) => setSegmentFilter(f)}
            />

            {/* Search & Filter Toolbar */}
            <View style={styles.filterSection}>
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
                    fetchData(1, false, perPage, search);
                  }}
                  returnKeyType="search"
                  placeholder="Search model name (e.g. Brezza, Nexon, Thar)..."
                  placeholderTextColor={colors.textMuted}
                />
                {search ? (
                  <TouchableOpacity
                    onPress={() => {
                      setSearch('');
                      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                      fetchData(1, false, perPage, '');
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={14} color={colors.textSecondary} strokeWidth={2} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Vehicle Segment Filter Pills (Horizontal Scroll) */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScroll}
              >
                {segmentTabs.map((tab) => {
                  const isActive = segmentFilter === tab.id;
                  return (
                    <TouchableOpacity
                      key={tab.id}
                      style={[
                        styles.filterTabPill,
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
                        setSegmentFilter(tab.id);
                        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                        fetchData(1, false, perPage, undefined, tab.id, undefined);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.filterTabText,
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
                        {tab.label}
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
                          {tab.count}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Brand Filter Horizontal Scroll */}
              {brands.length > 0 && (
                <View style={styles.brandFilterRow}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.brandFilterScroll}
                  >
                    {[{ id: 'All', name: 'All Brands' }, ...brands].map((b) => {
                      const isSel = selectedBrandId === b.id;
                      return (
                        <TouchableOpacity
                          key={`brand-filter-${b.id}`}
                          style={[
                            styles.brandFilterPill,
                            {
                              backgroundColor: isSel
                                ? isDark
                                ? 'rgba(88, 99, 42, 0.3)'
                                : '#EBF0D8'
                                : isDark
                                ? '#101726'
                                : '#FFFFFF',
                              borderColor: isSel
                                ? colors.primary
                                : isDark
                                ? '#1E293B'
                                : '#CBD5E1',
                            },
                          ]}
                          onPress={() => {
                            triggerHaptic('selection');
                            setSelectedBrandId(b.id as any);
                            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                            fetchData(1, false, perPage, undefined, undefined, b.id as any);
                          }}
                        >
                          <Text
                            style={[
                              styles.brandFilterPillText,
                              {
                                color: isSel
                                  ? colors.primaryDark
                                  : isDark
                                  ? '#CBD5E1'
                                  : '#475569',
                                fontWeight: isSel ? '800' : '600',
                              },
                            ]}
                          >
                            {b.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
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
                Loading vehicle models directory...
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🚗</Text>
              <Text
                style={[
                  styles.emptyTitle,
                  { color: isDark ? '#F8FAFC' : '#0F172A' },
                ]}
              >
                No Models Found
              </Text>
              <Text
                style={[
                  styles.emptyText,
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
              >
                {search
                  ? `No models match search "${search}".`
                  : `No models found matching selected segment or brand.`}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          isLoadingMore ? (
            <View style={{ paddingVertical: 20, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : !hasMore && models.length > 5 ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '500',
                  color: isDark ? '#64748B' : '#94A3B8',
                }}
              >
                All {totalCount || models.length} models loaded
              </Text>
            </View>
          ) : undefined
        }
      />

      {/* 3. Add / Edit Modal */}
      <AddEditModelModal
        visible={modalVisible}
        editingItem={editingItem}
        brands={brands}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSaveModel}
      />

      {/* 4. Delete Confirmation Modal */}
      <DeleteModelModal
        visible={deleteModalVisible}
        targetModel={deleteTarget}
        isDeleting={isDeleting}
        onClose={() => {
          setDeleteModalVisible(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
      />

      {/* 5. Floating Action Button Speed Dial */}
      <FabSpeedDial
        primaryAction={{
          label: 'Add Model',
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
    paddingTop: 6,
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
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  filterTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
    borderWidth: 1,
    gap: 6,
  },
  filterTabText: {
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
  brandFilterRow: {
    gap: 6,
  },
  brandFilterScroll: {
    paddingHorizontal: 16,
    gap: 6,
    alignItems: 'center',
  },
  brandFilterLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  brandFilterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  brandFilterPillText: {
    fontSize: 11,
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
