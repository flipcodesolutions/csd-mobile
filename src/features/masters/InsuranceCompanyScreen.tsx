import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Check,
  ChevronDown,
  Plus,
  RotateCcw,
  Search,
  Shield,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../core/theme/colors';
import { useTheme } from '../../core/theme/ThemeContext';
import { triggerHaptic } from '../../core/utils/haptics';
import { showErrorToast, showSuccessToast } from '../../core/utils/toast';
import { insuranceCompanyApi } from './masterService';
import {
  CreateInsuranceCompanyPayload,
  InsuranceCompany,
  InsuranceCompanyStats,
  UpdateInsuranceCompanyPayload,
} from './types';
import { InsuranceCompanyKpiDeck } from './components/InsuranceCompanyKpiDeck';
import { InsuranceCompanyCard } from './components/InsuranceCompanyCard';
import { AddEditInsuranceCompanyModal } from './components/AddEditInsuranceCompanyModal';
import { DeleteInsuranceCompanyModal } from './components/DeleteInsuranceCompanyModal';
import { FabSpeedDial } from '../../shared/FabSpeedDial';
import { exportCsvToFile } from '../../core/utils/csvExporter';

const CACHE_KEY = 'csd_insurance_companies_cache';

interface InsuranceCompanyScreenProps {
  onOpenDrawer?: () => void;
}

