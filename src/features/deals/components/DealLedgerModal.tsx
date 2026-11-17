import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Calendar,
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  Receipt,
  ShieldCheck,
  User,
  X,
} from 'lucide-react-native';
import { Deal, DealPaymentReceipt } from '../types';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { showErrorToast, showSuccessToast } from '../../../core/utils/toast';
import { dealService } from '../dealService';
import { numberToWordsIndian } from '../../leads/components/ConvertToDealModal';

interface DealLedgerModalProps {
  visible: boolean;
  deal: Deal | null;
  onClose: () => void;
}

export const DealLedgerModal: React.FC<DealLedgerModalProps> = ({
  visible,
  deal,
  onClose,
}) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [payments, setPayments] = useState<DealPaymentReceipt[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const formatInr = (val?: number | string) => {
    const num = Number(val || 0);
    return '₹' + num.toLocaleString('en-IN');
  };

  useEffect(() => {
    if (deal && visible) {
      loadPayments(deal.id);
    }
  }, [deal, visible]);

  const loadPayments = async (dealId: number) => {
    try {
      setLoadingPayments(true);
      const res = await dealService.getPayments(dealId);
      const items = res?.data?.data || res?.data || [];
      if (Array.isArray(items)) {
        setPayments(items);
      } else if (deal?.payments && Array.isArray(deal.payments)) {
        setPayments(deal.payments);
      }
    } catch (e) {
      console.log('Error loading deal payments:', e);
      if (deal?.payments && Array.isArray(deal.payments)) {
        setPayments(deal.payments);
      }
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!deal) return;
    try {
      triggerHaptic();
      setDownloading(true);
      showSuccessToast('Downloading...', 'Initiating Deal Order Voucher & Ledger PDF download.');
      const path = await dealService.downloadReceiptPdf(deal.id, deal.deal_number);
      showSuccessToast('PDF Downloaded', `Voucher saved to ${path}`);
    } catch (err: any) {
      showErrorToast('Download Failed', err?.message || 'Could not download receipt PDF.');
    } finally {
      setDownloading(false);
    }
  };

  if (!deal) return null;

  const netAmount = Number(deal.net_amount || deal.total_amount || 0);
  const totalReceived = Number(deal.paid_amount || deal.total_paid || 0);
  const balanceDue = Number(
    deal.balance_due !== undefined
      ? deal.balance_due
      : deal.balance_amount !== undefined
      ? deal.balance_amount
      : Math.max(0, netAmount - totalReceived)
  );

  const hasInsurance =
    deal.has_insurance === true || deal.has_insurance === 'Yes' || !!deal.insurance;

  const vehicleTitle =
    deal.model_variant ||
    `${deal.brand_name || ''} ${deal.model_name || ''} ${deal.variant_name || ''}`.trim() ||
    'Standard Vehicle';

  const amountInWords = numberToWordsIndian(netAmount);

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              maxHeight: '92%',
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: isDark ? '#334155' : '#E2E8F0' }]}>
            <View style={styles.headerLeft}>
              <Receipt size={18} color="#0284C7" />
              <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                Deal Order Voucher & Ledger
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Top Customer & Vehicle Specification Box (Matching Screenshot 3) */}
            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                },
              ]}
            >
              {/* Customer Column */}
              <View style={styles.summaryCol}>
                <Text style={styles.summaryColLabel}>CUSTOMER</Text>
                <Text
                  style={[styles.customerTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
                  numberOfLines={1}
                >
                  {deal.customer_name}
                </Text>
                <Text style={styles.customerSub}>
                  {deal.customer_phone || '-'}
                  {deal.customer_email ? ` • ${deal.customer_email}` : ''}
                </Text>
              </View>

              {/* Vehicle Specification Column */}
              <View style={styles.summaryCol}>
                <Text style={styles.summaryColLabel}>VEHICLE SPECIFICATION</Text>
                <Text style={[styles.vehicleNameText, { color: '#0284C7' }]}>
                  {vehicleTitle}
                </Text>
                <Text style={styles.vehicleSub}>
                  Color: {deal.color || 'Standard'} • VIN: {deal.vin_chassis_number || 'Pending'}
                </Text>
                <View style={styles.tagWrap}>
                  <View
                    style={[
                      styles.insPill,
                      hasInsurance ? styles.insPillYes : styles.insPillNo,
                    ]}
                  >
                    <Text
                      style={[
                        styles.insPillText,
                        hasInsurance ? styles.insPillTextYes : styles.insPillTextNo,
                      ]}
                    >
                      {hasInsurance ? 'Insurance: Yes' : 'Insurance: No'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Deal Value Column */}
              <View style={styles.summaryCol}>
                <Text style={styles.summaryColLabel}>DEAL VALUE</Text>
                <Text style={[styles.dealValLarge, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                  {formatInr(netAmount)}
                </Text>
                <Text style={styles.dealValWords}>{amountInWords}</Text>
              </View>
            </View>

            {/* Financial Overview Cards Row (3 Cards matching Screenshot 3) */}
            <View style={styles.overviewGrid}>
              <View
                style={[
                  styles.overviewCard,
                  {
                    backgroundColor: isDark ? '#0F172A' : '#F1F5F9',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                  },
                ]}
              >
                <Text style={styles.overviewLabel}>Total Net Amount</Text>
                <Text style={[styles.overviewVal, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                  {formatInr(netAmount)}
                </Text>
              </View>

              <View
                style={[
                  styles.overviewCard,
                  {
                    backgroundColor: '#DCFCE7',
                    borderColor: '#BBF7D0',
                  },
                ]}
              >
                <Text style={[styles.overviewLabel, { color: '#15803D' }]}>Total Received</Text>
                <Text style={[styles.overviewVal, { color: '#15803D' }]}>
                  {formatInr(totalReceived)}
                </Text>
              </View>

              <View
                style={[
                  styles.overviewCard,
                  {
                    backgroundColor: '#FEE2E2',
                    borderColor: '#FECACA',
                  },
                ]}
              >
                <Text style={[styles.overviewLabel, { color: '#B91C1C' }]}>Balance Due</Text>
                <Text style={[styles.overviewVal, { color: '#B91C1C' }]}>
                  {formatInr(balanceDue)}
                </Text>
              </View>
            </View>

            {/* Payment Receipts Ledger Section */}
            <View style={styles.ledgerSection}>
              <View style={styles.ledgerHeaderRow}>
                <View style={styles.ledgerTitleLeft}>
                  <Receipt size={14} color="#64748B" />
                  <Text style={[styles.ledgerTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                    Payment Receipts Ledger
                  </Text>
                </View>
                <Text style={styles.receiptsCountText}>
                  {payments.length} Receipt(s)
                </Text>
              </View>

              {loadingPayments ? (
                <View style={styles.loaderBox}>
                  <ActivityIndicator size="small" color="#58632A" />
                  <Text style={styles.loaderText}>Loading receipts ledger...</Text>
                </View>
              ) : payments.length === 0 ? (
                <View
                  style={[
                    styles.emptyLedgerBox,
                    {
                      backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                      borderColor: isDark ? '#334155' : '#E2E8F0',
                    },
                  ]}
                >
                  <Text style={styles.emptyText}>No payment receipts recorded yet.</Text>
                </View>
              ) : (
                <View style={styles.receiptsList}>
                  {payments.map((rec, index) => (
                    <View
                      key={rec.id || index}
                      style={[
                        styles.receiptCard,
                        {
                          backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                          borderColor: isDark ? '#334155' : '#E2E8F0',
                        },
                      ]}
                    >
                      {/* Top Receipt Row */}
                      <View style={styles.receiptTopRow}>
                        <View style={styles.receiptNoWrap}>
                          <Text style={[styles.receiptNoText, { color: isDark ? '#60A5FA' : '#1D4ED8' }]}>
                            {rec.receipt_number || `REC-${rec.id || index + 1}`}
                          </Text>
                          <Text style={styles.receiptDateText}>{rec.payment_date || '-'}</Text>
                        </View>

                        <View style={styles.amountStatusWrap}>
                          <Text style={[styles.receiptAmount, { color: '#059669' }]}>
                            {formatInr(rec.amount)}
                          </Text>
                          <View style={styles.clearedBadge}>
                            <Text style={styles.clearedText}>
                              {rec.status || 'Cleared'}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Detail Tags Row */}
                      <View style={styles.receiptTagsRow}>
                        <View
                          style={[
                            styles.miniTag,
                            { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                          ]}
                        >
                          <Text style={styles.miniTagText}>
                            Type: {rec.payment_type || 'Advance'}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.miniTag,
                            { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                          ]}
                        >
                          <Text style={styles.miniTagText}>
                            Mode: {rec.payment_mode || 'Cash'}
                          </Text>
                        </View>

                        {rec.payment_reference ? (
                          <View
                            style={[
                              styles.miniTag,
                              { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                            ]}
                          >
                            <Text style={styles.miniTagText}>
                              Ref: {rec.payment_reference}
                            </Text>
                          </View>
                        ) : null}

                        {rec.received_by ? (
                          <View
                            style={[
                              styles.miniTag,
                              { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                            ]}
                          >
                            <Text style={styles.miniTagText}>
                              By: {rec.received_by}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer Actions - Task 4: Replace Print with Download PDF */}
          <View style={[styles.footerActions, { borderTopColor: isDark ? '#334155' : '#E2E8F0' }]}>
            <TouchableOpacity style={styles.closeActionBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.closeActionBtnText}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.downloadBtn, downloading && { opacity: 0.7 }]}
              onPress={handleDownloadPdf}
              disabled={downloading}
              activeOpacity={0.8}
            >
              {downloading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Download size={15} color="#FFFFFF" strokeWidth={2.4} />
                  <Text style={styles.downloadBtnText}>Download PDF</Text>
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
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 14,
  },
  container: {
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 14,
  },
  summaryCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    gap: 10,
  },
  summaryCol: {
    marginBottom: 4,
  },
  summaryColLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  customerTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  customerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  vehicleNameText: {
    fontSize: 13,
    fontWeight: '800',
  },
  vehicleSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  tagWrap: {
    marginTop: 4,
  },
  insPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  insPillYes: {
    backgroundColor: '#DCFCE7',
  },
  insPillNo: {
    backgroundColor: '#F1F5F9',
  },
  insPillText: {
    fontSize: 9,
    fontWeight: '700',
  },
  insPillTextYes: {
    color: '#15803D',
  },
  insPillTextNo: {
    color: '#64748B',
  },
  dealValLarge: {
    fontSize: 17,
    fontWeight: '900',
  },
  dealValWords: {
    fontSize: 10,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 1,
  },
  overviewGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  overviewCard: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  overviewLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
    textAlign: 'center',
  },
  overviewVal: {
    fontSize: 13,
    fontWeight: '800',
  },
  ledgerSection: {
    marginTop: 4,
  },
  ledgerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ledgerTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ledgerTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  receiptsCountText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  loaderBox: {
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  loaderText: {
    fontSize: 11,
    color: '#64748B',
  },
  emptyLedgerBox: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  receiptsList: {
    gap: 8,
  },
  receiptCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  receiptTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  receiptNoWrap: {},
  receiptNoText: {
    fontSize: 12,
    fontWeight: '800',
  },
  receiptDateText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  amountStatusWrap: {
    alignItems: 'flex-end',
    gap: 2,
  },
  receiptAmount: {
    fontSize: 14,
    fontWeight: '900',
  },
  clearedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  clearedText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
  },
  receiptTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  miniTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniTagText: {
    fontSize: 9,
    color: '#475569',
    fontWeight: '600',
  },
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  closeActionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  closeActionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#58632A',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  downloadBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
