import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { colors } from './colors';

interface Props {
  onFinish: () => void;
}

export const SplashScreen: React.FC<Props> = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    // Smooth entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-advance to Login after 2.2 seconds
    const timer = setTimeout(() => {
      onFinish();
    }, 2200);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, onFinish]);

  return (
    <TouchableWithoutFeedback onPress={onFinish}>
      <View style={styles.container}>
        {/* Animated Brand Content */}
        <Animated.View
          style={[
            styles.contentBox,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Clean Logo Badge */}
          <View style={styles.logoCard}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Typography */}
          <Text style={styles.brandTitle}>
            Defence <Text style={styles.brandAccent}>Autolink</Text>
          </Text>
          <Text style={styles.tagline}>DEALERSHIP CRM PORTAL</Text>

          {/* Minimal Loader */}
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="small" color={colors.orange} />
          </View>
        </Animated.View>

        {/* Minimal Footer */}
        <Animated.View style={[styles.footerWrap, { opacity: fadeAnim }]}>
          <Text style={styles.footerText}>DEFENCE AUTOLINK CRM • ENTERPRISE</Text>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 50,
  },
  contentBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoCard: {
    width: 150,
    height: 110,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  brandAccent: {
    color: colors.orange,
    fontWeight: '800',
  },
  tagline: {
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 2,
    marginTop: 6,
    fontWeight: '600',
    textAlign: 'center',
  },
  loaderWrap: {
    marginTop: 36,
    height: 24,
    justifyContent: 'center',
  },
  footerWrap: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1.5,
    fontWeight: '500',
    opacity: 0.7,
  },
});
