import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors } from '../core/theme/colors';

export interface KpiCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  accentColor?: string;
  style?: ViewStyle;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  subtitle,
  icon,
  accentColor = colors.primary,
  style,
}) => {
  return (
    <View style={[styles.card, { borderLeftColor: accentColor }, style]}>
      <View style={styles.topRow}>
        <Text style={styles.label}>{label}</Text>
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      </View>
      <Text style={[styles.value, { color: accentColor }]}>{value}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    padding: 12,
    minWidth: 120,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  icon: {
    fontSize: 14,
  },
  value: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
});

export default KpiCard;
