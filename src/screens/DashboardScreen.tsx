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

interface DashboardProps {
  onNavigate: (screen: ScreenName) => void;
}

export const DashboardScreen: React.FC<DashboardProps> = ({ onNavigate }) => {
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

  // Fetch real counts from backend API
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
      {/* 1. Welcome Banner */}
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeTextWrap}>
          <Text style={styles.welcomeGreeting}>SHOWROOM OPERATIONAL 🟢</Text>
          <Text style={styles.welcomeTitle}>Defence Autolink CRM</Text>
          <Text style={styles.welcomeSub}>
            Multi-Brand Luxury Dealership Management
          </Text>
        </View>
      </View>

      {/* 2. Quick KPI Grid */}
      <Text style={styles.sectionHeader}>LIVE API METRICS</Text>
      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={colors.orange} />
          <Text style={styles.loadingText}>Fetching live counts from server...</Text>
        </View>
      ) : (
        <View style={styles.kpiGrid}>
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => onNavigate('leads')}
            activeOpacity={0.7}
          >
            <Text style={styles.kpiIcon}>🎯</Text>
            <Text style={styles.kpiVal}>{stats.leads}</Text>
            <Text style={styles.kpiLbl}>Customer Leads</Text>
            <Text style={styles.kpiTrend}>Live Inquiries</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => onNavigate('leads')}
            activeOpacity={0.7}
          >
            <Text style={styles.kpiIcon}>🔥</Text>
            <Text style={[styles.kpiVal, { color: colors.orange }]}>
              {stats.hotLeads}
            </Text>
            <Text style={styles.kpiLbl}>Hot Priorities</Text>
            <Text style={styles.kpiTrend}>Immediate attention</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => onNavigate('model')}
            activeOpacity={0.7}
          >
            <Text style={styles.kpiIcon}>🚗</Text>
            <Text style={[styles.kpiVal, { color: colors.green }]}>
              {stats.models}
            </Text>
            <Text style={styles.kpiLbl}>Registered Models</Text>
            <Text style={styles.kpiTrend}>{stats.variants} Variants</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => onNavigate('users')}
            activeOpacity={0.7}
          >
            <Text style={styles.kpiIcon}>👥</Text>
            <Text style={[styles.kpiVal, { color: '#3b82f6' }]}>
              {stats.users}
            </Text>
            <Text style={styles.kpiLbl}>Staff Users</Text>
            <Text style={styles.kpiTrend}>Active Team</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 3. Master Data Quick Jump Grid */}
      <Text style={styles.sectionHeader}>MASTER MODULES</Text>
      <View style={styles.mastersGrid}>
        <TouchableOpacity
          style={styles.masterCard}
          onPress={() => onNavigate('leads')}
          activeOpacity={0.7}
        >
          <Text style={styles.masterIcon}>🎯</Text>
          <Text style={styles.masterTitle}>Customer Leads</Text>
          <Text style={styles.masterCount}>
            {isLoading ? '...' : `${stats.leads} Leads`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.masterCard}
          onPress={() => onNavigate('lead-status')}
          activeOpacity={0.7}
        >
          <Text style={styles.masterIcon}>📋</Text>
          <Text style={styles.masterTitle}>Lead Status</Text>
          <Text style={styles.masterCount}>
            {isLoading ? '...' : `${stats.statuses} Statuses`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.masterCard}
          onPress={() => onNavigate('lead-source')}
          activeOpacity={0.7}
        >
          <Text style={styles.masterIcon}>📢</Text>
          <Text style={styles.masterTitle}>Lead Source</Text>
          <Text style={styles.masterCount}>
            {isLoading ? '...' : `${stats.sources} Sources`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.masterCard}
          onPress={() => onNavigate('brand')}
          activeOpacity={0.7}
        >
          <Text style={styles.masterIcon}>🏷️</Text>
          <Text style={styles.masterTitle}>Brand Master</Text>
          <Text style={styles.masterCount}>
            {isLoading ? '...' : `${stats.brands} Brands`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.masterCard}
          onPress={() => onNavigate('model')}
          activeOpacity={0.7}
        >
          <Text style={styles.masterIcon}>🚗</Text>
          <Text style={styles.masterTitle}>Model Master</Text>
          <Text style={styles.masterCount}>
            {isLoading ? '...' : `${stats.models} Models`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.masterCard}
          onPress={() => onNavigate('variant')}
          activeOpacity={0.7}
        >
          <Text style={styles.masterIcon}>⚡</Text>
          <Text style={styles.masterTitle}>Variant Master</Text>
          <Text style={styles.masterCount}>
            {isLoading ? '...' : `${stats.variants} Variants`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.masterCard}
          onPress={() => onNavigate('users')}
          activeOpacity={0.7}
        >
          <Text style={styles.masterIcon}>👥</Text>
          <Text style={styles.masterTitle}>User Master</Text>
          <Text style={styles.masterCount}>
            {isLoading ? '...' : `${stats.users} Staff`}
          </Text>
        </TouchableOpacity>
      </View>
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
  },
  welcomeCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 20,
  },
  welcomeTextWrap: {
    gap: 4,
  },
  welcomeGreeting: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.green,
    letterSpacing: 1,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
  welcomeSub: {
    fontSize: 12,
    color: colors.textMuted,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 2,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: colors.card,
    borderRadius: 10,
    marginBottom: 20,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 22,
  },
  kpiCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 4,
  },
  kpiIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  kpiVal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
  kpiLbl: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '500',
  },
  kpiTrend: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  mastersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  masterCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  masterIcon: {
    fontSize: 26,
    marginBottom: 2,
  },
  masterTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
  masterCount: {
    fontSize: 11,
    color: colors.orange,
    fontWeight: '600',
  },
});
