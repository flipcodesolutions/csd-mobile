import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Layers } from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { VariantStats } from '../types';

interface VariantKpiDeckProps {
  stats: VariantStats;
  totalFallback: number;
}

export const VariantKpiDeck: React.FC<VariantKpiDeckProps> = ({
  stats,
  totalFallback,
}) => {
  const { colors, isDark } = useTheme();

  const totalDisplay = stats.total_variants > 0 ? stats.total_variants : totalFallback;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => triggerHaptic('selection')}
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#101726' : '#FFFFFF',
            borderColor: isDark ? '#1E293B' : '#E2E8F0',
            borderTopColor: colors.primary,
            borderTopWidth: 2,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: isDark
                  ? 'rgba(88, 99, 42, 0.2)'
                  : '#F5F8EE',
              },
            ]}
          >
            <Layers size={13} color={colors.primary} strokeWidth={2.4} />
          </View>
          <Text
            style={[
              styles.cardTitle,
              { color: isDark ? '#94A3B8' : '#64748B' },
            ]}
            numberOfLines={1}
          >
            Total Variants
          </Text>
        </View>

        <View style={styles.valueRow}>
          <Text
            style={[
              styles.cardValue,
              { color: isDark ? '#F8FAFC' : '#0F172A' },
            ]}
          >
            {totalDisplay}
          </Text>
          <Text
            style={[
              styles.cardSub,
              { color: isDark ? '#64748B' : '#94A3B8' },
            ]}
            numberOfLines={1}
          >
            {totalDisplay === 1 ? 'Variant' : 'Variants'}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  card: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cardSub: {
    fontSize: 11,
    fontWeight: '600',
  },
});
