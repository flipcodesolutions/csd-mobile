import React from 'react';
import {
  Modal as RNModal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';
import { WifiOff } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { useNetworkStatus } from './networkMonitor';

const NoConnectionScreen: React.FC = () => {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
      accessibilityRole="alert"
      accessibilityLabel="No connection"
      pointerEvents="auto"
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.centerContent}>
        <WifiOff size={56} color={colors.textMuted} strokeWidth={1.75} />
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          No connection
        </Text>
      </View>
    </View>
  );
};

export const NoConnectionOverlay: React.FC = () => {
  const isOnline = useNetworkStatus();

  if (isOnline) {
    return null;
  }

  if (Platform.OS === 'ios') {
    return (
      <FullWindowOverlay>
        <NoConnectionScreen />
      </FullWindowOverlay>
    );
  }

  return (
    <>
      <View style={styles.rootOverlay} pointerEvents="auto">
        <NoConnectionScreen />
      </View>
      <RNModal
        visible
        transparent={false}
        animationType="none"
        statusBarTranslucent
        hardwareAccelerated
        onRequestClose={() => {}}
      >
        <NoConnectionScreen />
      </RNModal>
    </>
  );
};

const styles = StyleSheet.create({
  rootOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 99999,
    elevation: 99999,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  message: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
});

export default NoConnectionOverlay;
