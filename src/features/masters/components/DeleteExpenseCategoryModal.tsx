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
import { ExpenseCategory } from '../types';

interface DeleteExpenseCategoryModalProps {
  visible: boolean;
  targetCategory: ExpenseCategory | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteExpenseCategoryModal: React.FC<
  DeleteExpenseCategoryModalProps
> = ({ visible, targetCategory, isDeleting, onClose, onConfirm }) => {
  const { isDark } = useTheme();

  if (!targetCategory) return null;

  const title = targetCategory.title || targetCategory.name || 'Expense Category';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.dialog,
            {
              backgroundColor: isDark ? '#101726' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
            },
          ]}
        >
          {/* Top Row: Icon + Close */}
          <View style={styles.topRow}>
            <View style={styles.iconCircle}>
              <AlertTriangle size={24} color="#EF4444" strokeWidth={2.4} />
            </View>
            <TouchableOpacity
              onPress={onClose}
              disabled={isDeleting}
              style={[
                styles.closeBtn,
                { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
              ]}
            >
              <X size={16} color={isDark ? '#CBD5E1' : '#64748B'} strokeWidth={2.4} />
            </TouchableOpacity>
          </View>

          {/* Title & Body */}
          <Text
            style={[
              styles.title,
              { color: isDark ? '#F8FAFC' : '#0F172A' },
            ]}
          >
            Delete Expense Category
          </Text>

          <Text
            style={[
              styles.body,
              { color: isDark ? '#94A3B8' : '#475569' },
            ]}
          >
            Are you sure you want to delete expense category:
          </Text>

          {/* Highlighted Category Box */}
          <View
            style={[
              styles.highlightBox,
              {
                backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                borderColor: isDark ? '#334155' : '#CBD5E1',
              },
            ]}
          >
            <Text
              style={[
                styles.highlightText,
                { color: isDark ? '#FFFFFF' : '#0F172A' },
              ]}
            >
              "{title}"
            </Text>
          </View>

          {/* Warning Box */}
          <View
            style={[
              styles.warningBox,
              {
                backgroundColor: isDark
                  ? 'rgba(239, 68, 68, 0.12)'
                  : '#FEF2F2',
                borderColor: isDark ? '#7F1D1D' : '#FEE2E2',
              },
            ]}
          >
            <Text
              style={[
                styles.warningText,
                { color: isDark ? '#FCA5A5' : '#B91C1C' },
              ]}
            >
              ⚠️ Deleting this category will remove it from daily expense logs
              and showroom accounting ledgers.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
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
                styles.confirmBtn,
                isDeleting && { opacity: 0.7 },
              ]}
              onPress={onConfirm}
              disabled={isDeleting}
              activeOpacity={0.85}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Trash2 size={15} color="#FFFFFF" strokeWidth={2.4} />
                  <Text style={styles.confirmBtnText}>Confirm Delete</Text>
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
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 8,
  },
  body: {
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: 8,
  },
  highlightBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  highlightText: {
    fontSize: 14,
    fontWeight: '800',
  },
  warningBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 18,
  },
  warningText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    gap: 6,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
