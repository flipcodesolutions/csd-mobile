import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Car, Flame, Shield, Users } from 'lucide-react-native';
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Card 1: Total Leads */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#101726' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
              borderTopColor: colors.primary,
            },
          ]}
        >
          <View style={styles.topRow}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: isDark ? `${colors.primary}25` : `${colors.primary}15` },
              ]}
            >
              <Users size={14} color={colors.primary} strokeWidth={2.4} />
            </View>
            <Text style={styles.cardLabel}>TOTAL LEADS</Text>
          </View>
          <Text
            style={[
              styles.countText,
              { color: isDark ? '#F8FAFC' : '#0F172A' },
            ]}
          >
            {totalCount}
          </Text>
          <Text style={[styles.subtitleText, { color: isDark ? '#94A3B8' : '#64748B' }]} numberOfLines={1}>
            Total CRM Pipeline
          </Text>
        </View>

        {/* Card 2: Hot Leads */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#101726' : '#FFFFFF',
              borderColor: isDark ? '#2D1B22' : '#FEE2E2',
              borderTopColor: '#DC2626',
            },
          ]}
        >
          <View style={styles.topRow}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? '#DC262625' : '#DC262615' }]}>
              <Flame size={14} color="#DC2626" strokeWidth={2.4} />
            </View>
            <Text style={[styles.cardLabel, { color: '#DC2626' }]}>HOT PRIORITY</Text>
          </View>
          <Text style={[styles.countText, { color: '#DC2626' }]}>
            {hotCount}
          </Text>
          <Text style={[styles.subtitleText, { color: isDark ? '#94A3B8' : '#64748B' }]} numberOfLines={1}>
            Immediate Attention
          </Text>
        </View>

        {/* Card 3: 4W Cars */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#101726' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
              borderTopColor: '#0284C7',
            },
          ]}
        >
          <View style={styles.topRow}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? '#0284C725' : '#0284C715' }]}>
              <Car size={14} color="#0284C7" strokeWidth={2.4} />
            </View>
            <Text style={styles.cardLabel}>4W VEHICLES</Text>
          </View>
          <Text
            style={[
              styles.countText,
              { color: isDark ? '#F8FAFC' : '#0F172A' },
            ]}
          >
            {fourWheelerCount}
          </Text>
          <Text style={[styles.subtitleText, { color: isDark ? '#94A3B8' : '#64748B' }]} numberOfLines={1}>
            Four Wheeler Segment
          </Text>
        </View>

        {/* Card 4: 2W Bikes */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#101726' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
              borderTopColor: '#7C3AED',
            },
          ]}
        >
          <View style={styles.topRow}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? '#7C3AED25' : '#7C3AED15' }]}>
              <Shield size={14} color="#7C3AED" strokeWidth={2.4} />
            </View>
            <Text style={styles.cardLabel}>2W VEHICLES</Text>
          </View>
          <Text
            style={[
              styles.countText,
              { color: isDark ? '#F8FAFC' : '#0F172A' },
            ]}
          >
            {twoWheelerCount}
          </Text>
          <Text style={[styles.subtitleText, { color: isDark ? '#94A3B8' : '#64748B' }]} numberOfLines={1}>
            Two Wheeler Segment
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
    marginBottom: 6,
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 10,
  },
  card: {
    width: 154,
    borderRadius: 12,
    borderWidth: 1,
    borderTopWidth: 3,
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
  cardLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  countText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 9.5,
    fontWeight: '500',
    marginTop: 1,
  },
});
