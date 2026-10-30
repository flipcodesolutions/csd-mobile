import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  CheckSquare,
  Download,
  RotateCcw,
  Search,
  Send,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../core/theme/ThemeContext';
import { triggerHaptic } from '../../core/utils/haptics';
import { brandApi, modelApi, priceMasterApi } from './masterService';
import { PriceCard } from './components/PriceCard';
import { BulkPriceBar } from './components/BulkPriceBar';
import { FabSpeedDial } from '../../shared/FabSpeedDial';
import { exportCsvToFile } from '../../core/utils/csvExporter';
import { showErrorToast, showNotification, showSuccessToast } from '../../core/utils/toast';
import { Brand, CarModel, VehicleVariant } from './types';

const DEFAULT_SEED_PRICE_VARIANTS: VehicleVariant[] = [
  {
    id: 101,
    name: 'ZXI Plus AT',
    brand_id: 1,
    model_id: 1,
    brand: { id: 1, name: 'Maruti Suzuki' },
    model: { id: 1, name: 'Brezza' },
    price: 1398000,
    ex_showroom_price: 1398000,
    previous_price: 1365000,
    fuel_type: 'Petrol',
    status: 'Active',
  },
  {
    id: 102,
    name: 'VXI Petrol MT',
    brand_id: 1,
    model_id: 1,
    brand: { id: 1, name: 'Maruti Suzuki' },
    model: { id: 1, name: 'Brezza' },
    price: 969000,
    ex_showroom_price: 969000,
    previous_price: null,
    fuel_type: 'Petrol',
    status: 'Active',
  },
  {
    id: 103,
    name: 'Fearless Plus S Dark Edition',
    brand_id: 2,
    model_id: 4,
    brand: { id: 2, name: 'Tata Motors' },
    model: { id: 4, name: 'Nexon' },
    price: 1499000,
    ex_showroom_price: 1499000,
    previous_price: 1475000,
    fuel_type: 'Diesel',
    status: 'Active',
  },
  {
    id: 104,
    name: 'LX Hard Top Diesel 4x4',
    brand_id: 3,
    model_id: 7,
    brand: { id: 3, name: 'Mahindra & Mahindra' },
    model: { id: 7, name: 'Thar' },
    price: 1699000,
    ex_showroom_price: 1699000,
    previous_price: 1650000,
    fuel_type: 'Diesel',
    status: 'Active',
  },
  {
    id: 105,
    name: 'Dual Channel ABS Chrome Red',
    brand_id: 8,
    model_id: 10,
    brand: { id: 8, name: 'Royal Enfield' },
    model: { id: 10, name: 'Classic 350' },
    price: 224000,
    ex_showroom_price: 224000,
    previous_price: 219000,
    fuel_type: 'Petrol',
    status: 'Active',
  },
];

interface UpdatePriceScreenProps {
  onOpenDrawer?: () => void;
  onNavigateQuotation?: () => void;
}

