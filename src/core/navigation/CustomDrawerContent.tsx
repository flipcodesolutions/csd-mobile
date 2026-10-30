import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from '@react-navigation/drawer';
import {
  Building2,
  Car,
  IndianRupee,
  Kanban,
  LayoutDashboard,
  ListFilter,
  LogOut,
  Moon,
  PhoneForwarded,
  Radio,
  Receipt,
  Sun,
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
  | 'follow-ups'
  | 'lead-status'
  | 'lead-source'
  | 'brand'
  | 'model'
  | 'variant'
  | 'update-price'
  | 'expense-master'
  | 'users';

interface CustomDrawerContentProps extends DrawerContentComponentProps {
  userEmail?: string;
  userRole?: string;
  onLogout: () => void;
}

const MENU_ICONS: Record<
  string,
  React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>
> = {
  dashboard: LayoutDashboard,
  'my-leads': UserCheck,
  leads: Kanban,
  'follow-ups': PhoneForwarded,
  'lead-status': ListFilter,
  'lead-source': Radio,
  brand: Building2,
  model: Car,
  variant: Zap,
  'update-price': IndianRupee,
  'expense-master': Receipt,
  users: Users,
};

const MENU_ITEMS: { id: ScreenName; label: string; badge?: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'my-leads', label: 'My Assigned Leads' },
  { id: 'leads', label: 'Leads Pipeline' },
  { id: 'follow-ups', label: 'Follow-Up Call Desk', badge: 'Live' },
  { id: 'brand', label: 'Brand Master' },
  { id: 'model', label: 'Model Master' },
  { id: 'variant', label: 'Variant Master' },
  { id: 'update-price', label: 'Price Master & Updater' },
  { id: 'expense-master', label: 'Expense Master' },
  { id: 'lead-status', label: 'Lead Status Master' },
  { id: 'lead-source', label: 'Lead Source Master' },
  { id: 'users', label: 'User Master' },
];

