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
import { Edit2, Trash2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../core/theme/colors';
import { triggerHaptic } from '../../core/utils/haptics';
import { exportCsvToFile } from '../../core/utils/csvExporter';
import { FabSpeedDial } from '../../shared';
import { userApi } from './masterService';

export interface UserMaster {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: 'Active' | 'Inactive';
}

const ROLES = [
  'Super Admin',
  'Sales Manager',
  'Sales Executive',
  'Receptionist',
  'Accountant',
];

export const UserMasterScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState<UserMaster[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<UserMaster | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('Sales Executive');
  const [formActive, setFormActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch users from backend API
  const fetchUsers = async (isPullRefresh = false) => {
    if (isPullRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await userApi.getAll();
      const rawList =
        res && res.status && Array.isArray(res.data)
          ? res.data
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];
      setUsers(rawList);
    } catch (error: any) {
      console.log('Error fetching users from API:', error);
      Alert.alert('API Error', error?.response?.data?.message || 'Unable to fetch user master from server.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 2. Open modal for Adding
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormPassword('Password@123');
    setFormRole('Sales Executive');
    setFormActive(true);
    setModalVisible(true);
  };

  // 3. Open modal for Editing
  const handleOpenEdit = (item: UserMaster) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormEmail(item.email);
    setFormPhone(item.phone);
    setFormPassword('');
    setFormRole(item.role);
    setFormActive(item.status === 'Active');
    setModalVisible(true);
  };

  // 4. Save (Create or Update) via Backend API
  const handleSave = async () => {
    if (!formName.trim() || !formEmail.trim() || !formPhone.trim()) {
      Alert.alert('Validation Error', 'Please fill name, email, and phone.');
      return;
    }

    setIsSubmitting(true);
    const payload: any = {
      name: formName.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim(),
      role: formRole,
      status: (formActive ? 'Active' : 'Inactive') as 'Active' | 'Inactive',
    };

    if (!editingItem && formPassword.trim()) {
      payload.password = formPassword.trim();
    }

    try {
      if (editingItem) {
        // PUT /api/users/:id
        const res = await userApi.update(editingItem.id, payload);
        if (res && res.status !== false) {
          Alert.alert('Success', res?.message || `Staff user "${formName.trim()}" updated.`);
          fetchUsers();
          setModalVisible(false);
        } else {
          Alert.alert('Error', res?.message || 'Failed to update user.');
        }
      } else {
        // POST /api/users
        const res = await userApi.create(payload);
        if (res && res.status !== false) {
          Alert.alert('Success', res?.message || `Staff user "${formName.trim()}" created successfully.`);
          fetchUsers();
          setModalVisible(false);
        } else {
          Alert.alert('Error', res?.message || 'Failed to create user.');
        }
      }
    } catch (error: any) {
      console.log('Save User API error:', error);
      Alert.alert('Request Failed', error?.response?.data?.message || 'Failed to save staff user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Delete via Backend API
  const handleDelete = (item: UserMaster) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to remove staff member "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await userApi.delete(item.id);
              if (res && res.status !== false) {
                Alert.alert('Deleted', res?.message || `User "${item.name}" has been removed.`);
                fetchUsers();
              } else {
                Alert.alert('Error', res?.message || 'Failed to delete user.');
              }
            } catch (error: any) {
              console.log('Delete User API error:', error);
              Alert.alert('Error', error?.response?.data?.message || 'Failed to delete user.');
            }
          },
        },
      ]
    );
  };

  // Filtered List
  const filteredList = users.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.email.toLowerCase().includes(search.toLowerCase()) ||
      item.role.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'All' || item.role === roleFilter;
    return matchSearch && matchRole;
  });

  // Export CSV Action
  const handleExportCSV = async () => {
    triggerHaptic('impactLight');
    const rows = filteredList.map((u) => [
      u.id,
      u.name,
      u.email,
      u.phone || '',
      u.role,
      u.status,
    ]);
    await exportCsvToFile({
      filename: `staff_users_${new Date().toISOString().split('T')[0]}`,
      headers: ['ID', 'Full Name', 'Email', 'Phone', 'Role', 'Status'],
      rows,
    });
  };

  return (
    <View style={styles.container}>
      {/* 1. Search Bar & Role Filter Scroll */}
      <View style={styles.topBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search staff name, email, or role..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {['All', 'Super Admin', 'Sales Manager', 'Sales Executive', 'Receptionist', 'Accountant'].map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.filterBtn, roleFilter === r && styles.filterBtnActive]}
              onPress={() => setRoleFilter(r)}
            >
              <Text
                style={[
                  styles.filterBtnText,
                  roleFilter === r && styles.filterBtnTextActive,
                ]}
              >
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 2. Loading State */}
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.orange} />
          <Text style={styles.loadingText}>Fetching staff users from API...</Text>
        </View>
      ) : (
        /* 3. Staff User Cards List with Pull-to-Refresh */
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
              onRefresh={() => fetchUsers(true)}
              tintColor={colors.orange}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardInner}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.name.slice(0, 1).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.userInfo}>
                  <View style={styles.nameBadgeRow}>
                    <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
                      {item.name}
                    </Text>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: item.status === 'Active' ? '#10B981' : '#94A3B8' },
                      ]}
                    />
                  </View>

                  <View style={styles.metaRow}>
                    <View
                      style={[
                        styles.roleBadge,
                        item.role === 'Super Admin' && styles.roleAdmin,
                        item.role === 'Sales Manager' && styles.roleManager,
                      ]}
                    >
                      <Text style={styles.roleText}>{item.role}</Text>
                    </View>
                    <Text style={styles.userEmail} numberOfLines={1} ellipsizeMode="tail">
                      {item.email}
                    </Text>
                  </View>
                </View>

                {/* Inline Actions */}
                <View style={styles.actionBtns}>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => handleOpenEdit(item)}
                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                  >
                    <Edit2 size={13} color={colors.textPrimary} strokeWidth={2.2} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.iconBtn, styles.deleteBtn]}
                    onPress={() => handleDelete(item)}
                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                  >
                    <Trash2 size={13} color="#EF4444" strokeWidth={2.2} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>No Staff Members Found</Text>
              <Text style={styles.emptyText}>
                No users returned by the server. Tap "+ Add Staff User" below to register one.
              </Text>
            </View>
          }
        />
      )}

      {/* Floating Speed Dial Action Button */}
      <FabSpeedDial
        primaryAction={{
          label: 'Add User',
          onPress: handleOpenAdd,
        }}
        secondaryAction={{
          label: 'Download CSV',
          onPress: handleExportCSV,
        }}
      />

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
              {editingItem ? 'Edit Staff Member' : 'Add New Staff Member'}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Pooja Sharma"
                placeholderTextColor={colors.textMuted}
                value={formName}
                onChangeText={setFormName}
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="name@dealership.com"
                placeholderTextColor={colors.textMuted}
                value={formEmail}
                onChangeText={setFormEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
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

            {!editingItem && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Account Password</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Password@123"
                  placeholderTextColor={colors.textMuted}
                  value={formPassword}
                  onChangeText={setFormPassword}
                  secureTextEntry
                  editable={!isSubmitting}
                />
              </View>
            )}

            {/* Role Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Assign Role</Text>
              <View style={styles.rolesWrap}>
                {ROLES.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.roleOption,
                      formRole === r && styles.roleOptionActive,
                    ]}
                    onPress={() => setFormRole(r)}
                    disabled={isSubmitting}
                  >
                    <Text
                      style={[
                        styles.roleOptionText,
                        formRole === r && styles.roleOptionTextActive,
                      ]}
                    >
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
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
                  <Text style={styles.saveBtnText}>Save User</Text>
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
  filterScroll: {
    gap: 6,
    paddingTop: 6,
  },
  filterBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
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
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 3,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  roleBadge: {
    backgroundColor: '#F0F2E8',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  roleAdmin: {
    backgroundColor: 'rgba(238, 104, 0, 0.12)',
    borderColor: colors.orange,
  },
  roleManager: {
    backgroundColor: 'rgba(0, 0, 128, 0.12)',
    borderColor: colors.secondary,
  },
  roleText: {
    fontSize: 9.5,
    color: colors.primary,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 11,
    color: colors.textMuted,
    flexShrink: 1,
  },
  actionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
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
    marginBottom: 12,
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
    height: 42,
    color: colors.textPrimary,
    fontSize: 13,
  },
  rolesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  roleOption: {
    backgroundColor: colors.inputBg,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryHover,
  },
  roleOptionText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  roleOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
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
