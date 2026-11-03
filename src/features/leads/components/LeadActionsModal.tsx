import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Award,
  Edit3,
  Eye,
  FileText,
  PhoneCall,
  Trash2,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { CustomerLead } from '../types';

interface LeadActionsModalProps {
  visible: boolean;
  lead: CustomerLead | null;
  onClose: () => void;
  onView360: (lead: CustomerLead) => void;
  onConvertDeal: (lead: CustomerLead) => void;
  onLogFollowUp: (lead: CustomerLead) => void;
  onSendQuotation: (lead: CustomerLead) => void;
  onEditLead: (lead: CustomerLead) => void;
  onDeleteLead: (lead: CustomerLead) => void;
}

export const LeadActionsModal: React.FC<LeadActionsModalProps> = ({
  visible,
  lead,
  onClose,
  onView360,
  onConvertDeal,
  onLogFollowUp,
  onSendQuotation,
  onEditLead,
  onDeleteLead,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const handleAction = (actionFn: (lead: CustomerLead) => void) => {
    triggerHaptic('selection');
    onClose();
    if (lead) {
      actionFn(lead);
    }
  };

  if (!visible || !lead) return null;

  return (
    <Modal
      visible={visible && !!lead}
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
          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={{
              paddingBottom: Math.max(insets.bottom, 16) + 12,
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Header: Lead Name & Quick Meta */}
            <View
              style={[
                styles.headerRow,
                { borderBottomColor: isDark ? '#1E293B' : '#F1F5F9' },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.leadName, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {lead.name}
                </Text>
                <Text
                  style={[styles.leadPhone, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {lead.phone} • {lead.home_town || lead.city || 'CSD Beneficiary'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('impactLight');
                  onClose();
                }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={[
                  styles.closeBtn,
                  { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                ]}
                activeOpacity={0.7}
              >
                <X size={16} color={colors.textSecondary} strokeWidth={2.2} />
              </TouchableOpacity>
            </View>

            {/* Actions List - Exact Sequence matching Screenshot 2 */}
            <View style={styles.actionsList}>
              {/* 1. Log Follow-Up */}
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => handleAction(onLogFollowUp)}
                activeOpacity={0.7}
              >
                <View style={styles.iconBox}>
                  <PhoneCall size={18} color="#2563EB" strokeWidth={2.2} />
                </View>
                <Text style={[styles.actionText, { color: colors.textPrimary }]}>
                  Log Follow-Up
                </Text>
              </TouchableOpacity>

              {/* 2. Send Quotation */}
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => handleAction(onSendQuotation)}
                activeOpacity={0.7}
              >
                <View style={styles.iconBox}>
                  <FileText size={18} color="#0284C7" strokeWidth={2.2} />
                </View>
                <Text style={[styles.actionText, { color: colors.textPrimary }]}>
                  Send Quotation
                </Text>
              </TouchableOpacity>

              {/* 3. Convert to Deal (Green Trophy) */}
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => handleAction(onConvertDeal)}
                activeOpacity={0.7}
              >
                <View style={styles.iconBox}>
                  <Award size={18} color="#16A34A" strokeWidth={2.2} />
                </View>
                <Text
                  style={[
                    styles.actionText,
                    { color: isDark ? '#34D399' : '#15803D', fontWeight: '800' },
                  ]}
                >
                  Convert to Deal
                </Text>
              </TouchableOpacity>

              {/* Divider between deals and details */}
              <View
                style={[
                  styles.itemDivider,
                  { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                ]}
              />

              {/* 4. View Lead Details */}
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => handleAction(onView360)}
                activeOpacity={0.7}
              >
                <View style={styles.iconBox}>
                  <Eye size={18} color="#64748B" strokeWidth={2.2} />
                </View>
                <Text style={[styles.actionText, { color: colors.textPrimary }]}>
                  View Lead Details
                </Text>
              </TouchableOpacity>

              {/* 5. Edit Lead */}
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => handleAction(onEditLead)}
                activeOpacity={0.7}
              >
                <View style={styles.iconBox}>
                  <Edit3 size={18} color="#D97706" strokeWidth={2.2} />
                </View>
                <Text style={[styles.actionText, { color: colors.textPrimary }]}>
                  Edit Lead
                </Text>
              </TouchableOpacity>

              {/* 6. Delete Lead */}
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => handleAction(onDeleteLead)}
                activeOpacity={0.7}
              >
                <View style={styles.iconBox}>
                  <Trash2 size={18} color="#DC2626" strokeWidth={2.2} />
                </View>
                <Text
                  style={[
                    styles.actionText,
                    { color: isDark ? '#F87171' : '#DC2626' },
                  ]}
                >
                  Delete Lead
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  grabHandleRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  grabHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  modalContent: {
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    marginBottom: 6,
  },
  leadName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  leadPhone: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsList: {
    paddingVertical: 6,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginVertical: 2,
  },
  iconBox: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemDivider: {
    height: 1,
    marginVertical: 8,
    marginHorizontal: 8,
  },
});

export default LeadActionsModal;
