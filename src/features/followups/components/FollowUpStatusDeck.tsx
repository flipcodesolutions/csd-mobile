import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  CheckCheck,
  FileCheck,
  FileText,
  PhoneCall,
  PhoneOff,
  Tag,
  Trophy,
  XCircle,
} from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { CanonicalOutcome, OUTCOME_SUBTITLES } from '../types';

export interface FollowUpStatusDeckProps {
  counts: Record<string, number>;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
}

interface StatusCardDef {
  id: string;
  title: string;
  subtitle: string;
  accentColor: string;
  icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
}

export const FollowUpStatusDeck: React.FC<FollowUpStatusDeckProps> = ({
  counts,
  selectedStatus,
  onSelectStatus,
}) => {
  const { colors, isDark } = useTheme();

  const cards: StatusCardDef[] = [
    {
      id: 'all',
      title: 'All Follow-Ups',
      subtitle: 'All interaction pipeline',
      accentColor: colors.primary,
      icon: CheckCheck,
    },
    {
      id: 'Interested / Call Back',
      title: 'Interested / Call Back',
      subtitle: OUTCOME_SUBTITLES['Interested / Call Back'],
      accentColor: '#2563EB',
      icon: PhoneCall,
    },
    {
      id: 'Quotation Requested',
      title: 'Quotation Requested',
      subtitle: OUTCOME_SUBTITLES['Quotation Requested'],
      accentColor: '#D97706',
      icon: FileText,
    },
    {
      id: 'Quotation Sent',
      title: 'Quotation Sent',
      subtitle: OUTCOME_SUBTITLES['Quotation Sent'],
      accentColor: '#7C3AED',
      icon: FileCheck,
    },
    {
      id: 'Negotiation / Price Discussion',
      title: 'Price Negotiation',
      subtitle: OUTCOME_SUBTITLES['Negotiation / Price Discussion'],
      accentColor: '#CA8A04',
      icon: Tag,
    },
    {
      id: 'Not Reachable / Busy',
      title: 'Not Reachable / Busy',
      subtitle: OUTCOME_SUBTITLES['Not Reachable / Busy'],
      accentColor: '#64748B',
      icon: PhoneOff,
    },
    {
      id: 'Deal Won',
      title: 'Deal Won',
      subtitle: OUTCOME_SUBTITLES['Deal Won'],
      accentColor: '#16A34A',
      icon: Trophy,
    },
    {
      id: 'Lost to Competitor',
      title: 'Lost to Competitor',
      subtitle: OUTCOME_SUBTITLES['Lost to Competitor'],
      accentColor: '#DC2626',
      icon: XCircle,
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {cards.map((card) => {
          const isActive = selectedStatus === card.id;
          const count = counts[card.id] ?? 0;
          const IconComponent = card.icon;

          return (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.card,
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
                  shadowOpacity: 0.22,
                  shadowRadius: 5,
                  elevation: 3,
                },
              ]}
              activeOpacity={0.75}
              onPress={() => {
                triggerHaptic('impactLight');
                onSelectStatus(card.id);
              }}
            >
              <View style={styles.topRow}>
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: isDark
                        ? `${card.accentColor}25`
                        : `${card.accentColor}15`,
                    },
                  ]}
                >
                  <IconComponent
                    size={14}
                    color={card.accentColor}
                    strokeWidth={2.4}
                  />
                </View>
                {isActive && (
                  <View
                    style={[
                      styles.activeDot,
                      { backgroundColor: card.accentColor },
                    ]}
                  />
                )}
              </View>

              <Text
                style={[
                  styles.countText,
                  {
                    color:
                      isActive
                        ? card.accentColor
                        : isDark
                        ? '#F8FAFC'
                        : '#0F172A',
                  },
                ]}
              >
                {count}
              </Text>

              <Text
                style={[
                  styles.titleText,
                  {
                    color: isActive
                      ? card.accentColor
                      : isDark
                      ? '#E2E8F0'
                      : '#1E293B',
                  },
                ]}
                numberOfLines={1}
              >
                {card.title}
              </Text>

              <Text
                style={[
                  styles.subtitleText,
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
                numberOfLines={1}
              >
                {card.subtitle}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  card: {
    width: 154,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    justifyContent: 'space-between',
    minHeight: 96,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  iconBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  countText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  titleText: {
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 2,
  },
  subtitleText: {
    fontSize: 9.5,
    fontWeight: '500',
    marginTop: 1,
  },
});

