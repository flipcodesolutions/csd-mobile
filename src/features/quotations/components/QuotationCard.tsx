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
  ChevronRight,
  Download,
  Eye,
  Phone,
  RotateCcw,
  Trash2,
  User,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Quotation } from '../types';
import { leadApi } from '../../leads/leadService';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { showErrorToast } from '../../../core/utils/toast';

interface QuotationCardProps {
  quotation: Quotation;
  isTrashView?: boolean;
  onView: (quotation: Quotation) => void;
  onDownload: (quotation: Quotation) => void;
  onDelete?: (quotation: Quotation) => void;
  onRestore?: (quotation: Quotation) => void;
  onSelectLead?: (leadId: number, quotation: Quotation) => void;
  onConvertToDeal?: (quotation: Quotation) => void;
}

export const QuotationCard: React.FC<QuotationCardProps> = ({
  quotation,
  isTrashView = false,
  onView,
  onDownload,
  onDelete,
  onRestore,
  onSelectLead,
  onConvertToDeal,
}) => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();

  const formatInr = (val?: number | string) => {
    const num = Number(val || 0);
    return '₹ ' + num.toLocaleString('en-IN');
  };

  // Task 1: Strictly 3 statuses: Pending (default), Email Sent, Print
  const getStatusBadge = (status?: string) => {
    const s = (status || 'pending').toLowerCase();
    switch (s) {
      case 'print':
      case 'printed':
        return { bg: '#EDE9FE', text: '#6D28D9', label: 'Print' };
      case 'sent':
      case 'email_sent':
      case 'email send':
        return { bg: '#E0F2FE', text: '#0369A1', label: 'Email Sent' };
      case 'pending':
      default:
        return { bg: '#FEF3C7', text: '#B45309', label: 'Pending' };
    }
  };

  const statusBadge = getStatusBadge(quotation.status);
  const totalAmount = Number(
    quotation.final_on_road_price ||
      quotation.grand_total ||
      quotation.total_amount ||
      quotation.total ||
      0
  );
  const leadId = quotation.lead_id || (quotation as any).lead?.id;

  // Task 1: Open Lead Detail Screen on Customer Name Click
  const handleCustomerPress = async () => {
    triggerHaptic();
    let targetLeadId =
      leadId ||
      (quotation as any).leadId ||
      (quotation as any).customer_id;

    if (!targetLeadId && (quotation.customer_phone || quotation.customer_name)) {
      try {
        const phone = quotation.customer_phone?.replace(/[^\d]/g, '');
        const res = await leadApi.getAll({
          search: phone || quotation.customer_name,
          per_page: 5,
        });
        const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        const matched = items.find(
          (l: any) =>
            (phone && l.phone && String(l.phone).includes(phone)) ||
            (l.name && l.name.toLowerCase() === quotation.customer_name?.toLowerCase())
        );
        if (matched?.id) {
          targetLeadId = matched.id;
        }
      } catch (e) {
        console.log('Error looking up lead for quotation customer:', e);
      }
    }

    const finalLeadId = Number(targetLeadId || quotation.lead_id || quotation.id);
    if (onSelectLead) {
      onSelectLead(finalLeadId, quotation);
    } else {
      const parentNav = navigation.getParent?.();
      if (parentNav) {
        parentNav.navigate('LeadDetail', { leadId: finalLeadId });
      } else {
        navigation.navigate('LeadDetail', { leadId: finalLeadId });
      }
    }
  };

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
      {/* Header Row: Quote No (Click to Open View Modal) & Status */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.quoteNoBox}
          onPress={() => {
            triggerHaptic();
            onView(quotation);
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.quoteNo, { color: isDark ? '#60A5FA' : '#1E3A8A' }]}>
            {quotation.quotation_number || `QT-${quotation.id}`}
          </Text>
        </TouchableOpacity>

        <View style={[styles.badge, { backgroundColor: statusBadge.bg }]}>
          <Text style={[styles.badgeText, { color: statusBadge.text }]}>
            {statusBadge.label}
          </Text>
        </View>
      </View>

      {/* Customer Info (Click to open Lead Detail) */}
      <TouchableOpacity
        style={styles.customerRow}
        onPress={handleCustomerPress}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <User size={15} color={isDark ? '#60A5FA' : '#1E3A8A'} />
        <Text
          style={[
            styles.customerName,
            {
              color: isDark ? '#60A5FA' : '#1E3A8A',
              textDecorationLine: 'underline',
            },
          ]}
        >
          {quotation.customer_name || 'Walk-in Customer'}
        </Text>
        <ChevronRight size={14} color={isDark ? '#60A5FA' : '#1E3A8A'} strokeWidth={2.5} />
      </TouchableOpacity>

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

      {/* Card Action Buttons Toolbar (View, PDF, Delete/Restore) */}
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

        {!isTrashView && onConvertToDeal && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onConvertToDeal(quotation)}
            activeOpacity={0.7}
          >
            <CheckCircle2 size={16} color="#EE6800" />
            <Text style={[styles.actionBtnText, { color: '#EE6800', fontWeight: '800' }]}>
              Convert to Deal
            </Text>
          </TouchableOpacity>
        )}

        {isTrashView && onRestore && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onRestore(quotation)}
            activeOpacity={0.7}
          >
            <RotateCcw size={16} color="#2563EB" />
            <Text style={[styles.actionBtnText, { color: '#2563EB' }]}>Restore</Text>
          </TouchableOpacity>
        )}

        {isTrashView && onDelete && (
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
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 2,
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
