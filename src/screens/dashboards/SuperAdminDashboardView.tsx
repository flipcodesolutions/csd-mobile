import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../colors';
import { ScreenName } from '../../Drawer';

interface Props {
  stats: {
    leads: number;
    hotLeads: number;
    brands: number;
    models: number;
    variants: number;
    users: number;
    sources: number;
    statuses: number;
  };
  isLoading: boolean;
  onNavigate: (screen: ScreenName) => void;
}

export const SuperAdminDashboardView: React.FC<Props> = ({ stats, isLoading, onNavigate }) => {
  return (
    <View style={styles.container}>
      {/* 1. Executive Banner */}
      <View style={styles.bannerCard}>
        <View style={styles.bannerHeaderRow}>
          <Text style={styles.bannerBadge}>👑 SUPER ADMIN TERMINAL</Text>
          <Text style={styles.liveIndicator}>🟢 Live System</Text>
        </View>
        <Text style={styles.bannerTitle}>Dealership Executive Control</Text>
        <Text style={styles.bannerSubtitle}>
          Global Dealership Performance • ₹12.45 Cr Sales Volume
        </Text>
      </View>

      {/* 2. Key Live Metrics Grid */}
      <Text style={styles.sectionTitle}>EXECUTIVE KPI METRICS</Text>
      <View style={styles.kpiGrid}>
        <TouchableOpacity
          style={styles.kpiCard}
          onPress={() => onNavigate('leads')}
          activeOpacity={0.7}
        >
          <Text style={styles.kpiIcon}>🎯</Text>
          <Text style={styles.kpiVal}>{isLoading ? '...' : stats.leads}</Text>
          <Text style={styles.kpiLbl}>Total Inquiries</Text>
          <Text style={styles.kpiTrend}>Live Customer Inflow</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.kpiCard}
          onPress={() => onNavigate('leads')}
          activeOpacity={0.7}
        >
          <Text style={styles.kpiIcon}>🔥</Text>
          <Text style={[styles.kpiVal, { color: colors.orange }]}>
            {isLoading ? '...' : stats.hotLeads}
          </Text>
          <Text style={styles.kpiLbl}>Hot Inquiries</Text>
          <Text style={styles.kpiTrend}>High Probability</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.kpiCard}
          onPress={() => onNavigate('model')}
          activeOpacity={0.7}
        >
          <Text style={styles.kpiIcon}>🚗</Text>
          <Text style={[styles.kpiVal, { color: colors.green }]}>
            {isLoading ? '...' : stats.models}
          </Text>
          <Text style={styles.kpiLbl}>Registered Models</Text>
          <Text style={styles.kpiTrend}>{stats.variants} Variants Active</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.kpiCard}
          onPress={() => onNavigate('users')}
          activeOpacity={0.7}
        >
          <Text style={styles.kpiIcon}>👥</Text>
          <Text style={[styles.kpiVal, { color: '#3b82f6' }]}>
            {isLoading ? '...' : stats.users}
          </Text>
          <Text style={styles.kpiLbl}>Team Users</Text>
          <Text style={styles.kpiTrend}>5 Roles Configured</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Dealership Fleet Master Jump */}
      <Text style={styles.sectionTitle}>SYSTEM MASTERS & CATALOG</Text>
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
            {isLoading ? '...' : `${stats.statuses} Stages`}
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
            {isLoading ? '...' : `${stats.sources} Channels`}
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
          <Text style={styles.masterTitle}>Variant & Prices</Text>
          <Text style={styles.masterCount}>
            {isLoading ? '...' : `${stats.variants} SKUs`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.masterCard}
          onPress={() => onNavigate('users')}
          activeOpacity={0.7}
        >
          <Text style={styles.masterIcon}>👥</Text>
          <Text style={styles.masterTitle}>Users & Roles</Text>
          <Text style={styles.masterCount}>
            {isLoading ? '...' : `${stats.users} Staff`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  bannerCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 6,
  },
  bannerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.orange,
    letterSpacing: 0.5,
  },
  liveIndicator: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.green,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textMuted,
    letterSpacing: 1,
    marginLeft: 2,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 3,
  },
  kpiIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  kpiVal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  kpiLbl: {
    fontSize: 12,
    color: colors.textMuted,
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
    fontSize: 24,
    marginBottom: 2,
  },
  masterTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  masterCount: {
    fontSize: 11,
    color: colors.orange,
    fontWeight: '600',
  },
});