export const InsuranceCompanyScreen: React.FC<InsuranceCompanyScreenProps> = () => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  // Data states
  const [companies, setCompanies] = useState<InsuranceCompany[]>([]);
  const [stats, setStats] = useState<InsuranceCompanyStats>({
    total: 0,
    active: 0,
    inactive: 0,
  });

  // Pagination states
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Search & Filter states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal states
  const [addEditModalVisible, setAddEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<InsuranceCompany | null>(null);

  // Delete modal states
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<InsuranceCompany | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Fetch Stats API
  const fetchStats = async () => {
    try {
      const res = await insuranceCompanyApi.getStats();
      if (res && res.status && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch stats:', err);
    }
  };

  // 2. Fetch Companies List API with server pagination & filter
  const fetchCompanies = async (
    pageNumber: number = 1,
    isPull: boolean = false,
    overrideSearch?: string,
    overrideStatus?: 'all' | 'active' | 'inactive'
  ) => {
    if (isPull) {
      setIsRefreshing(true);
    } else if (pageNumber === 1) {
      setIsLoading(true);
    }

    const currentSearch = overrideSearch !== undefined ? overrideSearch : search;
    const currentStatus = overrideStatus !== undefined ? overrideStatus : statusFilter;

    try {
      const res = await insuranceCompanyApi.getAll({
        page: pageNumber,
        per_page: perPage,
        search: currentSearch.trim() || undefined,
        status: currentStatus !== 'all' ? currentStatus : undefined,
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

      const parsed: InsuranceCompany[] = rawList.map((c: any) => ({
        id: Number(c.id),
        name: c.name || c.company_name || 'Insurance Provider',
        code: c.code || undefined,
        contact_person: c.contact_person || undefined,
        phone: c.phone || undefined,
        email: c.email || undefined,
        status:
          c.status === 'Active' ||
          c.status === 'active' ||
          c.status === 1 ||
          c.status === '1'
            ? 'Active'
            : 'Inactive',
        notes: c.notes || undefined,
        created_at: c.created_at,
        updated_at: c.updated_at,
      }));

      if (pageNumber === 1) {
        setCompanies(parsed);
        if (parsed.length === 0) {
          AsyncStorage.removeItem(CACHE_KEY).catch(() => {});
        } else {
          AsyncStorage.setItem(CACHE_KEY, JSON.stringify(parsed)).catch(() => {});
        }
      } else {
        setCompanies((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newItems = parsed.filter((p) => !existingIds.has(p.id));
          return [...prev, ...newItems];
        });
      }

      setPage(pageNumber);

      if (pagination) {
        const tot = Number(pagination.total) ?? parsed.length;
        const curP = Number(pagination.current_page) || pageNumber;
        const lastP = Number(pagination.last_page) || Math.max(1, Math.ceil(tot / perPage));
        setTotalCount(tot);
        setTotalPages(lastP);
        setHasMore(curP < lastP);
      } else {
        setHasMore(parsed.length >= perPage);
        const computedTotal =
          pageNumber === 1 ? parsed.length : Math.max(parsed.length, totalCount);
        setTotalCount(computedTotal);
        setTotalPages(Math.max(1, Math.ceil(computedTotal / perPage)));
      }
    } catch (err) {
      console.warn('Error fetching insurance companies:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchStats();
    fetchCompanies(1, false);
  }, []);

  // Filter & Search Debounced Effect
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchCompanies(1, false, search, statusFilter);
    }, 350);
    return () => clearTimeout(handler);
  }, [search, statusFilter]);

  // Pull to Refresh
  const onRefresh = () => {
    fetchStats();
    fetchCompanies(1, true);
  };

  // Infinite Scroll Load More
  const handleLoadMore = () => {
    if (!isLoading && !isLoadingMore && hasMore && page < totalPages) {
      setIsLoadingMore(true);
      fetchCompanies(page + 1, false);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    triggerHaptic('impactLight');
    setSearch('');
    setStatusFilter('all');
  };

  // Create or Update Submission
  const handleSubmitCompany = async (
    payload: CreateInsuranceCompanyPayload | UpdateInsuranceCompanyPayload,
    isEdit: boolean
  ) => {
    if (isEdit && editingItem) {
      await insuranceCompanyApi.update(editingItem.id, payload as UpdateInsuranceCompanyPayload);
      showSuccessToast('Updated', `Insurance company "${payload.name}" updated successfully.`);
    } else {
      await insuranceCompanyApi.create(payload as CreateInsuranceCompanyPayload);
      showSuccessToast('Created', `Insurance company "${payload.name}" added successfully.`);
    }
    fetchStats();
    fetchCompanies(1, false);
  };

  // Delete Action
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const targetItem = deleteTarget;
    try {
      setIsDeleting(true);
      await insuranceCompanyApi.delete(targetItem.id);

      // Remove from local state immediately
      setCompanies((prev) => {
        const updated = prev.filter((c) => c.id !== targetItem.id);
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(updated)).catch(() => {});
        return updated;
      });

      showSuccessToast('Deleted', `Insurance company "${targetItem.name}" deleted.`);
      setDeleteModalVisible(false);
      setDeleteTarget(null);
      fetchStats();
      fetchCompanies(1, false);
    } catch (err: any) {
      console.error('Delete company error:', err);
      const status = err?.response?.status;
      const serverMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        '';

      setDeleteModalVisible(false);
      setDeleteTarget(null);

      // 1. If 404: Not found on server (already deleted or local mock), remove from UI
      if (status === 404) {
        setCompanies((prev) => {
          const updated = prev.filter((c) => c.id !== targetItem.id);
          AsyncStorage.setItem(CACHE_KEY, JSON.stringify(updated)).catch(() => {});
          return updated;
        });
        showSuccessToast('Removed', `Record "${targetItem.name}" removed from list.`);
        fetchStats();
        return;
      }

      // 2. Foreign Key Constraint: Linked to existing policy/deal
      const isConstraintError =
        status === 500 ||
        status === 422 ||
        (typeof serverMsg === 'string' &&
          (serverMsg.toLowerCase().includes('foreign') ||
            serverMsg.includes('1451') ||
            serverMsg.toLowerCase().includes('constraint') ||
            serverMsg.toLowerCase().includes('associated') ||
            serverMsg.toLowerCase().includes('cannot delete')));

      if (isConstraintError) {
        showErrorToast(
          'Cannot Delete',
          `"${targetItem.name}" kisi Insurance Policy ya Deal se linked hai, isliye delete nahi ho sakta. Status "Inactive" set karein.`
        );
      } else {
        const displayMsg =
          typeof serverMsg === 'string' && serverMsg && !serverMsg.includes('Axios')
            ? serverMsg
            : 'Unable to delete insurance company.';
        showErrorToast('Delete Failed', displayMsg);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Export CSV
  const handleExportCSV = async () => {
    triggerHaptic('impactLight');
    const rows = companies.map((c) => [
      c.id,
      c.name,
      c.code || 'N/A',
      c.contact_person || 'N/A',
      c.phone || 'N/A',
      c.status,
    ]);
    await exportCsvToFile({
      filename: 'insurance_companies',
      headers: ['ID', 'Company Name', 'Code', 'Contact Person', 'Phone', 'Status'],
      rows,
    });
  };

  // Local Aggregated Stats Fallback if server stats are 0
  const computedStats: InsuranceCompanyStats = useMemo(() => {
    if (stats.total > 0) return stats;
    const total = totalCount > 0 ? totalCount : companies.length;
    const active = companies.filter((c) => c.status === 'Active').length;
    const inactive = total - active;
    return { total, active, inactive: Math.max(0, inactive) };
  }, [stats, companies, totalCount]);

  const statusLabel =
    statusFilter === 'all'
      ? 'All Statuses'
      : statusFilter === 'active'
      ? 'Active'
      : 'Inactive';

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: isDark ? '#080D1A' : '#F7F7F5' },
      ]}
    >
      {/* 1. FlatList of Insurance Companies */}
      <FlatList
        ref={flatListRef}
        data={companies}
        keyExtractor={(item) => `ins-company-${item.id}`}
        renderItem={({ item, index }) => (
          <InsuranceCompanyCard
            item={item}
            index={index}
            onEdit={(target) => {
              setEditingItem(target);
              setAddEditModalVisible(true);
            }}
            onDelete={(target) => {
              setDeleteTarget(target);
              setDeleteModalVisible(true);
            }}
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
            {/* Top 3 KPI Stat Cards Matching Screenshot 1 */}
            <InsuranceCompanyKpiDeck
              stats={computedStats}
              totalFallback={companies.length}
              activeFilter={statusFilter}
              onSelectFilter={(f) => setStatusFilter(f)}
            />

            {/* Filter Section Matching Screenshot 1 */}
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
                <Search size={14} color={isDark ? '#94A3B8' : '#64748B'} strokeWidth={2} />
                <TextInput
                  style={[
                    styles.searchInput,
                    { color: isDark ? '#F8FAFC' : '#0F172A' },
                  ]}
                  placeholder="Search by company name..."
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

              {/* Status Filter Dropdown Box Matching Screenshot 1 */}
              <View style={styles.filterControlsRow}>
                <TouchableOpacity
                  style={[
                    styles.dropdownBox,
                    {
                      backgroundColor: isDark ? '#101726' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#CBD5E1',
                    },
                  ]}
                  onPress={() => setShowStatusDropdown(true)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dropdownText,
                      { color: isDark ? '#F8FAFC' : '#0F172A' },
                    ]}
                  >
                    {statusLabel}
                  </Text>
                  <ChevronDown size={14} color={isDark ? '#94A3B8' : '#64748B'} />
                </TouchableOpacity>

                {/* Reset Button Matching Screenshot 1 */}
                <TouchableOpacity
                  style={[
                    styles.resetBtn,
                    {
                      backgroundColor: isDark ? '#101726' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#CBD5E1',
                    },
                  ]}
                  onPress={handleResetFilters}
                  activeOpacity={0.7}
                >
                  <RotateCcw size={13} color={isDark ? '#94A3B8' : '#64748B'} />
                  <Text
                    style={[
                      styles.resetBtnText,
                      { color: isDark ? '#94A3B8' : '#64748B' },
                    ]}
                  >
                    Reset
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
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
              <Shield size={36} color={colors.primary} />
              <Text
                style={[
                  styles.emptyTitle,
                  { color: isDark ? '#F8FAFC' : '#0F172A' },
                ]}
              >
                No insurance companies found
              </Text>
              <Text
                style={[
                  styles.emptySubtitle,
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
              >
                {search || statusFilter !== 'all'
                  ? 'Try clearing your search query or adjusting your status filters.'
                  : 'Start by adding your first insurance partner company.'}
              </Text>
              <TouchableOpacity
                style={[styles.emptyAddBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  triggerHaptic('impactLight');
                  setEditingItem(null);
                  setAddEditModalVisible(true);
                }}
              >
                <Plus size={15} color="#FFFFFF" />
                <Text style={styles.emptyAddBtnText}>Add First Company</Text>
              </TouchableOpacity>
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
                Loading insurance companies...
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          companies.length > 0 ? (
            <View style={styles.footerCountBox}>
              <Text
                style={[
                  styles.footerCountText,
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
              >
                Showing 1 - {companies.length} of {totalCount} companies
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

      {/* 3. Add / Edit Modal */}
      <AddEditInsuranceCompanyModal
        visible={addEditModalVisible}
        editingItem={editingItem}
        onClose={() => {
          setAddEditModalVisible(false);
          setEditingItem(null);
        }}
        onSubmit={handleSubmitCompany}
      />

      {/* 4. Delete Confirmation Modal */}
      <DeleteInsuranceCompanyModal
        visible={deleteModalVisible}
        item={deleteTarget}
        isDeleting={isDeleting}
        onClose={() => {
          setDeleteModalVisible(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
      />

      {/* 5. Status Filter Modal / Dropdown Picker */}
      <Modal
        visible={showStatusDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStatusDropdown(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowStatusDropdown(false)}
        >
          <View
            style={[
              styles.pickerContainer,
              {
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                borderColor: isDark ? '#334155' : '#E2E8F0',
              },
            ]}
          >
            <View style={styles.pickerHeader}>
              <Text
                style={[
                  styles.pickerTitle,
                  { color: isDark ? '#F1F5F9' : '#0F172A' },
                ]}
              >
                Filter by Status
              </Text>
              <TouchableOpacity onPress={() => setShowStatusDropdown(false)}>
                <X size={18} color={isDark ? '#94A3B8' : '#64748B'} />
              </TouchableOpacity>
            </View>

            {[
              { id: 'all', label: 'All Statuses' },
              { id: 'active', label: 'Active' },
              { id: 'inactive', label: 'Inactive' },
            ].map((opt) => {
              const isSelected = statusFilter === opt.id;
              return (
                <TouchableOpacity
                  key={`status-filter-${opt.id}`}
                  style={[
                    styles.pickerItem,
                    isSelected && {
                      backgroundColor: isDark
                        ? 'rgba(88, 99, 42, 0.2)'
                        : '#EFF3DF',
                    },
                  ]}
                  onPress={() => {
                    setStatusFilter(opt.id as any);
                    setShowStatusDropdown(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      { color: isDark ? '#F1F5F9' : '#0F172A' },
                      isSelected && {
                        color: colors.primary,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {isSelected && <Check size={18} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
      {/* 6. Floating Action Button Speed Dial (Like Brand Screen) */}
      <FabSpeedDial
        primaryAction={{
          label: 'Add Company',
          onPress: () => {
            triggerHaptic('impactMedium');
            setEditingItem(null);
            setAddEditModalVisible(true);
          },
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
  filterSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 8,
  },
  searchBox: {
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
    fontSize: 13,
    paddingVertical: 0,
  },
  filterControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownBox: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
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
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 8,
    marginTop: 8,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  loadingBox: {
    paddingVertical: 50,
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
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pickerContainer: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
  },
  pickerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickerItemText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
});
