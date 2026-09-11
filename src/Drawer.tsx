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
import { colors } from './colors';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(width * 0.78, 300);

export type ScreenName =
  | 'dashboard'
  | 'my-leads'
  | 'lead-detail'
  | 'leads'
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

const MENU_ITEMS: { id: ScreenName; label: string; icon: string; badge?: string }[] = [
  { id: 'my-leads', label: 'My Assigned Leads', icon: '💼', badge: 'Active' },
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'leads', label: 'All Customer Leads', icon: '🎯' },
  { id: 'lead-status', label: 'Lead Status Master', icon: '📋' },
  { id: 'lead-source', label: 'Lead Source Master', icon: '📢' },
  { id: 'brand', label: 'Brand Master', icon: '🏷️' },
  { id: 'model', label: 'Model Master', icon: '🚗' },
  { id: 'variant', label: 'Variant Master', icon: '⚡' },
  { id: 'users', label: 'User Master', icon: '👥' },
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

  const isSalesExecutive = userRole === 'Sales Executive';

  const visibleMenuItems = isSalesExecutive
    ? [
        { id: 'my-leads' as ScreenName, label: 'My Assigned Leads', icon: '💼', badge: 'Active' },
        { id: 'brand' as ScreenName, label: 'Brand Catalogue', icon: '🏷️' },
        { id: 'model' as ScreenName, label: 'Model Catalogue', icon: '🚗' },
        { id: 'variant' as ScreenName, label: 'Variant & Prices', icon: '⚡' },
      ]
    : MENU_ITEMS;

  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* Backdrop to close drawer */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {/* Drawer Content Panel */}
        <View style={styles.drawerContainer}>
          {/* 1. Drawer Header */}
          <View style={styles.drawerHeader}>
            <View style={styles.brandRow}>
              <View style={styles.logoBox}>
                <Image
                  source={require('../assets/logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.brandInfo}>
                <Text style={styles.brandName}>Defence Autolink</Text>
                <Text style={styles.brandTag}>
                  {isSalesExecutive ? 'Sales Executive Desk' : 'CarCRM Enterprise'}
                </Text>
              </View>
            </View>

            {/* Close Button */}
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* 2. User Info Card */}
          <View style={styles.userCard}>
            <View
              style={[
                styles.userAvatar,
                { backgroundColor: isSalesExecutive ? '#10b981' : colors.primary },
              ]}
            >
              <Text style={styles.userAvatarText}>{isSalesExecutive ? '💼' : '👑'}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userRole || 'Super Administrator'}</Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {userEmail}
              </Text>
            </View>
          </View>

          {/* 3. Navigation Menu Items */}
          <Text style={styles.menuSectionHeader}>
            {isSalesExecutive ? 'SALES DESK & CATALOGUE' : 'MASTER DATA & NAVIGATION'}
          </Text>
          <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
            {visibleMenuItems.map((item) => {
              const isActive = activeScreen === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.menuItem, isActive && styles.menuItemActive]}
                  onPress={() => {
                    onSelectScreen(item.id);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.menuIcon}>{item.icon}</Text>
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

          {/* 4. Logout Footer */}
          <View style={styles.drawerFooter}>
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => {
                onClose();
                onLogout();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.logoutIcon}>🚪</Text>
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
    backgroundColor: colors.inputBg,
    borderRightWidth: 1,
    borderRightColor: colors.border,
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
    borderBottomColor: colors.border,
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
    color: colors.textWhite,
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
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: 'bold',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.textWhite,
  },
  userEmail: {
    fontSize: 10,
    color: colors.textMuted,
  },
  menuSectionHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textMuted,
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
    color: colors.textLight,
    fontWeight: '600',
    flex: 1,
  },
  menuLabelActive: {
    color: colors.textWhite,
    fontWeight: 'bold',
  },
  badge: {
    backgroundColor: colors.card,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeActive: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  badgeText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: 'bold',
  },
  badgeTextActive: {
    color: colors.textWhite,
  },
  drawerFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(214, 69, 69, 0.15)',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  logoutIcon: {
    fontSize: 15,
  },
  logoutText: {
    fontSize: 13,
    color: '#ff8888',
    fontWeight: 'bold',
  },
  versionText: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
