import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ArrowLeft, Menu, Plus } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { triggerHaptic } from '../utils/haptics';

export interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
  onOpenDrawer?: () => void;
  onAddNew?: () => void;
  addLabel?: string;
  userRole?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBackButton = false,
  onBack,
  onOpenDrawer,
  onAddNew,
  addLabel = '+ Add New',
}) => {
  const { colors, isDark } = useTheme();

  const handleNavPress = () => {
    triggerHaptic('impactLight');
    if (showBackButton && onBack) {
      onBack();
    } else if (onOpenDrawer) {
      onOpenDrawer();
    }
  };

  const handleAddNew = () => {
    triggerHaptic('impactMedium');
    onAddNew?.();
  };

  return (
    <View
      style={[
        styles.headerContainer,
        {
          backgroundColor: isDark ? '#080D1A' : '#FFFFFF',
          borderBottomColor: isDark ? '#1E293B' : '#E2E8F0',
        },
      ]}
    >
      {/* Left Section: Burger Menu or Back Arrow + Screen Name */}
      <View style={styles.leftSection}>
        <TouchableOpacity
          style={[
            styles.navBtn,
            {
              backgroundColor: isDark ? '#131B2E' : '#F1F5F9',
              borderColor: isDark ? '#1E293B' : '#CBD5E1',
            },
          ]}
          onPress={handleNavPress}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={showBackButton ? 'Go Back' : 'Open Navigation Menu'}
        >
          {showBackButton ? (
            <ArrowLeft
              size={20}
              color={isDark ? '#F8FAFC' : '#0F172A'}
              strokeWidth={2.4}
            />
          ) : (
            <Menu
              size={20}
              color={isDark ? '#F8FAFC' : '#0F172A'}
              strokeWidth={2.4}
            />
          )}
        </TouchableOpacity>

        {/* Clean, Prominent Screen Name */}
        <Text
          style={[
            styles.titleText,
            { color: isDark ? '#F8FAFC' : '#0F172A' },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>

      {/* Optional Contextual Action Button (e.g. + Add New) */}
      {onAddNew && (
        <TouchableOpacity
          style={[
            styles.addBtn,
            {
              backgroundColor: colors.primary,
              borderColor: colors.primaryDark,
            },
          ]}
          onPress={handleAddNew}
          activeOpacity={0.8}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Plus size={14} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 4 }} />
          <Text style={styles.addBtnText}>{addLabel.replace(/^\+\s*/, '')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
    flex: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default Header;
