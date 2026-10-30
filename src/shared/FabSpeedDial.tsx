import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Download, PhoneCall, Plus, X } from 'lucide-react-native';
import { useTheme } from '../core/theme/ThemeContext';
import { triggerHaptic } from '../core/utils/haptics';

export interface FabActionItem {
  label: string;
  icon?: React.ReactNode;
  onPress: () => void;
  backgroundColor?: string;
  tintColor?: string;
}

export interface FabSpeedDialProps {
  primaryAction?: FabActionItem;
  secondaryAction?: FabActionItem;
  actions?: FabActionItem[];
  bottomOffset?: number;
}

const ANIMATION_DURATION = 180;
const EASING_CURVE = Easing.out(Easing.quad);

/**
 * Material 3 Expressive FAB Menu
 * Spec: https://m3.material.io/components/fab-menu/specs
 * 
 * Simple, smooth linear timing with identical open/close speed.
 * Completely unmounts menu on close to prevent ghost elevation shadows on Android.
 */
export const FabSpeedDial: React.FC<FabSpeedDialProps> = ({
  primaryAction,
  secondaryAction,
  actions,
  bottomOffset,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const animation = useSharedValue(0);

  // Combine actions list (support either actions array or primary/secondary pair)
  const menuActions: FabActionItem[] = actions
    ? actions
    : [
        ...(secondaryAction ? [secondaryAction] : []),
        ...(primaryAction ? [primaryAction] : []),
      ];

  const openMenu = () => {
    triggerHaptic('impactLight');
    setIsMenuVisible(true);
    animation.value = withTiming(1, {
      duration: ANIMATION_DURATION,
      easing: EASING_CURVE,
    });
  };

  const closeMenu = (callback?: () => void) => {
    triggerHaptic('selection');
    animation.value = withTiming(
      0,
      {
        duration: ANIMATION_DURATION,
        easing: EASING_CURVE,
      },
      (finished) => {
        if (finished) {
          runOnJS(setIsMenuVisible)(false);
          if (callback) {
            runOnJS(callback)();
          }
        }
      }
    );
  };

  const toggleOpen = () => {
    if (isMenuVisible) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  // Main FAB Rotation Animation (Rotates '+' into an 'X' by 45 degrees smoothly)
  const fabRotationStyle = useAnimatedStyle(() => {
    const rotate = interpolate(animation.value, [0, 1], [0, 45]);
    return {
      transform: [{ rotate: `${rotate}deg` }],
    };
  });

  // Backdrop Scrim Fade Animation
  const backdropStyle = useAnimatedStyle(() => {
    return {
      opacity: animation.value,
    };
  });

  // Action Items Shared Animated Style (smooth fade + 10dp slide)
  const menuItemsAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(animation.value, [0, 1], [10, 0]);
    const scale = interpolate(animation.value, [0, 1], [0.92, 1]);
    return {
      opacity: animation.value,
      transform: [{ translateY }, { scale }],
    };
  });

  const effectiveBottom =
    typeof bottomOffset === 'number'
      ? bottomOffset
      : Math.max(insets.bottom + 20, 28);

  const getDefaultIcon = (item: FabActionItem) => {
    if (item.icon) return item.icon;
    const lower = item.label.toLowerCase();
    if (lower.includes('csv') || lower.includes('download') || lower.includes('export')) {
      return <Download size={16} color="#059669" strokeWidth={2.4} />;
    }
    if (lower.includes('call') || lower.includes('log')) {
      return <PhoneCall size={16} color="#EE6800" strokeWidth={2.4} />;
    }
    return <Plus size={16} color={colors.primary} strokeWidth={2.6} />;
  };

  const getIconBg = (item: FabActionItem) => {
    if (item.backgroundColor) return `${item.backgroundColor}18`;
    const lower = item.label.toLowerCase();
    if (lower.includes('csv') || lower.includes('download') || lower.includes('export')) {
      return 'rgba(5, 150, 105, 0.12)';
    }
    if (lower.includes('call') || lower.includes('log')) {
      return 'rgba(238, 104, 0, 0.12)';
    }
    return isDark ? 'rgba(220, 233, 162, 0.16)' : 'rgba(88, 99, 42, 0.12)';
  };

  return (
    <>
      {/* Backdrop Scrim (dismiss on touch outside) */}
      {isMenuVisible && (
        <TouchableWithoutFeedback onPress={() => closeMenu()}>
          <Animated.View style={[styles.backdrop, backdropStyle]} />
        </TouchableWithoutFeedback>
      )}

      {/* Trailing-edge anchored M3 FAB Menu */}
      <View
        pointerEvents="box-none"
        style={[
          styles.container,
          {
            bottom: effectiveBottom,
            right: 16,
          },
        ]}
      >
        {/* M3 FloatingActionButtonMenuItem Stack (only mounted when visible) */}
        {isMenuVisible && (
          <Animated.View
            style={[styles.menuItemsContainer, menuItemsAnimatedStyle]}
          >
            {menuActions.map((item, index) => (
              <View
                key={`fab-action-${index}-${item.label}`}
                style={styles.menuItemWrapper}
              >
                <TouchableOpacity
                  style={[
                    styles.m3MenuItem,
                    {
                      backgroundColor: isDark ? '#1A2333' : '#FFFFFF',
                      borderColor: isDark ? '#2D3A4F' : '#E2E8F0',
                    },
                  ]}
                  activeOpacity={0.82}
                  onPress={() => {
                    closeMenu(() => {
                      item.onPress();
                    });
                  }}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: getIconBg(item) },
                    ]}
                  >
                    {getDefaultIcon(item)}
                  </View>
                  <Text
                    style={[
                      styles.itemLabel,
                      { color: isDark ? '#F8FAFC' : '#0F172A' },
                    ]}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </Animated.View>
        )}

        {/* M3 Main Floating Action Button Trigger */}
        <TouchableOpacity
          style={[
            styles.mainFab,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
            },
          ]}
          activeOpacity={0.9}
          onPress={toggleOpen}
        >
          <Animated.View style={fabRotationStyle}>
            <Plus size={24} color="#FFFFFF" strokeWidth={2.6} />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    zIndex: 998,
  },
  container: {
    position: 'absolute',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    zIndex: 999,
  },
  menuItemsContainer: {
    alignItems: 'flex-end',
    marginBottom: 10,
    gap: 8,
  },
  menuItemWrapper: {
    alignItems: 'flex-end',
  },
  m3MenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    paddingRight: 16,
    paddingVertical: 7,
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    maxWidth: 260,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 6,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  mainFab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
});
