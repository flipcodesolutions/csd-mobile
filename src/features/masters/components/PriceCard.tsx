import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Check, CheckSquare, Fuel, Square } from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { VehicleVariant } from '../types';
import { formatINR } from './VariantCard';

interface PriceCardProps {
  item: VehicleVariant;
  isSelected: boolean;
  revisedPrice: string;
  isSaving: boolean;
  onToggleSelect: (id: number) => void;
  onChangePrice: (id: number, val: string) => void;
  onSavePrice: (variant: VehicleVariant) => void;
}

export const PriceCard: React.FC<PriceCardProps> = ({
  item,
  isSelected,
  revisedPrice,
  isSaving,
  onToggleSelect,
  onChangePrice,
  onSavePrice,
}) => {
  const { colors, isDark } = useTheme();

  const originalPrice = Number(item.price || item.ex_showroom_price || 0);
  const currentVal = parseFloat(revisedPrice.replace(/[^0-9.]/g, '')) || 0;
  const isChanged = currentVal > 0 && currentVal !== originalPrice;

  const brandName = item.brand?.name || 'Generic OEM';
  const modelName = item.model?.name || 'Model';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isSelected
            ? isDark
              ? 'rgba(88, 99, 42, 0.15)'
              : '#F7F9EE'
            : isChanged
            ? isDark
              ? 'rgba(234, 179, 8, 0.12)'
              : '#FEFCE8'
            : isDark
            ? '#101726'
            : '#FFFFFF',
          borderColor: isSelected
            ? colors.primary
            : isChanged
            ? '#EAB308'
            : isDark
            ? '#1E293B'
            : '#E2E8F0',
        },
      ]}
    >
      {/* Header Row: Checkbox + Trim Name + Brand/Model Pill */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.checkTouch}
          onPress={() => {
            triggerHaptic('selection');
            onToggleSelect(item.id);
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {isSelected ? (
            <CheckSquare size={18} color={colors.primary} strokeWidth={2.4} />
          ) : (
            <Square size={18} color={isDark ? '#64748B' : '#CBD5E1'} strokeWidth={2} />
          )}
        </TouchableOpacity>

        <View style={[styles.headerInfo, { minWidth: 0, flex: 1 }]}>
          <View style={styles.titleLine}>
            <Text
              style={[
                styles.trimName,
                { color: isDark ? '#F8FAFC' : '#0F172A' },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.name}
            </Text>
            {item.fuel_type ? (
              <View
                style={[
                  styles.fuelBadge,
                  {
                    backgroundColor: isDark
                      ? 'rgba(2, 132, 199, 0.15)'
                      : '#F0F9FF',
                    borderColor: isDark ? '#0369A1' : '#BAE6FD',
                  },
                ]}
              >
                <Fuel size={8} color="#0284C7" strokeWidth={2.4} />
                <Text style={styles.fuelBadgeText}>{item.fuel_type}</Text>
              </View>
            ) : null}
          </View>

          <Text
            style={[
              styles.modelText,
              { color: isDark ? '#94A3B8' : '#64748B' },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {brandName} • {modelName}
          </Text>
        </View>
      </View>

      {/* Inline Price Adjuster Row */}
      <View style={styles.priceRow}>
        <View style={styles.prevPriceBlock}>
          <Text
            style={[
              styles.rateSub,
              { color: isDark ? '#64748B' : '#94A3B8' },
            ]}
          >
            CURRENT
          </Text>
          <Text
            style={[
              styles.prevRateText,
              { color: isDark ? '#CBD5E1' : '#475569' },
            ]}
          >
            {formatINR(originalPrice)}
          </Text>
        </View>

        <View style={styles.revisedInputBlock}>
          <View
            style={[
              styles.inputWrap,
              {
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                borderColor: isChanged
                  ? '#EAB308'
                  : isDark
                  ? '#334155'
                  : '#CBD5E1',
              },
            ]}
          >
            <Text style={styles.currencyPrefix}>₹</Text>
            <TextInput
              style={[
                styles.rateInput,
                { color: isDark ? '#F8FAFC' : '#0F172A' },
              ]}
              value={revisedPrice}
              onChangeText={(val) => onChangePrice(item.id, val)}
              placeholder={String(originalPrice)}
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
            />
          </View>

          {isChanged && (
            <TouchableOpacity
              style={[styles.quickSaveBtn, isSaving && { opacity: 0.7 }]}
              onPress={() => {
                triggerHaptic('notificationSuccess');
                onSavePrice(item);
              }}
              disabled={isSaving}
              activeOpacity={0.8}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Check size={14} color="#FFFFFF" strokeWidth={3} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkTouch: {
    padding: 2,
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trimName: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  fuelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    gap: 2,
  },
  fuelBadgeText: {
    fontSize: 9,
    color: '#0284C7',
    fontWeight: '700',
  },
  modelText: {
    fontSize: 11,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
    gap: 10,
  },
  prevPriceBlock: {
    flex: 1,
  },
  rateSub: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  prevRateText: {
    fontSize: 13,
    fontWeight: '700',
  },
  revisedInputBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1.3,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 34,
    borderRadius: 7,
    borderWidth: 1,
    paddingHorizontal: 8,
    gap: 3,
  },
  currencyPrefix: {
    fontSize: 12,
    fontWeight: '800',
    color: '#16A34A',
  },
  rateInput: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
    height: '100%',
    padding: 0,
  },
  quickSaveBtn: {
    width: 34,
    height: 34,
    borderRadius: 7,
    backgroundColor: '#EAB308',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
