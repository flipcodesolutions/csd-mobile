import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import {
  Bike,
  Building2,
  Car,
  Check,
  Image as ImageIcon,
  ShieldCheck,
  X,
} from 'lucide-react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { showWarningToast } from '../../../core/utils/toast';
import { getImageUrl } from '../../../core/api/client';
import { Brand } from '../types';

interface SelectedFile {
  uri: string;
  fileName?: string;
  type?: string;
  fileSize?: number;
}

interface AddEditBrandModalProps {
  visible: boolean;
  editingBrand: Brand | null;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    vehicle_type: string[];
    status: 'Active' | 'Inactive';
    logo?: string | null;
    logoFile?: SelectedFile;
  }) => Promise<void>;
}

export const AddEditBrandModal: React.FC<AddEditBrandModalProps> = ({
  visible,
  editingBrand,
  onClose,
  onSubmit,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [vehicleTypes, setVehicleTypes] = useState<string[]>(['4 Wheeler']);
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

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
      if (editingBrand) {
        setName(editingBrand.name || '');
        setVehicleTypes(
          Array.isArray(editingBrand.vehicle_type) && editingBrand.vehicle_type.length > 0
            ? editingBrand.vehicle_type
            : ['4 Wheeler']
        );
        setStatus(editingBrand.status || 'Active');
        setLogoUrl(editingBrand.logo || '');
        setSelectedFile(null);
      } else {
        setName('');
        setVehicleTypes(['4 Wheeler']);
        setStatus('Active');
        setLogoUrl('');
        setSelectedFile(null);
      }
      setPreviewError(false);
    }
  }, [visible, editingBrand]);

  if (!visible) return null;

  const isEdit = !!editingBrand;

  const handleTypeToggle = (type: string) => {
    triggerHaptic('selection');
    setVehicleTypes((prev) => {
      if (prev.includes(type)) {
        if (prev.length === 1) {
          showWarningToast(
            'Vehicle Type Required',
            'At least one vehicle category (4 Wheeler or 2 Wheeler) must remain selected.'
          );
          return prev;
        }
        return prev.filter((t) => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  const handlePickImage = async () => {
    triggerHaptic('impactLight');
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 1,
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        Alert.alert('Error', result.errorMessage || 'Failed to select image');
        return;
      }

      const asset = result.assets && result.assets[0];
      if (asset && asset.uri) {
        setSelectedFile({
          uri: asset.uri,
          fileName: asset.fileName || 'brand_logo.jpg',
          type: asset.type || 'image/jpeg',
          fileSize: asset.fileSize,
        });
        setPreviewError(false);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to open image picker');
    }
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      showWarningToast('Validation Error', 'Please enter a brand name.');
      return;
    }

    if (vehicleTypes.length === 0) {
      showWarningToast('Validation Error', 'Select at least one vehicle category (4 Wheeler or 2 Wheeler).');
      return;
    }

    // Logo validation: Required on Add per Web specification
    if (!isEdit && !selectedFile) {
      showWarningToast(
        'Brand Logo Required',
        'Brand logo image is required. Please choose a brand logo file.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: trimmedName,
        vehicle_type: vehicleTypes,
        status,
        logo: !selectedFile && isEdit ? logoUrl : undefined,
        logoFile: selectedFile || undefined,
      });
      onClose();
    } catch (err: any) {
      console.log('Error submitting brand:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View
          style={[
            styles.container,
            {
              backgroundColor: isDark ? '#101726' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
              paddingBottom: keyboardVisible ? 12 : Math.max(insets.bottom + 12, 16),
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
            <View style={styles.headerTitleRow}>
              <View
                style={[
                  styles.headerIconBox,
                  { backgroundColor: isDark ? 'rgba(88, 99, 42, 0.2)' : '#F5F8EE' },
                ]}
              >
                <ShieldCheck size={18} color={colors.primary} strokeWidth={2.4} />
              </View>
              <View>
                <Text
                  style={[
                    styles.headerTitle,
                    { color: isDark ? '#F8FAFC' : '#0F172A' },
                  ]}
                >
                  {isEdit ? 'Edit Brand' : 'Add Brand'}
                </Text>
                <Text
                  style={[
                    styles.headerSub,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                >
                  Defence Autolink • OEM Vehicle Master
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              disabled={isSubmitting}
              style={[
                styles.closeBtn,
                {
                  backgroundColor: isDark ? '#162030' : '#F1F5F9',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={15} color={colors.textSecondary} strokeWidth={2.4} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flexShrink: 1 }}
            contentContainerStyle={[styles.scrollBody, keyboardVisible ? { paddingBottom: 60 } : undefined]}
            keyboardShouldPersistTaps="handled"
          >
            {/* 1. Brand Name Field */}
            <View style={styles.formGroup}>
              <Text
                style={[
                  styles.formLabel,
                  { color: isDark ? '#CBD5E1' : '#334155' },
                ]}
              >
                BRAND NAME <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark ? '#162030' : '#F8FAFC',
                    borderColor: isDark ? '#1E293B' : '#CBD5E1',
                    color: isDark ? '#F8FAFC' : '#0F172A',
                  },
                ]}
                placeholder="e.g. Maruti Suzuki, Royal Enfield, Honda"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                editable={!isSubmitting}
              />
            </View>

            {/* 2. Vehicle Types Multi-Select Checkboxes */}
            <View style={styles.formGroup}>
              <Text
                style={[
                  styles.formLabel,
                  { color: isDark ? '#CBD5E1' : '#334155' },
                ]}
              >
                VEHICLE TYPES <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <Text
                style={[
                  styles.hintText,
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
              >
                Select automotive segments produced by this manufacturer.
              </Text>
              <View style={styles.typeSelectorRow}>
                {/* 4 Wheeler Option */}
                <TouchableOpacity
                  style={[
                    styles.typeOptionCard,
                    {
                      backgroundColor: vehicleTypes.includes('4 Wheeler')
                        ? isDark
                          ? 'rgba(59, 130, 246, 0.15)'
                          : '#EFF6FF'
                        : isDark
                        ? '#162030'
                        : '#F8FAFC',
                      borderColor: vehicleTypes.includes('4 Wheeler')
                        ? '#3B82F6'
                        : isDark
                        ? '#1E293B'
                        : '#CBD5E1',
                    },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handleTypeToggle('4 Wheeler')}
                  disabled={isSubmitting}
                >
                  <View style={styles.typeOptionLeft}>
                    <Car
                      size={18}
                      color={
                        vehicleTypes.includes('4 Wheeler')
                          ? '#2563EB'
                          : colors.textSecondary
                      }
                      strokeWidth={2.2}
                    />
                    <Text
                      style={[
                        styles.typeOptionTitle,
                        {
                          color: vehicleTypes.includes('4 Wheeler')
                            ? '#1D4ED8'
                            : isDark
                            ? '#F8FAFC'
                            : '#0F172A',
                          fontWeight: vehicleTypes.includes('4 Wheeler')
                            ? '800'
                            : '600',
                        },
                      ]}
                    >
                      4 Wheeler
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: vehicleTypes.includes('4 Wheeler')
                          ? '#2563EB'
                          : 'transparent',
                        borderColor: vehicleTypes.includes('4 Wheeler')
                          ? '#2563EB'
                          : isDark
                          ? '#475569'
                          : '#94A3B8',
                      },
                    ]}
                  >
                    {vehicleTypes.includes('4 Wheeler') && (
                      <Check size={12} color="#FFFFFF" strokeWidth={3} />
                    )}
                  </View>
                </TouchableOpacity>

                {/* 2 Wheeler Option */}
                <TouchableOpacity
                  style={[
                    styles.typeOptionCard,
                    {
                      backgroundColor: vehicleTypes.includes('2 Wheeler')
                        ? isDark
                          ? 'rgba(238, 104, 0, 0.15)'
                          : '#FFF7ED'
                        : isDark
                        ? '#162030'
                        : '#F8FAFC',
                      borderColor: vehicleTypes.includes('2 Wheeler')
                        ? '#EE6800'
                        : isDark
                        ? '#1E293B'
                        : '#CBD5E1',
                    },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handleTypeToggle('2 Wheeler')}
                  disabled={isSubmitting}
                >
                  <View style={styles.typeOptionLeft}>
                    <Bike
                      size={18}
                      color={
                        vehicleTypes.includes('2 Wheeler')
                          ? '#EA580C'
                          : colors.textSecondary
                      }
                      strokeWidth={2.2}
                    />
                    <Text
                      style={[
                        styles.typeOptionTitle,
                        {
                          color: vehicleTypes.includes('2 Wheeler')
                            ? '#C2410C'
                            : isDark
                            ? '#F8FAFC'
                            : '#0F172A',
                          fontWeight: vehicleTypes.includes('2 Wheeler')
                            ? '800'
                            : '600',
                        },
                      ]}
                    >
                      2 Wheeler
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: vehicleTypes.includes('2 Wheeler')
                          ? '#EA580C'
                          : 'transparent',
                        borderColor: vehicleTypes.includes('2 Wheeler')
                          ? '#EA580C'
                          : isDark
                          ? '#475569'
                          : '#94A3B8',
                      },
                    ]}
                  >
                    {vehicleTypes.includes('2 Wheeler') && (
                      <Check size={12} color="#FFFFFF" strokeWidth={3} />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* 3. Brand Logo Selector & Preview (File Picker) */}
            <View style={styles.formGroup}>
              <Text
                style={[
                  styles.formLabel,
                  { color: isDark ? '#CBD5E1' : '#334155' },
                ]}
              >
                BRAND LOGO IMAGE {!isEdit && <Text style={{ color: '#EF4444' }}>*</Text>}
              </Text>

              {/* File input bar matching web UI screenshot */}
              <TouchableOpacity
                style={[
                  styles.filePickerBox,
                  {
                    backgroundColor: isDark ? '#162030' : '#FFFFFF',
                    borderColor: isDark ? '#1E293B' : '#CBD5E1',
                  },
                ]}
                onPress={handlePickImage}
                activeOpacity={0.7}
                disabled={isSubmitting}
              >
                <View
                  style={[
                    styles.chooseFileBtn,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                      borderColor: isDark ? '#334155' : '#CBD5E1',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chooseFileText,
                      { color: isDark ? '#F8FAFC' : '#1E293B' },
                    ]}
                  >
                    Choose file
                  </Text>
                </View>
                <Text
                  style={[
                    styles.fileChosenText,
                    {
                      color: selectedFile
                        ? colors.primaryDark
                        : isEdit && logoUrl
                        ? (isDark ? '#CBD5E1' : '#475569')
                        : colors.textMuted,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {selectedFile
                    ? selectedFile.fileName || 'Image selected'
                    : isEdit && logoUrl
                    ? 'Current logo attached (click to change)'
                    : 'No file chosen'}
                </Text>
              </TouchableOpacity>

              <Text
                style={[
                  styles.hintText,
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
              >
                Upload PNG, JPG, or SVG logo file.
              </Text>

              {/* Logo Preview if file selected or in edit mode */}
              {(selectedFile?.uri || (isEdit && logoUrl)) && (
                <View
                  style={[
                    styles.previewBox,
                    {
                      backgroundColor: isDark ? '#162030' : '#F8FAFC',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.previewImageContainer,
                      {
                        backgroundColor: isDark ? '#101726' : '#FFFFFF',
                        borderColor: isDark ? '#1E293B' : '#DCE9A2',
                      },
                    ]}
                  >
                    {selectedFile?.uri ? (
                      <Image
                        source={{ uri: selectedFile.uri }}
                        style={styles.previewImage}
                        resizeMode="contain"
                      />
                    ) : getImageUrl(logoUrl) && !previewError ? (
                      <Image
                        source={{ uri: getImageUrl(logoUrl)! }}
                        style={styles.previewImage}
                        resizeMode="contain"
                        onError={() => setPreviewError(true)}
                      />
                    ) : (
                      <Text
                        style={[
                          styles.fallbackInitial,
                          { color: colors.primaryDark },
                        ]}
                      >
                        {name.trim() ? name.trim().charAt(0).toUpperCase() : 'B'}
                      </Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.previewLabel,
                        { color: isDark ? '#F8FAFC' : '#0F172A' },
                      ]}
                      numberOfLines={1}
                    >
                      {selectedFile ? selectedFile.fileName || 'New Logo Selected' : 'Current Logo'}
                    </Text>
                    <Text
                      style={[
                        styles.previewSub,
                        { color: isDark ? '#94A3B8' : '#64748B' },
                      ]}
                    >
                      {selectedFile
                        ? selectedFile.fileSize
                          ? `${Math.round(selectedFile.fileSize / 1024)} KB`
                          : 'File ready'
                        : 'Stored on server'}
                    </Text>
                  </View>
                  {selectedFile && (
                    <TouchableOpacity
                      style={styles.removeFileBtn}
                      onPress={() => setSelectedFile(null)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X size={16} color="#EF4444" strokeWidth={2.5} />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* 4. Status Selector */}
            <View style={styles.formGroup}>
              <Text
                style={[
                  styles.formLabel,
                  { color: isDark ? '#CBD5E1' : '#334155' },
                ]}
              >
                STATUS
              </Text>
              <View style={styles.statusRow}>
                <TouchableOpacity
                  style={[
                    styles.statusBtn,
                    {
                      backgroundColor: status === 'Active'
                        ? isDark
                          ? 'rgba(22, 163, 74, 0.2)'
                          : '#DCFCE7'
                        : isDark
                        ? '#162030'
                        : '#F8FAFC',
                      borderColor: status === 'Active'
                        ? '#16A34A'
                        : isDark
                        ? '#1E293B'
                        : '#CBD5E1',
                    },
                  ]}
                  onPress={() => {
                    triggerHaptic('selection');
                    setStatus('Active');
                  }}
                >
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: status === 'Active' ? '#16A34A' : '#94A3B8',
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusBtnText,
                      {
                        color: status === 'Active'
                          ? '#16A34A'
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
                    styles.statusBtn,
                    {
                      backgroundColor: status === 'Inactive'
                        ? isDark
                          ? 'rgba(148, 163, 184, 0.2)'
                          : '#F1F5F9'
                        : isDark
                        ? '#162030'
                        : '#F8FAFC',
                      borderColor: status === 'Inactive'
                        ? '#64748B'
                        : isDark
                        ? '#1E293B'
                        : '#CBD5E1',
                    },
                  ]}
                  onPress={() => {
                    triggerHaptic('selection');
                    setStatus('Inactive');
                  }}
                >
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: status === 'Inactive' ? '#64748B' : '#94A3B8',
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusBtnText,
                      {
                        color: status === 'Inactive'
                          ? '#475569'
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
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.cancelBtn,
                {
                  backgroundColor: isDark ? '#162030' : '#F1F5F9',
                  borderColor: isDark ? '#1E293B' : '#CBD5E1',
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
                styles.submitBtn,
                { backgroundColor: colors.primary },
                isSubmitting && styles.submitBtnDisabled,
              ]}
              onPress={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.submitBtnText}>
                    {isEdit ? 'Save Changes' : 'Save Brand'}
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
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
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    padding: 16,
    gap: 16,
  },
  formGroup: {
    gap: 6,
  },
  formLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  hintText: {
    fontSize: 11,
    lineHeight: 15,
  },
  textInput: {
    height: 42,
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '500',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  typeOptionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  typeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeOptionTitle: {
    fontSize: 12.5,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filePickerBox: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 10,
  },
  chooseFileBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chooseFileText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fileChosenText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '500',
  },
  removeFileBtn: {
    padding: 6,
    borderRadius: 6,
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
    marginTop: 2,
  },
  previewImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewImage: {
    width: 40,
    height: 40,
  },
  fallbackInitial: {
    fontSize: 20,
    fontWeight: '900',
  },
  previewLabel: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  previewSub: {
    fontSize: 11,
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statusBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBtnText: {
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
    minWidth: 120,
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
});
