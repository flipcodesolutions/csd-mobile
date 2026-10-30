import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { ThemeProvider, useTheme } from './src/core/theme/ThemeContext';
import { AppNavigator } from './src/core/navigation/AppNavigator';
import { LoginScreen } from './src/features/auth/LoginScreen';
import { SplashScreen } from './src/SplashScreen';
import { authApi } from './src/features/auth/authService';
import { setOnUnauthorizedHandler } from './src/core/api/client';
import { csdToastConfig } from './src/core/ui/toastConfig';

// App root
function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider initialTheme="light">
          <BottomSheetModalProvider>
            <MainApp />
            <Toast config={csdToastConfig} />
          </BottomSheetModalProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function MainApp() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  // App Navigation States
  const [isSplashDone, setIsSplashDone] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState('david.miller@carcrm.com');
  const [currentUserRole, setCurrentUserRole] = useState('Sales Executive');

  // Auto-restore session & register global 401 Unauthorized listener
  useEffect(() => {
    let isMounted = true;

    // Global 401 session expiry handler
    setOnUnauthorizedHandler(() => {
      if (isMounted) {
        setIsLoggedIn(false);
      }
    });

    authApi
      .restoreSession()
      .then((session) => {
        if (isMounted && session && session.token) {
          setIsLoggedIn(true);
          if (session.user?.email) setCurrentUserEmail(session.user.email);
          if (session.user?.role) setCurrentUserRole(session.user.role);
        }
      })
      .catch((err) => {
        console.log('Session restore error (fallback to login):', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 1. Initial Splash Screen
  if (!isSplashDone) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={{ height: insets.top, backgroundColor: colors.background }} />
        <View style={{ flex: 1 }}>
          <SplashScreen onFinish={() => setIsSplashDone(true)} />
        </View>
        <View style={{ height: insets.bottom, backgroundColor: colors.background }} />
      </View>
    );
  }

  // 2. Login Screen
  if (!isLoggedIn) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={{ height: insets.top, backgroundColor: colors.background }} />
        <View style={{ flex: 1 }}>
          <LoginScreen
            onBackToSplash={() => setIsSplashDone(false)}
            onLoginSuccess={(email, user) => {
              setCurrentUserEmail(email);
              if (user?.role) setCurrentUserRole(user.role);
              setIsLoggedIn(true);
            }}
          />
        </View>
        <View style={{ height: insets.bottom, backgroundColor: colors.background }} />
      </View>
    );
  }

  // 3. Authenticated App with React Navigation Drawer & Native Stack
  const topBarColor = isDark ? '#080D1A' : '#FFFFFF';
  const bottomBarColor = isDark ? '#080D1A' : '#FAF8FF';

  return (
    <View style={[styles.container, { backgroundColor: topBarColor }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {/* Top Status Bar Inset Spacer - Seamlessly matches brand header */}
      <View style={{ height: insets.top, backgroundColor: topBarColor }} />

      {/* Main App Navigator View */}
      <View style={{ flex: 1, backgroundColor: bottomBarColor }}>
        <AppNavigator
          userRole={currentUserRole}
          userEmail={currentUserEmail}
          onLogout={() => {
            authApi.logout();
            setIsLoggedIn(false);
          }}
        />
      </View>

      {/* System Navigation Bar Inset Spacer - Protects buttons & content on older devices */}
      {insets.bottom > 0 && (
        <View style={{ height: insets.bottom, backgroundColor: bottomBarColor }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
});

export default App;

