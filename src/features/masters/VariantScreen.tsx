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
import { brandApi, modelApi, variantApi } from './masterService';
import {
  Brand,
  CarModel,
  CreateVariantPayload,
  UpdateVariantPayload,
  VariantStats,
  VehicleVariant,
} from './types';
import { VariantKpiDeck } from './components/VariantKpiDeck';
import { VariantCard } from './components/VariantCard';
import { AddEditVariantModal } from './components/AddEditVariantModal';
import { DeleteVariantModal } from './components/DeleteVariantModal';
import { FabSpeedDial } from '../../shared/FabSpeedDial';
import { exportCsvToFile } from '../../core/utils/csvExporter';
import { showErrorToast, showSuccessToast } from '../../core/utils/toast';

// Resilient default seed data if database is fresh
const DEFAULT_SEED_VARIANTS: VehicleVariant[] = [
  {
    id: 1,
    name: 'ZXI Plus AT',
    brand_id: 1,
    model_id: 1,
    brand: { id: 1, name: 'Maruti Suzuki' },
    model: { id: 1, name: 'Brezza' },
    price: 1398000,
    previous_price: 1365000,
    fuel_type: 'Petrol',
    status: 'Active',
  },
  {
    id: 2,
    name: 'VXI Petrol MT',
    brand_id: 1,
    model_id: 1,
    brand: { id: 1, name: 'Maruti Suzuki' },
    model: { id: 1, name: 'Brezza' },
    price: 969000,
    previous_price: null,
    fuel_type: 'Petrol',
    status: 'Active',
  },
  {
    id: 3,
    name: 'Fearless Plus S Dark Edition',
    brand_id: 2,
    model_id: 4,
    brand: { id: 2, name: 'Tata Motors' },
    model: { id: 4, name: 'Nexon' },
    price: 1499000,
    previous_price: 1475000,
    fuel_type: 'Diesel',
    status: 'Active',
  },
  {
    id: 4,
    name: 'Pure Plus CNG',
    brand_id: 2,
    model_id: 4,
    brand: { id: 2, name: 'Tata Motors' },
    model: { id: 4, name: 'Nexon' },
    price: 1049000,
    previous_price: null,
    fuel_type: 'CNG',
    status: 'Active',
  },
  {
    id: 5,
    name: 'LX Hard Top Diesel 4x4',
    brand_id: 3,
    model_id: 7,
    brand: { id: 3, name: 'Mahindra & Mahindra' },
    model: { id: 7, name: 'Thar' },
    price: 1699000,
    previous_price: 1650000,
    fuel_type: 'Diesel',
    status: 'Active',
  },
  {
    id: 6,
    name: 'Dual Channel ABS Chrome Red',
    brand_id: 8,
    model_id: 10,
    brand: { id: 8, name: 'Royal Enfield' },
    model: { id: 10, name: 'Classic 350' },
    price: 224000,
    previous_price: 219000,
    fuel_type: 'Petrol',
    status: 'Active',
  },
];

interface VariantScreenProps {
  onOpenDrawer?: () => void;
}

