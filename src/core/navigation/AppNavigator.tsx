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
import { UpdatePriceScreen } from '../../features/masters/UpdatePriceScreen';
import { ExpenseMasterScreen } from '../../features/masters/ExpenseMasterScreen';
import { LeadStatusScreen } from '../../features/masters/LeadStatusScreen';
import { LeadSourceScreen } from '../../features/masters/LeadSourceScreen';
import { UserMasterScreen } from '../../features/masters/UserMasterScreen';
import { FollowUpScreen } from '../../features/followups/FollowUpScreen';
import { SendQuotationScreen } from '../../features/quotations/SendQuotationScreen';
import { CreateLeadScreen } from '../../features/leads/CreateLeadScreen';
import { DealsScreen } from '../../features/deals/DealsScreen';
import { InvoiceScreen } from '../../features/invoices/InvoiceScreen';
import { PendingInsuranceScreen } from '../../features/insurance/PendingInsuranceScreen';
import { InsuranceRemindersScreen } from '../../features/insurance/InsuranceRemindersScreen';
import { InsuranceRecordsScreen } from '../../features/insurance/InsuranceRecordsScreen';
import { PlaceholderScreen } from '../../shared/PlaceholderScreen';
import {
  BarChart2,
  Briefcase,
  Clock,
  CreditCard,
  HelpCircle,
  Settings,
  User,
} from 'lucide-react-native';

import { useTheme } from '../theme/ThemeContext';
import { CustomDrawerContent } from './CustomDrawerContent';
import { Header } from './Header';

export type RootStackParamList = {
  MainDrawer: undefined;
  LeadDetail: { leadId: number };
  CreateLead: undefined;
};

export type DrawerParamList = {
  dashboard: undefined;
  'my-leads': undefined;
  leads: undefined;
  'follow-ups': undefined;
  'send-quotation': { leadId?: number } | undefined;
  deals: undefined;
  'generate-invoice': undefined;
  'pending-insurance': undefined;
  'insurance-reminders': undefined;
  'insurance-records': undefined;
  users: undefined;
  'reports-analytics': undefined;
  'expense-details': undefined;
  brand: undefined;
  model: undefined;
  variant: undefined;
  'update-price': undefined;
  'insurance-companies': undefined;
  'expense-master': undefined;
  'lead-status': undefined;
  'lead-source': undefined;
  'activity-logs': undefined;
  settings: undefined;
  profile: undefined;
  'help-support': undefined;
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
  'follow-ups': 'Follow-Ups',
  'send-quotation': 'Send Quotation',
  deals: 'Deals & Bookings',
  'generate-invoice': 'Generate Invoice',
  'pending-insurance': 'Pending Insurance',
  'insurance-reminders': 'Insurance Reminders',
  'insurance-records': 'Insurance Records',
  users: 'Users & Team',
  'reports-analytics': 'Reports & Analytics',
  'expense-details': 'Expense Details',
  brand: 'Brands',
  model: 'Models',
  variant: 'Variants',
  'update-price': 'Update Price',
  'insurance-companies': 'Insurance Companies',
  'expense-master': 'Expense Master',
  'lead-status': 'Lead Status Master',
  'lead-source': 'Lead Sources',
  'activity-logs': 'Activity Logs',
  settings: 'Settings',
  profile: 'My Profile',
  'help-support': 'Help & Support',
};

