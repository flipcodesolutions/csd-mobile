import React from 'react';
import {
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {
  Building2,
  Car,
  Kanban,
  LayoutDashboard,
  ListFilter,
  LogOut,
  PhoneForwarded,
  Radio,
  UserCheck,
  Users,
  X,
  Zap,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { triggerHaptic } from '../utils/haptics';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(width * 0.78, 300);

export type ScreenName =
  | 'dashboard'
  | 'my-leads'
  | 'lead-detail'
  | 'leads'
  | 'follow-ups'
  | 'lead-status'
  | 'lead-source'
  | 'brand'
  | 'model'
  | 'variant'
  | 'users';

interface DrawerProps {
  isOpen: boolean;
  activeScreen: ScreenName;
  onSelectScreen: (screen: ScreenName) => void;
  onClose: () => void;
  onLogout: () => void;
  userEmail?: string;
  userRole?: string;
}

const MENU_ICONS: Record<ScreenName, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  dashboard: LayoutDashboard,
  'my-leads': UserCheck,
  'lead-detail': UserCheck,
  leads: Kanban,
  'follow-ups': PhoneForwarded,
  'lead-status': ListFilter,
  'lead-source': Radio,
  brand: Building2,
  model: Car,
  variant: Zap,
  users: Users,
};

const MENU_ITEMS: { id: ScreenName; label: string; badge?: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'my-leads', label: 'My Assigned Leads', badge: 'Active' },
  { id: 'leads', label: 'Leads Pipeline', badge: 'Live' },
  { id: 'follow-ups', label: 'Follow-Up Call Desk', badge: 'Live' },
  { id: 'lead-status', label: 'Lead Status Master' },
  { id: 'lead-source', label: 'Lead Source Master' },
  { id: 'brand', label: 'Brand Master' },
  { id: 'model', label: 'Model Master' },
  { id: 'variant', label: 'Variant Master' },
  { id: 'users', label: 'User Master' },
];

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  activeScreen,
  onSelectScreen,
  onClose,
  onLogout,
  userEmail = 'admin@defenceautolink.com',
  userRole = 'Super Admin',
}) => {
  if (!isOpen) return null;

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
          { id: 'my-leads' as ScreenName, label: 'My Assigned Leads', badge: 'Active' },
          { id: 'leads' as ScreenName, label: 'Leads Pipeline' },
          { id: 'brand' as ScreenName, label: 'Brand Catalogue' },
          { id: 'model' as ScreenName, label: 'Model Catalogue' },
          { id: 'variant' as ScreenName, label: 'Variant & Prices' },
        ];
      case 'Sales Manager':
        return [
          { id: 'dashboard' as ScreenName, label: 'Manager Dashboard' },
          { id: 'leads' as ScreenName, label: 'Leads Pipeline' },
          { id: 'users' as ScreenName, label: 'Sales Reps Team' },
          { id: 'brand' as ScreenName, label: 'Brand Catalogue' },
          { id: 'model' as ScreenName, label: 'Model Master' },
          { id: 'variant' as ScreenName, label: 'Variant & Prices' },
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
        ];
      case 'Super Admin':
      default:
        return MENU_ITEMS;
    }
  };

  const visibleMenuItems = getMenuItems();

  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={styles.drawerContainer}>
          {/* Header */}
          <View style={styles.drawerHeader}>
            <View style={styles.brandRow}>
              <View style={styles.logoBox}>
                <Image
                  source={require('../../../assets/logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.brandInfo}>
                <Text style={styles.brandName}>Defence Autolink</Text>
                <Text style={styles.brandTag}>
                  {userRole} Workspace
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => {
                triggerHaptic('impactLight');
                onClose();
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={20} color={colors.headerTitle} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>

          {/* User Card */}
          <View style={styles.userCard}>
            <View
              style={[
                styles.userAvatar,
                { backgroundColor: roleMeta.color },
              ]}
            >
              <Text style={styles.userAvatarText}>{roleMeta.icon}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userRole || 'Super Administrator'}</Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {userEmail}
              </Text>
            </View>
          </View>

          {/* Navigation Menu */}
          <Text style={styles.menuSectionHeader}>
            {roleMeta.section}
          </Text>
          <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
            {visibleMenuItems.map((item) => {
              const isActive = activeScreen === item.id;
              const IconComp = MENU_ICONS[item.id] || LayoutDashboard;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.menuItem, isActive && styles.menuItemActive]}
                  onPress={() => {
                    triggerHaptic('selection');
                    onSelectScreen(item.id);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <IconComp
                    size={18}
                    color={isActive ? '#FFFFFF' : '#94A3B8'}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                  <Text
                    style={[
                      styles.menuLabel,
                      isActive && styles.menuLabelActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.badge && (
                    <View
                      style={[
                        styles.badge,
                        isActive && styles.badgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          isActive && styles.badgeTextActive,
                        ]}
                      >
                        {item.badge}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Logout Footer */}
          <View style={styles.drawerFooter}>
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => {
                triggerHaptic('impactMedium');
                onClose();
                onLogout();
              }}
              activeOpacity={0.7}
            >
              <LogOut size={16} color="#EF4444" strokeWidth={2.2} />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
            <Text style={styles.versionText}>v3.4.0 • 256-Bit SSL</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  drawerContainer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: colors.sidebarBg,
    borderRightWidth: 1,
    borderRightColor: 'rgba(217, 221, 204, 0.15)',
    paddingTop: 45,
    paddingBottom: 20,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 221, 204, 0.15)',
    marginBottom: 14,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  logoBox: {
    width: 52,
    height: 42,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFFFFF',
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
    color: colors.headerTitle,
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
  closeText: {
    color: colors.headerTitle,
    fontSize: 16,
    fontWeight: 'bold',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(217, 221, 204, 0.15)',
    padding: 10,
    gap: 10,
    marginBottom: 16,
  },
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userEmail: {
    fontSize: 10,
    color: '#94A3B8',
  },
  menuSectionHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  menuList: {
    flex: 1,
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
    borderWidth: 1,
    borderColor: colors.primaryHover,
  },
  menuIcon: {
    fontSize: 16,
  },
  menuLabel: {
    fontSize: 13,
    color: '#D1D5DB',
    fontWeight: '600',
    flex: 1,
  },
  menuLabelActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  badgeActive: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  badgeText: {
    fontSize: 10,
    color: '#CBD5E1',
    fontWeight: 'bold',
  },
  badgeTextActive: {
    color: '#FFFFFF',
  },
  drawerFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(217, 221, 204, 0.15)',
    gap: 8,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  logoutIcon: {
    fontSize: 15,
  },
  logoutText: {
    fontSize: 13,
    color: '#ff9999',
    fontWeight: 'bold',
  },
  versionText: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
  },
});

export default Drawer;
