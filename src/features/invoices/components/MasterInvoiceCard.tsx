import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  MapPin,
  Phone,
  Receipt,
  User,
} from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { InvoiceRecord } from '../types';

interface MasterInvoiceCardProps {
  invoice: InvoiceRecord;
  onCustomerPress: (inv: InvoiceRecord) => void;
  onViewBill: (inv: InvoiceRecord) => void;
  onViewDealLedger: (inv: InvoiceRecord) => void;
}

export const MasterInvoiceCard: React.FC<MasterInvoiceCardProps> = ({
  invoice,
  onCustomerPress,
  onViewBill,
  onViewDealLedger,
}) => {
  const { isDark } = useTheme();

  const formatInr = (val?: number | string) => {
    const num = Number(val || 0);
    return '₹' + num.toLocaleString('en-IN');
  };

  const initials = invoice.customer_name
    ? invoice.customer_name
        .trim()
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'IN';

  const vehicleName = invoice.vehicle_model || invoice.parent_deal?.model_variant || 'Vehicle';

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
      {/* 1. Header: Invoice Number & Date/Time + Deal Number Pill */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.invoiceIconCircle}>
            <FileText size={16} color="#0284C7" />
          </View>
          <View>
            <Text style={[styles.invoiceNoText, { color: isDark ? '#60A5FA' : '#1D4ED8' }]}>
              {invoice.invoice_no}
            </Text>
            <View style={styles.dateTimeRow}>
              <Calendar size={11} color="#64748B" />
              <Text style={styles.dateTimeText}>{invoice.payment_date}</Text>
              {invoice.time ? (
                <>
                  <Clock size={11} color="#64748B" style={{ marginLeft: 4 }} />
                  <Text style={styles.dateTimeText}>{invoice.time}</Text>
                </>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.headerRightCol}>
          <TouchableOpacity
            style={styles.dealNoBox}
            onPress={() => {
              triggerHaptic();
              onViewDealLedger(invoice);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.dealNoText}>{invoice.deal_number}</Text>
          </TouchableOpacity>

          <View style={styles.paidBadge}>
            <CheckCircle2 size={10} color="#15803D" strokeWidth={2.4} />
            <Text style={styles.paidBadgeText}>{invoice.status || 'Paid'}</Text>
          </View>
        </View>
      </View>

      {/* 2. Customer & Vehicle Particulars */}
      <View style={styles.particularsContainer}>
        <View style={styles.customerRow}>
          <TouchableOpacity
            style={styles.customerBtn}
            onPress={() => {
              triggerHaptic();
              onCustomerPress(invoice);
            }}
            activeOpacity={0.7}
          >
            <User size={13} color={isDark ? '#60A5FA' : '#1E3A8A'} />
            <Text style={[styles.customerName, { color: isDark ? '#60A5FA' : '#1E3A8A' }]}>
              {invoice.customer_name}
            </Text>
            <ExternalLink size={11} color={isDark ? '#60A5FA' : '#1E3A8A'} />
          </TouchableOpacity>

          {invoice.customer_phone ? (
            <View style={styles.contactItem}>
              <Phone size={11} color="#64748B" />
              <Text style={styles.contactText}>{invoice.customer_phone}</Text>
            </View>
          ) : null}

          {invoice.customer_city ? (
            <View style={styles.contactItem}>
              <MapPin size={11} color="#64748B" />
              <Text style={styles.contactText}>{invoice.customer_city}</Text>
            </View>
          ) : null}
        </View>

        <Text
          style={[styles.vehicleText, { color: isDark ? '#E2E8F0' : '#1E293B' }]}
          numberOfLines={1}
        >
          {vehicleName}
          {invoice.color ? ` • ${invoice.color}` : ''}
        </Text>
      </View>

      {/* 3. Financial & Payment Snapshot Box */}
      <View
        style={[
          styles.finBox,
          {
            backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
            borderColor: isDark ? '#334155' : '#E2E8F0',
          },
        ]}
      >
        <View style={styles.finTopRow}>
          <View>
            <Text style={styles.finLabel}>PAYMENT TYPE</Text>
            <View style={styles.typePill}>
              <Text style={styles.typePillText}>
                {invoice.payment_type || 'Installment Payment'}
              </Text>
            </View>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.finLabel}>AMOUNT PAID</Text>
            <Text style={styles.amountValueText}>{formatInr(invoice.amount)}</Text>
          </View>
        </View>

        <View style={styles.finBottomRow}>
          <Text style={styles.metaLabelText}>
            Mode: <Text style={{ fontWeight: '700' }}>{(invoice.payment_mode || 'Cash').toUpperCase()}</Text>
          </Text>
          {invoice.transaction_reference ? (
            <Text style={styles.metaLabelText} numberOfLines={1}>
              Ref: <Text style={{ fontWeight: '700' }}>{invoice.transaction_reference}</Text>
            </Text>
          ) : null}
          {invoice.received_by ? (
            <Text style={styles.metaLabelText}>
              Rec: <Text style={{ fontWeight: '700' }}>{invoice.received_by}</Text>
            </Text>
          ) : null}
        </View>
      </View>

      {/* 4. Bottom Actions Bar */}
      <View
        style={[
          styles.actionsBar,
          { borderTopColor: isDark ? '#1E293B' : '#F1F5F9' },
        ]}
      >
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onViewDealLedger(invoice)}
          activeOpacity={0.7}
        >
          <Receipt size={13} color="#059669" />
          <Text style={[styles.actionBtnText, { color: '#059669' }]}>
            View Deal Ledger
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.viewBillActionBtn]}
          onPress={() => onViewBill(invoice)}
          activeOpacity={0.7}
        >
          <FileText size={13} color="#2563EB" />
          <Text style={[styles.actionBtnText, { color: '#2563EB', fontWeight: '800' }]}>
            View Bill
          </Text>
        </TouchableOpacity>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  invoiceIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  invoiceNoText: {
    fontSize: 13,
    fontWeight: '800',
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  dateTimeText: {
    fontSize: 10,
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
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  paidBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
  },
  particularsContainer: {
    marginBottom: 10,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  customerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '800',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  contactText: {
    fontSize: 11,
    color: '#64748B',
  },
  vehicleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  finBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  finTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  finLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  typePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  typePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  amountValueText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#059669',
  },
  finBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  metaLabelText: {
    fontSize: 10,
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
  viewBillActionBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
});

