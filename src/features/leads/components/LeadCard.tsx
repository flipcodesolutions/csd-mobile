import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  Award,
  Calendar,
  Check,
  Flame,
  MapPin,
  MoreVertical,
  Phone,
  Radio,
  Snowflake,
  Sun,
  User,
} from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { CustomerLead } from '../types';

interface LeadCardProps {
  item: CustomerLead;
  isSelected: boolean;
  onToggleSelect: (id: number) => void;
  onCall: (phone: string) => void;
  onOpenFollowUp: (item: CustomerLead) => void;
  onOpenConvertDeal: (item: CustomerLead) => void;
  onOpenSendQuotation: (item: CustomerLead) => void;
  onOpenQuickView: (item: CustomerLead) => void;
  onOpenEdit: (item: CustomerLead) => void;
  onOpen360: (item: CustomerLead) => void;
  onOpenActionsMenu: (item: CustomerLead) => void;
  onDelete: (id: number, name: string) => void;
}

export const LeadCard: React.FC<LeadCardProps> = React.memo(({
  item,
  isSelected,
  onToggleSelect,
  onCall,
  onOpenFollowUp,
  onOpenConvertDeal,
  onOpenSendQuotation,
  onOpenQuickView,
  onOpenEdit,
  onOpen360,
  onOpenActionsMenu,
  onDelete,
}) => {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();

  // Extract initials
  const initials = item.name
    ? item.name
        .trim()
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'LD';

  const brandName = item.brand_name || 'MARUTI SUZUKI';
  const modelVariant =
    item.model_variant ||
    `${item.model_name || 'Brezza'} ${item.variant_name || 'ZXi'}`.trim();

  // Lead Source Name (e.g. LinkedIn, Facebook, Walk-in, Website)
  const sourceTitle =
    item.source?.title ||
    item.source?.name ||
    item.source_name ||
    item.lead_source ||
    'Direct';

  const segmentShort =
    item.vehicle_segment === '2 Wheeler' ||
    (item as any).vehicle_segment_display === '2W'
      ? '2W'
      : '4W';

  const formattedDate = item.created_at
    ? item.created_at.split('T')[0]
    : '2026-10-10';

  const city = item.city || 'pune';
  const assignedRep = item.assigned_user_name || 'Admin User (Super Admin)';
  const phone = item.phone || '8555555555';

  // Priority
  const isHot = item.priority === 'Hot';
  const isWarm = item.priority === 'Warm';

  // Deal won status
  const isDealWon =
    item.is_converted ||
    item.status_name === 'Deal Won' ||
    item.status_name === 'Booked' ||
    item.status_name === 'Delivered';

  const stageDisplay = item.status_name || (isDealWon ? 'Deal Won' : 'New');

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
          borderColor: isSelected
            ? colors.primary
            : isDark
            ? '#1E293B'
            : '#E2E8F0',
        },
      ]}
    >
      {/* 1. Top Row: Checkbox, Customer Name, Badges */}
      <View style={styles.headerRow}>
        <View style={styles.identityLeft}>
          {/* Checkbox */}
          <TouchableOpacity
            style={[
              styles.checkbox,
              {
                borderColor: isSelected
                  ? colors.primary
                  : isDark
                  ? '#334155'
                  : '#CBD5E1',
                backgroundColor: isSelected
                  ? colors.primary
                  : isDark
                  ? '#101726'
                  : '#FFFFFF',
              },
            ]}
            onPress={() => {
              triggerHaptic('selection');
              onToggleSelect(item.id);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isSelected && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
          </TouchableOpacity>

          {/* Name & ID */}
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('selection');
              onOpenQuickView(item);
            }}
            activeOpacity={0.7}
            style={styles.nameTouch}
          >
            <Text
              style={[styles.customerName, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {item.name || 'CSD Beneficiary'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Priority & Status Badges */}
        <View style={styles.badgesGroup}>
          <View
            style={[
              styles.priorityBadge,
              {
                backgroundColor: isHot
                  ? isDark
                    ? 'rgba(239, 68, 68, 0.15)'
                    : '#FEF2F2'
                  : isWarm
                  ? isDark
                    ? 'rgba(245, 158, 11, 0.15)'
                    : '#FFFBEB'
                  : isDark
                  ? '#101726'
                  : '#F1F5F9',
                borderColor: isHot
                  ? isDark
                    ? 'rgba(239, 68, 68, 0.4)'
                    : '#FECDD3'
                  : isWarm
                  ? isDark
                    ? 'rgba(245, 158, 11, 0.35)'
                    : '#FDE68A'
                  : isDark
                  ? '#1E293B'
                  : '#CBD5E1',
              },
            ]}
          >
            {isHot ? (
              <Flame size={11} color={isDark ? '#F87171' : '#DC2626'} strokeWidth={2.2} />
            ) : isWarm ? (
              <Sun size={11} color={isDark ? '#FBBF24' : '#D97706'} strokeWidth={2.2} />
            ) : (
              <Snowflake size={11} color={colors.textSecondary} strokeWidth={2.2} />
            )}
            <Text
              style={[
                styles.priorityText,
                {
                  color: isHot
                    ? isDark
                      ? '#F87171'
                      : '#DC2626'
                    : isWarm
                    ? isDark
                      ? '#FBBF24'
                      : '#D97706'
                    : colors.textSecondary,
                  marginLeft: 3,
                },
              ]}
            >
              {isHot ? 'Hot' : isWarm ? 'Warm' : 'Cold'}
            </Text>
          </View>

          <View
            style={[
              styles.stageBadge,
              {
                backgroundColor: isDealWon
                  ? isDark
                    ? 'rgba(16, 185, 129, 0.15)'
                    : '#ECFDF5'
                  : isDark
                  ? '#101726'
                  : '#F1F5F9',
                borderColor: isDealWon
                  ? isDark
                    ? 'rgba(16, 185, 129, 0.35)'
                    : '#A7F3D0'
                  : isDark
                  ? '#1E293B'
                  : '#E2E8F0',
              },
            ]}
          >
            {isDealWon && (
              <Check
                size={11}
                color={isDark ? '#34D399' : '#059669'}
                strokeWidth={2.5}
                style={{ marginRight: 3 }}
              />
            )}
            <Text
              style={[
                styles.stageText,
                {
                  color: isDealWon
                    ? isDark
                      ? '#34D399'
                      : '#059669'
                    : colors.textSecondary,
                },
              ]}
              numberOfLines={1}
            >
              {stageDisplay}
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Customer Meta Row: Phone (Dialable), Location, Created Date (Very Readable) */}
      <View style={styles.customerMetaRow}>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('impactLight');
            onCall(phone);
          }}
          activeOpacity={0.7}
          style={styles.phoneClick}
        >
          <Phone size={12} color={colors.primary} strokeWidth={2.2} />
          <Text style={[styles.phoneText, { color: colors.primary, marginLeft: 4 }]}>
            {phone}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.metaDot, { color: colors.borderSubtle }]}>•</Text>

        <View style={styles.metaInline}>
          <MapPin size={12} color={colors.textSecondary} strokeWidth={2} />
          <Text style={[styles.cityText, { color: colors.textSecondary, marginLeft: 3 }]}>
            {city}
          </Text>
        </View>

        <Text style={[styles.metaDot, { color: colors.borderSubtle }]}>•</Text>

        <View style={styles.metaInline}>
          <Calendar size={12} color={colors.textSecondary} strokeWidth={2} />
          <Text style={[styles.dateText, { color: colors.textSecondary, marginLeft: 3 }]}>
            {formattedDate}
          </Text>
        </View>
      </View>

      {/* 3. Vehicle Requirement & Lead Source Row */}
      <View style={styles.vehicleRequirementRow}>
        <Text
          style={[styles.vehicleModelName, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {modelVariant}
        </Text>

        <View style={styles.tagsContainer}>
          {/* Brand Tag */}
          <View
            style={[
              styles.brandTag,
              {
                backgroundColor: isDark ? '#1E293B' : '#E8EDF5',
              },
            ]}
          >
            <Text
              style={[styles.brandTagText, { color: colors.textPrimary }]}
            >
              {brandName}
            </Text>
          </View>

          {/* Lead Source Badge */}
          <View
            style={[
              styles.sourceTag,
              {
                backgroundColor: isDark ? '#0D1525' : '#1E293B',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              },
            ]}
          >
            <Radio size={10} color="#38BDF8" strokeWidth={2.2} />
            <Text style={styles.sourceTagText}>{sourceTitle}</Text>
          </View>

          {/* 4W / 2W Tag */}
          <View
            style={[
              styles.segmentTag,
              {
                backgroundColor: isDark ? '#101726' : '#F1F5F9',
                borderColor: isDark ? '#1E293B' : '#CBD5E1',
              },
            ]}
          >
            <Text style={[styles.segmentTagText, { color: colors.primary }]}>
              {segmentShort}
            </Text>
          </View>
        </View>
      </View>

      {/* 4. Assigned Rep Row */}
      <View style={styles.assignRow}>
        <Text style={[styles.assignLabel, { color: colors.textSecondary }]}>
          Assign To:
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
          <User size={12} color={colors.textSecondary} strokeWidth={2} />
          <Text
            style={[styles.assignUserText, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {assignedRep}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View
        style={[
          styles.cardDivider,
          { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
        ]}
      />

      {/* 5. Action Buttons Toolbar */}
      <View style={styles.actionToolbar}>
        {/* 1. Call Now Button (Army Olive Logo Themed) */}
        <TouchableOpacity
          style={[styles.callBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            triggerHaptic('impactMedium');
            onCall(phone);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.callBtnText}>Call Now</Text>
        </TouchableOpacity>

        {/* 2. Log Follow-Up Button */}
        <TouchableOpacity
          style={[
            styles.followUpBtn,
            {
              backgroundColor: isDark
                ? 'rgba(189, 207, 121, 0.12)'
                : '#F5F8EE',
              borderColor: colors.primary,
            },
          ]}
          onPress={() => {
            triggerHaptic('selection');
            onOpenFollowUp(item);
          }}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.followUpBtnText,
              { color: isDark ? colors.primary : colors.primaryDark },
            ]}
          >
            Follow-Up
          </Text>
        </TouchableOpacity>

        {/* 3. Send Quotation Button */}
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
            onOpenSendQuotation(item);
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

        {/* 4. Convert Deal Quick Icon */}
        <TouchableOpacity
          style={[
            styles.quickIconBtn,
            {
              backgroundColor: isDark
                ? 'rgba(16, 185, 129, 0.15)'
                : 'rgba(21, 128, 61, 0.08)',
              borderColor: isDark ? '#10B981' : '#86EFAC',
            },
          ]}
          onPress={() => {
            triggerHaptic('impactLight');
            onOpenConvertDeal(item);
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
        >
          <Award size={16} color={isDark ? '#34D399' : '#16A34A'} strokeWidth={2.2} />
        </TouchableOpacity>

        {/* 5. More Actions Sheet Trigger (3-dots) */}
        <TouchableOpacity
          style={[
            styles.quickIconBtn,
            {
              backgroundColor: isDark ? '#101726' : '#F8FAFC',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
            },
          ]}
          onPress={() => {
            triggerHaptic('impactLight');
            onOpenActionsMenu(item);
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
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  identityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
    marginTop: -1,
  },
  actionMenuBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionMenuDots: {
    fontSize: 16,
    fontWeight: '900',
    includeFontPadding: false,
    lineHeight: 18,
    textAlign: 'center',
  },
  nameTouch: {
    flex: 1,
  },
  customerName: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
    includeFontPadding: false,
  },
  badgesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '800',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  stageBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  stageText: {
    fontSize: 12,
    fontWeight: '700',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  customerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 7,
  },
  phoneClick: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 1,
  },
  metaInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneText: {
    fontSize: 14,
    fontWeight: '700',
    includeFontPadding: false,
  },
  metaDot: {
    fontSize: 13,
  },
  cityText: {
    fontSize: 13.5,
    fontWeight: '600',
    includeFontPadding: false,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '500',
    includeFontPadding: false,
  },
  vehicleRequirementRow: {
    marginTop: 9,
  },
  vehicleModelName: {
    fontSize: 15,
    fontWeight: '800',
    includeFontPadding: false,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 5,
    flexWrap: 'wrap',
  },
  brandTag: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 5,
  },
  brandTagText: {
    fontSize: 12,
    fontWeight: '700',
    includeFontPadding: false,
  },
  sourceTag: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 5,
  },
  sourceTagText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
    includeFontPadding: false,
  },
  segmentTag: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 4,
    borderWidth: 1,
  },
  segmentTagText: {
    fontSize: 11,
    fontWeight: '800',
    includeFontPadding: false,
  },
  assignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  assignLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  assignUserText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  cardDivider: {
    height: 1,
    marginVertical: 10,
  },
  actionToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  callBtn: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  callBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 15,
    includeFontPadding: false,
    textAlignVertical: 'center',
    textAlign: 'center',
  },
  followUpBtn: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 4,
  },
  followUpBtnText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 15,
    includeFontPadding: false,
    textAlignVertical: 'center',
    textAlign: 'center',
  },
  quotationBtn: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 4,
  },
  quotationBtnText: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 15,
    includeFontPadding: false,
    textAlignVertical: 'center',
    textAlign: 'center',
  },
  quickIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickIconSymbol: {
    fontSize: 15,
    includeFontPadding: false,
    textAlignVertical: 'center',
    textAlign: 'center',
  },
});