export const CustomDrawerContent: React.FC<CustomDrawerContentProps> = (props) => {
  const {
    navigation,
    state,
    userEmail = 'david.miller@carcrm.com',
    userRole = 'Sales Executive',
    onLogout,
  } = props;

  const { isDark, toggleTheme } = useTheme();

  const currentRouteName = state?.routes[state?.index]?.name || 'my-leads';

  const getRoleBadge = () => {
    switch (userRole) {
      case 'Sales Manager':
        return { icon: 'SM', color: '#f59e0b', section: 'MANAGER DESK & TEAM' };
      case 'Sales Executive':
        return { icon: 'SE', color: '#10b981', section: 'SALES DESK & CATALOGUE' };
      case 'Receptionist':
        return { icon: 'RC', color: '#8b5cf6', section: 'RECEPTION & WALK-INS' };
      case 'Accountant':
        return { icon: 'AC', color: '#06b6d4', section: 'FINANCE & BILLING' };
      case 'Super Admin':
      default:
        return { icon: 'SA', color: colors.primary, section: 'MASTER DATA & NAVIGATION' };
    }
  };

  const roleMeta = getRoleBadge();

  const getMenuItems = () => {
    switch (userRole) {
      case 'Sales Executive':
        return [
          { id: 'dashboard' as ScreenName, label: 'Sales Dashboard' },
          { id: 'my-leads' as ScreenName, label: 'My Assigned Leads' },
          { id: 'leads' as ScreenName, label: 'Leads Pipeline' },
          { id: 'brand' as ScreenName, label: 'Brand Catalogue' },
          { id: 'model' as ScreenName, label: 'Model Catalogue' },
          { id: 'variant' as ScreenName, label: 'Variant & Prices' },
          { id: 'update-price' as ScreenName, label: 'Price Master' },
        ];
      case 'Sales Manager':
        return [
          { id: 'dashboard' as ScreenName, label: 'Manager Dashboard' },
          { id: 'leads' as ScreenName, label: 'Leads Pipeline' },
          { id: 'users' as ScreenName, label: 'Sales Reps Team' },
          { id: 'brand' as ScreenName, label: 'Brand Catalogue' },
          { id: 'model' as ScreenName, label: 'Model Master' },
          { id: 'variant' as ScreenName, label: 'Variant & Prices' },
          { id: 'update-price' as ScreenName, label: 'Price Master' },
        ];
      case 'Receptionist':
        return [
          { id: 'dashboard' as ScreenName, label: 'Reception Concierge' },
          { id: 'leads' as ScreenName, label: 'Leads Pipeline' },
          { id: 'brand' as ScreenName, label: 'Showroom Brands' },
          { id: 'model' as ScreenName, label: 'Vehicle Models' },
          { id: 'variant' as ScreenName, label: 'Variants Master' },
        ];
      case 'Accountant':
        return [
          { id: 'dashboard' as ScreenName, label: 'Accounts Dashboard' },
          { id: 'leads' as ScreenName, label: 'Deals & Bookings' },
          { id: 'variant' as ScreenName, label: 'Variants & On-Road Tax' },
          { id: 'model' as ScreenName, label: 'Model Master' },
          { id: 'update-price' as ScreenName, label: 'Ex-Showroom & CSD Prices' },
          { id: 'expense-master' as ScreenName, label: 'Expense Master' },
        ];
      case 'Super Admin':
      default:
        return MENU_ITEMS;
    }
  };

  const visibleMenuItems = getMenuItems();

  return (
    <View
      style={[
        styles.drawerWrapper,
        { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' },
      ]}
    >
      {/* 1. Header with Dealership Logo & Close Button */}
      <View
        style={[
          styles.drawerHeader,
          {
            borderBottomColor: isDark
              ? 'rgba(217, 221, 204, 0.15)'
              : '#E2E8F0',
          },
        ]}
      >
        <View style={styles.brandRow}>
          <View
            style={[
              styles.logoBox,
              {
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                borderColor: isDark ? '#334155' : '#E2E8F0',
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
            >
              Defence Autolink
            </Text>
            <Text style={styles.brandTag}>{userRole} Workspace</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => {
            triggerHaptic('impactLight');
            navigation.closeDrawer();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Close Navigation Drawer"
        >
          <X size={20} color={isDark ? '#94A3B8' : '#64748B'} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      {/* 2. User Card */}
      <View
        style={[
          styles.userCard,
          {
            backgroundColor: isDark
              ? 'rgba(255, 255, 255, 0.06)'
              : '#F8FAFC',
            borderColor: isDark
              ? 'rgba(217, 221, 204, 0.15)'
              : '#E2E8F0',
          },
        ]}
      >
        <View style={[styles.userAvatar, { backgroundColor: roleMeta.color }]}>
          <Text style={styles.userAvatarText}>{roleMeta.icon}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text
            style={[
              styles.userName,
              { color: isDark ? '#FFFFFF' : '#0F172A' },
            ]}
          >
            {userRole || 'Super Administrator'}
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

      {/* 3. Navigation Menu Items */}
      <Text
        style={[
          styles.menuSectionHeader,
          { color: isDark ? '#94A3B8' : '#64748B' },
        ]}
      >
        {roleMeta.section}
      </Text>

      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {visibleMenuItems.map((item) => {
          const isActive = currentRouteName === item.id;
          const IconComp = MENU_ICONS[item.id] || LayoutDashboard;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                isActive && styles.menuItemActive,
              ]}
              onPress={() => {
                triggerHaptic('selection');
                navigation.navigate(item.id);
              }}
              activeOpacity={0.7}
            >
              <IconComp
                size={18}
                color={
                  isActive
                    ? '#FFFFFF'
                    : isDark
                    ? '#94A3B8'
                    : '#64748B'
                }
                strokeWidth={isActive ? 2.2 : 1.8}
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
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </DrawerContentScrollView>

      {/* 4. Drawer Footer: Theme Switcher + Sign Out */}
      <View
        style={[
          styles.drawerFooter,
          {
            borderTopColor: isDark
              ? 'rgba(217, 221, 204, 0.15)'
              : '#E2E8F0',
          },
        ]}
      >
        {/* Dark / Light Theme Toggle Option */}
        <TouchableOpacity
          style={[
            styles.themeOptionRow,
            {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.06)'
                : '#F1F5F9',
              borderColor: isDark
                ? 'rgba(217, 221, 204, 0.15)'
                : '#E2E8F0',
            },
          ]}
          onPress={() => {
            triggerHaptic('selection');
            toggleTheme();
          }}
          activeOpacity={0.7}
        >
          <View style={styles.themeLeft}>
            {isDark ? (
              <Moon size={18} color="#A78BFA" strokeWidth={2.2} />
            ) : (
              <Sun size={18} color="#F59E0B" strokeWidth={2.2} />
            )}
            <Text
              style={[
                styles.themeText,
                { color: isDark ? '#F8FAFC' : '#0F172A' },
              ]}
            >
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </Text>
          </View>

          <View
            style={[
              styles.themeStatusBadge,
              {
                backgroundColor: isDark ? '#38BDF8' : '#64748B',
              },
            ]}
          >
            <Text style={styles.themeStatusBadgeText}>
              {isDark ? 'Dark' : 'Light'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => {
            triggerHaptic('impactMedium');
            navigation.closeDrawer();
            onLogout();
          }}
          activeOpacity={0.7}
        >
          <LogOut size={16} color="#EF4444" strokeWidth={2.2} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  drawerWrapper: {
    flex: 1,
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 14,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  logoBox: {
    width: 48,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  brandInfo: {
    flex: 1,
  },
  brandName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  brandTag: {
    fontSize: 10,
    color: colors.orange,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 6,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    gap: 10,
    marginBottom: 16,
  },
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 10,
  },
  menuSectionHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  scrollContent: {
    paddingTop: 0,
    paddingBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
    gap: 10,
  },
  menuItemActive: {
    backgroundColor: colors.primary,
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  menuLabelActive: {
    fontWeight: 'bold',
  },
  drawerFooter: {
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 10,
  },
  themeOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  themeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  themeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  themeStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  themeStatusBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: 'bold',
  },
});

export default CustomDrawerContent;
