import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    accentColor: string;
  }[] = [
    {
      id: 'overdue',
      title: 'OVERDUE',
      count: stats.overdue,
      accentColor: '#EF4444',
    },
    {
      id: 'today',
      title: 'DUE TODAY',
      count: stats.due_today,
      accentColor: '#FB923C',
    },
    {
      id: 'upcoming',
      title: 'UPCOMING',
      count: stats.upcoming,
      accentColor: '#38BDF8',
    },
    {
      id: 'all',
      title: 'TOTAL',
      count: stats.total,
      accentColor: '#22C55E',
    },
  ];

  return (
    <View style={styles.deckContainer}>
      <View style={styles.singleRow}>
        {cards.map((card) => {
          const isActive = activeTab === card.id;
          return (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.kpiBox,
                {
                  backgroundColor: isDark ? '#101726' : '#FFFFFF',
                  borderColor: isActive
                    ? card.accentColor
                    : isDark
                    ? '#1E293B'
                    : '#E2E8F0',
                  borderTopColor: card.accentColor,
                  borderTopWidth: 3,
                },
                isActive && {
                  shadowColor: card.accentColor,
                  shadowOpacity: 0.18,
                  elevation: 2,
                },
              ]}
              activeOpacity={0.75}
              onPress={() => {
                triggerHaptic('impactLight');
                onSelectTab(card.id);
              }}
            >
              <Text
                style={[
                  styles.cardLabel,
                  { color: isActive ? card.accentColor : isDark ? '#94A3B8' : '#64748B' },
                ]}
                numberOfLines={1}
              >
                {card.title}
              </Text>
              <Text
                style={[
                  styles.countValue,
                  {
                    color:
                      card.id === 'overdue' && card.count > 0
                        ? '#EF4444'
                        : isDark
                        ? '#F8FAFC'
                        : '#0F172A',
                  },
                ]}
              >
                {card.count}
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
    paddingTop: 10,
    paddingBottom: 6,
  },
  singleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  kpiBox: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginBottom: 2,
    textAlign: 'center',
  },
  countValue: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
});
