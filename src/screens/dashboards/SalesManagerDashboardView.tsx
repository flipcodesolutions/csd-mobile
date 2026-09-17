import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../colors';
import { ScreenName } from '../../Drawer';

interface Props {
  onNavigate: (screen: ScreenName) => void;
}

export const SalesManagerDashboardView: React.FC<Props> = ({ onNavigate }) => {
  return (
    <View style={styles.container}>
      {/* 1. Manager Banner */}
      <View style={styles.bannerCard}>
        <View style={styles.bannerHeaderRow}>
          <Text style={styles.bannerBadge}>👔 SALES MANAGER DESK</Text>
          <Text style={styles.targetBadge}>🎯 84.5% Target Met</Text>
        </View>
        <Text style={styles.bannerTitle}>Team Leadership & Quota</Text>
        <Text style={styles.bannerSubtitle}>
          54 Units Closed this Month • ₹18.6 Cr Pipeline Value
        </Text>
      </View>

      {/* 2. Team KPI Grid */}
      <Text style={styles.sectionTitle}>TEAM PERFORMANCE METRICS</Text>
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiIcon}>💼</Text>
          <Text style={styles.kpiVal}>264</Text>
          <Text style={styles.kpiLbl}>Active Inquiries</Text>
          <Text style={styles.kpiTrend}>Team Total</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiIcon}>🎯</Text>
          <Text style={[styles.kpiVal, { color: colors.green }]}>54 / 64</Text>
          <Text style={styles.kpiLbl}>Units Booked</Text>
          <Text style={styles.kpiTrend}>84.5% of Quota</Text>
        </View>

        <TouchableOpacity
          style={styles.kpiCard}
          onPress={() => onNavigate('leads')}
          activeOpacity={0.7}
        >
          <Text style={styles.kpiIcon}>⚠️</Text>
          <Text style={[styles.kpiVal, { color: colors.orange }]}>14</Text>
          <Text style={styles.kpiLbl}>Unassigned Leads</Text>
          <Text style={styles.kpiTrend}>Allocate to Reps</Text>
        </TouchableOpacity>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiIcon}>🏷️</Text>
          <Text style={[styles.kpiVal, { color: '#3b82f6' }]}>3</Text>
          <Text style={styles.kpiLbl}>Discount Reqs</Text>
          <Text style={styles.kpiTrend}>Manager Clearance</Text>
        </View>
      </View>

      {/* 3. Sales Reps Leaderboard */}
      <Text style={styles.sectionTitle}>EXECUTIVE LEADERBOARD</Text>
      <View style={styles.leaderboardList}>
        {/* Rep 1 */}
        <View style={styles.repCard}>
          <View style={styles.repHeaderRow}>
            <View style={styles.repInfoRow}>
              <View style={[styles.repAvatar, { backgroundColor: '#3b82f6' }]}>
                <Text style={styles.repAvatarText}>V</Text>
              </View>
              <View>
                <Text style={styles.repName}>Vikram Singh</Text>
                <Text style={styles.repSub}>42 Leads • 38.2% Conv</Text>
              </View>
            </View>
            <View style={styles.repScoreBox}>
              <Text style={styles.repDeals}>24 / 25 Units</Text>
              <Text style={styles.repPct}>96% Quota</Text>
            </View>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: '96%', backgroundColor: colors.green }]} />
          </View>
        </View>

        {/* Rep 2 */}
        <View style={styles.repCard}>
          <View style={styles.repHeaderRow}>
            <View style={styles.repInfoRow}>
              <View style={[styles.repAvatar, { backgroundColor: '#10b981' }]}>
                <Text style={styles.repAvatarText}>R</Text>
              </View>
              <View>
                <Text style={styles.repName}>Rahul Verma</Text>
                <Text style={styles.repSub}>36 Leads • 32.5% Conv</Text>
              </View>
            </View>
            <View style={styles.repScoreBox}>
              <Text style={styles.repDeals}>19 / 22 Units</Text>
              <Text style={styles.repPct}>86% Quota</Text>
            </View>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: '86%', backgroundColor: '#3b82f6' }]} />
          </View>
        </View>

        {/* Rep 3 */}
        <View style={styles.repCard}>
          <View style={styles.repHeaderRow}>
            <View style={styles.repInfoRow}>
              <View style={[styles.repAvatar, { backgroundColor: '#f59e0b' }]}>
                <Text style={styles.repAvatarText}>D</Text>
              </View>
              <View>
                <Text style={styles.repName}>David Miller</Text>
                <Text style={styles.repSub}>28 Leads • 29.8% Conv</Text>
              </View>
            </View>
            <View style={styles.repScoreBox}>
              <Text style={styles.repDeals}>15 / 18 Units</Text>
              <Text style={styles.repPct}>83% Quota</Text>
            </View>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: '83%', backgroundColor: colors.orange }]} />
          </View>
        </View>
      </View>

      {/* 4. Quick Action Lead Pipeline */}
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() => onNavigate('leads')}
        activeOpacity={0.8}
      >
        <Text style={styles.actionBtnIcon}>🎯</Text>
        <Text style={styles.actionBtnText}>Manage Team Leads & Reassign</Text>
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
  targetBadge: {
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
  leaderboardList: {
    gap: 10,
  },
  repCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 10,
  },
  repHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  repInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  repAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repAvatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  repName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  repSub: {
    fontSize: 10,
    color: colors.textMuted,
  },
  repScoreBox: {
    alignItems: 'flex-end',
  },
  repDeals: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.orange,
  },
  repPct: {
    fontSize: 10,
    color: colors.green,
    fontWeight: '600',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: colors.inputBg,
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
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
