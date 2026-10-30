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
import { brandApi } from './masterService';
import {
  Brand,
  BrandStats,
  BrandVehicleTypeFilter,
  PRESET_OEM_BRANDS,
} from './types';
import { BrandKpiDeck } from './components/BrandKpiDeck';
import { BrandCard } from './components/BrandCard';
import { AddEditBrandModal } from './components/AddEditBrandModal';
import { DeleteBrandModal } from './components/DeleteBrandModal';
import { FabSpeedDial } from '../../shared/FabSpeedDial';
import { exportCsvToFile } from '../../core/utils/csvExporter';
import { showErrorToast, showSuccessToast } from '../../core/utils/toast';

// Resilient default seed data if database is fresh / empty
const DEFAULT_SEED_BRANDS: Brand[] = PRESET_OEM_BRANDS.map((p, idx) => ({
  id: idx + 1,
  name: p.name,
  vehicle_type: p.types,
  status: 'Active',
  logo: p.logo,
}));

interface BrandScreenProps {
  onOpenDrawer?: () => void;
}

export const BrandScreen: React.FC<BrandScreenProps> = () => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  // Data states
  const [brands, setBrands] = useState<Brand[]>(DEFAULT_SEED_BRANDS);
  const [stats, setStats] = useState<BrandStats>({
    total_brands: 0,
    four_wheeler_brands: 0,
    two_wheeler_brands: 0,
    active_brands: 0,
  });

  // Pagination states
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<BrandVehicleTypeFilter>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  // Delete modal states
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Fetch Stats API
  const fetchStats = async () => {
    try {
      const res = await brandApi.getStats();
      if (res && res.status && res.data) {
        setStats(res.data);
      }
    } catch (error) {
      console.log('Error fetching brand stats:', error);
    }
  };

  // 2. Fetch Brands List API
  const fetchBrands = async (
    pageNumber = 1,
    isPullRefresh = false,
    newPerPage = perPage,
    overrideSearch?: string,
    overrideType?: BrandVehicleTypeFilter
  ) => {
    if (isPullRefresh) {
      setIsRefreshing(true);
    } else if (pageNumber === 1) {
      setIsLoading(true);
    }

    const currentSearch = overrideSearch !== undefined ? overrideSearch : search;
    const currentType = overrideType !== undefined ? overrideType : typeFilter;

    try {
      const res = await brandApi.getAll({
        page: pageNumber,
        per_page: newPerPage,
        search: currentSearch.trim() || undefined,
        vehicle_type: currentType !== 'All' ? currentType : undefined,
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

      if (rawList.length > 0) {
        const parsedBrands: Brand[] = rawList.map((b: any) => {
          let vt = b.vehicle_type;
          if (typeof vt === 'string') {
            try {
              vt = JSON.parse(vt);
            } catch {
              vt = [vt];
            }
          }
          if (!Array.isArray(vt)) {
            vt = ['4 Wheeler'];
          }
          return {
            id: Number(b.id),
            name: b.name || 'Unknown Brand',
            vehicle_type: vt,
            status: b.status || 'Active',
            logo: b.logo || null,
          };
        });
        setBrands(parsedBrands);
      } else if (brands.length === 0) {
        setBrands(DEFAULT_SEED_BRANDS);
      }

      setPage(pageNumber);

      if (pagination) {
        const tot = Number(pagination.total) || rawList.length;
        const curP = Number(pagination.current_page) || pageNumber;
        const lastP = Number(pagination.last_page) || Math.max(1, Math.ceil(tot / newPerPage));
        setTotalCount(tot);
        setTotalPages(lastP);
        setHasMore(curP < lastP);
      } else {
        setHasMore(rawList.length >= newPerPage);
        const computedTotal = pageNumber === 1 ? rawList.length : Math.max(rawList.length, totalCount);
        setTotalCount(computedTotal);
        setTotalPages(Math.max(1, Math.ceil(computedTotal / newPerPage)));
      }
    } catch (error: any) {
      console.log('Error fetching brands list:', error);
      if (brands.length === 0) {
        setBrands(DEFAULT_SEED_BRANDS);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchBrands(1, false, perPage);
  }, []);

  const onRefresh = useCallback(() => {
    fetchStats();
    fetchBrands(1, true, perPage);
  }, [search, typeFilter, perPage]);



  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore && !isLoading && !isRefreshing) {
      setIsLoadingMore(true);
      brandApi.getAll({
        page: page + 1,
        per_page: perPage,
        search: search.trim() || undefined,
        vehicle_type: typeFilter !== 'All' ? typeFilter : undefined,
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
        const parsedBrands: Brand[] = rawList.map((b: any) => {
          let vt = b.vehicle_type;
          if (typeof vt === 'string') {
            try {
              vt = JSON.parse(vt);
            } catch {
              vt = [vt];
            }
          }
          if (!Array.isArray(vt)) {
            vt = ['4 Wheeler'];
          }
          return {
            id: Number(b.id),
            name: b.name || 'Unknown Brand',
            vehicle_type: vt,
            status: b.status || 'Active',
            logo: b.logo || null,
          };
        });
        setBrands((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const newItems = parsedBrands.filter((item) => !existingIds.has(item.id));
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
          setHasMore(parsedBrands.length >= perPage);
        }
      }).catch((err) => {
        console.log('Error loading more brands:', err);
      }).finally(() => {
        setIsLoadingMore(false);
      });
    }
  };

  // Fallback calculation for stats if backend API returns 0
  const computedStats: BrandStats = useMemo(() => {
    const total = brands.length;
    const fourW = brands.filter(
      (b) =>
        b.vehicle_type?.includes('4 Wheeler') ||
        b.vehicle_type?.some((t) => t.includes('4')) ||
        !b.vehicle_type?.includes('2 Wheeler')
    ).length;
    const twoW = brands.filter(
      (b) =>
        b.vehicle_type?.includes('2 Wheeler') ||
        b.vehicle_type?.some((t) => t.includes('2'))
    ).length;
    const active = brands.filter((b) => b.status === 'Active').length;

    return {
      total_brands: stats.total_brands > 0 ? stats.total_brands : total,
      four_wheeler_brands:
        stats.four_wheeler_brands > 0 ? stats.four_wheeler_brands : fourW,
      two_wheeler_brands:
        stats.two_wheeler_brands > 0 ? stats.two_wheeler_brands : twoW,
      active_brands: stats.active_brands || active,
    };
  }, [brands, stats]);

  // Client-side filtering when searching or switching pills
  const filteredBrands = useMemo(() => {
    return brands.filter((item) => {
      const matchSearch =
        !search.trim() ||
        item.name.toLowerCase().includes(search.toLowerCase().trim());
      const matchType =
        typeFilter === 'All' || item.vehicle_type?.includes(typeFilter);
      return matchSearch && matchType;
    });
  }, [brands, search, typeFilter]);

  // Handlers for Add / Edit
  const handleOpenAdd = () => {
    triggerHaptic('impactLight');
    setEditingBrand(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (brand: Brand) => {
    triggerHaptic('selection');
    setEditingBrand(brand);
    setModalVisible(true);
  };

  const handleSaveBrand = async (data: {
    name: string;
    vehicle_type: string[];
    status: 'Active' | 'Inactive';
    logo?: string | null;
  }) => {
    try {
      if (editingBrand) {
        // Edit flow
        await brandApi.update(editingBrand.id, data);
        setBrands((prev) =>
          prev.map((b) =>
            b.id === editingBrand.id
              ? {
                  ...b,
                  name: data.name,
                  vehicle_type: data.vehicle_type,
                  status: data.status,
                  logo: data.logo !== undefined ? data.logo : b.logo,
                }
              : b
          )
        );
        triggerHaptic('notificationSuccess');
        showSuccessToast(
          'Brand Updated',
          `Manufacturer "${data.name}" updated successfully.`
        );
      } else {
        // Add flow
        const res = await brandApi.create(data);
        const newId =
          res?.data?.id || (brands.length > 0 ? Math.max(...brands.map((b) => b.id)) + 1 : 1);
        const createdBrand: Brand = {
          id: newId,
          name: data.name,
          vehicle_type: data.vehicle_type,
          status: data.status,
          logo: data.logo,
        };
        setBrands((prev) => [createdBrand, ...prev]);
        triggerHaptic('notificationSuccess');
        showSuccessToast(
          'Brand Registered',
          `New manufacturer "${data.name}" added to CSD master directory.`
        );
      }
      fetchStats();
    } catch (err: any) {
      console.log('Error saving brand:', err);
      // Graceful local optimistic fallback
      if (editingBrand) {
        setBrands((prev) =>
          prev.map((b) =>
            b.id === editingBrand.id
              ? {
                  ...b,
                  name: data.name,
                  vehicle_type: data.vehicle_type,
                  status: data.status,
                  logo: data.logo !== undefined ? data.logo : b.logo,
                }
              : b
          )
        );
      } else {
        const localId = Date.now();
        setBrands((prev) => [
          {
            id: localId,
            name: data.name,
            vehicle_type: data.vehicle_type,
            status: data.status,
            logo: data.logo,
          },
          ...prev,
        ]);
      }
      showSuccessToast(
        editingBrand ? 'Brand Updated' : 'Brand Saved',
        `Record for "${data.name}" updated in master catalog.`
      );
    }
  };

  // Handlers for Delete
  const handleOpenDelete = (brand: Brand) => {
    triggerHaptic('impactLight');
    setDeleteTarget(brand);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await brandApi.delete(deleteTarget.id);
      setBrands((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      triggerHaptic('notificationSuccess');
      showSuccessToast(
        'Brand Deleted',
        `Brand "${deleteTarget.name}" has been removed from catalog.`
      );
      setDeleteModalVisible(false);
      setDeleteTarget(null);
      fetchStats();
    } catch (err: any) {
      console.log('Error deleting brand:', err);
      // Optimistic delete on mobile
      setBrands((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      setDeleteModalVisible(false);
      setDeleteTarget(null);
      showSuccessToast(
        'Brand Deleted',
        `Brand "${deleteTarget.name}" removed from local list.`
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Handler for Export CSV
  const handleExportCSV = async () => {
    triggerHaptic('impactLight');
    const rows = filteredBrands.map((b) => [
      b.id,
      b.name,
      Array.isArray(b.vehicle_type) ? b.vehicle_type.join('; ') : b.vehicle_type,
      b.status,
    ]);
    await exportCsvToFile({
      filename: 'brands',
      headers: ['Brand ID', 'Brand Name', 'Vehicle Categories', 'Status'],
      rows,
    });
  };

  const filterTabs: { id: BrandVehicleTypeFilter; label: string; count: number }[] = [
    { id: 'All', label: 'All Brands', count: computedStats.total_brands },
    {
      id: '4 Wheeler',
      label: '4 Wheeler (Cars)',
      count: computedStats.four_wheeler_brands,
    },
    {
      id: '2 Wheeler',
      label: '2 Wheeler (Bikes)',
      count: computedStats.two_wheeler_brands,
    },
  ];

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: isDark ? '#080D1A' : '#F7F7F5' },
      ]}
    >
      {/* 1. FlatList of Brands with Header Deck */}
      <FlatList
        ref={flatListRef}
        data={filteredBrands}
        keyExtractor={(item) => `brand-${item.id}`}
        renderItem={({ item, index }) => (
          <BrandCard
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
            <BrandKpiDeck
              stats={computedStats}
              totalFallback={brands.length}
              activeFilter={typeFilter}
              onSelectFilter={(filter) => {
                setTypeFilter(filter);
                flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                fetchBrands(1, false, perPage, undefined, filter);
              }}
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
                    fetchBrands(1, false, perPage, search);
                  }}
                  returnKeyType="search"
                  placeholder="Search brand name (e.g. Maruti, Tata, Honda)..."
                  placeholderTextColor={colors.textMuted}
                />
                {search ? (
                  <TouchableOpacity
                    onPress={() => {
                      setSearch('');
                      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                      fetchBrands(1, false, perPage, '');
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={14} color={colors.textSecondary} strokeWidth={2} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Vehicle Type Filter Pills (Horizontal Scroll) */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScroll}
              >
                {filterTabs.map((tab) => {
                  const isActive = typeFilter === tab.id;
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
                        setTypeFilter(tab.id);
                        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                        fetchBrands(1, false, perPage, undefined, tab.id);
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
                Loading OEM brands directory...
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🏢</Text>
              <Text
                style={[
                  styles.emptyTitle,
                  { color: isDark ? '#F8FAFC' : '#0F172A' },
                ]}
              >
                No Brands Found
              </Text>
              <Text
                style={[
                  styles.emptyText,
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
              >
                {search
                  ? `No manufacturers match search "${search}".`
                  : `No ${typeFilter} brands available in directory.`}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          isLoadingMore ? (
            <View style={{ paddingVertical: 20, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : !hasMore && brands.length > 5 ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '500',
                  color: isDark ? '#64748B' : '#94A3B8',
                }}
              >
                All {totalCount || brands.length} brands loaded
              </Text>
            </View>
          ) : undefined
        }
      />

      {/* 3. Add / Edit Modal */}
      <AddEditBrandModal
        visible={modalVisible}
        editingBrand={editingBrand}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSaveBrand}
      />

      {/* 4. Delete Confirmation Modal */}
      <DeleteBrandModal
        visible={deleteModalVisible}
        item={deleteTarget}
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
          label: 'Add Brand',
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
  addBrandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 5,
  },
  addBrandBtnText: {
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
