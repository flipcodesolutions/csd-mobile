import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors } from '../core/theme/colors';

export interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent';
  icon?: string;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  icon,
  style,
}) => {
  const getStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: '#F2F5E8',
          border: colors.primaryTint,
          text: colors.primary,
        };
      case 'success':
        return {
          bg: '#EBF7EE',
          border: '#A7F3D0',
          text: colors.success,
        };
      case 'warning':
        return {
          bg: '#FEF3C7',
          border: '#FDE68A',
          text: colors.warning,
        };
      case 'danger':
        return {
          bg: '#FEE2E2',
          border: '#FECACA',
          text: colors.danger,
        };
      case 'info':
        return {
          bg: '#E0F2FE',
          border: '#BAE6FD',
          text: colors.info,
        };
      case 'accent':
        return {
          bg: '#FFF7ED',
          border: '#FFEDD5',
          text: colors.orange,
        };
      case 'neutral':
      default:
        return {
          bg: '#F1F5F9',
          border: '#E2E8F0',
          text: '#475569',
        };
    }
  };

  const st = getStyles();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: st.bg,
          borderColor: st.border,
        },
        style,
      ]}
    >
      {icon ? <Text style={[styles.icon, { color: st.text }]}>{icon}</Text> : null}
      <Text style={[styles.text, { color: st.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
  icon: {
    fontSize: 10,
  },
});

export default Badge;
