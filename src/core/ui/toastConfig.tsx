import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ToastConfig } from 'react-native-toast-message';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldCheck,
} from 'lucide-react-native';
import { RFPercentage } from 'react-native-responsive-fontsize';
import { colors } from '../theme/colors';

interface CustomToastProps {
  props: {
    title?: string;
    message?: string;
    status?: 'success' | 'error' | 'warning' | 'info';
  };
  text1?: string;
  text2?: string;
  onPress?: () => void;
}

const renderCustomToast = (
  props: CustomToastProps,
  defaultStatus: 'success' | 'error' | 'warning' | 'info' | 'default' = 'default'
) => {
  const title = props.props?.title || props.text1 || 'Notification';
  const message = props.props?.message || props.text2 || '';
  const status = props.props?.status || defaultStatus;

  let icon = <ShieldCheck size={22} color={colors.primary} strokeWidth={2.4} />;
  let iconBg = 'rgba(88, 99, 42, 0.12)';
  let borderColor = colors.primary;

  if (status === 'success') {
    icon = <CheckCircle2 size={22} color={colors.success} strokeWidth={2.4} />;
    iconBg = 'rgba(22, 163, 74, 0.12)';
    borderColor = colors.success;
  } else if (status === 'error') {
    icon = <AlertCircle size={22} color={colors.danger} strokeWidth={2.4} />;
    iconBg = 'rgba(220, 38, 38, 0.12)';
    borderColor = colors.danger;
  } else if (status === 'warning') {
    icon = <AlertTriangle size={22} color={colors.orange} strokeWidth={2.4} />;
    iconBg = 'rgba(238, 104, 0, 0.12)';
    borderColor = colors.orange;
  } else if (status === 'info') {
    icon = <Info size={22} color="#0284C7" strokeWidth={2.4} />;
    iconBg = 'rgba(2, 132, 199, 0.12)';
    borderColor = '#0284C7';
  }

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={props.onPress}
      style={styles.container}
    >
      <View style={[styles.iconWrapper, { backgroundColor: iconBg, borderColor }]}>
        {icon}
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {!!message && (
          <Text style={styles.message} numberOfLines={2}>
            {message}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export const csdToastConfig: ToastConfig = {
  // Custom notification type matching user requirement
  orderNotification: (props: any) => renderCustomToast(props, 'default'),
  csdNotification: (props: any) => renderCustomToast(props, 'default'),
  success: (props: any) => renderCustomToast(props, 'success'),
  error: (props: any) => renderCustomToast(props, 'error'),
  warning: (props: any) => renderCustomToast(props, 'warning'),
  info: (props: any) => renderCustomToast(props, 'info'),
};

const styles = StyleSheet.create({
  container: {
    width: '92%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 6,
    shadowColor: '#131C27',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(19, 28, 39, 0.08)',
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: RFPercentage(1.85),
    fontWeight: '700',
    color: '#131C27',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  message: {
    fontSize: RFPercentage(1.6),
    fontWeight: '500',
    color: '#475569',
    lineHeight: 18,
  },
});
