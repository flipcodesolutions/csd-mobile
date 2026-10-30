import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Bike, Car, Shield } from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { BrandStats, BrandVehicleTypeFilter } from '../types';

interface BrandKpiDeckProps {
  stats: BrandStats;
  totalFallback: number;
  activeFilter: BrandVehicleTypeFilter;
  onSelectFilter: (filter: BrandVehicleTypeFilter) => void;
}

export const BrandKpiDeck: React.FC<BrandKpiDeckProps> = ({
  stats,
  totalFallback,
  activeFilter,
  onSelectFilter,
}) => {
  const { colors, isDark } = useTheme();

  const totalDisplay = stats.total_brands > 0 ? stats.total_brands : totalFallback;
  const fourWDisplay = stats.four_wheeler_brands;
  const twoWDisplay = stats.two_wheeler_brands;

  const kpis: {
    id: BrandVehicleTypeFilter;
    title: string;
    value: number;
    subtitle: string;
    icon: typeof Shield;
    color: string;
    bgTint: string;
  }[] = [
    {
      id: 'All',
      title: 'Total',
      value: totalDisplay,
      subtitle: 'All OEMs',
      icon: Shield,
      color: colors.primary,
      bgTint: isDark ? 'rgba(88, 99, 42, 0.2)' : '#F5F8EE',
    },
    {
      id: '4 Wheeler',
      title: '4 Wheeler',
      value: fourWDisplay,
      subtitle: 'Cars',
      icon: Car,
      color: '#16A34A',
      bgTint: isDark ? 'rgba(22, 163, 74, 0.15)' : '#F0FDF4',
    },
    {
      id: '2 Wheeler',
      title: '2 Wheeler',
      value: twoWDisplay,
      subtitle: 'Bikes',
      icon: Bike,
      color: '#EE6800',
      bgTint: isDark ? 'rgba(238, 104, 0, 0.15)' : '#FFF7ED',
    },
  ];

  return (
    <View style={styles.container}>
      {kpis.map((kpi) => {
        const IconComponent = kpi.icon;
        const isSelected = activeFilter === kpi.id;

        return (
          <TouchableOpacity
            key={kpi.id}
            activeOpacity={0.75}
            style={[
              styles.card,
              {
                backgroundColor: isSelected
                  ? isDark
                    ? '#162030'
                    : '#FFFFFF'
                  : isDark
                  ? '#101726'
                  : '#FFFFFF',
                borderColor: isSelected
                  ? kpi.color
                  : isDark
                  ? '#1E293B'
                  : '#E2E8F0',
                borderTopColor: kpi.color,
                borderTopWidth: isSelected ? 3 : 2,
              },
            ]}
            onPress={() => {
              triggerHaptic('selection');
              onSelectFilter(kpi.id);
            }}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconWrap, { backgroundColor: kpi.bgTint }]}>
                <IconComponent size={12} color={kpi.color} strokeWidth={2.4} />
              </View>
              <Text
                style={[
                  styles.cardTitle,
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
                numberOfLines={1}
              >
                {kpi.title}
              </Text>
            </View>

            <View style={styles.valueRow}>
              <Text
                style={[
                  styles.cardValue,
                  { color: isDark ? '#F8FAFC' : '#0F172A' },
                ]}
              >
                {kpi.value}
              </Text>
              <Text
                style={[
                  styles.cardSub,
                  { color: isDark ? '#64748B' : '#94A3B8' },
                ]}
                numberOfLines={1}
              >
                {kpi.subtitle}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 8,
  },
  card: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    flex: 1,
  },
  iconWrap: {
    width: 20,
    height: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cardSub: {
    fontSize: 10,
    fontWeight: '500',
  },
});
