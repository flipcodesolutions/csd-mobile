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
import { Bike, Car, Check, ShieldCheck, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { showErrorToast, showWarningToast } from '../../../core/utils/toast';
import { Brand, CarModel, CreateModelPayload, UpdateModelPayload } from '../types';

interface AddEditModelModalProps {
  visible: boolean;
  editingItem: CarModel | null;
  brands: Brand[];
  onClose: () => void;
  onSubmit: (payload: CreateModelPayload | UpdateModelPayload) => Promise<void>;
}

/**
 * Replicates the exact web cascading logic from Section 5 of 02_MODEL_MASTER_SPEC.md:
 * Determines if a brand produces vehicles for the selected segment.
 */
export const isBrandMatchingSegment = (brand: Brand, segment: string): boolean => {
  if (!segment || !brand) return true;
  const vt = brand.vehicle_type;
  if (!vt) return true;
  const segNormalized = String(segment).toLowerCase().trim();
  const segNum = segNormalized.includes('2') ? '2' : segNormalized.includes('4') ? '4' : '';

  if (Array.isArray(vt)) {
    return vt.some((t) => {
      const s = String(t).toLowerCase().trim();
      return s === segNormalized || (segNum !== '' && s.includes(segNum));
    });
  }
  if (typeof vt === 'string') {
    const s = String(vt).toLowerCase().trim();
    return s === segNormalized || (segNum !== '' && s.includes(segNum));
  }
  return true;
};

export const AddEditModelModal: React.FC<AddEditModelModalProps> = ({
  visible,
  editingItem,
  brands,
  onClose,
  onSubmit,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [segment, setSegment] = useState<'4 Wheeler' | '2 Wheeler'>('4 Wheeler');
  const [brandId, setBrandId] = useState<number | null>(null);
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter brands based on current segment
  const matchingBrands = brands.filter((b) => isBrandMatchingSegment(b, segment));

  // Hydrate or reset state when modal opens
  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name || '');
      const itemSegment =
        editingItem.vehicle_segment ||
        (String(editingItem.vehicle_segment).includes('2') ? '2 Wheeler' : '4 Wheeler');
      setSegment(itemSegment);
      setBrandId(editingItem.brand_id || editingItem.brand?.id || null);
      setStatus(editingItem.status || 'Active');
    } else {
      setName('');
      setSegment('4 Wheeler');
      const defaultBrands = brands.filter((b) => isBrandMatchingSegment(b, '4 Wheeler'));
      setBrandId(defaultBrands.length > 0 ? defaultBrands[0].id : null);
      setStatus('Active');
    }
    setIsSubmitting(false);
  }, [editingItem, visible, brands]);

  // Handle Segment Change: cascade and validate brandId
  const handleSegmentChange = (newSeg: '4 Wheeler' | '2 Wheeler') => {
    triggerHaptic('selection');
    setSegment(newSeg);

    // Cascading check: does current brandId support new segment?
    const currentBrand = brands.find((b) => b.id === brandId);
    if (!currentBrand || !isBrandMatchingSegment(currentBrand, newSeg)) {
      const newMatching = brands.filter((b) => isBrandMatchingSegment(b, newSeg));
      setBrandId(newMatching.length > 0 ? newMatching[0].id : null);
    }
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      showWarningToast('Required Field', 'Please enter a vehicle model name.');
      return;
    }

    if (!brandId) {
      showWarningToast('Required Field', 'Please select an automotive brand manufacturer.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        name: trimmedName,
        brand_id: brandId,
        vehicle_segment: segment,
        status,
      });
      onClose();
    } catch (err: any) {
      console.log('Error saving model:', err);
      showErrorToast('Save Failed', err?.message || 'Unable to save model. Please retry.');
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
                <ShieldCheck size={18} color={colors.primary} strokeWidth={2.4} />
              </View>
              <View>
                <Text
                  style={[
                    styles.titleText,
                    { color: isDark ? '#F8FAFC' : '#0F172A' },
                  ]}
                >
                  {editingItem ? 'Edit Vehicle Model' : 'Add Vehicle Model'}
                </Text>
                <Text
                  style={[
                    styles.subtitleText,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                >
                  Defence Autolink • OEM Model Master
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

          {/* Form Body */}
          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* 1. Vehicle Segment Selection */}
            <View style={styles.fieldGroup}>
              <Text
                style={[
                  styles.label,
                  { color: isDark ? '#CBD5E1' : '#334155' },
                ]}
              >
                VEHICLE SEGMENT <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.segmentRow}>
                <TouchableOpacity
                  style={[
                    styles.segmentOption,
                    segment === '4 Wheeler' && styles.segmentOptionActive,
                    {
                      backgroundColor:
                        segment === '4 Wheeler'
                          ? isDark
                            ? 'rgba(2, 132, 199, 0.2)'
                            : '#F0F9FF'
                          : isDark
                          ? '#1E293B'
                          : '#FFFFFF',
                      borderColor:
                        segment === '4 Wheeler'
                          ? '#0284C7'
                          : isDark
                          ? '#334155'
                          : '#CBD5E1',
                    },
                  ]}
                  onPress={() => handleSegmentChange('4 Wheeler')}
                  activeOpacity={0.8}
                >
                  <Car
                    size={16}
                    color={segment === '4 Wheeler' ? '#0284C7' : '#64748B'}
                    strokeWidth={2.4}
                  />
                  <Text
                    style={[
                      styles.segmentText,
                      {
                        color:
                          segment === '4 Wheeler'
                            ? '#0284C7'
                            : isDark
                            ? '#94A3B8'
                            : '#64748B',
                        fontWeight: segment === '4 Wheeler' ? '800' : '600',
                      },
                    ]}
                  >
                    4 Wheeler (Cars)
                  </Text>
                  {segment === '4 Wheeler' && (
                    <Check size={14} color="#0284C7" strokeWidth={2.8} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.segmentOption,
                    segment === '2 Wheeler' && styles.segmentOptionActive,
                    {
                      backgroundColor:
                        segment === '2 Wheeler'
                          ? isDark
                            ? 'rgba(238, 104, 0, 0.2)'
                            : '#FFF7ED'
                          : isDark
                          ? '#1E293B'
                          : '#FFFFFF',
                      borderColor:
                        segment === '2 Wheeler'
                          ? '#EE6800'
                          : isDark
                          ? '#334155'
                          : '#CBD5E1',
                    },
                  ]}
                  onPress={() => handleSegmentChange('2 Wheeler')}
                  activeOpacity={0.8}
                >
                  <Bike
                    size={16}
                    color={segment === '2 Wheeler' ? '#EE6800' : '#64748B'}
                    strokeWidth={2.4}
                  />
                  <Text
                    style={[
                      styles.segmentText,
                      {
                        color:
                          segment === '2 Wheeler'
                            ? '#EE6800'
                            : isDark
                            ? '#94A3B8'
                            : '#64748B',
                        fontWeight: segment === '2 Wheeler' ? '800' : '600',
                      },
                    ]}
                  >
                    2 Wheeler (Bikes)
                  </Text>
                  {segment === '2 Wheeler' && (
                    <Check size={14} color="#EE6800" strokeWidth={2.8} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* 2. Select Brand (Filtered by Segment) */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text
                  style={[
                    styles.label,
                    { color: isDark ? '#CBD5E1' : '#334155' },
                  ]}
                >
                  OEM BRAND <Text style={styles.required}>*</Text>
                </Text>
                <Text style={styles.helperText}>
                  {matchingBrands.length} manufacturers in {segment}
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.brandsScroll}
              >
                {matchingBrands.map((b) => {
                  const isSelected = brandId === b.id;
                  return (
                    <TouchableOpacity
                      key={`brand-opt-${b.id}`}
                      style={[
                        styles.brandPill,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : isDark
                            ? '#1E293B'
                            : '#FFFFFF',
                          borderColor: isSelected
                            ? colors.primaryDark
                            : isDark
                            ? '#334155'
                            : '#CBD5E1',
                        },
                      ]}
                      onPress={() => {
                        triggerHaptic('selection');
                        setBrandId(b.id);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.brandPillText,
                          {
                            color: isSelected
                              ? '#FFFFFF'
                              : isDark
                              ? '#F1F5F9'
                              : '#334155',
                            fontWeight: isSelected ? '800' : '600',
                          },
                        ]}
                      >
                        {b.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* 3. Model Name Input */}
            <View style={styles.fieldGroup}>
              <Text
                style={[
                  styles.label,
                  { color: isDark ? '#CBD5E1' : '#334155' },
                ]}
              >
                MODEL NAME <Text style={styles.required}>*</Text>
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
                value={name}
                onChangeText={setName}
                placeholder="e.g. Brezza, Nexon, Thar, Classic 350..."
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
              />
            </View>

            {/* 4. Status Toggle */}
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
                  <Text style={styles.saveBtnText}>Save Model</Text>
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  required: {
    color: '#EF4444',
  },
  helperText: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '500',
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 10,
  },
  segmentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 8,
  },
  segmentOptionActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentText: {
    fontSize: 12.5,
  },
  brandsScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  brandPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  brandPillText: {
    fontSize: 12,
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
