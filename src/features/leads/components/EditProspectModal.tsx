import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { StartAlignedInput } from '../../../shared';
import { DatePickerModal } from './DatePickerModal';
import {
  BrandItem,
  CustomerLead,
  ModelItem,
  SourceItem,
  StatusItem,
  UserItem,
  VariantItem,
  LEAD_STATUS_OPTIONS,
  PURCHASE_TIMELINE_OPTIONS,
} from '../types';

interface EditProspectModalProps {
  visible: boolean;
  lead: CustomerLead | null; // null for Create New Lead
  brands: BrandItem[];
  models: ModelItem[];
  variants: VariantItem[];
  sources: SourceItem[];
  statuses: StatusItem[];
  users: UserItem[];
  onClose: () => void;
  onSubmit: (formData: any) => Promise<void>;
}

export const EditProspectModal: React.FC<EditProspectModalProps> = ({
  visible,
  lead,
  brands,
  models,
  variants,
  sources,
  statuses,
  users,
  onClose,
  onSubmit,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const isEdit = !!lead;

  // 1. Customer Details
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [homeTown, setHomeTown] = useState('');
  const [posting, setPosting] = useState('');
  const [state, setState] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [anniversaryDate, setAnniversaryDate] = useState('');
  const [activeDatePicker, setActiveDatePicker] = useState<'birthDate' | 'anniversaryDate' | null>(null);

  // 2. Vehicle Requirement & Lead Priority
  const [segment, setSegment] = useState<'4 Wheeler' | '2 Wheeler'>('4 Wheeler');
  const [brandId, setBrandId] = useState<number | null>(null);
  const [modelId, setModelId] = useState<number | null>(null);
  const [variantId, setVariantId] = useState<number | null>(null);
  const [priority, setPriority] = useState<'Hot' | 'Warm' | 'Cold'>('Hot');
  const [timeline, setTimeline] = useState<string>('Immediate (< 7 Days)');
  const [budget, setBudget] = useState('');

  // 3. Lead Tracking & Assignment
  const [sourceId, setSourceId] = useState<number | null>(null);
  const [statusName, setStatusName] = useState<string>('New');
  const [assignedTo, setAssignedTo] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter models and variants dynamically
  const filteredModels = models.filter((m) =>
    brandId ? m.brand_id === brandId : true
  );
  const filteredVariants = variants.filter((v) =>
    modelId ? v.model_id === modelId : true
  );

  useEffect(() => {
    if (lead) {
      setName(lead.name || '');
      setPhone(lead.phone || '');
      setEmail(lead.email || '');
      setHomeTown(lead.home_town || lead.city || '');
      setPosting(lead.posting || '');
      setState(lead.state || '');
      setBirthDate(lead.birth_date || lead.birthday || '');
      setAnniversaryDate(lead.anniversary_date || '');
      setSegment(lead.vehicle_segment || '4 Wheeler');
      setBrandId(lead.brand_id || null);
      setModelId(lead.model_id || null);
      setVariantId(lead.variant_id || null);
      setPriority(lead.priority || 'Hot');
      setTimeline(lead.purchase_timeline || 'Immediate (< 7 Days)');
      setBudget(lead.budget !== undefined && lead.budget !== null ? lead.budget.toString() : '');
      setSourceId(lead.source_id || (sources[0]?.id ?? null));
      setStatusName(lead.status_name || lead.lead_status || 'New');
      setAssignedTo(lead.assigned_to || (users[0]?.id ?? null));
      setNotes(lead.notes || '');
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setHomeTown('');
      setPosting('');
      setState('');
      setBirthDate('');
      setAnniversaryDate('');
      setSegment('4 Wheeler');
      setBrandId(brands[0]?.id || null);
      setModelId(null);
      setVariantId(null);
      setPriority('Hot');
      setTimeline('Immediate (< 7 Days)');
      setBudget(''); // Default Blank
      setSourceId(sources[0]?.id || null);
      setStatusName('New');
      setAssignedTo(users[0]?.id || null);
      setNotes('');
    }
  }, [lead, visible, brands, sources, statuses, users]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter customer name.');
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      Alert.alert('Required Field', 'Please enter a valid 10-digit phone number.');
      return;
    }

    try {
      setIsSubmitting(true);
      const selectedBrand = brands.find((b) => b.id === brandId);
      const selectedModel = models.find((m) => m.id === modelId);
      const selectedVariant = variants.find((v) => v.id === variantId);

      const matchedStatus = statuses.find(
        (s) => s.name?.toLowerCase() === statusName.toLowerCase()
      );

      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        city: homeTown.trim() || 'Delhi',
        home_town: homeTown.trim(),
        posting: posting.trim(),
        state: state.trim(),
        birth_date: birthDate.trim(),
        birthday: birthDate.trim(),
        anniversary_date: anniversaryDate.trim(),
        vehicle_segment: segment,
        brand_id: brandId,
        brand_name: selectedBrand?.name,
        model_id: modelId,
        model_name: selectedModel?.name,
        variant_id: variantId,
        variant_name: selectedVariant?.name,
        model_variant:
          `${selectedModel?.name || ''} ${selectedVariant?.name || ''}`.trim() ||
          (selectedBrand ? `${selectedBrand.name} Vehicle` : 'CSD Vehicle'),
        priority,
        purchase_timeline: timeline,
        budget: budget.trim(),
        source_id: sourceId,
        source_name:
          sources.find((s) => s.id === sourceId)?.title ||
          sources.find((s) => s.id === sourceId)?.name,
        status_id: matchedStatus?.id || undefined,
        status_name: statusName,
        lead_status: statusName,
        assigned_to: assignedTo,
        assigned_user_name: users.find((u) => u.id === assignedTo)?.name,
        notes: notes.trim(),
      };

      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      Alert.alert('Submission Error', err?.message || 'Failed to save lead information.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
            },
          ]}
        >
          {/* Grab Handle */}
          <View style={styles.grabHandleRow}>
            <View
              style={[
                styles.grabHandle,
                { backgroundColor: isDark ? '#334155' : '#CBD5E1' },
              ]}
            />
          </View>

          {/* Modal Header */}
          <View
            style={[
              styles.sheetHeader,
              { borderBottomColor: isDark ? '#1E293B' : '#F1F5F9' },
            ]}
          >
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.logoBadge,
                  {
                    backgroundColor: isDark ? '#101726' : '#F8FAFC',
                    borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  },
                ]}
              >
                <Image
                  source={require('../../../../assets/logo.png')}
                  style={styles.logoImg}
                  resizeMode="contain"
                />
              </View>
              <View>
                <View style={styles.headerTitleRow}>
                  <Text
                    style={[
                      styles.sheetTitle,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {isEdit ? 'Edit Customer Lead' : 'Add New Customer Lead'}
                  </Text>
                  <View
                    style={[
                      styles.quotaBadge,
                      {
                        backgroundColor: isDark
                          ? 'rgba(189, 207, 121, 0.15)'
                          : '#EBF3D7',
                        borderColor: isDark
                          ? 'rgba(189, 207, 121, 0.4)'
                          : '#D4ECA2',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.quotaText,
                        { color: isDark ? colors.primary : colors.primaryDark },
                      ]}
                    >
                      PIPELINE
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.sheetSub,
                    { color: colors.textSecondary },
                  ]}
                >
                  Manage prospect specifications & allocation
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.closeBtn,
                {
                  backgroundColor: isDark ? '#162030' : '#F1F5F9',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
              onPress={onClose}
              hitSlop={{ top: 18, bottom: 18, left: 18, right: 18 }}
              activeOpacity={0.7}
            >
              <Text style={[styles.closeIcon, { color: colors.textPrimary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Scrollable Form */}
          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.formContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            {/* =========================================
                SECTION 1: CUSTOMER DETAILS
            ========================================= */}
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: isDark ? '#101726' : '#F8FAFC',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
            >
              <View style={styles.sectionHeaderRow}>
                <View style={[styles.sectionIndicator, { backgroundColor: colors.primary }]} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  1. Customer Details
                </Text>
              </View>

              {/* Customer Full Name */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  CUSTOMER FULL NAME <Text style={styles.reqStar}>*</Text>
                </Text>
                <StartAlignedInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#CBD5E1',
                      color: colors.textPrimary,
                    },
                  ]}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Maj. Rohit Sharma / Jinal Pujara"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {/* Phone & Email Row */}
              <View style={styles.twoColRow}>
                <View style={styles.colCell}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    PHONE NUMBER <Text style={styles.reqStar}>*</Text>
                  </Text>
                  <View style={styles.phoneInputRow}>
                    <View
                      style={[
                        styles.phonePrefix,
                        {
                          backgroundColor: isDark ? '#162030' : '#F1F5F9',
                          borderColor: isDark ? '#1E293B' : '#CBD5E1',
                        },
                      ]}
                    >
                      <Text style={[styles.prefixText, { color: colors.textSecondary }]}>
                        +91
                      </Text>
                    </View>
                    <StartAlignedInput
                      style={[
                        styles.phoneInput,
                        {
                          backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                          borderColor: isDark ? '#1E293B' : '#CBD5E1',
                          color: colors.textPrimary,
                        },
                      ]}
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="9876543210"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <View style={styles.colCell}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    EMAIL ADDRESS
                  </Text>
                  <StartAlignedInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                        borderColor: isDark ? '#1E293B' : '#CBD5E1',
                        color: colors.textPrimary,
                      },
                    ]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="officer@nic.in"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                  />
                </View>
              </View>

              {/* Home Town & Posting */}
              <View style={styles.twoColRow}>
                <View style={styles.colCell}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    HOME TOWN
                  </Text>
                  <StartAlignedInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                        borderColor: isDark ? '#1E293B' : '#CBD5E1',
                        color: colors.textPrimary,
                      },
                    ]}
                    value={homeTown}
                    onChangeText={setHomeTown}
                    placeholder="e.g. Surendranagar / Pune"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={styles.colCell}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    POSTING
                  </Text>
                  <StartAlignedInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                        borderColor: isDark ? '#1E293B' : '#CBD5E1',
                        color: colors.textPrimary,
                      },
                    ]}
                    value={posting}
                    onChangeText={setPosting}
                    placeholder="e.g. Pune Cantt / HQ"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              {/* State */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  STATE
                </Text>
                <StartAlignedInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#CBD5E1',
                      color: colors.textPrimary,
                    },
                  ]}
                  value={state}
                  onChangeText={setState}
                  placeholder="e.g. Gujarat / Maharashtra"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {/* Birth Date & Anniversary Date */}
              <View style={styles.twoColRow}>
                <View style={styles.colCell}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    BIRTH DATE (BIRTHDAY)
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.datePickerBtn,
                      {
                        backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                        borderColor: isDark ? '#1E293B' : '#CBD5E1',
                      },
                    ]}
                    onPress={() => {
                      triggerHaptic('selection');
                      setActiveDatePicker('birthDate');
                    }}
                    activeOpacity={0.7}
                  >
                    <Calendar size={14} color={birthDate ? colors.primary : colors.textMuted} />
                    <Text
                      style={[
                        styles.datePickerBtnText,
                        {
                          color: birthDate ? colors.textPrimary : colors.textMuted,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {birthDate || 'Select Date'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.colCell}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    ANNIVERSARY DATE
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.datePickerBtn,
                      {
                        backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                        borderColor: isDark ? '#1E293B' : '#CBD5E1',
                      },
                    ]}
                    onPress={() => {
                      triggerHaptic('selection');
                      setActiveDatePicker('anniversaryDate');
                    }}
                    activeOpacity={0.7}
                  >
                    <Calendar size={14} color={anniversaryDate ? colors.primary : colors.textMuted} />
                    <Text
                      style={[
                        styles.datePickerBtnText,
                        {
                          color: anniversaryDate ? colors.textPrimary : colors.textMuted,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {anniversaryDate || 'Select Date'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* =========================================
                SECTION 2: VEHICLE REQUIREMENT & PRIORITY
            ========================================= */}
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: isDark ? '#101726' : '#F8FAFC',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  marginTop: 14,
                },
              ]}
            >
              <View style={styles.sectionHeaderRow}>
                <View style={[styles.sectionIndicator, { backgroundColor: '#38BDF8' }]} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  2. Vehicle Requirement & Lead Priority
                </Text>
              </View>

              {/* Vehicle Segment Selector */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  VEHICLE SEGMENT <Text style={styles.reqStar}>*</Text>
                </Text>
                <View
                  style={[
                    styles.segmentToggleBox,
                    {
                      backgroundColor: isDark ? '#131B2E' : '#F1F5F9',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.segmentBtn,
                      segment === '4 Wheeler' && [
                        styles.segmentBtnActive,
                        { backgroundColor: colors.primary },
                      ],
                    ]}
                    onPress={() => setSegment('4 Wheeler')}
                  >
                    <Text style={styles.segIcon}>🚗</Text>
                    <Text
                      style={[
                        styles.segmentBtnText,
                        {
                          color:
                            segment === '4 Wheeler'
                              ? '#FFFFFF'
                              : colors.textSecondary,
                        },
                      ]}
                    >
                      4-Wheeler (Car/SUV)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.segmentBtn,
                      segment === '2 Wheeler' && [
                        styles.segmentBtnActive,
                        { backgroundColor: colors.primary },
                      ],
                    ]}
                    onPress={() => setSegment('2 Wheeler')}
                  >
                    <Text style={styles.segIcon}>🏍️</Text>
                    <Text
                      style={[
                        styles.segmentBtnText,
                        {
                          color:
                            segment === '2 Wheeler'
                              ? '#FFFFFF'
                              : colors.textSecondary,
                        },
                      ]}
                    >
                      2-Wheeler (Bike)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Brand Selection Chips */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  BRAND NAME <Text style={styles.reqStar}>*</Text>
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipsScroll}
                >
                  {brands.map((b) => {
                    const isSel = brandId === b.id;
                    return (
                      <TouchableOpacity
                        key={b.id}
                        style={[
                          styles.chipBtn,
                          {
                            backgroundColor: isSel
                              ? colors.primary
                              : isDark
                              ? '#131B2E'
                              : '#F1F5F9',
                            borderColor: isSel
                              ? colors.primaryDark
                              : isDark
                              ? '#1E293B'
                              : '#CBD5E1',
                          },
                        ]}
                        onPress={() => {
                          setBrandId(b.id);
                          setModelId(null);
                          setVariantId(null);
                        }}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            {
                              color: isSel
                                ? '#FFFFFF'
                                : isDark
                                ? '#94A3B8'
                                : '#475569',
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

              {/* Model Selection Chips */}
              {filteredModels.length > 0 && (
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    MODEL
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipsScroll}
                  >
                    {filteredModels.map((m) => {
                      const isSel = modelId === m.id;
                      return (
                        <TouchableOpacity
                          key={m.id}
                          style={[
                            styles.chipBtn,
                            {
                              backgroundColor: isSel
                                ? colors.primary
                                : isDark
                                ? '#131B2E'
                                : '#F1F5F9',
                              borderColor: isSel
                                ? colors.primaryDark
                                : isDark
                                ? '#1E293B'
                                : '#CBD5E1',
                            },
                          ]}
                          onPress={() => {
                            setModelId(m.id);
                            setVariantId(null);
                          }}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              {
                                color: isSel
                                  ? '#FFFFFF'
                                  : isDark
                                  ? '#94A3B8'
                                  : '#475569',
                              },
                            ]}
                          >
                            {m.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Variant Selection Chips */}
              {filteredVariants.length > 0 && (
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    VARIANT
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipsScroll}
                  >
                    {filteredVariants.map((v) => {
                      const isSel = variantId === v.id;
                      return (
                        <TouchableOpacity
                          key={v.id}
                          style={[
                            styles.chipBtn,
                            {
                              backgroundColor: isSel
                                ? colors.primary
                                : isDark
                                ? '#131B2E'
                                : '#F1F5F9',
                              borderColor: isSel
                                ? colors.primaryDark
                                : isDark
                                ? '#1E293B'
                                : '#CBD5E1',
                            },
                          ]}
                          onPress={() => setVariantId(v.id)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              {
                                color: isSel
                                  ? '#FFFFFF'
                                  : isDark
                                  ? '#94A3B8'
                                  : '#475569',
                              },
                            ]}
                          >
                            {v.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Lead Priority / Temperature */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  LEAD PRIORITY / TEMPERATURE <Text style={styles.reqStar}>*</Text>
                </Text>
                <View style={styles.stageRow}>
                  {(['Hot', 'Warm', 'Cold'] as const).map((p) => {
                    const isActive = priority === p;
                    return (
                      <TouchableOpacity
                        key={p}
                        style={[
                          styles.stageOption,
                          {
                            backgroundColor: isActive
                              ? p === 'Hot'
                                ? '#EF4444'
                                : p === 'Warm'
                                ? '#F59E0B'
                                : '#0284C7'
                              : isDark
                              ? '#131B2E'
                              : '#F1F5F9',
                            borderColor: isActive
                              ? '#FFFFFF'
                              : isDark
                              ? '#1E293B'
                              : '#CBD5E1',
                          },
                        ]}
                        onPress={() => setPriority(p)}
                      >
                        <Text
                          style={[
                            styles.stageOptionText,
                            {
                              color: isActive
                                ? '#FFFFFF'
                                : isDark
                                ? '#94A3B8'
                                : '#475569',
                            },
                          ]}
                        >
                          {p === 'Hot' ? '🔥 Hot' : p === 'Warm' ? '☀️ Warm' : '❄️ Cold'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Planning In (Purchase Timeline) - 3 Options like Priority */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  PLANNING IN (PURCHASE TIMELINE)
                </Text>
                <View style={styles.timelineChipsRow}>
                  {PURCHASE_TIMELINE_OPTIONS.map((opt) => {
                    const isSel = timeline === opt;
                    return (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          styles.timelineChip,
                          {
                            backgroundColor: isSel
                              ? colors.primary
                              : isDark
                              ? '#131B2E'
                              : '#F1F5F9',
                            borderColor: isSel
                              ? colors.primaryDark
                              : isDark
                              ? '#1E293B'
                              : '#CBD5E1',
                          },
                        ]}
                        onPress={() => setTimeline(opt)}
                      >
                        <Text
                          style={[
                            styles.timelineChipText,
                            {
                              color: isSel
                                ? '#FFFFFF'
                                : isDark
                                ? '#94A3B8'
                                : '#475569',
                            },
                          ]}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Budget (Blank by default) */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  BUDGET (₹)
                </Text>
                <StartAlignedInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#CBD5E1',
                      color: colors.textPrimary,
                    },
                  ]}
                  value={budget}
                  onChangeText={setBudget}
                  placeholder="Enter expected budget or leave blank"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* =========================================
                SECTION 3: LEAD TRACKING & ASSIGNMENT
            ========================================= */}
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: isDark ? '#101726' : '#F8FAFC',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  marginTop: 14,
                },
              ]}
            >
              <View style={styles.sectionHeaderRow}>
                <View style={[styles.sectionIndicator, { backgroundColor: '#10B981' }]} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  3. Lead Tracking & Assignment
                </Text>
              </View>

              {/* Lead Source */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  LEAD SOURCE
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipsScroll}
                >
                  {sources.map((s) => {
                    const isSel = sourceId === s.id;
                    return (
                      <TouchableOpacity
                        key={s.id}
                        style={[
                          styles.chipBtn,
                          {
                            backgroundColor: isSel
                              ? colors.primary
                              : isDark
                              ? '#131B2E'
                              : '#F1F5F9',
                            borderColor: isSel
                              ? colors.primaryDark
                              : isDark
                              ? '#1E293B'
                              : '#CBD5E1',
                          },
                        ]}
                        onPress={() => setSourceId(s.id)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            {
                              color: isSel
                                ? '#FFFFFF'
                                : isDark
                                ? '#94A3B8'
                                : '#475569',
                            },
                          ]}
                        >
                          {s.title || s.name || `Source #${s.id}`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Lead Status (Static from SS 1) */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  LEAD STATUS
                </Text>
                <View style={styles.statusChipsGrid}>
                  {LEAD_STATUS_OPTIONS.map((st) => {
                    const isSel = statusName.toLowerCase() === st.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={st}
                        style={[
                          styles.statusChipBtn,
                          {
                            backgroundColor: isSel
                              ? colors.primary
                              : isDark
                              ? '#131B2E'
                              : '#F1F5F9',
                            borderColor: isSel
                              ? colors.primaryDark
                              : isDark
                              ? '#1E293B'
                              : '#CBD5E1',
                          },
                        ]}
                        onPress={() => setStatusName(st)}
                      >
                        <Text
                          style={[
                            styles.statusChipText,
                            {
                              color: isSel
                                ? '#FFFFFF'
                                : isDark
                                ? '#94A3B8'
                                : '#475569',
                            },
                          ]}
                        >
                          {st}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Assigned Executive */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  ASSIGNED EXECUTIVE
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipsScroll}
                >
                  {users.map((u) => {
                    const isSel = assignedTo === u.id;
                    return (
                      <TouchableOpacity
                        key={u.id}
                        style={[
                          styles.chipBtn,
                          {
                            backgroundColor: isSel
                              ? colors.primary
                              : isDark
                              ? '#131B2E'
                              : '#F1F5F9',
                            borderColor: isSel
                              ? colors.primaryDark
                              : isDark
                              ? '#1E293B'
                              : '#CBD5E1',
                          },
                        ]}
                        onPress={() => setAssignedTo(u.id)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            {
                              color: isSel
                                ? '#FFFFFF'
                                : isDark
                                ? '#94A3B8'
                                : '#475569',
                            },
                          ]}
                        >
                          {u.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Notes */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  OPERATIONAL NOTES
                </Text>
                <TextInput
                  style={[
                    styles.inputMultiline,
                    {
                      backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#CBD5E1',
                      color: colors.textPrimary,
                    },
                  ]}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  placeholder="Enter special requirements, unit details, canteen remarks..."
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View
            style={[
              styles.footer,
              {
                borderTopColor: isDark ? '#1E293B' : '#F1F5F9',
                backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                paddingBottom: Math.max(insets.bottom, 24) + 8,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.cancelBtn,
                {
                  backgroundColor: isDark ? '#162030' : '#F1F5F9',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitBtn,
                { backgroundColor: colors.primary },
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {isEdit ? 'Save Changes' : 'Create Customer Lead'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Date Picker Modal for Birth Date & Anniversary Date (Current & Past Dates Only) */}
      <DatePickerModal
        visible={activeDatePicker !== null}
        title={
          activeDatePicker === 'birthDate'
            ? 'Select Birth Date (Birthday)'
            : 'Select Anniversary Date'
        }
        initialDate={
          activeDatePicker === 'birthDate' ? birthDate : anniversaryDate
        }
        onClose={() => setActiveDatePicker(null)}
        onSelectDate={(selectedDate) => {
          if (activeDatePicker === 'birthDate') {
            setBirthDate(selectedDate);
          } else if (activeDatePicker === 'anniversaryDate') {
            setAnniversaryDate(selectedDate);
          }
        }}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    maxHeight: '92%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  grabHandleRow: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  grabHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImg: {
    width: 26,
    height: 26,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  quotaBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  quotaText: {
    fontSize: 9,
    fontWeight: '800',
  },
  sheetSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 12,
    fontWeight: '700',
  },
  formScroll: {
    flexGrow: 0,
  },
  formContent: {
    padding: 14,
    paddingBottom: 20,
  },
  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
  },
  sectionIndicator: {
    width: 4,
    height: 16,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  reqStar: {
    color: '#EF4444',
  },
  input: {
    height: 42,
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '600',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  datePickerBtn: {
    height: 42,
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  datePickerBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  colCell: {
    flex: 1,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phonePrefix: {
    height: 42,
    paddingHorizontal: 10,
    borderTopLeftRadius: 9,
    borderBottomLeftRadius: 9,
    borderWidth: 1,
    borderRightWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefixText: {
    fontSize: 12,
    fontWeight: '700',
  },
  phoneInput: {
    flex: 1,
    height: 42,
    borderTopRightRadius: 9,
    borderBottomRightRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 13,
    fontWeight: '600',
  },
  segmentToggleBox: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
    gap: 6,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 7,
    gap: 6,
  },
  segmentBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  segIcon: {
    fontSize: 14,
  },
  segmentBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chipsScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  chipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stageRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stageOption: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageOptionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  timelineChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timelineChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  timelineChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inputMultiline: {
    minHeight: 68,
    borderRadius: 9,
    borderWidth: 1,
    padding: 10,
    fontSize: 12,
    fontWeight: '500',
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 11,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});

export default EditProspectModal;
