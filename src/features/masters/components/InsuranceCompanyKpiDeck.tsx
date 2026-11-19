import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CheckCircle2, PauseCircle, Shield } from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { InsuranceCompanyStats } from '../types';

interface InsuranceCompanyKpiDeckProps {
  stats: InsuranceCompanyStats;
  totalFallback: number;
  activeFilter?: 'all' | 'active' | 'inactive';
  onSelectFilter?: (filter: 'all' | 'active' | 'inactive') => void;
}

export const InsuranceCompanyKpiDeck: React.FC<InsuranceCompanyKpiDeckProps> = ({
  stats,
  totalFallback,
  activeFilter = 'all',
  onSelectFilter,
}) => {
  const { colors, isDark } = useTheme();

  const total = stats.total > 0 ? stats.total : totalFallback;
  const active = stats.active;
  const inactive = stats.inactive;

  const kpis: {
    id: 'all' | 'active' | 'inactive';
    title: string;
    value: number;
    subtitle: string;
    icon: typeof Shield;
    color: string;
    bgTint: string;
  }[] = [
    {
      id: 'all',
      title: 'Total',
      value: total,
      subtitle: 'Companies',
      icon: Shield,
      color: '#0284C7',
      bgTint: isDark ? 'rgba(2, 132, 199, 0.2)' : '#EFF6FF',
    },
    {
      id: 'active',
      title: 'Active',
      value: active,
      subtitle: 'Partners',
      icon: CheckCircle2,
      color: '#16A34A',
      bgTint: isDark ? 'rgba(22, 163, 74, 0.15)' : '#F0FDF4',
    },
    {
      id: 'inactive',
      title: 'Inactive',
      value: inactive,
      subtitle: 'Companies',
      icon: PauseCircle,
      color: '#64748B',
      bgTint: isDark ? 'rgba(100, 116, 139, 0.15)' : '#F8FAFC',
    },
  ];

  return (
    <View style={styles.container}>
      {kpis.map((kpi) => {
        const IconComponent = kpi.icon;
        const isSelected = activeFilter === kpi.id;

        return (
          <TouchableOpacity
            key={`kpi-ins-${kpi.id}`}
            activeOpacity={0.8}
            onPress={() => {
              triggerHaptic('selection');
              if (onSelectFilter) {
                onSelectFilter(kpi.id);
              }
            }}
            style={[
              styles.card,
              {
                backgroundColor: isDark ? '#101726' : '#FFFFFF',
                borderColor: isSelected
                  ? kpi.color
                  : isDark
                  ? '#1E293B'
                  : '#E2E8F0',
                borderTopColor: kpi.color,
                borderTopWidth: 2,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconWrap, { backgroundColor: kpi.bgTint }]}>
                <IconComponent size={13} color={kpi.color} strokeWidth={2.4} />
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
    width: 22,
    height: 22,
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

