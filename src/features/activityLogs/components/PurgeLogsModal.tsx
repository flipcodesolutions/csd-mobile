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
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';

interface PurgeLogsModalProps {
  visible: boolean;
  isPurging: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const PurgeLogsModal: React.FC<PurgeLogsModalProps> = ({
  visible,
  isPurging,
  onClose,
  onConfirm,
}) => {
  const { isDark } = useTheme();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!isPurging) onClose();
      }}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => {
            if (!isPurging) onClose();
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
                <AlertTriangle size={18} color="#DC2626" strokeWidth={2.4} />
              </View>
              <Text
                style={[
                  styles.dialogTitle,
                  { color: isDark ? '#F8FAFC' : '#0F172A' },
                ]}
              >
                Delete 2 Month Old Logs
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                triggerHaptic('impactLight');
                onClose();
              }}
              disabled={isPurging}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={18} color={isDark ? '#64748B' : '#94A3B8'} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={styles.dialogBody}>
            <Text
              style={[
                styles.bodyText,
                { color: isDark ? '#E2E8F0' : '#1E293B' },
              ]}
            >
              Are you sure you want to permanently delete all activity and audit logs older than 2 months?
            </Text>

            <View
              style={[
                styles.highlightBox,
                {
                  backgroundColor: isDark ? '#162032' : '#FEF2F2',
                  borderColor: isDark ? '#1E293B' : '#FECACA',
                },
              ]}
            >
              <Text style={styles.warningTitle}>⚠️ Permanent Database Cleanup</Text>
              <Text
                style={[
                  styles.warningSubtitle,
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
              >
                This operation will permanently purge older records to optimize system performance. This action cannot be undone.
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
              onPress={onClose}
              disabled={isPurging}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.cancelBtnText,
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.deleteBtn, isPurging && styles.btnDisabled]}
              onPress={onConfirm}
              disabled={isPurging}
              activeOpacity={0.8}
            >
              {isPurging ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Trash2 size={15} color="#FFFFFF" strokeWidth={2.2} />
                  <Text style={styles.deleteBtnText}>Yes, Delete Old Logs</Text>
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
    maxWidth: 380,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    flex: 1,
  },
  dialogBody: {
    padding: 16,
    gap: 12,
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  highlightBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  warningTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  warningSubtitle: {
    fontSize: 11,
    lineHeight: 15,
  },
  dialogFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  deleteBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.7,
  },
});

