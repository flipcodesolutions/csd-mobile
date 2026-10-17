import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Eye,
  FileSpreadsheet,
  PhoneCall,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { FollowUpItem } from '../types';

interface FollowUpActionsModalProps {
  visible: boolean;
  item: FollowUpItem | null;
  onClose: () => void;
  onCallAndLog: (item: FollowUpItem) => void;
  onSendQuotation: (item: FollowUpItem) => void;
  onViewProfile: (item: FollowUpItem) => void;
}

export const FollowUpActionsModal: React.FC<FollowUpActionsModalProps> = ({
  visible,
  item,
  onClose,
  onCallAndLog,
  onSendQuotation,
  onViewProfile,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  if (!visible || !item) return null;

  const actions = [
    {
      id: 'call_log',
      title: 'Call Now & Log Interaction',
      sub: 'Open CRM dialer & record call conversation outcome',
      icon: PhoneCall,
      color: colors.primary,
      bg: isDark ? 'rgba(88, 99, 42, 0.2)' : '#F5F8EE',
      onPress: () => {
        onClose();
        setTimeout(() => {
          onCallAndLog(item);
        }, 100);
      },
    },
    {
      id: 'quotation',
      title: 'Send Official CSD Quotation',
      sub: 'Generate proforma quote with on-road pricing breakdown',
      icon: FileSpreadsheet,
      color: '#3B82F6',
      bg: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(13, 110, 253, 0.08)',
      onPress: () => {
        onClose();
        setTimeout(() => {
          onSendQuotation(item);
        }, 100);
      },
    },
    {
      id: 'profile',
      title: 'View 360° Lead Dossier',
      sub: 'Inspect customer entitlements, rank, unit & history',
      icon: Eye,
      color: '#8B5CF6',
      bg: isDark ? 'rgba(139, 92, 246, 0.15)' : '#F5F3FF',
      onPress: () => {
        onClose();
        setTimeout(() => {
          onViewProfile(item);
        }, 100);
      },
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
              paddingBottom: Math.max(insets.bottom + 16, 24),
            },
          ]}
        >
          {/* Grab Handle */}
          <View style={styles.grabHandleRow}>
            <View
              style={[
                styles.grabHandle,
                { backgroundColor: isDark ? '#334155' : '#CBD5E1' },
              ]}
            />
          </View>

          {/* Header */}
          <View
            style={[
              styles.sheetHeader,
              { borderBottomColor: isDark ? '#1E293B' : '#F1F5F9' },
            ]}
          >
            <View>
              <Text
                style={[
                  styles.sheetTitle,
                  { color: isDark ? '#FFFFFF' : '#0F172A' },
                ]}
              >
                {item.customer_name}
              </Text>
              <Text
                style={[
                  styles.sheetSub,
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
              >
                {item.phone} • {item.vehicle || 'CSD Entitlement'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeBtn,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                },
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color={colors.textSecondary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Actions List */}
          <View style={styles.actionsList}>
            {actions.map((act) => {
              const IconComp = act.icon;
              return (
                <TouchableOpacity
                  key={act.id}
                  style={[
                    styles.actionItem,
                    {
                      backgroundColor: isDark ? '#101726' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#F1F5F9',
                    },
                  ]}
                  activeOpacity={0.75}
                  onPress={() => {
                    triggerHaptic('selection');
                    act.onPress();
                  }}
                >
                  <View
                    style={[styles.iconBox, { backgroundColor: act.bg }]}
                  >
                    <IconComp size={18} color={act.color} strokeWidth={2.2} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text
                      style={[
                        styles.actionTitle,
                        { color: isDark ? '#F8FAFC' : '#0F172A' },
                      ]}
                    >
                      {act.title}
                    </Text>
                    <Text
                      style={[
                        styles.actionSub,
                        { color: isDark ? '#94A3B8' : '#64748B' },
                      ]}
                    >
                      {act.sub}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: 8,
  },
  grabHandleRow: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  grabHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sheetSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionSub: {
    fontSize: 10.5,
    marginTop: 2,
  },
});
