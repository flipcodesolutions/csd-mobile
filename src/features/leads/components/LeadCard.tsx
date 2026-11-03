import React from 'react';
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Calendar,
  Check,
  FileText,
  Flame,
  MapPin,
  MessageCircle,
  MoreVertical,
  Phone,
  Radio,
  Repeat,
  Snowflake,
  Sun,
  Tag,
  User,
} from 'lucide-react-native';
import { triggerHaptic } from '../../../core/utils/haptics';
import { CustomerLead } from '../types';

const THEME = {
  primaryNavy: '#0D1554',
  cardBg: '#FFFFFF',
  border: '#E5E7EB',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  danger: '#DC2626',
  dangerBg: '#FEE2E2',
  warning: '#D97706',
  warningBg: '#FEF3C7',
  success: '#16A34A',
  successBg: '#DCFCE7',
  info: '#4F46E5',
  infoBg: '#E0E7FF',
  cold: '#0284C7',
  coldBg: '#E0F2FE',
};

interface LeadCardProps {
  item: CustomerLead;
  isSelected?: boolean;
  onToggleSelect?: (id: number) => void;
  onCall?: (phone: string) => void;
  onOpenFollowUp?: (item: CustomerLead) => void;
  onOpenConvertDeal?: (item: CustomerLead) => void;
  onOpenSendQuotation?: (item: CustomerLead) => void;
  onOpenQuickView?: (item: CustomerLead) => void;
  onOpenEdit?: (item: CustomerLead) => void;
  onOpen360?: (item: CustomerLead) => void;
  onOpenActionsMenu?: (item: CustomerLead) => void;
  onDelete?: (id: number, name: string) => void;
}

