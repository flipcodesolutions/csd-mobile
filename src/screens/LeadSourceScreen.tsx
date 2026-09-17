import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../colors';
import { leadSourceApi } from '../lib/apiServices';

export interface LeadSource {
  id: number;
  title: string;
  status: 'Active' | 'Inactive';
  icon?: string;
}

export const LeadSourceScreen: React.FC = () => {
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<LeadSource | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Lead Sources from backend API
  const fetchLeadSources = async (isPullRefresh = false) => {
    if (isPullRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await leadSourceApi.getAll();
      const rawList =
        res && res.status && Array.isArray(res.data)
          ? res.data
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];
      setSources(rawList);
    } catch (error: any) {
      console.log('Error fetching lead sources:', error);
      Alert.alert('API Error', error?.response?.data?.message || 'Unable to fetch lead sources from server.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeadSources();
  }, []);

  // 2. Open modal for Adding
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormActive(true);
    setModalVisible(true);
  };

  // 3. Open modal for Editing
  const handleOpenEdit = (item: LeadSource) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormActive(item.status === 'Active');
    setModalVisible(true);
  };

  // 4. Save (Create or Update) via Backend API
  const handleSave = async () => {
    if (!formTitle.trim()) {
      Alert.alert('Validation Error', 'Please enter a valid source title.');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      title: formTitle.trim(),
      status: (formActive ? 'Active' : 'Inactive') as 'Active' | 'Inactive',
    };

    try {
      if (editingItem) {
        // PUT /api/lead-sources/:id
        const res = await leadSourceApi.update(editingItem.id, payload);
        if (res && res.status !== false) {
          Alert.alert('Success', res?.message || `Source "${formTitle.trim()}" updated successfully.`);
          fetchLeadSources();
          setModalVisible(false);
        } else {
          Alert.alert('Error', res?.message || 'Failed to update source.');
        }
      } else {
        // POST /api/lead-sources
        const res = await leadSourceApi.create(payload);
        if (res && res.status !== false) {
          Alert.alert('Success', res?.message || `Source "${formTitle.trim()}" created successfully.`);
          fetchLeadSources();
          setModalVisible(false);
        } else {
          Alert.alert('Error', res?.message || 'Failed to create source.');
        }
      }
    } catch (error: any) {
      console.log('Save Lead Source API error:', error);
      Alert.alert('Request Failed', error?.response?.data?.message || 'Failed to save lead source.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Delete via Backend API
  const handleDelete = (item: LeadSource) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete source "${item.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await leadSourceApi.delete(item.id);
              if (res && res.status !== false) {
                Alert.alert('Deleted', res?.message || `Source "${item.title}" has been deleted.`);
                fetchLeadSources();
              } else {
                Alert.alert('Error', res?.message || 'Failed to delete source.');
              }
            } catch (error: any) {
              console.log('Delete Lead Source API error:', error);
              Alert.alert('Error', error?.response?.data?.message || 'Failed to delete lead source.');
            }
          },
        },
      ]
    );
  };

  // Filtered List
  const filteredList = sources.filter((item) => {
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || item.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <View style={styles.container}>
      {/* 1. Search Bar & Filter Tabs */}
      <View style={styles.topBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search lead source from server..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />

        <View style={styles.filterRow}>
          {(['All', 'Active', 'Inactive'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[
                  styles.filterBtnText,
                  filter === f && styles.filterBtnTextActive,
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 2. Loading State */}
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.orange} />
          <Text style={styles.loadingText}>Fetching lead sources from API...</Text>
        </View>
      ) : (
        /* 3. Sources List with Pull-to-Refresh */
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchLeadSources(true)}
              tintColor={colors.orange}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.nameRow}>
                  <Text style={styles.icon}>{item.icon || '📢'}</Text>
                  <Text style={styles.title}>{item.title}</Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    item.status === 'Active'
                      ? styles.badgeActive
                      : styles.badgeInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      item.status === 'Active'
                        ? styles.badgeTextActive
                        : styles.badgeTextInactive,
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => handleOpenEdit(item)}
                >
                  <Text style={styles.editBtnText}>✏️ Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item)}
                >
                  <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>📢</Text>
              <Text style={styles.emptyTitle}>No Lead Sources Found</Text>
              <Text style={styles.emptyText}>
                No records returned by the API. Tap the "+ Add Source" button below to create one.
              </Text>
            </View>
          }
        />
      )}

      {/* 4. Floating Add Button */}
      <TouchableOpacity
        style={styles.fabBtn}
        onPress={handleOpenAdd}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+ Add Source</Text>
      </TouchableOpacity>

      {/* 5. Add / Edit Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!isSubmitting) setModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingItem ? 'Edit Lead Source' : 'Add New Lead Source'}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Source Title</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Meta & Instagram Ads"
                placeholderTextColor={colors.textMuted}
                value={formTitle}
                onChangeText={setFormTitle}
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.label}>Active Status</Text>
              <Switch
                value={formActive}
                onValueChange={setFormActive}
                trackColor={{ false: '#333', true: colors.primary }}
                thumbColor={formActive ? colors.orange : '#aaa'}
                disabled={isSubmitting}
              />
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, isSubmitting && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={colors.textWhite} />
                ) : (
                  <Text style={styles.saveBtnText}>Save Source</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    padding: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  searchInput: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    color: colors.textPrimary,
    fontSize: 13,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.inputBg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryHover,
  },
  filterBtnText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  filterBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  icon: {
    fontSize: 18,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeActive: {
    backgroundColor: 'rgba(22, 163, 74, 0.12)',
    borderWidth: 1,
    borderColor: colors.success,
  },
  badgeInactive: {
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  badgeTextActive: {
    color: colors.success,
  },
  badgeTextInactive: {
    color: colors.danger,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  editBtn: {
    backgroundColor: colors.inputBg,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editBtnText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  deleteBtn: {
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  deleteBtnText: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: '600',
  },
  fabBtn: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primaryHover,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    elevation: 6,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    color: colors.textPrimary,
    fontSize: 14,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 13,
  },
  saveBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primaryHover,
    minWidth: 100,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