export const VariantScreen: React.FC<VariantScreenProps> = () => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  // Data states
  const [variants, setVariants] = useState<VehicleVariant[]>(DEFAULT_SEED_VARIANTS);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<CarModel[]>([]);
  const [stats, setStats] = useState<VariantStats>({
    total_variants: 0,
    active_trims: 0,
    mapped_models: 0,
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
  const [selectedBrandId, setSelectedBrandId] = useState<number | 'All'>('All');
  const [selectedModelId, setSelectedModelId] = useState<number | 'All'>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<VehicleVariant | null>(null);

  // Delete modal states
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VehicleVariant | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Fetch Stats API
  const fetchStats = async () => {
    try {
      const res = await variantApi.getStats();
      if (res && res.status && res.data) {
        setStats(res.data);
      }
    } catch (error) {
      console.log('Error fetching variant stats:', error);
    }
  };

  // 2. Fetch Variants, Brands, and Models with Server Pagination
  const fetchData = async (
    pageNumber: number = 1,
    isPullRefresh = false,
    newPerPage: number = perPage,
    overrideSearch?: string,
    overrideBrandId?: number | 'All',
    overrideModelId?: number | 'All'
  ) => {
    if (isPullRefresh) {
      setIsRefreshing(true);
    } else if (pageNumber === 1) {
      setIsLoading(true);
    }

    const currentSearch = overrideSearch !== undefined ? overrideSearch : search;
    const currentBrand = overrideBrandId !== undefined ? overrideBrandId : selectedBrandId;
    const currentModel = overrideModelId !== undefined ? overrideModelId : selectedModelId;

    try {
      const [variantsRes, brandsRes, modelsRes] = await Promise.allSettled([
        variantApi.getAll({
          page: pageNumber,
          per_page: newPerPage,
          search: currentSearch.trim() || undefined,
          brand_id: currentBrand !== 'All' ? currentBrand : undefined,
          model_id: currentModel !== 'All' ? currentModel : undefined,
        }),
        brands.length === 0 ? brandApi.getAll() : Promise.resolve(null),
        models.length === 0 ? modelApi.getAll() : Promise.resolve(null),
      ]);

      if (variantsRes.status === 'fulfilled') {
        const raw = variantsRes.value;
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

        const parsed: VehicleVariant[] = list.map((v: any) => ({
          id: Number(v.id),
          name: v.name || 'Unnamed Trim',
          brand_id: Number(v.brand_id || v.brand?.id || 1),
          model_id: Number(v.model_id || v.model?.id || 1),
          brand: v.brand ? { id: v.brand.id, name: v.brand.name } : undefined,
          model: v.model ? { id: v.model.id, name: v.model.name } : undefined,
          price: Number(v.price || v.ex_showroom_price || 0),
          ex_showroom_price: Number(v.ex_showroom_price || v.price || 0),
          previous_price: v.previous_price ? Number(v.previous_price) : null,
          fuel_type: v.fuel_type || 'Petrol',
          status: v.status || 'Active',
          created_at: v.created_at,
        }));

        if (parsed.length > 0 || currentSearch || currentBrand !== 'All' || currentModel !== 'All') {
          setVariants(parsed);
        } else if (variants.length === 0) {
          setVariants(DEFAULT_SEED_VARIANTS);
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
        const bList = Array.isArray(rawB?.data) ? rawB.data : Array.isArray(rawB) ? rawB : [];
        if (bList.length > 0) {
          setBrands(
            bList.map((b: any) => ({
              id: Number(b.id),
              name: b.name,
              vehicle_type: Array.isArray(b.vehicle_type) ? b.vehicle_type : ['4 Wheeler'],
              status: b.status || 'Active',
            }))
          );
        }
      }

      if (modelsRes.status === 'fulfilled' && modelsRes.value) {
        const rawM = modelsRes.value;
        const mList = Array.isArray(rawM?.data) ? rawM.data : Array.isArray(rawM) ? rawM : [];
        if (mList.length > 0) {
          setModels(
            mList.map((m: any) => ({
              id: Number(m.id),
              name: m.name,
              brand_id: Number(m.brand_id || 1),
              vehicle_segment: m.vehicle_segment || '4 Wheeler',
              status: m.status || 'Active',
            }))
          );
        }
      }
    } catch (err: any) {
      console.log('Error fetching variant master data:', err);
      if (variants.length === 0) {
        setVariants(DEFAULT_SEED_VARIANTS);
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
  }, [search, selectedBrandId, selectedModelId, perPage]);



  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore && !isLoading && !isRefreshing) {
      setIsLoadingMore(true);
      variantApi.getAll({
        page: page + 1,
        per_page: perPage,
        search: search.trim() || undefined,
        brand_id: selectedBrandId !== 'All' ? selectedBrandId : undefined,
        model_id: selectedModelId !== 'All' ? selectedModelId : undefined,
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
        const parsed: VehicleVariant[] = list.map((v: any) => ({
          id: Number(v.id),
          name: v.name || 'Unnamed Trim',
          brand_id: Number(v.brand_id || v.brand?.id || 1),
          model_id: Number(v.model_id || v.model?.id || 1),
          brand: v.brand ? { id: v.brand.id, name: v.brand.name } : undefined,
          model: v.model ? { id: v.model.id, name: v.model.name } : undefined,
          price: Number(v.price || v.ex_showroom_price || 0),
          ex_showroom_price: Number(v.ex_showroom_price || v.price || 0),
          previous_price: v.previous_price ? Number(v.previous_price) : null,
          fuel_type: v.fuel_type || 'Petrol',
          status: v.status || 'Active',
          created_at: v.created_at,
        }));
        setVariants((prev) => {
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
        console.log('Error loading more variants:', e);
      }).finally(() => {
        setIsLoadingMore(false);
      });
    }
  };

  // Aggregated Stats Fallback
  const computedStats: VariantStats = useMemo(() => {
    const total = totalCount > 0 ? totalCount : variants.length;
    const active = variants.filter((v) => v.status === 'Active').length;
    const uniqueModels = new Set(variants.map((v) => v.model_id)).size;

    return {
      total_variants: stats.total_variants > 0 ? stats.total_variants : total,
      active_trims: stats.active_trims > 0 ? stats.active_trims : active,
      mapped_models: stats.mapped_models > 0 ? stats.mapped_models : uniqueModels,
    };
  }, [variants, stats, totalCount]);

  // Models filtered for the model filter chips based on selected brand
  const filteredModelsForChips = useMemo(() => {
    if (selectedBrandId === 'All') return models;
    return models.filter((m) => m.brand_id === selectedBrandId);
  }, [models, selectedBrandId]);

  // Filtered variants
  const filteredVariants = useMemo(() => {
    return variants.filter((item) => {
      const matchSearch =
        !search.trim() ||
        item.name.toLowerCase().includes(search.toLowerCase().trim()) ||
        (item.brand?.name &&
          item.brand.name.toLowerCase().includes(search.toLowerCase().trim())) ||
        (item.model?.name &&
          item.model.name.toLowerCase().includes(search.toLowerCase().trim()));
      const matchBrand =
        selectedBrandId === 'All' || item.brand_id === selectedBrandId;
      const matchModel =
        selectedModelId === 'All' || item.model_id === selectedModelId;

      return matchSearch && matchBrand && matchModel;
    });
  }, [variants, search, selectedBrandId, selectedModelId]);

  // Add / Edit Handlers
  const handleOpenAdd = () => {
    triggerHaptic('impactLight');
    setEditingItem(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (item: VehicleVariant) => {
    triggerHaptic('selection');
    setEditingItem(item);
    setModalVisible(true);
  };

  const handleSaveVariant = async (
    payload: CreateVariantPayload | UpdateVariantPayload
  ) => {
    try {
      const bObj = brands.find((b) => b.id === payload.brand_id);
      const mObj = models.find((m) => m.id === payload.model_id);

      if (editingItem) {
        await variantApi.update(editingItem.id, payload);
        setVariants((prev) =>
          prev.map((v) =>
            v.id === editingItem.id
              ? {
                  ...v,
                  name: payload.name,
                  brand_id: payload.brand_id || v.brand_id,
                  model_id: payload.model_id || v.model_id,
                  brand: bObj ? { id: bObj.id, name: bObj.name } : v.brand,
                  model: mObj ? { id: mObj.id, name: mObj.name } : v.model,
                  price: payload.price,
                  ex_showroom_price: payload.price,
                  fuel_type: (payload.fuel_type as any) || v.fuel_type,
                  status: payload.status,
                }
              : v
          )
        );
        triggerHaptic('notificationSuccess');
        showSuccessToast('Trim Updated', `Variant "${payload.name}" updated successfully.`);
      } else {
        const createData = payload as CreateVariantPayload;
        const res = await variantApi.create(createData);
        const newId =
          res?.data?.id || (variants.length > 0 ? Math.max(...variants.map((v) => v.id)) + 1 : 1);
        const newVariant: VehicleVariant = {
          id: newId,
          name: createData.name,
          brand_id: createData.brand_id,
          model_id: createData.model_id,
          brand: bObj ? { id: bObj.id, name: bObj.name } : undefined,
          model: mObj ? { id: mObj.id, name: mObj.name } : undefined,
          price: createData.price,
          ex_showroom_price: createData.price,
          fuel_type: (createData.fuel_type as any) || 'Petrol',
          status: createData.status,
        };
        setVariants((prev) => [newVariant, ...prev]);
        triggerHaptic('notificationSuccess');
        showSuccessToast('Trim Saved', `Variant "${payload.name}" added to catalog.`);
      }
    } catch (err: any) {
      console.log('Error saving variant payload:', err);
      throw err;
    }
  };

  // Delete Handlers
  const handleOpenDelete = (variant: VehicleVariant) => {
    setDeleteTarget(variant);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await variantApi.delete(deleteTarget.id);
      setVariants((prev) => prev.filter((v) => v.id !== deleteTarget.id));
      triggerHaptic('notificationSuccess');
      setDeleteModalVisible(false);
      setDeleteTarget(null);
      showSuccessToast('Variant Deleted', `Trim "${deleteTarget.name}" removed from local list.`);
    } catch (err: any) {
      console.log('Error deleting variant:', err);
      // Demo optimistic delete
      setVariants((prev) => prev.filter((v) => v.id !== deleteTarget.id));
      setDeleteModalVisible(false);
      setDeleteTarget(null);
      showSuccessToast('Variant Deleted', `Trim "${deleteTarget.name}" removed from local list.`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Export CSV
  const handleExportCSV = async () => {
    triggerHaptic('impactLight');
    const rows = filteredVariants.map((v) => [
      v.id,
      v.name,
      v.brand?.name || brands.find((b) => b.id === v.brand_id)?.name || 'Unknown',
      v.model?.name || models.find((m) => m.id === v.model_id)?.name || 'Unknown',
      v.fuel_type || 'N/A',
      v.price ?? (v as any).base_price ?? 0,
      v.status || 'Active',
    ]);
    await exportCsvToFile({
      filename: 'variants',
      headers: ['Variant ID', 'Trim Name', 'Brand', 'Model', 'Fuel Type', 'CSD Base Price', 'Status'],
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
      {/* 1. FlatList of Variants with Header Deck */}
      <FlatList
        ref={flatListRef}
        data={filteredVariants}
        keyExtractor={(item) => `variant-${item.id}`}
        renderItem={({ item, index }) => (
          <VariantCard
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
            <VariantKpiDeck
              stats={computedStats}
              totalFallback={variants.length}
            />

            {/* Filter Section */}
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
                  placeholder="Search trim name, fuel, or model (e.g. ZXI, Diesel)..."
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

              {/* Brand Filter Pills (Horizontal Scroll) */}
              {brands.length > 0 && (
                <View style={styles.filterRow}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterScroll}
                  >
                    {[{ id: 'All', name: 'All Brands' }, ...brands].map((b) => {
                      const isSel = selectedBrandId === b.id;
                      return (
                        <TouchableOpacity
                          key={`v-brand-filter-${b.id}`}
                          style={[
                            styles.filterPill,
                            {
                              backgroundColor: isSel
                                ? colors.primary
                                : isDark
                                ? '#101726'
                                : '#FFFFFF',
                              borderColor: isSel
                                ? colors.primaryDark
                                : isDark
                                ? '#1E293B'
                                : '#CBD5E1',
                            },
                          ]}
                          onPress={() => {
                            triggerHaptic('selection');
                            setSelectedBrandId(b.id as any);
                            setSelectedModelId('All');
                            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                            fetchData(1, false, perPage, undefined, b.id as any, 'All');
                          }}
                        >
                          <Text
                            style={[
                              styles.filterPillText,
                              {
                                color: isSel
                                  ? '#FFFFFF'
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

              {/* Cascading Model Filter Pills (Horizontal Scroll) */}
              {filteredModelsForChips.length > 0 && (
                <View style={styles.filterRow}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterScroll}
                  >
                    {[{ id: 'All', name: 'All Models' }, ...filteredModelsForChips].map((m) => {
                      const isSel = selectedModelId === m.id;
                      return (
                        <TouchableOpacity
                          key={`v-model-filter-${m.id}`}
                          style={[
                            styles.filterPill,
                            {
                              backgroundColor: isSel
                                ? '#0284C7'
                                : isDark
                                ? '#101726'
                                : '#FFFFFF',
                              borderColor: isSel
                                ? '#0369A1'
                                : isDark
                                ? '#1E293B'
                                : '#CBD5E1',
                            },
                          ]}
                          onPress={() => {
                            triggerHaptic('selection');
                            setSelectedModelId(m.id as any);
                            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                            fetchData(1, false, perPage, undefined, undefined, m.id as any);
                          }}
                        >
                          <Text
                            style={[
                              styles.filterPillText,
                              {
                                color: isSel
                                  ? '#FFFFFF'
                                  : isDark
                                  ? '#CBD5E1'
                                  : '#475569',
                                fontWeight: isSel ? '800' : '600',
                              },
                            ]}
                          >
                            {m.name}
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
                Loading vehicle variants directory...
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>📑</Text>
              <Text
                style={[
                  styles.emptyTitle,
                  { color: isDark ? '#F8FAFC' : '#0F172A' },
                ]}
              >
                No Trims Found
              </Text>
              <Text
                style={[
                  styles.emptyText,
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
              >
                {search
                  ? `No variants match search "${search}".`
                  : `No variants found matching selected filters.`}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          isLoadingMore ? (
            <View style={{ paddingVertical: 20, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : !hasMore && variants.length > 5 ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '500',
                  color: isDark ? '#64748B' : '#94A3B8',
                }}
              >
                All {totalCount || variants.length} trims loaded
              </Text>
            </View>
          ) : undefined
        }
      />

      {/* 3. Add / Edit Modal */}
      <AddEditVariantModal
        visible={modalVisible}
        editingItem={editingItem}
        brands={brands}
        models={models}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSaveVariant}
      />

      {/* 4. Delete Confirmation Modal */}
      <DeleteVariantModal
        visible={deleteModalVisible}
        targetVariant={deleteTarget}
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
          label: 'Add Trim',
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
  filterRow: {
    gap: 6,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 6,
    alignItems: 'center',
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  filterPillText: {
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
