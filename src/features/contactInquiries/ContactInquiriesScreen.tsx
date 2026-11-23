import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Bell,
  Check,
  Inbox,
  Mail,
  RotateCcw,
  Search,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../core/theme/ThemeContext';
import { triggerHaptic } from '../../core/utils/haptics';
import { showErrorToast, showSuccessToast } from '../../core/utils/toast';
import { contactInquiryService } from './contactInquiryService';
import { ContactInquiry, ContactInquiryStats } from './types';
import { ContactInquiryCard } from './components/ContactInquiryCard';
import { ContactInquiryDetailModal } from './components/ContactInquiryDetailModal';

interface ContactInquiriesScreenProps {
  onOpenDrawer?: () => void;
  navigation?: any;
}

type FilterPreset = 'all' | 'today';

interface KpiSummaryCardProps {
  title: string;
  count: number;
  countLabel: string;
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
  countLabel,
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
      activeOpacity={0.8}
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
        {count} {countLabel}
      </Text>

      <View style={styles.kpiSubtextRow}>
        {isActive ? (
          <View style={styles.activeFilterPill}>
            <Check size={11} color="#58632A" strokeWidth={3} />
            <Text style={styles.activeFilterPillText}>Active Filter</Text>
          </View>
        ) : (
          <Text
            style={[styles.kpiSubtext, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {subtext}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export const ContactInquiriesScreen: React.FC<ContactInquiriesScreenProps> = ({
  navigation,
  onOpenDrawer,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // 1. Data States
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [stats, setStats] = useState<ContactInquiryStats>({
    total: 0,
    today: 0,
    unread: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 2. Search & Filter State
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterPreset>('all');

  // 3. Detail Modal State
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Initial load
  useEffect(() => {
    fetchInquiries(1, false);
  }, []);

  const fetchInquiries = async (
    pageNumber: number = 1,
    isLoadMore: boolean = false
  ) => {
    try {
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        if (pageNumber === 1 && !isRefreshing) setIsLoading(true);
      }

      const res = await contactInquiryService.getAll({
        page: pageNumber,
        per_page: 15,
        search: search.trim() || undefined,
      });

      const list: ContactInquiry[] = Array.isArray(res?.data) ? res.data : [];

      if (pageNumber === 1) {
        setInquiries(list);
      } else {
        setInquiries((prev) => {
          const safePrev = Array.isArray(prev) ? prev : [];
          const existingIds = new Set(safePrev.map((i) => i.id));
          const newItems = list.filter((i) => !existingIds.has(i.id));
          return [...safePrev, ...newItems];
        });
      }

      if (res?.stats) {
        setStats(res.stats);
      } else if (pageNumber === 1) {
        const todayIso = new Date().toISOString().split('T')[0];
        setStats({
          total: list.length,
          today: list.filter((i) => (i.created_at || '').startsWith(todayIso)).length,
          unread: list.filter((i) => (i.status || '').toLowerCase() === 'new').length,
        });
      }

      setPage(pageNumber);

      if (res?.pagination) {
        setHasMore(res.pagination.current_page < res.pagination.last_page);
      } else {
        setHasMore(list.length >= 15);
      }
    } catch (err) {
      console.log('Failed to fetch contact inquiries:', err);
      showErrorToast('Error', 'Unable to load inquiries. Please check connection.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  const handleRefresh = async () => {
    triggerHaptic('impactLight');
    setIsRefreshing(true);
    await fetchInquiries(1, false);
  };

  const handleLoadMore = () => {
    if (!isLoading && !isLoadingMore && hasMore) {
      fetchInquiries(page + 1, true);
    }
  };

  // -------------------------------------------------------------
  // Filtered & Searched Inquiries
  // -------------------------------------------------------------
  const filteredInquiries = useMemo(() => {
    const safeList = Array.isArray(inquiries) ? inquiries : [];
    const todayIso = new Date().toISOString().split('T')[0];

    return safeList.filter((item) => {
      if (!item) return false;

      // 1. Text Search Filter
      const q = search.trim().toLowerCase();
      if (q) {
        const nameMatch = (item.name || '').toLowerCase().includes(q);
        const emailMatch = (item.email || '').toLowerCase().includes(q);
        const phoneMatch = (item.phone || '').toLowerCase().includes(q);
        const subjectMatch = (item.subject || '').toLowerCase().includes(q);
        const messageMatch = (item.message || '').toLowerCase().includes(q);

        if (!nameMatch && !emailMatch && !phoneMatch && !subjectMatch && !messageMatch) {
          return false;
        }
      }

      // 2. Preset Filter (All / Today)
      if (activeFilter === 'today') {
        const isToday = (item.created_at || '').startsWith(todayIso);
        if (!isToday) return false;
      }

      return true;
    });
  }, [inquiries, search, activeFilter]);

  // -------------------------------------------------------------
  // Native Linking Integrations (Call, Email, WhatsApp)
  // -------------------------------------------------------------
  const handleCall = useCallback((phone: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const url = `tel:${cleanPhone}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          showErrorToast('Unable to Call', 'Dialer is not supported on this device.');
        }
      })
      .catch((err) => {
        console.warn('Error launching phone call:', err);
        showErrorToast('Error', 'Could not open phone dialer.');
      });
  }, []);

  const handleEmail = useCallback((email: string, subject?: string) => {
    if (!email) return;
    const cleanEmail = email.trim();
    const mailSubject = subject ? `Regarding: ${subject}` : 'Regarding your inquiry';
    const url = `mailto:${cleanEmail}?subject=${encodeURIComponent(mailSubject)}`;
    Linking.openURL(url).catch((err) => {
      console.warn('Error launching email client:', err);
      showErrorToast('Error', 'Could not open email client.');
    });
  }, []);

  const handleWhatsApp = useCallback((phone: string, name?: string) => {
    if (!phone) return;
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.length === 10) {
      clean = `91${clean}`; // Default India code if 10-digit
    }
    const greeting = name ? `Hello ${name}, regarding your inquiry:` : 'Hello, regarding your inquiry:';
    const url = `https://wa.me/${clean}?text=${encodeURIComponent(greeting)}`;
    Linking.openURL(url).catch((err) => {
      console.warn('Error opening WhatsApp:', err);
      showErrorToast('Error', 'Could not open WhatsApp.');
    });
  }, []);

  // -------------------------------------------------------------
  // Open Detail Modal & Mark as Read
  // -------------------------------------------------------------
  const handleOpenDetail = useCallback(async (inquiry: ContactInquiry) => {
    triggerHaptic('selection');
    setSelectedInquiry(inquiry);
    setDetailModalVisible(true);

    // Optimistically update status to 'read' if it was 'new'
    if ((inquiry.status || '').toLowerCase() === 'new' || inquiry.is_read === false) {
      setInquiries((prev) =>
        prev.map((i) =>
          i.id === inquiry.id ? { ...i, status: 'read', is_read: true } : i
        )
      );
      setStats((prev) => ({
        ...prev,
        unread: Math.max(0, prev.unread ? prev.unread - 1 : 0),
      }));

      // Call server to mark as read
      try {
        await contactInquiryService.getById(inquiry.id);
      } catch (err) {
        console.log('Background mark-read error:', err);
      }
    }
  }, []);

  // -------------------------------------------------------------
  // Delete Inquiry Handler
  // -------------------------------------------------------------
  const handleDeleteInquiry = useCallback((inquiry: ContactInquiry) => {
    Alert.alert(
      'Delete Contact Inquiry',
      `Are you sure you want to permanently delete the inquiry from "${inquiry.name || 'this customer'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              triggerHaptic('impactHeavy');
              // Optimistic deletion from state
              setInquiries((prev) => prev.filter((i) => i.id !== inquiry.id));
              setStats((prev) => ({
                ...prev,
                total: Math.max(0, prev.total - 1),
              }));

              if (detailModalVisible && selectedInquiry?.id === inquiry.id) {
                setDetailModalVisible(false);
                setSelectedInquiry(null);
              }

              await contactInquiryService.delete(inquiry.id);
              showSuccessToast('Deleted', 'Contact inquiry removed successfully.');
            } catch (err: any) {
              console.log('Error deleting inquiry:', err);
              showErrorToast('Delete Failed', 'Could not delete the inquiry. Please try again.');
              // Refetch on failure
              fetchInquiries(1, false);
            }
          },
        },
      ]
    );
  }, [detailModalVisible, selectedInquiry]);

  // -------------------------------------------------------------
  // Render Item for Inquiry Card
  // -------------------------------------------------------------
  const renderItem = useCallback(
    ({ item, index }: { item: ContactInquiry; index: number }) => {
      return (
        <ContactInquiryCard
          item={item}
          index={index}
          onPress={handleOpenDetail}
          onCall={handleCall}
          onEmail={handleEmail}
          onWhatsApp={handleWhatsApp}
          onDelete={handleDeleteInquiry}
        />
      );
    },
    [handleOpenDetail, handleCall, handleEmail, handleWhatsApp, handleDeleteInquiry]
  );

  // -------------------------------------------------------------
  // Header Component (KPI Summary Cards + Search Bar + Count Pill)
  // Everything scrolls together smoothly in one list!
  // -------------------------------------------------------------
  const renderListHeader = useMemo(() => {
    return (
      <View style={styles.listHeaderWrapper}>
        {/* KPI METRIC CARDS DECK (2 Cards matching exact Web Reference screenshot) */}
        <View style={styles.kpiDeckContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.kpiDeckScroll}
          >
            {/* Card 1: TOTAL INQUIRIES RECEIVED */}
            <KpiSummaryCard
              title="TOTAL INQUIRIES RECEIVED"
              count={stats.total || inquiries.length}
              countLabel="Messages"
              subtext="All customer requests submitted"
              icon={Inbox}
              iconColor="#58632A"
              iconBg={isDark ? '#232D14' : '#EEF2E6'}
              isActive={activeFilter === 'all'}
              onPress={() => setActiveFilter('all')}
            />

            {/* Card 2: TODAY'S NEW INQUIRIES */}
            <KpiSummaryCard
              title="TODAY'S NEW INQUIRIES"
              count={stats.today}
              countLabel="Inquiries"
              subtext="Received in last 24 hours"
              icon={Bell}
              iconColor="#16A34A"
              iconBg={isDark ? '#122D1F' : '#ECFDF5'}
              isActive={activeFilter === 'today'}
              onPress={() =>
                setActiveFilter((prev) => (prev === 'today' ? 'all' : 'today'))
              }
            />
          </ScrollView>
        </View>

        {/* SEARCH BAR ROW (Full width) */}
        <View style={styles.searchBarRow}>
          <View
            style={[
              styles.searchInputBox,
              {
                backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                borderColor: isDark ? '#1E293B' : '#E2E8F0',
              },
            ]}
          >
            <Search size={16} color={colors.textSecondary} strokeWidth={2.2} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search name, email, phone, message..."
              placeholderTextColor={colors.textSecondary}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearch('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.clearSearchBtn}
              >
                <X size={14} color="#64748B" strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }, [
    stats,
    inquiries.length,
    activeFilter,
    search,
    colors,
    isDark,
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
      {/* SCROLLABLE CONTACT INQUIRIES LIST                           */}
      {/* Everything scrolls up together smoothly!                    */}
      {/* ----------------------------------------------------------- */}
      <FlatList
        style={styles.flatList}
        data={filteredInquiries}
        keyExtractor={(item, index) =>
          item?.id ? item.id.toString() : index.toString()
        }
        renderItem={renderItem}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#58632A" />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading customer contact inquiries...
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
                <Mail size={32} color="#58632A" strokeWidth={2} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                No Contact Inquiries Found
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {search.length > 0 || activeFilter !== 'all'
                  ? 'No records match your active search or filter selection.'
                  : 'Customer inquiries submitted via the website contact form will appear here.'}
              </Text>
              {(search.length > 0 || activeFilter !== 'all') && (
                <TouchableOpacity
                  onPress={() => {
                    setSearch('');
                    setActiveFilter('all');
                  }}
                  style={[styles.resetEmptyBtn, { backgroundColor: '#58632A' }]}
                >
                  <RotateCcw size={14} color="#FFFFFF" strokeWidth={2.2} />
                  <Text style={styles.resetEmptyBtnText}>Reset Filters</Text>
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
                Loading more inquiries...
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
      {/* INQUIRY DETAIL MODAL                                        */}
      {/* ----------------------------------------------------------- */}
      <ContactInquiryDetailModal
        visible={detailModalVisible}
        inquiry={selectedInquiry}
        onClose={() => {
          setDetailModalVisible(false);
          setSelectedInquiry(null);
        }}
        onCall={handleCall}
        onEmail={handleEmail}
        onWhatsApp={handleWhatsApp}
        onDelete={handleDeleteInquiry}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flatList: {
    flex: 1,
  },
  listHeaderWrapper: {
    paddingBottom: 4,
  },
  kpiDeckContainer: {
    paddingVertical: 12,
  },
  kpiDeckScroll: {
    paddingHorizontal: 12,
    gap: 10,
  },
  kpiCard: {
    width: 200,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  kpiCardActive: {
    borderColor: '#58632A',
    borderWidth: 1.5,
    shadowColor: '#58632A',
    shadowOpacity: 0.15,
    elevation: 3,
  },
  kpiCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  kpiCardTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    flex: 1,
    marginRight: 6,
  },
  kpiIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiCountText: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  kpiSubtextRow: {
    minHeight: 18,
    justifyContent: 'center',
  },
  kpiSubtext: {
    fontSize: 11,
    fontWeight: '500',
  },
  activeFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeFilterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#58632A',
  },
  searchBarRow: {
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  searchInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
    marginLeft: 8,
  },
  clearSearchBtn: {
    padding: 4,
  },
  listContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    paddingVertical: 50,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  resetEmptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resetEmptyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadMoreFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  loadMoreText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

