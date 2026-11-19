import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Clock,
  Folder,
  Globe,
  Phone,
  PlusCircle,
  Edit2,
  Trash2,
  LogIn,
  LogOut,
  Download,
  Share2,
} from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { ActivityLog } from '../types';

interface ActivityLogCardProps {
  item: ActivityLog;
  index: number;
}

export const ActivityLogCard: React.FC<ActivityLogCardProps> = ({
  item,
  index,
}) => {
  const { colors, isDark } = useTheme();

  // User presentation
  const userName = item.user?.name || item.user_name || 'Admin User';
  const userPhone = item.user?.phone || item.user_phone || '+91 98000 11112';
  const userId = item.user?.id || item.user_id || index + 1;
  const initial = userName.trim().charAt(0).toUpperCase() || 'U';

  // Normalize action name
  const rawAction = (item.action || 'info').toLowerCase();

  // Action badge theme helper matching Screenshot 1 color rules
  const getActionBadge = () => {
    switch (rawAction) {
      case 'add':
      case 'create':
        return {
          label: 'ADD',
          Icon: PlusCircle,
          color: '#16A34A',
          bgColor: isDark ? 'rgba(22, 163, 74, 0.15)' : '#DCFCE7',
          borderColor: isDark ? 'rgba(22, 163, 74, 0.35)' : '#86EFAC',
        };
      case 'edit':
      case 'update':
        return {
          label: 'EDIT',
          Icon: Edit2,
          color: '#D97706',
          bgColor: isDark ? 'rgba(217, 119, 6, 0.15)' : '#FEF3C7',
          borderColor: isDark ? 'rgba(217, 119, 6, 0.35)' : '#FDE68A',
        };
      case 'trash':
      case 'archive':
        return {
          label: 'TRASH',
          Icon: Trash2,
          color: '#EA580C',
          bgColor: isDark ? 'rgba(234, 88, 12, 0.15)' : '#FFEDD5',
          borderColor: isDark ? 'rgba(234, 88, 12, 0.35)' : '#FDBA74',
        };
      case 'delete':
      case 'destroy':
        return {
          label: 'DELETE',
          Icon: Trash2,
          color: '#DC2626',
          bgColor: isDark ? 'rgba(220, 38, 38, 0.15)' : '#FEE2E2',
          borderColor: isDark ? 'rgba(220, 38, 38, 0.35)' : '#FCA5A5',
        };
      case 'login':
      case 'send':
        return {
          label: rawAction === 'login' ? 'LOGIN' : 'SEND',
          Icon: rawAction === 'login' ? LogIn : Share2,
          color: '#2563EB',
          bgColor: isDark ? 'rgba(37, 99, 235, 0.15)' : '#DBEAFE',
          borderColor: isDark ? 'rgba(37, 99, 235, 0.35)' : '#93C5FD',
        };
      case 'export':
        return {
          label: 'EXPORT',
          Icon: Download,
          color: '#0891B2',
          bgColor: isDark ? 'rgba(8, 145, 178, 0.15)' : '#CFFAFE',
          borderColor: isDark ? 'rgba(8, 145, 178, 0.35)' : '#A5F3FC',
        };
      case 'logout':
        return {
          label: 'LOGOUT',
          Icon: LogOut,
          color: '#4B5563',
          bgColor: isDark ? 'rgba(75, 85, 99, 0.2)' : '#F3F4F6',
          borderColor: isDark ? 'rgba(75, 85, 99, 0.35)' : '#E5E7EB',
        };
      default:
        return {
          label: rawAction.toUpperCase(),
          Icon: PlusCircle,
          color: '#64748B',
          bgColor: isDark ? 'rgba(100, 116, 139, 0.15)' : '#F1F5F9',
          borderColor: isDark ? 'rgba(100, 116, 139, 0.35)' : '#CBD5E1',
        };
    }
  };

  const badge = getActionBadge();
  const ActionIcon = badge.Icon;

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
      {/* 1. Header Row: User Info + Action Badge */}
      <View style={styles.headerRow}>
        <View style={styles.userInfoCol}>
          {/* Avatar Circle with Initial */}
          <View
            style={[
              styles.avatarBox,
              {
                backgroundColor: isDark
                  ? 'rgba(56, 189, 248, 0.15)'
                  : '#EFF6FF',
                borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : '#BFDBFE',
              },
            ]}
          >
            <Text style={styles.avatarText}>{initial}</Text>
          </View>

          <View style={styles.nameBlock}>
            <View style={styles.nameRow}>
              <Text
                style={[
                  styles.userName,
                  { color: isDark ? '#F8FAFC' : '#0F172A' },
                ]}
                numberOfLines={1}
              >
                {userName}
              </Text>
              <View
                style={[
                  styles.userIdTag,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.userIdText,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                >
                  #{userId}
                </Text>
              </View>
            </View>

            {userPhone ? (
              <View style={styles.phoneRow}>
                <Phone size={10} color={isDark ? '#94A3B8' : '#64748B'} />
                <Text
                  style={[
                    styles.userPhone,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                >
                  {userPhone}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Action Badge */}
        <View
          style={[
            styles.actionBadge,
            {
              backgroundColor: badge.bgColor,
              borderColor: badge.borderColor,
            },
          ]}
        >
          <ActionIcon size={11} color={badge.color} strokeWidth={2.4} />
          <Text style={[styles.actionText, { color: badge.color }]}>
            {badge.label}
          </Text>
        </View>
      </View>

      {/* 2. Middle Row: Module Tag + Detail Description */}
      <View style={styles.bodySection}>
        <View style={styles.detailRow}>
          {item.module ? (
            <View
              style={[
                styles.modulePill,
                {
                  backgroundColor: isDark
                    ? 'rgba(2, 132, 199, 0.12)'
                    : '#F0F9FF',
                  borderColor: isDark ? 'rgba(2, 132, 199, 0.3)' : '#BAE6FD',
                },
              ]}
            >
              <Folder size={11} color="#0284C7" strokeWidth={2.2} />
              <Text style={styles.moduleText}>{item.module}</Text>
            </View>
          ) : null}

          <Text
            style={[
              styles.detailText,
              { color: isDark ? '#E2E8F0' : '#1E293B' },
            ]}
          >
            {item.detail || 'System operation executed.'}
          </Text>
        </View>
      </View>

      {/* 3. Footer Row: IP Address + IST Timestamp */}
      <View
        style={[
          styles.footerRow,
          { borderTopColor: isDark ? '#1E293B' : '#F1F5F9' },
        ]}
      >
        {/* IP Address */}
        <View
          style={[
            styles.ipPill,
            {
              backgroundColor: isDark ? '#162032' : '#F8FAFC',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
            },
          ]}
        >
          <Globe size={11} color={isDark ? '#94A3B8' : '#64748B'} />
          <Text
            style={[
              styles.ipText,
              { color: isDark ? '#94A3B8' : '#64748B' },
            ]}
          >
            {item.ip_address || '127.0.0.1'}
          </Text>
        </View>

        {/* Date & Time (IST) */}
        <View style={styles.timeRow}>
          <Clock size={11} color={isDark ? '#64748B' : '#94A3B8'} />
          <Text
            style={[
              styles.timeText,
              { color: isDark ? '#64748B' : '#94A3B8' },
            ]}
          >
            {item.created_at || 'Just now'}
          </Text>
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
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  userInfoCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    flex: 1,
  },
  avatarBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0284C7',
  },
  nameBlock: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  userIdTag: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  userIdText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  userPhone: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  bodySection: {
    marginTop: 8,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    flexWrap: 'wrap',
  },
  modulePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  moduleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  detailText: {
    fontSize: 12.5,
    fontWeight: '500',
    lineHeight: 17,
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  ipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  ipText: {
    fontSize: 10.5,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '500',
  },
});

