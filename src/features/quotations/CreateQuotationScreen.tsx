import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Building2,
  Calendar,
  Car,
  Check,
  ChevronDown,
  Eye,
  FileSpreadsheet,
  IndianRupee,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  User,
  Users,
  X,
  Zap,
} from 'lucide-react-native';
import { useTheme } from '../../core/theme/ThemeContext';
import { triggerHaptic } from '../../core/utils/haptics';
import { showErrorToast, showSuccessToast } from '../../core/utils/toast';
import { brandApi, modelApi, variantApi } from '../masters/masterService';
import { leadApi } from '../leads/leadService';
import { quotationService } from './quotationService';
import { QuotationFormData, QuotationPriceBreakdown } from './types';
import { QuotationSheetView } from './components/QuotationSheetView';
import { EmailQuotationModal } from './components/EmailQuotationModal';

interface CreateQuotationScreenProps {
  onNavigateToArchive?: () => void;
  prefilledLeadId?: number;
}

const DEFAULT_BREAKDOWN: QuotationPriceBreakdown = {
  csdPrice: '',
  gjRto: '',
  bhRto: '',
  crtm: '',
  insurance: '',
  accessories: '',
  warranty: '',
  diffAmtCash: '',
  msReward: '',
};

export const CreateQuotationScreen: React.FC<CreateQuotationScreenProps> = ({
  onNavigateToArchive,
  prefilledLeadId,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Form State
  const [leadId, setLeadId] = useState<number | null>(prefilledLeadId || null);
  const [selectedLeadItem, setSelectedLeadItem] = useState<any | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientMobile, setClientMobile] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [cityJurisdiction, setCityJurisdiction] = useState('');
  const [quotationDate, setQuotationDate] = useState(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yy = String(today.getFullYear()).slice(-2);
    return `${dd}.${mm}.${yy}`;
  });

  // Vehicle Selection State
  const [selectedBrand, setSelectedBrand] = useState<{ id: number; name: string } | null>(null);
  const [selectedModel, setSelectedModel] = useState<{ id: number; name: string } | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<{ id: number; name: string; price?: number } | null>(null);
  const [sheetCarTitle, setSheetCarTitle] = useState('');
  const [sheetModelTitle, setSheetModelTitle] = useState('');
  const [fuelType, setFuelType] = useState('PETROL');

  // Executive State
  const [executiveName, setExecutiveName] = useState('ADMIN USER');
  const [executivePhone, setExecutivePhone] = useState('+91 98000 11112');

  // Price Breakdown State
  const [breakdown, setBreakdown] = useState<QuotationPriceBreakdown>(DEFAULT_BREAKDOWN);

  // Dropdown Lists Data
  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [brandsList, setBrandsList] = useState<any[]>([]);
  const [modelsList, setModelsList] = useState<any[]>([]);
  const [variantsList, setVariantsList] = useState<any[]>([]);

  // Picker Modal State (matching CreateLeadScreen pattern)
  const [pickerType, setPickerType] = useState<'lead' | 'brand' | 'model' | 'variant' | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');

  // Status & Previews
  const [saving, setSaving] = useState(false);
  const [savedQuotationId, setSavedQuotationId] = useState<number | undefined>();
  const [savedQuotationNo, setSavedQuotationNo] = useState<string | undefined>();
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Load initial dropdown masters
  useEffect(() => {
    loadBrands();
    loadLeads();
  }, []);

  // When prefilledLeadId is provided, auto-load that lead
  useEffect(() => {
    if (prefilledLeadId) {
      loadSpecificLead(prefilledLeadId);
    }
  }, [prefilledLeadId]);

  const loadSpecificLead = async (id: number) => {
    try {
      const res = await leadApi.getById(id);
      const lead = res?.data || res;
      if (lead) {
        handleSelectLead(lead);
      }
    } catch (err) {
      console.log('Error prefetching lead:', err);
    }
  };

  const loadBrands = async () => {
    try {
      const res = await brandApi.getAll({ per_page: 100 });
      const items = res?.data?.data || res?.data || [];
      setBrandsList(Array.isArray(items) ? items : []);
    } catch (err) {
      console.log('Error loading brands:', err);
    }
  };

  const loadLeads = async () => {
    try {
      const res = await leadApi.getAll({ per_page: 100 });
      const items = res?.data?.data || res?.data || [];
      setLeadsList(Array.isArray(items) ? items : []);
    } catch (err) {
      console.log('Error loading leads:', err);
    }
  };

  // When brand changes, load its models
  useEffect(() => {
    if (!selectedBrand) {
      setModelsList([]);
      setSelectedModel(null);
      setVariantsList([]);
      setSelectedVariant(null);
      return;
    }
    const fetchModels = async () => {
      try {
        const res = await modelApi.getAll({ brand_id: selectedBrand.id, per_page: 100 });
        const items = res?.data?.data || res?.data || [];
        setModelsList(Array.isArray(items) ? items : []);
      } catch (err) {
        console.log('Error loading models:', err);
      }
    };
    fetchModels();
  }, [selectedBrand]);

  // When model changes, load its variants
  useEffect(() => {
    if (!selectedModel) {
      setVariantsList([]);
      setSelectedVariant(null);
      return;
    }
    const fetchVariants = async () => {
      try {
        const res = await variantApi.getAll({ model_id: selectedModel.id, per_page: 100 });
        const items = res?.data?.data || res?.data || [];
        setVariantsList(Array.isArray(items) ? items : []);
      } catch (err) {
        console.log('Error loading variants:', err);
      }
    };
    fetchVariants();
  }, [selectedModel]);

  // When variant changes, auto-populate CSD price and Sheet titles
  useEffect(() => {
    if (selectedVariant) {
      const basePrice = selectedVariant.price ? String(selectedVariant.price) : '';
      if (basePrice) {
        setBreakdown((prev) => ({ ...prev, csdPrice: basePrice }));
      }
      setSheetModelTitle(selectedVariant.name);
    }
  }, [selectedVariant]);

  // Task 1: Comprehensive Auto-Fill from Lead
  const handleSelectLead = async (lead: any) => {
    triggerHaptic();
    setLeadId(lead.id);
    setSelectedLeadItem(lead);
    setClientName(lead.name || '');
    setClientMobile(lead.phone || '');
    setClientEmail(lead.email || '');
    setCityJurisdiction(lead.city || lead.home_town || lead.posting || lead.state || '');

    // 1. Match Brand
    let matchedBrand: any = null;
    if (lead.brand_id) {
      matchedBrand = brandsList.find((b) => b.id === lead.brand_id);
    } else if (lead.brand_name) {
      matchedBrand = brandsList.find(
        (b) => b.name?.toLowerCase() === lead.brand_name?.toLowerCase()
      );
    }

    if (matchedBrand) {
      setSelectedBrand(matchedBrand);
      setSheetCarTitle(matchedBrand.name);

      // Fetch models for matched brand to auto-match model
      try {
        const mRes = await modelApi.getAll({ brand_id: matchedBrand.id, per_page: 100 });
        const models = mRes?.data?.data || mRes?.data || [];
        setModelsList(models);

        let matchedModel: any = null;
        if (lead.model_id) {
          matchedModel = models.find((m: any) => m.id === lead.model_id);
        } else if (lead.model_name) {
          matchedModel = models.find(
            (m: any) => m.name?.toLowerCase() === lead.model_name?.toLowerCase()
          );
        }

        if (matchedModel) {
          setSelectedModel(matchedModel);
          setSheetModelTitle(matchedModel.name);

          // Fetch variants for matched model to auto-match variant
          const vRes = await variantApi.getAll({ model_id: matchedModel.id, per_page: 100 });
          const variants = vRes?.data?.data || vRes?.data || [];
          setVariantsList(variants);

          let matchedVariant: any = null;
          if (lead.variant_id) {
            matchedVariant = variants.find((v: any) => v.id === lead.variant_id);
          } else if (lead.variant_name) {
            matchedVariant = variants.find(
              (v: any) => v.name?.toLowerCase() === lead.variant_name?.toLowerCase()
            );
          }

          if (matchedVariant) {
            setSelectedVariant(matchedVariant);
            setSheetModelTitle(matchedVariant.name);
            if (matchedVariant.price) {
              setBreakdown((prev) => ({ ...prev, csdPrice: String(matchedVariant.price) }));
            }
          }
        }
      } catch (e) {
        console.log('Error auto-cascading lead vehicle:', e);
      }
    } else if (lead.model_variant) {
      setSheetCarTitle(lead.model_variant);
    }

    setPickerType(null);
    showSuccessToast('Lead Populated', `Customer & vehicle data loaded from ${lead.name}`);
  };

  // Safe number parsing helper
  const parseNum = (val: string | number) => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    const clean = String(val || '').replace(/[^0-9.-]+/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  // Live Grand Total Calculation
  const grandTotal = useMemo(() => {
    const csd = parseNum(breakdown.csdPrice);
    const rto = parseNum(breakdown.gjRto) || parseNum(breakdown.bhRto);
    const crtm = parseNum(breakdown.crtm);
    const insurance = parseNum(breakdown.insurance);
    const accessories = parseNum(breakdown.accessories);
    const warranty = parseNum(breakdown.warranty);
    const diff = parseNum(breakdown.diffAmtCash);
    const discount = parseNum(breakdown.msReward);

    const total = csd + rto + crtm + insurance + accessories + warranty + diff - discount;
    return Math.max(0, total);
  }, [breakdown]);

  const formatInr = (val: number | string) => {
    const num = typeof val === 'number' ? val : parseNum(val);
    return '₹ ' + num.toLocaleString('en-IN');
  };

  const handleResetSheet = () => {
    triggerHaptic();
    setLeadId(null);
    setSelectedLeadItem(null);
    setClientName('');
    setClientMobile('');
    setClientEmail('');
    setCityJurisdiction('');
    setSelectedBrand(null);
    setSelectedModel(null);
    setSelectedVariant(null);
    setSheetCarTitle('');
    setSheetModelTitle('');
    setBreakdown(DEFAULT_BREAKDOWN);
    setSavedQuotationId(undefined);
    setSavedQuotationNo(undefined);
    showSuccessToast('Sheet Reset', 'Quotation sheet parameters cleared.');
  };

  const handleSaveQuotation = async () => {
    if (!clientName.trim()) {
      showErrorToast('Client Name Required', 'Please enter customer name.');
      return;
    }
    if (!sheetCarTitle.trim() && !selectedBrand) {
      showErrorToast('Car Details Required', 'Please select or enter car brand/title.');
      return;
    }

    triggerHaptic();
    setSaving(true);

    try {
      const carName = sheetCarTitle.trim() || selectedBrand?.name || 'VEHICLE';
      const modelName = sheetModelTitle.trim() || selectedVariant?.name || selectedModel?.name || '';
      const subject = `Official Vehicle Quotation – ${carName} (${modelName})`;

      // Construct itemized line items as expected by backend
      const items: any[] = [];

      if (breakdown.csdPrice) {
        items.push({
          item_name: `${carName} – ${modelName}`,
          description: `Fuel: ${fuelType}`,
          quantity: 1,
          unit_price: parseNum(breakdown.csdPrice),
          discount: 0,
          tax: 0,
          total: parseNum(breakdown.csdPrice),
        });
      }

      if (breakdown.gjRto) {
        items.push({
          item_name: 'Gujarat State RTO & Registration',
          description: 'Official registration',
          quantity: 1,
          unit_price: parseNum(breakdown.gjRto),
          discount: 0,
          tax: 0,
          total: parseNum(breakdown.gjRto),
        });
      }

      if (breakdown.bhRto) {
        items.push({
          item_name: 'BH Series RTO * Approx',
          description: 'BH registration estimate',
          quantity: 1,
          unit_price: parseNum(breakdown.bhRto),
          discount: 0,
          tax: 0,
          total: parseNum(breakdown.bhRto),
        });
      }

      if (breakdown.crtm) {
        items.push({
          item_name: 'CRTM Charges',
          description: 'Temporary permit / CRTM',
          quantity: 1,
          unit_price: parseNum(breakdown.crtm),
          discount: 0,
          tax: 0,
          total: parseNum(breakdown.crtm),
        });
      }

      if (breakdown.insurance) {
        items.push({
          item_name: 'Comprehensive Zero-Dep Insurance (1+3 Yrs)',
          description: 'Full accidental cover',
          quantity: 1,
          unit_price: parseNum(breakdown.insurance),
          discount: 0,
          tax: 0,
          total: parseNum(breakdown.insurance),
        });
      }

      if (breakdown.accessories) {
        items.push({
          item_name: 'Genuine Dealership Accessories Pack',
          description: 'Accessories',
          quantity: 1,
          unit_price: parseNum(breakdown.accessories),
          discount: 0,
          tax: 0,
          total: parseNum(breakdown.accessories),
        });
      }

      if (breakdown.warranty) {
        items.push({
          item_name: 'Extended Warranty Shield',
          description: 'Manufacturer warranty',
          quantity: 1,
          unit_price: parseNum(breakdown.warranty),
          discount: 0,
          tax: 0,
          total: parseNum(breakdown.warranty),
        });
      }

      if (breakdown.diffAmtCash) {
        items.push({
          item_name: 'Difference / Cash Adjustment',
          description: 'Cash difference',
          quantity: 1,
          unit_price: parseNum(breakdown.diffAmtCash),
          discount: 0,
          tax: 0,
          total: parseNum(breakdown.diffAmtCash),
        });
      }

      if (breakdown.msReward) {
        items.push({
          item_name: 'M.S Reward / Special Deal Discount',
          description: 'Subtracted discount',
          quantity: 1,
          unit_price: -parseNum(breakdown.msReward),
          discount: parseNum(breakdown.msReward),
          tax: 0,
          total: -parseNum(breakdown.msReward),
        });
      }

      const payload = {
        lead_id: leadId,
        quotation_date: quotationDate,
        customer_name: clientName.trim(),
        customer_phone: clientMobile.trim(),
        customer_email: clientEmail.trim(),
        customer_address: cityJurisdiction.trim(),
        subject,
        description: 'Official Defence Autolink CSD Price Breakdown.',
        payment_terms: 'Booking advance as applicable.',
        delivery_terms: 'Subject to stock allocation.',
        notes: '* Prices prevailing at time of delivery will be applicable. Road tax as per RTO norms.',
        status: 'sent',
        subtotal: parseNum(breakdown.csdPrice),
        grand_total: grandTotal,
        total_amount: grandTotal,
        total: grandTotal,
        items,
        brand_name: selectedBrand?.name,
        model_name: selectedModel?.name,
        variant_name: selectedVariant?.name,
      };

      const res = await quotationService.create(payload);
      const createdQuote = res?.data;
      if (createdQuote?.id) {
        setSavedQuotationId(createdQuote.id);
        setSavedQuotationNo(createdQuote.quotation_number || `QT-${createdQuote.id}`);
      }

      showSuccessToast(
        'Quotation Saved!',
        `Saved successfully to CRM Pipeline. Grand Total: ${formatInr(grandTotal)}`
      );
    } catch (err: any) {
      console.log('Error saving quotation:', err);
      showErrorToast(
        'Save Failed',
        err?.response?.data?.message || err.message || 'Could not save quotation.'
      );
    } finally {
      setSaving(false);
    }
  };

  const currentFormData: QuotationFormData = {
    leadId,
    clientName,
    clientMobile,
    clientEmail,
    cityJurisdiction,
    quotationDate,
    brandId: selectedBrand?.id || null,
    brandName: selectedBrand?.name || '',
    modelId: selectedModel?.id || null,
    modelName: selectedModel?.name || '',
    variantId: selectedVariant?.id || null,
    variantName: selectedVariant?.name || '',
    sheetCarTitle: sheetCarTitle || selectedBrand?.name || '',
    sheetModelTitle: sheetModelTitle || selectedVariant?.name || selectedModel?.name || '',
    fuelType,
    executiveName,
    executivePhone,
    breakdown,
    grandTotal,
  };

  // Search filter for picker list
  const filteredPickerItems = useMemo(() => {
    const q = pickerSearch.toLowerCase().trim();
    if (pickerType === 'lead') {
      return leadsList.filter(
        (l) =>
          l.name?.toLowerCase().includes(q) ||
          l.phone?.toLowerCase().includes(q) ||
          l.city?.toLowerCase().includes(q) ||
          l.model_variant?.toLowerCase().includes(q)
      );
    }
    if (pickerType === 'brand') {
      return brandsList.filter((b) => b.name?.toLowerCase().includes(q));
    }
    if (pickerType === 'model') {
      return modelsList.filter((m) => m.name?.toLowerCase().includes(q));
    }
    if (pickerType === 'variant') {
      return variantsList.filter((v) => v.name?.toLowerCase().includes(q));
    }
    return [];
  }, [pickerType, pickerSearch, leadsList, brandsList, modelsList, variantsList]);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
      {/* Top Action Toolbar */}
      <View
        style={[
          styles.topToolbar,
          {
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            borderBottomColor: isDark ? '#334155' : '#E2E8F0',
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.toolBtn, styles.resetBtn]}
          onPress={handleResetSheet}
          activeOpacity={0.7}
        >
          <RotateCcw size={14} color="#64748B" />
          <Text style={styles.resetBtnText}>Reset</Text>
        </TouchableOpacity>

        <View style={styles.rightTools}>
          <TouchableOpacity
            style={[styles.toolBtn, styles.previewBtn]}
            onPress={() => {
              triggerHaptic();
              setShowPreviewModal(true);
            }}
            activeOpacity={0.7}
          >
            <Eye size={14} color="#1E3A8A" />
            <Text style={styles.previewBtnText}>Print / Preview</Text>
          </TouchableOpacity>

          {onNavigateToArchive && (
            <TouchableOpacity
              style={[styles.toolBtn, styles.archiveBtn]}
              onPress={() => {
                triggerHaptic();
                onNavigateToArchive();
              }}
              activeOpacity={0.7}
            >
              <FileSpreadsheet size={14} color="#059669" />
              <Text style={styles.archiveBtnText}>Saved Pipeline</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Builder Scroll Form */}
      <ScrollView
        contentContainerStyle={[styles.formScroll, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ========================================================= */}
        {/* SECTION 1: Customer & Lead Info (With Prominent Auto-Fill) */}
        {/* ========================================================= */}
        <View
          style={[
            styles.cardSection,
            {
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderColor: isDark ? '#334155' : '#E2E8F0',
            },
          ]}
        >
          <View style={styles.sectionTitleBox}>
            <User size={16} color="#1E3A8A" strokeWidth={2.4} />
            <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
              Customer & Lead Info
            </Text>
          </View>

          {/* Task 1: Auto-Fill From Leads Pipeline Selector */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
              Auto-Fill From Leads Pipeline
            </Text>
            <TouchableOpacity
              style={[
                styles.leadSelectorBox,
                {
                  backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                  borderColor: selectedLeadItem ? '#1E3A8A' : isDark ? '#334155' : '#CBD5E1',
                },
              ]}
              onPress={() => {
                setPickerSearch('');
                setPickerType('lead');
              }}
              activeOpacity={0.7}
            >
              <View style={styles.leadSelectorLeft}>
                <Sparkles size={16} color={selectedLeadItem ? '#1E3A8A' : '#94A3B8'} />
                <Text
                  style={[
                    styles.leadSelectorText,
                    { color: selectedLeadItem ? (isDark ? '#FFF' : '#0F172A') : '#94A3B8' },
                  ]}
                  numberOfLines={1}
                >
                  {selectedLeadItem
                    ? `${selectedLeadItem.name} (${selectedLeadItem.phone || 'Lead #${selectedLeadItem.id}'})`
                    : 'Choose Lead from Pipeline...'}
                </Text>
              </View>
              <ChevronDown size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Customer Inputs */}
          <View style={styles.inputGrid}>
            <View style={styles.inputCol}>
              <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                Client Name <Text style={styles.req}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                  },
                ]}
                value={clientName}
                onChangeText={setClientName}
                placeholder="Enter client name"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputCol}>
              <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                Client Mobile
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                  },
                ]}
                value={clientMobile}
                onChangeText={setClientMobile}
                placeholder="98XXXXXXXX"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGrid}>
            <View style={styles.inputCol}>
              <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                City / Jurisdiction
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                  },
                ]}
                value={cityJurisdiction}
                onChangeText={setCityJurisdiction}
                placeholder="e.g. Ahmedabad"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputCol}>
              <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                Quotation Date
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                  },
                ]}
                value={quotationDate}
                onChangeText={setQuotationDate}
                placeholder="DD.MM.YY"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>
        </View>

        {/* ========================================================= */}
        {/* SECTION 2: Vehicle Selection (Matching CreateLeadScreen) */}
        {/* ========================================================= */}
        <View
          style={[
            styles.cardSection,
            {
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderColor: isDark ? '#334155' : '#E2E8F0',
            },
          ]}
        >
          <View style={styles.sectionTitleBox}>
            <Car size={16} color="#D97706" strokeWidth={2.4} />
            <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
              Vehicle Selection (Brand, Model, Variant)
            </Text>
          </View>

          {/* 1. Brand Dropdown Selector (Matching CreateLeadScreen) */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
              Select Brand
            </Text>
            <TouchableOpacity
              style={[
                styles.dropdownSelector,
                {
                  backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                },
              ]}
              onPress={() => {
                triggerHaptic();
                setPickerSearch('');
                setPickerType('brand');
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dropdownText,
                  { color: selectedBrand ? (isDark ? '#FFF' : '#0F172A') : '#94A3B8' },
                  selectedBrand && { fontWeight: '700' },
                ]}
              >
                {selectedBrand ? selectedBrand.name : 'Choose Brand...'}
              </Text>
              <ChevronDown size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* 2. Model Dropdown Selector (Cascading) */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
              Select Model
            </Text>
            <TouchableOpacity
              style={[
                styles.dropdownSelector,
                {
                  backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                  opacity: selectedBrand ? 1 : 0.55,
                },
              ]}
              disabled={!selectedBrand}
              onPress={() => {
                triggerHaptic();
                setPickerSearch('');
                setPickerType('model');
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dropdownText,
                  { color: selectedModel ? (isDark ? '#FFF' : '#0F172A') : '#94A3B8' },
                  selectedModel && { fontWeight: '700' },
                ]}
              >
                {selectedModel ? selectedModel.name : selectedBrand ? 'Choose Model...' : 'Select Brand first'}
              </Text>
              <ChevronDown size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* 3. Variant Dropdown Selector (Cascading) */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
              Select Variant
            </Text>
            <TouchableOpacity
              style={[
                styles.dropdownSelector,
                {
                  backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                  opacity: selectedModel ? 1 : 0.55,
                },
              ]}
              disabled={!selectedModel}
              onPress={() => {
                triggerHaptic();
                setPickerSearch('');
                setPickerType('variant');
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dropdownText,
                  { color: selectedVariant ? (isDark ? '#FFF' : '#0F172A') : '#94A3B8' },
                  selectedVariant && { fontWeight: '700' },
                ]}
              >
                {selectedVariant ? selectedVariant.name : selectedModel ? 'Choose Variant...' : 'Select Model first'}
              </Text>
              <ChevronDown size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Sheet Custom Titles */}
          <View style={[styles.inputGrid, { marginTop: 8 }]}>
            <View style={styles.inputCol}>
              <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                Sheet Car Title
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                  },
                ]}
                value={sheetCarTitle}
                onChangeText={setSheetCarTitle}
                placeholder="e.g. HYUNDAI VENUE"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputCol}>
              <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                Sheet Model Title
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                  },
                ]}
                value={sheetModelTitle}
                onChangeText={setSheetModelTitle}
                placeholder="e.g. 1.0 TURBO DCT SX(O)"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>
        </View>

        {/* ========================================================= */}
        {/* SECTION 3: Sales Executive Details */}
        {/* ========================================================= */}
        <View
          style={[
            styles.cardSection,
            {
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderColor: isDark ? '#334155' : '#E2E8F0',
            },
          ]}
        >
          <View style={styles.sectionTitleBox}>
            <Users size={16} color="#059669" strokeWidth={2.4} />
            <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
              Sales Executive Details
            </Text>
          </View>

          <View style={styles.inputGrid}>
            <View style={styles.inputCol}>
              <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                Executive Name
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                  },
                ]}
                value={executiveName}
                onChangeText={setExecutiveName}
                placeholder="ADMIN USER"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputCol}>
              <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                Phone Number
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                  },
                ]}
                value={executivePhone}
                onChangeText={setExecutivePhone}
                placeholder="+91 98000 11112"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>
        </View>

        {/* ========================================================= */}
        {/* SECTION 4: Price Breakdown Sheet Parameters (₹) */}
        {/* ========================================================= */}
        <View
          style={[
            styles.cardSection,
            {
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderColor: isDark ? '#334155' : '#E2E8F0',
            },
          ]}
        >
          <View style={styles.sectionTitleBox}>
            <IndianRupee size={16} color="#B91C1C" strokeWidth={2.4} />
            <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
              Price Breakdown Sheet Parameters (₹)
            </Text>
          </View>

          {/* Row: CSD Price & GJ RTO */}
          <View style={styles.inputGrid}>
            <View style={styles.inputCol}>
              <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                CSD Price
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.numericInput,
                  {
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                  },
                ]}
                value={breakdown.csdPrice}
                onChangeText={(t) => setBreakdown((p) => ({ ...p, csdPrice: t }))}
                placeholder="600000"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputCol}>
              <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                GJ RTO
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.numericInput,
                  {
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                  },
                ]}
                value={breakdown.gjRto}
                onChangeText={(t) => setBreakdown((p) => ({ ...p, gjRto: t }))}
                placeholder="45000"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Row: BH RTO & CRTM */}
          <View style={styles.inputGrid}>
            <View style={styles.inputCol}>
              <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                BH RTO * APPOROX
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.numericInput,
                  {
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                  },
                ]}
                value={breakdown.bhRto}
                onChangeText={(t) => setBreakdown((p) => ({ ...p, bhRto: t }))}
                placeholder="Approx BH tax"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputCol}>
              <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                CRTM
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.numericInput,
                  {
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                  },
                ]}
                value={breakdown.crtm}
                onChangeText={(t) => setBreakdown((p) => ({ ...p, crtm: t }))}
                placeholder="e.g. 1500"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Row: Insurance & Accessories */}
          <View style={styles.inputGrid}>
            <View style={styles.inputCol}>
              <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                INSURANCE (1+3 Yrs)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.numericInput,
                  {
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                  },
                ]}
                value={breakdown.insurance}
                onChangeText={(t) => setBreakdown((p) => ({ ...p, insurance: t }))}
                placeholder="35000"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputCol}>
              <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                ACCESSORIES
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.numericInput,
                  {
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                  },
                ]}
                value={breakdown.accessories}
                onChangeText={(t) => setBreakdown((p) => ({ ...p, accessories: t }))}
                placeholder="25000 or FREE KIT"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Row: Warranty & M.S Reward (Disc) */}
          <View style={styles.inputGrid}>
            <View style={styles.inputCol}>
              <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                WARRANTY (Shield)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.numericInput,
                  {
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                  },
                ]}
                value={breakdown.warranty}
                onChangeText={(t) => setBreakdown((p) => ({ ...p, warranty: t }))}
                placeholder="15000"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputCol}>
              <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                M.S REWARD (Disc)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.numericInput,
                  {
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                  },
                ]}
                value={breakdown.msReward}
                onChangeText={(t) => setBreakdown((p) => ({ ...p, msReward: t }))}
                placeholder="Discount amount"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Row: Difference Amt Cash */}
          <View style={[styles.inputGrid, { marginTop: 4 }]}>
            <View style={styles.inputCol}>
              <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                DIFFERENCE AMT CASH
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.numericInput,
                  {
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                  },
                ]}
                value={breakdown.diffAmtCash}
                onChangeText={(t) => setBreakdown((p) => ({ ...p, diffAmtCash: t }))}
                placeholder="Cash adjustment"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Live Calculation Card Summary */}
        <View
          style={[
            styles.liveTotalCard,
            {
              backgroundColor: isDark ? '#1E293B' : '#FEF2F2',
              borderColor: '#B91C1C',
            },
          ]}
        >
          <View style={styles.liveTotalLeft}>
            <Text style={styles.liveTotalLabel}>ESTIMATED ON-ROAD PRICE</Text>
            <Text style={styles.liveTotalFormula}>
              CSD + RTO + Insurance + Accessories + Warranty + Diff - Reward
            </Text>
          </View>
          <Text style={styles.liveTotalAmount}>{formatInr(grandTotal)}</Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions Bar */}
      <View
        style={[
          styles.stickyFooter,
          {
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            borderTopColor: isDark ? '#334155' : '#E2E8F0',
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <View style={styles.footerTotalBox}>
          <Text style={styles.footerTotalLabel}>Estimated Total</Text>
          <Text style={styles.footerTotalValue}>{formatInr(grandTotal)}</Text>
        </View>

        <View style={styles.footerBtnGroup}>
          <TouchableOpacity
            style={styles.sheetPreviewBtn}
            onPress={() => {
              triggerHaptic();
              setShowPreviewModal(true);
            }}
            activeOpacity={0.8}
          >
            <Eye size={17} color="#1E3A8A" />
            <Text style={styles.sheetPreviewBtnText}>Preview</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={handleSaveQuotation}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Save size={17} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Save to CRM</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Universal Searchable Picker Modal */}
      <Modal
        visible={pickerType !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerType(null)}
      >
        <View style={styles.pickerBackdrop}>
          <View
            style={[
              styles.pickerContainer,
              {
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                paddingBottom: insets.bottom + 16,
              },
            ]}
          >
            <View style={styles.pickerHeader}>
              <Text
                style={[
                  styles.pickerTitle,
                  { color: isDark ? '#FFFFFF' : '#0F172A' },
                ]}
              >
                {pickerType === 'lead'
                  ? 'Choose Lead from Pipeline'
                  : pickerType === 'brand'
                  ? 'Select Brand'
                  : pickerType === 'model'
                  ? 'Select Model'
                  : 'Select Variant'}
              </Text>
              <TouchableOpacity
                onPress={() => setPickerType(null)}
                style={styles.pickerCloseBtn}
              >
                <X size={20} color={isDark ? '#94A3B8' : '#64748B'} />
              </TouchableOpacity>
            </View>

            {/* Search Input in Picker */}
            <View
              style={[
                styles.pickerSearchBox,
                {
                  backgroundColor: isDark ? '#0F172A' : '#F1F5F9',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                },
              ]}
            >
              <Search size={16} color="#94A3B8" />
              <TextInput
                style={[
                  styles.pickerSearchInput,
                  { color: isDark ? '#FFFFFF' : '#0F172A' },
                ]}
                placeholder="Search..."
                placeholderTextColor="#94A3B8"
                value={pickerSearch}
                onChangeText={setPickerSearch}
                autoFocus
              />
            </View>

            {/* List */}
            <FlatList
              data={filteredPickerItems}
              keyExtractor={(item) => String(item.id)}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => {
                const isSelected =
                  pickerType === 'lead'
                    ? item.id === leadId
                    : pickerType === 'brand'
                    ? item.id === selectedBrand?.id
                    : pickerType === 'model'
                    ? item.id === selectedModel?.id
                    : item.id === selectedVariant?.id;

                return (
                  <TouchableOpacity
                    style={[
                      styles.pickerItem,
                      isSelected && styles.pickerItemSelected,
                      { borderBottomColor: isDark ? '#334155' : '#F1F5F9' },
                    ]}
                    onPress={() => {
                      triggerHaptic();
                      if (pickerType === 'lead') {
                        handleSelectLead(item);
                      } else if (pickerType === 'brand') {
                        setSelectedBrand(item);
                        setSheetCarTitle(item.name);
                        setPickerType(null);
                      } else if (pickerType === 'model') {
                        setSelectedModel(item);
                        setSheetModelTitle(item.name);
                        setPickerType(null);
                      } else if (pickerType === 'variant') {
                        setSelectedVariant(item);
                        setSheetModelTitle(item.name);
                        setPickerType(null);
                      }
                    }}
                  >
                    <View style={styles.pickerItemLeft}>
                      <Text
                        style={[
                          styles.pickerItemName,
                          { color: isDark ? '#FFFFFF' : '#0F172A' },
                          isSelected && { color: '#1E3A8A', fontWeight: '800' },
                        ]}
                      >
                        {item.name}
                      </Text>
                      {item.phone && (
                        <Text style={styles.pickerItemSub}>
                          {item.phone} • {item.city || 'City'}
                        </Text>
                      )}
                      {item.model_variant && (
                        <Text style={styles.pickerItemCarSub}>
                          Car: {item.model_variant}
                        </Text>
                      )}
                      {item.price && (
                        <Text style={styles.pickerItemPrice}>
                          CSD Price: {formatInr(item.price)}
                        </Text>
                      )}
                    </View>

                    {isSelected && <Check size={18} color="#1E3A8A" />}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.pickerEmpty}>
                  <Text style={styles.pickerEmptyText}>No matching records found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Official Sheet Print / Preview Modal */}
      <QuotationSheetView
        visible={showPreviewModal}
        data={currentFormData}
        quotationId={savedQuotationId}
        quotationNo={savedQuotationNo}
        onClose={() => setShowPreviewModal(false)}
        onOpenEmail={() => {
          setShowPreviewModal(false);
          setShowEmailModal(true);
        }}
      />

      {/* Email Customer Modal */}
      {savedQuotationId && (
        <EmailQuotationModal
          visible={showEmailModal}
          quotationId={savedQuotationId}
          initialEmail={clientEmail}
          vehicleName={sheetCarTitle || selectedBrand?.name}
          onClose={() => setShowEmailModal(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 7,
  },
  resetBtn: {
    backgroundColor: '#E2E8F0',
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  rightTools: {
    flexDirection: 'row',
    gap: 8,
  },
  previewBtn: {
    backgroundColor: '#E0E7FF',
  },
  previewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  archiveBtn: {
    backgroundColor: '#DCFCE7',
  },
  archiveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  formScroll: {
    padding: 12,
    gap: 12,
  },
  cardSection: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    elevation: 1,
  },
  sectionTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  formGroup: {
    marginBottom: 10,
  },
  leadSelectorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  leadSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  leadSelectorText: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  inputCol: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 5,
  },
  req: {
    color: '#EF4444',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 13,
  },
  numericInput: {
    fontWeight: '600',
  },
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  dropdownText: {
    fontSize: 13,
    fontWeight: '500',
  },
  liveTotalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 14,
    elevation: 2,
  },
  liveTotalLeft: {
    flex: 1,
  },
  liveTotalLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#B91C1C',
    letterSpacing: 0.5,
  },
  liveTotalFormula: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 2,
  },
  liveTotalAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#B91C1C',
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    elevation: 8,
  },
  footerTotalBox: {
    flex: 1,
  },
  footerTotalLabel: {
    fontSize: 10,
    color: '#64748B',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  footerTotalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#B91C1C',
  },
  footerBtnGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  sheetPreviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#E0E7FF',
  },
  sheetPreviewBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1E293B',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '75%',
    padding: 16,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  pickerCloseBtn: {
    padding: 4,
  },
  pickerSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 12,
  },
  pickerSearchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerItemSelected: {
    backgroundColor: 'rgba(30, 58, 138, 0.05)',
  },
  pickerItemLeft: {
    flex: 1,
  },
  pickerItemName: {
    fontSize: 14,
    fontWeight: '600',
  },
  pickerItemSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  pickerItemCarSub: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '600',
    marginTop: 2,
  },
  pickerItemPrice: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700',
    marginTop: 2,
  },
  pickerEmpty: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  pickerEmptyText: {
    fontSize: 13,
    color: '#94A3B8',
  },
});
