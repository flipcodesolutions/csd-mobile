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
import { brandApi, modelApi, variantApi } from '../lib/apiServices';

export interface Variant {
  id: number;
  brand_id?: number;
  model_id?: number;
  brand_name: string;
  model_name: string;
  name: string;
  price: string;
  status: 'Active' | 'Inactive';
}

export const VariantScreen: React.FC = () => {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([]);
  const [models, setModels] = useState<{ id: number; brand_id: number; name: string }[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Variant | null>(null);
  const [formName, setFormName] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [formPrice, setFormPrice] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Variants, Brands, Models from backend API
  const fetchVariants = async (isPullRefresh = false) => {
    if (isPullRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const [varRes, brandRes, modelRes] = await Promise.all([
        variantApi.getAll().catch(() => null),
        brandApi.getAll().catch(() => null),
        modelApi.getAll().catch(() => null),
      ]);

      const varList =
        varRes && varRes.status && Array.isArray(varRes.data)
          ? varRes.data
          : Array.isArray(varRes?.data)
          ? varRes.data
          : Array.isArray(varRes)
          ? varRes
          : [];
      setVariants(varList);

      const brandList =
        brandRes && brandRes.status && Array.isArray(brandRes.data)
          ? brandRes.data
          : Array.isArray(brandRes?.data)
          ? brandRes.data
          : Array.isArray(brandRes)
          ? brandRes
          : [];
      setBrands(brandList);

      const modelList =
        modelRes && modelRes.status && Array.isArray(modelRes.data)
          ? modelRes.data
          : Array.isArray(modelRes?.data)
          ? modelRes.data
          : Array.isArray(modelRes)
          ? modelRes
          : [];
      setModels(modelList);
    } catch (error: any) {
      console.log('Error fetching variants from API:', error);
      Alert.alert('API Error', error?.response?.data?.message || 'Unable to fetch vehicle variants from server.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVariants();
  }, []);

  // Filtered Models based on selected brand
  const filteredModels = selectedBrandId
    ? models.filter((m) => m.brand_id === selectedBrandId)
    : models;

  // 2. Open modal for Adding
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormName('');
    const defaultBrand = brands.length > 0 ? brands[0].id : null;
    setSelectedBrandId(defaultBrand);
    const availableM = defaultBrand ? models.filter((m) => m.brand_id === defaultBrand) : models;
    setSelectedModelId(availableM.length > 0 ? availableM[0].id : null);
    setFormPrice('₹');
    setFormActive(true);
    setModalVisible(true);
  };

  // 3. Open modal for Editing
  const handleOpenEdit = (item: Variant) => {
    setEditingItem(item);
    setFormName(item.name);
    setSelectedBrandId(item.brand_id || (brands.length > 0 ? brands[0].id : null));
    setSelectedModelId(item.model_id || (models.length > 0 ? models[0].id : null));
    setFormPrice(item.price);
    setFormActive(item.status === 'Active');
    setModalVisible(true);
  };

  // 4. Save (Create or Update) via Backend API
  const handleSave = async () => {
    if (!formName.trim() || !formPrice.trim()) {
      Alert.alert('Validation Error', 'Please enter variant name and price.');
      return;
    }
    if (!selectedBrandId || !selectedModelId) {
      Alert.alert('Validation Error', 'Please select both brand and model.');
      return;
    }

    setIsSubmitting(true);
    const selectedBrand = brands.find((b) => b.id === selectedBrandId);
    const selectedModel = models.find((m) => m.id === selectedModelId);

    const payload = {
      brand_id: selectedBrandId,
      model_id: selectedModelId,
      brand_name: selectedBrand ? selectedBrand.name : undefined,
      model_name: selectedModel ? selectedModel.name : undefined,
      name: formName.trim(),
      price: formPrice.trim(),
      status: (formActive ? 'Active' : 'Inactive') as 'Active' | 'Inactive',
    };

    try {
      if (editingItem) {
        // PUT /api/variants/:id
        const res = await variantApi.update(editingItem.id, payload);
        if (res && res.status !== false) {
          Alert.alert('Success', res?.message || `Variant "${formName.trim()}" updated successfully.`);
          fetchVariants();
          setModalVisible(false);
        } else {
          Alert.alert('Error', res?.message || 'Failed to update variant.');
        }
      } else {
        // POST /api/variants
        const res = await variantApi.create(payload);
        if (res && res.status !== false) {
          Alert.alert('Success', res?.message || `Variant "${formName.trim()}" created successfully.`);
          fetchVariants();
          setModalVisible(false);
        } else {
          Alert.alert('Error', res?.message || 'Failed to create variant.');
        }
      }
    } catch (error: any) {
      console.log('Save Variant API error:', error);
      Alert.alert('Request Failed', error?.response?.data?.message || 'Failed to save variant.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Delete via Backend API
  const handleDelete = (item: Variant) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete variant "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await variantApi.delete(item.id);
              if (res && res.status !== false) {
                Alert.alert('Deleted', res?.message || `Variant "${item.name}" has been removed.`);
                fetchVariants();
              } else {
                Alert.alert('Error', res?.message || 'Failed to delete variant.');
              }
            } catch (error: any) {
              console.log('Delete Variant API error:', error);
              Alert.alert('Error', error?.response?.data?.message || 'Failed to delete variant.');
            }
          },
        },
      ]
    );
  };

  // Filtered List
  const filteredList = variants.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.model_name && item.model_name.toLowerCase().includes(search.toLowerCase())) ||
      (item.brand_name && item.brand_name.toLowerCase().includes(search.toLowerCase()));
    const matchFilter = filter === 'All' || item.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <View style={styles.container}>
      {/* 1. Search Bar & Filter */}
      <View style={styles.topBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search variant, model, or brand from server..."
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
          <Text style={styles.loadingText}>Fetching vehicle variants from API...</Text>
        </View>
      ) : (
        /* 3. Variant Cards List with Pull-to-Refresh */
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchVariants(true)}
              tintColor={colors.orange}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.variantInfo}>
                  <View style={styles.tagWrap}>
                    <Text style={styles.tagText}>
                      {item.brand_name || 'Brand'} • {item.model_name || 'Model'}
                    </Text>
                  </View>
                  <Text style={styles.variantName}>{item.name}</Text>
                  <Text style={styles.priceText}>{item.price}</Text>
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
              <Text style={styles.emptyIcon}>⚡</Text>
              <Text style={styles.emptyTitle}>No Variants Found</Text>
              <Text style={styles.emptyText}>
                No vehicle variants registered on server. Tap "+ Add Variant" below to register one.
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
        <Text style={styles.fabText}>+ Add Variant</Text>
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
              {editingItem ? 'Edit Vehicle Variant' : 'Add New Variant'}
            </Text>

            {/* Brand Dropdown / Pills */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Select Brand</Text>
              {brands.length === 0 ? (
                <Text style={styles.noDataNote}>No brands found on server.</Text>
              ) : (
                <View style={styles.pillsWrap}>
                  {brands.map((b) => (
                    <TouchableOpacity
                      key={b.id}
                      style={[
                        styles.pillOption,
                        selectedBrandId === b.id && styles.pillOptionActive,
                      ]}
                      onPress={() => {
                        setSelectedBrandId(b.id);
                        const matchM = models.filter((m) => m.brand_id === b.id);
                        setSelectedModelId(matchM.length > 0 ? matchM[0].id : null);
                      }}
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

            {/* Model Dropdown / Pills */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Select Model</Text>
              {filteredModels.length === 0 ? (
                <Text style={styles.noDataNote}>
                  No models available for selected brand. Please add models first.
                </Text>
              ) : (
                <View style={styles.pillsWrap}>
                  {filteredModels.map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={[
                        styles.pillOption,
                        selectedModelId === m.id && styles.pillOptionActive,
                      ]}
                      onPress={() => setSelectedModelId(m.id)}
                      disabled={isSubmitting}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          selectedModelId === m.id && styles.pillTextActive,
                        ]}
                      >
                        {m.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Variant Title</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Turbo GT 4.0L V8"
                placeholderTextColor={colors.textMuted}
                value={formName}
                onChangeText={setFormName}
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ex-Showroom Price</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. ₹2,57,00,000"
                placeholderTextColor={colors.textMuted}
                value={formPrice}
                onChangeText={setFormPrice}
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
                  <Text style={styles.saveBtnText}>Save Variant</Text>
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  variantInfo: {
    flex: 1,
    gap: 4,
  },
  tagWrap: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F2E8',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: 'bold',
  },
  variantName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 2,
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 2,
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
    borderColor: colors.primaryHover,
  },
  pillText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
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
