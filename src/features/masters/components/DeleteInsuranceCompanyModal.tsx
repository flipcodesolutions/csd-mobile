import React from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AlertTriangle, Trash2, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { InsuranceCompany } from '../types';

interface DeleteInsuranceCompanyModalProps {
  visible: boolean;
  item: InsuranceCompany | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteInsuranceCompanyModal: React.FC<DeleteInsuranceCompanyModalProps> = ({
  visible,
  item,
  isDeleting,
  onClose,
  onConfirm,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  if (!visible || !item) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!isDeleting) onClose();
      }}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => {
            if (!isDeleting) onClose();
          }}
        />

        <View
          style={[
            styles.dialogContainer,
            {
              backgroundColor: isDark ? '#101726' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
            },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.dialogHeader,
              { borderBottomColor: isDark ? '#1E293B' : '#F1F5F9' },
            ]}
          >
            <View style={styles.headerLeft}>
              <View style={styles.warningIconBox}>
                <AlertTriangle size={18} color="#DC2626" strokeWidth={2.5} />
              </View>
              <Text
                style={[
                  styles.dialogTitle,
                  { color: isDark ? '#F8FAFC' : '#0F172A' },
                ]}
              >
                Delete Insurance Company
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                triggerHaptic('impactLight');
                onClose();
              }}
              disabled={isDeleting}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={18} color={isDark ? '#64748B' : '#94A3B8'} />
            </TouchableOpacity>
          </View>

          {/* Body Content */}
          <View style={styles.dialogBody}>
            <Text
              style={[
                styles.bodyText,
                { color: isDark ? '#94A3B8' : '#64748B' },
              ]}
            >
              Are you sure you want to delete this insurance company?
            </Text>

            {/* Target Highlight Box */}
            <View
              style={[
                styles.highlightBox,
                {
                  backgroundColor: isDark ? '#162032' : '#F8FAFC',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
            >
              <Text
                style={[
                  styles.companyName,
                  { color: isDark ? '#F8FAFC' : '#0F172A' },
                ]}
                numberOfLines={2}
              >
                {item.name}
              </Text>
              <Text
                style={[
                  styles.warningSubtitle,
                  { color: isDark ? '#64748B' : '#94A3B8' },
                ]}
              >
                This company will be removed from future policy, quotation, and deal options.
              </Text>
            </View>
          </View>

          {/* Footer Actions */}
          <View
            style={[
              styles.dialogFooter,
              { borderTopColor: isDark ? '#1E293B' : '#F1F5F9' },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.cancelBtn,
                {
                  backgroundColor: isDark ? '#162032' : '#F1F5F9',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
              onPress={() => {
                triggerHaptic('impactLight');
                onClose();
              }}
              disabled={isDeleting}
            >
              <Text
                style={[
                  styles.cancelBtnText,
                  { color: isDark ? '#CBD5E1' : '#475569' },
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.deleteBtn,
                isDeleting && { opacity: 0.7 },
              ]}
              onPress={() => {
                triggerHaptic('notificationWarning');
                onConfirm();
              }}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Trash2 size={15} color="#FFFFFF" strokeWidth={2.4} />
                  <Text style={styles.deleteBtnText}>Yes, Delete</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  warningIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  dialogBody: {
    padding: 16,
    gap: 12,
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 18,
  },
  highlightBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  companyName: {
    fontSize: 14,
    fontWeight: '800',
  },
  warningSubtitle: {
    fontSize: 11,
    lineHeight: 16,
  },
  dialogFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DC2626',
    paddingHorizontal: 18,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

