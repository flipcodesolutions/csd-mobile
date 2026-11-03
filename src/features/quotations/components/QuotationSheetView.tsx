import React from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Download, Mail, X } from 'lucide-react-native';
import { QuotationFormData } from '../types';
import { useTheme } from '../../../core/theme/ThemeContext';
import { showSuccessToast, showErrorToast } from '../../../core/utils/toast';
import { quotationService } from '../quotationService';

interface QuotationSheetViewProps {
  visible: boolean;
  data: QuotationFormData;
  quotationId?: number;
  quotationNo?: string;
  onClose: () => void;
  onOpenEmail?: () => void;
}

export const QuotationSheetView: React.FC<QuotationSheetViewProps> = ({
  visible,
  data,
  quotationId,
  quotationNo,
  onClose,
  onOpenEmail,
}) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const parseAmount = (val: string | number) => {
    const num = parseFloat(String(val || 0).replace(/[^0-9.-]+/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const formatInr = (val: number | string) => {
    const num = typeof val === 'number' ? val : parseAmount(val);
    return '₹ ' + num.toLocaleString('en-IN') + '/-';
  };

  const b = data.breakdown;

  const handleDownload = async () => {
    if (!quotationId) {
      showSuccessToast('Quotation Ready', 'Save this quotation to generate official server PDF.');
      return;
    }
    try {
      const path = await quotationService.downloadPdf(quotationId, quotationNo);
      showSuccessToast('PDF Downloaded', `Saved to ${path}`);
    } catch (err: any) {
      showErrorToast('Download Failed', err?.message || 'Could not download PDF');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? '#0B0F19' : '#F1F5F9',
            paddingTop: insets.top,
          },
        ]}
      >
        {/* Top App Bar with Close */}
        <View style={[styles.topBar, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
          <View style={styles.topBarLeft}>
            <Text style={[styles.topBarTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
              Official Vehicle Quotation
            </Text>
            <Text style={styles.topBarSub}>
              {quotationNo ? quotationNo : 'Print / Preview Sheet'}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <X size={22} color={isDark ? '#CBD5E1' : '#475569'} />
          </TouchableOpacity>
        </View>

        {/* Scrollable Official Paper Sheet (Screenshot 3 Design) */}
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 90 },
          ]}
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.sheetPaper}>
            {/* Header: Logo and Company Info */}
            <View style={styles.sheetHeader}>
              <View style={styles.logoBox}>
                <View style={styles.daBadge}>
                  <Text style={styles.daBadgeText}>DA</Text>
                </View>
                <View>
                  <Text style={styles.daLogoTitle}>DEFENCE</Text>
                  <Text style={styles.daLogoTitle}>AUTOLINK</Text>
                </View>
              </View>

              <View style={styles.companyInfo}>
                <Text style={styles.companyName}>DEFENCE AUTOLINK</Text>
                <Text style={styles.companyAddress}>
                  D-601, S G BUSINESS HUB, S G HIGHWAY,
                </Text>
                <Text style={styles.companyAddress}>
                  Ahmedabad, Gujarat - 382470
                </Text>
              </View>
            </View>

            {/* Date & Quotation Badge Row */}
            <View style={styles.metaRow}>
              <Text style={styles.dateText}>
                DATE : {data.quotationDate || new Date().toLocaleDateString('en-GB')}
              </Text>
              <View style={styles.quotationBadge}>
                <Text style={styles.quotationBadgeText}>QUOTATION</Text>
              </View>
            </View>

            {/* Main Itemized Breakdown Table */}
            <View style={styles.table}>
              {/* Row 1: Car & Model */}
              <View style={styles.tableRow}>
                <View style={[styles.cell, styles.colLeft, styles.headerCell]}>
                  <Text style={styles.cellLabel}>CAR: {data.sheetCarTitle || data.brandName || '-'}</Text>
                </View>
                <View style={[styles.cell, styles.colRight, styles.headerCell]}>
                  <Text style={styles.cellLabel}>MODEL: {data.sheetModelTitle || data.variantName || '-'}</Text>
                </View>
              </View>

              {/* Row 2: CSD Price */}
              <View style={styles.tableRow}>
                <View style={[styles.cell, styles.colLeft]}>
                  <Text style={styles.rowLabel}>CSD PRICE</Text>
                </View>
                <View style={[styles.cell, styles.colRight]}>
                  <Text style={styles.rowValue}>{formatInr(b.csdPrice)}</Text>
                </View>
              </View>

              {/* Row 3: GJ RTO */}
              <View style={styles.tableRow}>
                <View style={[styles.cell, styles.colLeft]}>
                  <Text style={styles.rowLabel}>GJ RTO</Text>
                </View>
                <View style={[styles.cell, styles.colRight]}>
                  <Text style={styles.rowValue}>{formatInr(b.gjRto)}</Text>
                </View>
              </View>

              {/* Row 4: BH RTO */}
              <View style={styles.tableRow}>
                <View style={[styles.cell, styles.colLeft]}>
                  <Text style={styles.rowLabel}>BH RTO * APPOROX</Text>
                </View>
                <View style={[styles.cell, styles.colRight]}>
                  <Text style={styles.rowValue}>{b.bhRto ? formatInr(b.bhRto) : '-'}</Text>
                </View>
              </View>

              {/* Row 5: CRTM */}
              <View style={styles.tableRow}>
                <View style={[styles.cell, styles.colLeft]}>
                  <Text style={styles.rowLabel}>CRTM</Text>
                </View>
                <View style={[styles.cell, styles.colRight]}>
                  <Text style={styles.rowValue}>{formatInr(b.crtm)}</Text>
                </View>
              </View>

              {/* Row 6: Insurance */}
              <View style={styles.tableRow}>
                <View style={[styles.cell, styles.colLeft]}>
                  <Text style={styles.rowLabel}>INSURANCE</Text>
                </View>
                <View style={[styles.cell, styles.colRight]}>
                  <Text style={styles.rowValue}>{formatInr(b.insurance)}</Text>
                </View>
              </View>

              {/* Row 7: Accessories */}
              <View style={styles.tableRow}>
                <View style={[styles.cell, styles.colLeft]}>
                  <Text style={styles.rowLabel}>ACCESSORIES</Text>
                </View>
                <View style={[styles.cell, styles.colRight]}>
                  <Text style={styles.rowValue}>
                    {b.accessories
                      ? isNaN(Number(b.accessories))
                        ? b.accessories
                        : formatInr(b.accessories)
                      : '-'}
                  </Text>
                </View>
              </View>

              {/* Row 8: Warranty */}
              <View style={styles.tableRow}>
                <View style={[styles.cell, styles.colLeft]}>
                  <Text style={styles.rowLabel}>WARRANTY</Text>
                </View>
                <View style={[styles.cell, styles.colRight]}>
                  <Text style={styles.rowValue}>{b.warranty ? formatInr(b.warranty) : '-'}</Text>
                </View>
              </View>

              {/* Row 9: M.S Reward / Discount */}
              <View style={styles.tableRow}>
                <View style={[styles.cell, styles.colLeft]}>
                  <Text style={styles.rowLabel}>M.S REWORD</Text>
                </View>
                <View style={[styles.cell, styles.colRight]}>
                  <Text
                    style={[
                      styles.rowValue,
                      parseAmount(b.msReward) > 0 && { color: '#059669', fontWeight: '800' },
                    ]}
                  >
                    {parseAmount(b.msReward) > 0 ? `-${formatInr(b.msReward)}` : '-'}
                  </Text>
                </View>
              </View>

              {/* Row 10: Difference Amt Cash */}
              <View style={styles.tableRow}>
                <View style={[styles.cell, styles.colLeft]}>
                  <Text style={styles.rowLabel}>DIFFERENCE AMT CASH</Text>
                </View>
                <View style={[styles.cell, styles.colRight]}>
                  <Text style={styles.rowValue}>{formatInr(b.diffAmtCash)}</Text>
                </View>
              </View>

              {/* Row 11: Estimated On-Road Price */}
              <View style={[styles.tableRow, styles.grandTotalRow]}>
                <View style={[styles.cell, styles.colLeft, styles.grandTotalCell]}>
                  <Text style={styles.grandTotalLabel}>ESTIMATED ON-ROAD PRICE</Text>
                </View>
                <View style={[styles.cell, styles.colRight, styles.grandTotalCell]}>
                  <Text style={styles.grandTotalValue}>{formatInr(data.grandTotal)}</Text>
                </View>
              </View>
            </View>

            {/* Footer: Executive & Authorized Signatory */}
            <View style={styles.sheetFooter}>
              <View style={styles.execSection}>
                <Text style={styles.execLine}>
                  Executive: <Text style={styles.execName}>{data.executiveName || 'ADMIN USER'}</Text>
                </Text>
                <Text style={styles.execContact}>
                  Contact: {data.executivePhone || '+91 98000 11112'}
                </Text>
                <Text style={styles.disclaimerText}>
                  * Prices prevailing at the time of delivery will be applicable. Road tax as per RTO norms.
                </Text>
              </View>

              <View style={styles.signatorySection}>
                <Text style={styles.signatoryCompany}>For DEFENCE AUTOLINK</Text>
                <Text style={styles.signatorySub}>
                  (Authorized Multi-Brand Dealership Signatory)
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Task 4: ONLY 2 Buttons at Bottom: Download PDF & Send Email */}
        <View
          style={[
            styles.bottomActions,
            {
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.actionBtn, styles.downloadBtn]}
            onPress={handleDownload}
            activeOpacity={0.8}
          >
            <Download size={18} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>Download PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.emailBtn]}
            onPress={() => {
              if (onOpenEmail) {
                onOpenEmail();
              } else {
                showSuccessToast('Email', 'Save quotation first to send email to client.');
              }
            }}
            activeOpacity={0.8}
          >
            <Mail size={18} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>Send Email</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#CBD5E1',
    elevation: 2,
  },
  topBarLeft: {
    flex: 1,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  topBarSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  scrollContent: {
    padding: 12,
  },
  sheetPaper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  logoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  daBadge: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
  },
  daBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  daLogoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E3A8A',
    lineHeight: 16,
  },
  companyInfo: {
    alignItems: 'flex-end',
    maxWidth: '55%',
  },
  companyName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#B91C1C',
    marginBottom: 2,
  },
  companyAddress: {
    fontSize: 10,
    color: '#475569',
    textAlign: 'right',
    lineHeight: 13,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  quotationBadge: {
    borderWidth: 1.5,
    borderColor: '#B91C1C',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 3,
  },
  quotationBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B91C1C',
    letterSpacing: 0.5,
  },
  table: {
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#64748B',
  },
  cell: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  colLeft: {
    flex: 1.2,
    borderRightWidth: 1,
    borderRightColor: '#64748B',
  },
  colRight: {
    flex: 1.4,
  },
  headerCell: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 9,
  },
  cellLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  rowLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
  },
  rowValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
  grandTotalRow: {
    backgroundColor: '#FEF2F2',
    borderBottomWidth: 0,
  },
  grandTotalCell: {
    paddingVertical: 10,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#B91C1C',
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#B91C1C',
  },
  sheetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  execSection: {
    maxWidth: '58%',
  },
  execLine: {
    fontSize: 11,
    color: '#334155',
  },
  execName: {
    fontWeight: '700',
    color: '#0284C7',
  },
  execContact: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  disclaimerText: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 6,
    fontStyle: 'italic',
    lineHeight: 12,
  },
  signatorySection: {
    alignItems: 'flex-end',
    maxWidth: '40%',
  },
  signatoryCompany: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'right',
  },
  signatorySub: {
    fontSize: 9,
    color: '#64748B',
    textAlign: 'right',
    marginTop: 2,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 12,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#CBD5E1',
    elevation: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  downloadBtn: {
    backgroundColor: '#1E3A8A',
  },
  emailBtn: {
    backgroundColor: '#059669',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
