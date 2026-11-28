import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from '@react-navigation/drawer';
import {
  BarChart2,
  Briefcase,
  Building2,
  Calendar,
  Car,
  Clock,
  CreditCard,
  FileSpreadsheet,
  IndianRupee,
  Kanban,
  LayoutDashboard,
  LogOut,
  Mail,
  Mic,
  PhoneForwarded,
  Radio,
  Receipt,
  ReceiptText,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trophy,
  User,
  UserCheck,
  Users,
  X,
  Zap,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { triggerHaptic } from '../utils/haptics';

export type ScreenName =
  | 'dashboard'
  | 'my-leads'
  | 'leads'
  | 'lead-dates'
  | 'contact-inquiries'
  | 'follow-ups'
  | 'call-recordings'
  | 'send-quotation'
  | 'deals'
  | 'generate-invoice'
  | 'pending-insurance'
  | 'insurance-reminders'
  | 'insurance-records'
  | 'users'
  | 'reports-analytics'
  | 'expense-details'
  | 'brand'
  | 'model'
  | 'variant'
  | 'update-price'
  | 'insurance-companies'
  | 'expense-master'
  | 'lead-source'
  | 'lead-status'
  | 'activity-logs'
  | 'profile';

export interface MenuItem {
  id: ScreenName;
  label: string;
  icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  badge?: string;
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface CustomDrawerContentProps extends DrawerContentComponentProps {
  userEmail?: string;
  userRole?: string;
  onLogout: () => void;
}

export type AppRole =
  | 'Super Admin'
  | 'Sales Manager'
  | 'Sales Executive'
  | 'Receptionist'
  | 'Accountant';

/**
 * Normalize raw role strings or role objects to canonical app role names.
 */
export function normalizeAppRole(
  role?: string | { title?: string; name?: string } | null,
): AppRole {
  const raw =
    typeof role === 'object' && role !== null
      ? role.title || role.name || 'Super Admin'
      : role || 'Super Admin';
  const key = String(raw)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  if (key === 'sales_executive' || key === 'executive' || key === 'sales') {
    return 'Sales Executive';
  }
  if (key === 'sales_manager' || key === 'manager') {
    return 'Sales Manager';
  }
  if (key === 'receptionist') {
    return 'Receptionist';
  }
  if (key === 'accountant') {
    return 'Accountant';
  }
  return 'Super Admin';
}

export const CustomDrawerContent: React.FC<
  CustomDrawerContentProps
> = props => {
  const {
    navigation,
    state,
    userEmail = 'admin@defenceautolink.com',
    userRole = 'Super Admin',
    onLogout,
  } = props;

  const { isDark } = useTheme();
  const normalizedRole = normalizeAppRole(userRole);

  const currentRouteName = (state?.routes[state?.index]?.name ||
    'dashboard') as ScreenName;

  const getRoleBadge = () => {
    switch (normalizedRole) {
      case 'Sales Manager':
        return { icon: 'SM', color: '#f59e0b', section: 'MANAGER DESK' };
      case 'Sales Executive':
        return { icon: 'SE', color: '#10b981', section: 'SALES DESK' };
      case 'Receptionist':
        return {
          icon: 'RC',
          color: '#8b5cf6',
          section: 'RECEPTION & WALK-INS',
        };
      case 'Accountant':
        return { icon: 'AC', color: '#06b6d4', section: 'FINANCE & BILLING' };
      case 'Super Admin':
      default:
        return {
          icon: 'SA',
          color: colors.primary,
          section: 'SUPER ADMIN WORKSPACE',
        };
    }
  };

  const roleMeta = getRoleBadge();

  /**
   * Mirror Web Sidebar.js sections, labels, and panel access
   * (excluding Help & Support, Blogs, CRM, and Settings).
   */
  const getMenuSections = (): MenuSection[] => {
    switch (normalizedRole) {
      case 'Sales Executive':
        return [
          {
            title: 'CONVERSION DESK',
            items: [
              { id: 'dashboard', label: 'Sales Dashboard', icon: LayoutDashboard },
              {
                id: 'my-leads',
                label: 'My Assigned Leads',
                icon: UserCheck,
                badge: 'Live',
              },
              { id: 'leads', label: 'Leads Pipeline', icon: Kanban },
              { id: 'follow-ups', label: 'Follow-Ups', icon: PhoneForwarded },
              { id: 'call-recordings', label: 'Call Recordings', icon: Mic },
              {
                id: 'send-quotation',
                label: 'Send Quotation',
                icon: FileSpreadsheet,
              },
              { id: 'deals', label: 'Deals & Bookings', icon: Trophy },
              {
                id: 'pending-insurance',
                label: 'Pending Insurance',
                icon: ShieldAlert,
              },
              {
                id: 'insurance-reminders',
                label: 'Insurance Reminders',
                icon: ShieldCheck,
              },
              {
                id: 'insurance-records',
                label: 'Insurance Records',
                icon: Shield,
              },
            ],
          },
          {
            title: 'VEHICLE INVENTORY',
            items: [
              { id: 'brand', label: 'Brands', icon: Building2 },
              { id: 'model', label: 'Models', icon: Car },
              { id: 'variant', label: 'Variants & Prices', icon: Zap },
            ],
          },
          {
            title: 'ACCOUNT',
            items: [{ id: 'profile', label: 'My Profile', icon: User }],
          },
        ];

      case 'Sales Manager':
        return [
          {
            title: 'MAIN MENU',
            items: [
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'leads', label: 'Leads Pipeline', icon: Kanban },
              { id: 'follow-ups', label: 'Follow-Ups', icon: PhoneForwarded },
              {
                id: 'call-recordings',
                label: 'Call Recordings',
                icon: Mic,
              },
              {
                id: 'send-quotation',
                label: 'Send Quotation',
                icon: FileSpreadsheet,
              },
              {
                id: 'generate-invoice',
                label: 'Generate Invoice',
                icon: ReceiptText,
              },
              {
                id: 'pending-insurance',
                label: 'Pending Insurance',
                icon: ShieldAlert,
              },
              {
                id: 'insurance-reminders',
                label: 'Insurance Reminders',
                icon: ShieldCheck,
              },
              {
                id: 'insurance-records',
                label: 'Insurance Records',
                icon: Shield,
              },
              { id: 'users', label: 'Users & Team', icon: Users },
              {
                id: 'expense-details',
                label: 'Expense Details',
                icon: CreditCard,
              },
            ],
          },
          {
            title: 'MASTER DATA',
            items: [
              { id: 'brand', label: 'Brands', icon: Building2 },
              { id: 'model', label: 'Models', icon: Car },
              { id: 'variant', label: 'Variants', icon: Zap },
              { id: 'update-price', label: 'Update Price', icon: IndianRupee },
              {
                id: 'insurance-companies',
                label: 'Insurance Companies',
                icon: Briefcase,
              },
              { id: 'expense-master', label: 'Expense', icon: Receipt },
              { id: 'lead-source', label: 'Lead Sources', icon: Radio },
            ],
          },
          {
            title: 'ACCOUNT',
            items: [{ id: 'profile', label: 'My Profile', icon: User }],
          },
        ];

      case 'Receptionist':
        return [
          {
            title: 'FRONT DESK',
            items: [
              {
                id: 'dashboard',
                label: 'Reception Concierge',
                icon: LayoutDashboard,
              },
              { id: 'leads', label: 'Leads Pipeline', icon: Kanban },
              { id: 'follow-ups', label: 'Follow-Ups', icon: PhoneForwarded },
              { id: 'call-recordings', label: 'Call Recordings', icon: Mic },
              {
                id: 'send-quotation',
                label: 'Send Quotation',
                icon: FileSpreadsheet,
              },
              {
                id: 'pending-insurance',
                label: 'Pending Insurance',
                icon: ShieldAlert,
              },
              {
                id: 'insurance-reminders',
                label: 'Insurance Reminders',
                icon: ShieldCheck,
              },
              {
                id: 'insurance-records',
                label: 'Insurance Records',
                icon: Shield,
              },
            ],
          },
          {
            title: 'VEHICLE INVENTORY',
            items: [
              { id: 'brand', label: 'Brands', icon: Building2 },
              { id: 'model', label: 'Models', icon: Car },
              { id: 'variant', label: 'Variants & Pricing', icon: Zap },
            ],
          },
          {
            title: 'WEBSITE & CMS',
            items: [
              {
                id: 'contact-inquiries',
                label: 'Contact Inquiries',
                icon: Mail,
              },
            ],
          },
          {
            title: 'ACCOUNT',
            items: [{ id: 'profile', label: 'My Profile', icon: User }],
          },
        ];

      case 'Accountant':
        return [
          {
            title: 'FINANCE & BILLING',
            items: [
              {
                id: 'dashboard',
                label: 'Accounts Dashboard',
                icon: LayoutDashboard,
              },
              {
                id: 'reports-analytics',
                label: 'Financial Reports',
                icon: BarChart2,
              },
              {
                id: 'generate-invoice',
                label: 'Generate Invoice',
                icon: ReceiptText,
              },
              { id: 'expense-master', label: 'Expense Master', icon: Receipt },
              {
                id: 'expense-details',
                label: 'Expense Details',
                icon: CreditCard,
              },
            ],
          },
          {
            title: 'ACCOUNT',
            items: [{ id: 'profile', label: 'My Profile', icon: User }],
          },
        ];

      case 'Super Admin':
      default:
        return [
          {
            title: 'MAIN MENU',
            items: [
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'leads', label: 'Leads Pipeline', icon: Kanban },
              { id: 'lead-dates', label: 'Lead Dates Manager', icon: Calendar },
              { id: 'follow-ups', label: 'Follow-Ups', icon: PhoneForwarded },
              { id: 'call-recordings', label: 'Call Recordings', icon: Mic },
              {
                id: 'send-quotation',
                label: 'Send Quotation',
                icon: FileSpreadsheet,
              },
              { id: 'deals', label: 'Deals & Bookings', icon: Trophy },
              {
                id: 'generate-invoice',
                label: 'Generate Invoice',
                icon: ReceiptText,
              },
              {
                id: 'pending-insurance',
                label: 'Pending Insurance',
                icon: ShieldAlert,
              },
              {
                id: 'insurance-reminders',
                label: 'Insurance Reminders',
                icon: ShieldCheck,
              },
              {
                id: 'insurance-records',
                label: 'Insurance Records',
                icon: Shield,
              },
              { id: 'users', label: 'Users & Team', icon: Users },
              {
                id: 'reports-analytics',
                label: 'Reports & Analytics',
                icon: BarChart2,
              },
              {
                id: 'expense-details',
                label: 'Expense Details',
                icon: CreditCard,
              },
            ],
          },
          {
            title: 'MASTER DATA',
            items: [
              { id: 'brand', label: 'Brands', icon: Building2 },
              { id: 'model', label: 'Models', icon: Car },
              { id: 'variant', label: 'Variants', icon: Zap },
              { id: 'update-price', label: 'Update Price', icon: IndianRupee },
              {
                id: 'insurance-companies',
                label: 'Insurance Companies',
                icon: Briefcase,
              },
              { id: 'expense-master', label: 'Expense', icon: Receipt },
              { id: 'lead-source', label: 'Lead Sources', icon: Radio },
            ],
          },
          {
            title: 'WEBSITE & CMS',
            items: [
              {
                id: 'contact-inquiries',
                label: 'Contact Inquiries',
                icon: Mail,
              },
            ],
          },
          {
            title: 'MANAGEMENT',
            items: [
              { id: 'activity-logs', label: 'Activity Logs', icon: Clock },
            ],
          },
          {
            title: 'ACCOUNT',
            items: [{ id: 'profile', label: 'My Profile', icon: User }],
          },
        ];
    }
  };

  const menuSections = getMenuSections();

  return (
    <View
      style={[
        styles.drawerWrapper,
        { backgroundColor: isDark ? '#0B111A' : '#FFFFFF' },
      ]}
    >
      {/* 1. Header with Dealership Logo & Close Button */}
      <View
        style={[
          styles.drawerHeader,
          {
            borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
          },
        ]}
      >
        <View style={styles.brandRow}>
          <View
            style={[
              styles.logoBox,
              {
                backgroundColor: isDark ? '#162030' : '#FFFFFF',
                borderColor: isDark ? '#1E293B' : '#E2E8F0',
              },
            ]}
          >
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.brandInfo}>
            <Text
              style={[
                styles.brandName,
                { color: isDark ? '#F8FAFC' : '#0F172A' },
              ]}
              numberOfLines={1}
            >
              Defence Autolink
            </Text>
            <Text style={styles.brandTag}>
              {normalizedRole.toUpperCase()} WORKSPACE
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.closeBtn,
            {
              backgroundColor: isDark ? '#162030' : '#F1F5F9',
              borderColor: isDark ? '#1E293B' : '#CBD5E1',
            },
          ]}
          onPress={() => {
            triggerHaptic('impactLight');
            navigation.closeDrawer();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Close Navigation Drawer"
        >
          <X
            size={16}
            color={isDark ? '#94A3B8' : '#64748B'}
            strokeWidth={2.4}
          />
        </TouchableOpacity>
      </View>

      {/* 2. Scrollable Navigation Menu Sections */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {menuSections.map((section, sIdx) => (
          <View key={section.title} style={styles.sectionContainer}>
            <Text
              style={[
                styles.menuSectionHeader,
                {
                  color: isDark ? '#64748B' : '#94A3B8',
                  marginTop: sIdx === 0 ? 4 : 16,
                },
              ]}
            >
              {section.title}
            </Text>

            {section.items.map(item => {
              const isActive = currentRouteName === item.id;
              const IconComp = item.icon || LayoutDashboard;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    isActive && [
                      styles.menuItemActive,
                      {
                        backgroundColor: isDark
                          ? 'rgba(88, 99, 42, 0.35)'
                          : '#58632A',
                        borderColor: isDark ? '#58632A' : '#3F4912',
                      },
                    ],
                  ]}
                  onPress={() => {
                    triggerHaptic('selection');
                    (navigation as any).navigate(item.id);
                  }}
                  activeOpacity={0.7}
                >
                  <IconComp
                    size={17}
                    color={
                      isActive ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'
                    }
                    strokeWidth={isActive ? 2.4 : 1.9}
                  />
                  <Text
                    style={[
                      styles.menuLabel,
                      {
                        color: isActive
                          ? '#FFFFFF'
                          : isDark
                          ? '#CBD5E1'
                          : '#334155',
                      },
                      isActive && styles.menuLabelActive,
                    ]}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>

                  {item.badge && (
                    <View
                      style={[
                        styles.itemBadge,
                        {
                          backgroundColor: isActive
                            ? '#FFFFFF'
                            : isDark
                            ? 'rgba(238, 104, 0, 0.2)'
                            : '#FFF7ED',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.itemBadgeText,
                          {
                            color: isActive
                              ? '#58632A'
                              : isDark
                              ? '#FB923C'
                              : '#EA580C',
                          },
                        ]}
                      >
                        {item.badge}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </DrawerContentScrollView>

      {/* 3. Drawer Footer: User Profile + Theme Switcher + Sign Out */}
      <View
        style={[
          styles.drawerFooter,
          {
            borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
          },
        ]}
      >
        {/* User Info Tile */}
        <View style={styles.footerUserRow}>
          <View
            style={[styles.userAvatar, { backgroundColor: roleMeta.color }]}
          >
            <Text style={styles.userAvatarText}>{roleMeta.icon}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text
              style={[
                styles.userName,
                { color: isDark ? '#F8FAFC' : '#0F172A' },
              ]}
              numberOfLines={1}
            >
              Admin User
            </Text>
            <Text
              style={[
                styles.userEmail,
                { color: isDark ? '#94A3B8' : '#64748B' },
              ]}
              numberOfLines={1}
            >
              {userEmail}
            </Text>
          </View>
        </View>

        {/* Action Button: Sign Out */}
        <View style={styles.footerActionRow}>
          {/* Sign Out Button */}
          <TouchableOpacity
            style={[
              styles.logoutBtn,
              {
                backgroundColor: isDark ? '#162030' : '#FEE2E2',
                borderColor: isDark ? '#1E293B' : '#FECACA',
              },
            ]}
            onPress={() => {
              triggerHaptic('impactMedium');
              navigation.closeDrawer();
              onLogout();
            }}
            activeOpacity={0.7}
          >
            <LogOut size={15} color="#EF4444" strokeWidth={2.2} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  drawerWrapper: {
    flex: 1,
    paddingTop: 12,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  logoBox: {
    width: 38,
    height: 38,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: 26,
    height: 26,
  },
  brandInfo: {
    flex: 1,
  },
  brandName: {
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  brandTag: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#EE6800',
    letterSpacing: 0.5,
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
  scrollContent: {
    paddingHorizontal: 10,
    paddingTop: 4,
    paddingBottom: 20,
  },
  sectionContainer: {
    marginBottom: 4,
  },
  menuSectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 1.5,
    gap: 12,
  },
  menuItemActive: {
    borderWidth: 1,
  },
  menuLabel: {
    flex: 1,
    fontSize: 12.8,
    fontWeight: '600',
  },
  menuLabelActive: {
    fontWeight: '800',
  },
  itemBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  itemBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  drawerFooter: {
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 10,
  },
  footerUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 11,
    marginTop: 1,
  },
  footerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerSquareBtn: {
    width: 38,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  logoutText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#EF4444',
  },
});
