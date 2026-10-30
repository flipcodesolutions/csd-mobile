import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Edit2, Fuel, Layers, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { VehicleVariant } from '../types';

interface VariantCardProps {
  item: VehicleVariant;
  index: number;
  onEdit: (variant: VehicleVariant) => void;
  onDelete: (variant: VehicleVariant) => void;
}

export const formatINR = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null || value === '') return '₹0';
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, '')) : value;
  if (isNaN(num)) return '₹0';
  return '₹' + num.toLocaleString('en-IN');
};

export const VariantCard: React.FC<VariantCardProps> = ({
  item,
  index,
  onEdit,
  onDelete,
}) => {
  const { colors, isDark } = useTheme();

  const brandName = item.brand?.name || 'Generic OEM';
  const modelName = item.model?.name || 'Vehicle Model';
  const isActive = item.status === 'Active';
  const displayPrice = item.price || item.ex_showroom_price || 0;

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
        {/* Avatar Box */}
        <View
          style={[
            styles.avatarBox,
            {
              backgroundColor: isDark
                ? 'rgba(88, 99, 42, 0.2)'
                : '#F5F8EE',
              borderColor: isDark ? '#3F4912' : '#DCE9A2',
            },
          ]}
        >
          <Layers size={15} color={colors.primary} strokeWidth={2.4} />
        </View>

        {/* Info Column */}
        <View style={styles.infoCol}>
          {/* Title Row */}
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.variantName,
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

          {/* Model & Fuel Chips */}
          <View style={styles.metaRow}>
            <View
              style={[
                styles.modelChip,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                },
              ]}
            >
              <Text
                style={[
                  styles.modelChipText,
                  { color: isDark ? '#CBD5E1' : '#475569' },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {brandName} • {modelName}
              </Text>
            </View>

            {item.fuel_type ? (
              <View
                style={[
                  styles.fuelChip,
                  {
                    backgroundColor: isDark
                      ? 'rgba(2, 132, 199, 0.15)'
                      : '#F0F9FF',
                    borderColor: isDark ? '#0369A1' : '#BAE6FD',
                  },
                ]}
              >
                <Fuel size={9} color="#0284C7" strokeWidth={2.4} />
                <Text style={styles.fuelChipText}>{item.fuel_type}</Text>
              </View>
            ) : null}
          </View>

          {/* Price Row */}
          <View style={styles.priceRow}>
            <Text
              style={[
                styles.priceValue,
                { color: isDark ? '#4ADE80' : '#16A34A' },
              ]}
              numberOfLines={1}
            >
              {formatINR(displayPrice)}
            </Text>
            <Text
              style={[
                styles.priceCaption,
                { color: isDark ? '#64748B' : '#94A3B8' },
              ]}
            >
              CSD Rate
            </Text>
            {item.previous_price ? (
              <Text style={styles.previousValue} numberOfLines={1}>
                {formatINR(item.previous_price)}
              </Text>
            ) : null}
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
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  variantName: {
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
  modelChip: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.8,
    maxWidth: 160,
  },
  modelChipText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  fuelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.8,
    gap: 2,
  },
  fuelChipText: {
    fontSize: 9,
    color: '#0284C7',
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 1,
  },
  priceValue: {
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  priceCaption: {
    fontSize: 9,
    fontWeight: '600',
  },
  previousValue: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94A3B8',
    textDecorationLine: 'line-through',
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
