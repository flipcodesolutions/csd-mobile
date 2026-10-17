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
  Phone,
  Trash2,
  User,
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
  onQuickView: (lead: CustomerLead) => void;
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
  onQuickView,
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
              {lead.phone} • {lead.city || 'CSD Beneficiary'}
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

        {/* Actions List */}
        <View style={styles.actionsList}>
          {/* 1. View 360 Profile */}
          <TouchableOpacity
            style={[
              styles.actionItem,
              {
                backgroundColor: isDark
                  ? 'rgba(59, 130, 246, 0.15)'
                  : 'rgba(13, 110, 253, 0.08)',
              },
            ]}
            onPress={() => handleAction(onView360)}
            activeOpacity={0.7}
          >
            <User size={18} color={isDark ? '#60A5FA' : '#0D6EFD'} strokeWidth={2} />
            <Text
              style={[
                styles.actionTextPrimary,
                { color: isDark ? '#60A5FA' : '#0D6EFD' },
              ]}
            >
              View 360 Profile
            </Text>
          </TouchableOpacity>

          {/* 2. Convert to Deal */}
          <TouchableOpacity
            style={[
              styles.actionItem,
              {
                backgroundColor: isDark
                  ? 'rgba(16, 185, 129, 0.15)'
                  : 'rgba(21, 128, 61, 0.08)',
              },
            ]}
            onPress={() => handleAction(onConvertDeal)}
            activeOpacity={0.7}
          >
            <Award size={18} color={isDark ? '#34D399' : '#15803D'} strokeWidth={2} />
            <Text
              style={[
                styles.actionTextSuccess,
                { color: isDark ? '#34D399' : '#15803D' },
              ]}
            >
              Convert to Deal
            </Text>
          </TouchableOpacity>

          <View
            style={[
              styles.itemDivider,
              { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
            ]}
          />

          {/* 3. Log Follow-Up */}
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => handleAction(onLogFollowUp)}
            activeOpacity={0.7}
          >
            <Phone size={17} color={colors.textSecondary} strokeWidth={2} />
            <Text style={[styles.actionText, { color: colors.textPrimary }]}>
              Log Follow-Up
            </Text>
          </TouchableOpacity>

          {/* 4. Send Quotation */}
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => handleAction(onSendQuotation)}
            activeOpacity={0.7}
          >
            <FileText size={17} color={colors.textSecondary} strokeWidth={2} />
            <Text style={[styles.actionText, { color: colors.textPrimary }]}>
              Send Quotation
            </Text>
          </TouchableOpacity>

          {/* 5. Quick View Modal */}
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => handleAction(onQuickView)}
            activeOpacity={0.7}
          >
            <Eye size={17} color={colors.textSecondary} strokeWidth={2} />
            <Text style={[styles.actionText, { color: colors.textPrimary }]}>
              Quick View Modal
            </Text>
          </TouchableOpacity>

          {/* 6. Edit Lead */}
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => handleAction(onEditLead)}
            activeOpacity={0.7}
          >
            <Edit3 size={17} color={colors.textSecondary} strokeWidth={2} />
            <Text style={[styles.actionText, { color: colors.textPrimary }]}>
              Edit Lead
            </Text>
          </TouchableOpacity>

          <View
            style={[
              styles.itemDivider,
              { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
            ]}
          />

          {/* 7. Delete Lead */}
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => handleAction(onDeleteLead)}
            activeOpacity={0.7}
          >
            <Trash2 size={17} color={isDark ? '#F87171' : '#DC2626'} strokeWidth={2} />
            <Text
              style={[
                styles.actionTextDanger,
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
    maxHeight: '75%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  grabHandleRow: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  grabHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  leadName: {
    fontSize: 16,
    fontWeight: '800',
  },
  leadPhone: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsList: {
    paddingTop: 4,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
    gap: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionTextPrimary: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionTextSuccess: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionTextDanger: {
    fontSize: 14,
    fontWeight: '700',
  },
  itemDivider: {
    height: 1,
    marginVertical: 4,
  },
});
