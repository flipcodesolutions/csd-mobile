import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { colors } from '../colors';
import { brandApi, leadApi, leadSourceApi, leadStatusApi } from '../lib/apiServices';

export interface CustomerLead {
  id: number;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  state?: string;
  vehicle_segment: '2 Wheeler' | '4 Wheeler';
  brand_id?: number;
  brand_name?: string;
  model_variant: string;
  priority: 'Hot' | 'Warm' | 'Cold';
  purchase_timeline?: string;
  source_id?: number;
  source_name?: string;
  status_id?: number;
  status_name?: string;
  assigned_user_name?: string;
}

export const LeadsScreen: React.FC = () => {
  const [leads, setLeads] = useState<CustomerLead[]>([]);
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([]);
  const [sources, setSources] = useState<{ id: number; title: string }[]>([]);
  const [statuses, setStatuses] = useState<{ id: number; name: string }[]>([]);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'All' | 'Hot' | 'Warm' | 'Cold'>('All');
  const [segmentFilter, setSegmentFilter] = useState<'All' | '4 Wheeler' | '2 Wheeler'>('All');

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<CustomerLead | null>(null);
  const [viewingItem, setViewingItem] = useState<CustomerLead | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formModelVariant, setFormModelVariant] = useState('');
  const [formPriority, setFormPriority] = useState<'Hot' | 'Warm' | 'Cold'>('Hot');
  const [formSegment, setFormSegment] = useState<'4 Wheeler' | '2 Wheeler'>('4 Wheeler');
  const [formTimeline, setFormTimeline] = useState('Immediate (Within 7 Days)');
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
  const [selectedStatusId, setSelectedStatusId] = useState<number | null>(null);

  // 1. Fetch Leads and Master Dropdowns from API
  const fetchLeads = async (isPullRefresh = false) => {
    if (isPullRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const [leadsRes, brandsRes, sourcesRes, statusesRes] = await Promise.all([
        leadApi.getAll().catch(() => null),
        brandApi.getAll().catch(() => null),
        leadSourceApi.getAll().catch(() => null),
        leadStatusApi.getAll().catch(() => null),
      ]);

      const leadsList =
        leadsRes && leadsRes.status && Array.isArray(leadsRes.data)
          ? leadsRes.data
          : Array.isArray(leadsRes?.data)
          ? leadsRes.data
          : Array.isArray(leadsRes)
          ? leadsRes
          : [];
      setLeads(leadsList);

      const brandList =
        brandsRes && brandsRes.status && Array.isArray(brandsRes.data)
          ? brandsRes.data
          : Array.isArray(brandsRes?.data)
          ? brandsRes.data
          : Array.isArray(brandsRes)
          ? brandsRes
          : [];
      setBrands(brandList);

      const sourceList =
        sourcesRes && sourcesRes.status && Array.isArray(sourcesRes.data)
          ? sourcesRes.data
          : Array.isArray(sourcesRes?.data)
          ? sourcesRes.data
          : Array.isArray(sourcesRes)
          ? sourcesRes
          : [];
      setSources(sourceList);

      const statusList =
        statusesRes && statusesRes.status && Array.isArray(statusesRes.data)
          ? statusesRes.data
          : Array.isArray(statusesRes?.data)
          ? statusesRes.data
          : Array.isArray(statusesRes)
          ? statusesRes
          : [];
      setStatuses(statusList);
    } catch (error: any) {
      console.log('Error fetching leads:', error);
      Alert.alert('API Error', error?.response?.data?.message || 'Unable to fetch customer leads from server.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // 2. Open modal for Adding
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormCity('');
    setFormModelVariant('');
    setFormPriority('Hot');
    setFormSegment('4 Wheeler');
    setFormTimeline('Immediate (Within 7 Days)');
    setSelectedBrandId(brands.length > 0 ? brands[0].id : null);
    setSelectedSourceId(sources.length > 0 ? sources[0].id : null);
    setSelectedStatusId(statuses.length > 0 ? statuses[0].id : null);
    setModalVisible(true);
  };

  // 3. Open modal for Editing
  const handleOpenEdit = (item: CustomerLead) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormPhone(item.phone);
    setFormEmail(item.email || '');
    setFormCity(item.city || '');
    setFormModelVariant(item.model_variant);
    setFormPriority(item.priority);
    setFormSegment(item.vehicle_segment);
    setFormTimeline(item.purchase_timeline || 'Immediate (Within 7 Days)');
    setSelectedBrandId(item.brand_id || (brands.length > 0 ? brands[0].id : null));
    setSelectedSourceId(item.source_id || (sources.length > 0 ? sources[0].id : null));
    setSelectedStatusId(item.status_id || (statuses.length > 0 ? statuses[0].id : null));
    setModalVisible(true);
  };

  // 4. Save (Create or Update) via Backend API
  const handleSave = async () => {
    if (!formName.trim() || !formPhone.trim() || !formModelVariant.trim()) {
      Alert.alert('Validation Error', 'Please fill customer name, phone, and vehicle model.');
      return;
    }

    setIsSubmitting(true);
    const selectedBrand = brands.find((b) => b.id === selectedBrandId);
    const selectedSource = sources.find((s) => s.id === selectedSourceId);
    const selectedStatus = statuses.find((s) => s.id === selectedStatusId);

    const payload = {
      name: formName.trim(),
      phone: formPhone.trim(),
      email: formEmail.trim() || undefined,
      city: formCity.trim() || undefined,
      vehicle_segment: formSegment,
      brand_id: selectedBrandId || undefined,
      brand_name: selectedBrand ? selectedBrand.name : undefined,
      model_variant: formModelVariant.trim(),
      priority: formPriority,
      purchase_timeline: formTimeline,
      source_id: selectedSourceId || undefined,
      source_name: selectedSource ? selectedSource.title : undefined,
      status_id: selectedStatusId || undefined,
      status_name: selectedStatus ? selectedStatus.name : 'New Inquiry',
    };

    try {
      if (editingItem) {
        // PUT /api/leads/:id
        const res = await leadApi.update(editingItem.id, payload);
        if (res && res.status !== false) {
          Alert.alert('Success', res?.message || `Lead for "${formName.trim()}" updated successfully.`);
          fetchLeads();
          setModalVisible(false);
        } else {
          Alert.alert('Error', res?.message || 'Failed to update lead.');
        }
      } else {
        // POST /api/leads
        const res = await leadApi.create(payload);
        if (res && res.status !== false) {
          Alert.alert('Success', res?.message || `New Lead for "${formName.trim()}" created successfully.`);
          fetchLeads();
          setModalVisible(false);
        } else {
          Alert.alert('Error', res?.message || 'Failed to create lead.');
        }
      }
    } catch (error: any) {
      console.log('Save Lead API error:', error);
      Alert.alert('Request Failed', error?.response?.data?.message || 'Failed to save customer lead.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Delete via Backend API
  const handleDelete = (item: CustomerLead) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete lead for "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await leadApi.delete(item.id);
              if (res && res.status !== false) {
                Alert.alert('Deleted', res?.message || `Lead for "${item.name}" has been deleted.`);
                fetchLeads();
              } else {
                Alert.alert('Error', res?.message || 'Failed to delete lead.');
              }
            } catch (error: any) {
              console.log('Delete Lead API error:', error);
              Alert.alert('Error', error?.response?.data?.message || 'Failed to delete lead.');
            }
          },
        },
      ]
    );
  };

  // Filtered List
  const filteredList = leads.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.phone.includes(search) ||
      (item.model_variant && item.model_variant.toLowerCase().includes(search.toLowerCase())) ||
      (item.brand_name && item.brand_name.toLowerCase().includes(search.toLowerCase()));
    const matchPriority = priorityFilter === 'All' || item.priority === priorityFilter;
    const matchSegment = segmentFilter === 'All' || item.vehicle_segment === segmentFilter;
    return matchSearch && matchPriority && matchSegment;
  });

  return (
    <View style={styles.container}>
      {/* 1. Search Bar & Filter Rows */}
      <View style={styles.topBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search customer name, phone, vehicle..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />

        {/* Priority Filter */}
        <View style={styles.filterRow}>
          {(['All', 'Hot', 'Warm', 'Cold'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.filterBtn, priorityFilter === p && styles.filterBtnActive]}
              onPress={() => setPriorityFilter(p)}
            >
              <Text
                style={[
                  styles.filterBtnText,
                  priorityFilter === p && styles.filterBtnTextActive,
                ]}
              >
                {p === 'Hot' ? '🔥 Hot' : p === 'Warm' ? '⚡ Warm' : p === 'Cold' ? '❄️ Cold' : 'All'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 2. Loading State */}
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.orange} />
          <Text style={styles.loadingText}>Fetching customer leads from API...</Text>
        </View>
      ) : (
        /* 3. Leads List with Pull-to-Refresh */
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchLeads(true)}
              tintColor={colors.orange}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.headerInfo}>
                  <View style={styles.badgeRow}>
                    <View
                      style={[
                        styles.priorityBadge,
                        item.priority === 'Hot'
                          ? styles.priorityHot
                          : item.priority === 'Warm'
                          ? styles.priorityWarm
                          : styles.priorityCold,
                      ]}
                    >
                      <Text style={styles.priorityText}>
                        {item.priority === 'Hot'
                          ? '🔥 HOT'
                          : item.priority === 'Warm'
                          ? '⚡ WARM'
                          : '❄️ COLD'}
                      </Text>
                    </View>

                    <View style={styles.segmentBadge}>
                      <Text style={styles.segmentText}>
                        {item.vehicle_segment === '4 Wheeler' ? '🚗 4W' : '🏍️ 2W'}
                      </Text>
                    </View>

                    {item.status_name && (
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>{item.status_name}</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.customerName}>{item.name}</Text>
                  <Text style={styles.vehicleReq}>
                    🚗 {item.brand_name ? `${item.brand_name} ` : ''}
                    {item.model_variant}
                  </Text>
                </View>
              </View>

              {/* Lead Details Info Row */}
              <View style={styles.detailRow}>
                <Text style={styles.contactItem}>📞 {item.phone}</Text>
                {item.city && <Text style={styles.contactItem}>📍 {item.city}</Text>}
                {item.source_name && (
                  <Text style={styles.contactItem}>📢 {item.source_name}</Text>
                )}
              </View>

              {/* Actions */}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.viewBtn}
                  onPress={() => setViewingItem(item)}
                >
                  <Text style={styles.viewBtnText}>👁️ View</Text>
                </TouchableOpacity>

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
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={styles.emptyTitle}>No Customer Leads Found</Text>
              <Text style={styles.emptyText}>
                No leads found on server. Tap "+ Add Lead" below to create a new customer lead.
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
        <Text style={styles.fabText}>+ Add Lead</Text>
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
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Edit Customer Lead' : 'Create New Lead'}
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Customer Full Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Vikramaditya Rathore"
                  placeholderTextColor={colors.textMuted}
                  value={formName}
                  onChangeText={setFormName}
                  editable={!isSubmitting}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="+91 98765 43210"
                  placeholderTextColor={colors.textMuted}
                  value={formPhone}
                  onChangeText={setFormPhone}
                  keyboardType="phone-pad"
                  editable={!isSubmitting}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="customer@gmail.com"
                  placeholderTextColor={colors.textMuted}
                  value={formEmail}
                  onChangeText={setFormEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isSubmitting}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>City / Location</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. New Delhi"
                  placeholderTextColor={colors.textMuted}
                  value={formCity}
                  onChangeText={setFormCity}
                  editable={!isSubmitting}
                />
              </View>

              {/* Vehicle Segment */}
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

              {/* Brand Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Select Brand</Text>
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
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Model / Variant Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. E 200 Exclusive or Cayenne Turbo"
                  placeholderTextColor={colors.textMuted}
                  value={formModelVariant}
                  onChangeText={setFormModelVariant}
                  editable={!isSubmitting}
                />
              </View>

              {/* Priority */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Lead Priority</Text>
                <View style={styles.priorityRow}>
                  {(['Hot', 'Warm', 'Cold'] as const).map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.priorityOption,
                        formPriority === p && styles.priorityOptionActive,
                      ]}
                      onPress={() => setFormPriority(p)}
                      disabled={isSubmitting}
                    >
                      <Text
                        style={[
                          styles.priorityOptionText,
                          formPriority === p && styles.priorityOptionTextActive,
                        ]}
                      >
                        {p === 'Hot' ? '🔥 Hot' : p === 'Warm' ? '⚡ Warm' : '❄️ Cold'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Lead Source */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Lead Source</Text>
                <View style={styles.pillsWrap}>
                  {sources.map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      style={[
                        styles.pillOption,
                        selectedSourceId === s.id && styles.pillOptionActive,
                      ]}
                      onPress={() => setSelectedSourceId(s.id)}
                      disabled={isSubmitting}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          selectedSourceId === s.id && styles.pillTextActive,
                        ]}
                      >
                        {s.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Status */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Current Status</Text>
                <View style={styles.pillsWrap}>
                  {statuses.map((st) => (
                    <TouchableOpacity
                      key={st.id}
                      style={[
                        styles.pillOption,
                        selectedStatusId === st.id && styles.pillOptionActive,
                      ]}
                      onPress={() => setSelectedStatusId(st.id)}
                      disabled={isSubmitting}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          selectedStatusId === st.id && styles.pillTextActive,
                        ]}
                      >
                        {st.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
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
                    <Text style={styles.saveBtnText}>Save Lead</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* 6. View Details Modal */}
      <Modal
        visible={!!viewingItem}
        transparent
        animationType="fade"
        onRequestClose={() => setViewingItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {viewingItem && (
              <>
                <Text style={styles.modalTitle}>👤 Lead Overview</Text>

                <View style={styles.viewRow}>
                  <Text style={styles.viewLabel}>Customer:</Text>
                  <Text style={styles.viewVal}>{viewingItem.name}</Text>
                </View>

                <View style={styles.viewRow}>
                  <Text style={styles.viewLabel}>Phone:</Text>
                  <Text style={styles.viewVal}>{viewingItem.phone}</Text>
                </View>

                {viewingItem.email && (
                  <View style={styles.viewRow}>
                    <Text style={styles.viewLabel}>Email:</Text>
                    <Text style={styles.viewVal}>{viewingItem.email}</Text>
                  </View>
                )}

                <View style={styles.viewRow}>
                  <Text style={styles.viewLabel}>Vehicle Interest:</Text>
                  <Text style={styles.viewVal}>
                    {viewingItem.brand_name ? `${viewingItem.brand_name} ` : ''}
                    {viewingItem.model_variant}
                  </Text>
                </View>

                <View style={styles.viewRow}>
                  <Text style={styles.viewLabel}>Priority:</Text>
                  <Text style={styles.viewVal}>{viewingItem.priority}</Text>
                </View>

                <View style={styles.viewRow}>
                  <Text style={styles.viewLabel}>Source:</Text>
                  <Text style={styles.viewVal}>{viewingItem.source_name || 'Direct'}</Text>
                </View>

                <View style={styles.viewRow}>
                  <Text style={styles.viewLabel}>Status:</Text>
                  <Text style={styles.viewVal}>{viewingItem.status_name || 'New'}</Text>
                </View>

                <TouchableOpacity
                  style={[styles.saveBtn, { marginTop: 20, alignSelf: 'flex-end' }]}
                  onPress={() => setViewingItem(null)}
                >
                  <Text style={styles.saveBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
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
    gap: 6,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 5,
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
    fontSize: 11,
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
    marginBottom: 8,
  },
  headerInfo: {
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  priorityHot: {
    backgroundColor: 'rgba(238, 104, 0, 0.25)',
    borderColor: colors.orange,
  },
  priorityWarm: {
    backgroundColor: 'rgba(217, 154, 0, 0.25)',
    borderColor: colors.warning,
  },
  priorityCold: {
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    borderColor: '#3b82f6',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
  segmentBadge: {
    backgroundColor: 'rgba(63, 73, 18, 0.4)',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  segmentText: {
    fontSize: 10,
    color: colors.textLight,
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },
  customerName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
  vehicleReq: {
    fontSize: 13,
    color: colors.orange,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.inputBg,
    marginTop: 4,
  },
  contactItem: {
    fontSize: 11,
    color: colors.textMuted,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.inputBg,
    paddingTop: 8,
  },
  viewBtn: {
    backgroundColor: colors.inputBg,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  viewBtnText: {
    fontSize: 11,
    color: colors.textLight,
    fontWeight: '600',
  },
  editBtn: {
    backgroundColor: colors.inputBg,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editBtnText: {
    fontSize: 11,
    color: colors.textLight,
    fontWeight: '600',
  },
  deleteBtn: {
    backgroundColor: 'rgba(214, 69, 69, 0.15)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  deleteBtnText: {
    fontSize: 11,
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
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalScroll: {
    width: '100%',
    maxWidth: 400,
  },
  modalScrollContent: {
    paddingVertical: 20,
  },
  modalContent: {
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
    marginBottom: 12,
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
    height: 42,
    color: colors.textWhite,
    fontSize: 13,
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
  priorityRow: {
    flexDirection: 'row',
    gap: 6,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.inputBg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  priorityOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.orange,
  },
  priorityOptionText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  priorityOptionTextActive: {
    color: colors.textWhite,
    fontWeight: 'bold',
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
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
  viewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBg,
  },
  viewLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  viewVal: {
    fontSize: 13,
    color: colors.textWhite,
    fontWeight: 'bold',
  },
});
