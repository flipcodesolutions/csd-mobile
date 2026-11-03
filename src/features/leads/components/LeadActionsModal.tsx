import React from 'react';
import {
  Linking,
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
  MessageCircle,
  Phone,
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
  onCall?: (phone: string) => void;
  onWhatsApp?: (phone: string) => void;
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
  onCall,
  onWhatsApp,
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

  const handleCall = () => {
    triggerHaptic('impactLight');
    onClose();
    if (!lead?.phone) return;
    if (onCall) {
      onCall(lead.phone);
    } else {
      Linking.openURL(`tel:${lead.phone}`).catch(() => {});
    }
  };

  const handleWhatsApp = () => {
    triggerHaptic('impactLight');
    onClose();
    if (!lead?.phone) return;
    if (onWhatsApp) {
      onWhatsApp(lead.phone);
    } else {
      const cleanPhone = (lead.phone || '').replace(/\D/g, '');
      const phoneWithCountry =
        cleanPhone.startsWith('91') && cleanPhone.length === 12
          ? cleanPhone
          : `91${cleanPhone}`;
      const url = `whatsapp://send?phone=${phoneWithCountry}`;
      Linking.canOpenURL(url)
        .then((supported) => {
          if (supported) {
            Linking.openURL(url);
          } else {
            Linking.openURL(`https://wa.me/${phoneWithCountry}`);
          }
        })
        .catch(() => {
          Linking.openURL(`https://wa.me/${phoneWithCountry}`);
        });
    }
  };

  if (!visible || !lead) return null;

  return (
    <Modal
      visible={visible && !!lead}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
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
              paddingBottom: Math.max(insets.bottom, 16) + 16,
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

            {/* Actions List */}
            <View style={styles.actionsList}>
              {/* 1. Direct Call */}
              <TouchableOpacity
                style={styles.actionItem}
                onPress={handleCall}
                activeOpacity={0.7}
              >
                <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
                  <Phone size={17} color="#16A34A" strokeWidth={2.4} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actionText, { color: colors.textPrimary }]}>
                    Call Customer
                  </Text>
                  <Text style={[styles.actionSubtext, { color: colors.textSecondary }]}>
                    {lead.phone}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 2. Direct WhatsApp */}
              <TouchableOpacity
                style={styles.actionItem}
                onPress={handleWhatsApp}
                activeOpacity={0.7}
              >
                <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
                  <MessageCircle size={17} color="#16A34A" strokeWidth={2.4} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actionText, { color: colors.textPrimary }]}>
                    WhatsApp Chat
                  </Text>
                  <Text style={[styles.actionSubtext, { color: colors.textSecondary }]}>
                    Send message directly
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Divider */}
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
                <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
                  <PhoneCall size={17} color="#2563EB" strokeWidth={2.2} />
                </View>
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
                <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
                  <FileText size={17} color="#0284C7" strokeWidth={2.2} />
                </View>
                <Text style={[styles.actionText, { color: colors.textPrimary }]}>
                  Send Quotation
                </Text>
              </TouchableOpacity>

              {/* 5. Convert to Deal (Green Trophy) */}
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => handleAction(onConvertDeal)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
                  <Award size={17} color="#16A34A" strokeWidth={2.2} />
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

              {/* 6. View Lead Details */}
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => handleAction(onView360)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconBox, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                  <Eye size={17} color="#64748B" strokeWidth={2.2} />
                </View>
                <Text style={[styles.actionText, { color: colors.textPrimary }]}>
                  View Lead Details
                </Text>
              </TouchableOpacity>

              {/* 7. Edit Lead */}
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => handleAction(onEditLead)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                  <Edit3 size={17} color="#D97706" strokeWidth={2.2} />
                </View>
                <Text style={[styles.actionText, { color: colors.textPrimary }]}>
                  Edit Lead
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View
                style={[
                  styles.itemDivider,
                  { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                ]}
              />

              {/* 8. Delete Lead */}
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => handleAction(onDeleteLead)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
                  <Trash2 size={17} color="#DC2626" strokeWidth={2.2} />
                </View>
                <Text
                  style={[
                    styles.actionText,
                    { color: isDark ? '#F87171' : '#DC2626', fontWeight: '700' },
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
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionSubtext: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  itemDivider: {
    height: 1,
    marginVertical: 8,
    marginHorizontal: 8,
  },
});

export default LeadActionsModal;
