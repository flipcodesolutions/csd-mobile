import React from 'react';
import { createDrawerNavigator, DrawerContentComponentProps } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

// Feature Screens
import { DashboardScreen } from '../../features/dashboard/DashboardScreen';
import { SalesExecutiveLeadsScreen } from '../../features/leads/SalesExecutiveLeadsScreen';
import { SalesExecutiveLeadDetailScreen } from '../../features/leads/SalesExecutiveLeadDetailScreen';
import { LeadsScreen } from '../../features/leads/LeadsScreen';
import { BrandScreen } from '../../features/masters/BrandScreen';
import { ModelScreen } from '../../features/masters/ModelScreen';
import { VariantScreen } from '../../features/masters/VariantScreen';
import { LeadStatusScreen } from '../../features/masters/LeadStatusScreen';
import { LeadSourceScreen } from '../../features/masters/LeadSourceScreen';
import { UserMasterScreen } from '../../features/masters/UserMasterScreen';
import { FollowUpScreen } from '../../features/followups/FollowUpScreen';

import { useTheme } from '../theme/ThemeContext';
import { CustomDrawerContent } from './CustomDrawerContent';
import { Header } from './Header';

export type RootStackParamList = {
  MainDrawer: undefined;
  LeadDetail: { leadId: number };
};

export type DrawerParamList = {
  dashboard: undefined;
  'my-leads': undefined;
  leads: undefined;
  'follow-ups': undefined;
  brand: undefined;
  model: undefined;
  variant: undefined;
  'lead-status': undefined;
  'lead-source': undefined;
  users: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

interface AppNavigatorProps {
  userRole?: string;
  userEmail?: string;
  onLogout: () => void;
}

const SCREEN_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  'my-leads': 'My Assigned Leads',
  leads: 'Customer Leads',
  'follow-ups': 'Follow-Up & Call Desk',
  brand: 'Brand Master',
  model: 'Model Master',
  variant: 'Variant & Pricing',
  'lead-status': 'Lead Status Master',
  'lead-source': 'Lead Source Master',
  users: 'User & Team Master',
};

function DrawerNavigator({ userRole, userEmail, onLogout }: AppNavigatorProps) {
  const { isDark } = useTheme();
  const initialRoute = userRole === 'Sales Executive' ? 'my-leads' : 'leads';

  const getDashboardTitle = () => {
    switch (userRole) {
      case 'Sales Executive':
        return 'Sales Executive Desk';
      case 'Sales Manager':
        return 'Sales Manager Desk';
      case 'Receptionist':
        return 'Reception Desk';
      case 'Accountant':
        return 'Finance & Accounts';
      default:
        return 'Dealership Dashboard';
    }
  };

  return (
    <Drawer.Navigator
      initialRouteName={initialRoute}
      drawerContent={(props: DrawerContentComponentProps) => (
        <CustomDrawerContent
          {...props}
          userRole={userRole}
          userEmail={userEmail}
          onLogout={onLogout}
        />
      )}
      screenOptions={({ route, navigation }) => {
        const title =
          route.name === 'dashboard'
            ? getDashboardTitle()
            : SCREEN_TITLES[route.name] || 'CarCRM';

        return {
          headerShown: true,
          header: () => (
            <Header
              title={title}
              onOpenDrawer={() => navigation.openDrawer()}
              userRole={userRole}
            />
          ),
          drawerType: 'front',
          swipeEdgeWidth: 80,
          drawerStyle: {
            width: 300,
            backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
          },
        };
      }}
    >
      <Drawer.Screen name="dashboard">
        {({ navigation }) => (
          <DashboardScreen
            userRole={userRole || 'Sales Executive'}
            onNavigate={(screen) => (navigation as any).navigate(screen)}
          />
        )}
      </Drawer.Screen>

      <Drawer.Screen name="my-leads">
        {({ navigation }) => (
          <SalesExecutiveLeadsScreen
            onSelectLead={(leadId) => {
              (navigation.getParent() as any)?.navigate('LeadDetail', { leadId });
            }}
          />
        )}
      </Drawer.Screen>

      <Drawer.Screen name="leads">
        {({ navigation }) => (
          <LeadsScreen onOpenDrawer={() => (navigation as any).openDrawer()} />
        )}
      </Drawer.Screen>

      <Drawer.Screen name="follow-ups">
        {({ navigation }) => (
          <FollowUpScreen
            onOpenDrawer={() => (navigation as any).openDrawer()}
          />
        )}
      </Drawer.Screen>

      <Drawer.Screen name="brand" component={BrandScreen} />
      <Drawer.Screen name="model" component={ModelScreen} />
      <Drawer.Screen name="variant" component={VariantScreen} />
      <Drawer.Screen name="lead-status" component={LeadStatusScreen} />
      <Drawer.Screen name="lead-source" component={LeadSourceScreen} />
      <Drawer.Screen name="users" component={UserMasterScreen} />
    </Drawer.Navigator>
  );
}

export function AppNavigator({ userRole, userEmail, onLogout }: AppNavigatorProps) {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="MainDrawer">
          {() => (
            <DrawerNavigator
              userRole={userRole}
              userEmail={userEmail}
              onLogout={onLogout}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="LeadDetail"
          options={({ navigation }) => ({
            headerShown: true,
            header: () => (
              <Header
                title="Lead Details & 360°"
                showBackButton
                onBack={() => navigation.goBack()}
                userRole={userRole}
              />
            ),
          })}
        >
          {({ route, navigation }) => (
            <SalesExecutiveLeadDetailScreen
              leadId={route.params?.leadId}
              onBack={() => navigation.goBack()}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