export const UpdatePriceScreen: React.FC<UpdatePriceScreenProps> = ({
  onNavigateQuotation,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  // Data states
  const [variants, setVariants] = useState<VehicleVariant[]>(DEFAULT_SEED_PRICE_VARIANTS);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<CarModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  // Inline edit & selection state
  const [revisedPrices, setRevisedPrices] = useState<Record<number, string>>({});
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [batchPrice, setBatchPrice] = useState('');
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [savingRowId, setSavingRowId] = useState<number | null>(null);

  // 1. Fetch Variants, Brands & Models with Server Pagination
  const loadData = async (
    pageNumber: number = 1,
    isPull = false,
    newPerPage: number = perPage,
    overrideSearch?: string,
    overrideBrandId?: number | 'All',
    overrideModelId?: number | 'All'
  ) => {
    if (isPull) {
      setIsRefreshing(true);
    } else if (pageNumber === 1) {
      setIsLoading(true);
    }

    const currentSearch = overrideSearch !== undefined ? overrideSearch : search;
    const currentBrand = overrideBrandId !== undefined ? overrideBrandId : selectedBrandId;
    const currentModel = overrideModelId !== undefined ? overrideModelId : selectedModelId;

    try {
      const [vRes, bRes, mRes] = await Promise.allSettled([
        priceMasterApi.getVariants({
          page: pageNumber,
          per_page: newPerPage,
          search: currentSearch.trim() || undefined,
          brand_id: currentBrand !== 'All' ? currentBrand : undefined,
          model_id: currentModel !== 'All' ? currentModel : undefined,
        }),
        brands.length === 0 ? brandApi.getAll() : Promise.resolve(null),
        models.length === 0 ? modelApi.getAll() : Promise.resolve(null),
      ]);

      if (vRes.status === 'fulfilled') {
        const raw = vRes.value;
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

        const parsed = list.map((item: any) => ({
          id: Number(item.id),
          name: item.name || 'Unnamed Trim',
          brand_id: Number(item.brand_id || item.brand?.id || 1),
          model_id: Number(item.model_id || item.model?.id || 1),
          brand: item.brand ? { id: item.brand.id, name: item.brand.name } : undefined,
          model: item.model ? { id: item.model.id, name: item.model.name } : undefined,
          price: Number(item.price || item.ex_showroom_price || 0),
          ex_showroom_price: Number(item.ex_showroom_price || item.price || 0),
          previous_price: item.previous_price ? Number(item.previous_price) : null,
          fuel_type: item.fuel_type || 'Petrol',
          status: item.status || 'Active',
        }));

        if (parsed.length > 0 || currentSearch || currentBrand !== 'All' || currentModel !== 'All') {
          setVariants(parsed);
        } else if (variants.length === 0) {
          setVariants(DEFAULT_SEED_PRICE_VARIANTS);
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

      if (bRes.status === 'fulfilled' && bRes.value) {
        const rawB = bRes.value;
        const bList = Array.isArray(rawB?.data) ? rawB.data : Array.isArray(rawB) ? rawB : [];
        if (bList.length > 0) {
          setBrands(bList);
        }
      }

      if (mRes.status === 'fulfilled' && mRes.value) {
        const rawM = mRes.value;
        const mList = Array.isArray(rawM?.data) ? rawM.data : Array.isArray(rawM) ? rawM : [];
        if (mList.length > 0) {
          setModels(mList);
        }
      }
    } catch (err: any) {
      console.log('Error loading price master data:', err);
      if (variants.length === 0) setVariants(DEFAULT_SEED_PRICE_VARIANTS);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(1, false, perPage);
  }, []);

  const onRefresh = useCallback(() => {
    loadData(1, true, perPage);
  }, [search, selectedBrandId, selectedModelId, perPage]);



  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore && !isLoading && !isRefreshing) {
      setIsLoadingMore(true);
      priceMasterApi.getVariants({
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
        const parsed = list.map((item: any) => ({
          id: Number(item.id),
          name: item.name || 'Unnamed Trim',
          brand_id: Number(item.brand_id || item.brand?.id || 1),
          model_id: Number(item.model_id || item.model?.id || 1),
          brand: item.brand ? { id: item.brand.id, name: item.brand.name } : undefined,
          model: item.model ? { id: item.model.id, name: item.model.name } : undefined,
          price: Number(item.price || item.ex_showroom_price || 0),
          ex_showroom_price: Number(item.ex_showroom_price || item.price || 0),
          previous_price: item.previous_price ? Number(item.previous_price) : null,
          fuel_type: item.fuel_type || 'Petrol',
          status: item.status || 'Active',
        }));
        setVariants((prev) => {
          const ids = new Set(prev.map((item) => item.id));
          const newOnes = parsed.filter((item: any) => !ids.has(item.id));
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
        console.log('Error loading more price variants:', e);
      }).finally(() => {
        setIsLoadingMore(false);
      });
    }
  };

  // Cascading Models for chips
  const filteredModelsForFilter = useMemo(() => {
    if (selectedBrandId === 'All') return models;
    return models.filter((m) => m.brand_id === selectedBrandId);
  }, [models, selectedBrandId]);

  // Filtered variants
  const filteredVariants = useMemo(() => {
    return variants.filter((v) => {
      const matchSearch =
        !search.trim() ||
        v.name.toLowerCase().includes(search.toLowerCase().trim()) ||
        (v.brand?.name &&
          v.brand.name.toLowerCase().includes(search.toLowerCase().trim())) ||
        (v.model?.name &&
          v.model.name.toLowerCase().includes(search.toLowerCase().trim()));
      const matchBrand =
        selectedBrandId === 'All' || v.brand_id === selectedBrandId;
      const matchModel =
        selectedModelId === 'All' || v.model_id === selectedModelId;
      return matchSearch && matchBrand && matchModel;
    });
  }, [variants, search, selectedBrandId, selectedModelId]);

  // Selection handlers
  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    triggerHaptic('selection');
    if (selectedIds.length === filteredVariants.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredVariants.map((v) => v.id));
    }
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
    setBatchPrice('');
  };

  // Inline Price change handler
  const handleChangePrice = (id: number, val: string) => {
    setRevisedPrices((prev) => ({ ...prev, [id]: val }));
  };

  // Single Save Price
  const handleSaveSinglePrice = async (item: VehicleVariant) => {
    const rawVal = revisedPrices[item.id];
    const newPrice = parseFloat(rawVal.replace(/[^0-9.]/g, ''));
    if (isNaN(newPrice) || newPrice <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price amount.');
      return;
    }

    try {
      setSavingRowId(item.id);
      await priceMasterApi.updateSingleVariantPrice(item.id, newPrice);
      setVariants((prev) =>
        prev.map((v) =>
          v.id === item.id
            ? {
                ...v,
                previous_price: v.price,
                price: newPrice,
                ex_showroom_price: newPrice,
              }
            : v
        )
      );
      // Clean up edited state for row
      setRevisedPrices((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      triggerHaptic('notificationSuccess');
      Alert.alert(
        'Price Updated',
        `Ex-showroom rate for "${item.name}" updated to ₹${newPrice.toLocaleString('en-IN')}.`
      );
    } catch (err: any) {
      console.log('Error updating price:', err);
      Alert.alert('Update Failed', err?.message || 'Unable to update price.');
    } finally {
      setSavingRowId(null);
    }
  };

  // Bulk Save
  const handleSaveBulk = async () => {
    const rawBatch = parseFloat(batchPrice.replace(/[^0-9.]/g, ''));
    const itemsToUpdate: { id: number; revised_price: number }[] = [];

    for (const id of selectedIds) {
      const rowVal = parseFloat(
        (revisedPrices[id] || '').replace(/[^0-9.]/g, '')
      );
      const chosenPrice =
        !isNaN(rawBatch) && rawBatch > 0 ? rawBatch : rowVal;
      if (!isNaN(chosenPrice) && chosenPrice > 0) {
        itemsToUpdate.push({ id, revised_price: chosenPrice });
      }
    }

    if (itemsToUpdate.length === 0) {
      Alert.alert('No Price Entered', 'Please enter a valid batch rate or row prices.');
      return;
    }

    try {
      setIsBulkSaving(true);
      await priceMasterApi.bulkUpdatePrices(itemsToUpdate);
      setVariants((prev) =>
        prev.map((v) => {
          const match = itemsToUpdate.find((u) => u.id === v.id);
          if (match) {
            return {
              ...v,
              previous_price: v.price,
              price: match.revised_price,
              ex_showroom_price: match.revised_price,
            };
          }
          return v;
        })
      );
      setSelectedIds([]);
      setBatchPrice('');
      setRevisedPrices({});
      triggerHaptic('notificationSuccess');
      Alert.alert(
        'Bulk Revision Saved',
        `Successfully updated ex-showroom rates for ${itemsToUpdate.length} vehicles.`
      );
    } catch (err: any) {
      console.log('Error bulk updating:', err);
      Alert.alert('Bulk Update Failed', err?.message || 'Unable to apply bulk revision.');
    } finally {
      setIsBulkSaving(false);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    triggerHaptic('impactLight');
    setSearch('');
    setSelectedBrandId('All');
    setSelectedModelId('All');
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
      v.price ?? v.ex_showroom_price ?? 0,
      v.status || 'Active',
    ]);
    await exportCsvToFile({
      filename: 'price_master',
      headers: ['Variant ID', 'Trim Name', 'Brand', 'Model', 'Fuel Type', 'Ex-Showroom Price', 'Status'],
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
      {/* 1. FlatList of Pricing Items */}
      <FlatList
        ref={flatListRef}
        data={filteredVariants}
        keyExtractor={(item) => `price-${item.id}`}
        renderItem={({ item }) => (
          <PriceCard
            item={item}
            isSelected={selectedIds.includes(item.id)}
            revisedPrice={
              revisedPrices[item.id] !== undefined
                ? revisedPrices[item.id]
                : String(item.price || item.ex_showroom_price || '')
            }
            isSaving={savingRowId === item.id}
            onToggleSelect={handleToggleSelect}
            onChangePrice={handleChangePrice}
            onSavePrice={handleSaveSinglePrice}
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
          <View style={styles.filterSection}>
            {/* Search Input */}
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
                  loadData(1, false, perPage, search);
                }}
                returnKeyType="search"
                placeholder="Search variant, model, or brand..."
                placeholderTextColor={colors.textMuted}
              />
              {search ? (
                <TouchableOpacity
                  onPress={() => {
                    setSearch('');
                    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                    loadData(1, false, perPage, '');
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
                        key={`pm-brand-${b.id}`}
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
                          loadData(1, false, perPage, undefined, b.id as any, 'All');
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

            {/* Cascading Model Filter (Horizontal Scroll) */}
            {filteredModelsForFilter.length > 0 && (
              <View style={styles.filterRow}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterScroll}
                >
                  {[{ id: 'All', name: 'All Models' }, ...filteredModelsForFilter].map((m) => {
                    const isSel = selectedModelId === m.id;
                    return (
                      <TouchableOpacity
                        key={`pm-model-${m.id}`}
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
                          loadData(1, false, perPage, undefined, undefined, m.id as any);
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

            {/* Quick Actions & Record Count */}
            <View style={styles.metaRow}>
              <View style={styles.recordsBadge}>
                <Text
                  style={[
                    styles.recordsCount,
                    { color: isDark ? '#38BDF8' : '#0284C7' },
                  ]}
                >
                  {filteredVariants.length} Trims
                </Text>
              </View>

              <View style={styles.metaActions}>
                <TouchableOpacity
                  style={styles.metaBtn}
                  onPress={handleSelectAll}
                >
                  <CheckSquare size={13} color={colors.primary} strokeWidth={2.2} />
                  <Text style={[styles.metaBtnText, { color: colors.primary }]}>
                    {selectedIds.length === filteredVariants.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </Text>
                </TouchableOpacity>

                {(search || selectedBrandId !== 'All' || selectedModelId !== 'All') && (
                  <TouchableOpacity
                    style={styles.metaBtn}
                    onPress={handleResetFilters}
                  >
                    <RotateCcw size={13} color="#EF4444" strokeWidth={2.2} />
                    <Text style={[styles.metaBtnText, { color: '#EF4444' }]}>
                      Reset
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
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
                Loading vehicle rate master...
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🏷️</Text>
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
                No pricing records match selected filters.
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
                All {totalCount || variants.length} pricing records loaded
              </Text>
            </View>
          ) : undefined
        }
      />

      {/* 3. Bulk Action Floating Bar */}
      <BulkPriceBar
        selectedCount={selectedIds.length}
        batchPrice={batchPrice}
        isSubmitting={isBulkSaving}
        onChangeBatchPrice={setBatchPrice}
        onSaveBulk={handleSaveBulk}
        onDeselectAll={handleDeselectAll}
      />

      {/* 4. Floating Action Button Speed Dial (active when not in bulk edit mode) */}
      {selectedIds.length === 0 && (
        <FabSpeedDial
          primaryAction={{
            label: 'Send Quote',
            icon: <Send size={18} color="#FFFFFF" strokeWidth={2.4} />,
            onPress: () => {
              triggerHaptic('impactLight');
              if (onNavigateQuotation) onNavigateQuotation();
              else showNotification('Quotation Desk', 'Navigating to Send Quotation generator.');
            },
          }}
          secondaryAction={{
            label: 'Download CSV',
            onPress: handleExportCSV,
          }}
        />
      )}
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
  quoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 5,
  },
  quoteBtnText: {
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  recordsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
  },
  recordsCount: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  metaActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
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
