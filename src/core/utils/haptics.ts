import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const defaultOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

export type HapticType =
  | 'impactLight'
  | 'impactMedium'
  | 'impactHeavy'
  | 'notificationSuccess'
  | 'notificationWarning'
  | 'notificationError'
  | 'selection';

/**
 * Triggers tactile haptic feedback for enhanced tactile UI responses.
 */
export const triggerHaptic = (type: HapticType = 'impactLight') => {
  try {
    ReactNativeHapticFeedback.trigger(type, defaultOptions);
  } catch (err) {
    // Graceful silent fallback if haptics aren't supported on device
  }
};
