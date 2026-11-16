import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  PhoneCall,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { FollowUpItem } from '../types';

export interface FollowUpActionsModalProps {
  visible: boolean;
  item: FollowUpItem | null;
  onClose: () => void;
  onCall?: (phone: string) => void;
  onCallAndLog?: (item: FollowUpItem) => void;
  onLogAction?: (item: FollowUpItem) => void;
  onSendQuotation: (item: FollowUpItem) => void;
  onViewProfile: (item: FollowUpItem) => void;
}

export const FollowUpActionsModal: React.FC<FollowUpActionsModalProps> = ({
  visible,
  item,
  onClose,
  onCall,
  onCallAndLog,
  onLogAction,
  onSendQuotation,
  onViewProfile,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  if (!visible || !item) return null;

  // Task 2: In follow-up action menu, keep only Call Now (remove send quotation, log action, view details)
  const actions = [
    {
      id: 'call_now',
      title: 'Call Now',
      sub: `Direct phone call to ${item.phone}`,
      icon: PhoneCall,
      color: '#16A34A',
      bg: isDark ? 'rgba(22, 163, 74, 0.15)' : '#DCFCE7',
      onPress: () => {
        onClose();
        setTimeout(() => {
          if (onCall) {
            onCall(item.phone);
          } else if (onCallAndLog) {
            onCallAndLog(item);
          }
        }, 120);
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
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text
                style={[
                  styles.sheetTitle,
                  { color: isDark ? '#FFFFFF' : '#0F172A' },
                ]}
                numberOfLines={1}
              >
                {item.customer_name}
              </Text>
              <Text
                style={[
                  styles.sheetSub,
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
                numberOfLines={1}
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
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sheetSub: {
    fontSize: 12,
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
    fontSize: 13.5,
    fontWeight: '700',
  },
  actionSub: {
    fontSize: 11,
    marginTop: 2,
  },
});
