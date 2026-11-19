import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Calendar,
  CreditCard,
  Eye,
  Globe,
  MoreVertical,
  Pencil,
  Tag,
  Trash2,
  User,
  Wallet,
} from 'lucide-react-native';
import { colors } from '../../../core/theme/colors';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { ExpenseRecord } from '../types';

interface ExpenseCardProps {
  index: number;
  item: ExpenseRecord;
  onView: (item: ExpenseRecord) => void;
  onEdit: (item: ExpenseRecord) => void;
  onDelete: (item: ExpenseRecord) => void;
}

export const ExpenseCard: React.FC<ExpenseCardProps> = ({
  index,
  item,
  onView,
  onEdit,
  onDelete,
}) => {
  const { isDark } = useTheme();

  const formattedDate = item.date
    ? new Date(item.date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A';

  const isOnline = item.payment_type === 'Online';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#131C27' : '#FFFFFF',
          borderColor: isDark ? '#1E293B' : colors.border,
        },
      ]}
    >
      {/* Top Header: Index, Invoice & Date, Action Button */}
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          <View
            style={[
              styles.indexBadge,
              { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
            ]}
          >
            <Text
              style={[
                styles.indexText,
                { color: isDark ? '#94A3B8' : '#64748B' },
              ]}
            >
              #{index + 1}
            </Text>
          </View>

          <View style={styles.invoiceDateCol}>
            <Text
              style={[
                styles.invoiceNo,
                { color: isDark ? '#F1F5F9' : '#0F172A' },
              ]}
              numberOfLines={1}
            >
              {item.invoice_no}
            </Text>
            <View style={styles.dateRow}>
              <Calendar size={12} color={isDark ? '#94A3B8' : '#64748B'} />
              <Text
                style={[
                  styles.dateText,
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
              >
                {formattedDate}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.topRightActions}>
          <TouchableOpacity
            style={[
              styles.actionIconBtn,
              { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' },
            ]}
            onPress={() => {
              triggerHaptic('impactLight');
              onView(item);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="View Expense"
          >
            <Eye size={16} color={isDark ? '#93C5FD' : '#2563EB'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionIconBtn,
              { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' },
            ]}
            onPress={() => {
              triggerHaptic('impactLight');
              onEdit(item);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Edit Expense"
          >
            <Pencil size={15} color={isDark ? '#FDE047' : '#D97706'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionIconBtn,
              { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2' },
            ]}
            onPress={() => {
              triggerHaptic('notificationWarning');
              onDelete(item);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Delete Expense"
          >
            <Trash2 size={15} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Title Badge & Party Name */}
      <View style={styles.middleRow}>
        <View style={styles.titleBadgeRow}>
          <View
            style={[
              styles.categoryPill,
              {
                backgroundColor: isDark
                  ? 'rgba(88, 99, 42, 0.2)'
                  : '#EFF3DF',
                borderColor: isDark
                  ? 'rgba(88, 99, 42, 0.4)'
                  : 'rgba(88, 99, 42, 0.3)',
              },
            ]}
          >
            <Tag size={12} color={colors.primary} />
            <Text style={[styles.categoryText, { color: colors.primary }]}>
              {item.title}
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.partyName,
            { color: isDark ? '#F1F5F9' : '#1F2933' },
          ]}
          numberOfLines={2}
        >
          {item.party_name}
        </Text>
      </View>

      {/* Divider */}
      <View
        style={[
          styles.divider,
          { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
        ]}
      />

      {/* Bottom Row: Amount, Payment Type & Paid By */}
      <View style={styles.bottomRow}>
        <View style={styles.amountBox}>
          <Text
            style={[
              styles.amountLabel,
              { color: isDark ? '#94A3B8' : '#64748B' },
            ]}
          >
            AMOUNT
          </Text>
          <Text style={styles.amountValue}>
            ₹{item.amount.toLocaleString('en-IN')}
          </Text>
        </View>

        <View style={styles.paymentBox}>
          {isOnline ? (
            <View style={styles.onlineBadgeCol}>
              <View
                style={[
                  styles.paymentPill,
                  {
                    backgroundColor: isDark
                      ? 'rgba(22, 163, 74, 0.15)'
                      : '#DCFCE7',
                    borderColor: isDark
                      ? 'rgba(22, 163, 74, 0.3)'
                      : '#86EFAC',
                  },
                ]}
              >
                <Globe size={11} color="#16A34A" />
                <Text style={styles.onlinePillText}>Online</Text>
              </View>
              {item.reference_no ? (
                <Text
                  style={[
                    styles.refNoText,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                  numberOfLines={1}
                >
                  Ref: {item.reference_no}
                </Text>
              ) : null}
            </View>
          ) : (
            <View
              style={[
                styles.paymentPill,
                {
                  backgroundColor: isDark
                    ? 'rgba(245, 158, 11, 0.15)'
                    : '#FEF3C7',
                  borderColor: isDark
                    ? 'rgba(245, 158, 11, 0.3)'
                    : '#FDE68A',
                },
              ]}
            >
              <Wallet size={11} color="#D97706" />
              <Text style={styles.offlinePillText}>Offline / Cash</Text>
            </View>
          )}
        </View>

        <View style={styles.paidByBox}>
          <View style={styles.paidByRow}>
            <User size={12} color={isDark ? '#94A3B8' : '#64748B'} />
            <Text
              style={[
                styles.paidByText,
                { color: isDark ? '#CBD5E1' : '#334155' },
              ]}
              numberOfLines={1}
            >
              {item.pay_by}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  indexBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
  },
  indexText: {
    fontSize: 11,
    fontWeight: '700',
  },
  invoiceDateCol: {
    flex: 1,
  },
  invoiceNo: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  dateText: {
    fontSize: 11.5,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middleRow: {
    marginTop: 10,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  partyName: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  amountBox: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  paymentBox: {
    flex: 1,
    alignItems: 'center',
  },
  onlineBadgeCol: {
    alignItems: 'center',
  },
  paymentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  onlinePillText: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '700',
  },
  offlinePillText: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '700',
  },
  refNoText: {
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  paidByBox: {
    flex: 1,
    alignItems: 'flex-end',
  },
  paidByRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paidByText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
});

