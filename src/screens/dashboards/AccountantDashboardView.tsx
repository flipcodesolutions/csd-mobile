import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../colors';
import { ScreenName } from '../../Drawer';

interface Props {
  onNavigate: (screen: ScreenName) => void;
}

export const AccountantDashboardView: React.FC<Props> = ({ onNavigate }) => {
  return (
    <View style={styles.container}>
      {/* 1. Finance Desk Banner */}
      <View style={styles.bannerCard}>
        <View style={styles.bannerHeaderRow}>
          <Text style={styles.bannerBadge}>📊 FINANCE & ACCOUNTS DESK</Text>
          <Text style={styles.gstStatus}>🟢 100% Tax Compliant</Text>
        </View>
        <Text style={styles.bannerTitle}>Inflow & Loan Sanctions</Text>
        <Text style={styles.bannerSubtitle}>
          ₹3.82 Cr Monthly Collections • 42 GST Invoices Cleared
        </Text>
      </View>

      {/* 2. Key Finance KPIs */}
      <Text style={styles.sectionTitle}>CASHFLOW & SETTLEMENT STATS</Text>
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiIcon}>💰</Text>
          <Text style={styles.kpiVal}>₹3.82 Cr</Text>
          <Text style={styles.kpiLbl}>Monthly Inflow</Text>
          <Text style={styles.kpiTrend}>+24.5% vs Last Mo</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiIcon}>🧾</Text>
          <Text style={[styles.kpiVal, { color: colors.orange }]}>8 Pending</Text>
          <Text style={styles.kpiLbl}>Payment Receipts</Text>
          <Text style={styles.kpiTrend}>₹5.51L Awaiting Verify</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiIcon}>🏦</Text>
          <Text style={[styles.kpiVal, { color: '#3b82f6' }]}>14 Files</Text>
          <Text style={styles.kpiLbl}>Bank Loans</Text>
          <Text style={styles.kpiTrend}>₹2.45 Cr in Pipeline</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiIcon}>📜</Text>
          <Text style={[styles.kpiVal, { color: colors.green }]}>42</Text>
          <Text style={styles.kpiLbl}>GST Invoices</Text>
          <Text style={styles.kpiTrend}>Cleared & Dispatched</Text>
        </View>
      </View>

      {/* 3. Pending Payment Verification Queue */}
      <Text style={styles.sectionTitle}>PAYMENT CLEARANCES</Text>
      <View style={styles.paymentList}>
        <View style={styles.paymentCard}>
          <View style={styles.paymentHeaderRow}>
            <Text style={styles.receiptNo}>#REC-8840</Text>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>Pending Verification</Text>
            </View>
          </View>
          <Text style={styles.customerName}>Kunal Singhania</Text>
          <Text style={styles.paymentSub}>NEFT/RTGS (HDFC) • Mahindra Thar Roxx</Text>
          <View style={styles.paymentFooterRow}>
            <Text style={styles.amountText}>₹5,00,000</Text>
            <Text style={styles.paymentType}>Down Payment</Text>
          </View>
        </View>

        <View style={styles.paymentCard}>
          <View style={styles.paymentHeaderRow}>
            <Text style={styles.receiptNo}>#REC-8841</Text>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>Pending Verification</Text>
            </View>
          </View>
          <Text style={styles.customerName}>Dr. Arvind Saxena</Text>
          <Text style={styles.paymentSub}>UPI / Axis • Maruti Grand Vitara</Text>
          <View style={styles.paymentFooterRow}>
            <Text style={styles.amountText}>₹51,000</Text>
            <Text style={styles.paymentType}>Token Advance</Text>
          </View>
        </View>
      </View>

      {/* 4. Bank Loan Partner Approvals */}
      <Text style={styles.sectionTitle}>BANK LOAN SANCTIONS</Text>
      <View style={styles.loanList}>
        <View style={styles.loanCard}>
          <View style={styles.loanHeaderRow}>
            <Text style={styles.loanBank}>State Bank of India (SBI)</Text>
            <Text style={styles.loanAmount}>₹18.50 L</Text>
          </View>
          <Text style={styles.loanCustomer}>Rajesh Verma • Tata Safari</Text>
          <View style={styles.loanFooterRow}>
            <Text style={styles.loanStatusText}>Sanction Letter Issued (8.75% ROI)</Text>
          </View>
        </View>

        <View style={styles.loanCard}>
          <View style={styles.loanHeaderRow}>
            <Text style={styles.loanBank}>HDFC Bank Car Finance</Text>
            <Text style={styles.loanAmount}>₹20.00 L</Text>
          </View>
          <Text style={styles.loanCustomer}>Dr. Meenakshi • Safari Dark</Text>
          <View style={styles.loanFooterRow}>
            <Text style={styles.loanStatusWarning}>Doc Verification In-Progress</Text>
          </View>
        </View>
      </View>

      {/* 5. Fast Action to Variant Pricing */}
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() => onNavigate('variant')}
        activeOpacity={0.8}
      >
        <Text style={styles.actionBtnIcon}>⚡</Text>
        <Text style={styles.actionBtnText}>Check Vehicle Variants & Tax Pricing</Text>
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
  gstStatus: {
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
  paymentList: {
    gap: 10,
  },
  paymentCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 6,
  },
  paymentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptNo: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  pendingBadge: {
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    borderWidth: 1,
    borderColor: colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.warning,
  },
  customerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  paymentSub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  paymentFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  amountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.green,
  },
  paymentType: {
    fontSize: 11,
    color: colors.orange,
    fontWeight: '600',
  },
  loanList: {
    gap: 10,
  },
  loanCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 4,
  },
  loanHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loanBank: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  loanAmount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.orange,
  },
  loanCustomer: {
    fontSize: 11,
    color: colors.textMuted,
  },
  loanFooterRow: {
    marginTop: 4,
  },
  loanStatusText: {
    fontSize: 10,
    color: colors.green,
    fontWeight: '600',
  },
  loanStatusWarning: {
    fontSize: 10,
    color: colors.warning,
    fontWeight: '600',
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
