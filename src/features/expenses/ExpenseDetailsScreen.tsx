import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Filter, Plus, Receipt, Search, X } from 'lucide-react-native';
import { colors } from '../../core/theme/colors';
import { useTheme } from '../../core/theme/ThemeContext';
import { triggerHaptic } from '../../core/utils/haptics';
import { showErrorToast, showSuccessToast } from '../../core/utils/toast';
import { AddEditExpenseModal } from './components/AddEditExpenseModal';
import { DeleteExpenseModal } from './components/DeleteExpenseModal';
import { ExpenseCard } from './components/ExpenseCard';
import { ExpenseDetailModal } from './components/ExpenseDetailModal';
import {
  ExpenseFilterModal,
  ExpenseFilters,
} from './components/ExpenseFilterModal';
import { expenseService } from './expenseService';
import {
  CreateExpensePayload,
  ExpenseCategory,
  ExpenseRecord,
  UpdateExpensePayload,
} from './types';

interface ExpenseDetailsScreenProps {
  navigation?: any;
  onOpenDrawer?: () => void;
  userRole?: string;
  loggedInUserName?: string;
}

const DEFAULT_FILTERS: ExpenseFilters = {
  paymentType: 'All',
  categoryId: 'All',
  fromDate: '',
  toDate: '',
};

