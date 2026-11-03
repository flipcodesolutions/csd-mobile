import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Calendar,
  Download,
  Eye,
  Phone,
  RotateCcw,
  Trash2,
  User,
} from 'lucide-react-native';
import { Quotation } from '../types';
import { useTheme } from '../../../core/theme/ThemeContext';

interface QuotationCardProps {
  quotation: Quotation;
  isTrashView?: boolean;
  onView: (quotation: Quotation) => void;
  onDownload: (quotation: Quotation) => void;
  onDelete: (quotation: Quotation) => void;
  onRestore?: (quotation: Quotation) => void;
}

export const QuotationCard: React.FC<QuotationCardProps> = ({
  quotation,
  isTrashView = false,
  onView,
  onDownload,
  onDelete,
  onRestore,
}) => {
  const { colors, isDark } = useTheme();

  const formatInr = (val?: number | string) => {
    const num = Number(val || 0);
    return '₹ ' + num.toLocaleString('en-IN');
  };

  const getStatusBadge = (status?: string) => {
    const s = (status || 'sent').toLowerCase();
    switch (s) {
      case 'accepted':
        return { bg: '#DCFCE7', text: '#15803D', label: 'Accepted' };
      case 'rejected':
        return { bg: '#FEE2E2', text: '#B91C1C', label: 'Rejected' };
      case 'pending':
        return { bg: '#FEF3C7', text: '#B45309', label: 'Pending' };
      case 'print':
        return { bg: '#EDE9FE', text: '#6D28D9', label: 'Print' };
      case 'sent':
      default:
        return { bg: '#E0F2FE', text: '#0369A1', label: 'Sent' };
    }
  };

  const statusBadge = getStatusBadge(quotation.status);
  const totalAmount = quotation.grand_total || quotation.total_amount || quotation.total || 0;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          borderColor: isDark ? '#334155' : '#E2E8F0',
        },
      ]}
    >
      {/* Header Row: Quote No & Status */}
      <View style={styles.headerRow}>
        <View style={styles.quoteNoBox}>
          <Text style={[styles.quoteNo, { color: isDark ? '#60A5FA' : '#1E3A8A' }]}>
            {quotation.quotation_number || `QT-${quotation.id}`}
          </Text>
        </View>

        <View style={[styles.badge, { backgroundColor: statusBadge.bg }]}>
          <Text style={[styles.badgeText, { color: statusBadge.text }]}>
            {statusBadge.label}
          </Text>
        </View>
      </View>

      {/* Customer Info */}
      <View style={styles.row}>
        <User size={15} color={isDark ? '#94A3B8' : '#64748B'} />
        <Text style={[styles.customerName, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
          {quotation.customer_name || 'Walk-in Customer'}
        </Text>
      </View>

      {quotation.customer_phone ? (
        <View style={[styles.row, { marginTop: 3 }]}>
          <Phone size={13} color="#94A3B8" />
          <Text style={styles.phoneText}>{quotation.customer_phone}</Text>
        </View>
      ) : null}

      {/* Vehicle / Subject */}
      <View style={styles.subjectBox}>
        <Text
          style={[styles.subjectText, { color: isDark ? '#CBD5E1' : '#334155' }]}
          numberOfLines={2}
        >
          {quotation.subject ||
            `Official Vehicle Quotation – ${quotation.brand_name || ''} ${quotation.model_name || ''}`}
        </Text>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]} />

      {/* Date & Grand Total Row */}
      <View style={styles.footerRow}>
        <View style={styles.dateCol}>
          <View style={styles.row}>
            <Calendar size={13} color="#94A3B8" />
            <Text style={styles.dateText}>
              {quotation.quotation_date || quotation.created_at?.slice(0, 10) || '-'}
            </Text>
          </View>
        </View>

        <View style={styles.totalCol}>
          <Text style={styles.totalLabel}>Grand Total</Text>
          <Text style={styles.totalValue}>{formatInr(totalAmount)}</Text>
        </View>
      </View>

      {/* Card Action Buttons Toolbar (Task 3: View, PDF, Delete/Restore) */}
      <View style={[styles.actionsBar, { borderTopColor: isDark ? '#334155' : '#F1F5F9' }]}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onView(quotation)}
          activeOpacity={0.7}
        >
          <Eye size={16} color="#0284C7" />
          <Text style={[styles.actionBtnText, { color: '#0284C7' }]}>View</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onDownload(quotation)}
          activeOpacity={0.7}
        >
          <Download size={16} color="#059669" />
          <Text style={[styles.actionBtnText, { color: '#059669' }]}>PDF</Text>
        </TouchableOpacity>

        {isTrashView && onRestore ? (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onRestore(quotation)}
            activeOpacity={0.7}
          >
            <RotateCcw size={16} color="#2563EB" />
            <Text style={[styles.actionBtnText, { color: '#2563EB' }]}>Restore</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onDelete(quotation)}
            activeOpacity={0.7}
          >
            <Trash2 size={16} color="#EF4444" />
            <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  quoteNoBox: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(30, 58, 138, 0.08)',
    borderRadius: 6,
  },
  quoteNo: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '700',
  },
  phoneText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  subjectBox: {
    marginTop: 8,
    marginBottom: 10,
  },
  subjectText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  divider: {
    height: 1,
    marginBottom: 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateCol: {
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
  },
  totalCol: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 10,
    color: '#64748B',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#B91C1C',
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
