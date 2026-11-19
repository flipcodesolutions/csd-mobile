import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Briefcase,
  Check,
  ChevronDown,
  Shield,
  X,
} from 'lucide-react-native';
import { colors } from '../../../core/theme/colors';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { showErrorToast, showWarningToast } from '../../../core/utils/toast';
import {
  CreateInsuranceCompanyPayload,
  InsuranceCompany,
  UpdateInsuranceCompanyPayload,
} from '../types';

interface AddEditInsuranceCompanyModalProps {
  visible: boolean;
  editingItem: InsuranceCompany | null;
  onClose: () => void;
  onSubmit: (
    payload: CreateInsuranceCompanyPayload | UpdateInsuranceCompanyPayload,
    isEdit: boolean
  ) => Promise<void>;
}

export const AddEditInsuranceCompanyModal: React.FC<AddEditInsuranceCompanyModalProps> = ({
  visible,
  editingItem,
  onClose,
  onSubmit,
}) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      if (editingItem) {
        setName(editingItem.name || '');
        const itemStatus =
          editingItem.status === 'Active' ||
          (editingItem.status as any) === 1 ||
          (editingItem.status as any) === '1' ||
          (editingItem.status as any) === 'active'
            ? 'Active'
            : 'Inactive';
        setStatus(itemStatus);
      } else {
        setName('');
        setStatus('Active');
      }
      setIsSubmitting(false);
    }
  }, [visible, editingItem]);

  const handleSave = async () => {
    if (!name.trim()) {
      showWarningToast('Required Field', 'Company name is required.');
      return;
    }

    const payload: CreateInsuranceCompanyPayload = {
      name: name.trim(),
      status: status.toLowerCase() as 'active' | 'inactive',
    };

    try {
      setIsSubmitting(true);
      await onSubmit(payload, Boolean(editingItem));
      triggerHaptic('notificationSuccess');
      onClose();
    } catch (err: any) {
      console.error('Submit Insurance Company Error:', err);
      const errMsg =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(', ')
          : null) ||
        'Failed to save insurance company.';
      showErrorToast(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: isDark ? '#131C27' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : colors.border,
              paddingBottom: keyboardVisible ? 10 : Math.max(insets.bottom, 16),
            },
          ]}
        >
          {/* Header Matching Screenshot 2 */}
          <View
            style={[
              styles.modalHeader,
              {
                backgroundColor: colors.primary,
                borderBottomColor: isDark ? '#1E293B' : '#E2E8F0',
              },
            ]}
          >
            <View style={styles.headerLeft}>
              <Briefcase size={18} color="#FFFFFF" strokeWidth={2.2} />
              <Text style={styles.modalTitle}>
                {editingItem ? 'Edit Insurance Company' : 'Add Insurance Company'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.closeBtn}
            >
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Form Body Matching Screenshot 2 */}
          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Field 1: Company Name * */}
            <View style={styles.fieldCol}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: isDark ? '#E2E8F0' : '#1E293B' },
                ]}
              >
                Company Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                    color: isDark ? '#F1F5F9' : '#0F172A',
                  },
                ]}
                placeholder="e.g. HDFC ERGO General Insurance"
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                value={name}
                onChangeText={setName}
                autoFocus={!editingItem}
              />
            </View>

            {/* Field 2: Status */}
            <View style={styles.fieldCol}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: isDark ? '#E2E8F0' : '#1E293B' },
                ]}
              >
                Status
              </Text>
              <TouchableOpacity
                style={[
                  styles.selectBox,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                  },
                ]}
                onPress={() => setShowStatusPicker(true)}
                activeOpacity={0.8}
              >
                <View style={styles.selectStatusRow}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor:
                          status === 'Active' ? '#16A34A' : '#94A3B8',
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.selectValue,
                      { color: isDark ? '#F1F5F9' : '#0F172A' },
                    ]}
                  >
                    {status}
                  </Text>
                </View>
                <ChevronDown size={16} color={isDark ? '#94A3B8' : '#64748B'} />
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Footer Actions Matching Screenshot 2 */}
          <View
            style={[
              styles.modalFooter,
              { borderTopColor: isDark ? '#1E293B' : '#E2E8F0' },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.cancelBtn,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                },
              ]}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text
                style={[
                  styles.cancelBtnText,
                  { color: isDark ? '#CBD5E1' : '#475569' },
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: colors.primary },
                isSubmitting && { opacity: 0.7 },
              ]}
              onPress={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.saveBtnText}>Save Company</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Status Picker Modal */}
      <Modal
        visible={showStatusPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStatusPicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowStatusPicker(false)}
        >
          <View
            style={[
              styles.pickerContainer,
              {
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                borderColor: isDark ? '#334155' : '#E2E8F0',
              },
            ]}
          >
            <View style={styles.pickerHeader}>
              <Text
                style={[
                  styles.pickerTitle,
                  { color: isDark ? '#F1F5F9' : '#0F172A' },
                ]}
              >
                Select Status
              </Text>
              <TouchableOpacity onPress={() => setShowStatusPicker(false)}>
                <X size={18} color={isDark ? '#94A3B8' : '#64748B'} />
              </TouchableOpacity>
            </View>

            {(['Active', 'Inactive'] as const).map((s) => {
              const isSelected = status === s;
              return (
                <TouchableOpacity
                  key={`status-opt-${s}`}
                  style={[
                    styles.pickerItem,
                    isSelected && {
                      backgroundColor: isDark
                        ? 'rgba(88, 99, 42, 0.2)'
                        : '#EFF3DF',
                    },
                  ]}
                  onPress={() => {
                    setStatus(s);
                    setShowStatusPicker(false);
                  }}
                >
                  <View style={styles.selectStatusRow}>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor:
                            s === 'Active' ? '#16A34A' : '#94A3B8',
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.pickerItemText,
                        { color: isDark ? '#F1F5F9' : '#0F172A' },
                        isSelected && {
                          color: colors.primary,
                          fontWeight: '700',
                        },
                      ]}
                    >
                      {s}
                    </Text>
                  </View>
                  {isSelected && <Check size={18} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContainer: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeBtn: {
    padding: 2,
  },
  formScroll: {
    maxHeight: 350,
  },
  formContent: {
    padding: 18,
    gap: 16,
  },
  fieldCol: {},
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  required: {
    color: '#EF4444',
  },
  textInput: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13.5,
  },
  selectBox: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  selectValue: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 18,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pickerContainer: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
  },
  pickerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickerItemText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
});

