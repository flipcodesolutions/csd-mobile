import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, Check, Filter, RotateCcw, X } from 'lucide-react-native';
import { colors } from '../../../core/theme/colors';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { DatePickerModal } from '../../leads/components/DatePickerModal';

interface InsuranceFilterModalProps {
  visible: boolean;
  status: string;
  fromDate: string;
  toDate: string;
  onClose: () => void;
  onApply: (filters: { status: string; fromDate: string; toDate: string }) => void;
  onReset: () => void;
}

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Active Policies', value: 'active' },
  { label: 'Expiring Soon (Due)', value: 'expiring_soon' },
  { label: 'Expired Policies', value: 'expired' },
  { label: 'Renewed', value: 'renewed' },
];

export const InsuranceFilterModal: React.FC<InsuranceFilterModalProps> = ({
  visible,
  status: initialStatus,
  fromDate: initialFromDate,
  toDate: initialToDate,
  onClose,
  onApply,
  onReset,
}) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [selectedStatus, setSelectedStatus] = useState(initialStatus || 'all');
  const [fromDate, setFromDate] = useState(initialFromDate || '');
  const [toDate, setToDate] = useState(initialToDate || '');

  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const handleApply = () => {
    triggerHaptic('notificationSuccess');
    onApply({
      status: selectedStatus,
      fromDate,
      toDate,
    });
    onClose();
  };

  const handleReset = () => {
    triggerHaptic('impactLight');
    setSelectedStatus('all');
    setFromDate('');
    setToDate('');
    onReset();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: isDark ? '#131C27' : '#FFFFFF',
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.header,
              { borderBottomColor: isDark ? '#1E293B' : '#E2E8F0' },
            ]}
          >
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Filter size={18} color={colors.primary} />
              </View>
              <Text
                style={[
                  styles.title,
                  { color: isDark ? '#F1F5F9' : '#0F172A' },
                ]}
              >
                Filter Insurance Records
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={isDark ? '#94A3B8' : '#64748B'} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* Status Filter */}
            <Text
              style={[
                styles.sectionLabel,
                { color: isDark ? '#E2E8F0' : '#1E293B' },
              ]}
            >
              Policy Status
            </Text>
            <View style={styles.statusChipsGrid}>
              {STATUS_OPTIONS.map((opt) => {
                const isSelected = selectedStatus === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : isDark
                          ? '#1E293B'
                          : '#F1F5F9',
                        borderColor: isSelected
                          ? colors.primary
                          : isDark
                          ? '#334155'
                          : '#E2E8F0',
                      },
                    ]}
                    onPress={() => setSelectedStatus(opt.value)}
                  >
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

            {/* Date Range Section */}
            <Text
              style={[
                styles.sectionLabel,
                { color: isDark ? '#E2E8F0' : '#1E293B', marginTop: 16 },
              ]}
            >
              Policy Expiry Date Range
            </Text>
            <View style={styles.dateRow}>
              <View style={styles.dateCol}>
                <Text
                  style={[
                    styles.dateLabel,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                >
                  From
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dateInput,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      borderColor: isDark ? '#334155' : '#CBD5E1',
                    },
                  ]}
                  onPress={() => setShowFromPicker(true)}
                >
                  <Text
                    style={[
                      styles.dateInputText,
                      {
                        color: fromDate
                          ? isDark
                            ? '#F1F5F9'
                            : '#0F172A'
                          : isDark
                          ? '#64748B'
                          : '#94A3B8',
                      },
                    ]}
                  >
                    {fromDate || 'dd/mm/yyyy'}
                  </Text>
                  <Calendar size={15} color={isDark ? '#94A3B8' : '#64748B'} />
                </TouchableOpacity>
              </View>

              <View style={styles.dateCol}>
                <Text
                  style={[
                    styles.dateLabel,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                >
                  To
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dateInput,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      borderColor: isDark ? '#334155' : '#CBD5E1',
                    },
                  ]}
                  onPress={() => setShowToPicker(true)}
                >
                  <Text
                    style={[
                      styles.dateInputText,
                      {
                        color: toDate
                          ? isDark
                            ? '#F1F5F9'
                            : '#0F172A'
                          : isDark
                          ? '#64748B'
                          : '#94A3B8',
                      },
                    ]}
                  >
                    {toDate || 'dd/mm/yyyy'}
                  </Text>
                  <Calendar size={15} color={isDark ? '#94A3B8' : '#64748B'} />
                </TouchableOpacity>
              </View>
            </View>

            {(fromDate || toDate) && (
              <TouchableOpacity
                onPress={() => {
                  setFromDate('');
                  setToDate('');
                }}
                style={styles.clearDatesBtn}
              >
                <Text style={styles.clearDatesText}>Clear Date Range</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Action Buttons */}
          <View
            style={[
              styles.footer,
              { borderTopColor: isDark ? '#1E293B' : '#E2E8F0' },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.resetBtn,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                },
              ]}
              onPress={handleReset}
            >
              <RotateCcw size={16} color={isDark ? '#CBD5E1' : '#475569'} />
              <Text
                style={[
                  styles.resetBtnText,
                  { color: isDark ? '#CBD5E1' : '#475569' },
                ]}
              >
                Reset All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.applyBtn, { backgroundColor: colors.primary }]}
              onPress={handleApply}
            >
              <Check size={18} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <DatePickerModal
        visible={showFromPicker}
        title="Select From Date"
        initialDate={fromDate}
        allowPast={true}
        allowFuture={true}
        onClose={() => setShowFromPicker(false)}
        onSelectDate={(d) => {
          setFromDate(d);
          setShowFromPicker(false);
        }}
      />

      <DatePickerModal
        visible={showToPicker}
        title="Select To Date"
        initialDate={toDate}
        allowPast={true}
        allowFuture={true}
        onClose={() => setShowToPicker(false)}
        onSelectDate={(d) => {
          setToDate(d);
          setShowToPicker(false);
        }}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
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
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(88, 99, 42, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  statusChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateCol: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 42,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  dateInputText: {
    fontSize: 13,
  },
  clearDatesBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
    paddingVertical: 4,
  },
  clearDatesText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    height: 42,
    borderRadius: 8,
    justifyContent: 'center',
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

