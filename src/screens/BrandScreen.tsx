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
import { brandApi } from '../lib/apiServices';

export interface Brand {
  id: number;
  name: string;
  vehicle_type: string[]; // ["4 Wheeler", "2 Wheeler"]
  status: 'Active' | 'Inactive';
  logoText?: string;
}

export const BrandScreen: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | '4 Wheeler' | '2 Wheeler'>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Brand | null>(null);
  const [formName, setFormName] = useState('');
  const [formTypes, setFormTypes] = useState<string[]>(['4 Wheeler']);
  const [formActive, setFormActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch brands from backend API
  const fetchBrands = async (isPullRefresh = false) => {
    if (isPullRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await brandApi.getAll();
      const rawList = res && res.status && Array.isArray(res.data)
        ? res.data
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];

      // Parse vehicle_type if stringified in database
      const parsedBrands = rawList.map((b: any) => {
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
          ...b,
          vehicle_type: vt,
        };
      });
      setBrands(parsedBrands);
    } catch (error: any) {
      console.log('Error fetching brands:', error);
      Alert.alert('API Error', error?.response?.data?.message || 'Unable to fetch vehicle brands from server.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  // 2. Open modal for Adding
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormName('');
    setFormTypes(['4 Wheeler']);
    setFormActive(true);
    setModalVisible(true);
  };

  // 3. Open modal for Editing
  const handleOpenEdit = (item: Brand) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormTypes(item.vehicle_type || ['4 Wheeler']);
    setFormActive(item.status === 'Active');
    setModalVisible(true);
  };

  // Toggle vehicle type checkbox
  const toggleVehicleType = (type: string) => {
    setFormTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // 4. Save (Create or Update) via Backend API
  const handleSave = async () => {
    if (!formName.trim()) {
      Alert.alert('Validation Error', 'Please enter a brand name.');
      return;
    }
    if (formTypes.length === 0) {
      Alert.alert('Validation Error', 'Select at least one vehicle category (4W or 2W).');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      name: formName.trim(),
      vehicle_type: formTypes,
      status: (formActive ? 'Active' : 'Inactive') as 'Active' | 'Inactive',
    };

    try {
      if (editingItem) {
        // PUT /api/brands/:id
        const res = await brandApi.update(editingItem.id, payload);
        if (res && res.status !== false) {
          Alert.alert('Success', res?.message || `Brand "${formName.trim()}" updated successfully.`);
          fetchBrands();
          setModalVisible(false);
        } else {
          Alert.alert('Error', res?.message || 'Failed to update brand.');
        }
      } else {
        // POST /api/brands
        const res = await brandApi.create(payload);
        if (res && res.status !== false) {
          Alert.alert('Success', res?.message || `Brand "${formName.trim()}" created successfully.`);
          fetchBrands();
          setModalVisible(false);
        } else {
          Alert.alert('Error', res?.message || 'Failed to create brand.');
        }
      }
    } catch (error: any) {
      console.log('Save Brand API error:', error);
      Alert.alert('Request Failed', error?.response?.data?.message || 'Failed to save brand.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Delete via Backend API
  const handleDelete = (item: Brand) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete brand "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await brandApi.delete(item.id);
              if (res && res.status !== false) {
                Alert.alert('Deleted', res?.message || `Brand "${item.name}" has been removed.`);
                fetchBrands();
              } else {
                Alert.alert('Error', res?.message || 'Failed to delete brand.');
              }
            } catch (error: any) {
              console.log('Delete Brand API error:', error);
              Alert.alert('Error', error?.response?.data?.message || 'Failed to delete brand.');
            }
          },
        },
      ]
    );
  };

  // Filtered List
  const filteredList = brands.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchType =
      typeFilter === 'All' || item.vehicle_type?.includes(typeFilter);
    return matchSearch && matchType;
  });

  return (
    <View style={styles.container}>
      {/* 1. Search Bar & Vehicle Segment Filter Tabs */}
      <View style={styles.topBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search brand from server..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />

        <View style={styles.filterRow}>
          {(['All', '4 Wheeler', '2 Wheeler'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, typeFilter === f && styles.filterBtnActive]}
              onPress={() => setTypeFilter(f)}
            >
              <Text
                style={[
                  styles.filterBtnText,
                  typeFilter === f && styles.filterBtnTextActive,
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
          <Text style={styles.loadingText}>Fetching vehicle brands from API...</Text>
        </View>
      ) : (
        /* 3. Brand Cards List with Pull-to-Refresh */
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchBrands(true)}
              tintColor={colors.orange}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.brandRow}>
                  <View style={styles.logoBadge}>
                    <Text style={styles.logoText}>
                      {item.name.slice(0, 3).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.brandInfo}>
                    <Text style={styles.brandTitle}>{item.name}</Text>
                    <View style={styles.typeTagsRow}>
                      {item.vehicle_type?.map((t) => (
                        <View key={t} style={styles.typeTag}>
                          <Text style={styles.typeTagText}>
                            {t === '4 Wheeler' ? '🚗 4W' : '🏍️ 2W'}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
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
              <Text style={styles.emptyIcon}>🏷️</Text>
              <Text style={styles.emptyTitle}>No Brands Found</Text>
              <Text style={styles.emptyText}>
                No vehicle brands found on server. Tap "+ Add Brand" below to register one.
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
        <Text style={styles.fabText}>+ Add Brand</Text>
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
              {editingItem ? 'Edit Brand' : 'Add New Brand'}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Brand Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Porsche or Ducati"
                placeholderTextColor={colors.textMuted}
                value={formName}
                onChangeText={setFormName}
                editable={!isSubmitting}
              />
            </View>

            {/* Category Checkboxes */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Vehicle Segments</Text>
              <View style={styles.checkRow}>
                <TouchableOpacity
                  style={[
                    styles.checkOption,
                    formTypes.includes('4 Wheeler') && styles.checkOptionActive,
                  ]}
                  onPress={() => toggleVehicleType('4 Wheeler')}
                  disabled={isSubmitting}
                >
                  <Text
                    style={[
                      styles.checkText,
                      formTypes.includes('4 Wheeler') && styles.checkTextActive,
                    ]}
                  >
                    🚗 4 Wheeler (Cars / SUVs)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.checkOption,
                    formTypes.includes('2 Wheeler') && styles.checkOptionActive,
                  ]}
                  onPress={() => toggleVehicleType('2 Wheeler')}
                  disabled={isSubmitting}
                >
                  <Text
                    style={[
                      styles.checkText,
                      formTypes.includes('2 Wheeler') && styles.checkTextActive,
                    ]}
                  >
                    🏍️ 2 Wheeler (Superbikes)
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
                  <Text style={styles.saveBtnText}>Save Brand</Text>
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.orange,
  },
  brandInfo: {
    flex: 1,
    gap: 4,
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
  typeTagsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  typeTag: {
    backgroundColor: 'rgba(63, 73, 18, 0.4)',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeTagText: {
    fontSize: 10,
    color: colors.textLight,
    fontWeight: '600',
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
  checkRow: {
    gap: 8,
  },
  checkOption: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    borderRadius: 8,
  },
  checkOptionActive: {
    backgroundColor: 'rgba(63, 73, 18, 0.4)',
    borderColor: colors.orange,
  },
  checkText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  checkTextActive: {
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
