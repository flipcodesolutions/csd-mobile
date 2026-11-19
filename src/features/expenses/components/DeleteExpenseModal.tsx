import React, { useState } from 'react';
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
import { ExpenseRecord } from '../types';

interface DeleteExpenseModalProps {
  visible: boolean;
  item: ExpenseRecord | null;
  onClose: () => void;
  onConfirm: (item: ExpenseRecord) => Promise<void>;
}

export const DeleteExpenseModal: React.FC<DeleteExpenseModalProps> = ({
  visible,
  item,
  onClose,
  onConfirm,
}) => {
  const { isDark } = useTheme();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!item) return null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onConfirm(item);
      triggerHaptic('notificationSuccess');
      onClose();
    } catch {
      // Error handled by parent toast
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[
            styles.dialog,
            {
              backgroundColor: isDark ? '#131C27' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.alertIconBox}>
              <AlertTriangle size={24} color="#DC2626" />
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={isDark ? '#94A3B8' : '#64748B'} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text
              style={[
                styles.title,
                { color: isDark ? '#F1F5F9' : '#0F172A' },
              ]}
            >
              Permanently Delete Expense?
            </Text>

            <Text
              style={[
                styles.message,
                { color: isDark ? '#94A3B8' : '#475569' },
              ]}
            >
              Are you sure you want to permanently delete this expense voucher? This action cannot be reversed.
            </Text>

            {/* Target Particulars */}
            <View
              style={[
                styles.itemCard,
                {
                  backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
            >
              <Text
                style={[
                  styles.itemTitle,
                  { color: isDark ? '#F1F5F9' : '#0F172A' },
                ]}
                numberOfLines={1}
              >
                {item.party_name}
              </Text>
              <Text style={styles.itemSub}>
                Invoice: #{item.invoice_no} • ₹{item.amount.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.itemCategory}>
                Category: {item.title} ({item.date})
              </Text>
            </View>

            <View style={styles.policyWarning}>
              <Text style={styles.policyWarningText}>
                ⚠️ HARD DELETE POLICY: Record and associated voucher receipts will be erased from database permanently.
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View
            style={[
              styles.actionsRow,
              { borderTopColor: isDark ? '#1E293B' : '#E2E8F0' },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.cancelBtn,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
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
                isDeleting && { opacity: 0.7 },
              ]}
              onPress={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Trash2 size={16} color="#FFFFFF" />
                  <Text style={styles.deleteBtnText}>Delete Permanently</Text>
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
  dialog: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  alertIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  itemCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  itemSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  itemCategory: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  policyWarning: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 8,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
  },
  policyWarningText: {
    fontSize: 10.5,
    color: '#DC2626',
    fontWeight: '600',
    lineHeight: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    height: 40,
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
    paddingHorizontal: 18,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#DC2626',
  },
  deleteBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

