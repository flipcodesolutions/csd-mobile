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
import { Check, Layers, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { showErrorToast, showWarningToast } from '../../../core/utils/toast';
import {
  Brand,
  CarModel,
  CreateVariantPayload,
  UpdateVariantPayload,
  VehicleVariant,
} from '../types';

interface AddEditVariantModalProps {
  visible: boolean;
  editingItem: VehicleVariant | null;
  brands: Brand[];
  models: CarModel[];
  onClose: () => void;
  onSubmit: (payload: CreateVariantPayload | UpdateVariantPayload) => Promise<void>;
}

const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'];

export const AddEditVariantModal: React.FC<AddEditVariantModalProps> = ({
  visible,
  editingItem,
  brands,
  models,
  onClose,
  onSubmit,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [brandId, setBrandId] = useState<number | null>(null);
  const [modelId, setModelId] = useState<number | null>(null);
  const [price, setPrice] = useState('');
  const [fuelType, setFuelType] = useState<string>('Petrol');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cascading Models: filter by selected brandId
  const matchingModels = models.filter((m) =>
    brandId ? m.brand_id === brandId : true
  );

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name || '');
      const bId = editingItem.brand_id || editingItem.brand?.id || (brands[0]?.id ?? null);
      setBrandId(bId);
      setModelId(editingItem.model_id || editingItem.model?.id || null);
      setPrice(String(editingItem.price || editingItem.ex_showroom_price || ''));
      setFuelType(editingItem.fuel_type || 'Petrol');
      setStatus(editingItem.status || 'Active');
    } else {
      setName('');
      const defaultBrand = brands[0]?.id ?? null;
      setBrandId(defaultBrand);
      const defaultModels = models.filter((m) => m.brand_id === defaultBrand);
      setModelId(defaultModels[0]?.id ?? null);
      setPrice('');
      setFuelType('Petrol');
      setStatus('Active');
    }
    setIsSubmitting(false);
  }, [editingItem, visible, brands, models]);

  // Handle Brand selection: automatically cascade to first available model
  const handleBrandSelect = (id: number) => {
    triggerHaptic('selection');
    setBrandId(id);
    const newMatching = models.filter((m) => m.brand_id === id);
    setModelId(newMatching[0]?.id ?? null);
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      showWarningToast('Required Field', 'Please enter a vehicle variant name.');
      return;
    }

    if (!brandId) {
      showWarningToast('Required Field', 'Please select a brand.');
      return;
    }

    if (!modelId) {
      showWarningToast('Required Field', 'Please select a vehicle model.');
      return;
    }

    const cleanPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
    if (isNaN(cleanPrice) || cleanPrice <= 0) {
      showWarningToast('Invalid Price', 'Please enter a valid ex-showroom rate greater than 0.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        name: trimmedName,
        brand_id: brandId,
        model_id: modelId,
        price: cleanPrice,
        fuel_type: fuelType,
        status,
      });
      onClose();
    } catch (err: any) {
      console.log('Error saving variant:', err);
      showErrorToast('Save Failed', err?.message || 'Unable to save variant.');
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
                <Layers size={18} color={colors.primary} strokeWidth={2.4} />
              </View>
              <View>
                <Text
                  style={[
                    styles.titleText,
                    { color: isDark ? '#F8FAFC' : '#0F172A' },
                  ]}
                >
                  {editingItem ? 'Edit Vehicle Trim / Variant' : 'Add Vehicle Variant'}
                </Text>
                <Text
                  style={[
                    styles.subtitleText,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                >
                  Defence Autolink • Variant Master
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
            {/* 1. Brand Selection */}
            <View style={styles.fieldGroup}>
              <Text
                style={[
                  styles.label,
                  { color: isDark ? '#CBD5E1' : '#334155' },
                ]}
              >
                1. SELECT OEM BRAND <Text style={styles.required}>*</Text>
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalPills}
              >
                {brands.map((b) => {
                  const isSel = brandId === b.id;
                  return (
                    <TouchableOpacity
                      key={`brand-sel-${b.id}`}
                      style={[
                        styles.pillOption,
                        {
                          backgroundColor: isSel
                            ? colors.primary
                            : isDark
                            ? '#1E293B'
                            : '#FFFFFF',
                          borderColor: isSel
                            ? colors.primaryDark
                            : isDark
                            ? '#334155'
                            : '#CBD5E1',
                        },
                      ]}
                      onPress={() => handleBrandSelect(b.id)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          {
                            color: isSel
                              ? '#FFFFFF'
                              : isDark
                              ? '#F1F5F9'
                              : '#334155',
                            fontWeight: isSel ? '800' : '600',
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

            {/* 2. Cascading Model Selection */}
            <View style={styles.fieldGroup}>
              <Text
                style={[
                  styles.label,
                  { color: isDark ? '#CBD5E1' : '#334155' },
                ]}
              >
                2. SELECT MODEL (CASCADING) <Text style={styles.required}>*</Text>
              </Text>
              {matchingModels.length === 0 ? (
                <Text style={styles.emptyNotice}>
                  No models registered under this brand yet.
                </Text>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalPills}
                >
                  {matchingModels.map((m) => {
                    const isSel = modelId === m.id;
                    return (
                      <TouchableOpacity
                        key={`model-sel-${m.id}`}
                        style={[
                          styles.pillOption,
                          {
                            backgroundColor: isSel
                              ? '#0284C7'
                              : isDark
                              ? '#1E293B'
                              : '#FFFFFF',
                            borderColor: isSel
                              ? '#0369A1'
                              : isDark
                              ? '#334155'
                              : '#CBD5E1',
                          },
                        ]}
                        onPress={() => {
                          triggerHaptic('selection');
                          setModelId(m.id);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.pillText,
                            {
                              color: isSel
                                ? '#FFFFFF'
                                : isDark
                                ? '#F1F5F9'
                                : '#334155',
                              fontWeight: isSel ? '800' : '600',
                            },
                          ]}
                        >
                          {m.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* 3. Trim / Variant Name */}
            <View style={styles.fieldGroup}>
              <Text
                style={[
                  styles.label,
                  { color: isDark ? '#CBD5E1' : '#334155' },
                ]}
              >
                3. VARIANT NAME <Text style={styles.required}>*</Text>
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
                placeholder="e.g. VXI, ZXI Plus, ABS Dual Channel, Dark Edition..."
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
              />
            </View>

            {/* 4. Ex-Showroom / Base Price (INR) */}
            <View style={styles.fieldGroup}>
              <Text
                style={[
                  styles.label,
                  { color: isDark ? '#CBD5E1' : '#334155' },
                ]}
              >
                4. EX-SHOWROOM / CSD RATE (₹) <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                    color: isDark ? '#4ADE80' : '#16A34A',
                    fontWeight: '800',
                    fontSize: 15,
                  },
                ]}
                value={price}
                onChangeText={setPrice}
                placeholder="e.g. 850000"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>

            {/* 5. Fuel Type Picker */}
            <View style={styles.fieldGroup}>
              <Text
                style={[
                  styles.label,
                  { color: isDark ? '#CBD5E1' : '#334155' },
                ]}
              >
                5. FUEL TYPE
              </Text>
              <View style={styles.fuelRow}>
                {FUEL_TYPES.map((f) => {
                  const isSel = fuelType === f;
                  return (
                    <TouchableOpacity
                      key={f}
                      style={[
                        styles.fuelPill,
                        {
                          backgroundColor: isSel
                            ? isDark
                              ? 'rgba(2, 132, 199, 0.25)'
                              : '#E0F2FE'
                            : isDark
                            ? '#1E293B'
                            : '#FFFFFF',
                          borderColor: isSel
                            ? '#0284C7'
                            : isDark
                            ? '#334155'
                            : '#CBD5E1',
                        },
                      ]}
                      onPress={() => {
                        triggerHaptic('selection');
                        setFuelType(f);
                      }}
                    >
                      <Text
                        style={[
                          styles.fuelPillText,
                          {
                            color: isSel
                              ? '#0284C7'
                              : isDark
                              ? '#CBD5E1'
                              : '#64748B',
                            fontWeight: isSel ? '800' : '600',
                          },
                        ]}
                      >
                        {f}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 6. Status Toggle */}
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
                  <Text style={styles.saveBtnText}>Save Variant</Text>
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
  emptyNotice: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#EF4444',
  },
  horizontalPills: {
    gap: 8,
    paddingVertical: 2,
  },
  pillOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  pillText: {
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
  fuelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fuelPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 7,
    borderWidth: 1,
  },
  fuelPillText: {
    fontSize: 11.5,
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
