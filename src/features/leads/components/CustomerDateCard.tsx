import React from 'react';
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Calendar,
  Car,
  Check,
  Flame,
  Heart,
  MapPin,
  Phone,
  Save,
  Snowflake,
  Sun,
  X,
  Cake,
} from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { CustomerLead } from '../types';

interface CustomerDateCardProps {
  item: CustomerLead;
  index?: number;
  draftBirthDate: string | null;       // YYYY-MM-DD or null
  draftAnniversaryDate: string | null; // YYYY-MM-DD or null
  isSaving?: boolean;
  onPickBirthDate: (lead: CustomerLead) => void;
  onPickAnniversaryDate: (lead: CustomerLead) => void;
  onClearBirthDate: (lead: CustomerLead) => void;
  onClearAnniversaryDate: (lead: CustomerLead) => void;
  onSaveDates: (lead: CustomerLead) => void;
  onCall?: (phone: string) => void;
}

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const formatToDisplayDate = (isoStr: string | null | undefined): string => {
  if (!isoStr) return '';
  try {
    const raw = isoStr.split('T')[0];
    const parts = raw.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return raw;
  } catch {
    return isoStr || '';
  }
};

export const formatToHumanReadable = (
  isoStr: string | null | undefined,
  type: 'dob' | 'anniversary'
): { label: string; isSet: boolean } => {
  if (!isoStr) {
    return { label: 'Not Set', isSet: false };
  }
  try {
    const raw = isoStr.split('T')[0];
    const parts = raw.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[2], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const year = parts[0];
      const monthName = MONTHS_SHORT[monthIdx] || parts[1];
      const prefix = type === 'dob' ? '🎂 ' : '💍 ';
      return { label: `${prefix}${day} ${monthName} ${year}`, isSet: true };
    }
    return { label: isoStr, isSet: true };
  } catch {
    return { label: isoStr || 'Not Set', isSet: !!isoStr };
  }
};

