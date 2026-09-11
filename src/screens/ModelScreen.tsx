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
import { brandApi, modelApi } from '../lib/apiServices';

export interface CarModel {
  id: number;
  brand_id: number;
  brand_name: string;
  name: string;
  vehicle_segment: '4 Wheeler' | '2 Wheeler';
  status: 'Active' | 'Inactive';
}

export interface BrandOption {
  id: number;
  name: string;
}

export const ModelScreen: React.FC = () => {
  const [models, setModels] = useState<CarModel[]>([]);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<'All' | '4 Wheeler' | '2 Wheeler'>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<CarModel | null>(null);
  const [formName, setFormName] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [formSegment, setFormSegment] = useState<'4 Wheeler' | '2 Wheeler'>('4 Wheeler');
  const [formActive, setFormActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch models & brands from backend API
  const fetchModelsAndBrands = async (isPullRefresh = false) => {
    if (isPullRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const [modelsRes, brandsRes] = await Promise.all([
        modelApi.getAll().catch(() => null),
        brandApi.getAll().catch(() => null),
      ]);

      const modelsList =
        modelsRes && modelsRes.status && Array.isArray(modelsRes.data)
          ? modelsRes.data
          : Array.isArray(modelsRes?.data)
          ? modelsRes.data
          : Array.isArray(modelsRes)
          ? modelsRes
          : [];
      setModels(modelsList);

      const brandsList =
        brandsRes && brandsRes.status && Array.isArray(brandsRes.data)
          ? brandsRes.data
          : Array.isArray(brandsRes?.data)
          ? brandsRes.data
          : Array.isArray(brandsRes)
          ? brandsRes
          : [];
      setBrands(brandsList);
    } catch (error: any) {
      console.log('Error fetching vehicle models/brands:', error);
      Alert.alert('API Error', error?.response?.data?.message || 'Unable to fetch vehicle models from server.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchModelsAndBrands();
  }, []);

  // 2. Open modal for Adding
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormName('');
    setSelectedBrandId(brands.length > 0 ? brands[0].id : null);
    setFormSegment('4 Wheeler');
    setFormActive(true);
    setModalVisible(true);
  };

  // 3. Open modal for Editing
  const handleOpenEdit = (item: CarModel) => {
    setEditingItem(item);
    setFormName(item.name);
    setSelectedBrandId(item.brand_id || (brands.length > 0 ? brands[0].id : null));
    setFormSegment(item.vehicle_segment);
    setFormActive(item.status === 'Active');
    setModalVisible(true);
  };

  // 4. Save (Create or Update) via Backend API
  const handleSave = async () => {
    if (!formName.trim()) {
      Alert.alert('Validation Error', 'Please enter a model name.');
      return;
    }
    if (!selectedBrandId) {
      Alert.alert('Validation Error', 'Please select a brand.');
      return;
    }

    setIsSubmitting(true);
    const selectedBrand = brands.find((b) => b.id === selectedBrandId);
    const payload = {
      brand_id: selectedBrandId,
      brand_name: selectedBrand ? selectedBrand.name : undefined,
      name: formName.trim(),
      vehicle_segment: formSegment,
      status: (formActive ? 'Active' : 'Inactive') as 'Active' | 'Inactive',
    };

    try {
      if (editingItem) {
        // PUT /api/models/:id
        const res = await modelApi.update(editingItem.id, payload);
        if (res && res.status !== false) {
          Alert.alert('Success', res?.message || `Model "${formName.trim()}" updated successfully.`);
          fetchModelsAndBrands();
          setModalVisible(false);
        } else {
          Alert.alert('Error', res?.message || 'Failed to update model.');
        }
      } else {
        // POST /api/models
        const res = await modelApi.create(payload);
        if (res && res.status !== false) {
          Alert.alert('Success', res?.message || `Model "${formName.trim()}" created successfully.`);
          fetchModelsAndBrands();
          setModalVisible(false);
        } else {
          Alert.alert('Error', res?.message || 'Failed to create model.');
        }
      }
    } catch (error: any) {
      console.log('Save Model API error:', error);
      Alert.alert('Request Failed', error?.response?.data?.message || 'Failed to save model.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Delete via Backend API
  const handleDelete = (item: CarModel) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete model "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await modelApi.delete(item.id);
              if (res && res.status !== false) {
                Alert.alert('Deleted', res?.message || `Model "${item.name}" has been deleted.`);
                fetchModelsAndBrands();
              } else {
                Alert.alert('Error', res?.message || 'Failed to delete model.');
              }
            } catch (error: any) {
              console.log('Delete Model API error:', error);
              Alert.alert('Error', error?.response?.data?.message || 'Failed to delete model.');
            }
          },
        },
      ]
    );
  };

  // Filtered List
  const filteredList = models.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.brand_name && item.brand_name.toLowerCase().includes(search.toLowerCase()));
    const matchSegment =
      segmentFilter === 'All' || item.vehicle_segment === segmentFilter;
    return matchSearch && matchSegment;
  });

  return (
    <View style={styles.container}>
      {/* 1. Search Bar & Segment Filter */}
      <View style={styles.topBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search model or brand from server..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />

        <View style={styles.filterRow}>
          {(['All', '4 Wheeler', '2 Wheeler'] as const).map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.filterBtn,
                segmentFilter === s && styles.filterBtnActive,
              ]}
              onPress={() => setSegmentFilter(s)}
            >
              <Text
                style={[
                  styles.filterBtnText,
                  segmentFilter === s && styles.filterBtnTextActive,
                ]}
              >
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 2. Loading State */}
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.orange} />
          <Text style={styles.loadingText}>Fetching vehicle models from API...</Text>
        </View>
      ) : (
        /* 3. Model Cards List with Pull-to-Refresh */
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchModelsAndBrands(true)}
              tintColor={colors.orange}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.modelInfo}>
                  <View style={styles.tagsRow}>
                    <View style={styles.brandTag}>
                      <Text style={styles.brandTagText}>
                        {item.brand_name || 'Brand'}
                      </Text>
                    </View>
                    <View style={styles.segmentTag}>
                      <Text style={styles.segmentTagText}>
                        {item.vehicle_segment === '4 Wheeler' ? '🚗 4W' : '🏍️ 2W'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.modelName}>{item.name}</Text>
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
              <Text style={styles.emptyIcon}>🚗</Text>
              <Text style={styles.emptyTitle}>No Vehicle Models Found</Text>
              <Text style={styles.emptyText}>
                No models registered on server. Tap "+ Add Model" below to register one.
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
        <Text style={styles.fabText}>+ Add Model</Text>
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
              {editingItem ? 'Edit Vehicle Model' : 'Add New Model'}
            </Text>

            {/* Brand Picker (Pills) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Select Brand</Text>
              {brands.length === 0 ? (
                <Text style={styles.noDataNote}>
                  No brands available. Please add brands first.
                </Text>
              ) : (
                <View style={styles.pillsWrap}>
                  {brands.map((b) => (
                    <TouchableOpacity
                      key={b.id}
                      style={[
                        styles.pillOption,
                        selectedBrandId === b.id && styles.pillOptionActive,
                      ]}
                      onPress={() => setSelectedBrandId(b.id)}
                      disabled={isSubmitting}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          selectedBrandId === b.id && styles.pillTextActive,
                        ]}
                      >
                        {b.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Model Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. E-Class Sedan"
                placeholderTextColor={colors.textMuted}
                value={formName}
                onChangeText={setFormName}
                editable={!isSubmitting}
              />
            </View>

            {/* Segment Toggle */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Vehicle Segment</Text>
              <View style={styles.segmentToggleRow}>
                <TouchableOpacity
                  style={[
                    styles.segToggleBtn,
                    formSegment === '4 Wheeler' && styles.segToggleBtnActive,
                  ]}
                  onPress={() => setFormSegment('4 Wheeler')}
                  disabled={isSubmitting}
                >
                  <Text
                    style={[
                      styles.segToggleText,
                      formSegment === '4 Wheeler' && styles.segToggleTextActive,
                    ]}
                  >
                    🚗 4 Wheeler
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.segToggleBtn,
                    formSegment === '2 Wheeler' && styles.segToggleBtnActive,
                  ]}
                  onPress={() => setFormSegment('2 Wheeler')}
                  disabled={isSubmitting}
                >
                  <Text
                    style={[
                      styles.segToggleText,
                      formSegment === '2 Wheeler' && styles.segToggleTextActive,
                    ]}
                  >
                    🏍️ 2 Wheeler
                  </Text>
                </TouchableOpacity>
              </View>
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
                  <Text style={styles.saveBtnText}>Save Model</Text>
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
    color: colors.textWhite,
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
    color: colors.textWhite,
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
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modelInfo: {
    flex: 1,
    gap: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  brandTag: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  brandTagText: {
    fontSize: 11,
    color: colors.orange,
    fontWeight: 'bold',
  },
  segmentTag: {
    backgroundColor: 'rgba(63, 73, 18, 0.4)',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  segmentTagText: {
    fontSize: 10,
    color: colors.textLight,
    fontWeight: '600',
  },
  modelName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textWhite,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeActive: {
    backgroundColor: 'rgba(0, 131, 24, 0.2)',
    borderWidth: 1,
    borderColor: colors.green,
  },
  badgeInactive: {
    backgroundColor: 'rgba(214, 69, 69, 0.2)',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  badgeTextActive: {
    color: '#88ff99',
  },
  badgeTextInactive: {
    color: '#ff9999',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.inputBg,
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
    color: colors.textLight,
    fontWeight: '600',
  },
  deleteBtn: {
    backgroundColor: 'rgba(214, 69, 69, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  deleteBtnText: {
    fontSize: 12,
    color: '#ff9999',
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
    color: colors.textWhite,
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
    color: colors.textWhite,
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
    backgroundColor: 'rgba(0,0,0,0.8)',
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
    color: colors.textWhite,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 6,
  },
  noDataNote: {
    color: colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pillOption: {
    backgroundColor: colors.inputBg,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.orange,
  },
  pillText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  pillTextActive: {
    color: colors.textWhite,
    fontWeight: 'bold',
  },
  modalInput: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    color: colors.textWhite,
    fontSize: 14,
  },
  segmentToggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.inputBg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  segToggleBtnActive: {
    backgroundColor: 'rgba(63, 73, 18, 0.4)',
    borderColor: colors.orange,
  },
  segToggleText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  segToggleTextActive: {
    color: colors.textWhite,
    fontWeight: 'bold',
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
    color: colors.textWhite,
    fontWeight: 'bold',
    fontSize: 13,
  },
});
