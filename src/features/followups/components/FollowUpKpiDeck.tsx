import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  AlertTriangle,
  Calendar,
  CalendarClock,
  CheckCheck,
} from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { FollowUpStats, FollowUpTab } from '../types';

interface FollowUpKpiDeckProps {
  stats: FollowUpStats;
  activeTab: FollowUpTab;
  onSelectTab: (tab: FollowUpTab) => void;
}

export const FollowUpKpiDeck: React.FC<FollowUpKpiDeckProps> = ({
  stats,
  activeTab,
  onSelectTab,
}) => {
  const { isDark } = useTheme();

  const cards: {
    id: FollowUpTab;
    title: string;
    count: number;
    sub: string;
    accentColor: string;
    icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  }[] = [
    {
      id: 'overdue',
      title: 'OVERDUE CALLS',
      count: stats.overdue,
      sub: 'Action required urgently',
      accentColor: '#EF4444',
      icon: AlertTriangle,
    },
    {
      id: 'today',
      title: 'DUE TODAY',
      count: stats.due_today,
      sub: 'Scheduled for today',
      accentColor: '#FB923C',
      icon: Calendar,
    },
    {
      id: 'upcoming',
      title: 'UPCOMING (7D)',
      count: stats.upcoming,
      sub: 'Pipeline nurturing',
      accentColor: '#38BDF8',
      icon: CalendarClock,
    },
    {
      id: 'all',
      title: 'TOTAL CALLS',
      count: stats.total,
      sub: 'Active CRM tracking',
      accentColor: '#22C55E',
      icon: CheckCheck,
    },
  ];

  return (
    <View style={styles.deckContainer}>
      <View style={styles.gridRow}>
        {cards.map((card) => {
          const isActive = activeTab === card.id;
          const IconComp = card.icon;
          return (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.kpiCard,
                {
                  backgroundColor: isDark ? '#101726' : '#FFFFFF',
                  borderColor: isActive
                    ? card.accentColor
                    : isDark
                    ? '#1E293B'
                    : '#E2E8F0',
                  borderLeftColor: card.accentColor,
                  borderLeftWidth: 4,
                  shadowColor: card.accentColor,
                  shadowOpacity: isActive ? 0.2 : 0.05,
                },
              ]}
              activeOpacity={0.75}
              onPress={() => {
                triggerHaptic('impactLight');
                onSelectTab(card.id);
              }}
            >
              <View style={styles.cardHeader}>
                <Text
                  style={[
                    styles.cardTitle,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                  numberOfLines={1}
                >
                  {card.title}
                </Text>
                <View
                  style={[
                    styles.iconPill,
                    {
                      backgroundColor: isDark
                        ? `${card.accentColor}20`
                        : `${card.accentColor}15`,
                    },
                  ]}
                >
                  <IconComp size={14} color={card.accentColor} strokeWidth={2.5} />
                </View>
              </View>

              <Text
                style={[
                  styles.countText,
                  { color: isDark ? '#F8FAFC' : '#0F172A' },
                ]}
              >
                {card.count}
              </Text>

              <Text
                style={[
                  styles.subText,
                  { color: isDark ? '#64748B' : '#94A3B8' },
                ]}
                numberOfLines={1}
              >
                {card.sub}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  deckContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    minWidth: '47%',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  iconPill: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  subText: {
    fontSize: 9.5,
    fontWeight: '500',
  },
});
