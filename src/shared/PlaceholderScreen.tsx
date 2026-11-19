import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Compass,
  Home,
  Menu,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../core/theme/ThemeContext';
import { triggerHaptic } from '../core/utils/haptics';

interface PlaceholderScreenProps {
  title: string;
  category?: string;
  icon?: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  description?: string;
  showHeader?: boolean;
  onOpenDrawer?: () => void;
  onNavigateHome?: () => void;
}

export const PlaceholderScreen: React.FC<PlaceholderScreenProps> = ({
  title,
  category = 'PORTAL MODULE',
  icon: IconComponent = Compass,
  description = 'This section is currently configured in the web portal and is being optimized for the mobile experience.',
  showHeader = false,
  onOpenDrawer,
  onNavigateHome,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#080D1A' : '#F7F7F5',
        },
      ]}
    >
      {/* Optional Top Header Bar if not mounted in a stack with Header */}
      {showHeader && (
        <View
          style={[
            styles.headerBar,
            {
              backgroundColor: isDark ? '#101726' : '#FFFFFF',
              borderBottomColor: isDark ? '#1E293B' : '#E2E8F0',
              paddingTop: 8,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.menuBtn,
              {
                backgroundColor: isDark ? '#162030' : '#F1F5F9',
                borderColor: isDark ? '#1E293B' : '#CBD5E1',
              },
            ]}
            onPress={() => {
              triggerHaptic('impactLight');
              if (onOpenDrawer) onOpenDrawer();
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Menu size={18} color={isDark ? '#F8FAFC' : '#0F172A'} strokeWidth={2.2} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text
              style={[
                styles.headerTitle,
                { color: isDark ? '#F8FAFC' : '#0F172A' },
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
            <Text
              style={[
                styles.headerSub,
                { color: isDark ? '#94A3B8' : '#64748B' },
              ]}
            >
              Defence Autolink • {category}
            </Text>
          </View>

          <View style={{ width: 36 }} />
        </View>
      )}

      {/* Main Empty State Content */}
      <View style={styles.contentWrap}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#101726' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
            },
          ]}
        >
          {/* Decorative Icon Circle */}
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: isDark
                  ? 'rgba(88, 99, 42, 0.2)'
                  : '#F5F8EE',
                borderColor: isDark ? '#3F4912' : '#DCE9A2',
              },
            ]}
          >
            <IconComponent size={36} color={colors.primary} strokeWidth={2.2} />
          </View>

          {/* Title & Badge */}
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: isDark
                    ? 'rgba(238, 104, 0, 0.15)'
                    : '#FFF7ED',
                  borderColor: isDark ? '#EA580C' : '#FDBA74',
                },
              ]}
            >
              <Text style={styles.badgeText}>COMING SOON</Text>
            </View>
          </View>

          <Text
            style={[
              styles.title,
              { color: isDark ? '#F8FAFC' : '#0F172A' },
            ]}
          >
            {title}
          </Text>

          <Text
            style={[
              styles.description,
              { color: isDark ? '#94A3B8' : '#64748B' },
            ]}
          >
            {description}
          </Text>

          {/* Action Buttons */}
          <View style={styles.btnRow}>
            {onNavigateHome && (
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => {
                  triggerHaptic('impactLight');
                  onNavigateHome();
                }}
                activeOpacity={0.8}
              >
                <Home size={15} color="#FFFFFF" strokeWidth={2.2} />
                <Text style={styles.actionBtnText}>Dashboard</Text>
              </TouchableOpacity>
            )}

            {onOpenDrawer && (
              <TouchableOpacity
                style={[
                  styles.outlineBtn,
                  {
                    backgroundColor: isDark ? '#162030' : '#F8FAFC',
                    borderColor: isDark ? '#1E293B' : '#CBD5E1',
                  },
                ]}
                onPress={() => {
                  triggerHaptic('impactLight');
                  onOpenDrawer();
                }}
                activeOpacity={0.7}
              >
                <Menu size={15} color={colors.textPrimary} strokeWidth={2.2} />
                <Text
                  style={[
                    styles.outlineBtnText,
                    { color: colors.textPrimary },
                  ]}
                >
                  Menu
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  contentWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  badgeRow: {
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: '#EA580C',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    justifyContent: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 120,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 100,
  },
  outlineBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