function DrawerNavigator({ userRole, userEmail, onLogout }: AppNavigatorProps) {
  const { isDark } = useTheme();
  // Task 1: When admin (or Super Admin) logs in, default screen MUST be 'dashboard'
  const isSuperAdminOrAdmin =
    !userRole ||
    userRole.toLowerCase().includes('admin') ||
    userRole === 'Super Admin' ||
    userRole === 'Admin';

  const initialRoute: keyof DrawerParamList = isSuperAdminOrAdmin
    ? 'dashboard'
    : userRole === 'Sales Executive'
      ? 'my-leads'
      : 'dashboard';

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
        return 'Business Overview';
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
            userRole={userRole || 'Super Admin'}
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
          <LeadsScreen navigation={navigation} onOpenDrawer={() => (navigation as any).openDrawer()} />
        )}
      </Drawer.Screen>

      <Drawer.Screen name="follow-ups">
        {({ navigation }) => (
          <FollowUpScreen
            navigation={navigation}
            onOpenDrawer={() => (navigation as any).openDrawer()}
            onNavigateToQuotation={(leadId) => {
              (navigation as any).navigate('send-quotation', { leadId });
            }}
          />
        )}
      </Drawer.Screen>

      <Drawer.Screen name="send-quotation">
        {({ navigation, route }) => (
          <SendQuotationScreen
            navigation={navigation}
            route={route}
            onOpenDrawer={() => (navigation as any).openDrawer()}
          />
        )}
      </Drawer.Screen>

      <Drawer.Screen name="deals" component={DealsScreen} />
      <Drawer.Screen name="generate-invoice" component={InvoiceScreen} />
      <Drawer.Screen name="pending-insurance" component={PendingInsuranceScreen} />
      <Drawer.Screen name="insurance-reminders" component={InsuranceRemindersScreen} />
      <Drawer.Screen name="insurance-records" component={InsuranceRecordsScreen} />

      <Drawer.Screen name="brand">
        {({ navigation }) => (
          <BrandScreen
            onOpenDrawer={() => (navigation as any).openDrawer()}
          />
        )}
      </Drawer.Screen>
      <Drawer.Screen name="model">
        {({ navigation }) => (
          <ModelScreen
            onOpenDrawer={() => (navigation as any).openDrawer()}
          />
        )}
      </Drawer.Screen>
      <Drawer.Screen name="variant">
        {({ navigation }) => (
          <VariantScreen
            onOpenDrawer={() => (navigation as any).openDrawer()}
          />
        )}
      </Drawer.Screen>
      <Drawer.Screen name="update-price">
        {({ navigation }) => (
          <UpdatePriceScreen
            onOpenDrawer={() => (navigation as any).openDrawer()}
            onNavigateQuotation={() => (navigation as any).navigate('leads')}
          />
        )}
      </Drawer.Screen>
      <Drawer.Screen name="expense-master">
        {({ navigation }) => (
          <ExpenseMasterScreen
            onOpenDrawer={() => (navigation as any).openDrawer()}
          />
        )}
      </Drawer.Screen>
      <Drawer.Screen name="lead-status" component={LeadStatusScreen} />
      <Drawer.Screen name="lead-source">
        {({ navigation }) => (
          <LeadSourceScreen
            onOpenDrawer={() => (navigation as any).openDrawer()}
          />
        )}
      </Drawer.Screen>
      <Drawer.Screen name="users" component={UserMasterScreen} />

      {/* Web Reference Parity - Placeholder Screens for Modules Under Mobile Development */}
      <Drawer.Screen name="reports-analytics">
        {({ navigation }) => (
          <PlaceholderScreen
            title="Reports & Analytics"
            category="BUSINESS INTELLIGENCE"
            icon={BarChart2}
            description="Comprehensive business reports, sales KPIs, executive performance, and conversion analytics."
            onOpenDrawer={() => (navigation as any).openDrawer()}
            onNavigateHome={() => (navigation as any).navigate('dashboard')}
          />
        )}
      </Drawer.Screen>

      <Drawer.Screen name="expense-details">
        {({ navigation }) => (
          <PlaceholderScreen
            title="Expense Details"
            category="FINANCE & BILLING"
            icon={CreditCard}
            description="Track showroom overheads, operational expenses, and detailed financial vouchers."
            onOpenDrawer={() => (navigation as any).openDrawer()}
            onNavigateHome={() => (navigation as any).navigate('dashboard')}
          />
        )}
      </Drawer.Screen>

      <Drawer.Screen name="insurance-companies">
        {({ navigation }) => (
          <PlaceholderScreen
            title="Insurance Companies"
            category="INSURANCE MASTER"
            icon={Briefcase}
            description="Manage tie-ups, commission rates, and partner insurance underwriters."
            onOpenDrawer={() => (navigation as any).openDrawer()}
            onNavigateHome={() => (navigation as any).navigate('dashboard')}
          />
        )}
      </Drawer.Screen>

      <Drawer.Screen name="activity-logs">
        {({ navigation }) => (
          <PlaceholderScreen
            title="Activity Logs"
            category="AUDIT & SECURITY"
            icon={Clock}
            description="Full audit trail of user logins, deal modifications, price updates, and record changes."
            onOpenDrawer={() => (navigation as any).openDrawer()}
            onNavigateHome={() => (navigation as any).navigate('dashboard')}
          />
        )}
      </Drawer.Screen>

      <Drawer.Screen name="settings">
        {({ navigation }) => (
          <PlaceholderScreen
            title="Settings"
            category="SYSTEM CONFIGURATION"
            icon={Settings}
            description="Configure portal parameters, notifications, SMS/WhatsApp gateways, and system defaults."
            onOpenDrawer={() => (navigation as any).openDrawer()}
            onNavigateHome={() => (navigation as any).navigate('dashboard')}
          />
        )}
      </Drawer.Screen>

      <Drawer.Screen name="profile">
        {({ navigation }) => (
          <PlaceholderScreen
            title="My Profile"
            category="USER ACCOUNT"
            icon={User}
            description="Manage your account profile details, change password, and notification preferences."
            onOpenDrawer={() => (navigation as any).openDrawer()}
            onNavigateHome={() => (navigation as any).navigate('dashboard')}
          />
        )}
      </Drawer.Screen>

      <Drawer.Screen name="help-support">
        {({ navigation }) => (
          <PlaceholderScreen
            title="Help & Support"
            category="HELP DESK"
            icon={HelpCircle}
            description="Get assistance, access documentation, or reach out to technical support for portal issues."
            onOpenDrawer={() => (navigation as any).openDrawer()}
            onNavigateHome={() => (navigation as any).navigate('dashboard')}
          />
        )}
      </Drawer.Screen>
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
              key={`drawer-${userRole || 'admin'}`}
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
        <Stack.Screen
          name="CreateLead"
          options={{ headerShown: false }}
        >
          {({ route, navigation }) => (
            <CreateLeadScreen
              route={route}
              navigation={navigation}
              onBack={() => navigation.goBack()}
              onSuccess={() => navigation.goBack()}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
