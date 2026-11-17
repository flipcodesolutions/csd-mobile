import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Calendar,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  MapPin,
  Phone,
  PlusCircle,
  Receipt,
  User,
} from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { EnrichedDeal } from '../types';

interface DealInvoiceCardProps {
  deal: EnrichedDeal;
  onCustomerPress: (deal: EnrichedDeal) => void;
  onAddBill: (deal: EnrichedDeal) => void;
  onViewLedger: (deal: EnrichedDeal) => void;
}

export const DealInvoiceCard: React.FC<DealInvoiceCardProps> = ({
  deal,
  onCustomerPress,
  onAddBill,
  onViewLedger,
}) => {
  const { isDark } = useTheme();

  const formatInr = (val?: number | string) => {
    const num = Number(val || 0);
    return '₹' + num.toLocaleString('en-IN');
  };

  const netAmount = Number(deal.net_amount || deal.total_amount || 0);
  const paidAmount = Number(deal.paid_amount || deal.total_paid || 0);
  const balanceDue = Number(
    deal.balance_due !== undefined ? deal.balance_due : Math.max(0, netAmount - paidAmount)
  );
  const percentPaid = netAmount > 0 ? Math.min(100, Math.round((paidAmount / netAmount) * 100)) : 0;
  const isFullyPaid = balanceDue <= 0 || deal.payment_status === 'fully_paid' || percentPaid >= 100;

  const initials = deal.customer_name
    ? deal.customer_name
        .trim()
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'DA';

  const getStageBadge = (stage?: string) => {
    const s = (stage || deal.deal_status || 'booking_confirmed').toLowerCase().replace(/_/g, ' ');
    if (s.includes('deliver')) {
      return { bg: '#DCFCE7', text: '#15803D', label: 'Delivered' };
    }
    if (s.includes('ready')) {
      return { bg: '#E0E7FF', text: '#3730A3', label: 'Ready for Delivery' };
    }
    if (s.includes('transit')) {
      return { bg: '#FEF3C7', text: '#B45309', label: 'In Transit' };
    }
    if (s.includes('cancel')) {
      return { bg: '#FEE2E2', text: '#B91C1C', label: 'Cancelled' };
    }
    return { bg: '#DBEAFE', text: '#1D4ED8', label: 'Booking Confirmed' };
  };

  const stageBadge = getStageBadge(deal.delivery_stage || deal.deal_status);
  const hasInsurance = deal.has_insurance === true || deal.has_insurance === 'Yes' || !!deal.insurance;
  const vehicleTitle = deal.model_variant || deal.model_name || 'Standard Vehicle';
  const invoicesCount = deal.invoicesCount || (deal.invoices ? deal.invoices.length : 0);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#101726' : '#FFFFFF',
          borderColor: isDark ? '#1E293B' : '#E2E8F0',
        },
      ]}
    >
      {/* 1. Header: Avatar Initials + Customer Info + Deal Ref & Bills Badge */}
      <View style={styles.headerRow}>
        <View style={styles.customerLeft}>
          <TouchableOpacity
            style={[
              styles.avatarBadge,
              {
                backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                borderColor: isDark ? '#334155' : '#E2E8F0',
              },
            ]}
            onPress={() => {
              triggerHaptic();
              onCustomerPress(deal);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.avatarText, { color: isDark ? '#CBD5E1' : '#131C27' }]}>
              {initials}
            </Text>
          </TouchableOpacity>

          <View style={{ flex: 1, marginLeft: 10 }}>
            {/* Customer Name Clickable */}
            <TouchableOpacity
              style={styles.customerNameBtn}
              onPress={() => {
                triggerHaptic();
                onCustomerPress(deal);
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text
                style={[styles.customerName, { color: isDark ? '#60A5FA' : '#1E3A8A' }]}
                numberOfLines={1}
              >
                {deal.customer_name || 'Customer'}
              </Text>
              <ExternalLink size={12} color={isDark ? '#60A5FA' : '#1E3A8A'} strokeWidth={2.4} />
            </TouchableOpacity>

            {/* Sub-row: Phone & City */}
            <View style={styles.contactSubRow}>
              {deal.customer_phone ? (
                <View style={styles.contactItem}>
                  <Phone size={11} color="#64748B" />
                  <Text style={styles.contactText}>{deal.customer_phone}</Text>
                </View>
              ) : null}

              {(deal.customer_city || deal.city) ? (
                <View style={styles.contactItem}>
                  <MapPin size={11} color="#64748B" />
                  <Text style={styles.contactText}>{deal.customer_city || deal.city}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Right Header: Deal Number Box & Bills Count Badge */}
        <View style={styles.headerRightCol}>
          <View style={styles.dealNoBox}>
            <Text style={styles.dealNoText}>{deal.deal_number || `DEAL-${deal.id}`}</Text>
          </View>

          <TouchableOpacity
            style={styles.billsCountBadge}
            onPress={() => {
              triggerHaptic();
              onViewLedger(deal);
            }}
            activeOpacity={0.7}
          >
            <FileSpreadsheet size={11} color="#059669" />
            <Text style={styles.billsCountText}>
              {invoicesCount} {invoicesCount === 1 ? 'Bill' : 'Bills'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Vehicle Specification & Badges */}
      <View style={styles.vehicleBox}>
        <Text
          style={[styles.vehicleTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}
          numberOfLines={1}
        >
          {vehicleTitle}
        </Text>
        <View style={styles.badgeTagsRow}>
          <View
            style={[
              styles.specPill,
              { backgroundColor: isDark ? '#0F172A' : '#F1F5F9' },
            ]}
          >
            <Text style={styles.specPillText}>Color: {deal.color || 'Standard'}</Text>
          </View>

          <View
            style={[
              styles.specPill,
              hasInsurance
                ? { backgroundColor: '#DCFCE7', borderColor: '#BBF7D0' }
                : { backgroundColor: isDark ? '#0F172A' : '#F1F5F9' },
            ]}
          >
            <Text
              style={[
                styles.specPillText,
                hasInsurance && { color: '#15803D', fontWeight: '700' },
              ]}
            >
              {hasInsurance ? 'Insurance: Yes' : 'Insurance: No'}
            </Text>
          </View>

          <View style={[styles.stageBadge, { backgroundColor: stageBadge.bg }]}>
            <Text style={[styles.stageBadgeText, { color: stageBadge.text }]}>
              {stageBadge.label}
            </Text>
          </View>
        </View>
      </View>

      {/* 3. Financials & Payment Progress */}
      <View
        style={[
          styles.financialBox,
          {
            backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
            borderColor: isDark ? '#334155' : '#E2E8F0',
          },
        ]}
      >
        <View style={styles.financialTopRow}>
          <View>
            <Text style={styles.finLabel}>Total Deal Amount</Text>
            <Text style={[styles.finValue, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
              {formatInr(netAmount)}
            </Text>
          </View>

          <View style={styles.paymentStatusCol}>
            <View
              style={[
                styles.paymentBadge,
                isFullyPaid ? styles.fullyPaidBadge : styles.partialBadge,
              ]}
            >
              <Text
                style={[
                  styles.paymentBadgeText,
                  isFullyPaid ? styles.fullyPaidText : styles.partialText,
                ]}
              >
                {isFullyPaid ? 'Fully Paid' : 'Partially Paid'}
              </Text>
            </View>
            <Text style={styles.percentText}>{percentPaid}%</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${percentPaid}%`,
                backgroundColor: isFullyPaid ? '#16A34A' : '#D97706',
              },
            ]}
          />
        </View>

        <View style={styles.paidDueRow}>
          <Text style={styles.paidAmountText}>
            Paid: <Text style={{ fontWeight: '700' }}>{formatInr(paidAmount)}</Text>
          </Text>
          <Text
            style={[
              styles.dueAmountText,
              balanceDue > 0 && { color: '#DC2626', fontWeight: '700' },
            ]}
          >
            Due: {formatInr(balanceDue)}
          </Text>
        </View>
      </View>

      {/* 4. Delivery Date Footnote */}
      <View style={styles.deliveryDateRow}>
        <Calendar size={12} color="#64748B" />
        <Text style={styles.deliveryDateText}>
          Delivery:{' '}
          <Text style={{ fontWeight: '700', color: isDark ? '#CBD5E1' : '#334155' }}>
            {deal.expected_delivery_date || 'Pending Allocation'}
          </Text>
        </Text>
      </View>

      {/* 5. Bottom Action Buttons Toolbar */}
      <View
        style={[
          styles.actionsBar,
          { borderTopColor: isDark ? '#1E293B' : '#F1F5F9' },
        ]}
      >
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onViewLedger(deal)}
          activeOpacity={0.7}
        >
          <Receipt size={13} color="#059669" />
          <Text style={[styles.actionBtnText, { color: '#059669' }]}>
            View Ledger & Bills
          </Text>
        </TouchableOpacity>

        {/* Task Requirement: If Fully Paid, hide + Add Bill button */}
        {!isFullyPaid && balanceDue > 0 && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.addBillBtn]}
            onPress={() => onAddBill(deal)}
            activeOpacity={0.7}
          >
            <PlusCircle size={13} color="#EE6800" />
            <Text style={[styles.actionBtnText, { color: '#EE6800', fontWeight: '800' }]}>
              + Add Bill
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  customerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  avatarBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
  },
  customerNameBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '800',
    maxWidth: 160,
  },
  contactSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  contactText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  headerRightCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  dealNoBox: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  dealNoText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  billsCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  billsCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  vehicleBox: {
    marginBottom: 10,
  },
  vehicleTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 5,
  },
  badgeTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  specPill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  specPillText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  stageBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stageBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  financialBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  financialTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  finLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  finValue: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 1,
  },
  paymentStatusCol: {
    alignItems: 'flex-end',
  },
  paymentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fullyPaidBadge: {
    backgroundColor: '#DCFCE7',
  },
  partialBadge: {
    backgroundColor: '#FEF3C7',
  },
  paymentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  fullyPaidText: {
    color: '#15803D',
  },
  partialText: {
    color: '#B45309',
  },
  percentText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 2,
  },
  progressTrack: {
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 6,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  paidDueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  paidAmountText: {
    fontSize: 11,
    color: '#059669',
  },
  dueAmountText: {
    fontSize: 11,
    color: '#64748B',
  },
  deliveryDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  deliveryDateText: {
    fontSize: 11,
    color: '#64748B',
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    rowGap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  addBillBtn: {
    backgroundColor: 'rgba(238, 104, 0, 0.08)',
  },
});