export const CustomerDateCard: React.FC<CustomerDateCardProps> = React.memo(({
  item,
  index,
  draftBirthDate,
  draftAnniversaryDate,
  isSaving = false,
  onPickBirthDate,
  onPickAnniversaryDate,
  onClearBirthDate,
  onClearAnniversaryDate,
  onSaveDates,
  onCall,
}) => {
  const { colors, isDark } = useTheme();

  // Initial values from lead
  const initialBirth = (item.birth_date || item.birthday || '').split('T')[0] || null;
  const initialAnniv = (item.anniversary_date || '').split('T')[0] || null;

  // Check if dates have unsaved changes
  const hasChanges =
    (draftBirthDate || null) !== initialBirth ||
    (draftAnniversaryDate || null) !== initialAnniv;

  // Display texts
  const displayDob = formatToDisplayDate(draftBirthDate);
  const displayAnniv = formatToDisplayDate(draftAnniversaryDate);
  const readableDob = formatToHumanReadable(draftBirthDate, 'dob');
  const readableAnniv = formatToHumanReadable(draftAnniversaryDate, 'anniversary');

  // Priority metadata
  const priority = item.priority || 'Hot';
  const getPriorityBadge = () => {
    switch (priority) {
      case 'Hot':
        return {
          icon: <Flame size={11} color="#DC2626" strokeWidth={2.5} />,
          text: 'Hot',
          bg: isDark ? '#451212' : '#FEE2E2',
          color: '#DC2626',
        };
      case 'Warm':
        return {
          icon: <Sun size={11} color="#D97706" strokeWidth={2.5} />,
          text: 'Warm',
          bg: isDark ? '#452A0A' : '#FEF3C7',
          color: '#D97706',
        };
      case 'Cold':
      default:
        return {
          icon: <Snowflake size={11} color="#0284C7" strokeWidth={2.5} />,
          text: 'Cold',
          bg: isDark ? '#0C3554' : '#E0F2FE',
          color: '#0284C7',
        };
    }
  };

  // Status metadata
  const statusRaw = (item.status_name || item.lead_status || 'New').toLowerCase();
  const getStatusBadge = () => {
    if (statusRaw.includes('deal') || statusRaw.includes('booking') || statusRaw.includes('won') || item.is_converted) {
      return { label: item.status_name || 'Booking Confirmed', bg: isDark ? '#144622' : '#DCFCE7', color: '#16A34A' };
    }
    if (statusRaw.includes('lost')) {
      return { label: 'Lost', bg: isDark ? '#451212' : '#FEE2E2', color: '#DC2626' };
    }
    if (statusRaw.includes('follow')) {
      return { label: 'Follow-up', bg: isDark ? '#452A0A' : '#FEF3C7', color: '#D97706' };
    }
    if (statusRaw.includes('quote') || statusRaw.includes('quotation')) {
      return { label: 'Quotation Sent', bg: isDark ? '#1E2254' : '#E0E7FF', color: '#4F46E5' };
    }
    return { label: item.status_name || 'New Lead', bg: isDark ? '#1E293B' : '#F1F5F9', color: colors.textSecondary };
  };

  const priorityMeta = getPriorityBadge();
  const statusMeta = getStatusBadge();

  const handleCall = () => {
    triggerHaptic('impactLight');
    if (onCall) {
      onCall(item.phone);
    } else {
      Linking.openURL(`tel:${item.phone}`).catch(() => {});
    }
  };

  const locationText = [item.city || item.home_town, item.posting ? `Posting: ${item.posting}` : null]
    .filter(Boolean)
    .join(' • ') || 'Location N/A';

  const vehicleRequirement =
    item.model_variant ||
    [item.brand_name, item.model_name, item.variant_name].filter(Boolean).join(' ') ||
    'Vehicle requirement not specified';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
          borderColor: hasChanges
            ? '#58632A'
            : isDark
              ? '#1E293B'
              : '#E2E8F0',
        },
        hasChanges && styles.cardModified,
      ]}
    >
      {/* --------------------------------------------------------- */}
      {/* ROW 1: Customer Name, Priority & Status                  */}
      {/* --------------------------------------------------------- */}
      <View style={styles.rowHeader}>
        <View style={styles.nameSection}>
          <Text
            style={[styles.customerName, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {item.name || 'Unknown Customer'}
          </Text>
        </View>

        <View style={styles.badgesRow}>
          {/* Priority Badge */}
          <View style={[styles.badgePill, { backgroundColor: priorityMeta.bg }]}>
            {priorityMeta.icon}
            <Text style={[styles.badgePillText, { color: priorityMeta.color }]}>
              {priorityMeta.text}
            </Text>
          </View>

          {/* Status Badge */}
          <View style={[styles.badgePill, { backgroundColor: statusMeta.bg }]}>
            <Text style={[styles.badgePillText, { color: statusMeta.color }]}>
              {statusMeta.label}
            </Text>
          </View>
        </View>
      </View>

      {/* --------------------------------------------------------- */}
      {/* ROW 2: Contact Phone (Click to Call) & Location / Posting */}
      {/* --------------------------------------------------------- */}
      <View style={styles.rowContact}>
        <TouchableOpacity
          style={styles.phoneGroup}
          onPress={handleCall}
          activeOpacity={0.7}
        >
          <Phone size={12} color="#0D1554" strokeWidth={2.4} />
          <Text style={styles.phoneText}>{item.phone || 'No phone'}</Text>
        </TouchableOpacity>

        <Text style={styles.dotDivider}>•</Text>

        <View style={styles.locationGroup}>
          <MapPin size={12} color={colors.textSecondary} strokeWidth={2} />
          <Text
            style={[styles.locationText, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {locationText}
          </Text>
        </View>
      </View>

      {/* --------------------------------------------------------- */}
      {/* ROW 3: Vehicle Segment & Requirement                      */}
      {/* --------------------------------------------------------- */}
      <View style={styles.rowVehicle}>
        <Car size={13} color={colors.textSecondary} strokeWidth={2} />
        <Text
          style={[styles.vehicleText, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {vehicleRequirement}
        </Text>
      </View>

      {/* --------------------------------------------------------- */}
      {/* ROW 4: Birth Date, Anniversary Date & Action in One Line  */}
      {/* --------------------------------------------------------- */}
      <View style={styles.rowDatesAction}>
        {/* Left Column: Birth Date (DOB) */}
        <View style={styles.dateColumn}>
          <View style={styles.dateLabelRow}>
            <Cake size={11} color="#E11D48" strokeWidth={2.4} />
            <Text style={styles.dateLabelText}>BIRTH DATE (DOB)</Text>
          </View>

          <TouchableOpacity
            onPress={() => {
              triggerHaptic('selection');
              onPickBirthDate(item);
            }}
            activeOpacity={0.8}
            style={[
              styles.dateInputBox,
              readableDob.isSet ? styles.dateInputBoxSetDob : styles.dateInputBoxEmptyDob,
              {
                backgroundColor: readableDob.isSet
                  ? isDark
                    ? '#1E293B'
                    : '#FFFFFF'
                  : isDark
                    ? '#261318'
                    : '#FFF5F5',
                borderColor: readableDob.isSet
                  ? '#CBD5E1'
                  : isDark
                    ? '#45161C'
                    : '#FED7D7',
              },
            ]}
          >
            <Text
              style={[
                styles.dateValueText,
                {
                  color: readableDob.isSet
                    ? colors.textPrimary
                    : colors.textSecondary,
                  fontWeight: readableDob.isSet ? '700' : '400',
                },
              ]}
              numberOfLines={1}
            >
              {displayDob || 'dd/mm/yyyy'}
            </Text>

            <View style={styles.dateIconGroup}>
              {readableDob.isSet ? (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    triggerHaptic('selection');
                    onClearBirthDate(item);
                  }}
                  style={styles.clearMiniBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={12} color="#64748B" strokeWidth={2.5} />
                </TouchableOpacity>
              ) : null}
              <Calendar
                size={14}
                color={readableDob.isSet ? '#58632A' : '#E11D48'}
                strokeWidth={2}
              />
            </View>
          </TouchableOpacity>

          {/* Subtext status badge */}
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: readableDob.isSet
                  ? isDark
                    ? '#14331E'
                    : '#E8F5E9'
                  : isDark
                    ? '#3B1317'
                    : '#FFEBEE',
              },
            ]}
          >
            <Text
              style={[
                styles.statusPillText,
                {
                  color: readableDob.isSet
                    ? '#2E7D32'
                    : '#C62828',
                },
              ]}
              numberOfLines={1}
            >
              {readableDob.isSet ? readableDob.label : 'ⓘ Not Set'}
            </Text>
          </View>
        </View>

        {/* Right Column: Anniversary Date */}
        <View style={styles.dateColumn}>
          <View style={styles.dateLabelRow}>
            <Heart size={11} color="#2563EB" strokeWidth={2.4} />
            <Text style={styles.dateLabelText}>ANNIVERSARY DATE</Text>
          </View>

          <TouchableOpacity
            onPress={() => {
              triggerHaptic('selection');
              onPickAnniversaryDate(item);
            }}
            activeOpacity={0.8}
            style={[
              styles.dateInputBox,
              readableAnniv.isSet ? styles.dateInputBoxSetAnniv : styles.dateInputBoxEmptyAnniv,
              {
                backgroundColor: readableAnniv.isSet
                  ? isDark
                    ? '#1E293B'
                    : '#FFFFFF'
                  : isDark
                    ? '#101F38'
                    : '#F0F7FF',
                borderColor: readableAnniv.isSet
                  ? '#CBD5E1'
                  : isDark
                    ? '#1E3A5F'
                    : '#BAE6FD',
              },
            ]}
          >
            <Text
              style={[
                styles.dateValueText,
                {
                  color: readableAnniv.isSet
                    ? colors.textPrimary
                    : colors.textSecondary,
                  fontWeight: readableAnniv.isSet ? '700' : '400',
                },
              ]}
              numberOfLines={1}
            >
              {displayAnniv || 'dd/mm/yyyy'}
            </Text>

            <View style={styles.dateIconGroup}>
              {readableAnniv.isSet ? (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    triggerHaptic('selection');
                    onClearAnniversaryDate(item);
                  }}
                  style={styles.clearMiniBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={12} color="#64748B" strokeWidth={2.5} />
                </TouchableOpacity>
              ) : null}
              <Calendar
                size={14}
                color={readableAnniv.isSet ? '#58632A' : '#2563EB'}
                strokeWidth={2}
              />
            </View>
          </TouchableOpacity>

          {/* Subtext status badge */}
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: readableAnniv.isSet
                  ? isDark
                    ? '#10223D'
                    : '#E8F1FC'
                  : isDark
                    ? '#101F38'
                    : '#F0F7FF',
              },
            ]}
          >
            <Text
              style={[
                styles.statusPillText,
                {
                  color: readableAnniv.isSet
                    ? '#1D4ED8'
                    : '#0284C7',
                },
              ]}
              numberOfLines={1}
            >
              {readableAnniv.isSet ? readableAnniv.label : 'ⓘ Not Set'}
            </Text>
          </View>
        </View>

        {/* Action Column: Save Button Only (No View Button!) */}
        <View style={styles.actionColumn}>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('impactMedium');
              onSaveDates(item);
            }}
            disabled={isSaving}
            activeOpacity={0.8}
            style={[
              styles.actionSaveBtn,
              hasChanges ? styles.actionSaveBtnActive : styles.actionSaveBtnDefault,
              {
                backgroundColor: hasChanges
                  ? '#58632A'
                  : isDark
                    ? '#1E293B'
                    : '#F1F5F9',
                borderColor: hasChanges
                  ? '#58632A'
                  : isDark
                    ? '#334155'
                    : '#CBD5E1',
              },
            ]}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={hasChanges ? '#FFFFFF' : '#58632A'} />
            ) : hasChanges ? (
              <>
                <Save size={16} color="#FFFFFF" strokeWidth={2.4} />
                <Text style={styles.saveBtnTextActive}>Save</Text>
              </>
            ) : (
              <Save size={16} color={colors.textSecondary} strokeWidth={2.2} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 13,
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    gap: 9,
  },
  cardModified: {
    borderWidth: 1.5,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  indexBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  indexText: {
    fontSize: 11,
    fontWeight: '800',
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  rowContact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  phoneGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phoneText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0D1554',
  },
  dotDivider: {
    fontSize: 11,
    color: '#94A3B8',
  },
  locationGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  locationText: {
    fontSize: 12,
  },
  rowVehicle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vehicleText: {
    fontSize: 12,
    fontWeight: '500',
  },
  rowDatesAction: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 2,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  dateColumn: {
    flex: 1,
    gap: 4,
  },
  dateLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateLabelText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  dateInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 34,
  },
  dateInputBoxEmptyDob: {
    borderStyle: 'dashed',
  },
  dateInputBoxSetDob: {},
  dateInputBoxEmptyAnniv: {
    borderStyle: 'dashed',
  },
  dateInputBoxSetAnniv: {},
  dateValueText: {
    fontSize: 12,
    letterSpacing: -0.2,
  },
  dateIconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearMiniBtn: {
    padding: 2,
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 5,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  actionColumn: {
    justifyContent: 'flex-start',
    paddingTop: 16,
  },
  actionSaveBtn: {
    width: 36,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  actionSaveBtnActive: {
    width: 58,
    paddingHorizontal: 6,
    shadowColor: '#58632A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  actionSaveBtnDefault: {},
  saveBtnTextActive: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

