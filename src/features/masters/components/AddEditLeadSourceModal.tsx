import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { Check, GitFork, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { showErrorToast, showWarningToast } from '../../../core/utils/toast';
import {
  CreateLeadSourcePayload,
  LeadSource,
  UpdateLeadSourcePayload,
} from '../types';

interface AddEditLeadSourceModalProps {
  visible: boolean;
  editingItem: LeadSource | null;
  onClose: () => void;
  onSubmit: (
    payload: CreateLeadSourcePayload | UpdateLeadSourcePayload
  ) => Promise<void>;
}

export const AddEditLeadSourceModal: React.FC<AddEditLeadSourceModalProps> = ({
  visible,
  editingItem,
  onClose,
  onSubmit,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title || editingItem.name || '');
      setStatus(editingItem.status || 'Active');
    } else {
      setTitle('');
      setStatus('Active');
    }
    setIsSubmitting(false);
  }, [editingItem, visible]);

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      showWarningToast('Required Field', 'Please enter a marketing channel title.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        title: trimmedTitle,
        status,
      });
      onClose();
    } catch (err: any) {
      console.log('Error saving lead source:', err);
      showErrorToast('Save Failed', err?.message || 'Unable to save lead source.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: isDark ? '#101726' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
            },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.header,
              { borderBottomColor: isDark ? '#1E293B' : '#F1F5F9' },
            ]}
          >
            <View style={styles.headerTitleWrap}>
              <View
                style={[
                  styles.headerIconBox,
                  {
                    backgroundColor: isDark
                      ? 'rgba(88, 99, 42, 0.2)'
                      : '#F5F8EE',
                  },
                ]}
              >
                <GitFork size={18} color={colors.primary} strokeWidth={2.4} />
              </View>
              <View>
                <Text
                  style={[
                    styles.titleText,
                    { color: isDark ? '#F8FAFC' : '#0F172A' },
                  ]}
                >
                  {editingItem ? 'Edit Acquisition Channel' : 'Add Lead Source'}
                </Text>
                <Text
                  style={[
                    styles.subtitleText,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                >
                  Defence Autolink • Marketing Channel Master
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeBtn,
                { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={16} color={isDark ? '#CBD5E1' : '#64748B'} strokeWidth={2.4} />
            </TouchableOpacity>
          </View>

          {/* Form Scroll */}
          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* 1. Title Input */}
            <View style={styles.fieldGroup}>
              <Text
                style={[
                  styles.label,
                  { color: isDark ? '#CBD5E1' : '#334155' },
                ]}
              >
                SOURCE CHANNEL TITLE <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                    color: isDark ? '#F8FAFC' : '#0F172A',
                  },
                ]}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Website, Facebook Ads, Showroom Walk-in, Reference..."
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
              />
            </View>

            {/* 2. Status Toggle */}
            <View style={styles.fieldGroup}>
              <Text
                style={[
                  styles.label,
                  { color: isDark ? '#CBD5E1' : '#334155' },
                ]}
              >
                STATUS
              </Text>
              <View style={styles.statusRow}>
                <TouchableOpacity
                  style={[
                    styles.statusOption,
                    status === 'Active' && styles.statusOptionActive,
                    {
                      backgroundColor:
                        status === 'Active'
                          ? isDark
                            ? 'rgba(22, 163, 74, 0.2)'
                            : '#ECFDF5'
                          : isDark
                          ? '#1E293B'
                          : '#FFFFFF',
                      borderColor:
                        status === 'Active'
                          ? '#10B981'
                          : isDark
                          ? '#334155'
                          : '#CBD5E1',
                    },
                  ]}
                  onPress={() => {
                    triggerHaptic('selection');
                    setStatus('Active');
                  }}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          status === 'Active' ? '#10B981' : '#94A3B8',
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusOptionText,
                      {
                        color:
                          status === 'Active'
                            ? '#10B981'
                            : isDark
                            ? '#94A3B8'
                            : '#64748B',
                        fontWeight: status === 'Active' ? '800' : '600',
                      },
                    ]}
                  >
                    Active
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.statusOption,
                    status === 'Inactive' && styles.statusOptionActive,
                    {
                      backgroundColor:
                        status === 'Inactive'
                          ? isDark
                            ? 'rgba(148, 163, 184, 0.2)'
                            : '#F1F5F9'
                          : isDark
                          ? '#1E293B'
                          : '#FFFFFF',
                      borderColor:
                        status === 'Inactive'
                          ? '#94A3B8'
                          : isDark
                          ? '#334155'
                          : '#CBD5E1',
                    },
                  ]}
                  onPress={() => {
                    triggerHaptic('selection');
                    setStatus('Inactive');
                  }}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          status === 'Inactive' ? '#64748B' : '#94A3B8',
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusOptionText,
                      {
                        color:
                          status === 'Inactive'
                            ? isDark
                              ? '#CBD5E1'
                              : '#475569'
                            : isDark
                            ? '#94A3B8'
                            : '#64748B',
                        fontWeight: status === 'Inactive' ? '800' : '600',
                      },
                    ]}
                  >
                    Inactive
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View
            style={[
              styles.footer,
              {
                borderTopColor: isDark ? '#1E293B' : '#F1F5F9',
                backgroundColor: isDark ? '#101726' : '#FFFFFF',
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.cancelBtn,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                  borderColor: isDark ? '#334155' : '#E2E8F0',
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
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Check size={16} color="#FFFFFF" strokeWidth={2.8} />
                  <Text style={styles.saveBtnText}>
                    {editingItem ? 'Update Source' : 'Save Source'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 16,
    fontWeight: '800',
  },
  subtitleText: {
    fontSize: 11,
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formScroll: {
    maxHeight: 460,
  },
  formContent: {
    padding: 16,
    gap: 16,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  required: {
    color: '#EF4444',
  },
  textInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 13.5,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statusOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  statusOptionActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusOptionText: {
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 8,
    gap: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
