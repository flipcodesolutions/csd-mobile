import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flag,
  Mic,
  MinusCircle,
} from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { ComplianceStatus } from '../types';

export const ReviewStatusBadge: React.FC<{
  status?: string | null;
  pendingLabel?: string;
}> = ({ status, pendingLabel = 'Pending' }) => {
  const { isDark } = useTheme();
  const s = String(status || 'pending').toLowerCase();

  if (s === 'verified') {
    return (
      <View
        style={[
          styles.badge,
          {
            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.16)' : '#ECFDF5',
            borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : '#A7F3D0',
          },
        ]}
      >
        <CheckCircle2 size={12} color={isDark ? '#34D399' : '#059669'} />
        <Text style={[styles.text, { color: isDark ? '#34D399' : '#059669' }]}>
          Verified
        </Text>
      </View>
    );
  }

  if (s === 'flagged') {
    return (
      <View
        style={[
          styles.badge,
          {
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.16)' : '#FEF2F2',
            borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : '#FECACA',
          },
        ]}
      >
        <Flag size={12} color={isDark ? '#F87171' : '#DC2626'} />
        <Text style={[styles.text, { color: isDark ? '#F87171' : '#DC2626' }]}>
          Flagged
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: isDark ? 'rgba(245, 158, 11, 0.16)' : '#FFFBEB',
          borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : '#FDE68A',
        },
      ]}
    >
      <Clock size={12} color={isDark ? '#FBBF24' : '#D97706'} />
      <Text style={[styles.text, { color: isDark ? '#FBBF24' : '#D97706' }]}>
        {pendingLabel}
      </Text>
    </View>
  );
};

export const ComplianceBadge: React.FC<{
  compliance_status: ComplianceStatus;
  recordings_uploaded: number;
  call_follow_ups: number;
  missing_count: number;
}> = ({
  compliance_status,
  recordings_uploaded,
  call_follow_ups,
  missing_count,
}) => {
  const { isDark } = useTheme();

  if (compliance_status === 'complete') {
    return (
      <View
        style={[
          styles.badge,
          {
            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.16)' : '#ECFDF5',
            borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : '#A7F3D0',
          },
        ]}
      >
        <CheckCircle2 size={12} color={isDark ? '#34D399' : '#059669'} />
        <Text style={[styles.text, { color: isDark ? '#34D399' : '#059669' }]}>
          Complete ({recordings_uploaded}/{call_follow_ups})
        </Text>
      </View>
    );
  }

  if (compliance_status === 'missing') {
    return (
      <View
        style={[
          styles.badge,
          {
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.16)' : '#FEF2F2',
            borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : '#FECACA',
          },
        ]}
      >
        <AlertTriangle size={12} color={isDark ? '#F87171' : '#DC2626'} />
        <Text style={[styles.text, { color: isDark ? '#F87171' : '#DC2626' }]}>
          {missing_count} Missing ({recordings_uploaded}/{call_follow_ups})
        </Text>
      </View>
    );
  }

  if (compliance_status === 'uploaded') {
    return (
      <View
        style={[
          styles.badge,
          {
            backgroundColor: isDark ? 'rgba(56, 189, 248, 0.16)' : '#F0F9FF',
            borderColor: isDark ? 'rgba(56, 189, 248, 0.35)' : '#BAE6FD',
          },
        ]}
      >
        <Mic size={12} color={isDark ? '#38BDF8' : '#0284C7'} />
        <Text style={[styles.text, { color: isDark ? '#38BDF8' : '#0284C7' }]}>
          {recordings_uploaded} Uploaded
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
          borderColor: isDark ? '#334155' : '#E2E8F0',
        },
      ]}
    >
      <MinusCircle size={12} color={isDark ? '#94A3B8' : '#64748B'} />
      <Text style={[styles.text, { color: isDark ? '#94A3B8' : '#64748B' }]}>
        No Calls Logged
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    gap: 5,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
});

