import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { colors } from '../core/theme/colors';

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  style,
  disabled,
  ...rest
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          bg: colors.secondary,
          border: colors.secondary,
          text: '#FFFFFF',
        };
      case 'accent':
        return {
          bg: colors.orange,
          border: colors.orange,
          text: '#FFFFFF',
        };
      case 'danger':
        return {
          bg: colors.danger,
          border: colors.danger,
          text: '#FFFFFF',
        };
      case 'outline':
        return {
          bg: 'transparent',
          border: colors.border,
          text: colors.textPrimary,
        };
      case 'primary':
      default:
        return {
          bg: colors.primary,
          border: colors.primaryHover,
          text: '#FFFFFF',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: 7,
          paddingHorizontal: 12,
          fontSize: 12,
          minHeight: 36,
        };
      case 'lg':
        return {
          paddingVertical: 14,
          paddingHorizontal: 20,
          fontSize: 16,
          minHeight: 50,
        };
      case 'md':
      default:
        return {
          paddingVertical: 11,
          paddingHorizontal: 16,
          fontSize: 14,
          minHeight: 44, // 44dp touch target
        };
    }
  };

  const vStyle = getVariantStyles();
  const sStyle = getSizeStyles();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: disabled ? '#D1D5DB' : vStyle.bg,
          borderColor: disabled ? '#CBD5E1' : vStyle.border,
          paddingVertical: sStyle.paddingVertical,
          paddingHorizontal: sStyle.paddingHorizontal,
          minHeight: sStyle.minHeight,
        },
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={vStyle.text} size="small" />
      ) : (
        <>
          {icon ? <Text style={[styles.icon, { color: vStyle.text }]}>{icon}</Text> : null}
          <Text style={[styles.text, { color: vStyle.text, fontSize: sStyle.fontSize }]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  text: {
    fontWeight: 'bold',
  },
  icon: {
    fontSize: 14,
  },
});

export default Button;
