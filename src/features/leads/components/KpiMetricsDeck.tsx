import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../core/theme/ThemeContext';

interface KpiMetricsDeckProps {
  totalCount: number;
  hotCount: number;
  fourWheelerCount: number;
  twoWheelerCount: number;
}

export const KpiMetricsDeck: React.FC<KpiMetricsDeckProps> = ({
  totalCount,
  hotCount,
  fourWheelerCount,
  twoWheelerCount,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Card 1: Total */}
        <View
          style={[
            styles.kpiCard,
            {
              backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
            },
          ]}
        >
          <View style={[styles.topLine, { backgroundColor: colors.primary }]} />
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
            TOTAL
          </Text>
          <Text style={[styles.statNumber, { color: colors.textPrimary }]}>
            {totalCount}
          </Text>
        </View>

        {/* Card 2: Hot */}
        <View
          style={[
            styles.kpiCard,
            {
              backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
              borderColor: isDark ? '#2D1B22' : '#FEE2E2',
            },
          ]}
        >
          <View style={[styles.topLine, { backgroundColor: '#DC2626' }]} />
          <Text
            style={[
              styles.cardTitle,
              { color: isDark ? '#F87171' : '#DC2626' },
            ]}
          >
            HOT
          </Text>
          <Text
            style={[
              styles.statNumber,
              { color: isDark ? '#F87171' : '#DC2626' },
            ]}
          >
            {hotCount}
          </Text>
        </View>

        {/* Card 3: 4W Cars */}
        <View
          style={[
            styles.kpiCard,
            {
              backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
            },
          ]}
        >
          <View style={[styles.topLine, { backgroundColor: colors.primary }]} />
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
            4W CARS
          </Text>
          <Text style={[styles.statNumber, { color: colors.textPrimary }]}>
            {fourWheelerCount}
          </Text>
        </View>

        {/* Card 4: 2W Bikes */}
        <View
          style={[
            styles.kpiCard,
            {
              backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
            },
          ]}
        >
          <View
            style={[styles.topLine, { backgroundColor: colors.primaryDark }]}
          />
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
            2W BIKES
          </Text>
          <Text style={[styles.statNumber, { color: colors.textPrimary }]}>
            {twoWheelerCount}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  topLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
  },
  cardTitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginTop: 2,
    includeFontPadding: false,
    textAlign: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
    includeFontPadding: false,
    textAlign: 'center',
  },
});
