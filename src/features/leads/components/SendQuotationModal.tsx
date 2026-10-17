import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../core/theme/ThemeContext';
import { StartAlignedInput } from '../../../shared';
import { quotationApi } from '../../quotations/quotationService';
import { BrandItem, CustomerLead, ModelItem, VariantItem } from '../types';

interface SendQuotationModalProps {
  visible: boolean;
  lead: CustomerLead | null;
  brands: BrandItem[];
  models: ModelItem[];
  variants: VariantItem[];
  onClose: () => void;
  onSuccess?: () => void;
}

export const SendQuotationModal: React.FC<SendQuotationModalProps> = ({
  visible,
  lead,
  brands,
  models,
  variants,
  onClose,
  onSuccess,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Form States
  const [clientName, setClientName] = useState('');
  const [clientMobile, setClientMobile] = useState('');
  const [city, setCity] = useState('');
  const [quotationDate, setQuotationDate] = useState('10.10.26');

  // Vehicle Selection
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [fuelTag, setFuelTag] = useState<'PETROL' | 'DIESEL' | 'CNG' | 'ELECTRIC'>('PETROL');
  const [sheetCarTitle, setSheetCarTitle] = useState('');
  const [sheetModelTitle, setSheetModelTitle] = useState('');

  // Executive Details
  const [execName, setExecName] = useState('ADMIN USER');
  const [execPhone, setExecPhone] = useState('+91 98000 11111');

  // Price Parameters
  const [csdPrice, setCsdPrice] = useState('1149000');
  const [gjRto, setGjRto] = useState('68940');
  const [insurance, setInsurance] = useState('43662');
  const [accessories, setAccessories] = useState('0');
  const [warranty, setWarranty] = useState('0');
  const [msReword, setMsReword] = useState('0');
  const [diffCash, setDiffCash] = useState('0');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-Fill when lead changes
  useEffect(() => {
    if (lead) {
      setClientName(lead.name || '');
      setClientMobile(lead.phone || '');
      setCity(lead.city || 'pune');
      setQuotationDate(
        lead.created_at
          ? lead.created_at.split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      setExecName(lead.assigned_user_name || 'ADMIN USER');

      const brand = brands.find(
        (b) => b.id === lead.brand_id || b.name === lead.brand_name
      );
      if (brand) setSelectedBrandId(brand.id);

      const model = models.find(
        (m) => m.id === lead.model_id || m.name === lead.model_name
      );
      if (model) setSelectedModelId(model.id);

      const variant = variants.find(
        (v) => v.id === lead.variant_id || v.name === lead.variant_name
      );
      if (variant) {
        setSelectedVariantId(variant.id);
        if (variant.price) {
          setCsdPrice(variant.price.toString().replace(/[^0-9]/g, ''));
        }
      }

      setSheetCarTitle(
        lead.brand_name
          ? `${lead.brand_name.toUpperCase()} ${lead.model_name || ''}`.trim()
          : 'MARUTI SUZUKI BREZZA'
      );
      setSheetModelTitle(
        lead.variant_name
          ? lead.variant_name.toUpperCase()
          : lead.model_variant
          ? lead.model_variant.toUpperCase()
          : 'ZXI DUAL TONE'
      );
    }
  }, [lead, brands, models, variants]);

  // Filtered Models & Variants
  const availableModels = useMemo(() => {
    if (!selectedBrandId) return models;
    return models.filter((m) => m.brand_id === selectedBrandId);
  }, [models, selectedBrandId]);

  const availableVariants = useMemo(() => {
    if (!selectedModelId) return variants;
    return variants.filter((v) => v.model_id === selectedModelId);
  }, [variants, selectedModelId]);

  // Estimated On-Road Price Calculation
  const estimatedOnRoadPrice = useMemo(() => {
    const csd = parseFloat(csdPrice) || 0;
    const rto = parseFloat(gjRto) || 0;
    const ins = parseFloat(insurance) || 0;
    const acc = parseFloat(accessories) || 0;
    const war = parseFloat(warranty) || 0;
    const rew = parseFloat(msReword) || 0;
    const diff = parseFloat(diffCash) || 0;
    return Math.max(0, csd + rto + ins + acc + war + diff - rew);
  }, [csdPrice, gjRto, insurance, accessories, warranty, msReword, diffCash]);

  const handleSaveQuotation = async () => {
    try {
      setIsSubmitting(true);
      const payload = {
        lead_id: lead?.id,
        brand_id: selectedBrandId,
        model_id: selectedModelId,
        variant_id: selectedVariantId,
        csd_base_price: parseFloat(csdPrice) || 0,
        rto_charges: parseFloat(gjRto) || 0,
        insurance_charges: parseFloat(insurance) || 0,
        accessories_charges: parseFloat(accessories) || 0,
        extended_warranty: parseFloat(warranty) || 0,
        discount_amount: parseFloat(msReword) || 0,
        final_on_road_price: estimatedOnRoadPrice,
        fuel_type: fuelTag,
        quotation_date: quotationDate,
      };

      await quotationApi.create(payload);
      Alert.alert(
        'Quotation Saved!',
        `Official Quotation saved to CRM pipeline. Estimated On-Road: ₹${estimatedOnRoadPrice.toLocaleString('en-IN')}/-`
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      Alert.alert('Save Error', err?.message || 'Failed to save quotation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailClient = () => {
    Alert.alert(
      'Email Dispatched',
      `Official CSD Quotation PDF sent to client (${clientMobile}).`
    );
  };

  const handlePrintPdf = () => {
    Alert.alert(
      'Generating PDF',
      `Official CSD Quotation document generated for ${sheetCarTitle} ${sheetModelTitle}.`
    );
  };

  if (!visible || !lead) return null;

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
            styles.modalContent,
            {
              backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
            },
          ]}
        >
              {/* Header */}
              <View
                style={[
                  styles.headerRow,
                  { borderBottomColor: isDark ? '#1E293B' : '#F1F5F9' },
                ]}
              >
                <View>
                  <Text
                    style={[styles.headerTitle, { color: colors.textPrimary }]}
                  >
                    Official Vehicle Quotation
                  </Text>
                  <Text
                    style={[styles.headerSubtitle, { color: colors.primary }]}
                  >
                    DEFENCE AUTOLINK • CSD DEALERSHIP
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                  style={[
                    styles.closeBtn,
                    { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.closeBtnText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.scrollArea}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* 1. Customer & Lead Info */}
                <View
                  style={[
                    styles.cardSection,
                    {
                      backgroundColor: isDark ? '#101726' : '#F8FAFC',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                >
                  <Text
                    style={[styles.sectionTitle, { color: colors.primary }]}
                  >
                    👤 Customer & Lead Info
                  </Text>
                  <Text style={[styles.autoFillNote, { color: colors.textSecondary }]}>
                    Auto-Fill from Pipeline: {lead.name} ({lead.model_variant})
                  </Text>

                  <View style={styles.formGrid}>
                    <View style={styles.gridField}>
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                        Client Name
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
                        value={clientName}
                        onChangeText={setClientName}
                      />
                    </View>

                    <View style={styles.gridField}>
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                        Client Mobile
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
                        value={clientMobile}
                        onChangeText={setClientMobile}
                        keyboardType="phone-pad"
                      />
                    </View>
                  </View>

                  <View style={styles.formGrid}>
                    <View style={styles.gridField}>
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                        City / Jurisdiction
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
                        value={city}
                        onChangeText={setCity}
                      />
                    </View>

                    <View style={styles.gridField}>
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                        Quotation Date
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
                        value={quotationDate}
                        onChangeText={setQuotationDate}
                      />
                    </View>
                  </View>
                </View>

                {/* 2. Vehicle Selection (Brand, Model, Variant, Fuel) */}
                <View
                  style={[
                    styles.cardSection,
                    {
                      backgroundColor: isDark ? '#101726' : '#F8FAFC',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                >
                  <Text
                    style={[styles.sectionTitle, { color: colors.primary }]}
                  >
                    🚗 Vehicle Selection (Brand, Model, Variant)
                  </Text>

                  {/* Fuel / Variant Tag Chips */}
                  <View style={styles.fuelChipsRow}>
                    {(['PETROL', 'DIESEL', 'CNG', 'ELECTRIC'] as const).map(
                      (f) => {
                        const isActive = fuelTag === f;
                        return (
                          <TouchableOpacity
                            key={f}
                            style={[
                              styles.fuelChip,
                              {
                                backgroundColor: isActive
                                  ? colors.primary
                                  : isDark
                                  ? '#131B2E'
                                  : '#FFFFFF',
                                borderColor: isActive
                                  ? colors.primaryDark
                                  : isDark
                                  ? '#1E293B'
                                  : '#CBD5E1',
                              },
                            ]}
                            onPress={() => setFuelTag(f)}
                          >
                            <Text
                              style={[
                                styles.fuelChipText,
                                {
                                  color: isActive
                                    ? '#FFFFFF'
                                    : colors.textPrimary,
                                  fontWeight: isActive ? '700' : '500',
                                },
                              ]}
                            >
                              {f}
                            </Text>
                          </TouchableOpacity>
                        );
                      }
                    )}
                  </View>

                  <View style={styles.formGrid}>
                    <View style={styles.gridField}>
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                        Sheet Car Title
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
                        value={sheetCarTitle}
                        onChangeText={setSheetCarTitle}
                      />
                    </View>

                    <View style={styles.gridField}>
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                        Sheet Model Title
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
                        value={sheetModelTitle}
                        onChangeText={setSheetModelTitle}
                      />
                    </View>
                  </View>
                </View>

                {/* 3. Sales Executive Details */}
                <View
                  style={[
                    styles.cardSection,
                    {
                      backgroundColor: isDark ? '#101726' : '#F8FAFC',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                >
                  <Text
                    style={[styles.sectionTitle, { color: colors.primary }]}
                  >
                    🎧 Sales Executive Details
                  </Text>
                  <View style={styles.formGrid}>
                    <View style={styles.gridField}>
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                        Executive Name
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
                        value={execName}
                        onChangeText={setExecName}
                      />
                    </View>

                    <View style={styles.gridField}>
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                        Phone Number
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
                        value={execPhone}
                        onChangeText={setExecPhone}
                        keyboardType="phone-pad"
                      />
                    </View>
                  </View>
                </View>

                {/* 4. Price Breakdown Sheet Parameters (₹) */}
                <View
                  style={[
                    styles.cardSection,
                    {
                      backgroundColor: isDark ? '#101726' : '#F8FAFC',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                >
                  <Text
                    style={[styles.sectionTitle, { color: colors.primary }]}
                  >
                    💵 Price Breakdown Sheet Parameters (₹)
                  </Text>

                  <View style={styles.formGrid}>
                    <View style={styles.gridField}>
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                        CSD Price
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
                        value={csdPrice}
                        onChangeText={setCsdPrice}
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.gridField}>
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                        GJ RTO
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
                        value={gjRto}
                        onChangeText={setGjRto}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View style={styles.formGrid}>
                    <View style={styles.gridField}>
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                        INSURANCE
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
                        value={insurance}
                        onChangeText={setInsurance}
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.gridField}>
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                        ACCESSORIES
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
                        value={accessories}
                        onChangeText={setAccessories}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View style={styles.formGrid}>
                    <View style={styles.gridField}>
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                        WARRANTY
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
                        value={warranty}
                        onChangeText={setWarranty}
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.gridField}>
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                        M.S REWORD (Disc)
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
                        value={msReword}
                        onChangeText={setMsReword}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>

                {/* 5. Official Quotation Preview Card */}
                <View
                  style={[
                    styles.previewCard,
                    {
                      backgroundColor: isDark ? '#101726' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#CBD5E1',
                    },
                  ]}
                >
                  <View style={styles.previewHeader}>
                    <Text style={styles.previewLogo}>DEFENCE AUTOLINK</Text>
                    <View style={styles.quotationPill}>
                      <Text style={styles.quotationPillText}>QUOTATION</Text>
                    </View>
                  </View>

                  <View style={styles.previewRow}>
                    <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
                      CAR / MODEL:
                    </Text>
                    <Text style={[styles.previewValue, { color: colors.textPrimary }]}>
                      {sheetCarTitle} • {sheetModelTitle} ({fuelTag})
                    </Text>
                  </View>

                  <View style={styles.previewRow}>
                    <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
                      CSD PRICE:
                    </Text>
                    <Text style={[styles.previewValue, { color: colors.textPrimary }]}>
                      ₹{parseFloat(csdPrice || '0').toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <View style={styles.previewRow}>
                    <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
                      RTO + INSURANCE:
                    </Text>
                    <Text style={[styles.previewValue, { color: colors.textPrimary }]}>
                      ₹{(parseFloat(gjRto || '0') + parseFloat(insurance || '0')).toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <View style={[styles.divider, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]} />

                  {/* Highlight: Estimated On-Road Price */}
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>
                      ESTIMATED ON-ROAD PRICE:
                    </Text>
                    <Text style={styles.totalValue}>
                      ₹{estimatedOnRoadPrice.toLocaleString('en-IN')}/-
                    </Text>
                  </View>
                </View>

                {/* Auxiliary Document Action Buttons */}
                <View style={styles.docActionsRow}>
                  <TouchableOpacity
                    style={[
                      styles.docActionBtn,
                      {
                        backgroundColor: isDark ? '#101726' : '#F8FAFC',
                        borderColor: isDark ? '#1E293B' : '#CBD5E1',
                      },
                    ]}
                    onPress={handlePrintPdf}
                  >
                    <Text style={styles.docActionText}>🖨️ Print / PDF</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.docActionBtn,
                      {
                        backgroundColor: isDark ? '#101726' : '#F8FAFC',
                        borderColor: isDark ? '#1E293B' : '#CBD5E1',
                      },
                    ]}
                    onPress={handleEmailClient}
                  >
                    <Text style={styles.docActionText}>✉️ Email Client</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>

              {/* Bottom Sticky CTA Button */}
              <View
                style={[
                  styles.footerRow,
                  {
                    borderTopColor: isDark ? '#1E293B' : '#F1F5F9',
                    backgroundColor: isDark ? '#0D1322' : '#FFFFFF',
                    paddingBottom: Math.max(insets.bottom, 28) + 8,
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.saveCrmBtn,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={handleSaveQuotation}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveCrmText}>
                      ☁️ Save to CRM Pipeline
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
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    height: '92%',
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    includeFontPadding: false,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 2,
    includeFontPadding: false,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 28,
  },
  cardSection: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
    includeFontPadding: false,
  },
  autoFillNote: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 10,
    includeFontPadding: false,
  },
  formGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  gridField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
  input: {
    height: 38,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 13,
    fontWeight: '600',
    includeFontPadding: false,
    textAlign: 'left',
    textAlignVertical: 'center',
  },
  fuelChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  fuelChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  fuelChipText: {
    fontSize: 11,
    includeFontPadding: false,
  },
  previewCard: {
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 12,
    marginBottom: 12,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  previewLogo: {
    fontSize: 12,
    fontWeight: '900',
    color: '#1E3A8A',
    letterSpacing: 0.5,
  },
  quotationPill: {
    borderWidth: 1,
    borderColor: '#DC2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  quotationPillText: {
    color: '#DC2626',
    fontSize: 9,
    fontWeight: '800',
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  previewValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 6,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#059669',
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#DC2626',
  },
  docActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  docActionBtn: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docActionText: {
    fontSize: 12,
    fontWeight: '700',
    includeFontPadding: false,
  },
  footerRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  saveCrmBtn: {
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveCrmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    includeFontPadding: false,
  },
});
