import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../colors';
import { ScreenName } from '../../Drawer';

interface Props {
  onNavigate: (screen: ScreenName) => void;
}

export const SalesExecutiveDashboardView: React.FC<Props> = ({ onNavigate }) => {
  return (
    <View style={styles.container}>
      {/* 1. Personal Sales Desk Banner */}
      <View style={styles.bannerCard}>
        <View style={styles.bannerHeaderRow}>
          <Text style={styles.bannerBadge}>💼 SALES EXECUTIVE DESK</Text>
          <Text style={styles.quotaBadge}>🔥 14 / 15 Units Booked</Text>
        </View>
        <Text style={styles.bannerTitle}>My Conversion & Call Desk</Text>
        <Text style={styles.bannerSubtitle}>
          28 Active Inquiries • ₹68,500 Monthly Commission Earned
        </Text>
      </View>

      {/* 2. Personal Key KPIs */}
      <Text style={styles.sectionTitle}>MY PERFORMANCE STATS</Text>
      <View style={styles.kpiGrid}>
        <TouchableOpacity
          style={styles.kpiCard}
          onPress={() => onNavigate('my-leads')}
          activeOpacity={0.7}
        >
          <Text style={styles.kpiIcon}>💼</Text>
          <Text style={styles.kpiVal}>28</Text>
          <Text style={styles.kpiLbl}>My Leads</Text>
          <Text style={styles.kpiTrend}>8 Hot Priorities</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.kpiCard}
          onPress={() => onNavigate('my-leads')}
          activeOpacity={0.7}
        >
          <Text style={styles.kpiIcon}>📞</Text>
          <Text style={[styles.kpiVal, { color: colors.orange }]}>9 Calls</Text>
          <Text style={styles.kpiLbl}>Due Today</Text>
          <Text style={styles.kpiTrend}>1 Urgent Overdue</Text>
        </TouchableOpacity>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiIcon}>🚗</Text>
          <Text style={[styles.kpiVal, { color: colors.green }]}>6 Slots</Text>
          <Text style={styles.kpiLbl}>Test Drives</Text>
          <Text style={styles.kpiTrend}>2 Scheduled Today</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiIcon}>💰</Text>
          <Text style={[styles.kpiVal, { color: '#3b82f6' }]}>₹68.5k</Text>
          <Text style={styles.kpiLbl}>Commission</Text>
          <Text style={styles.kpiTrend}>93.3% Quota Met</Text>
        </View>
      </View>

      {/* 3. Today's Urgent Calls */}
      <Text style={styles.sectionTitle}>TODAY&apos;S PRIORITY CALL LIST</Text>
      <View style={styles.callsList}>
        <TouchableOpacity
          style={styles.callCard}
          onPress={() => onNavigate('my-leads')}
          activeOpacity={0.7}
        >
          <View style={styles.callHeaderRow}>
            <View>
              <Text style={styles.customerName}>Rajesh Verma</Text>
              <Text style={styles.customerPhone}>+91 98231 44520</Text>
            </View>
            <View style={styles.hotBadge}>
              <Text style={styles.hotBadgeText}>🔥 Hot</Text>
            </View>
          </View>
          <Text style={styles.vehicleText}>Tata Safari Adventure Plus Dark AT</Text>
          <Text style={styles.callNote}>&quot;Inquired about Diwali delivery and trade-in value&quot;</Text>
          <View style={styles.callFooterRow}>
            <Text style={styles.dueTimeText}>Due: 11:30 AM (Overdue)</Text>
            <Text style={styles.actionPrompt}>Tap to open lead ➔</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.callCard}
          onPress={() => onNavigate('my-leads')}
          activeOpacity={0.7}
        >
          <View style={styles.callHeaderRow}>
            <View>
              <Text style={styles.customerName}>Priya Menon</Text>
              <Text style={styles.customerPhone}>+91 97410 88231</Text>
            </View>
            <View style={styles.warmBadge}>
              <Text style={styles.warmBadgeText}>☀️ Warm</Text>
            </View>
          </View>
          <Text style={styles.vehicleText}>Hyundai Creta SX (O) Turbo Petrol</Text>
          <Text style={styles.callNote}>&quot;TD done on Saturday. Follow up on loan quote&quot;</Text>
          <View style={styles.callFooterRow}>
            <Text style={styles.dueTimeText}>Due: 02:00 PM Today</Text>
            <Text style={styles.actionPrompt}>Tap to open lead ➔</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 4. Fast Action Buttons */}
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() => onNavigate('my-leads')}
        activeOpacity={0.8}
      >
        <Text style={styles.actionBtnIcon}>💼</Text>
        <Text style={styles.actionBtnText}>View All My Assigned Leads</Text>
      </TouchableOpacity>
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
  quotaBadge: {
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
  callsList: {
    gap: 10,
  },
  callCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 6,
  },
  callHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  customerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  customerPhone: {
    fontSize: 11,
    color: colors.textMuted,
  },
  hotBadge: {
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  hotBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.danger,
  },
  warmBadge: {
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  warmBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.warning,
  },
  vehicleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.orange,
  },
  callNote: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  callFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dueTimeText: {
    fontSize: 10,
    color: colors.orange,
    fontWeight: '600',
  },
  actionPrompt: {
    fontSize: 10,
    color: colors.secondary,
    fontWeight: 'bold',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primaryHover,
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
  },
  actionBtnIcon: {
    fontSize: 16,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
