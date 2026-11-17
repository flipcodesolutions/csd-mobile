import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Clock,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  FolderLock,
  PlusCircle,
  Receipt,
  X,
} from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { EnrichedDeal, InvoiceRecord } from '../types';

interface DealInvoicesLedgerModalProps {
  visible: boolean;
  deal: EnrichedDeal | null;
  onClose: () => void;
  onViewInvoiceBill: (inv: InvoiceRecord) => void;
  onAddNextInvoice: (deal: EnrichedDeal) => void;
}

export const DealInvoicesLedgerModal: React.FC<DealInvoicesLedgerModalProps> = ({
  visible,
  deal,
  onClose,
  onViewInvoiceBill,
  onAddNextInvoice,
}) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const formatInr = (val?: number | string) => {
    const num = Number(val || 0);
    return '₹' + num.toLocaleString('en-IN');
  };

  if (!deal) return null;

  const netAmount = Number(deal.net_amount || deal.total_amount || 0);
  const totalPaid = Number(deal.paid_amount || deal.total_paid || 0);
  const balanceDue = Number(
    deal.balance_due !== undefined ? deal.balance_due : Math.max(0, netAmount - totalPaid)
  );
  const isFullyPaid = balanceDue <= 0 || deal.payment_status === 'fully_paid';
  const invoices = deal.invoices || [];

  const vehicleName = deal.model_variant || deal.model_name || 'Vehicle';

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
          <View style={[styles.header, { borderBottomColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconCircle}>
                <FolderLock size={18} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                  Deal Ledger & Invoices: {deal.deal_number || `DEAL-${deal.id}`}
                </Text>
                <Text style={styles.headerSub} numberOfLines={1}>
                  Customer: {deal.customer_name} • {vehicleName}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* 3 Summary Cards (Matching Screenshot 3) */}
            <View style={styles.summaryGrid}>
              {/* Card 1: NET DEAL AMOUNT */}
              <View
                style={[
                  styles.summaryCard,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                  },
                ]}
              >
                <Text style={styles.summaryLabel}>NET DEAL AMOUNT</Text>
                <Text style={[styles.summaryVal, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                  {formatInr(netAmount)}
                </Text>
                <Text style={styles.summarySub} numberOfLines={1}>
                  {vehicleName}
                </Text>
              </View>

              {/* Card 2: TOTAL PAID */}
              <View
                style={[
                  styles.summaryCard,
                  {
                    backgroundColor: '#DCFCE7',
                    borderColor: '#BBF7D0',
                  },
                ]}
              >
                <Text style={[styles.summaryLabel, { color: '#15803D' }]}>TOTAL PAID</Text>
                <Text style={[styles.summaryVal, { color: '#15803D' }]}>
                  {formatInr(totalPaid)}
                </Text>
                <Text style={[styles.summarySub, { color: '#15803D' }]}>
                  {invoices.length} Invoices Cleared
                </Text>
              </View>

              {/* Card 3: BALANCE DUE */}
              <View
                style={[
                  styles.summaryCard,
                  {
                    backgroundColor: '#FEE2E2',
                    borderColor: '#FECACA',
                  },
                ]}
              >
                <Text style={[styles.summaryLabel, { color: '#B91C1C' }]}>BALANCE DUE</Text>
                <Text style={[styles.summaryVal, { color: '#B91C1C' }]}>
                  {formatInr(balanceDue)}
                </Text>
                <Text style={[styles.summarySub, { color: '#B91C1C' }]}>
                  {isFullyPaid ? 'Settled in Full' : 'Pending Receivables'}
                </Text>
              </View>
            </View>

            {/* Invoices List Section */}
            <View style={styles.invoicesSection}>
              <View style={styles.invoicesHeaderRow}>
                <View style={styles.sectionTitleLeft}>
                  <FileText size={15} color="#2563EB" />
                  <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                    All Invoices Issued for this Deal ({invoices.length} Invoices)
                  </Text>
                </View>
              </View>

              {invoices.length === 0 ? (
                <View
                  style={[
                    styles.emptyBox,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                      borderColor: isDark ? '#334155' : '#E2E8F0',
                    },
                  ]}
                >
                  <Receipt size={28} color="#94A3B8" />
                  <Text style={styles.emptyText}>No invoices issued for this deal yet.</Text>
                </View>
              ) : (
                <View style={styles.invoicesList}>
                  {invoices.map((inv, idx) => (
                    <View
                      key={inv.id || idx}
                      style={[
                        styles.invoiceRowCard,
                        {
                          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                          borderColor: isDark ? '#334155' : '#E2E8F0',
                        },
                      ]}
                    >
                      {/* Top Row: Invoice No, Date & View Bill Button */}
                      <View style={styles.invCardTop}>
                        <View style={styles.invNoWrap}>
                          <Text style={[styles.invNoText, { color: isDark ? '#60A5FA' : '#1D4ED8' }]}>
                            {inv.invoice_no}
                          </Text>
                          <Text style={styles.invDateText}>{inv.payment_date}</Text>
                        </View>

                        <TouchableOpacity
                          style={styles.viewBillBtn}
                          onPress={() => {
                            triggerHaptic('selection');
                            onViewInvoiceBill(inv);
                          }}
                          activeOpacity={0.7}
                        >
                          <FileText size={13} color="#2563EB" />
                          <Text style={styles.viewBillBtnText}>View Bill</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Middle Row: Payment Type & Amount */}
                      <View style={styles.invCardMid}>
                        <View style={styles.typeTag}>
                          <Text style={styles.typeTagText}>
                            {inv.payment_type || 'Installment Payment'}
                          </Text>
                        </View>
                        <Text style={styles.invAmountText}>{formatInr(inv.amount)}</Text>
                      </View>

                      {/* Bottom Info Row */}
                      <View style={styles.invCardBottom}>
                        <Text style={styles.metaSnippet}>
                          Mode: {(inv.payment_mode || 'Cash').toUpperCase()}
                        </Text>
                        <Text style={styles.metaSnippet}>
                          Ref: {inv.transaction_reference || 'VERIFIED'}
                        </Text>
                        <View style={styles.paidBadge}>
                          <Text style={styles.paidBadgeText}>Paid</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={[styles.footerActions, { borderTopColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
            <TouchableOpacity style={styles.closeActionBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.closeActionBtnText}>Close</Text>
            </TouchableOpacity>

            {/* Only show if balance due > 0 */}
            {!isFullyPaid && balanceDue > 0 && (
              <TouchableOpacity
                style={styles.addNextBtn}
                onPress={() => {
                  triggerHaptic('impactLight');
                  onClose();
                  onAddNextInvoice(deal);
                }}
                activeOpacity={0.8}
              >
                <PlusCircle size={15} color="#FFFFFF" strokeWidth={2.4} />
                <Text style={styles.addNextBtnText}>+ Add Next Installment Invoice</Text>
              </TouchableOpacity>
            )}
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
    gap: 10,
    flex: 1,
  },
  headerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#58632A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  headerSub: {
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
  summaryGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  summaryCard: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  summaryLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.3,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '900',
  },
  summarySub: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 2,
  },
  invoicesSection: {
    marginTop: 4,
  },
  invoicesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  emptyBox: {
    padding: 24,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  invoicesList: {
    gap: 8,
  },
  invoiceRowCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  invCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  invNoWrap: {},
  invNoText: {
    fontSize: 12,
    fontWeight: '800',
  },
  invDateText: {
    fontSize: 10,
    color: '#64748B',
  },
  viewBillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  viewBillBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  invCardMid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#334155',
  },
  invAmountText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#059669',
  },
  invCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  metaSnippet: {
    fontSize: 10,
    color: '#64748B',
  },
  paidBadge: {
    marginLeft: 'auto',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  paidBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
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
  addNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#58632A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addNextBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

