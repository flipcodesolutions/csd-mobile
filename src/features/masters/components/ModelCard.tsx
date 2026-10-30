import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Bike, Car, Edit2, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { CarModel } from '../types';

interface ModelCardProps {
  item: CarModel;
  index: number;
  onEdit: (model: CarModel) => void;
  onDelete: (model: CarModel) => void;
}

export const ModelCard: React.FC<ModelCardProps> = ({
  item,
  index,
  onEdit,
  onDelete,
}) => {
  const { colors, isDark } = useTheme();

  const isFourWheeler =
    item.vehicle_segment === '4 Wheeler' ||
    !String(item.vehicle_segment).includes('2');
  const isActive = item.status === 'Active';
  const brandName = item.brand?.name || item.brand_name || 'Generic OEM';

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
        {/* Model Avatar Icon */}
        <View
          style={[
            styles.avatarBox,
            {
              backgroundColor: isFourWheeler
                ? isDark
                  ? 'rgba(2, 132, 199, 0.15)'
                  : '#E0F2FE'
                : isDark
                ? 'rgba(238, 104, 0, 0.15)'
                : '#FFF7ED',
              borderColor: isFourWheeler ? '#38BDF8' : '#FDBA74',
            },
          ]}
        >
          {isFourWheeler ? (
            <Car size={15} color={isDark ? '#38BDF8' : '#0284C7'} strokeWidth={2.4} />
          ) : (
            <Bike size={15} color={isDark ? '#FB923C' : '#EE6800'} strokeWidth={2.4} />
          )}
        </View>

        {/* Info Column */}
        <View style={styles.infoCol}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.modelName,
                { color: isDark ? '#F8FAFC' : '#0F172A' },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.name}
            </Text>
            {/* Status Dot */}
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isActive ? '#10B981' : '#94A3B8' },
              ]}
            />
          </View>

          <View style={styles.metaRow}>
            {/* Brand Chip */}
            <View
              style={[
                styles.brandChip,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                },
              ]}
            >
              <Text
                style={[
                  styles.brandChipText,
                  { color: isDark ? '#CBD5E1' : '#475569' },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {brandName}
              </Text>
            </View>

            {/* Segment Chip */}
            <View
              style={[
                styles.segmentChip,
                {
                  backgroundColor: isFourWheeler
                    ? isDark
                      ? 'rgba(2, 132, 199, 0.12)'
                      : '#F0F9FF'
                    : isDark
                    ? 'rgba(238, 104, 0, 0.12)'
                    : '#FFFBEB',
                  borderColor: isFourWheeler ? '#BAE6FD' : '#FED7AA',
                },
              ]}
            >
              <Text
                style={[
                  styles.segmentChipText,
                  { color: isFourWheeler ? '#0284C7' : '#D97706' },
                ]}
              >
                {isFourWheeler ? '4W' : '2W'}
              </Text>
            </View>

            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: isActive
                    ? 'rgba(16, 185, 129, 0.08)'
                    : 'rgba(148, 163, 184, 0.12)',
                  borderColor: isActive
                    ? 'rgba(16, 185, 129, 0.3)'
                    : 'rgba(148, 163, 184, 0.3)',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusSubText,
                  { color: isActive ? '#10B981' : '#94A3B8' },
                ]}
              >
                {item.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Inline Actions */}
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
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modelName: {
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  brandChip: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.8,
    maxWidth: 120,
  },
  brandChipText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  segmentChip: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.8,
  },
  segmentChipText: {
    fontSize: 9,
    fontWeight: '700',
  },
  statusPill: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 0.8,
  },
  statusSubText: {
    fontSize: 9,
    fontWeight: '600',
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
