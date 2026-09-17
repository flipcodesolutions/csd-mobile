import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../colors';
import { ScreenName } from '../Drawer';
import {
  brandApi,
  leadApi,
  leadSourceApi,
  leadStatusApi,
  modelApi,
  userApi,
  variantApi,
} from '../lib/apiServices';

// 5 Role Views
import { SuperAdminDashboardView } from './dashboards/SuperAdminDashboardView';
import { SalesManagerDashboardView } from './dashboards/SalesManagerDashboardView';
import { SalesExecutiveDashboardView } from './dashboards/SalesExecutiveDashboardView';
import { ReceptionistDashboardView } from './dashboards/ReceptionistDashboardView';
import { AccountantDashboardView } from './dashboards/AccountantDashboardView';

interface DashboardProps {
  onNavigate: (screen: ScreenName) => void;
  userRole?: string;
}

const ROLES = [
  { id: 'Super Admin', label: '👑 Super Admin' },
  { id: 'Sales Manager', label: '👔 Manager' },
  { id: 'Sales Executive', label: '💼 Sales Exec' },
  { id: 'Receptionist', label: '🛎️ Reception' },
  { id: 'Accountant', label: '📊 Accountant' },
];

export const DashboardScreen: React.FC<DashboardProps> = ({
  onNavigate,
  userRole = 'Super Admin',
}) => {
  const [selectedRole, setSelectedRole] = useState(userRole || 'Super Admin');

  // Update selectedRole when userRole prop changes
  useEffect(() => {
    if (userRole) {
      setSelectedRole(userRole);
    }
  }, [userRole]);

  const [stats, setStats] = useState({
    leads: 0,
    hotLeads: 0,
    brands: 0,
    models: 0,
    variants: 0,
    users: 0,
    sources: 0,
    statuses: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch live counts from backend API
  const fetchDashboardStats = async (isPullRefresh = false) => {
    if (isPullRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const [leadsRes, brandsRes, modelsRes, variantsRes, usersRes, sourcesRes, statusesRes] =
        await Promise.all([
          leadApi.getAll().catch(() => null),
          brandApi.getAll().catch(() => null),
          modelApi.getAll().catch(() => null),
          variantApi.getAll().catch(() => null),
          userApi.getAll().catch(() => null),
          leadSourceApi.getAll().catch(() => null),
          leadStatusApi.getAll().catch(() => null),
        ]);

      const getList = (res: any) =>
        res && res.status && Array.isArray(res.data)
          ? res.data
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];

      const leadsList = getList(leadsRes);
      const brandsList = getList(brandsRes);
      const modelsList = getList(modelsRes);
      const variantsList = getList(variantsRes);
      const usersList = getList(usersRes);
      const sourcesList = getList(sourcesRes);
      const statusesList = getList(statusesRes);
      const hotCount = leadsList.filter((l: any) => l.priority === 'Hot').length;

      setStats({
        leads: leadsList.length,
        hotLeads: hotCount,
        brands: brandsList.length,
        models: modelsList.length,
        variants: variantsList.length,
        users: usersList.length,
        sources: sourcesList.length,
        statuses: statusesList.length,
      });
    } catch (e) {
      console.log('Error fetching dashboard stats from API:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => fetchDashboardStats(true)}
          tintColor={colors.orange}
        />
      }
    >
      {/* Role Switcher Toolbar */}
      <View style={styles.roleBar}>
        <Text style={styles.roleBarTitle}>ROLE DASHBOARD VIEW:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rolePillScroll}>
          {ROLES.map((r) => {
            const isActive = selectedRole === r.id;
            return (
              <TouchableOpacity
                key={r.id}
                style={[styles.rolePill, isActive && styles.rolePillActive]}
                onPress={() => setSelectedRole(r.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.rolePillText, isActive && styles.rolePillTextActive]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Dynamic Role Dashboard Body */}
      {selectedRole === 'Super Admin' && (
        <SuperAdminDashboardView
          stats={stats}
          isLoading={isLoading}
          onNavigate={onNavigate}
        />
      )}

      {selectedRole === 'Sales Manager' && (
        <SalesManagerDashboardView onNavigate={onNavigate} />
      )}

      {selectedRole === 'Sales Executive' && (
        <SalesExecutiveDashboardView onNavigate={onNavigate} />
      )}

      {selectedRole === 'Receptionist' && (
        <ReceptionistDashboardView onNavigate={onNavigate} />
      )}

      {selectedRole === 'Accountant' && (
        <AccountantDashboardView onNavigate={onNavigate} />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  roleBar: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    gap: 8,
  },
  roleBarTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  rolePillScroll: {
    gap: 6,
  },
  rolePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rolePillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryHover,
  },
  rolePillText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  rolePillTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
