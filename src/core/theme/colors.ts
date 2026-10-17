// Defence Autolink & CSD Dealership Color Tokens (Dual-Theme Standard: Light & Dark)
// Derived from:
// - Light Theme: md/executive_tactical_automotive/DESIGN.md
// - Dark Theme: md/tactical_executive_dealership/DESIGN.md

export interface ThemeColorTokens {
  mode: 'light' | 'dark';

  // Canvas & Surfaces
  background: string;
  backgroundSubtle: string;
  card: string;
  cardSubtle: string;
  subCard: string;
  surface: string;
  surfaceSubtle: string;

  // Top Bars & Navigation
  headerBg: string;
  headerBorder: string;
  headerTitle: string;
  sidebarBg: string;

  // Primary Tactical Command (Army Olive)
  primary: string;
  primaryDark: string;
  primaryHover: string;
  primaryLight: string;
  primaryTint: string;

  // Secondary & Structural (Tactical Gunmetal & Navy)
  secondary: string;
  secondaryNavy: string;
  surfaceDark: string;

  // CSD Gold & Amber Accents
  gold: string;
  goldBg: string;
  goldBorder: string;
  goldText: string;

  // Immediate Conversion Trigger (Amber / Orange CTA)
  orange: string;
  accentOrange: string;
  orangeHover: string;
  orangeBg: string;
  orangeBorder: string;

  // Emerald / Deal Won / Verified
  green: string;
  success: string;
  emerald: string;
  emeraldBg: string;
  emeraldBorder: string;

  // Crimson / Hot Lead / Urgent Priority
  rose: string;
  danger: string;
  hotBg: string;
  hotBorder: string;
  hotText: string;

  // Warm Pipeline
  amber: string;
  warning: string;
  warmBg: string;
  warmBorder: string;
  warmText: string;

  // Cold Pipeline
  sky: string;
  info: string;
  blue: string;
  coldBg: string;
  coldBorder: string;
  coldText: string;

  // Structural Borders
  border: string;
  borderLight: string;
  borderSubtle: string;

  // Typography & Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textWhite: string;
  textLight: string;

  // Form Inputs
  inputBg: string;
  inputBorder: string;
  inputPlaceholder: string;

  // Shadows
  shadowColor: string;
}

export const lightColors: ThemeColorTokens = {
  mode: 'light',

  background: '#FAF8FF',
  backgroundSubtle: '#F1F5F9',
  card: '#FFFFFF',
  cardSubtle: '#F8FAFC',
  subCard: '#F1F5F9',
  surface: '#FAF8FF',
  surfaceSubtle: '#F2F3FF',

  headerBg: '#FFFFFF',
  headerBorder: '#E2E8F0',
  headerTitle: '#0F172A',
  sidebarBg: '#131B2E',

  primary: '#4A5D23',
  primaryDark: '#33450D',
  primaryHover: '#3F501E',
  primaryLight: '#D4ECA2',
  primaryTint: '#E8F2D0',

  secondary: '#131B2E',
  secondaryNavy: '#000080',
  surfaceDark: '#1A2230',

  gold: '#856317',
  goldBg: '#FEF3C7',
  goldBorder: '#FDE68A',
  goldText: '#856317',

  orange: '#EA580C',
  accentOrange: '#EA580C',
  orangeHover: '#C2410C',
  orangeBg: '#FFF7ED',
  orangeBorder: '#FFEDD5',

  green: '#059669',
  success: '#059669',
  emerald: '#059669',
  emeraldBg: '#ECFDF5',
  emeraldBorder: '#A7F3D0',

  rose: '#E11D48',
  danger: '#DC2626',
  hotBg: '#FFF1F2',
  hotBorder: '#FECDD3',
  hotText: '#E11D48',

  amber: '#D97706',
  warning: '#D97706',
  warmBg: '#FFFBEB',
  warmBorder: '#FDE68A',
  warmText: '#D97706',

  sky: '#0284C7',
  info: '#0284C7',
  blue: '#0284C7',
  coldBg: '#F0F9FF',
  coldBorder: '#BAE6FD',
  coldText: '#0284C7',

  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderSubtle: '#CBD5E1',

  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textWhite: '#FFFFFF',
  textLight: '#0F172A',

  inputBg: '#FFFFFF',
  inputBorder: '#CBD5E1',
  inputPlaceholder: '#94A3B8',

  shadowColor: '#0F172A',
};

export const darkColors: ThemeColorTokens = {
  mode: 'dark',

  background: '#080D1A',
  backgroundSubtle: '#0D131F',
  card: '#131B2E',
  cardSubtle: '#162030',
  subCard: '#101726',
  surface: '#0D131F',
  surfaceSubtle: '#161C28',

  headerBg: '#080D1A',
  headerBorder: '#1E293B',
  headerTitle: '#F8FAFC',
  sidebarBg: '#0D131F',

  primary: '#BDCF79',
  primaryDark: '#596E2C',
  primaryHover: '#8B9B4C',
  primaryLight: '#3E4C1C',
  primaryTint: '#273000',

  secondary: '#0F172A',
  secondaryNavy: '#1E3A8A',
  surfaceDark: '#0D131F',

  gold: '#C5A059',
  goldBg: 'rgba(197, 160, 89, 0.15)',
  goldBorder: 'rgba(197, 160, 89, 0.35)',
  goldText: '#C5A059',

  orange: '#E08324',
  accentOrange: '#E08324',
  orangeHover: '#D97D1E',
  orangeBg: 'rgba(224, 131, 36, 0.15)',
  orangeBorder: 'rgba(224, 131, 36, 0.35)',

  green: '#10B981',
  success: '#10B981',
  emerald: '#10B981',
  emeraldBg: 'rgba(16, 185, 129, 0.15)',
  emeraldBorder: 'rgba(16, 185, 129, 0.35)',

  rose: '#EF4444',
  danger: '#EF4444',
  hotBg: 'rgba(239, 68, 68, 0.15)',
  hotBorder: 'rgba(239, 68, 68, 0.4)',
  hotText: '#F87171',

  amber: '#F59E0B',
  warning: '#F59E0B',
  warmBg: 'rgba(245, 158, 11, 0.15)',
  warmBorder: 'rgba(245, 158, 11, 0.35)',
  warmText: '#FBBF24',

  sky: '#38BDF8',
  info: '#38BDF8',
  blue: '#38BDF8',
  coldBg: 'rgba(56, 189, 248, 0.15)',
  coldBorder: 'rgba(56, 189, 248, 0.35)',
  coldText: '#38BDF8',

  border: '#1E293B',
  borderLight: '#161C28',
  borderSubtle: '#334155',

  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textWhite: '#FFFFFF',
  textLight: '#F8FAFC',

  inputBg: '#101726',
  inputBorder: '#1E293B',
  inputPlaceholder: '#64748B',

  shadowColor: '#000000',
};

export type ThemeColors = ThemeColorTokens;

// Default colors set to Light for standard fallback
export const colors: ThemeColors = lightColors;

export default colors;
