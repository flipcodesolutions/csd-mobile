export interface PaginationMeta {
  total: number;
  current_page: number;
  last_page: number;
  per_page: number;
}

export interface Brand {
  id: number;
  name: string;
  vehicle_type: string[]; // e.g. ["4 Wheeler"], ["2 Wheeler"], or ["4 Wheeler", "2 Wheeler"]
  status: 'Active' | 'Inactive';
  logo?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BrandStats {
  total_brands: number;
  four_wheeler_brands: number;
  two_wheeler_brands: number;
  active_brands?: number;
}

export type BrandVehicleTypeFilter = 'All' | '4 Wheeler' | '2 Wheeler';

export interface CreateBrandPayload {
  name: string;
  vehicle_type: string[];
  status: 'Active' | 'Inactive';
  logo?: string | null;
}

export interface UpdateBrandPayload {
  name: string;
  vehicle_type: string[];
  status: 'Active' | 'Inactive';
  logo?: string | null;
}

// ============================================================================
// 2. Vehicle Model Master Types
// ============================================================================
export interface CarModel {
  id: number;
  name: string;
  brand_id: number;
  brand?: {
    id: number;
    name: string;
    logo?: string;
    vehicle_type?: string[];
  };
  brand_name?: string;
  vehicle_segment: '4 Wheeler' | '2 Wheeler';
  status: 'Active' | 'Inactive';
  created_at?: string;
  updated_at?: string;
}

export interface ModelStats {
  total_models: number;
  four_wheeler_models: number;
  two_wheeler_models: number;
  active_models?: number;
}

export type ModelSegmentFilter = 'All' | '4 Wheeler' | '2 Wheeler';

export interface CreateModelPayload {
  name: string;
  brand_id: number;
  vehicle_segment: '4 Wheeler' | '2 Wheeler';
  status: 'Active' | 'Inactive';
}

export interface UpdateModelPayload {
  name: string;
  brand_id?: number;
  vehicle_segment?: '4 Wheeler' | '2 Wheeler';
  status: 'Active' | 'Inactive';
}

// ============================================================================
// 3. Vehicle Variant Master Types
// ============================================================================
export interface VehicleVariant {
  id: number;
  name: string;
  brand_id: number;
  model_id: number;
  brand?: {
    id: number;
    name: string;
    logo?: string;
  };
  model?: {
    id: number;
    name: string;
    vehicle_segment?: '4 Wheeler' | '2 Wheeler';
  };
  price: number | string;
  ex_showroom_price?: number | string;
  previous_price?: number | string | null;
  fuel_type?: 'Petrol' | 'Diesel' | 'CNG' | 'Electric' | 'Hybrid';
  status: 'Active' | 'Inactive';
  created_at?: string;
  updated_at?: string;
}

export interface VariantStats {
  total_variants: number;
  active_trims: number;
  mapped_models: number;
  inactive_trims?: number;
}

export interface CreateVariantPayload {
  name: string;
  brand_id: number;
  model_id: number;
  price: string | number;
  fuel_type?: string;
  status: 'Active' | 'Inactive';
}

export interface UpdateVariantPayload {
  name: string;
  brand_id?: number;
  model_id?: number;
  price: string | number;
  fuel_type?: string;
  status: 'Active' | 'Inactive';
}

// ============================================================================
// 4. Update Price Master Types
// ============================================================================
export interface PriceUpdateItem {
  id: number;
  revised_price: number;
}

export interface BulkPriceUpdatePayload {
  variants: PriceUpdateItem[];
}

// ============================================================================
// 5. Expense Master Types
// ============================================================================
export interface ExpenseCategory {
  id: number;
  title: string;
  name?: string;
  description?: string;
  status: 'Active' | 'Inactive' | number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateExpenseCategoryPayload {
  name: string;
  description?: string;
  status?: number | string;
}

export interface UpdateExpenseCategoryPayload {
  name: string;
  description?: string;
  status?: number | string;
}

// ============================================================================
// 6. Lead Source Master Types
// ============================================================================
export interface LeadSource {
  id: number;
  title: string;
  name?: string;
  status: 'Active' | 'Inactive';
  created_at?: string;
  updated_at?: string;
}

export interface LeadSourceStats {
  total_channels: number;
  active_channels: number;
  top_channel?: string;
}

export interface CreateLeadSourcePayload {
  title: string;
  status: 'Active' | 'Inactive';
}

export interface UpdateLeadSourcePayload {
  title: string;
  status: 'Active' | 'Inactive';
}

/**
 * Standard Indian CSD Automotive Manufacturers with CDN Logos
 * Provided as 1-tap quick presets during brand creation or editing
 */
export const PRESET_OEM_BRANDS: {
  name: string;
  types: string[];
  logo: string;
}[] = [
  {
    name: 'Maruti Suzuki',
    types: ['4 Wheeler'],
    logo: 'https://images.seeklogo.com/logo-png/33/2/maruti-suzuki-logo-png_seeklogo-331899.png',
  },
  {
    name: 'Tata Motors',
    types: ['4 Wheeler'],
    logo: 'https://images.seeklogo.com/logo-png/13/2/tata-motors-logo-png_seeklogo-135503.png',
  },
  {
    name: 'Mahindra & Mahindra',
    types: ['4 Wheeler'],
    logo: 'https://images.seeklogo.com/logo-png/43/1/mahindra-rise-logo-png_seeklogo-431526.png',
  },
  {
    name: 'Hyundai Motor India',
    types: ['4 Wheeler'],
    logo: 'https://images.seeklogo.com/logo-png/7/2/hyundai-logo-png_seeklogo-74673.png',
  },
  {
    name: 'Toyota Kirloskar',
    types: ['4 Wheeler'],
    logo: 'https://images.seeklogo.com/logo-png/24/1/toyota-logo-png_seeklogo-246347.png',
  },
  {
    name: 'Honda Cars & Two Wheelers',
    types: ['4 Wheeler', '2 Wheeler'],
    logo: 'https://images.seeklogo.com/logo-png/7/2/honda-logo-png_seeklogo-73139.png',
  },
  {
    name: 'Kia India',
    types: ['4 Wheeler'],
    logo: 'https://images.seeklogo.com/logo-png/38/2/kia-logo-png_seeklogo-387063.png',
  },
  {
    name: 'Royal Enfield',
    types: ['2 Wheeler'],
    logo: 'https://images.seeklogo.com/logo-png/11/2/royal-enfield-logo-png_seeklogo-117578.png',
  },
  {
    name: 'Bajaj Auto',
    types: ['2 Wheeler'],
    logo: 'https://images.seeklogo.com/logo-png/1/2/bajaj-logo-png_seeklogo-18451.png',
  },
  {
    name: 'TVS Motor Company',
    types: ['2 Wheeler'],
    logo: 'https://images.seeklogo.com/logo-png/13/2/tvs-motor-logo-png_seeklogo-138402.png',
  },
  {
    name: 'Hero MotoCorp',
    types: ['2 Wheeler'],
    logo: 'https://images.seeklogo.com/logo-png/20/1/hero-motocorp-logo-png_seeklogo-201633.png',
  },
  {
    name: 'Yamaha Motor',
    types: ['2 Wheeler'],
    logo: 'https://images.seeklogo.com/logo-png/14/2/yamaha-motor-logo-png_seeklogo-147343.png',
  },
];
