import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Calendar,
  Check,
  RotateCcw,
  SlidersHorizontal,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { DatePickerModal } from '../../leads/components/DatePickerModal';

export const DEAL_STAGE_OPTIONS = [
  { key: 'all', label: 'All Stages' },
  { key: 'booking_confirmed', label: 'Booking Confirmed' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'ready_for_delivery', label: 'Ready for Delivery' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

export const DEAL_PAYMENT_OPTIONS = [
  { key: 'all', label: 'All Payments' },
  { key: 'fully_paid', label: 'Fully Paid' },
  { key: 'partial', label: 'Partially Paid' },
  { key: 'pending', label: 'Pending' },
];

export interface DealsFilterModalProps {
  visible: boolean;
  onClose: () => void;
  selectedStage: string;
  setSelectedStage: (stage: string) => void;
  selectedPayment: string;
  setSelectedPayment: (payment: string) => void;
  fromDate: string;
  setFromDate: (date: string) => void;
  toDate: string;
  setToDate: (date: string) => void;
  activeFiltersCount: number;
  onReset: () => void;
  onApply: () => void;
}

export const DealsFilterModal: React.FC<DealsFilterModalProps> = ({
  visible,
  onClose,
  selectedStage,
  setSelectedStage,
  selectedPayment,
  setSelectedPayment,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  activeFiltersCount,
  onReset,
  onApply,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [datePickerTarget, setDatePickerTarget] = useState<'from' | 'to' | null>(null);

  // Quick Date Helpers
  const handleSetToday = () => {
    triggerHaptic('selection');
    const today = new Date().toISOString().split('T')[0];
    setFromDate(today);
    setToDate(today);
  };

  const handleSetThisWeek = () => {
    triggerHaptic('selection');
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(now.setDate(diff)).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    setFromDate(monday);
    setToDate(today);
  };

  const handleSetThisMonth = () => {
    triggerHaptic('selection');
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    setFromDate(firstDay);
    setToDate(today);
  };

  const handleClearDates = () => {
    triggerHaptic('selection');
    setFromDate('');
    setToDate('');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: isDark ? '#101726' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
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
            <View style={styles.modalHeaderLeft}>
              <View
                style={[
                  styles.filterIconCircle,
                  { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                ]}
              >
                <SlidersHorizontal
                  size={16}
                  color={colors.primary}
                  strokeWidth={2.4}
                />
              </View>
              <View>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: isDark ? '#F8FAFC' : '#0F172A' },
                  ]}
                >
                  Filter Deals
                </Text>
                <Text style={styles.modalSubtitle}>
                  Stage, Payment & Date Range
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeButton,
                { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color={colors.textSecondary} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Delivery Stage Filter */}
            <View style={styles.sectionContainer}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: isDark ? '#E2E8F0' : '#1E293B' },
                ]}
              >
                Delivery Stage
              </Text>
              <View style={styles.chipsRow}>
                {DEAL_STAGE_OPTIONS.map((opt) => {
                  const isSelected = selectedStage === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : isDark
                            ? '#1E293B'
                            : '#F8FAFC',
                          borderColor: isSelected
                            ? colors.primary
                            : isDark
                            ? '#334155'
                            : '#E2E8F0',
                        },
                      ]}
                      onPress={() => {
                        triggerHaptic('selection');
                        setSelectedStage(opt.key);
                      }}
                      activeOpacity={0.7}
                    >
                      {isSelected && (
                        <Check size={13} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 4 }} />
                      )}
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: isSelected
                              ? '#FFFFFF'
                              : isDark
                              ? '#CBD5E1'
                              : '#334155',
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 2. Payment Status Filter */}
            <View style={styles.sectionContainer}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: isDark ? '#E2E8F0' : '#1E293B' },
                ]}
              >
                Payment Status
              </Text>
              <View style={styles.chipsRow}>
                {DEAL_PAYMENT_OPTIONS.map((opt) => {
                  const isSelected = selectedPayment === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : isDark
                            ? '#1E293B'
                            : '#F8FAFC',
                          borderColor: isSelected
                            ? colors.primary
                            : isDark
                            ? '#334155'
                            : '#E2E8F0',
                        },
                      ]}
                      onPress={() => {
                        triggerHaptic('selection');
                        setSelectedPayment(opt.key);
                      }}
                      activeOpacity={0.7}
                    >
                      {isSelected && (
                        <Check size={13} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 4 }} />
                      )}
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: isSelected
                              ? '#FFFFFF'
                              : isDark
                              ? '#CBD5E1'
                              : '#334155',
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 3. Date Range Filter */}
            <View style={styles.sectionContainer}>
              <View style={styles.dateHeaderRow}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: isDark ? '#E2E8F0' : '#1E293B', marginBottom: 0 },
                  ]}
                >
                  Date Range
                </Text>
                {(fromDate || toDate) && (
                  <TouchableOpacity
                    onPress={handleClearDates}
                    style={styles.clearDateBtn}
                  >
                    <Text style={styles.clearDateText}>Clear Dates</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Quick Preset Buttons */}
              <View style={styles.quickDateRow}>
                <TouchableOpacity
                  style={[
                    styles.quickDateBtn,
                    { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                  ]}
                  onPress={handleSetToday}
                >
                  <Text style={styles.quickDateText}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.quickDateBtn,
                    { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                  ]}
                  onPress={handleSetThisWeek}
                >
                  <Text style={styles.quickDateText}>This Week</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.quickDateBtn,
                    { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                  ]}
                  onPress={handleSetThisMonth}
                >
                  <Text style={styles.quickDateText}>This Month</Text>
                </TouchableOpacity>
              </View>

              {/* Date Inputs */}
              <View style={styles.dateInputsRow}>
                <TouchableOpacity
                  style={[
                    styles.dateInputBox,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                      borderColor: fromDate
                        ? colors.primary
                        : isDark
                        ? '#334155'
                        : '#E2E8F0',
                    },
                  ]}
                  onPress={() => {
                    triggerHaptic('selection');
                    setDatePickerTarget('from');
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.dateInputHeader}>
                    <Text style={styles.dateInputLabel}>From</Text>
                    <Calendar size={13} color={colors.textSecondary} />
                  </View>
                  <Text
                    style={[
                      styles.dateInputValue,
                      {
                        color: fromDate
                          ? isDark
                            ? '#FFFFFF'
                            : '#0F172A'
                          : colors.textMuted,
                      },
                    ]}
                  >
                    {fromDate || 'dd/mm/yyyy'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.dateInputBox,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                      borderColor: toDate
                        ? colors.primary
                        : isDark
                        ? '#334155'
                        : '#E2E8F0',
                    },
                  ]}
                  onPress={() => {
                    triggerHaptic('selection');
                    setDatePickerTarget('to');
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.dateInputHeader}>
                    <Text style={styles.dateInputLabel}>To</Text>
                    <Calendar size={13} color={colors.textSecondary} />
                  </View>
                  <Text
                    style={[
                      styles.dateInputValue,
                      {
                        color: toDate
                          ? isDark
                            ? '#FFFFFF'
                            : '#0F172A'
                          : colors.textMuted,
                      },
                    ]}
                  >
                    {toDate || 'dd/mm/yyyy'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Footer Action Buttons */}
          <View
            style={[
              styles.modalFooter,
              { borderTopColor: isDark ? '#1E293B' : '#E2E8F0' },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.resetBtn,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                },
              ]}
              onPress={() => {
                triggerHaptic('impactLight');
                onReset();
              }}
              activeOpacity={0.7}
            >
              <RotateCcw size={14} color={colors.textSecondary} />
              <Text
                style={[
                  styles.resetBtnText,
                  { color: isDark ? '#E2E8F0' : '#475569' },
                ]}
              >
                Reset
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.applyBtn,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => {
                triggerHaptic('selection');
                onApply();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.applyBtnText}>
                Apply Filters
                {activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* DatePickerModal Integration */}
      <DatePickerModal
        visible={datePickerTarget !== null}
        initialDate={datePickerTarget === 'from' ? fromDate : toDate}
        title={datePickerTarget === 'from' ? 'Select From Date' : 'Select To Date'}
        allowFuture={true}
        allowPast={true}
        onClose={() => setDatePickerTarget(null)}
        onSelectDate={(selectedDate) => {
          if (datePickerTarget === 'from') {
            setFromDate(selectedDate);
          } else if (datePickerTarget === 'to') {
            setToDate(selectedDate);
          }
          setDatePickerTarget(null);
        }}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
  },
  dateHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clearDateBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  clearDateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
  },
  quickDateRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  quickDateBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  quickDateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  dateInputsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateInputBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  dateInputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateInputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  dateInputValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  applyBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

