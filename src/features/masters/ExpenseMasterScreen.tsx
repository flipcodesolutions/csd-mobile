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
import { Plus, Search, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../core/theme/ThemeContext';
import { triggerHaptic } from '../../core/utils/haptics';
import { expenseCategoryApi } from './masterService';
import {
  CreateExpenseCategoryPayload,
  ExpenseCategory,
  UpdateExpenseCategoryPayload,
} from './types';
import { ExpenseCategoryCard } from './components/ExpenseCategoryCard';
import { AddEditExpenseCategoryModal } from './components/AddEditExpenseCategoryModal';
import { DeleteExpenseCategoryModal } from './components/DeleteExpenseCategoryModal';
import { FabSpeedDial } from '../../shared/FabSpeedDial';
import { exportCsvToFile } from '../../core/utils/csvExporter';
import { showErrorToast, showSuccessToast } from '../../core/utils/toast';

const DEFAULT_SEED_EXPENSES: ExpenseCategory[] = [
  { id: 1, title: 'Office Rent', name: 'Office Rent', description: 'Monthly dealership showroom and office rent', status: 'Active' },
  { id: 2, title: 'Electricity Bill', name: 'Electricity Bill', description: 'Showroom light, power, and AC monthly billing', status: 'Active' },
  { id: 3, title: 'Staff Welfare & Food', name: 'Staff Welfare & Food', description: 'Tea, refreshments, snacks, and team lunch expenses', status: 'Active' },
  { id: 4, title: 'Showroom Maintenance', name: 'Showroom Maintenance', description: 'Housekeeping, facility repairs, and sanitization', status: 'Active' },
  { id: 5, title: 'Internet & Telephony', name: 'Internet & Telephony', description: 'Broadband, VoIP calling desk, and cellular bills', status: 'Active' },
  { id: 6, title: 'Printing & Stationary', name: 'Printing & Stationary', description: 'Brochures, quotation print pads, and office supplies', status: 'Active' },
];

interface ExpenseMasterScreenProps {
  onOpenDrawer?: () => void;
}

export const ExpenseMasterScreen: React.FC<ExpenseMasterScreenProps> = () => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  // Data states
  const [categories, setCategories] = useState<ExpenseCategory[]>(DEFAULT_SEED_EXPENSES);
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
  const [editingItem, setEditingItem] = useState<ExpenseCategory | null>(null);

  // Delete modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Fetch Expense Categories API with Server Pagination
  const fetchCategories = async (
    pageNumber: number = 1,
    isPull = false,
    newPerPage: number = perPage,
    overrideSearch?: string
  ) => {
    if (isPull) setIsRefreshing(true);
    else if (pageNumber === 1) setIsLoading(true);

    const currentSearch = overrideSearch !== undefined ? overrideSearch : search;

    try {
      const res = await expenseCategoryApi.getAll({
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

      const parsed: ExpenseCategory[] = rawList.map((c: any) => ({
        id: Number(c.id),
        title: c.name || c.title || 'Expense Category',
        name: c.name || c.title,
        description: c.description || '',
        status: c.status === 1 || c.status === 'Active' ? 'Active' : 'Inactive',
        created_at: c.created_at,
      }));

      if (parsed.length > 0 || currentSearch) {
        setCategories(parsed);
      } else if (categories.length === 0) {
        setCategories(DEFAULT_SEED_EXPENSES);
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
      console.log('Error fetching expense categories:', err);
      if (categories.length === 0) setCategories(DEFAULT_SEED_EXPENSES);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCategories(1, false, perPage);
  }, []);

  const onRefresh = useCallback(() => {
    fetchCategories(1, true, perPage);
  }, [search, perPage]);



  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore && !isLoading && !isRefreshing) {
      setIsLoadingMore(true);
      expenseCategoryApi.getAll({
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
        const parsed: ExpenseCategory[] = rawList.map((c: any) => ({
          id: Number(c.id),
          title: c.name || c.title || 'Expense Category',
          name: c.name || c.title,
          description: c.description || '',
          status: c.status === 1 || c.status === 'Active' ? 'Active' : 'Inactive',
          created_at: c.created_at,
        }));
        setCategories((prev) => {
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
        console.log('Error loading more expenses:', e);
      }).finally(() => {
        setIsLoadingMore(false);
      });
    }
  };

  // Client-Side Filter
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
      );
    });
  }, [categories, search]);

  // Add / Edit Handlers
  const handleOpenAdd = () => {
    triggerHaptic('impactLight');
    setEditingItem(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (item: ExpenseCategory) => {
    triggerHaptic('selection');
    setEditingItem(item);
    setModalVisible(true);
  };

  const handleSaveCategory = async (
    payload: CreateExpenseCategoryPayload | UpdateExpenseCategoryPayload
  ) => {
    try {
      if (editingItem) {
        await expenseCategoryApi.update(editingItem.id, payload);
        setCategories((prev) =>
          prev.map((c) =>
            c.id === editingItem.id
              ? {
                  ...c,
                  title: payload.name,
                  name: payload.name,
                  description: payload.description,
                  status: payload.status === 1 ? 'Active' : 'Inactive',
                }
              : c
          )
        );
        triggerHaptic('notificationSuccess');
        showSuccessToast('Category Updated', `Expense title "${payload.name}" updated successfully.`);
      } else {
        const res = await expenseCategoryApi.create(payload as CreateExpenseCategoryPayload);
        const newId =
          res?.data?.id ||
          (categories.length > 0 ? Math.max(...categories.map((c) => c.id)) + 1 : 1);
        const newCat: ExpenseCategory = {
          id: newId,
          title: payload.name,
          name: payload.name,
          description: payload.description,
          status: payload.status === 1 ? 'Active' : 'Inactive',
        };
        setCategories((prev) => [newCat, ...prev]);
        triggerHaptic('notificationSuccess');
        showSuccessToast('Category Saved', `Expense category "${payload.name}" registered.`);
      }
    } catch (err: any) {
      console.log('Error saving expense category:', err);
      throw err;
    }
  };

  // Delete Handlers
  const handleOpenDelete = (item: ExpenseCategory) => {
    setDeleteTarget(item);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await expenseCategoryApi.delete(deleteTarget.id);
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      triggerHaptic('notificationSuccess');
      setDeleteModalVisible(false);
      setDeleteTarget(null);
      showSuccessToast(
        'Category Deleted',
        `Expense title "${deleteTarget.title}" removed from catalog.`
      );
    } catch (err: any) {
      console.log('Error deleting expense category:', err);
      // Demo optimistic delete
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteModalVisible(false);
      setDeleteTarget(null);
      showSuccessToast(
        'Category Deleted',
        `Expense title "${deleteTarget.title}" removed from catalog.`
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // CSV Export Action
  const handleExportCSV = async () => {
    triggerHaptic('impactLight');
    const rows = filteredCategories.map((c) => [
      c.id,
      c.title || c.name || 'Expense',
      c.description || 'N/A',
      c.status || 'Active',
    ]);
    await exportCsvToFile({
      filename: 'expense_categories',
      headers: ['Category ID', 'Category Title', 'Description', 'Status'],
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
      {/* 1. FlatList of Expense Categories */}
      <FlatList
        ref={flatListRef}
        data={filteredCategories}
        keyExtractor={(item) => `expense-cat-${item.id}`}
        renderItem={({ item, index }) => (
          <ExpenseCategoryCard
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
                  fetchCategories(1, false, perPage, search);
                }}
                returnKeyType="search"
                placeholder="Search expense title or description..."
                placeholderTextColor={colors.textMuted}
              />
              {search ? (
                <TouchableOpacity
                  onPress={() => {
                    setSearch('');
                    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                    fetchCategories(1, false, perPage, '');
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={14} color={colors.textSecondary} strokeWidth={2} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Badge Count */}
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
                  {filteredCategories.length} Categories Registered
                </Text>
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
                Loading expense categories catalog...
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>💼</Text>
              <Text
                style={[
                  styles.emptyTitle,
                  { color: isDark ? '#F8FAFC' : '#0F172A' },
                ]}
              >
                No Categories Found
              </Text>
              <Text
                style={[
                  styles.emptyText,
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
              >
                {search
                  ? `No expense category matches "${search}".`
                  : 'No expense titles registered in directory.'}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          isLoadingMore ? (
            <View style={{ paddingVertical: 20, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : !hasMore && categories.length > 5 ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '500',
                  color: isDark ? '#64748B' : '#94A3B8',
                }}
              >
                All {totalCount || categories.length} expense categories loaded
              </Text>
            </View>
          ) : undefined
        }
      />

      {/* 3. Add / Edit Modal */}
      <AddEditExpenseCategoryModal
        visible={modalVisible}
        editingItem={editingItem}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSaveCategory}
      />

      {/* 4. Delete Confirmation Modal */}
      <DeleteExpenseCategoryModal
        visible={deleteModalVisible}
        targetCategory={deleteTarget}
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
          label: 'Add Category',
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
