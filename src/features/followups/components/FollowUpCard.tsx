import React, { memo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  Flame,
  Hourglass,
  MapPin,
  MoreVertical,
  Phone,
  PhoneCall,
  User,
  XCircle,
} from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { FollowUpItem } from '../types';

interface FollowUpCardProps {
  item: FollowUpItem;
  onCall: (phone: string) => void;
  onLogNext: (item: FollowUpItem) => void;
  onSendQuotation: (item: FollowUpItem) => void;
  onViewProfile: (item: FollowUpItem) => void;
  onOpenActions: (item: FollowUpItem) => void;
}

export const FollowUpCard: React.FC<FollowUpCardProps> = memo(({
  item,
  onCall,
  onLogNext,
  onSendQuotation,
  onViewProfile,
  onOpenActions,
}) => {
  const { colors, isDark } = useTheme();

  const initials = item.customer_name
    ? item.customer_name
        .trim()
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'CU';

  const todayStr = new Date().toISOString().split('T')[0];
  const dueDate = item.next_follow_up_date || item.follow_up_date;
  const isOverdue = dueDate < todayStr;
  const isDueToday = dueDate === todayStr;

  const isHot = item.priority === 'Hot';

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: isDark ? '#101726' : '#FFFFFF',
          borderColor: isDark ? '#1E293B' : '#E2E8F0',
        },
      ]}
    >
      {/* 1. Header: Customer Contact & Urgency Tag */}
      <View style={styles.headerRow}>
        <View style={styles.customerLeft}>
          <View
            style={[
              styles.avatarBadge,
              {
                backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                borderColor: isDark ? '#334155' : '#CBD5E1',
              },
            ]}
          >
            <Text
              style={[
                styles.avatarText,
                { color: isDark ? '#CBD5E1' : '#334155' },
              ]}
            >
              {initials}
            </Text>
          </View>

          <View style={{ flex: 1, marginLeft: 10 }}>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('impactLight');
                onViewProfile(item);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.customerName,
                  { color: isDark ? '#F8FAFC' : '#0F172A' },
                ]}
                numberOfLines={1}
              >
                {item.customer_name}
              </Text>
            </TouchableOpacity>

            <View style={styles.phoneLocationRow}>
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('impactLight');
                  onCall(item.phone);
                }}
                activeOpacity={0.7}
                style={styles.phoneClick}
              >
                <Phone size={11} color={colors.primary} strokeWidth={2.2} />
                <Text
                  style={[
                    styles.phoneText,
                    { color: colors.primary, marginLeft: 3 },
                  ]}
                >
                  {item.phone}
                </Text>
              </TouchableOpacity>

              {item.city ? (
                <>
                  <Text
                    style={[styles.dotSep, { color: colors.borderSubtle }]}
                  >
                    •
                  </Text>
                  <View style={styles.cityRow}>
                    <MapPin
                      size={11}
                      color={colors.textSecondary}
                      strokeWidth={2}
                    />
                    <Text
                      style={[
                        styles.cityText,
                        { color: colors.textSecondary, marginLeft: 2 },
                      ]}
                      numberOfLines={1}
                    >
                      {item.city}
                    </Text>
                  </View>
                </>
              ) : null}
            </View>
          </View>
        </View>

        {/* Urgency Badge */}
        <View
          style={[
            styles.urgencyBadge,
            {
              backgroundColor: isHot
                ? isDark
                  ? 'rgba(239, 68, 68, 0.15)'
                  : '#FEF2F2'
                : isDark
                ? 'rgba(245, 158, 11, 0.15)'
                : '#FFFBEB',
              borderColor: isHot
                ? isDark
                  ? '#EF4444'
                  : '#FCA5A5'
                : isDark
                ? '#F59E0B'
                : '#FDE68A',
            },
          ]}
        >
          {isHot && (
            <Flame
              size={11}
              color={isDark ? '#F87171' : '#DC2626'}
              strokeWidth={2.5}
              style={{ marginRight: 3 }}
            />
          )}
          <Text
            style={[
              styles.urgencyText,
              {
                color: isHot
                  ? isDark
                    ? '#F87171'
                    : '#DC2626'
                  : isDark
                  ? '#FBBF24'
                  : '#D97706',
              },
            ]}
          >
            {isHot ? 'High Urgency' : 'Medium Urgency'}
          </Text>
        </View>
      </View>

      {/* 2. Vehicle Interested Row */}
      {item.vehicle ? (
        <View style={styles.vehicleRow}>
          <Text
            style={[
              styles.vehicleName,
              { color: isDark ? '#E2E8F0' : '#1E293B' },
            ]}
            numberOfLines={1}
          >
            {item.vehicle}
          </Text>
          <Text style={[styles.brandSub, { color: colors.gold }]}>
            {item.brand_name
              ? `${item.brand_name.toUpperCase()} • CSD APPROVED`
              : 'CSD APPROVED'}
          </Text>
        </View>
      ) : null}

      {/* 3. Outcome & Discount Badges Row */}
      <View style={styles.outcomeRow}>
        <View
          style={[
            styles.outcomeChip,
            {
              backgroundColor: isDark
                ? 'rgba(189, 207, 121, 0.12)'
                : '#F5F8EE',
              borderColor: colors.primary,
            },
          ]}
        >
          <Text style={[styles.outcomeChipText, { color: colors.primary }]}>
            {item.status || 'Completed'}
          </Text>
        </View>

        {/* Real-time Discount Badges (Web Section 5) */}
        {item.is_discount_requested && item.discount_amount ? (
          <View
            style={[
              styles.discountBadge,
              {
                backgroundColor:
                  item.discount_status === 'approved'
                    ? isDark
                      ? 'rgba(16, 185, 129, 0.15)'
                      : '#ECFDF5'
                    : item.discount_status === 'rejected'
                    ? isDark
                      ? 'rgba(239, 68, 68, 0.15)'
                      : '#FEF2F2'
                    : isDark
                    ? 'rgba(245, 158, 11, 0.15)'
                    : '#FFFBEB',
                borderColor:
                  item.discount_status === 'approved'
                    ? isDark
                      ? '#10B981'
                      : '#86EFAC'
                    : item.discount_status === 'rejected'
                    ? isDark
                      ? '#EF4444'
                      : '#FCA5A5'
                    : isDark
                    ? '#F59E0B'
                    : '#FDE68A',
              },
            ]}
          >
            {item.discount_status === 'approved' ? (
              <CheckCircle size={10} color="#10B981" strokeWidth={2.5} style={{ marginRight: 3 }} />
            ) : item.discount_status === 'rejected' ? (
              <XCircle size={10} color="#EF4444" strokeWidth={2.5} style={{ marginRight: 3 }} />
            ) : (
              <Hourglass size={10} color="#F59E0B" strokeWidth={2.5} style={{ marginRight: 3 }} />
            )}
            <Text
              style={[
                styles.discountBadgeText,
                {
                  color:
                    item.discount_status === 'approved'
                      ? '#10B981'
                      : item.discount_status === 'rejected'
                      ? '#EF4444'
                      : '#D97706',
                },
              ]}
            >
              {item.discount_status === 'approved'
                ? `Disc: ₹${item.discount_amount.toLocaleString('en-IN')} (Approved)`
                : item.discount_status === 'rejected'
                ? 'Disc. Rejected'
                : `Disc: ₹${item.discount_amount.toLocaleString('en-IN')} (Pending)`}
            </Text>
          </View>
        ) : null}
      </View>

      {/* 4. Notes Summary Box */}
      {item.notes ? (
        <View
          style={[
            styles.notesContainer,
            {
              backgroundColor: isDark ? '#0B111E' : '#F8FAFC',
              borderColor: isDark ? '#1E293B' : '#F1F5F9',
            },
          ]}
        >
          <Text
            style={[
              styles.notesText,
              { color: isDark ? '#94A3B8' : '#475569' },
            ]}
            numberOfLines={2}
          >
            "{item.notes}"
          </Text>
        </View>
      ) : null}

      {/* 5. Date Tracking & Assigned Rep Row */}
      <View style={styles.metaTrackingRow}>
        <View style={styles.dateMetaLeft}>
          <View style={styles.dateBlock}>
            <Calendar size={11} color={colors.textSecondary} strokeWidth={2} />
            <Text
              style={[
                styles.dateMetaText,
                { color: colors.textSecondary, marginLeft: 3 },
              ]}
            >
              {item.follow_up_date} {item.follow_up_time || ''}
            </Text>
          </View>

          {/* Next Due Highlight */}
          <View
            style={[
              styles.dueHighlightPill,
              {
                backgroundColor: isOverdue
                  ? isDark
                    ? 'rgba(239, 68, 68, 0.15)'
                    : '#FEF2F2'
                  : isDueToday
                  ? isDark
                    ? 'rgba(245, 158, 11, 0.15)'
                    : '#FFFBEB'
                  : isDark
                  ? '#162030'
                  : '#F1F5F9',
                borderColor: isOverdue
                  ? isDark
                    ? '#EF4444'
                    : '#FCA5A5'
                  : isDueToday
                  ? isDark
                    ? '#F59E0B'
                    : '#FDE68A'
                  : isDark
                  ? '#1E293B'
                  : '#CBD5E1',
              },
            ]}
          >
            <Clock
              size={10}
              color={
                isOverdue
                  ? '#EF4444'
                  : isDueToday
                  ? '#F59E0B'
                  : colors.textSecondary
              }
              strokeWidth={2.5}
            />
            <Text
              style={[
                styles.dueHighlightText,
                {
                  color: isOverdue
                    ? '#EF4444'
                    : isDueToday
                    ? '#D97706'
                    : colors.textSecondary,
                  fontWeight: isOverdue || isDueToday ? '800' : '600',
                  marginLeft: 3,
                },
              ]}
            >
              {isOverdue ? 'Overdue: ' : isDueToday ? 'Today: ' : 'Next: '}
              {item.next_follow_up_date || 'N/A'}{' '}
              {item.next_follow_up_time || '10:00 AM'}
            </Text>
          </View>
        </View>

        {/* Assigned Rep */}
        <View style={styles.repBox}>
          <User size={11} color={colors.textSecondary} strokeWidth={2} />
          <Text
            style={[
              styles.repText,
              { color: isDark ? '#CBD5E1' : '#334155', marginLeft: 3 },
            ]}
            numberOfLines={1}
          >
            {item.rep || item.user_name || 'Admin'}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View
        style={[
          styles.divider,
          { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
        ]}
      />

      {/* 6. Action Toolbar */}
      <View style={styles.actionRow}>
        {/* Call Now Button */}
        <TouchableOpacity
          style={[styles.callBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            triggerHaptic('impactMedium');
            onCall(item.phone);
          }}
          activeOpacity={0.8}
        >
          <PhoneCall size={13} color="#FFFFFF" strokeWidth={2.2} />
          <Text style={styles.callBtnText}>Call Now</Text>
        </TouchableOpacity>

        {/* Log Action Button */}
        <TouchableOpacity
          style={[
            styles.logBtn,
            {
              backgroundColor: isDark
                ? 'rgba(189, 207, 121, 0.12)'
                : '#F5F8EE',
              borderColor: colors.primary,
            },
          ]}
          onPress={() => {
            triggerHaptic('selection');
            onLogNext(item);
          }}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.logBtnText,
              { color: isDark ? colors.primary : colors.primaryDark },
            ]}
          >
            Log Action
          </Text>
        </TouchableOpacity>

        {/* Send Quotation Button */}
        <TouchableOpacity
          style={[
            styles.quotationBtn,
            {
              backgroundColor: isDark
                ? 'rgba(59, 130, 246, 0.15)'
                : 'rgba(13, 110, 253, 0.08)',
              borderColor: isDark ? '#3B82F6' : '#93C5FD',
            },
          ]}
          onPress={() => {
            triggerHaptic('selection');
            onSendQuotation(item);
          }}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.quotationBtnText,
              { color: isDark ? '#60A5FA' : '#0D6EFD' },
            ]}
          >
            Quotation
          </Text>
        </TouchableOpacity>

        {/* 3-Dots More Menu */}
        <TouchableOpacity
          style={[
            styles.moreBtn,
            {
              backgroundColor: isDark ? '#101726' : '#F8FAFC',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
            },
          ]}
          onPress={() => {
            triggerHaptic('impactLight');
            onOpenActions(item);
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 6, right: 8 }}
        >
          <MoreVertical size={16} color={colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  customerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  avatarBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  phoneLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    flexWrap: 'wrap',
  },
  phoneClick: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  dotSep: {
    marginHorizontal: 5,
    fontSize: 10,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cityText: {
    fontSize: 11,
    fontWeight: '500',
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  vehicleRow: {
    marginTop: 8,
  },
  vehicleName: {
    fontSize: 13,
    fontWeight: '700',
  },
  brandSub: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  outcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  outcomeChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  outcomeChipText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  discountBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  notesContainer: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
  },
  notesText: {
    fontSize: 11.5,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  metaTrackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    flexWrap: 'wrap',
    gap: 6,
  },
  dateMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  dateBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateMetaText: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  dueHighlightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  dueHighlightText: {
    fontSize: 10,
  },
  repBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  repText: {
    fontSize: 11,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginTop: 10,
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  callBtn: {
    flex: 1.1,
    height: 38,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  callBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  logBtn: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  quotationBtn: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quotationBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  moreBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
