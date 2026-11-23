import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Clock,
  Mail,
  Phone,
  Tag,
  Trash2,
} from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { ContactInquiry } from '../types';

interface ContactInquiryCardProps {
  item: ContactInquiry;
  index?: number;
  onPress: (item: ContactInquiry) => void;
  onDelete: (item: ContactInquiry) => void;
  onCall?: (phone: string) => void;
  onEmail?: (email: string, subject?: string) => void;
  onWhatsApp?: (phone: string, name?: string) => void;
}

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Format timestamp (e.g. "2026-11-21T17:04:00" -> "21 Nov 2026, 17:04")
 */
export const formatInquiryDate = (dateStr?: string | null): string => {
  if (!dateStr) return 'Recent';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      // Fallback manual split
      const [datePart, timePart] = dateStr.split(' ');
      if (datePart) return datePart;
      return dateStr;
    }
    const day = d.getDate();
    const month = MONTHS_SHORT[d.getMonth()] || '';
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${mins}`;
  } catch {
    return dateStr || 'Recent';
  }
};

/**
 * Generate 2-letter initials for avatar
 */
const getInitials = (name?: string): string => {
  if (!name || !name.trim()) return 'CI';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export const ContactInquiryCard: React.FC<ContactInquiryCardProps> = React.memo(({
  item,
  onPress,
  onCall,
  onEmail,
  onDelete,
}) => {
  const { colors, isDark } = useTheme();

  const initials = getInitials(item.name);
  const formattedDate = formatInquiryDate(item.created_at);

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPress(item)}
      style={[
        styles.cardContainer,
        {
          backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
          borderColor: isDark ? '#1E293B' : '#E2E8F0',
        },
      ]}
    >
      {/* 1. Header: Avatar + Name + Date */}
      <View style={styles.headerRow}>
        {/* Initials Avatar */}
        <View
          style={[
            styles.avatarCircle,
            {
              backgroundColor: isDark ? '#232D14' : '#EEF2E6',
            },
          ]}
        >
          <Text
            style={[
              styles.avatarText,
              { color: '#58632A' },
            ]}
          >
            {initials}
          </Text>
        </View>

        {/* Sender Info */}
        <View style={styles.senderInfo}>
          <Text
            style={[
              styles.senderName,
              { color: colors.textPrimary },
            ]}
            numberOfLines={1}
          >
            {item.name || 'Anonymous Inquiry'}
          </Text>

          {/* Timestamp */}
          <View style={styles.timeRow}>
            <Clock size={12} color={colors.textSecondary} strokeWidth={2} />
            <Text style={[styles.timeText, { color: colors.textSecondary }]}>
              {formattedDate}
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Contact Details (Phone & Email) */}
      <View style={styles.contactDetailsBox}>
        {Boolean(item.phone) && (
          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => onCall?.(item.phone)}
            activeOpacity={0.7}
          >
            <Phone size={13} color="#58632A" strokeWidth={2.2} />
            <Text style={[styles.contactText, { color: colors.textPrimary }]} numberOfLines={1}>
              {item.phone}
            </Text>
          </TouchableOpacity>
        )}

        {Boolean(item.email) && (
          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => onEmail?.(item.email, item.subject)}
            activeOpacity={0.7}
          >
            <Mail size={13} color="#2563EB" strokeWidth={2.2} />
            <Text style={[styles.contactText, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.email}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 3. Subject Badge */}
      {Boolean(item.subject) && (
        <View style={styles.subjectRow}>
          <View
            style={[
              styles.subjectBadge,
              {
                backgroundColor: isDark ? '#1C2612' : '#F4F7EB',
                borderColor: isDark ? '#3A481B' : '#DCE9A2',
              },
            ]}
          >
            <Tag size={11} color="#58632A" strokeWidth={2.4} />
            <Text style={styles.subjectText} numberOfLines={1}>
              {item.subject}
            </Text>
          </View>
        </View>
      )}

      {/* 4. Message Preview (Truncated 2 lines) */}
      <View style={styles.messageBox}>
        <Text
          style={[styles.messagePreview, { color: colors.textSecondary }]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {item.message || 'No additional message text provided.'}
        </Text>
      </View>

      {/* 5. Action Bar (Delete Button Only per Task 4) */}
      <View
        style={[
          styles.actionBar,
          {
            borderTopColor: isDark ? '#1E293B' : '#F1F5F9',
          },
        ]}
      >
        <Text style={[styles.tapHintText, { color: colors.textSecondary }]}>
          Tap card to view details
        </Text>

        {/* Right Action: Delete Button */}
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('impactHeavy');
            onDelete(item);
          }}
          activeOpacity={0.75}
          style={[
            styles.deleteBtn,
            {
              backgroundColor: isDark ? '#3B1219' : '#FEF2F2',
              borderColor: isDark ? '#631B28' : '#FECACA',
            },
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Trash2 size={14} color="#EF4444" strokeWidth={2.4} />
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  senderInfo: {
    flex: 1,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 3,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  contactDetailsBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: '50%',
  },
  contactText: {
    fontSize: 13,
    fontWeight: '600',
  },
  subjectRow: {
    marginTop: 8,
    flexDirection: 'row',
  },
  subjectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    maxWidth: '100%',
  },
  subjectText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#58632A',
  },
  messageBox: {
    marginTop: 8,
  },
  messagePreview: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'normal',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 10,
  },
  tapHintText: {
    fontSize: 12,
    fontWeight: '500',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
});

