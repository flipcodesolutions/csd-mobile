import React, { useState, useEffect, useCallback } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Calendar,
  Car,
  Check,
  ChevronDown,
  Flame,
  Layers,
  Search,
  Snowflake,
  Sun,
  User,
  X,
} from 'lucide-react-native';
import { triggerHaptic } from '../../core/utils/haptics';
import { api } from '../../core/api/client';
import { leadApi } from './leadService';
import { brandApi, modelApi, variantApi, leadSourceApi, userApi } from '../masters/masterService';
import { BrandItem, ModelItem, SourceItem, UserItem, VariantItem } from './types';

// Theme Colors matching Web Admin Panel
const THEME = {
  primaryNavy: '#0D1554',
  background: '#F8FAFC',
  cardBg: '#FFFFFF',
  border: '#E5E7EB',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  danger: '#DC2626',
  dangerBg: '#FEE2E2',
  warning: '#D97706',
  warningBg: '#FEF3C7',
  success: '#16A34A',
  successBg: '#DCFCE7',
  info: '#4F46E5',
  infoBg: '#E0E7FF',
  cold: '#0284C7',
  coldBg: '#E0F2FE',
};

const TIMELINE_OPTIONS = [
  'Immediate (Within 7 Days)',
  '15-30 Days',
  '1-3 Months',
  'More than 3 Months',
];

const STATIC_STATUSES = [
  'New',
  'Follow-up',
  'Quotation Sent',
  'Deal & Booking',
  'Lost',
];

interface CreateLeadScreenProps {
  onBack?: () => void;
  onSuccess?: () => void;
  navigation?: any;
}

