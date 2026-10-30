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
import { Brand } from '../types';

interface DeleteBrandModalProps {
  visible: boolean;
  item: Brand | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteBrandModal: React.FC<DeleteBrandModalProps> = ({
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
          {/* Header Warning Icon */}
          <View style={styles.topRow}>
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: isDark
                    ? 'rgba(239, 68, 68, 0.15)'
                    : '#FEF2F2',
                },
              ]}
            >
              <AlertTriangle size={24} color="#DC2626" strokeWidth={2.4} />
            </View>

            <TouchableOpacity
              onPress={onClose}
              disabled={isDeleting}
              style={[
                styles.closeBtn,
                {
                  backgroundColor: isDark ? '#162030' : '#F1F5F9',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={15} color={colors.textSecondary} strokeWidth={2.4} />
            </TouchableOpacity>
          </View>

          {/* Title & Body */}
          <Text
            style={[
              styles.title,
              { color: isDark ? '#F8FAFC' : '#0F172A' },
            ]}
          >
            Delete Brand
          </Text>

          <Text
            style={[
              styles.bodyText,
              { color: isDark ? '#CBD5E1' : '#475569' },
            ]}
          >
            Are you sure you want to delete brand{' '}
            <Text style={{ fontWeight: '800', color: isDark ? '#FFFFFF' : '#0F172A' }}>
              "{item.name}"
            </Text>
            ?
          </Text>

          <View
            style={[
              styles.warningCallout,
              {
                backgroundColor: isDark
                  ? 'rgba(239, 68, 68, 0.1)'
                  : '#FFF1F2',
                borderColor: isDark ? '#991B1B' : '#FECDD3',
              },
            ]}
          >
            <Text style={styles.warningCalloutText}>
              ⚠️ Deleting this brand will unbind all associated vehicle models and variant pricing from active showroom quotations.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[
                styles.cancelBtn,
                {
                  backgroundColor: isDark ? '#162030' : '#F1F5F9',
                  borderColor: isDark ? '#1E293B' : '#CBD5E1',
                },
              ]}
              onPress={onClose}
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
                isDeleting && styles.deleteBtnDisabled,
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
                  <Trash2 size={15} color="#FFFFFF" strokeWidth={2.2} />
                  <Text style={styles.deleteBtnText}>Confirm Delete</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  warningCallout: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 18,
  },
  warningCalloutText: {
    fontSize: 11,
    color: '#DC2626',
    lineHeight: 16,
    fontWeight: '500',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
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
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
  },
  deleteBtnDisabled: {
    opacity: 0.6,
  },
  deleteBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
});
