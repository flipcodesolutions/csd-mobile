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
import { userApi } from '../lib/apiServices';

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

  return (
    <View style={styles.container}>
      {/* 1. Search Bar & Role Filter Scroll */}
      <View style={styles.topBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search staff name, email, or role..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />

        <View style={styles.filterRow}>
          {['All', 'Super Admin', 'Sales Manager', 'Sales Executive'].map((r) => (
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
        </View>
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
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchUsers(true)}
              tintColor={colors.orange}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.name.slice(0, 1).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.userInfo}>
                  <View style={styles.nameBadgeRow}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <View
                      style={[
                        styles.roleBadge,
                        item.role === 'Super Admin' && styles.roleAdmin,
                        item.role === 'Sales Manager' && styles.roleManager,
                      ]}
                    >
                      <Text style={styles.roleText}>{item.role}</Text>
                    </View>
                  </View>
                  <Text style={styles.userEmail}>✉️ {item.email}</Text>
                  <Text style={styles.userPhone}>📞 {item.phone}</Text>
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
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>No Staff Members Found</Text>
              <Text style={styles.emptyText}>
                No users returned by the server. Tap "+ Add Staff User" below to register one.
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
        <Text style={styles.fabText}>+ Add Staff User</Text>
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
  filterRow: {
    flexDirection: 'row',
    gap: 6,
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
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
    gap: 3,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  roleBadge: {
    backgroundColor: '#F0F2E8',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
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
    fontSize: 10,
    color: colors.primary,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 11,
    color: colors.textMuted,
  },
  userPhone: {
    fontSize: 11,
    color: colors.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 7,
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
    fontSize: 10,
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
