import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../colors';
import { ScreenName } from '../../Drawer';

interface Props {
  onNavigate: (screen: ScreenName) => void;
}

export const ReceptionistDashboardView: React.FC<Props> = ({ onNavigate }) => {
  return (
    <View style={styles.container}>
      {/* 1. Reception Desk Banner */}
      <View style={styles.bannerCard}>
        <View style={styles.bannerHeaderRow}>
          <Text style={styles.bannerBadge}>🛎️ FRONT DESK & CONCIERGE</Text>
          <Text style={styles.floorStatus}>🟢 Showroom Active</Text>
        </View>
        <Text style={styles.bannerTitle}>Visitor Log & Token Desk</Text>
        <Text style={styles.bannerSubtitle}>
          24 Walk-Ins Registered Today • 4 Sales Reps Available on Floor
        </Text>
      </View>

      {/* 2. Key Front Desk KPIs */}
      <Text style={styles.sectionTitle}>SHOWROOM FOOTFALL STATS</Text>
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiIcon}>🚪</Text>
          <Text style={styles.kpiVal}>24</Text>
          <Text style={styles.kpiLbl}>Today&apos;s Walk-Ins</Text>
          <Text style={styles.kpiTrend}>+6 vs Yesterday</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiIcon}>👥</Text>
          <Text style={[styles.kpiVal, { color: colors.orange }]}>5</Text>
          <Text style={styles.kpiLbl}>Active on Floor</Text>
          <Text style={styles.kpiTrend}>In Showroom Lounge</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiIcon}>🟢</Text>
          <Text style={[styles.kpiVal, { color: colors.green }]}>4 Reps</Text>
          <Text style={styles.kpiLbl}>Available Free</Text>
          <Text style={styles.kpiTrend}>Instant Assignment</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiIcon}>⏱️</Text>
          <Text style={[styles.kpiVal, { color: '#3b82f6' }]}>4.2m</Text>
          <Text style={styles.kpiLbl}>Avg Wait Time</Text>
          <Text style={styles.kpiTrend}>Target &lt; 5 mins</Text>
        </View>
      </View>

      {/* 3. Live Visitor Token Queue */}
      <Text style={styles.sectionTitle}>LIVE VISITOR QUEUE</Text>
      <View style={styles.visitorList}>
        <View style={styles.visitorCard}>
          <View style={styles.visitorHeaderRow}>
            <View style={styles.tokenBox}>
              <Text style={styles.tokenText}>#WLK-042</Text>
            </View>
            <View style={styles.statusBadgeWarning}>
              <Text style={styles.statusBadgeTextWarning}>In Discussion</Text>
            </View>
          </View>
          <Text style={styles.visitorName}>Harshavardhan Rao</Text>
          <Text style={styles.visitorSub}>+91 98450 66771 • Tata Safari Dark Edition</Text>
          <View style={styles.repFooterRow}>
            <Text style={styles.assignedRepText}>Assigned: Vikram Singh</Text>
            <Text style={styles.timeText}>11:15 AM (10m ago)</Text>
          </View>
        </View>

        <View style={styles.visitorCard}>
          <View style={styles.visitorHeaderRow}>
            <View style={styles.tokenBox}>
              <Text style={styles.tokenText}>#WLK-043</Text>
            </View>
            <View style={styles.statusBadgeInfo}>
              <Text style={styles.statusBadgeTextInfo}>Waiting in Lounge</Text>
            </View>
          </View>
          <Text style={styles.visitorName}>Meera Krishnan</Text>
          <Text style={styles.visitorSub}>+91 97123 44556 • Maruti Grand Vitara</Text>
          <View style={styles.repFooterRow}>
            <Text style={styles.assignedRepText}>Assigned: Rahul Verma</Text>
            <Text style={styles.timeText}>11:22 AM (3m ago)</Text>
          </View>
        </View>
      </View>

      {/* 4. Sales Rep Floor Availability Matrix */}
      <Text style={styles.sectionTitle}>REP FLOOR AVAILABILITY</Text>
      <View style={styles.repStatusGrid}>
        <View style={styles.repStatusChip}>
          <Text style={styles.repStatusDot}>🟢</Text>
          <Text style={styles.repStatusName}>Rahul Verma (Floor Free)</Text>
        </View>
        <View style={styles.repStatusChip}>
          <Text style={styles.repStatusDot}>🟢</Text>
          <Text style={styles.repStatusName}>Sneha Joshi (Floor Free)</Text>
        </View>
        <View style={styles.repStatusChip}>
          <Text style={styles.repStatusDot}>🟠</Text>
          <Text style={styles.repStatusName}>Vikram Singh (In Pod 1)</Text>
        </View>
        <View style={styles.repStatusChip}>
          <Text style={styles.repStatusDot}>🔵</Text>
          <Text style={styles.repStatusName}>David Miller (On Test Drive)</Text>
        </View>
      </View>

      {/* 5. Fast Action to Register */}
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() => onNavigate('leads')}
        activeOpacity={0.8}
      >
        <Text style={styles.actionBtnIcon}>🎯</Text>
        <Text style={styles.actionBtnText}>View Customer Leads Master</Text>
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
  floorStatus: {
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
  visitorList: {
    gap: 10,
  },
  visitorCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 6,
  },
  visitorHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenBox: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tokenText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textPrimary,
    fontFamily: 'monospace',
  },
  statusBadgeWarning: {
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    borderWidth: 1,
    borderColor: colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeTextWarning: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.warning,
  },
  statusBadgeInfo: {
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    borderWidth: 1,
    borderColor: colors.info,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeTextInfo: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.info,
  },
  visitorName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  visitorSub: {
    fontSize: 11,
    color: colors.orange,
    fontWeight: '500',
  },
  repFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  assignedRepText: {
    fontSize: 11,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  repStatusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  repStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 6,
    flex: 1,
    minWidth: '46%',
  },
  repStatusDot: {
    fontSize: 10,
  },
  repStatusName: {
    fontSize: 11,
    color: colors.textPrimary,
    fontWeight: '500',
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