export const ExpenseDetailsScreen: React.FC<ExpenseDetailsScreenProps> = ({
  loggedInUserName = 'Admin User',
}) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // State Management
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  // Pagination & Loading States
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ExpenseFilters>(DEFAULT_FILTERS);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Modals
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ExpenseRecord | null>(null);
  const [detailItem, setDetailItem] = useState<ExpenseRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseRecord | null>(null);

  // Number of active filters (excluding search)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.paymentType !== 'All') count++;
    if (filters.categoryId !== 'All') count++;
    if (filters.fromDate) count++;
    if (filters.toDate) count++;
    return count;
  }, [filters]);

  // Load master categories
  const loadCategories = useCallback(async () => {
    try {
      const res = await expenseService.getCategories();
      if (res && res.length > 0) {
        setCategories(res);
      }
    } catch (e) {
      console.warn('Error fetching categories in ExpenseDetailsScreen:', e);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Fetch expenses with pagination & filters
  const fetchExpenses = useCallback(
    async (targetPage: number = 1, append: boolean = false) => {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      try {
        const queryParams: any = {
          page: targetPage,
          per_page: 15,
        };

        if (searchTerm.trim()) {
          queryParams.search = searchTerm.trim();
        }
        if (filters.paymentType !== 'All') {
          queryParams.payment_method =
            filters.paymentType === 'Offline' ? 'Cash' : 'Bank Transfer';
        }
        if (filters.categoryId !== 'All') {
          queryParams.category_id = filters.categoryId;
        }
        if (filters.fromDate) {
          queryParams.from_date = filters.fromDate;
        }
        if (filters.toDate) {
          queryParams.to_date = filters.toDate;
        }

        const res = await expenseService.getExpenses(queryParams);

        if (append) {
          setExpenses(prev => {
            const existingIds = new Set(prev.map(e => e.id));
            const newRecords = res.data.filter(e => !existingIds.has(e.id));
            return [...prev, ...newRecords];
          });
        } else {
          setExpenses(res.data);
        }

        setPage(res.pagination.current_page);
        setLastPage(res.pagination.last_page);
        setTotalRecords(res.pagination.total);
        if (res.totalAmount !== undefined) {
          setTotalAmount(res.totalAmount);
        }
      } catch (err: any) {
        console.error('Fetch Expenses Error:', err);
        showErrorToast('Failed to load expense records');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [searchTerm, filters],
  );

  // Re-fetch on filter or search term update
  useEffect(() => {
    fetchExpenses(1, false);
  }, [fetchExpenses]);

  // Pull to refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchExpenses(1, false), loadCategories()]);
    setIsRefreshing(false);
  };

  // Infinite Scroll Handler (matching LeadsScreen)
  const handleLoadMore = () => {
    if (!isLoadingMore && page < lastPage && !isLoading && !isRefreshing) {
      fetchExpenses(page + 1, true);
    }
  };

  // Add / Edit submission
  const handleSubmitExpense = async (
    payload: CreateExpensePayload | UpdateExpensePayload,
    isEdit: boolean,
  ) => {
    if (isEdit && editingItem) {
      await expenseService.updateExpense(editingItem.id, payload);
    } else {
      await expenseService.createExpense(payload as CreateExpensePayload);
    }
    // Refresh list from page 1
    fetchExpenses(1, false);
  };

  // Hard Delete confirmation
  const handleConfirmDelete = async (item: ExpenseRecord) => {
    try {
      await expenseService.deleteExpense(item.id);
      showSuccessToast(
        `Expense voucher for "${item.party_name}" permanently deleted.`,
      );
      fetchExpenses(1, false);
    } catch (err: any) {
      console.error('Delete Expense Error:', err);
      showErrorToast(
        err?.response?.data?.message || 'Failed to delete expense record.',
      );
      throw err;
    }
  };

  const renderItem = useCallback(
    ({ item, index }: { item: ExpenseRecord; index: number }) => (
      <ExpenseCard
        index={index}
        item={item}
        onView={exp => setDetailItem(exp)}
        onEdit={exp => {
          setEditingItem(exp);
          setShowAddEditModal(true);
        }}
        onDelete={exp => setDeleteTarget(exp)}
      />
    ),
    [],
  );

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: isDark ? '#080D1A' : '#F7F7F5' },
      ]}
    >
      {/* Search & Action Bar */}
      <View
        style={[
          styles.actionHeader,
          {
            backgroundColor: isDark ? '#131C27' : '#FFFFFF',
            borderColor: isDark ? '#1E293B' : colors.border,
          },
        ]}
      >
        {/* Search Bar */}
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
              borderColor: isDark ? '#334155' : '#CBD5E1',
            },
          ]}
        >
          <Search size={15} color={isDark ? '#94A3B8' : '#64748B'} />
          <TextInput
            style={[
              styles.searchInput,
              { color: isDark ? '#F1F5F9' : '#0F172A' },
            ]}
            placeholder="Search party, invoice .."
            placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm ? (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <X size={15} color={isDark ? '#94A3B8' : '#64748B'} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Button with Count Badge */}
        <TouchableOpacity
          style={[
            styles.filterBtn,
            {
              backgroundColor:
                activeFiltersCount > 0
                  ? colors.primary
                  : isDark
                  ? '#0F172A'
                  : '#F8FAFC',
              borderColor:
                activeFiltersCount > 0
                  ? colors.primaryHover
                  : isDark
                  ? '#334155'
                  : '#CBD5E1',
            },
          ]}
          onPress={() => {
            triggerHaptic('impactLight');
            setShowFilterModal(true);
          }}
          activeOpacity={0.8}
        >
          <Filter
            size={16}
            color={
              activeFiltersCount > 0
                ? '#FFFFFF'
                : isDark
                ? '#CBD5E1'
                : '#334155'
            }
          />
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Add Expense Entry Button */}
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.orange }]}
          onPress={() => {
            triggerHaptic('selection');
            setEditingItem(null);
            setShowAddEditModal(true);
          }}
          activeOpacity={0.85}
        >
          <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Records Count & Metrics Banner */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryTitleRow}>
          <Text
            style={[
              styles.summaryTitle,
              { color: isDark ? '#F1F5F9' : '#1F2933' },
            ]}
          >
            Expense Records
          </Text>
          <View
            style={[
              styles.recordsBadge,
              {
                backgroundColor: isDark ? 'rgba(88, 99, 42, 0.25)' : '#EFF3DF',
              },
            ]}
          >
            <Text style={[styles.recordsBadgeText, { color: colors.primary }]}>
              {totalRecords} {totalRecords === 1 ? 'Record' : 'Records'}
            </Text>
          </View>
        </View>
      </View>

      {/* Infinite Scroll Expense FlatList */}
      <FlatList
        data={expenses}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom + 80, 100) },
        ]}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews={true}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.loadingMoreBox}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : undefined
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View
              style={[
                styles.emptyBox,
                {
                  backgroundColor: isDark ? '#131C27' : '#FFFFFF',
                  borderColor: isDark ? '#1E293B' : colors.border,
                },
              ]}
            >
              <View style={styles.emptyIconBox}>
                <Receipt size={36} color={colors.primary} />
              </View>
              <Text
                style={[
                  styles.emptyTitle,
                  { color: isDark ? '#F1F5F9' : '#0F172A' },
                ]}
              >
                No expense records found
              </Text>
              <Text
                style={[
                  styles.emptySubtitle,
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
              >
                {searchTerm || activeFiltersCount > 0
                  ? 'Try adjusting your search query or clear filters to see more results.'
                  : 'Start by recording your first showroom operational expenditure.'}
              </Text>
              <TouchableOpacity
                style={[
                  styles.emptyAddBtn,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => {
                  triggerHaptic('selection');
                  setEditingItem(null);
                  setShowAddEditModal(true);
                }}
              >
                <Plus size={16} color="#FFFFFF" strokeWidth={2.2} />
                <Text style={styles.emptyAddBtnText}>Add First Expense</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.initialLoadingBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text
                style={[
                  styles.loadingText,
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
              >
                Loading expense records...
              </Text>
            </View>
          )
        }
      />

      {/* Modals */}
      <AddEditExpenseModal
        visible={showAddEditModal}
        editingItem={editingItem}
        categories={categories}
        loggedInUserName={loggedInUserName}
        onClose={() => {
          setShowAddEditModal(false);
          setEditingItem(null);
        }}
        onSubmit={handleSubmitExpense}
      />

      <ExpenseDetailModal
        visible={Boolean(detailItem)}
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onEdit={item => {
          setEditingItem(item);
          setShowAddEditModal(true);
        }}
        onDelete={item => setDeleteTarget(item)}
      />

      <DeleteExpenseModal
        visible={Boolean(deleteTarget)}
        item={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      <ExpenseFilterModal
        visible={showFilterModal}
        filters={filters}
        categories={categories}
        onClose={() => setShowFilterModal(false)}
        onApply={newFilters => setFilters(newFilters)}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
  },
  searchBox: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.orange,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  summaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  recordsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recordsBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  totalSpendText: {
    fontSize: 12,
  },
  boldAmount: {
    fontWeight: '800',
    color: colors.primary,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 4,
  },
  loadingMoreBox: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginTop: 24,
    marginHorizontal: 4,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF3DF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    height: 40,
    borderRadius: 8,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  initialLoadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
