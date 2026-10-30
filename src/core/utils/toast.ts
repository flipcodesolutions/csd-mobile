import Toast from 'react-native-toast-message';
import { triggerHaptic } from './haptics';

/**
 * Global CSD Custom Toast Helper
 * Direct replacement for raw Alert.alert for modern, UI/UX friendly feedback.
 */

export const showNotification = (
  title: string,
  message: string = '',
  onTap?: () => void
) => {
  triggerHaptic('notificationSuccess');
  Toast.show({
    type: 'csdNotification',
    props: { title, message, status: 'info' },
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 4000,
    autoHide: true,
    topOffset: 50,
    onPress: onTap || (() => Toast.hide()),
  });
};

export const showSuccessToast = (
  title: string,
  message: string = '',
  onTap?: () => void
) => {
  triggerHaptic('notificationSuccess');
  Toast.show({
    type: 'success',
    props: { title, message, status: 'success' },
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 3500,
    autoHide: true,
    topOffset: 50,
    onPress: onTap || (() => Toast.hide()),
  });
};

export const showErrorToast = (
  title: string,
  message: string = '',
  onTap?: () => void
) => {
  triggerHaptic('notificationError');
  Toast.show({
    type: 'error',
    props: { title, message, status: 'error' },
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 4500,
    autoHide: true,
    topOffset: 50,
    onPress: onTap || (() => Toast.hide()),
  });
};

export const showWarningToast = (
  title: string,
  message: string = '',
  onTap?: () => void
) => {
  triggerHaptic('notificationWarning');
  Toast.show({
    type: 'warning',
    props: { title, message, status: 'warning' },
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 4000,
    autoHide: true,
    topOffset: 50,
    onPress: onTap || (() => Toast.hide()),
  });
};

export const hideNotification = () => Toast.hide();
