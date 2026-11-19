import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ReactNativeBlobUtil from 'react-native-blob-util';
import {
  Calendar,
  CheckCircle2,
  CreditCard,
  Download,
  FileDown,
  FileText,
  Globe,
  Pencil,
  Receipt,
  Tag,
  Trash2,
  User,
  Wallet,
  X,
} from 'lucide-react-native';
import { colors } from '../../../core/theme/colors';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { showErrorToast, showSuccessToast } from '../../../core/utils/toast';
import { expenseService } from '../expenseService';
import { ExpenseRecord } from '../types';

interface ExpenseDetailModalProps {
  visible: boolean;
  item: ExpenseRecord | null;
  onClose: () => void;
  onEdit: (item: ExpenseRecord) => void;
  onDelete: (item: ExpenseRecord) => void;
}

export const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({
  visible,
  item,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  if (!item) return null;

  const isOnline = item.payment_type === 'Online';
  const formattedDate = item.date
    ? new Date(item.date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A';

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadVoucher = async () => {
    if (!item) return;
    try {
      setIsDownloading(true);
      triggerHaptic('impactLight');
      const savedPath = await expenseService.downloadVoucher(item);
      triggerHaptic('notificationSuccess');
      showSuccessToast(
        'Voucher Downloaded',
        Platform.OS === 'android'
          ? 'Saved to Downloads folder'
          : 'Saved to Documents folder'
      );

      // Attempt to view/open the voucher file
      if (Platform.OS === 'android') {
        try {
          ReactNativeBlobUtil.android.actionViewIntent(savedPath, 'text/html');
        } catch (_) {}
      } else {
        try {
          ReactNativeBlobUtil.ios.openDocument(savedPath);
        } catch (_) {}
      }
    } catch (err: any) {
      console.error('Download Voucher Error:', err);
      showErrorToast('Failed to download voucher document');
    } finally {
      setIsDownloading(false);
    }
  };

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
            styles.modalContainer,
            {
              backgroundColor: isDark ? '#131C27' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : colors.border,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: isDark ? '#1E293B' : '#E2E8F0' },
            ]}
          >
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.headerIconBox,
                  { backgroundColor: isDark ? 'rgba(88, 99, 42, 0.25)' : '#EFF3DF' },
                ]}
              >
                <Receipt size={20} color={colors.primary} />
              </View>
              <View>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: isDark ? '#F1F5F9' : '#0F172A' },
                  ]}
                >
                  Expense Voucher
                </Text>
                <Text
                  style={[
                    styles.modalSubtitle,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                >
                  Invoice #{item.invoice_no}
                </Text>
              </View>
            </View>

            <View style={styles.headerRightActions}>
              <TouchableOpacity
                onPress={handleDownloadVoucher}
                disabled={isDownloading}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={[
                  styles.headerIconBtn,
                  { backgroundColor: isDark ? 'rgba(88, 99, 42, 0.25)' : '#EFF3DF' },
                ]}
              >
                {isDownloading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <FileDown size={17} color={colors.primary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.closeBtn}
              >
                <X size={20} color={isDark ? '#94A3B8' : '#64748B'} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Body */}
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Amount Banner Card */}
            <View
              style={[
                styles.amountBanner,
                {
                  backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
            >
              <Text
                style={[
                  styles.amountBannerLabel,
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
              >
                TOTAL DISBURSEMENT
              </Text>
              <Text style={styles.amountBannerValue}>
                ₹{item.amount.toLocaleString('en-IN')}
              </Text>
              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: isDark ? 'rgba(22, 163, 74, 0.2)' : '#DCFCE7',
                    borderColor: '#86EFAC',
                  },
                ]}
              >
                <CheckCircle2 size={12} color="#16A34A" />
                <Text style={styles.statusPillText}>Status: {item.status || 'Paid'}</Text>
              </View>
            </View>

            {/* Details Grid */}
            <View style={styles.detailsGrid}>
              {/* Expense Category / Title */}
              <View
                style={[
                  styles.detailBox,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                  },
                ]}
              >
                <Text style={styles.detailLabel}>EXPENSE CATEGORY</Text>
                <View style={styles.detailValueRow}>
                  <Tag size={13} color={colors.primary} />
                  <Text
                    style={[
                      styles.detailValue,
                      { color: isDark ? '#F1F5F9' : '#0F172A' },
                    ]}
                  >
                    {item.title}
                  </Text>
                </View>
              </View>

              {/* Expense Date */}
              <View
                style={[
                  styles.detailBox,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                  },
                ]}
              >
                <Text style={styles.detailLabel}>EXPENSE DATE</Text>
                <View style={styles.detailValueRow}>
                  <Calendar size={13} color={colors.primary} />
                  <Text
                    style={[
                      styles.detailValue,
                      { color: isDark ? '#F1F5F9' : '#0F172A' },
                    ]}
                  >
                    {formattedDate}
                  </Text>
                </View>
              </View>
            </View>

            {/* Vendor / Party Name */}
            <View
              style={[
                styles.fullWidthBox,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                },
              ]}
            >
              <Text style={styles.detailLabel}>PARTY / VENDOR NAME</Text>
              <Text
                style={[
                  styles.partyNameText,
                  { color: isDark ? '#F1F5F9' : '#0F172A' },
                ]}
              >
                {item.party_name}
              </Text>
            </View>

            {/* Payment Method & Transaction Reference */}
            <View
              style={[
                styles.fullWidthBox,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                },
              ]}
            >
              <Text style={styles.detailLabel}>PAYMENT METHOD & TRANSACTION REF</Text>
              <View style={styles.paymentMethodRow}>
                {isOnline ? (
                  <View style={styles.paymentTypeRow}>
                    <Globe size={14} color="#16A34A" />
                    <Text style={styles.onlineText}>Online (Bank Transfer / UPI)</Text>
                  </View>
                ) : (
                  <View style={styles.paymentTypeRow}>
                    <Wallet size={14} color="#D97706" />
                    <Text style={styles.offlineText}>Offline (Cash Settlement)</Text>
                  </View>
                )}
              </View>

              {item.reference_no ? (
                <View style={styles.refRow}>
                  <Text style={styles.refLabel}>Reference / UTR No:</Text>
                  <Text
                    style={[
                      styles.refValue,
                      { color: isDark ? '#F1F5F9' : '#0F172A' },
                    ]}
                  >
                    {item.reference_no}
                  </Text>
                </View>
              ) : null}

              {item.remark ? (
                <View style={styles.refRow}>
                  <Text style={styles.refLabel}>Remarks:</Text>
                  <Text
                    style={[
                      styles.remarkValue,
                      { color: isDark ? '#CBD5E1' : '#475569' },
                    ]}
                  >
                    {item.remark}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Paid By */}
            <View
              style={[
                styles.fullWidthBox,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                },
              ]}
            >
              <Text style={styles.detailLabel}>PAID BY / SIGNED OFFICER</Text>
              <View style={styles.paidByRow}>
                <User size={14} color={isDark ? '#94A3B8' : '#64748B'} />
                <Text
                  style={[
                    styles.paidByValue,
                    { color: isDark ? '#F1F5F9' : '#0F172A' },
                  ]}
                >
                  {item.pay_by}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View
            style={[
              styles.modalFooter,
              { borderTopColor: isDark ? '#1E293B' : '#E2E8F0' },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.deleteBtn,
                { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2' },
              ]}
              onPress={() => {
                triggerHaptic('notificationWarning');
                onClose();
                onDelete(item);
              }}
            >
              <Trash2 size={15} color="#DC2626" />
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.downloadBtn,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                },
                isDownloading && { opacity: 0.7 },
              ]}
              onPress={handleDownloadVoucher}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <FileDown size={15} color={isDark ? '#F1F5F9' : '#0F172A'} />
                  <Text
                    style={[
                      styles.downloadBtnText,
                      { color: isDark ? '#F1F5F9' : '#0F172A' },
                    ]}
                  >
                    Download PDF
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.editBtn,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => {
                triggerHaptic('impactLight');
                onClose();
                onEdit(item);
              }}
            >
              <Pencil size={15} color="#FFFFFF" />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContainer: {
    borderRadius: 16,
    borderWidth: 1,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16.5,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 11.5,
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  modalScroll: {
    maxHeight: 460,
  },
  scrollContent: {
    padding: 18,
    gap: 12,
  },
  amountBanner: {
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  amountBannerLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  amountBannerValue: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.primary,
    marginVertical: 4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  detailBox: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  fullWidthBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  detailLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailValue: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  partyNameText: {
    fontSize: 15,
    fontWeight: '700',
  },
  paymentMethodRow: {
    marginTop: 4,
  },
  paymentTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
  },
  offlineText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D97706',
  },
  refRow: {
    marginTop: 6,
  },
  refLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  refValue: {
    fontSize: 12.5,
    fontFamily: 'monospace',
    fontWeight: '700',
    marginTop: 2,
  },
  remarkValue: {
    fontSize: 12.5,
    marginTop: 2,
  },
  paidByRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  paidByValue: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 8,
  },
  deleteBtnText: {
    color: '#DC2626',
    fontSize: 12.5,
    fontWeight: '700',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
  },
  downloadBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 8,
  },
  editBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
});

