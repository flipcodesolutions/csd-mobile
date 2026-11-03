import React, { memo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Calendar,
  CheckCircle,
  Clock,
  Flame,
  Hourglass,
  MapPin,
  MoreVertical,
  Phone,
  User,
  XCircle,
} from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { FollowUpItem } from '../types';

interface FollowUpCardProps {
  item: FollowUpItem;
  onCall: (phone: string) => void;
  onLogNext?: (item: FollowUpItem) => void;
  onSendQuotation?: (item: FollowUpItem) => void;
  onViewProfile: (item: FollowUpItem) => void;
  onOpenActions: (item: FollowUpItem) => void;
  onOpenHistory?: (item: FollowUpItem) => void;
}

export const FollowUpCard: React.FC<FollowUpCardProps> = memo(({
  item,
  onCall,
  onViewProfile,
  onOpenActions,
  onOpenHistory,
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

  const isHot = item.priority === 'Hot' || !item.priority;
  const callsCount = item.calls_count || 1;

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
      {/* 1. Header: Customer Info & 3-Dots Action Button */}
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
              triggerHaptic('impactLight');
              onViewProfile(item);
            }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.avatarText,
                { color: isDark ? '#CBD5E1' : '#0D1554' },
              ]}
            >
              {initials}
            </Text>
          </TouchableOpacity>

          <View style={{ flex: 1, marginLeft: 10 }}>
            {/* Customer Name & Calls Count Badge */}
            <View style={styles.nameCallsRow}>
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('impactLight');
                  onViewProfile(item);
                }}
                activeOpacity={0.7}
                style={{ flexShrink: 1 }}
              >
                <Text
                  style={[
                    styles.customerName,
                    { color: isDark ? '#60A5FA' : '#0D1554' },
                  ]}
                  numberOfLines={1}
                >
                  {item.customer_name}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.callsPill,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                  },
                ]}
                onPress={() => {
                  triggerHaptic('selection');
                  if (onOpenHistory) {
                    onOpenHistory(item);
                  } else {
                    onViewProfile(item);
                  }
                }}
                activeOpacity={0.7}
              >
                <Clock size={10} color={isDark ? '#94A3B8' : '#64748B'} strokeWidth={2} />
                <Text
                  style={[
                    styles.callsPillText,
                    { color: isDark ? '#CBD5E1' : '#475569' },
                  ]}
                >
                  {callsCount} {callsCount === 1 ? 'Call' : 'Calls'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Phone & City Subtitle */}
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
                  <Text style={[styles.dotSep, { color: isDark ? '#334155' : '#CBD5E1' }]}>
                    •
                  </Text>
                  <View style={styles.cityRow}>
                    <MapPin
                      size={11}
                      color={isDark ? '#94A3B8' : '#64748B'}
                      strokeWidth={2}
                    />
                    <Text
                      style={[
                        styles.cityText,
                        { color: isDark ? '#94A3B8' : '#64748B', marginLeft: 2 },
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

        {/* 3-Dots Action Button */}
        <TouchableOpacity
          style={[
            styles.threeDotsBtn,
            {
              backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
              borderColor: isDark ? '#334155' : '#E2E8F0',
            },
          ]}
          onPress={() => {
            triggerHaptic('impactLight');
            onOpenActions(item);
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MoreVertical size={16} color={isDark ? '#CBD5E1' : '#475569'} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      {/* 2. Vehicle Interested Row */}
      {item.vehicle ? (
        <View
          style={[
            styles.vehicleBox,
            {
              backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
              borderColor: isDark ? '#1E293B' : '#F1F5F9',
            },
          ]}
        >
          <Text
            style={[
              styles.vehicleName,
              { color: isDark ? '#F1F5F9' : '#0F172A' },
            ]}
            numberOfLines={1}
          >
            {item.vehicle}
          </Text>
          <Text style={[styles.brandSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            {item.brand_name || 'Maruti Suzuki'}
          </Text>
        </View>
      ) : null}

      {/* 3. Last Call Outcome & Discount Row */}
      <View style={styles.outcomeRow}>
        {/* Outcome Badge */}
        <View
          style={[
            styles.outcomeChip,
            {
              backgroundColor: isDark ? 'rgba(217, 119, 6, 0.15)' : '#FEF3C7',
              borderColor: isDark ? '#D97706' : '#FDE68A',
            },
          ]}
        >
          <Phone size={10} color="#D97706" strokeWidth={2.5} style={{ marginRight: 4 }} />
          <Text style={styles.outcomeChipText}>
            {item.status || 'Interested / Call Back'}
          </Text>
        </View>

        {/* Real-time Discount Badges (Pending / Approved) */}
        {item.is_discount_requested && item.discount_amount != null ? (
          <View
            style={[
              styles.discountBadge,
              {
                backgroundColor:
                  item.discount_status === 'approved'
                    ? isDark
                      ? 'rgba(16, 185, 129, 0.15)'
                      : '#DCFCE7'
                    : item.discount_status === 'rejected'
                    ? isDark
                      ? 'rgba(239, 68, 68, 0.15)'
                      : '#FEE2E2'
                    : isDark
                    ? 'rgba(217, 119, 6, 0.15)'
                    : '#FEF3C7',
                borderColor:
                  item.discount_status === 'approved'
                    ? '#16A34A'
                    : item.discount_status === 'rejected'
                    ? '#DC2626'
                    : '#D97706',
              },
            ]}
          >
            {item.discount_status === 'approved' ? (
              <CheckCircle size={11} color="#16A34A" strokeWidth={2.5} style={{ marginRight: 3 }} />
            ) : item.discount_status === 'rejected' ? (
              <XCircle size={11} color="#DC2626" strokeWidth={2.5} style={{ marginRight: 3 }} />
            ) : (
              <Hourglass size={11} color="#D97706" strokeWidth={2.5} style={{ marginRight: 3 }} />
            )}
            <Text
              style={[
                styles.discountBadgeText,
                {
                  color:
                    item.discount_status === 'approved'
                      ? '#16A34A'
                      : item.discount_status === 'rejected'
                      ? '#DC2626'
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

      {/* 4. Notes Text (if present) */}
      {item.notes ? (
        <Text
          style={[
            styles.notesText,
            { color: isDark ? '#94A3B8' : '#64748B' },
          ]}
          numberOfLines={2}
        >
          {item.notes}
        </Text>
      ) : null}

      {/* 5. Date Tracking Row (Follow-Up Date & Next Date) */}
      <View
        style={[
          styles.metaTrackingRow,
          {
            backgroundColor: isDark ? '#0B111E' : '#F8FAFC',
            borderColor: isDark ? '#1E293B' : '#F1F5F9',
          },
        ]}
      >
        <View style={styles.dateBlock}>
          <Calendar size={11} color={isDark ? '#94A3B8' : '#475569'} strokeWidth={2} />
          <Text
            style={[
              styles.dateMetaText,
              { color: isDark ? '#CBD5E1' : '#334155', marginLeft: 4 },
            ]}
          >
            {item.follow_up_date || 'N/A'}{' '}
            {item.follow_up_time ? `• ${item.follow_up_time}` : ''}
          </Text>
        </View>

        {/* Next Due Highlight */}
        {item.next_follow_up_date ? (
          <View style={styles.nextDateBlock}>
            <Clock size={11} color="#D97706" strokeWidth={2.2} />
            <Text style={styles.nextDueText}>
              Next: {item.next_follow_up_date}{' '}
              {item.next_follow_up_time || '10:00 AM'}
            </Text>
          </View>
        ) : null}
      </View>

      {/* 6. Assigned Rep & Urgency Row */}
      <View style={styles.repUrgencyRow}>
        <View style={styles.repBox}>
          <User size={12} color={isDark ? '#94A3B8' : '#64748B'} strokeWidth={2} />
          <Text
            style={[
              styles.repText,
              { color: isDark ? '#E2E8F0' : '#1E293B', marginLeft: 4 },
            ]}
            numberOfLines={1}
          >
            {item.rep || 'Admin User (Super Admin)'}
          </Text>
        </View>

        <View
          style={[
            styles.urgencyBadge,
            {
              backgroundColor: isHot
                ? isDark
                  ? 'rgba(239, 68, 68, 0.15)'
                  : '#FEE2E2'
                : isDark
                ? 'rgba(245, 158, 11, 0.15)'
                : '#FEF3C7',
              borderColor: isHot ? '#DC2626' : '#D97706',
            },
          ]}
        >
          <Flame
            size={11}
            color={isHot ? '#DC2626' : '#D97706'}
            strokeWidth={2.5}
            style={{ marginRight: 3 }}
          />
          <Text
            style={[
              styles.urgencyText,
              { color: isHot ? '#DC2626' : '#D97706' },
            ]}
          >
            {isHot ? 'High Urgency' : 'Medium Urgency'}
          </Text>
        </View>
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
    shadowColor: '#000',
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
  },
  nameCallsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  customerName: {
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  callsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    gap: 3,
  },
  callsPillText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  phoneLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  phoneClick: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dotSep: {
    marginHorizontal: 6,
    fontSize: 11,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  cityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  threeDotsBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleBox: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  vehicleName: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  brandSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  outcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 9,
  },
  outcomeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  outcomeChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  discountBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  notesText: {
    fontSize: 11.5,
    fontWeight: '500',
    fontStyle: 'italic',
    marginTop: 6,
    marginLeft: 2,
  },
  metaTrackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    flexWrap: 'wrap',
    gap: 6,
  },
  dateBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateMetaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  nextDateBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  nextDueText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  repUrgencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
  },
  repBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  repText: {
    fontSize: 12,
    fontWeight: '600',
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 12,
    borderWidth: 1,
  },
  urgencyText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
});
