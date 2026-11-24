import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
  ArrowLeftRight,
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
import { DatePickerModal } from '../leads/components/DatePickerModal';
import { quotationService } from './quotationService';
import { appStorage } from '../../core/storage/storage';
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
  msReword: '',
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
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Vehicle Selection State
  const [selectedBrand, setSelectedBrand] = useState<{ id: number; name: string } | null>(null);
  const [selectedModel, setSelectedModel] = useState<{ id: number; name: string } | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<{ id: number; name: string; price?: number } | null>(null);
  const [sheetCarTitle, setSheetCarTitle] = useState('');
  const [sheetModelTitle, setSheetModelTitle] = useState('');
  const [fuelType, setFuelType] = useState('PETROL');

  // Executive State (dynamically populated from logged-in session)
  const [executiveName, setExecutiveName] = useState('');
  const [executivePhone, setExecutivePhone] = useState('');

  // Price Breakdown State
  const [breakdown, setBreakdown] = useState<QuotationPriceBreakdown>(DEFAULT_BREAKDOWN);

  // Dropdown Lists Data
  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [brandsList, setBrandsList] = useState<any[]>([]);
  const [modelsList, setModelsList] = useState<any[]>([]);
  const [variantsList, setVariantsList] = useState<any[]>([]);

  // Task 2: Comparable & Alternative Models Catalog
  const [allVariantsCatalog, setAllVariantsCatalog] = useState<any[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  // Picker Modal State (matching CreateLeadScreen pattern)
  const [pickerType, setPickerType] = useState<'lead' | 'brand' | 'model' | 'variant' | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');

  // Status & Previews
  const [saving, setSaving] = useState(false);
  const [savedQuotationId, setSavedQuotationId] = useState<number | undefined>();
  const [savedQuotationNo, setSavedQuotationNo] = useState<string | undefined>();
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Load initial dropdown masters and current user profile
  useEffect(() => {
    const loadLoggedInUser = async () => {
      try {
        const user = await appStorage.getUserProfile();
        if (user) {
          if (user.name) setExecutiveName(user.name);
          if (user.phone) {
            const digits = user.phone.replace(/\D/g, '');
            setExecutivePhone(digits.length > 10 ? digits.slice(-10) : digits);
          }
        }
      } catch (e) {
        console.log('Error loading user profile in quotation builder:', e);
      }
    };
    loadLoggedInUser();
    loadBrands();
    loadLeads();
    loadVariantsCatalog();
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

  const loadVariantsCatalog = async () => {
    try {
      setCatalogLoading(true);
      const res = await variantApi.getAll({ per_page: 250 });
      const items = res?.data?.data || res?.data || [];
      if (Array.isArray(items) && items.length > 0) {
        setAllVariantsCatalog(items);
      }
    } catch (err) {
      console.log('Error loading variants catalog:', err);
    } finally {
      setCatalogLoading(false);
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

  // Sync model-specific variants into overall catalog
  useEffect(() => {
    if (variantsList.length > 0) {
      setAllVariantsCatalog((prev) => {
        const map = new Map<number, any>();
        prev.forEach((item) => map.set(item.id, item));
        variantsList.forEach((item) => {
          map.set(item.id, {
            ...item,
            brand_name: selectedBrand?.name || item.brand_name,
            brand_id: selectedBrand?.id || item.brand_id,
            model_name: selectedModel?.name || item.model_name,
            model_id: selectedModel?.id || item.model_id,
          });
        });
        return Array.from(map.values());
      });
    }
  }, [variantsList, selectedBrand, selectedModel]);

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
    const rawPhone = (lead.phone || '').replace(/\D/g, '');
    setClientMobile(rawPhone.length > 10 ? rawPhone.slice(-10) : rawPhone);
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

  // Live Grand Total Calculation (Task 2: Warranty NOT counted, M.S Reward subtracted directly from Total)
  const grandTotal = useMemo(() => {
    const csd = parseNum(breakdown.csdPrice);
    const gjRto = parseNum(breakdown.gjRto);
    const bhRto = parseNum(breakdown.bhRto);
    const crtm = parseNum(breakdown.crtm);
    const insurance = parseNum(breakdown.insurance);
    const accessories = parseNum(breakdown.accessories);
    // Task 2: WARRANTY is tenure (e.g. 1 Year, 2 Years) - NOT counted into total!
    const diff = parseNum(breakdown.diffAmtCash);
    const rawDisc = breakdown.msReward || (breakdown as any).msReword || '';
    const discount = Math.abs(parseNum(rawDisc));

    const total = csd + gjRto + bhRto + crtm + insurance + accessories + diff - discount;
    return Math.max(0, total);
  }, [
    breakdown.csdPrice,
    breakdown.gjRto,
    breakdown.bhRto,
    breakdown.crtm,
    breakdown.insurance,
    breakdown.accessories,
    breakdown.diffAmtCash,
    breakdown.msReward,
    (breakdown as any).msReword,
    breakdown,
  ]);

  const formatInr = (val: number | string) => {
    const num = typeof val === 'number' ? val : parseNum(val);
    return '₹' + num.toLocaleString('en-IN');
  };

  // Task 2: Comparable & Alternative Models Logic (± ₹1,00,000 Range)
  const getVariantPrice = useCallback((v: any): number => {
    if (!v) return 0;
    const raw = v.price || v.csd_base_price || v.csd_price || v.ex_showroom_price || 0;
    return typeof raw === 'number' ? raw : parseNum(raw);
  }, []);

  const currentVariantPrice = useMemo(() => {
    const fromBreakdown = parseNum(breakdown.csdPrice);
    if (fromBreakdown > 0) return fromBreakdown;
    if (selectedVariant?.price) return Number(selectedVariant.price);
    return 0;
  }, [breakdown.csdPrice, selectedVariant]);

  const minPrice = useMemo(
    () => Math.max(0, currentVariantPrice - 100000),
    [currentVariantPrice]
  );
  const maxPrice = useMemo(
    () => currentVariantPrice + 100000,
    [currentVariantPrice]
  );

  const comparableVariants = useMemo(() => {
    if (currentVariantPrice <= 0) return [];

    const matches: any[] = [];
    const seenIds = new Set<number>();

    // 1. Current Match First
    if (selectedVariant) {
      matches.push({
        id: selectedVariant.id,
        name: selectedVariant.name,
        price: currentVariantPrice,
        brand_name: selectedBrand?.name || sheetCarTitle || 'VEHICLE',
        model_name: selectedModel?.name || 'Standard',
        isCurrent: true,
      });
      if (selectedVariant.id) seenIds.add(selectedVariant.id);
    }

    // 2. Matching Alternatives in [minPrice, maxPrice]
    allVariantsCatalog.forEach((item) => {
      if (seenIds.has(item.id)) return;
      const p = getVariantPrice(item);
      if (p >= minPrice && p <= maxPrice) {
        seenIds.add(item.id);
        matches.push({
          ...item,
          price: p,
          brand_name:
            item.brand_name ||
            item.brand?.name ||
            item.model?.brand?.name ||
            selectedBrand?.name ||
            'VEHICLE',
          model_name:
            item.model_name ||
            item.model?.name ||
            selectedModel?.name ||
            'Standard',
          isCurrent: false,
        });
      }
    });

    return matches;
  }, [
    currentVariantPrice,
    minPrice,
    maxPrice,
    selectedVariant,
    selectedBrand,
    selectedModel,
    sheetCarTitle,
    allVariantsCatalog,
    getVariantPrice,
  ]);

  const handleSelectAlternativeVariant = (altVariant: any) => {
    triggerHaptic();
    const altPrice = getVariantPrice(altVariant);

    setSelectedVariant({
      id: altVariant.id,
      name: altVariant.name,
      price: altPrice,
    });
    setSheetModelTitle(altVariant.name);

    if (altPrice > 0) {
      setBreakdown((prev) => ({ ...prev, csdPrice: String(altPrice) }));
    }

    const mId = altVariant.model_id || altVariant.model?.id;
    const mName = altVariant.model_name || altVariant.model?.name;
    if (mId && mName) {
      setSelectedModel({ id: mId, name: mName });
    }

    const bId = altVariant.brand_id || altVariant.brand?.id || altVariant.model?.brand_id;
    const bName =
      altVariant.brand_name || altVariant.brand?.name || altVariant.model?.brand?.name;
    if (bId && bName) {
      setSelectedBrand({ id: bId, name: bName });
      setSheetCarTitle(bName);
    }

    showSuccessToast(
      'Variant Switched',
      `${altVariant.name} (${formatInr(altPrice)}) selected for quotation.`
    );
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
      const modelName = sheetModelTitle.trim() || selectedVariant?.name || selectedModel?.name || 'Standard';
      const subject = `Official Vehicle Quotation – ${carName} (${modelName})`;

      // Format date to ISO YYYY-MM-DD required by Laravel backend API
      let formattedDate = new Date().toISOString().split('T')[0];
      if (quotationDate && quotationDate.includes('.')) {
        const parts = quotationDate.split('.');
        if (parts.length === 3) {
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
          formattedDate = `${year}-${month}-${day}`;
        }
      } else if (quotationDate && quotationDate.includes('-')) {
        const parts = quotationDate.split('-');
        if (parts.length === 3 && parts[0].length === 2) {
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
          formattedDate = `${year}-${month}-${day}`;
        } else if (parts.length === 3 && parts[0].length === 4) {
          formattedDate = quotationDate;
        }
      }

      // Construct itemized line items as expected by backend (matching csd-front)
      const items: any[] = [];
      const discountAmt = Math.abs(parseNum(breakdown.msReward || (breakdown as any).msReword)) || 0;
      const csdBase = parseNum(breakdown.csdPrice);

      // Primary Vehicle Line Item (unconditional, so items is never empty)
      items.push({
        item_name: `${carName} – ${modelName}`,
        description: `Fuel: ${fuelType}`,
        quantity: 1,
        unit_price: csdBase,
        price: csdBase,
        discount: discountAmt,
        tax: 0,
        total: Math.max(0, csdBase - discountAmt),
      });

      if (parseNum(breakdown.gjRto) > 0) {
        items.push({
          item_name: 'Gujarat State RTO & Registration',
          description: 'Official vehicle registration and road tax',
          quantity: 1,
          unit_price: parseNum(breakdown.gjRto),
          price: parseNum(breakdown.gjRto),
          discount: 0,
          tax: 0,
          total: parseNum(breakdown.gjRto),
        });
      }

      if (parseNum(breakdown.bhRto) > 0) {
        items.push({
          item_name: 'BH Series RTO * Approx',
          description: 'BH registration estimate',
          quantity: 1,
          unit_price: parseNum(breakdown.bhRto),
          price: parseNum(breakdown.bhRto),
          discount: 0,
          tax: 0,
          total: parseNum(breakdown.bhRto),
        });
      }

      if (parseNum(breakdown.crtm) > 0) {
        items.push({
          item_name: 'CRTM Charges',
          description: 'Temporary permit / CRTM',
          quantity: 1,
          unit_price: parseNum(breakdown.crtm),
          price: parseNum(breakdown.crtm),
          discount: 0,
          tax: 0,
          total: parseNum(breakdown.crtm),
        });
      }

      if (parseNum(breakdown.insurance) > 0) {
        items.push({
          item_name: 'Comprehensive Zero-Dep Insurance (1+3 Yrs)',
          description: 'Full accidental cover',
          quantity: 1,
          unit_price: parseNum(breakdown.insurance),
          price: parseNum(breakdown.insurance),
          discount: 0,
          tax: 0,
          total: parseNum(breakdown.insurance),
        });
      }

      if (parseNum(breakdown.accessories) > 0) {
        items.push({
          item_name: 'Genuine Dealership Accessories Pack',
          description: 'Accessories',
          quantity: 1,
          unit_price: parseNum(breakdown.accessories),
          price: parseNum(breakdown.accessories),
          discount: 0,
          tax: 0,
          total: parseNum(breakdown.accessories),
        });
      }

      if (parseNum(breakdown.diffAmtCash) > 0) {
        items.push({
          item_name: 'Difference / Cash Adjustment',
          description: 'Cash difference',
          quantity: 1,
          unit_price: parseNum(breakdown.diffAmtCash),
          price: parseNum(breakdown.diffAmtCash),
          discount: 0,
          tax: 0,
          total: parseNum(breakdown.diffAmtCash),
        });
      }

      if (breakdown.warranty && breakdown.warranty.trim() !== '') {
        items.push({
          item_name: 'WARRANTY',
          description: 'Warranty tenure',
          quantity: 1,
          unit_price: parseNum(breakdown.warranty),
          price: parseNum(breakdown.warranty),
          discount: 0,
          tax: 0,
          total: parseNum(breakdown.warranty),
        });
      }

      if (parseNum(breakdown.msReward || (breakdown as any).msReword) > 0) {
        items.push({
          item_name: 'M.S REWORD',
          description: 'M.S Reward / Discount',
          quantity: 1,
          unit_price: parseNum(breakdown.msReward || (breakdown as any).msReword),
          price: parseNum(breakdown.msReward || (breakdown as any).msReword),
          discount: 0,
          tax: 0,
          total: parseNum(breakdown.msReward || (breakdown as any).msReword),
        });
      }

      const calculatedSubtotal = items.reduce(
        (acc, it) => acc + (Number(it.unit_price) || 0) * (Number(it.quantity) || 1),
        0
      );
      const calculatedGrandTotal = items.reduce(
        (acc, it) => acc + (Number(it.total) || 0),
        0
      );
      const effectiveTotal = calculatedGrandTotal > 0 ? calculatedGrandTotal : grandTotal;

      const payload: Record<string, any> = {
        lead_id: leadId ? Number(leadId) : null,
        quotation_date: formattedDate,
        customer_name: clientName.trim(),
        customer_phone: clientMobile.trim() || null,
        customer_email: clientEmail.trim() || null,
        customer_address: cityJurisdiction.trim() || 'Ahmedabad',
        subject,
        description: `Official Price breakdown for ${clientName.trim()}${executiveName ? ` prepared by ${executiveName}` : ''}.`,
        payment_terms: 'Booking advance as applicable, balance prior to vehicle delivery and RTO clearance.',
        delivery_terms: 'Vehicle delivery subject to manufacturer allocation and receipt of full payment.',
        notes: '* Prices prevailing at time of delivery will be applicable. Road tax as per RTO norms.',
        status: 'pending', // Task 1: Default status is 'pending'

        // Vehicle details
        brand_id: selectedBrand?.id ? Number(selectedBrand.id) : null,
        model_id: selectedModel?.id ? Number(selectedModel.id) : null,
        variant_id: selectedVariant?.id ? Number(selectedVariant.id) : null,
        brand_name: selectedBrand?.name || carName,
        model_name: selectedModel?.name || modelName,
        variant_name: selectedVariant?.name || modelName,

        // Financial totals & breakdown
        ex_showroom_price: csdBase,
        csd_base_price: csdBase,
        rto_charges: (parseNum(breakdown.gjRto) || 0) + (parseNum(breakdown.bhRto) || 0),
        insurance_charges: parseNum(breakdown.insurance) || 0,
        accessories_charges: parseNum(breakdown.accessories) || 0,
        discount_amount: discountAmt,
        final_on_road_price: effectiveTotal,
        subtotal: calculatedSubtotal > 0 ? calculatedSubtotal : csdBase,
        grand_total: effectiveTotal,
        total_amount: effectiveTotal,
        total: effectiveTotal,

        // Specific breakdown parameters
        gj_rto: parseNum(breakdown.gjRto) || 0,
        bh_rto: parseNum(breakdown.bhRto) || 0,
        crtm: parseNum(breakdown.crtm) || 0,
        diff_amt_cash: parseNum(breakdown.diffAmtCash) || 0,
        extended_warranty: breakdown.warranty.trim() || null,
        warranty_tenure: breakdown.warranty.trim() || null,
        warranty: breakdown.warranty.trim() || null,
        fuel_type: fuelType,

        items,
      };

      const res = await quotationService.create(payload);
      const createdQuote = res?.data;
      if (createdQuote?.id) {
        setSavedQuotationId(createdQuote.id);
        setSavedQuotationNo(createdQuote.quotation_number || `QT-${createdQuote.id}`);
      }

      showSuccessToast(
        'Quotation Saved!',
        `Saved successfully to CRM Pipeline. Grand Total: ${formatInr(effectiveTotal)}`
      );

      // Task: Redirect to Saved Pipeline (archive) view immediately on save
      if (onNavigateToArchive) {
        setTimeout(() => {
          onNavigateToArchive();
        }, 500);
      }
    } catch (err: any) {
      console.log('Error saving quotation:', err, err?.response?.data);
      const backendErrors = err?.response?.data?.errors
        ? Object.entries(err.response.data.errors)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join('\n')
        : null;
      const errorMsg =
        backendErrors ||
        err?.response?.data?.message ||
        err.message ||
        'Could not save quotation.';
      Alert.alert('Save Failed', errorMsg);
      showErrorToast('Save Failed', errorMsg);
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
                onChangeText={(t) => setClientMobile(t.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
                placeholder="98XXXXXXXX"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
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
              <TouchableOpacity
                style={[
                  styles.input,
                  styles.dateInputContainer,
                  {
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                  },
                ]}
                onPress={() => {
                  triggerHaptic('selection');
                  setShowDatePicker(true);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dateInputText,
                    {
                      color: quotationDate
                        ? isDark ? '#FFFFFF' : '#0F172A'
                        : '#94A3B8',
                    },
                  ]}
                >
                  {quotationDate || 'DD.MM.YY'}
                </Text>
                <Calendar size={16} color={isDark ? '#94A3B8' : '#64748B'} strokeWidth={2} />
              </TouchableOpacity>
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
                onChangeText={(t) => setExecutivePhone(t.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
                placeholder="98XXXXXXXX"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
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
                onChangeText={(t) =>
                  setBreakdown((p) => ({ ...p, accessories: t.replace(/\D/g, '') }))
                }
                placeholder="0"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Row: Warranty & M.S Reward (Disc) */}
          <View style={styles.inputGrid}>
            <View style={styles.inputCol}>
              <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                WARRANTY (Tenure, e.g. 1 Year, 2 Years)
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
                value={breakdown.warranty}
                onChangeText={(t) => setBreakdown((p) => ({ ...p, warranty: t }))}
                placeholder="e.g. 1 Year, 2 Years"
                placeholderTextColor="#94A3B8"
              />
              <Text style={{ fontSize: 10, color: '#64748B', marginTop: 3 }}>
                Tenure only • Not counted in total
              </Text>
            </View>

            <View style={styles.inputCol}>
              <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                M.S REWORD (Disc)
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
                value={breakdown.msReward || (breakdown as any).msReword || ''}
                onChangeText={(t) => setBreakdown((p) => ({ ...p, msReward: t, msReword: t }))}
                placeholder="Discount amount"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />
              <Text style={{ fontSize: 10, color: '#059669', marginTop: 3 }}>
                Subtracted from Total
              </Text>
            </View>
          </View>

          {/* Row 5: DIFFERENCE AMT CASH & ESTIMATED TOTAL (Net After M.S Reword Disc) - EXACT MATCH TO WEB */}
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

            <View style={styles.inputCol}>
              <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]} numberOfLines={1}>
                ESTIMATED TOTAL (₹) (Net After M.S Reword Disc)
              </Text>
              <View
                style={[
                  styles.input,
                  styles.estimatedTotalBox,
                  {
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.estimatedTotalValue,
                    { color: isDark ? '#4ADE80' : '#16A34A' },
                  ]}
                >
                  {formatInr(grandTotal)}
                </Text>
                <View style={styles.liveTotalPill}>
                  <Text style={styles.liveTotalPillText}>Live Total</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Direct Section Save Button matching web screenshot */}
          <TouchableOpacity
            style={[styles.webSaveBtn, saving && { opacity: 0.7 }]}
            onPress={handleSaveQuotation}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Save size={16} color="#FFFFFF" strokeWidth={2.4} />
                <Text style={styles.webSaveBtnText}>
                  Save to CRM Pipeline (Total: {formatInr(grandTotal)})
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ========================================================= */}
        {/* TASK 2: COMPARABLE & ALTERNATIVE MODELS (± ₹1,00,000 Range) */}
        {/* Placed below Price Breakdown & Save to CRM Pipeline       */}
        {/* ========================================================= */}
        <View
          style={[
            styles.cardSection,
            styles.compSection,
            {
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderColor: isDark ? '#334155' : '#E2E8F0',
            },
          ]}
        >
          {/* Header Row */}
          <View style={styles.compHeaderRow}>
            <View style={styles.compHeaderLeft}>
              <ArrowLeftRight size={16} color="#0284C7" strokeWidth={2.4} />
              <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                Comparable & Alternative Models
              </Text>
              <View style={styles.rangePill}>
                <Text style={styles.rangePillText}>± ₹1,00,000 Range</Text>
              </View>
            </View>

            {comparableVariants.length > 0 && (
              <View style={styles.countPill}>
                <Text style={styles.countPillText}>
                  {comparableVariants.length} Alternative(s) Found
                </Text>
              </View>
            )}
          </View>

          {/* Subtitle with Selected Price and Range */}
          {currentVariantPrice > 0 ? (
            <Text style={[styles.compSubTitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              Selected Variant Price:{' '}
              <Text style={{ fontWeight: '700', color: isDark ? '#F1F5F9' : '#1E293B' }}>
                {formatInr(currentVariantPrice)}
              </Text>{' '}
              • Matching Range:{' '}
              <Text style={{ fontWeight: '700', color: isDark ? '#F1F5F9' : '#1E293B' }}>
                {formatInr(minPrice)} to {formatInr(maxPrice)}
              </Text>
            </Text>
          ) : (
            <Text style={[styles.compSubTitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              Select a vehicle variant or enter CSD Price to view alternative models within ± ₹1,00,000 range.
            </Text>
          )}

          {/* Cards Carousel */}
          {currentVariantPrice > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.compScrollContent}
            >
              {comparableVariants.map((item) => {
                const isCurrent =
                  item.isCurrent ||
                  (selectedVariant &&
                    item.id === selectedVariant.id &&
                    item.name === selectedVariant.name);
                const itemPrice = item.price || getVariantPrice(item);
                const brand = item.brand_name || 'VEHICLE';
                const model = item.model_name || 'Standard';

                return (
                  <View
                    key={`${item.id}-${item.name}`}
                    style={[
                      styles.compCard,
                      {
                        backgroundColor: isCurrent
                          ? isDark
                            ? '#172554'
                            : '#EFF6FF'
                          : isDark
                            ? '#0F172A'
                            : '#F8FAFC',
                        borderColor: isCurrent
                          ? '#3B82F6'
                          : isDark
                            ? '#334155'
                            : '#E2E8F0',
                      },
                    ]}
                  >
                    {/* Top Badges Row */}
                    <View style={styles.compCardTopRow}>
                      <View style={styles.brandTag}>
                        <Text style={styles.brandTagText}>{brand.toUpperCase()}</Text>
                      </View>
                      {isCurrent ? (
                        <View style={styles.currentMatchBadge}>
                          <Text style={styles.currentMatchText}>Current Match</Text>
                        </View>
                      ) : (
                        <View style={styles.altBadge}>
                          <Text style={styles.altBadgeText}>Alternative</Text>
                        </View>
                      )}
                    </View>

                    {/* Variant & Model Name */}
                    <Text
                      style={[styles.compVariantName, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text style={styles.compModelSub} numberOfLines={1}>
                      Model: {model}
                    </Text>

                    {/* Price Section */}
                    <View style={styles.compPriceBox}>
                      <Text style={styles.compPriceLabel}>CSD PRICE</Text>
                      <Text style={[styles.compPriceValue, { color: isDark ? '#60A5FA' : '#1E3A8A' }]}>
                        {formatInr(itemPrice)}
                      </Text>
                    </View>

                    {/* Action Button: Selected vs Select */}
                    {isCurrent ? (
                      <View style={styles.compSelectedBtn}>
                        <Check size={14} color="#64748B" strokeWidth={2.5} />
                        <Text style={styles.compSelectedBtnText}>✓ Selected</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.compSelectBtn}
                        onPress={() => handleSelectAlternativeVariant(item)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.compSelectBtnText}>Select</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View >
      </ScrollView >

      {/* Sticky Bottom Actions Bar */}
      < View
        style={
          [
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
      </View >

      {/* Universal Searchable Picker Modal */}
      < Modal
        visible={pickerType !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerType(null)}
      >
        <KeyboardAvoidingView
          style={styles.pickerBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
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
        </KeyboardAvoidingView>
      </Modal >

      {/* Official Sheet Print / Preview Modal */}
      < QuotationSheetView
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
      {
        savedQuotationId && (
          <EmailQuotationModal
            visible={showEmailModal}
            quotationId={savedQuotationId}
            initialEmail={clientEmail}
            vehicleName={sheetCarTitle || selectedBrand?.name}
            onClose={() => setShowEmailModal(false)}
          />
        )
      }

      {/* Date Picker Modal for Quotation Date */}
      <DatePickerModal
        visible={showDatePicker}
        title="Select Quotation Date"
        initialDate={(() => {
          if (quotationDate && quotationDate.includes('.')) {
            const parts = quotationDate.split('.');
            if (parts.length === 3) {
              const dd = parts[0];
              const mm = parts[1];
              let yyyy = parts[2];
              if (yyyy.length === 2) yyyy = '20' + yyyy;
              return `${yyyy}-${mm}-${dd}`;
            }
          }
          return undefined;
        })()}
        allowPast={true}
        allowFuture={true}
        onClose={() => setShowDatePicker(false)}
        onSelectDate={(dateStr) => {
          if (dateStr) {
            const parts = dateStr.split('-');
            if (parts.length === 3) {
              const [yyyy, mm, dd] = parts;
              setQuotationDate(`${dd}.${mm}.${yyyy.slice(-2)}`);
            } else {
              setQuotationDate(dateStr);
            }
          }
          setShowDatePicker(false);
        }}
      />
    </View >
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
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  dateInputText: {
    fontSize: 13,
    fontWeight: '500',
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
  estimatedTotalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  estimatedTotalValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  liveTotalPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  liveTotalPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },
  webSaveBtn: {
    backgroundColor: '#58632A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 14,
  },
  webSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
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
  // Task 2: Comparable Models Styles
  compSection: {
    paddingBottom: 16,
  },
  compHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  compHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  rangePill: {
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.25)',
  },
  rangePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
  },
  countPill: {
    backgroundColor: 'rgba(30, 58, 138, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  countPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  compSubTitle: {
    fontSize: 11,
    marginBottom: 12,
    lineHeight: 16,
  },
  compScrollContent: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
  },
  compCard: {
    width: 250,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  compCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  brandTag: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  brandTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  currentMatchBadge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  currentMatchText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  altBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  altBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
  compVariantName: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  compModelSub: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 10,
  },
  compPriceBox: {
    marginBottom: 12,
  },
  compPriceLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  compPriceValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  compSelectedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#E2E8F0',
    paddingVertical: 8,
    borderRadius: 7,
  },
  compSelectedBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  compSelectBtn: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 8,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compSelectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
