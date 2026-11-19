import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Edit3, Shield, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { InsuranceCompany } from '../types';

interface InsuranceCompanyCardProps {
  item: InsuranceCompany;
  index?: number;
  onEdit: (item: InsuranceCompany) => void;
  onDelete: (item: InsuranceCompany) => void;
}

export const InsuranceCompanyCard: React.FC<InsuranceCompanyCardProps> = ({
  item,
  index,
  onEdit,
  onDelete,
}) => {
  const { colors, isDark } = useTheme();
  const isActive = item.status === 'Active' || (item.status as any) === 1 || (item.status as any) === '1' || (item.status as any) === 'active';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#101726' : '#FFFFFF',
          borderColor: isDark ? '#1E293B' : '#E2E8F0',
        },
      ]}
    >
      <View style={styles.cardInner}>
        {/* Left Side: Shield Icon Box + Company Name */}
        <View style={styles.infoCol}>
          <View style={styles.headerRow}>
            {/* Shield Icon Box */}
            <View
              style={[
                styles.shieldBox,
                {
                  backgroundColor: isDark
                    ? 'rgba(2, 132, 199, 0.15)'
                    : '#EFF6FF',
                  borderColor: isDark ? 'rgba(2, 132, 199, 0.3)' : '#BFDBFE',
                },
              ]}
            >
              <Shield size={14} color="#0284C7" strokeWidth={2.4} />
            </View>

            {/* Company Name */}
            <Text
              style={[
                styles.companyName,
                { color: isDark ? '#F8FAFC' : '#0F172A' },
              ]}
              numberOfLines={2}
            >
              {item.name}
            </Text>
          </View>

          {/* Optional Code / Contact details subtitle if available */}
          {(item.code || item.contact_person || item.phone) ? (
            <View style={styles.detailsRow}>
              {item.code ? (
                <Text style={styles.codeText}>Code: {item.code}</Text>
              ) : null}
              {item.contact_person ? (
                <Text
                  style={[
                    styles.contactText,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                  numberOfLines={1}
                >
                  &bull; {item.contact_person}
                </Text>
              ) : null}
              {item.phone ? (
                <Text
                  style={[
                    styles.contactText,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                  numberOfLines={1}
                >
                  &bull; {item.phone}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Right Side: Status Badge + Action Buttons */}
        <View style={styles.actionsCol}>
          {/* Status Badge */}
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isActive
                  ? isDark
                    ? 'rgba(22, 163, 74, 0.2)'
                    : '#DCFCE7'
                  : isDark
                  ? 'rgba(100, 116, 139, 0.2)'
                  : '#F1F5F9',
                borderColor: isActive ? '#86EFAC' : '#CBD5E1',
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isActive ? '#16A34A' : '#94A3B8' },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: isActive ? '#16A34A' : '#64748B' },
              ]}
            >
              {isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>

          {/* Action Buttons: Edit & Delete */}
          <View style={styles.btnRow}>
            {/* Edit Button */}
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                },
              ]}
              activeOpacity={0.7}
              onPress={() => {
                triggerHaptic('impactLight');
                onEdit(item);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Edit3 size={14} color={isDark ? '#CBD5E1' : '#475569'} />
            </TouchableOpacity>

            {/* Delete Button */}
            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.deleteBtn,
                {
                  backgroundColor: isDark
                    ? 'rgba(239, 68, 68, 0.15)'
                    : '#FEF2F2',
                  borderColor: isDark
                    ? 'rgba(239, 68, 68, 0.4)'
                    : '#FECACA',
                },
              ]}
              activeOpacity={0.7}
              onPress={() => {
                triggerHaptic('notificationWarning');
                onDelete(item);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Trash2 size={14} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  infoCol: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  shieldBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyName: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    letterSpacing: -0.2,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingLeft: 34,
  },
  codeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },
  contactText: {
    fontSize: 11,
  },
  actionsCol: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {},
});