export const CreateLeadScreen: React.FC<CreateLeadScreenProps> = ({
  onBack,
  onSuccess,
  navigation,
}) => {
  const insets = useSafeAreaInsets();

  // ----------------------------------------------------
  // Section A: Customer Details
  // ----------------------------------------------------
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [homeTown, setHomeTown] = useState('');
  const [posting, setPosting] = useState('');
  const [state, setState] = useState('Gujarat');
  const [birthDate, setBirthDate] = useState('');
  const [anniversaryDate, setAnniversaryDate] = useState('');

  // ----------------------------------------------------
  // Section B: Vehicle Requirement
  // ----------------------------------------------------
  const [segment, setSegment] = useState<'4 Wheeler' | '2 Wheeler'>('4 Wheeler');
  const [selectedBrand, setSelectedBrand] = useState<BrandItem | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelItem | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<VariantItem | null>(null);
  const [budget, setBudget] = useState('');
  const [timeline, setTimeline] = useState('Immediate (Within 7 Days)');

  // Cascading Data Sets
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [models, setModels] = useState<ModelItem[]>([]);
  const [variants, setVariants] = useState<VariantItem[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);

  // ----------------------------------------------------
  // Section C: Pipeline & Assignment
  // ----------------------------------------------------
  const [priority, setPriority] = useState<'Hot' | 'Warm' | 'Cold'>('Hot');
  const [selectedSource, setSelectedSource] = useState<SourceItem | null>(null);
  const [statusName, setStatusName] = useState('New');
  const [selectedExecutive, setSelectedExecutive] = useState<UserItem | null>(null);

  const [sources, setSources] = useState<SourceItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);

  // ----------------------------------------------------
  // UI & Loading States
  // ----------------------------------------------------
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dropdown Picker Modal State
  const [pickerModalVisible, setPickerModalVisible] = useState(false);
  const [pickerTitle, setPickerTitle] = useState('');
  const [pickerItems, setPickerItems] = useState<{ id: any; label: string; sublabel?: string }[]>([]);
  const [pickerSearch, setPickerSearch] = useState('');
  const [onPickerSelect, setOnPickerSelect] = useState<(item: any) => void>(() => {});

  // Date Modal State
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [dateModalTitle, setDateModalTitle] = useState('');
  const [targetDateField, setTargetDateField] = useState<'birth' | 'anniversary'>('birth');
  const [inputDateText, setInputDateText] = useState('');

  // ----------------------------------------------------
  // Initial Data Fetch
  // ----------------------------------------------------
  const loadInitialMasters = useCallback(async () => {
    try {
      // 1. Load Brands (filter by segment)
      const brandsRes = await brandApi.getAll({ per_page: 100 });
      const rawBrands: any[] = brandsRes?.data?.data || brandsRes?.data || [];
      const filteredBrands: BrandItem[] = rawBrands
        .filter((b: any) => {
          if (!b.vehicle_type) return true;
          const vt = Array.isArray(b.vehicle_type) ? b.vehicle_type : [b.vehicle_type];
          if (segment === '4 Wheeler') {
            return vt.some((t: string) => /4[_\s-]?wheeler|car/i.test(t));
          } else {
            return vt.some((t: string) => /2[_\s-]?wheeler|bike/i.test(t));
          }
        })
        .map((b: any) => ({
          id: b.id,
          name: b.name,
        }));
      setBrands(filteredBrands);

      // 2. Load Sources
      const sourcesRes = await leadSourceApi.getAll({ per_page: 50, all: true });
      const rawSources: any[] = sourcesRes?.data?.data || sourcesRes?.data || [];
      setSources(
        rawSources.map((s: any) => ({
          id: s.id,
          name: s.title || s.name || 'Direct',
          title: s.title || s.name || 'Direct',
        }))
      );

      // 3. Load Users (Sales Executives)
      const usersRes = await userApi.getAll();
      const rawUsers: any[] = usersRes?.data?.data || usersRes?.data || [];
      setUsers(
        rawUsers.map((u: any) => ({
          id: u.id,
          name: u.name,
          role: u.role || u.role_name || 'Sales Executive',
          role_name: u.role_name || u.role || 'Sales Executive',
        }))
      );
    } catch (err) {
      console.log('Error loading initial lead masters:', err);
    }
  }, [segment]);

  useEffect(() => {
    loadInitialMasters();
  }, [loadInitialMasters]);

  // ----------------------------------------------------
  // Cascading Models Fetch on Brand Selection
  // ----------------------------------------------------
  const handleSelectBrand = async (brand: BrandItem) => {
    setSelectedBrand(brand);
    setSelectedModel(null);
    setSelectedVariant(null);
    setModels([]);
    setVariants([]);

    setIsLoadingModels(true);
    try {
      let rawModels: any[] = [];
      try {
        const res = await api.get(`/brands/${brand.id}/models`);
        rawModels = res?.data?.data || res?.data || [];
      } catch {
        const res = await modelApi.getAll({ brand_id: brand.id, per_page: 100 });
        rawModels = res?.data?.data || res?.data || [];
      }

      setModels(
        rawModels.map((m: any) => ({
          id: m.id,
          brand_id: brand.id,
          name: m.name,
        }))
      );
    } catch (err) {
      console.log('Error loading models for brand:', err);
    } finally {
      setIsLoadingModels(false);
    }
  };

  // ----------------------------------------------------
  // Cascading Variants Fetch on Model Selection
  // ----------------------------------------------------
  const handleSelectModel = async (model: ModelItem) => {
    setSelectedModel(model);
    setSelectedVariant(null);
    setVariants([]);

    setIsLoadingVariants(true);
    try {
      let rawVariants: any[] = [];
      try {
        const res = await api.get(`/models/${model.id}/variants`);
        rawVariants = res?.data?.data || res?.data || [];
      } catch {
        const res = await variantApi.getAll({ model_id: model.id, per_page: 100 });
        rawVariants = res?.data?.data || res?.data || [];
      }

      setVariants(
        rawVariants.map((v: any) => ({
          id: v.id,
          model_id: model.id,
          name: v.name,
          price: v.price || v.ex_showroom_price,
        }))
      );
    } catch (err) {
      console.log('Error loading variants for model:', err);
    } finally {
      setIsLoadingVariants(false);
    }
  };

  // ----------------------------------------------------
  // Open Dropdown Picker Helper
  // ----------------------------------------------------
  const openPicker = (
    title: string,
    items: { id: any; label: string; sublabel?: string }[],
    onSelect: (item: any) => void
  ) => {
    triggerHaptic('impactLight');
    setPickerTitle(title);
    setPickerItems(items);
    setPickerSearch('');
    setOnPickerSelect(() => onSelect);
    setPickerModalVisible(true);
  };

  // ----------------------------------------------------
  // Open Date Modal Helper
  // ----------------------------------------------------
  const openDateModal = (field: 'birth' | 'anniversary', title: string, currentValue: string) => {
    triggerHaptic('impactLight');
    setTargetDateField(field);
    setDateModalTitle(title);
    setInputDateText(currentValue || '');
    setDateModalVisible(true);
  };

  const handleSaveDate = () => {
    const trimmed = inputDateText.trim();
    if (trimmed && !/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      Alert.alert('Invalid Format', 'Please enter date in YYYY-MM-DD format (e.g. 1990-05-15)');
      return;
    }
    if (targetDateField === 'birth') {
      setBirthDate(trimmed);
    } else {
      setAnniversaryDate(trimmed);
    }
    setDateModalVisible(false);
  };

  // ----------------------------------------------------
  // Form Validation
  // ----------------------------------------------------
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // 1. Name validation
    if (!name.trim()) {
      newErrors.name = 'Customer name is required';
    }

    // 2. Phone validation: 10 digits starting with 6, 7, 8, or 9
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) {
      newErrors.phone = 'Mobile number is required';
    } else if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      newErrors.phone = 'Enter valid 10-digit number starting with 6, 7, 8, or 9';
    }

    // 3. Email validation if entered
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ----------------------------------------------------
  // Submit Form
  // ----------------------------------------------------
  const handleSubmit = async () => {
    triggerHaptic('impactMedium');
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please correct the highlighted fields before submitting.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const modelVariant = [
      selectedBrand?.name,
      selectedModel?.name,
      selectedVariant?.name,
    ]
      .filter(Boolean)
      .join(' ') || 'Vehicle Requirement';

    const payload: Record<string, any> = {
      name: name.trim(),
      phone: cleanPhone,
      email: email.trim() || undefined,
      city: city.trim() || undefined,
      home_town: homeTown.trim() || city.trim() || undefined,
      posting: posting.trim() || undefined,
      state: state.trim() || 'Gujarat',
      birth_date: birthDate || undefined,
      anniversary_date: anniversaryDate || undefined,
      vehicle_segment: segment,
      brand_id: selectedBrand?.id || undefined,
      model_id: selectedModel?.id || undefined,
      variant_id: selectedVariant?.id || undefined,
      model_variant: modelVariant,
      priority,
      purchase_timeline: timeline,
      budget: budget ? Number(budget.replace(/\D/g, '')) : undefined,
      source_id: selectedSource?.id || undefined,
      status_name: statusName,
      assigned_to: selectedExecutive?.id || undefined,
      assigned_user_name: selectedExecutive?.name || undefined,
    };

    setIsSubmitting(true);
    try {
      await leadApi.create(payload as any);
      triggerHaptic('notificationSuccess');
      Alert.alert(
        'Lead Created Successfully',
        `Lead for "${name.trim()}" has been added to the pipeline.`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (onSuccess) {
                onSuccess();
              } else if (onBack) {
                onBack();
              } else if (navigation) {
                navigation.goBack();
              }
            },
          },
        ]
      );
    } catch (err: any) {
      console.log('Create lead API error:', err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to create lead. Please check details and try again.';
      Alert.alert('Submission Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    triggerHaptic('impactLight');
    if (onBack) {
      onBack();
    } else if (navigation) {
      navigation.goBack();
    }
  };

  // Filter items in dropdown picker
  const filteredPickerItems = pickerItems.filter((item) =>
    item.label.toLowerCase().includes(pickerSearch.toLowerCase()) ||
    (item.sublabel && item.sublabel.toLowerCase().includes(pickerSearch.toLowerCase()))
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* 1. Top Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={22} color={THEME.primaryNavy} strokeWidth={2.4} />
        </TouchableOpacity>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>Create New Lead</Text>
          <Text style={styles.headerSubtitle}>Add prospect to dealership pipeline</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ========================================================= */}
        {/* SECTION A: Customer Details */}
        {/* ========================================================= */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: THEME.infoBg }]}>
              <User size={16} color={THEME.info} strokeWidth={2.4} />
            </View>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Section A: Customer Details</Text>
              <Text style={styles.sectionSubtitle}>Primary contact & personal info</Text>
            </View>
          </View>

          {/* Name Field */}
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>
              Customer Name <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={[styles.textInput, errors.name ? styles.inputErrorBorder : null]}
              placeholder="e.g. Major Suresh Sharma"
              placeholderTextColor={THEME.textMuted}
              value={name}
              onChangeText={(val) => {
                setName(val);
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
              }}
            />
            {!!errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Phone Field */}
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>
              Phone Number (10 digits) <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={[styles.phoneInputRow, errors.phone ? styles.inputErrorBorder : null]}>
              <View style={styles.phoneCountryCode}>
                <Text style={styles.phoneCountryCodeText}>+91</Text>
              </View>
              <TextInput
                style={styles.phoneTextInput}
                placeholder="9876543210"
                placeholderTextColor={THEME.textMuted}
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={(val) => {
                  const clean = val.replace(/\D/g, '');
                  setPhone(clean);
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                }}
              />
            </View>
            {!!errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          {/* Email Field */}
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Email Address (Optional)</Text>
            <TextInput
              style={[styles.textInput, errors.email ? styles.inputErrorBorder : null]}
              placeholder="suresh.sharma@gmail.com"
              placeholderTextColor={THEME.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(val) => {
                setEmail(val);
                if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
              }}
            />
            {!!errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Home Town / City & State (Two column row) */}
          <View style={styles.formRow}>
            <View style={[styles.formGroup, styles.formCol]}>
              <Text style={styles.inputLabel}>Home Town / City</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ahmedabad"
                placeholderTextColor={THEME.textMuted}
                value={city}
                onChangeText={(val) => {
                  setCity(val);
                  if (!homeTown) setHomeTown(val);
                }}
              />
            </View>
            <View style={[styles.formGroup, styles.formCol]}>
              <Text style={styles.inputLabel}>State</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Gujarat"
                placeholderTextColor={THEME.textMuted}
                value={state}
                onChangeText={setState}
              />
            </View>
          </View>

          {/* Posting Location (Defense Base) */}
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Posting Location (CSD / Base)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Bhuj Cantonment / INS Valsura"
              placeholderTextColor={THEME.textMuted}
              value={posting}
              onChangeText={setPosting}
            />
          </View>

          {/* Birth Date & Anniversary Date (Two column row with date pickers) */}
          <View style={styles.formRow}>
            <View style={[styles.formGroup, styles.formCol]}>
              <Text style={styles.inputLabel}>Birth Date</Text>
              <TouchableOpacity
                style={styles.dateSelector}
                onPress={() => openDateModal('birth', 'Select Birth Date', birthDate)}
                activeOpacity={0.7}
              >
                <Calendar size={15} color={THEME.textSecondary} strokeWidth={2} />
                <Text style={birthDate ? styles.dateSelectedText : styles.datePlaceholderText}>
                  {birthDate || 'YYYY-MM-DD'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.formGroup, styles.formCol]}>
              <Text style={styles.inputLabel}>Anniversary Date</Text>
              <TouchableOpacity
                style={styles.dateSelector}
                onPress={() => openDateModal('anniversary', 'Select Anniversary Date', anniversaryDate)}
                activeOpacity={0.7}
              >
                <Calendar size={15} color={THEME.textSecondary} strokeWidth={2} />
                <Text style={anniversaryDate ? styles.dateSelectedText : styles.datePlaceholderText}>
                  {anniversaryDate || 'YYYY-MM-DD'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ========================================================= */}
        {/* SECTION B: Vehicle Requirement (Cascading Dropdowns) */}
        {/* ========================================================= */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: THEME.warningBg }]}>
              <Car size={16} color={THEME.warning} strokeWidth={2.4} />
            </View>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Section B: Vehicle Requirement</Text>
              <Text style={styles.sectionSubtitle}>Segment, brand & model configuration</Text>
            </View>
          </View>

          {/* Segment Radio Pills: [4 Wheeler] | [2 Wheeler] */}
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Vehicle Segment</Text>
            <View style={styles.segmentToggleRow}>
              {(['4 Wheeler', '2 Wheeler'] as const).map((seg) => {
                const isSelected = segment === seg;
                return (
                  <TouchableOpacity
                    key={seg}
                    style={[styles.segmentBtn, isSelected ? styles.segmentBtnActive : styles.segmentBtnInactive]}
                    onPress={() => {
                      triggerHaptic('selection');
                      setSegment(seg);
                      setSelectedBrand(null);
                      setSelectedModel(null);
                      setSelectedVariant(null);
                      setModels([]);
                      setVariants([]);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.segmentBtnText, isSelected ? styles.segmentBtnTextActive : styles.segmentBtnTextInactive]}>
                      {seg === '4 Wheeler' ? '🚗 4 Wheeler' : '🏍️ 2 Wheeler'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 1. Brand Dropdown */}
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Brand</Text>
            <TouchableOpacity
              style={styles.dropdownSelector}
              onPress={() =>
                openPicker(
                  'Select Brand',
                  brands.map((b) => ({ id: b.id, label: b.name })),
                  (item) => handleSelectBrand({ id: item.id, name: item.label })
                )
              }
              activeOpacity={0.7}
            >
              <Text style={selectedBrand ? styles.dropdownSelectedText : styles.dropdownPlaceholderText}>
                {selectedBrand ? selectedBrand.name : 'Choose Brand...'}
              </Text>
              <ChevronDown size={18} color={THEME.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* 2. Model Dropdown (Cascading) */}
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Model</Text>
            <TouchableOpacity
              style={[styles.dropdownSelector, !selectedBrand && styles.dropdownDisabled]}
              disabled={!selectedBrand || isLoadingModels}
              onPress={() =>
                openPicker(
                  'Select Model',
                  models.map((m) => ({ id: m.id, label: m.name })),
                  (item) => handleSelectModel({ id: item.id, brand_id: selectedBrand!.id, name: item.label })
                )
              }
              activeOpacity={0.7}
            >
              {isLoadingModels ? (
                <View style={styles.inlineLoader}>
                  <ActivityIndicator size="small" color={THEME.primaryNavy} />
                  <Text style={styles.inlineLoaderText}>Loading models...</Text>
                </View>
              ) : (
                <Text style={selectedModel ? styles.dropdownSelectedText : styles.dropdownPlaceholderText}>
                  {selectedModel ? selectedModel.name : selectedBrand ? 'Choose Model...' : 'Select Brand First'}
                </Text>
              )}
              <ChevronDown size={18} color={THEME.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* 3. Variant Dropdown (Cascading) */}
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Variant & Trim</Text>
            <TouchableOpacity
              style={[styles.dropdownSelector, !selectedModel && styles.dropdownDisabled]}
              disabled={!selectedModel || isLoadingVariants}
              onPress={() =>
                openPicker(
                  'Select Variant',
                  variants.map((v) => ({
                    id: v.id,
                    label: v.name,
                    sublabel: v.price ? `₹${Number(v.price).toLocaleString('en-IN')}` : undefined,
                  })),
                  (item) =>
                    setSelectedVariant({
                      id: item.id,
                      model_id: selectedModel!.id,
                      name: item.label,
                    })
                )
              }
              activeOpacity={0.7}
            >
              {isLoadingVariants ? (
                <View style={styles.inlineLoader}>
                  <ActivityIndicator size="small" color={THEME.primaryNavy} />
                  <Text style={styles.inlineLoaderText}>Loading variants...</Text>
                </View>
              ) : (
                <Text style={selectedVariant ? styles.dropdownSelectedText : styles.dropdownPlaceholderText}>
                  {selectedVariant ? selectedVariant.name : selectedModel ? 'Choose Variant...' : 'Select Model First'}
                </Text>
              )}
              <ChevronDown size={18} color={THEME.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Budget Field */}
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Expected Budget (₹)</Text>
            <View style={styles.currencyInputRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.currencyTextInput}
                placeholder="e.g. 1500000"
                placeholderTextColor={THEME.textMuted}
                keyboardType="numeric"
                value={budget}
                onChangeText={setBudget}
              />
            </View>
          </View>

          {/* Purchase Timeline Dropdown */}
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Purchase Timeline</Text>
            <TouchableOpacity
              style={styles.dropdownSelector}
              onPress={() =>
                openPicker(
                  'Select Purchase Timeline',
                  TIMELINE_OPTIONS.map((t) => ({ id: t, label: t })),
                  (item) => setTimeline(item.label)
                )
              }
              activeOpacity={0.7}
            >
              <Text style={styles.dropdownSelectedText}>{timeline}</Text>
              <ChevronDown size={18} color={THEME.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ========================================================= */}
        {/* SECTION C: Pipeline & Assignment */}
        {/* ========================================================= */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: THEME.successBg }]}>
              <Layers size={16} color={THEME.success} strokeWidth={2.4} />
            </View>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Section C: Pipeline & Assignment</Text>
              <Text style={styles.sectionSubtitle}>Priority, source channel & executive</Text>
            </View>
          </View>

          {/* Priority Segmented Radio Pills: [🔥 Hot] | [☀️ Warm] | [❄️ Cold] */}
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Priority</Text>
            <View style={styles.priorityPillsRow}>
              {/* Hot */}
              <TouchableOpacity
                style={[
                  styles.priorityPill,
                  priority === 'Hot' ? styles.priorityPillHotActive : styles.priorityPillInactive,
                ]}
                onPress={() => {
                  triggerHaptic('selection');
                  setPriority('Hot');
                }}
                activeOpacity={0.8}
              >
                <Flame size={14} color={priority === 'Hot' ? '#DC2626' : THEME.textSecondary} strokeWidth={2.4} />
                <Text
                  style={[
                    styles.priorityPillText,
                    priority === 'Hot' ? styles.priorityPillTextHot : styles.priorityPillTextInactive,
                  ]}
                >
                  Hot
                </Text>
              </TouchableOpacity>

              {/* Warm */}
              <TouchableOpacity
                style={[
                  styles.priorityPill,
                  priority === 'Warm' ? styles.priorityPillWarmActive : styles.priorityPillInactive,
                ]}
                onPress={() => {
                  triggerHaptic('selection');
                  setPriority('Warm');
                }}
                activeOpacity={0.8}
              >
                <Sun size={14} color={priority === 'Warm' ? '#D97706' : THEME.textSecondary} strokeWidth={2.4} />
                <Text
                  style={[
                    styles.priorityPillText,
                    priority === 'Warm' ? styles.priorityPillTextWarm : styles.priorityPillTextInactive,
                  ]}
                >
                  Warm
                </Text>
              </TouchableOpacity>

              {/* Cold */}
              <TouchableOpacity
                style={[
                  styles.priorityPill,
                  priority === 'Cold' ? styles.priorityPillColdActive : styles.priorityPillInactive,
                ]}
                onPress={() => {
                  triggerHaptic('selection');
                  setPriority('Cold');
                }}
                activeOpacity={0.8}
              >
                <Snowflake size={14} color={priority === 'Cold' ? '#0284C7' : THEME.textSecondary} strokeWidth={2.4} />
                <Text
                  style={[
                    styles.priorityPillText,
                    priority === 'Cold' ? styles.priorityPillTextCold : styles.priorityPillTextInactive,
                  ]}
                >
                  Cold
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Lead Source Dropdown */}
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Lead Source</Text>
            <TouchableOpacity
              style={styles.dropdownSelector}
              onPress={() =>
                openPicker(
                  'Select Lead Source',
                  sources.map((s) => ({ id: s.id, label: s.title || s.name || 'Direct' })),
                  (item) => setSelectedSource({ id: item.id, name: item.label, title: item.label })
                )
              }
              activeOpacity={0.7}
            >
              <Text style={selectedSource ? styles.dropdownSelectedText : styles.dropdownPlaceholderText}>
                {selectedSource ? selectedSource.name : 'Choose Source (e.g. Walk-in, Website)...'}
              </Text>
              <ChevronDown size={18} color={THEME.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Lead Status Dropdown (Static options, default 'New') */}
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Lead Status</Text>
            <TouchableOpacity
              style={styles.dropdownSelector}
              onPress={() =>
                openPicker(
                  'Select Lead Status',
                  STATIC_STATUSES.map((st) => ({ id: st, label: st })),
                  (item) => setStatusName(item.label)
                )
              }
              activeOpacity={0.7}
            >
              <Text style={styles.dropdownSelectedText}>{statusName}</Text>
              <ChevronDown size={18} color={THEME.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Assigned Executive Dropdown */}
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Assigned Executive</Text>
            <TouchableOpacity
              style={styles.dropdownSelector}
              onPress={() =>
                openPicker(
                  'Assign Sales Executive',
                  users.map((u) => ({
                    id: u.id,
                    label: u.name,
                    sublabel: u.role || u.role_name || 'Sales Executive',
                  })),
                  (item) =>
                    setSelectedExecutive({
                      id: item.id,
                      name: item.label,
                      role: item.sublabel,
                    })
                )
              }
              activeOpacity={0.7}
            >
              <Text style={selectedExecutive ? styles.dropdownSelectedText : styles.dropdownPlaceholderText}>
                {selectedExecutive ? `${selectedExecutive.name} (${selectedExecutive.role || 'Executive'})` : 'Assign Sales Executive...'}
              </Text>
              <ChevronDown size={18} color={THEME.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Submit & Cancel Actions */}
        <View style={styles.actionButtonGroup}>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Check size={18} color="#FFFFFF" strokeWidth={2.6} />
                <Text style={styles.submitButtonText}>Create & Save Lead</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleGoBack}
            disabled={isSubmitting}
            activeOpacity={0.75}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ========================================================= */}
      {/* Searchable Picker Modal (Reusable for Dropdowns) */}
      {/* ========================================================= */}
      <Modal
        visible={pickerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setPickerModalVisible(false)}
          />
          <View style={[styles.pickerModalContainer, { paddingBottom: insets.bottom + 16 }]}>
            {/* Header */}
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerHeaderTitle}>{pickerTitle}</Text>
              <TouchableOpacity
                onPress={() => setPickerModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={20} color={THEME.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.pickerSearchRow}>
              <Search size={16} color={THEME.textMuted} />
              <TextInput
                style={styles.pickerSearchInput}
                placeholder="Search..."
                placeholderTextColor={THEME.textMuted}
                value={pickerSearch}
                onChangeText={setPickerSearch}
                autoCorrect={false}
              />
              {pickerSearch.length > 0 && (
                <TouchableOpacity onPress={() => setPickerSearch('')}>
                  <X size={15} color={THEME.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* List */}
            <ScrollView style={styles.pickerListScroll} keyboardShouldPersistTaps="handled">
              {filteredPickerItems.length === 0 ? (
                <View style={styles.emptyPickerContainer}>
                  <Text style={styles.emptyPickerText}>No options found</Text>
                </View>
              ) : (
                filteredPickerItems.map((item) => (
                  <TouchableOpacity
                    key={String(item.id)}
                    style={styles.pickerOptionRow}
                    onPress={() => {
                      triggerHaptic('selection');
                      onPickerSelect(item);
                      setPickerModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.pickerOptionTextGroup}>
                      <Text style={styles.pickerOptionLabel}>{item.label}</Text>
                      {!!item.sublabel && (
                        <Text style={styles.pickerOptionSublabel}>{item.sublabel}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* Date Input Modal */}
      {/* ========================================================= */}
      <Modal
        visible={dateModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDateModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setDateModalVisible(false)}
          />
          <View style={styles.dateModalBox}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerHeaderTitle}>{dateModalTitle}</Text>
              <TouchableOpacity onPress={() => setDateModalVisible(false)}>
                <X size={20} color={THEME.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.dateHelperText}>
              Enter date in YYYY-MM-DD format (e.g. 1995-10-25)
            </Text>

            <TextInput
              style={styles.dateModalInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={THEME.textMuted}
              value={inputDateText}
              onChangeText={setInputDateText}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
              autoFocus
            />

            <View style={styles.dateModalBtnRow}>
              <TouchableOpacity
                style={styles.dateModalCancelBtn}
                onPress={() => setDateModalVisible(false)}
              >
                <Text style={styles.dateModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateModalSaveBtn}
                onPress={handleSaveDate}
              >
                <Text style={styles.dateModalSaveText}>Apply Date</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.primaryNavy,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginTop: 2,
  },
  headerSpacer: {
    width: 20,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },

  // Section Cards
  sectionCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.primaryNavy,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginTop: 1,
  },

  // Form Groups & Inputs
  formGroup: {
    gap: 6,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formCol: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  requiredStar: {
    color: THEME.danger,
    fontWeight: '800',
  },
  textInput: {
    height: 44,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    color: THEME.textPrimary,
  },
  inputErrorBorder: {
    borderColor: THEME.danger,
    backgroundColor: '#FFF5F5',
  },
  errorText: {
    fontSize: 11,
    color: THEME.danger,
    marginTop: 2,
    fontWeight: '500',
  },

  // Phone Input
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  phoneCountryCode: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: THEME.border,
  },
  phoneCountryCodeText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.primaryNavy,
  },
  phoneTextInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 14,
    color: THEME.textPrimary,
  },

  // Date Selector Box
  dateSelector: {
    height: 44,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateSelectedText: {
    fontSize: 14,
    color: THEME.textPrimary,
    fontWeight: '600',
  },
  datePlaceholderText: {
    fontSize: 13,
    color: THEME.textMuted,
  },

  // Segment Radio Pills Toggle
  segmentToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
  },
  segmentBtnActive: {
    backgroundColor: THEME.primaryNavy,
    borderColor: THEME.primaryNavy,
  },
  segmentBtnInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: THEME.border,
  },
  segmentBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  segmentBtnTextActive: {
    color: '#FFFFFF',
  },
  segmentBtnTextInactive: {
    color: THEME.textSecondary,
  },

  // Dropdown Selector
  dropdownSelector: {
    height: 44,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownDisabled: {
    opacity: 0.6,
    backgroundColor: '#F1F5F9',
  },
  dropdownSelectedText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.textPrimary,
  },
  dropdownPlaceholderText: {
    fontSize: 13,
    color: THEME.textMuted,
  },
  inlineLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineLoaderText: {
    fontSize: 12,
    color: THEME.primaryNavy,
    fontWeight: '500',
  },

  // Currency Row
  currencyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 12,
    paddingLeft: 12,
    height: 44,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.primaryNavy,
    marginRight: 6,
  },
  currencyTextInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: THEME.textPrimary,
  },

  // Priority Segmented Radio Pills
  priorityPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  priorityPillInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: THEME.border,
  },
  priorityPillHotActive: {
    backgroundColor: THEME.dangerBg,
    borderColor: THEME.danger,
  },
  priorityPillWarmActive: {
    backgroundColor: THEME.warningBg,
    borderColor: THEME.warning,
  },
  priorityPillColdActive: {
    backgroundColor: THEME.coldBg,
    borderColor: THEME.cold,
  },
  priorityPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  priorityPillTextHot: {
    color: THEME.danger,
  },
  priorityPillTextWarm: {
    color: THEME.warning,
  },
  priorityPillTextCold: {
    color: THEME.cold,
  },
  priorityPillTextInactive: {
    color: THEME.textSecondary,
  },

  // Action Button Group
  actionButtonGroup: {
    marginTop: 8,
    gap: 10,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: THEME.primaryNavy,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: THEME.primaryNavy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.textSecondary,
  },

  // Modal Backdrop
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  pickerModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pickerHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.primaryNavy,
  },
  pickerSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    marginTop: 12,
    marginBottom: 8,
  },
  pickerSearchInput: {
    flex: 1,
    fontSize: 13,
    color: THEME.textPrimary,
    padding: 0,
  },
  pickerListScroll: {
    maxHeight: 320,
  },
  pickerOptionRow: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pickerOptionTextGroup: {
    gap: 2,
  },
  pickerOptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.textPrimary,
  },
  pickerOptionSublabel: {
    fontSize: 12,
    color: THEME.textSecondary,
  },
  emptyPickerContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyPickerText: {
    fontSize: 13,
    color: THEME.textMuted,
  },

  // Date Modal Box
  dateModalBox: {
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 'auto',
    marginTop: 'auto',
  },
  dateHelperText: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginVertical: 12,
  },
  dateModalInput: {
    height: 44,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: THEME.primaryNavy,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: '700',
    color: THEME.primaryNavy,
    letterSpacing: 1,
  },
  dateModalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  dateModalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  dateModalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.textSecondary,
  },
  dateModalSaveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: THEME.primaryNavy,
  },
  dateModalSaveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
