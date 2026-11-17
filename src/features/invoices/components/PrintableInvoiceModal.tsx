import React, { useState } from 'react';
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
  Building2,
  CheckCircle2,
  Download,
  FileText,
  Printer,
  ShieldCheck,
  User,
  X,
} from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { showErrorToast, showSuccessToast } from '../../../core/utils/toast';
import { invoiceService } from '../invoiceService';
import { numberToWordsIndian } from '../../leads/components/ConvertToDealModal';
import { InvoiceRecord } from '../types';

interface PrintableInvoiceModalProps {
  visible: boolean;
  invoice: InvoiceRecord | null;
  onClose: () => void;
}

export const PrintableInvoiceModal: React.FC<PrintableInvoiceModalProps> = ({
  visible,
  invoice,
  onClose,
}) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [downloading, setDownloading] = useState(false);

  const formatInr = (val?: number | string) => {
    const num = Number(val || 0);
    return '₹' + num.toLocaleString('en-IN');
  };

  const handleDownload = async () => {
    if (!invoice) return;
    try {
      triggerHaptic();
      setDownloading(true);
      showSuccessToast('Downloading...', 'Initiating official tax invoice PDF download.');
      const path = await invoiceService.downloadInvoicePdf(invoice.deal_id, invoice.invoice_no);
      showSuccessToast('PDF Downloaded', `Invoice saved to ${path}`);
    } catch (err: any) {
      showErrorToast('Download Failed', err?.message || 'Could not download invoice PDF.');
    } finally {
      setDownloading(false);
    }
  };

  if (!invoice) return null;

  const parent = invoice.parent_deal;
  const netAmount = Number(
    invoice.deal_total_amount || parent?.net_amount || parent?.total_amount || invoice.amount || 0
  );
  const paidToDate = Number(
    invoice.deal_paid_amount || parent?.paid_amount || parent?.total_paid || invoice.amount || 0
  );
  const balanceDue = Number(
    invoice.deal_balance_due !== undefined
      ? invoice.deal_balance_due
      : Math.max(0, netAmount - paidToDate)
  );

  const amountWords = numberToWordsIndian(invoice.amount);

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: isDark ? '#101726' : '#FFFFFF',
              maxHeight: '92%',
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
            <View style={styles.headerLeft}>
              <FileText size={18} color="#58632A" />
              <View>
                <Text style={[styles.modalHeaderTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                  Tax Invoice & Payment Voucher
                </Text>
                <Text style={styles.modalHeaderSub}>{invoice.invoice_no}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Dealership Letterhead */}
            <View
              style={[
                styles.letterheadBox,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                },
              ]}
            >
              <View style={styles.brandRow}>
                <View style={styles.brandLogoCircle}>
                  <Text style={styles.brandLogoText}>DA</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.companyName}>DEFENCE AUTOLINK</Text>
                  <Text style={styles.companySub}>CSD & CIVIL AUTOMOTIVE DEALERSHIP</Text>
                  <Text style={styles.companyAddress}>
                    D-601, SG Business Hub, SG Highway, Ahmedabad, Gujarat - 382470
                  </Text>
                  <Text style={styles.gstinText}>GSTIN: 24AAACD1234F1Z5 • PAN: AAACD1234F</Text>
                </View>
              </View>

              <View style={styles.voucherTitleBar}>
                <Text style={styles.voucherTitle}>TAX INVOICE / PAYMENT RECEIPT</Text>
                <View style={styles.statusPill}>
                  <CheckCircle2 size={11} color="#15803D" strokeWidth={2.5} />
                  <Text style={styles.statusPillText}>{invoice.status || 'PAID'}</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  Invoice No: <Text style={{ fontWeight: '800' }}>{invoice.invoice_no}</Text>
                </Text>
                <Text style={styles.metaText}>
                  Date: <Text style={{ fontWeight: '700' }}>{invoice.payment_date}</Text> {invoice.time || ''}
                </Text>
              </View>
            </View>

            {/* Bill To & Vehicle Specification Grid */}
            <View style={styles.twoColGrid}>
              {/* Customer Box */}
              <View
                style={[
                  styles.infoBox,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                  },
                ]}
              >
                <Text style={styles.infoBoxTitle}>CUSTOMER / BILL TO</Text>
                <Text style={[styles.infoMainText, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                  {invoice.customer_name}
                </Text>
                <Text style={styles.infoSubText}>Phone: {invoice.customer_phone || '-'}</Text>
                {invoice.customer_email ? (
                  <Text style={styles.infoSubText}>Email: {invoice.customer_email}</Text>
                ) : null}
                <Text style={styles.infoSubText}>
                  City: {invoice.customer_city || parent?.city || 'Gujarat'}
                </Text>
                <Text style={[styles.dealRefText, { color: isDark ? '#60A5FA' : '#1D4ED8' }]}>
                  Deal Ref: {invoice.deal_number}
                </Text>
              </View>

              {/* Vehicle Box */}
              <View
                style={[
                  styles.infoBox,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                  },
                ]}
              >
                <Text style={styles.infoBoxTitle}>VEHICLE SPECIFICATION</Text>
                <Text style={[styles.infoMainText, { color: '#0284C7' }]}>
                  {invoice.vehicle_model || parent?.model_variant || 'Vehicle'}
                </Text>
                <Text style={styles.infoSubText}>Color: {invoice.color || parent?.color || 'Standard'}</Text>
                <Text style={styles.infoSubText}>
                  VIN: {invoice.vin || parent?.vin_chassis_number || 'Pending Allocation'}
                </Text>
                <Text style={styles.infoSubText}>
                  Reg No: {invoice.registration_number || parent?.registration_number || 'Pending'}
                </Text>
                <View style={styles.insTag}>
                  <Text style={styles.insTagText}>
                    Insurance: {invoice.has_insurance || parent?.has_insurance ? 'Included' : 'No'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Particulars Table */}
            <View
              style={[
                styles.tableCard,
                {
                  backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                },
              ]}
            >
              <View style={[styles.tableHeader, { backgroundColor: isDark ? '#0F172A' : '#F1F5F9' }]}>
                <Text style={[styles.thCell, { flex: 2 }]}>Particulars</Text>
                <Text style={[styles.thCell, { flex: 1, textAlign: 'center' }]}>HSN</Text>
                <Text style={[styles.thCell, { flex: 1, textAlign: 'center' }]}>Mode</Text>
                <Text style={[styles.thCell, { flex: 1.5, textAlign: 'right' }]}>Amount</Text>
              </View>

              <View style={styles.tableRow}>
                <View style={{ flex: 2 }}>
                  <Text style={[styles.tdMainText, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                    {invoice.payment_type || 'Installment Payment'}
                  </Text>
                  <Text style={styles.tdSubText}>
                    Ref: {invoice.transaction_reference || 'VERIFIED'}
                  </Text>
                </View>
                <Text style={[styles.tdCell, { flex: 1, textAlign: 'center' }]}>998313</Text>
                <Text style={[styles.tdCell, { flex: 1, textAlign: 'center' }]}>
                  {(invoice.payment_mode || 'UPI').toUpperCase()}
                </Text>
                <Text style={[styles.tdAmountText, { flex: 1.5, textAlign: 'right' }]}>
                  {formatInr(invoice.amount)}
                </Text>
              </View>
            </View>

            {/* Financial Summary */}
            <View
              style={[
                styles.finSummaryCard,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                },
              ]}
            >
              <View style={styles.finLine}>
                <Text style={styles.finLineLabel}>Total Deal Amount</Text>
                <Text style={[styles.finLineVal, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                  {formatInr(netAmount)}
                </Text>
              </View>
              <View style={styles.finLine}>
                <Text style={styles.finLineLabel}>Current Invoice Paid</Text>
                <Text style={[styles.finLineVal, { color: '#059669', fontWeight: '800' }]}>
                  {formatInr(invoice.amount)}
                </Text>
              </View>
              <View style={styles.finLine}>
                <Text style={styles.finLineLabel}>Total Cumulative Paid to Date</Text>
                <Text style={[styles.finLineVal, { color: '#059669' }]}>
                  {formatInr(paidToDate)}
                </Text>
              </View>
              <View style={[styles.finLine, styles.dueLine]}>
                <Text style={styles.dueLineLabel}>Balance Due Remaining</Text>
                <Text style={styles.dueLineVal}>{formatInr(balanceDue)}</Text>
              </View>

              {amountWords ? (
                <View style={styles.wordsWrap}>
                  <Text style={styles.wordsLabel}>Amount in Words:</Text>
                  <Text style={styles.wordsText}>₹ {amountWords}</Text>
                </View>
              ) : null}
            </View>

            {/* Terms & Signatures */}
            <View style={styles.termsRow}>
              <View style={styles.termsCol}>
                <Text style={styles.termsHeading}>Terms & Conditions:</Text>
                <Text style={styles.termsText}>
                  1. Official computer-generated receipt for Defence CSD/Civil portal.
                </Text>
                <Text style={styles.termsText}>
                  2. Token/Installment amounts adjusted against final delivery invoice.
                </Text>
                <Text style={styles.termsText}>
                  3. Vehicle allocation subject to manufacturer dispatch & clearance.
                </Text>
              </View>

              <View style={styles.signCol}>
                <View style={styles.sealBox}>
                  <Text style={styles.sealText}>DEFENCE AUTOLINK</Text>
                  <Text style={styles.sealSub}>AUTHORIZED RECEIPT</Text>
                </View>
                <Text style={styles.signLabel}>Authorized Signatory</Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={[styles.footerActions, { borderTopColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.downloadBtn, downloading && { opacity: 0.7 }]}
              onPress={handleDownload}
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
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 14,
  },
  container: {
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 8,
  },
  modalHeader: {
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
  modalHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  modalHeaderSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 14,
  },
  letterheadBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  brandRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  brandLogoCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#58632A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandLogoText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  companyName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#58632A',
    letterSpacing: 0.5,
  },
  companySub: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '700',
  },
  companyAddress: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 2,
  },
  gstinText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1E3A8A',
    marginTop: 2,
  },
  voucherTitleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#CBD5E1',
    marginVertical: 6,
  },
  voucherTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#131C27',
    letterSpacing: 0.5,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 10,
    color: '#64748B',
  },
  twoColGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  infoBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  infoBoxTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  infoMainText: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  infoSubText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  dealRefText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  insTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginTop: 4,
  },
  insTagText: {
    fontSize: 9,
    color: '#1E3A8A',
    fontWeight: '700',
  },
  tableCard: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  thCell: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tdCell: {
    fontSize: 11,
    color: '#64748B',
  },
  tdMainText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tdSubText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  tdAmountText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#059669',
  },
  finSummaryCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
    gap: 4,
  },
  finLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  finLineLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  finLineVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  dueLine: {
    borderTopWidth: 1,
    borderTopColor: '#CBD5E1',
    marginTop: 4,
    paddingTop: 6,
  },
  dueLineLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },
  dueLineVal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#DC2626',
  },
  wordsWrap: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  wordsLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  wordsText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#58632A',
    fontStyle: 'italic',
    marginTop: 1,
  },
  termsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 10,
    paddingTop: 8,
  },
  termsCol: {
    flex: 1.5,
  },
  termsHeading: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 2,
  },
  termsText: {
    fontSize: 8.5,
    color: '#64748B',
    lineHeight: 12,
  },
  signCol: {
    flex: 1,
    alignItems: 'center',
  },
  sealBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#58632A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 4,
  },
  sealText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#58632A',
  },
  sealSub: {
    fontSize: 7.5,
    fontWeight: '700',
    color: '#58632A',
  },
  signLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
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
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelBtnText: {
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

