import React, { useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { colors } from './src/colors';
import { Drawer, ScreenName } from './src/Drawer';
import { Header } from './src/Header';
import { LoginScreen } from './src/LoginScreen';
import { SplashScreen } from './src/SplashScreen';
import { authApi } from './src/lib/apiServices';

// Master Screens
import { BrandScreen } from './src/screens/BrandScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { LeadsScreen } from './src/screens/LeadsScreen';
import { LeadSourceScreen } from './src/screens/LeadSourceScreen';
import { LeadStatusScreen } from './src/screens/LeadStatusScreen';
import { ModelScreen } from './src/screens/ModelScreen';
import { UserMasterScreen } from './src/screens/UserMasterScreen';
import { VariantScreen } from './src/screens/VariantScreen';

// Sales Executive Dedicated Screens
import { SalesExecutiveLeadsScreen } from './src/screens/SalesExecutiveLeadsScreen';
import { SalesExecutiveLeadDetailScreen } from './src/screens/SalesExecutiveLeadDetailScreen';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <MainApp />
    </SafeAreaProvider>
  );
}

function MainApp() {
  const insets = useSafeAreaInsets();

  // App Navigation States
  const [isSplashDone, setIsSplashDone] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeScreen, setActiveScreen] = useState<ScreenName>('my-leads');
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState('david.miller@carcrm.com');
  const [currentUserRole, setCurrentUserRole] = useState('Sales Executive');

  // Title Mapping for Header
  const getScreenTitle = (screen: ScreenName): string => {
    switch (screen) {
      case 'my-leads':
        return 'My Assigned Leads';
      case 'lead-detail':
        return 'Lead Details & Follow-Up';
      case 'dashboard':
        return 'Dealership Dashboard';
      case 'leads':
        return 'Customer Leads';
      case 'lead-status':
        return 'Lead Status Master';
      case 'lead-source':
        return 'Lead Source Master';
      case 'brand':
        return 'Brand Master';
      case 'model':
        return 'Model Master';
      case 'variant':
        return 'Variant Master';
      case 'users':
        return 'User Master';
      default:
        return 'CarCRM Portal';
    }
  };

  // 1. Initial Splash Screen
  if (!isSplashDone) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <SplashScreen onFinish={() => setIsSplashDone(true)} />
      </View>
    );
  }

  // 2. Login Screen
  if (!isLoggedIn) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <LoginScreen
          onBackToSplash={() => setIsSplashDone(false)}
          onLoginSuccess={(email, user) => {
            setCurrentUserEmail(email);
            if (user?.role) setCurrentUserRole(user.role);
            setIsLoggedIn(true);
            if (user?.role === 'Sales Executive') {
              setActiveScreen('my-leads');
            } else {
              setActiveScreen('dashboard');
            }
          }}
        />
      </View>
    );
  }

  // 3. Authenticated App with Side Drawer & Screens
  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Top Header */}
      <Header
        title={getScreenTitle(activeScreen)}
        onOpenDrawer={() => setIsDrawerOpen(true)}
      />

      {/* Side Navigation Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        activeScreen={activeScreen}
        onSelectScreen={(screen) => {
          setActiveScreen(screen);
        }}
        onClose={() => setIsDrawerOpen(false)}
        onLogout={() => {
          authApi.logout();
          setIsLoggedIn(false);
          setActiveScreen('my-leads');
        }}
        userEmail={currentUserEmail}
        userRole={currentUserRole}
      />

      {/* Screen View Router */}
      <View style={styles.screenContainer}>
        {activeScreen === 'my-leads' && (
          <SalesExecutiveLeadsScreen
            onSelectLead={(leadId) => {
              setSelectedLeadId(leadId);
              setActiveScreen('lead-detail');
            }}
          />
        )}
        {activeScreen === 'lead-detail' && selectedLeadId !== null && (
          <SalesExecutiveLeadDetailScreen
            leadId={selectedLeadId}
            onBack={() => setActiveScreen('my-leads')}
          />
        )}
        {activeScreen === 'dashboard' && (
          <DashboardScreen onNavigate={(screen) => setActiveScreen(screen)} />
        )}
        {activeScreen === 'leads' && <LeadsScreen />}
        {activeScreen === 'lead-status' && <LeadStatusScreen />}
        {activeScreen === 'lead-source' && <LeadSourceScreen />}
        {activeScreen === 'brand' && <BrandScreen />}
        {activeScreen === 'model' && <ModelScreen />}
        {activeScreen === 'variant' && <VariantScreen />}
        {activeScreen === 'users' && <UserMasterScreen />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenContainer: {
    flex: 1,
  },
});

export default App;