export const LeadCard: React.FC<LeadCardProps> = React.memo(({
  item,
  isSelected = false,
  onToggleSelect,
  onCall,
  onOpenFollowUp,
  onOpenSendQuotation,
  onOpenQuickView,
  onOpenActionsMenu,
}) => {
  // Check Birthday / Anniversary Today
  const checkIsToday = (dateStr?: string) => {
    if (!dateStr) return false;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;
      const today = new Date();
      return d.getDate() === today.getDate() && d.getMonth() === today.getMonth();
    } catch {
      return false;
    }
  };

  const isBdayToday = checkIsToday(item.birth_date || item.birthday);
  const isAnnivToday = checkIsToday(item.anniversary_date);

  // Formatted Created Date (e.g. 10 Oct 2026 or YYYY-MM-DD)
  const formattedDate = item.created_at
    ? item.created_at.split('T')[0]
    : 'Recent';

  // Priority styling
  const priority = item.priority || 'Hot';
  const getPriorityBadge = () => {
    switch (priority) {
      case 'Hot':
        return {
          icon: <Flame size={11} color="#DC2626" strokeWidth={2.5} />,
          text: 'Hot',
          bg: THEME.dangerBg,
          color: THEME.danger,
        };
      case 'Warm':
        return {
          icon: <Sun size={11} color="#D97706" strokeWidth={2.5} />,
          text: 'Warm',
          bg: THEME.warningBg,
          color: THEME.warning,
        };
      case 'Cold':
      default:
        return {
          icon: <Snowflake size={11} color="#0284C7" strokeWidth={2.5} />,
          text: 'Cold',
          bg: THEME.coldBg,
          color: THEME.cold,
        };
    }
  };

  // Status badge styling
  const statusRaw = (item.status_name || item.lead_status || 'New').toLowerCase();
  const getStatusBadge = () => {
    if (statusRaw.includes('deal') || statusRaw.includes('booking') || statusRaw.includes('won') || item.is_converted) {
      return { label: item.status_name || 'Deal Won', bg: THEME.successBg, color: THEME.success };
    }
    if (statusRaw.includes('lost')) {
      return { label: 'Lost', bg: THEME.dangerBg, color: THEME.danger };
    }
    if (statusRaw.includes('follow')) {
      return { label: 'Follow-up', bg: THEME.warningBg, color: THEME.warning };
    }
    if (statusRaw.includes('quote') || statusRaw.includes('quotation')) {
      return { label: 'Quotation Sent', bg: THEME.infoBg, color: THEME.info };
    }
    return { label: 'New', bg: THEME.infoBg, color: THEME.info };
  };

  const priorityMeta = getPriorityBadge();
  const statusMeta = getStatusBadge();

  // Native Call Handler
  const handleCall = () => {
    triggerHaptic('impactLight');
    if (onCall) {
      onCall(item.phone);
    } else {
      Linking.openURL(`tel:${item.phone}`).catch(() => {});
    }
  };

  // WhatsApp Handler
  const handleWhatsApp = () => {
    triggerHaptic('impactLight');
    const cleanPhone = (item.phone || '').replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('91') && cleanPhone.length === 12
      ? cleanPhone
      : `91${cleanPhone}`;
    const url = `whatsapp://send?phone=${phoneWithCountry}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(`https://wa.me/${phoneWithCountry}`);
        }
      })
      .catch(() => {
        Linking.openURL(`https://wa.me/${phoneWithCountry}`);
      });
  };

  // Follow-up Handler
  const handleFollowUp = () => {
    triggerHaptic('selection');
    if (onOpenFollowUp) {
      onOpenFollowUp(item);
    }
  };

  // Quote Handler
  const handleQuote = () => {
    triggerHaptic('selection');
    if (onOpenSendQuotation) {
      onOpenSendQuotation(item);
    }
  };

  const locationText = `${item.city || item.home_town || 'Ahmedabad'} • Posting: ${item.posting || 'N/A'}`;
  const brandName = item.brand_name || 'MARUTI SUZUKI';
  const vehicleText = item.model_variant || 'Vehicle Requirement';
  const sourceName = item.source?.title || item.source?.name || item.source_name || item.lead_source || 'Direct';
  const isDiscountPending = item.discount_approval_status === 'pending' || Number(item.requested_discount || 0) > 0;

  return (
    <View style={[styles.card, isSelected && styles.cardSelected]}>
      {/* ----------------------------------------------------------- */}
      {/* ROW 1: Header (Name, Bday/Anniv Pill, Priority, Status)     */}
      {/* ----------------------------------------------------------- */}
      <View style={styles.row1Header}>
        <View style={styles.row1Left}>
          {onToggleSelect && (
            <TouchableOpacity
              style={[styles.checkbox, isSelected && styles.checkboxSelected]}
              onPress={() => {
                triggerHaptic('selection');
                onToggleSelect(item.id);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {isSelected && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => {
              if (onOpenQuickView) {
                triggerHaptic('selection');
                onOpenQuickView(item);
              }
            }}
            activeOpacity={0.7}
            style={styles.nameContainer}
          >
            <Text style={styles.customerName} numberOfLines={1}>
              {item.name || 'Customer'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row1Badges}>
          {/* Birthday / Anniversary Pill */}
          {isBdayToday && (
            <View style={styles.celebrationPill}>
              <Text style={styles.celebrationPillText}>🎂 Birthday Today</Text>
            </View>
          )}
          {isAnnivToday && !isBdayToday && (
            <View style={styles.celebrationPill}>
              <Text style={styles.celebrationPillText}>💐 Anniversary Today</Text>
            </View>
          )}

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

          {/* 3-Dots Menu Button */}
          <TouchableOpacity
            style={styles.dotsButton}
            onPress={() => {
              triggerHaptic('impactLight');
              if (onOpenActionsMenu) {
                onOpenActionsMenu(item);
              }
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.6}
          >
            <MoreVertical size={18} color={THEME.textPrimary} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ----------------------------------------------------------- */}
      {/* ROW 2: Contact & Location                                   */}
      {/* ----------------------------------------------------------- */}
      <View style={styles.row2Contact}>
        <TouchableOpacity
          style={styles.phoneGroup}
          onPress={handleCall}
          activeOpacity={0.7}
        >
          <Phone size={12} color={THEME.primaryNavy} strokeWidth={2.4} />
          <Text style={styles.phoneText}>{item.phone}</Text>
        </TouchableOpacity>

        <Text style={styles.dotDivider}>•</Text>

        <View style={styles.locationGroup}>
          <MapPin size={12} color={THEME.textSecondary} strokeWidth={2} />
          <Text style={styles.locationText} numberOfLines={1}>
            {locationText}
          </Text>
        </View>
      </View>

      {/* ----------------------------------------------------------- */}
      {/* ROW 3: Vehicle, Brand, Source & Discount Pending Badge     */}
      {/* ----------------------------------------------------------- */}
      <View style={styles.row3Vehicle}>
        <Text style={styles.vehicleName} numberOfLines={1}>
          {vehicleText}
        </Text>

        <View style={styles.vehicleMetaPills}>
          {/* Brand Pill */}
          <View style={styles.brandPill}>
            <Text style={styles.brandPillText}>{brandName}</Text>
          </View>

          {/* Source Pill */}
          <View style={styles.sourcePill}>
            <Radio size={10} color="#38BDF8" strokeWidth={2.2} />
            <Text style={styles.sourcePillText}>{sourceName}</Text>
          </View>

          {/* Discount Pending Badge (If applicable) */}
          {isDiscountPending && (
            <View style={styles.discountPendingPill}>
              <Tag size={10} color={THEME.warning} strokeWidth={2.4} />
              <Text style={styles.discountPendingText}>
                🏷️ Discount Pending (₹{Number(item.requested_discount || 0).toLocaleString('en-IN')})
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* ----------------------------------------------------------- */}
      {/* ROW 4: Meta & Assignment (Assigned To & Created Date)        */}
      {/* ----------------------------------------------------------- */}
      <View style={styles.row4Meta}>
        <View style={styles.metaItem}>
          <User size={12} color={THEME.textSecondary} strokeWidth={2} />
          <Text style={styles.metaText} numberOfLines={1}>
            Assigned: <Text style={styles.metaTextHighlight}>{item.assigned_user_name || 'Unassigned'}</Text>
          </Text>
        </View>

        <Text style={styles.dotDivider}>•</Text>

        <View style={styles.metaItem}>
          <Calendar size={12} color={THEME.textSecondary} strokeWidth={2} />
          <Text style={styles.metaText}>{formattedDate}</Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 10,
  },
  cardSelected: {
    borderColor: THEME.primaryNavy,
    backgroundColor: '#F8FAFC',
  },

  // Row 1: Header
  row1Header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row1Left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxSelected: {
    backgroundColor: THEME.primaryNavy,
    borderColor: THEME.primaryNavy,
  },
  nameContainer: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.primaryNavy,
    letterSpacing: -0.2,
  },
  row1Badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  celebrationPill: {
    backgroundColor: '#FDF2F8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCE7F3',
  },
  celebrationPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DB2777',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dotsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },

  // Row 2: Contact
  row2Contact: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  phoneGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phoneText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.primaryNavy,
  },
  dotDivider: {
    fontSize: 12,
    color: THEME.textMuted,
  },
  locationGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 1,
  },
  locationText: {
    fontSize: 12,
    color: THEME.textSecondary,
    fontWeight: '500',
  },

  // Row 3: Vehicle & Pills
  row3Vehicle: {
    gap: 6,
  },
  vehicleName: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.textPrimary,
  },
  vehicleMetaPills: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  brandPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  brandPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.textPrimary,
  },
  sourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sourcePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  discountPendingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.warningBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountPendingText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.warning,
  },

  // Row 4: Meta
  row4Meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: THEME.textSecondary,
  },
  metaTextHighlight: {
    fontWeight: '700',
    color: THEME.textPrimary,
  },

  // Separator
  separator: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 2,
  },

  // Row 5: Actions
  row5Actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  callActionBtn: {
    backgroundColor: THEME.primaryNavy,
    borderColor: THEME.primaryNavy,
  },
  callActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  whatsappActionBtn: {
    backgroundColor: THEME.successBg,
    borderColor: '#BBF7D0',
  },
  whatsappActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.success,
  },
  followUpActionBtn: {
    backgroundColor: '#FFFFFF',
    borderColor: THEME.border,
  },
  followUpActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.primaryNavy,
  },
  quoteActionBtn: {
    backgroundColor: THEME.infoBg,
    borderColor: '#C7D2FE',
  },
  quoteActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.info,
  },
});
