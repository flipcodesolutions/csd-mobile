import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Edit2, GitFork, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { LeadSource } from '../types';

interface LeadSourceCardProps {
  item: LeadSource;
  index: number;
  onEdit: (item: LeadSource) => void;
  onDelete: (item: LeadSource) => void;
}

export const LeadSourceCard: React.FC<LeadSourceCardProps> = ({
  item,
  index,
  onEdit,
  onDelete,
}) => {
  const { colors, isDark } = useTheme();

  const title = item.title || item.name || 'Acquisition Channel';
  const isActive = item.status === 'Active';

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
      <View style={styles.cardInner}>
        {/* Icon Box */}
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: isDark
                ? 'rgba(88, 99, 42, 0.2)'
                : '#F5F8EE',
              borderColor: isDark ? '#3F4912' : '#DCE9A2',
            },
          ]}
        >
          <GitFork size={15} color={colors.primary} strokeWidth={2.4} />
        </View>

        {/* Info Column */}
        <View style={[styles.infoCol, { minWidth: 0, flex: 1 }]}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.channelTitle,
                { color: isDark ? '#F8FAFC' : '#0F172A' },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {title}
            </Text>
            {/* Status Dot */}
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isActive ? '#10B981' : '#94A3B8' },
              ]}
            />
          </View>

          <Text
            style={[
              styles.channelSub,
              { color: isDark ? '#94A3B8' : '#64748B' },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {isActive ? 'Enabled in CRM Pipeline' : 'Channel Inactive'}
          </Text>
        </View>

        {/* Inline Action Buttons */}
        <View style={styles.actionBtns}>
          <TouchableOpacity
            style={[
              styles.iconBtn,
              {
                backgroundColor: isDark ? '#162030' : '#F1F5F9',
                borderColor: isDark ? '#1E293B' : '#CBD5E1',
              },
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            onPress={() => {
              triggerHaptic('impactLight');
              onEdit(item);
            }}
            activeOpacity={0.7}
          >
            <Edit2 size={13} color={colors.textPrimary} strokeWidth={2.2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.iconBtn,
              {
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
                borderColor: isDark ? '#7F1D1D' : '#FCA5A5',
              },
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            onPress={() => {
              triggerHaptic('notificationWarning');
              onDelete(item);
            }}
            activeOpacity={0.7}
          >
            <Trash2 size={13} color="#EF4444" strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  channelTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  channelSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  actionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
