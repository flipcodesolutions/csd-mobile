import React, { useState } from 'react';
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
  Calendar,
  Check,
  CreditCard,
  Filter,
  Globe,
  RotateCcw,
  Tag,
  Wallet,
  X,
} from 'lucide-react-native';
import { colors } from '../../../core/theme/colors';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { DatePickerModal } from '../../leads/components/DatePickerModal';
import { ExpenseCategory } from '../types';

export interface ExpenseFilters {
  paymentType: 'All' | 'Online' | 'Offline';
  categoryId: number | 'All';
  fromDate: string;
  toDate: string;
}

interface ExpenseFilterModalProps {
  visible: boolean;
  filters: ExpenseFilters;
  categories: ExpenseCategory[];
  onClose: () => void;
  onApply: (filters: ExpenseFilters) => void;
  onReset: () => void;
}

export const ExpenseFilterModal: React.FC<ExpenseFilterModalProps> = ({
  visible,
  filters,
  categories,
  onClose,
  onApply,
  onReset,
}) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [paymentType, setPaymentType] = useState<'All' | 'Online' | 'Offline'>(filters.paymentType);
  const [categoryId, setCategoryId] = useState<number | 'All'>(filters.categoryId);
  const [fromDate, setFromDate] = useState(filters.fromDate);
  const [toDate, setToDate] = useState(filters.toDate);

  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const handleApply = () => {
    triggerHaptic('notificationSuccess');
    onApply({
      paymentType,
      categoryId,
      fromDate,
      toDate,
    });
    onClose();
  };

  const handleReset = () => {
    triggerHaptic('impactLight');
    setPaymentType('All');
    setCategoryId('All');
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
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
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
              <Filter size={18} color={colors.primary} />
              <Text
                style={[
                  styles.title,
                  { color: isDark ? '#F1F5F9' : '#0F172A' },
                ]}
              >
                Filter Expense Records
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={isDark ? '#94A3B8' : '#64748B'} />
            </TouchableOpacity>
          </View>

          {/* Filter Body */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Payment Type Filter */}
            <View style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: isDark ? '#CBD5E1' : '#334155' },
                ]}
              >
                PAYMENT METHOD
              </Text>
              <View style={styles.pillsRow}>
                {(['All', 'Online', 'Offline'] as const).map((type) => {
                  const isSelected = paymentType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.filterPill,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : isDark
                              ? '#1E293B'
                              : '#F1F5F9',
                          borderColor: isSelected
                            ? colors.primaryHover
                            : isDark
                              ? '#334155'
                              : '#CBD5E1',
                        },
                      ]}
                      onPress={() => {
                        triggerHaptic('selection');
                        setPaymentType(type);
                      }}
                      activeOpacity={0.8}
                    >
                      {type === 'Online' && (
                        <Globe size={13} color={isSelected ? '#FFFFFF' : '#16A34A'} />
                      )}
                      {type === 'Offline' && (
                        <Wallet size={13} color={isSelected ? '#FFFFFF' : '#D97706'} />
                      )}
                      <Text
                        style={[
                          styles.filterPillText,
                          {
                            color: isSelected
                              ? '#FFFFFF'
                              : isDark
                                ? '#E2E8F0'
                                : '#1E293B',
                          },
                        ]}
                      >
                        {type === 'All' ? 'All Methods' : type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 2. Expense Category Filter */}
            <View style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: isDark ? '#CBD5E1' : '#334155' },
                ]}
              >
                EXPENSE CATEGORY
              </Text>
              <View style={styles.categoryPillsWrap}>
                <TouchableOpacity
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: categoryId === 'All'
                        ? colors.primary
                        : isDark
                          ? '#1E293B'
                          : '#F1F5F9',
                      borderColor: categoryId === 'All'
                        ? colors.primaryHover
                        : isDark
                          ? '#334155'
                          : '#CBD5E1',
                    },
                  ]}
                  onPress={() => {
                    triggerHaptic('selection');
                    setCategoryId('All');
                  }}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      { color: categoryId === 'All' ? '#FFFFFF' : isDark ? '#E2E8F0' : '#1E293B' },
                    ]}
                  >
                    All Categories
                  </Text>
                </TouchableOpacity>

                {categories.map((cat) => {
                  const isSelected = categoryId === cat.id;
                  return (
                    <TouchableOpacity
                      key={`cat-filter-${cat.id}`}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : isDark
                              ? '#1E293B'
                              : '#F1F5F9',
                          borderColor: isSelected
                            ? colors.primaryHover
                            : isDark
                              ? '#334155'
                              : '#CBD5E1',
                        },
                      ]}
                      onPress={() => {
                        triggerHaptic('selection');
                        setCategoryId(cat.id);
                      }}
                    >
                      <Tag size={12} color={isSelected ? '#FFFFFF' : colors.primary} />
                      <Text
                        style={[
                          styles.categoryChipText,
                          { color: isSelected ? '#FFFFFF' : isDark ? '#E2E8F0' : '#1E293B' },
                        ]}
                      >
                        {cat.name || cat.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 3. Date Range Filter */}
            <View style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: isDark ? '#CBD5E1' : '#334155' },
                ]}
              >
                EXPENSE DATE RANGE
              </Text>
              <View style={styles.dateRow}>
                {/* From Date */}
                <View style={styles.dateCol}>
                  <Text style={styles.dateLabel}>From Date</Text>
                  <TouchableOpacity
                    style={[
                      styles.dateInputBox,
                      {
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                        borderColor: isDark ? '#334155' : '#CBD5E1',
                      },
                    ]}
                    onPress={() => setShowFromPicker(true)}
                  >
                    <Text
                      style={[
                        styles.dateValueText,
                        { color: fromDate ? (isDark ? '#F1F5F9' : '#0F172A') : '#94A3B8' },
                      ]}
                    >
                      {fromDate || 'DD/MM/YYYY'}
                    </Text>
                    <Calendar size={15} color={colors.primary} />
                  </TouchableOpacity>
                </View>

                {/* To Date */}
                <View style={styles.dateCol}>
                  <Text style={styles.dateLabel}>To Date</Text>
                  <TouchableOpacity
                    style={[
                      styles.dateInputBox,
                      {
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                        borderColor: isDark ? '#334155' : '#CBD5E1',
                      },
                    ]}
                    onPress={() => setShowToPicker(true)}
                  >
                    <Text
                      style={[
                        styles.dateValueText,
                        { color: toDate ? (isDark ? '#F1F5F9' : '#0F172A') : '#94A3B8' },
                      ]}
                    >
                      {toDate || 'DD/MM/YYYY'}
                    </Text>
                    <Calendar size={15} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
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
              <RotateCcw size={15} color={isDark ? '#CBD5E1' : '#475569'} />
              <Text
                style={[
                  styles.resetBtnText,
                  { color: isDark ? '#CBD5E1' : '#475569' },
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
              onPress={handleApply}
            >
              <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Date Pickers */}
      <DatePickerModal
        visible={showFromPicker}
        title="From Expense Date"
        initialDate={fromDate}
        allowFuture={true}
        allowPast={true}
        onClose={() => setShowFromPicker(false)}
        onSelectDate={(d) => {
          setFromDate(d);
          setShowFromPicker(false);
        }}
      />

      <DatePickerModal
        visible={showToPicker}
        title="To Expense Date"
        initialDate={toDate}
        allowFuture={true}
        allowPast={true}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16.5,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  scroll: {
    maxHeight: 480,
  },
  scrollContent: {
    padding: 20,
    gap: 18,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  categoryPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 12.5,
    fontWeight: '600',
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
    color: '#64748B',
    marginBottom: 4,
  },
  dateInputBox: {
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateValueText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    gap: 10,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 22,
    height: 42,
    borderRadius: 8,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
});
