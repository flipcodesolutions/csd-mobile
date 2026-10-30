import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  CheckCircle2,
  Edit2,
  Search,
  Tag,
  Trash2,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../core/theme/ThemeContext';
import { triggerHaptic } from '../../core/utils/haptics';
import { exportCsvToFile } from '../../core/utils/csvExporter';
import {
  showErrorToast,
  showSuccessToast,
  showWarningToast,
} from '../../core/utils/toast';
import { FabSpeedDial } from '../../shared';
import { leadStatusApi } from './masterService';

export interface LeadStatus {
  id: number;
  name: string;
  status: 'Active' | 'Inactive';
  color?: string;
}

export const LeadStatusScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [statuses, setStatuses] = useState<LeadStatus[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<LeadStatus | null>(null);
  const [formName, setFormName] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Lead Statuses from Backend API
  const fetchLeadStatuses = async (isPullRefresh = false) => {
    if (isPullRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await leadStatusApi.getAll();
      const rawList =
        res && res.status && Array.isArray(res.data)
          ? res.data
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];
      setStatuses(rawList);
    } catch (error: any) {
      console.log('Error fetching lead statuses:', error);
      Alert.alert('API Error', error?.response?.data?.message || 'Unable to fetch lead statuses from server.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeadStatuses();
  }, []);

  // 2. Open modal for Adding
  const handleOpenAdd = () => {
    triggerHaptic('impactLight');
    setEditingItem(null);
    setFormName('');
    setFormActive(true);
    setModalVisible(true);
  };

  // 3. Open modal for Editing
  const handleOpenEdit = (item: LeadStatus) => {
    triggerHaptic('impactLight');
    setEditingItem(item);
    setFormName(item.name);
    setFormActive(item.status === 'Active');
    setModalVisible(true);
  };

  // 4. Save (Create or Update) via Backend API
  const handleSave = async () => {
    if (!formName.trim()) {
      triggerHaptic('notificationError');
      Alert.alert('Validation Error', 'Please enter a valid status name.');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      name: formName.trim(),
      status: (formActive ? 'Active' : 'Inactive') as 'Active' | 'Inactive',
    };

    try {
      if (editingItem) {
        const res = await leadStatusApi.update(editingItem.id, payload);
        if (res && res.status !== false) {
          triggerHaptic('notificationSuccess');
          fetchLeadStatuses();
          setModalVisible(false);
        } else {
          Alert.alert('Error', res?.message || 'Failed to update status.');
        }
      } else {
        const res = await leadStatusApi.create(payload);
        if (res && res.status !== false) {
          triggerHaptic('notificationSuccess');
          fetchLeadStatuses();
          setModalVisible(false);
        } else {
          Alert.alert('Error', res?.message || 'Failed to create status.');
        }
      }
    } catch (error: any) {
      console.log('Save Lead Status API error:', error);
      Alert.alert('Request Failed', error?.response?.data?.message || 'Failed to save lead status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Delete via Backend API
  const handleDelete = (item: LeadStatus) => {
    triggerHaptic('notificationWarning');
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete status "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await leadStatusApi.delete(item.id);
              if (res && res.status !== false) {
                triggerHaptic('notificationSuccess');
                fetchLeadStatuses();
              } else {
                Alert.alert('Error', res?.message || 'Failed to delete status.');
              }
            } catch (error: any) {
              console.log('Delete Lead Status API error:', error);
              Alert.alert('Error', error?.response?.data?.message || 'Failed to delete lead status.');
            }
          },
        },
      ]
    );
  };

  // Filtered List
  const filteredList = statuses.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || item.status === filter;
    return matchSearch && matchFilter;
  });

  const activeCount = statuses.filter((s) => s.status === 'Active').length;
  const inactiveCount = statuses.filter((s) => s.status === 'Inactive').length;

  // Export CSV Action
  const handleExportCSV = async () => {
    triggerHaptic('impactLight');
    const rows = filteredList.map((item) => [
      item.id,
      item.name,
      item.status,
    ]);
    await exportCsvToFile({
      filename: `lead_statuses_${new Date().toISOString().split('T')[0]}`,
      headers: ['ID', 'Status Name', 'Status State'],
      rows,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 1. Header Filters Toolbar */}
      <View
        style={[
          styles.headerContainer,
          {
            backgroundColor: isDark ? '#101726' : '#FFFFFF',
            borderBottomColor: colors.border,
            paddingTop: 10,
          },
        ]}
      >
        {/* Search Bar */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: isDark ? '#162030' : '#F8FAFC',
              borderColor: colors.border,
            },
          ]}
        >
          <Search size={15} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search lead statuses..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Horizontal Filter Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity
            style={[
              styles.filterPill,
              filter === 'All' && [
                styles.filterPillActive,
                { backgroundColor: colors.primary, borderColor: colors.primary },
              ],
            ]}
            onPress={() => {
              triggerHaptic('selection');
              setFilter('All');
            }}
          >
            <Text
              style={[
                styles.filterPillText,
                filter === 'All' && styles.filterPillTextActive,
              ]}
            >
              All ({statuses.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              filter === 'Active' && [
                styles.filterPillActive,
                { backgroundColor: colors.primary, borderColor: colors.primary },
              ],
            ]}
            onPress={() => {
              triggerHaptic('selection');
              setFilter('Active');
            }}
          >
            <Text
              style={[
                styles.filterPillText,
                filter === 'Active' && styles.filterPillTextActive,
              ]}
            >
              Active ({activeCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              filter === 'Inactive' && [
                styles.filterPillActive,
                { backgroundColor: colors.primary, borderColor: colors.primary },
              ],
            ]}
            onPress={() => {
              triggerHaptic('selection');
              setFilter('Inactive');
            }}
          >
            <Text
              style={[
                styles.filterPillText,
                filter === 'Inactive' && styles.filterPillTextActive,
              ]}
            >
              Inactive ({inactiveCount})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 2. List Body */}
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading lead statuses...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom + 90, 110) },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchLeadStatuses(true)}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.recordCard,
                {
                  backgroundColor: isDark ? '#101726' : '#FFFFFF',
                  borderColor: colors.border,
                },
              ]}
            >
              {/* Dot Icon Wrap */}
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: item.color
                       ? `${item.color}15`
                      : isDark
                      ? '#162030'
                      : '#F1F5F9',
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusColorDot,
                    { backgroundColor: item.color || colors.primary },
                  ]}
                />
              </View>

              {/* Status Info */}
              <View style={styles.cardCenter}>
                <View style={styles.nameRow}>
                  <Text
                    style={[styles.cardTitle, { color: colors.textPrimary }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.name}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          item.status === 'Active'
                            ? 'rgba(22, 163, 74, 0.12)'
                            : 'rgba(220, 38, 38, 0.12)',
                        borderColor:
                          item.status === 'Active'
                            ? colors.success
                            : colors.danger,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        {
                          color:
                            item.status === 'Active'
                              ? colors.success
                              : colors.danger,
                        },
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Inline Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: isDark ? '#162030' : '#F8FAFC',
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => handleOpenEdit(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Edit2 size={13} color={colors.textSecondary} strokeWidth={2} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    styles.deleteActionBtn,
                    {
                      backgroundColor: isDark
                        ? 'rgba(239, 68, 68, 0.15)'
                        : '#FEF2F2',
                    },
                  ]}
                  onPress={() => handleDelete(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Trash2 size={13} color="#DC2626" strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Tag size={36} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                No Lead Statuses Found
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {search
                  ? `No statuses match "${search}". Try adjusting your filters.`
                  : 'Tap the "+ Add Status" button to create your first status.'}
              </Text>
            </View>
          }
        />
      )}

      {/* 3. Add / Edit Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isSubmitting) setModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => {
              if (!isSubmitting) setModalVisible(false);
            }}
          />
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: isDark ? '#101726' : '#FFFFFF',
                borderColor: colors.border,
              },
            ]}
          >
            {/* Header */}
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: isDark ? '#1E293B' : '#F1F5F9' },
              ]}
            >
              <View>
                <Text
                  style={[styles.modalTitle, { color: colors.textPrimary }]}
                >
                  {editingItem ? 'Edit Status' : 'Add Status'}
                </Text>
                <Text
                  style={[styles.modalSub, { color: colors.textSecondary }]}
                >
                  CRM workflow stage definition
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                disabled={isSubmitting}
                style={[
                  styles.closeBtn,
                  {
                    backgroundColor: isDark ? '#162030' : '#F1F5F9',
                    borderColor: colors.border,
                  },
                ]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={15} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Input */}
            <View style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                STATUS NAME <Text style={{ color: colors.danger }}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: isDark ? '#162030' : '#F8FAFC',
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder="e.g. Test Drive Scheduled, Documents Verified"
                placeholderTextColor={colors.textMuted}
                value={formName}
                onChangeText={setFormName}
                editable={!isSubmitting}
              />

              <View style={styles.switchRow}>
                <View>
                  <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>
                    Active Status
                  </Text>
                  <Text style={[styles.switchSub, { color: colors.textSecondary }]}>
                    Display in lead progression dropdowns
                  </Text>
                </View>
                <Switch
                  value={formActive}
                  onValueChange={setFormActive}
                  trackColor={{ false: '#64748B', true: colors.primary }}
                  thumbColor="#FFFFFF"
                  disabled={isSubmitting}
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View
              style={[
                styles.modalBtnRow,
                { borderTopColor: isDark ? '#1E293B' : '#F1F5F9' },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.cancelBtn,
                  {
                    backgroundColor: isDark ? '#162030' : '#F1F5F9',
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setModalVisible(false)}
                disabled={isSubmitting}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  { backgroundColor: colors.primary },
                  isSubmitting && { opacity: 0.6 },
                ]}
                onPress={handleSave}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {editingItem ? 'Save Changes' : 'Create Status'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Floating Action Button */}
      <FabSpeedDial
        primaryAction={{
          label: 'Add Status',
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
  container: {
    flex: 1,
  },
  headerContainer: {
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
  topToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  screenTitle: {
    fontSize: 16,
    fontWeight: '700',
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
    gap: 6,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 8,
  },
  primaryAddBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: 'transparent',
  },
  filterPillActive: {},
  filterPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
  },
  listContent: {
    padding: 12,
    gap: 6,
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  cardCenter: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 0.8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteActionBtn: {
    borderWidth: 0,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 14,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalSub: {
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 16,
    gap: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  switchSub: {
    fontSize: 11,
    marginTop: 1,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  saveBtn: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

