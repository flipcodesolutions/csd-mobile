import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CheckCircle2, GitFork } from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { LeadSourceStats } from '../types';

interface LeadSourceKpiDeckProps {
  stats: LeadSourceStats;
  totalFallback: number;
}

export const LeadSourceKpiDeck: React.FC<LeadSourceKpiDeckProps> = ({
  stats,
  totalFallback,
}) => {
  const { colors, isDark } = useTheme();

  const total = stats.total_channels > 0 ? stats.total_channels : totalFallback;
  const active = stats.active_channels;

  const kpis = [
    {
      title: 'Total',
      value: total,
      subtitle: 'Sources',
      icon: GitFork,
      color: colors.primary,
      bgTint: isDark ? 'rgba(88, 99, 42, 0.2)' : '#F5F8EE',
    },
    {
      title: 'Active',
      value: active,
      subtitle: 'In Pipeline',
      icon: CheckCircle2,
      color: '#EE6800',
      bgTint: isDark ? 'rgba(238, 104, 0, 0.15)' : '#FFF7ED',
    },
  ];

  return (
    <View style={styles.container}>
      {kpis.map((kpi, idx) => {
        const IconComponent = kpi.icon;

        return (
          <TouchableOpacity
            key={`kpi-lead-source-${idx}`}
            activeOpacity={0.8}
            onPress={() => triggerHaptic('selection')}
            style={[
              styles.card,
              {
                backgroundColor: isDark ? '#101726' : '#FFFFFF',
                borderColor: isDark ? '#1E293B' : '#E2E8F0',
                borderTopColor: kpi.color,
                borderTopWidth: 2,
              },
            ]}
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
    paddingHorizontal: 12,
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
