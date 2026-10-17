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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../core/theme/ThemeContext';
import { StartAlignedInput } from '../../../shared';
import {
  BrandItem,
  CustomerLead,
  ModelItem,
  SourceItem,
  StatusItem,
  UserItem,
  VariantItem,
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

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [segment, setSegment] = useState<'4 Wheeler' | '2 Wheeler'>('4 Wheeler');
  const [brandId, setBrandId] = useState<number | null>(null);
  const [modelId, setModelId] = useState<number | null>(null);
  const [variantId, setVariantId] = useState<number | null>(null);
  const [priority, setPriority] = useState<'Hot' | 'Warm' | 'Cold'>('Hot');
  const [timeline, setTimeline] = useState('Immediate (< 7 Days)');
  const [budget, setBudget] = useState('CSD Entitlement');
  const [sourceId, setSourceId] = useState<number | null>(null);
  const [statusId, setStatusId] = useState<number | null>(null);
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
      setCity(lead.city || '');
      setState(lead.state || '');
      setSegment(lead.vehicle_segment || '4 Wheeler');
      setBrandId(lead.brand_id || null);
      setModelId(lead.model_id || null);
      setVariantId(lead.variant_id || null);
      setPriority(lead.priority || 'Hot');
      setTimeline(lead.purchase_timeline || 'Immediate (< 7 Days)');
      setBudget(lead.budget ? lead.budget.toString() : 'CSD Entitlement');
      setSourceId(lead.source_id || null);
      setStatusId(lead.status_id || null);
      setAssignedTo(lead.assigned_to || null);
      setNotes(lead.notes || '');
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setCity('Delhi');
      setState('Delhi');
      setSegment('4 Wheeler');
      setBrandId(brands[0]?.id || null);
      setModelId(null);
      setVariantId(null);
      setPriority('Hot');
      setTimeline('Immediate (< 7 Days)');
      setBudget('CSD Entitlement');
      setSourceId(sources[0]?.id || null);
      setStatusId(statuses[0]?.id || null);
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

      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        city: city.trim(),
        state: state.trim(),
        vehicle_segment: segment,
        brand_id: brandId,
        brand_name: selectedBrand?.name,
        model_id: modelId,
        model_name: selectedModel?.name,
        variant_id: variantId,
        variant_name: selectedVariant?.name,
        model_variant: `${selectedModel?.name || ''} ${selectedVariant?.name || ''}`.trim() || 'CSD Vehicle',
        priority,
        purchase_timeline: timeline,
        budget,
        source_id: sourceId,
        status_id: statusId,
        assigned_to: assignedTo,
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
                    {isEdit ? 'Edit Prospect' : 'Register New Prospect'}
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
                      CSD QUOTA
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.sheetSub,
                    { color: colors.textSecondary },
                  ]}
                >
                  Vehicle entitlement & allocation tracker
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
            {/* Vehicle Segment Selector */}
            <View style={styles.fieldGroup}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: colors.textSecondary },
                ]}
              >
                VEHICLE SEGMENT <Text style={styles.reqStar}>*</Text>
              </Text>
              <View
                style={[
                  styles.segmentToggleBox,
                  {
                    backgroundColor: isDark ? '#101726' : '#F1F5F9',
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

            {/* Customer Name */}
            <View style={styles.fieldGroup}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: colors.textSecondary },
                ]}
              >
                CUSTOMER FULL NAME <Text style={styles.reqStar}>*</Text>
              </Text>
              <StartAlignedInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#101726' : '#FFFFFF',
                    borderColor: isDark ? '#1E293B' : '#CBD5E1',
                    color: colors.textPrimary,
                  },
                ]}
                value={name}
                onChangeText={setName}
                placeholder="Rank, Full Name (e.g. Maj. Rohit Sharma)"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            {/* Phone & Email Row */}
            <View style={styles.twoColRow}>
              <View style={styles.colCell}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: colors.textSecondary },
                  ]}
                >
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
                    <Text
                      style={[
                        styles.prefixText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      +91
                    </Text>
                  </View>
                  <StartAlignedInput
                    style={[
                      styles.phoneInput,
                      {
                        backgroundColor: isDark ? '#101726' : '#FFFFFF',
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
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  EMAIL ADDRESS
                </Text>
                <StartAlignedInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#101726' : '#FFFFFF',
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

            {/* Station / City & State */}
            <View style={styles.twoColRow}>
              <View style={styles.colCell}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  STATION / CITY
                </Text>
                <StartAlignedInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#101726' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#CBD5E1',
                      color: colors.textPrimary,
                    },
                  ]}
                  value={city}
                  onChangeText={setCity}
                  placeholder="e.g. Pune / Delhi"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.colCell}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  STATE / COMMAND
                </Text>
                <StartAlignedInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#101726' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#CBD5E1',
                      color: colors.textPrimary,
                    },
                  ]}
                  value={state}
                  onChangeText={setState}
                  placeholder="e.g. Maharashtra"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            {/* Vehicle Selection Chips */}
            <View style={styles.fieldGroup}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: colors.textSecondary },
                ]}
              >
                BRAND SELECTION
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
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
                            ? '#101726'
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
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  MODEL
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
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
                              ? '#101726'
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
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  VARIANT
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
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
                              ? '#101726'
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

            {/* Priority Selector */}
            <View style={styles.fieldGroup}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: colors.textSecondary },
                ]}
              >
                LEAD PRIORITY
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
                            ? '#101726'
                            : '#F1F5F9',
                          borderColor: isDark ? '#1E293B' : '#CBD5E1',
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
                        {p} Priority
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Timeline & Budget Grid */}
            <View style={styles.twoColRow}>
              <View style={styles.colCell}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  BUYING TIMELINE
                </Text>
                <StartAlignedInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#101726' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#CBD5E1',
                      color: colors.textPrimary,
                    },
                  ]}
                  value={timeline}
                  onChangeText={setTimeline}
                  placeholder="Immediate (< 7 Days)"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.colCell}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  BUDGET / ENTITLEMENT
                </Text>
                <StartAlignedInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#101726' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#CBD5E1',
                      color: colors.textPrimary,
                    },
                  ]}
                  value={budget}
                  onChangeText={setBudget}
                  placeholder="CSD Entitlement"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            {/* Assigned Executive */}
            <View style={styles.fieldGroup}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: colors.textSecondary },
                ]}
              >
                ASSIGN TO SALES EXECUTIVE
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
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
                            ? '#101726'
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
              <Text
                style={[
                  styles.fieldLabel,
                  { color: colors.textSecondary },
                ]}
              >
                OPERATIONAL NOTES
              </Text>
              <TextInput
                style={[
                  styles.inputMultiline,
                  {
                    backgroundColor: isDark ? '#101726' : '#FFFFFF',
                    borderColor: isDark ? '#1E293B' : '#CBD5E1',
                    color: colors.textPrimary,
                  },
                ]}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                placeholder="Enter special requirements, defense command, canteen verification..."
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View
            style={[
              styles.footer,
              {
                borderTopColor: isDark ? '#1E293B' : '#F1F5F9',
                backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                paddingBottom: Math.max(insets.bottom, 28) + 8,
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
              <Text
                style={[
                  styles.cancelBtnText,
                  { color: colors.textPrimary },
                ]}
              >
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
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {isEdit ? 'Save & Update Prospect' : 'Register Prospect'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    height: '92%',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  grabHandleRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  grabHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  quotaBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
  },
  quotaText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sheetSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    padding: 18,
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  reqStar: {
    color: '#EF4444',
  },
  segmentToggleBox: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 6,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  segmentBtnActive: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  segIcon: {
    fontSize: 14,
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '600',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  colCell: {
    flex: 1,
    gap: 6,
  },
  phoneInputRow: {
    flexDirection: 'row',
  },
  phonePrefix: {
    width: 48,
    height: 44,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
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
    height: 44,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 13,
    fontWeight: '600',
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
  inputMultiline: {
    minHeight: 72,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    fontSize: 12,
    fontWeight: '500',
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4A5D23',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});

export default EditProspectModal;
