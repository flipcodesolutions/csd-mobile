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
  Users,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { DatePickerModal } from '../../leads/components/DatePickerModal';
import { getTodayDate, getYesterdayDate } from '../callRecordingService';
import { StaffOption } from '../types';

const ROLE_OPTIONS = [
  { value: '', label: 'Select Role (All)' },
  { value: 'sales_executive', label: 'Sales Executive' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'all', label: 'All Staff' },
];

const REVIEW_STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'verified', label: 'Verified' },
  { value: 'flagged', label: 'Flagged' },
];

export interface CallRecordingsFilterModalProps {
  visible: boolean;
  onClose: () => void;
  activeTab: 'summary' | 'recordings';
  fromDate: string;
  setFromDate: (val: string) => void;
  toDate: string;
  setToDate: (val: string) => void;
  roleFilter: string;
  setRoleFilter: (val: string) => void;
  staffFilter: string;
  setStaffFilter: (val: string) => void;
  staffOptions: StaffOption[];
  reviewStatusFilter: string;
  setReviewStatusFilter: (val: string) => void;
  activeFiltersCount: number;
  onReset: () => void;
  onApply: () => void;
}

export const CallRecordingsFilterModal: React.FC<CallRecordingsFilterModalProps> = ({
  visible,
  onClose,
  activeTab,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  roleFilter,
  setRoleFilter,
  staffFilter,
  setStaffFilter,
  staffOptions,
  reviewStatusFilter,
  setReviewStatusFilter,
  activeFiltersCount,
  onReset,
  onApply,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [datePickerTarget, setDatePickerTarget] = useState<'from' | 'to' | null>(
    null
  );

  const todayStr = getTodayDate();
  const yesterdayStr = getYesterdayDate();
  const isAllDates = !fromDate && !toDate;
  const isTodaySelected = fromDate === todayStr && toDate === todayStr;
  const isYesterdaySelected =
    fromDate === yesterdayStr && toDate === yesterdayStr;

  if (!visible) return null;

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
          />
          <View
            style={[
              styles.sheetContainer,
              {
                backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                borderColor: isDark ? '#1E293B' : '#E2E8F0',
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            {/* Grab Handle */}
            <View style={styles.grabHandleRow}>
              <View
                style={[
                  styles.grabHandle,
                  { backgroundColor: isDark ? '#334155' : '#CBD5E1' },
                ]}
              />
            </View>

            {/* Header */}
            <View
              style={[
                styles.headerRow,
                { borderBottomColor: isDark ? '#1E293B' : '#F1F5F9' },
              ]}
            >
              <View style={styles.headerLeft}>
                <SlidersHorizontal
                  size={18}
                  color={colors.primary}
                  strokeWidth={2.4}
                />
                <Text
                  style={[styles.headerTitle, { color: colors.textPrimary }]}
                >
                  Filter Call Recordings
                </Text>
                {activeFiltersCount > 0 && (
                  <View
                    style={[
                      styles.activeBadge,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.activeBadgeText,
                        { color: isDark ? '#0B111A' : '#FFFFFF' },
                      ]}
                    >
                      {activeFiltersCount} active
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.headerRight}>
                {activeFiltersCount > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic('impactLight');
                      onReset();
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.resetBtn}
                  >
                    <RotateCcw
                      size={13}
                      color={colors.textSecondary}
                      strokeWidth={2}
                    />
                    <Text
                      style={[
                        styles.resetText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Reset
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic('impactLight');
                    onClose();
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={[
                    styles.closeBtn,
                    { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                  ]}
                >
                  <X size={18} color={colors.textSecondary} strokeWidth={2.2} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Body */}
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* 1. Date Range */}
              <View style={styles.sectionBlock}>
                <Text
                  style={[styles.sectionLabel, { color: colors.textSecondary }]}
                >
                  DATE RANGE
                </Text>

                <View style={styles.dateInputsRow}>
                  <View style={styles.dateCol}>
                    <Text
                      style={[
                        styles.inputSublabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      FROM DATE
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.datePickerBtn,
                        {
                          backgroundColor: isDark ? '#101726' : '#F8FAFC',
                          borderColor: fromDate
                            ? colors.primary
                            : isDark
                            ? '#1E293B'
                            : '#E2E8F0',
                        },
                      ]}
                      onPress={() => {
                        triggerHaptic('selection');
                        setDatePickerTarget('from');
                      }}
                      activeOpacity={0.7}
                    >
                      <Calendar
                        size={14}
                        color={fromDate ? colors.primary : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.datePickerText,
                          {
                            color: fromDate
                              ? colors.textPrimary
                              : colors.textSecondary,
                            fontWeight: fromDate ? '700' : '500',
                          },
                        ]}
                      >
                        {fromDate || 'Select Date'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.dateCol}>
                    <Text
                      style={[
                        styles.inputSublabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      TO DATE
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.datePickerBtn,
                        {
                          backgroundColor: isDark ? '#101726' : '#F8FAFC',
                          borderColor: toDate
                            ? colors.primary
                            : isDark
                            ? '#1E293B'
                            : '#E2E8F0',
                        },
                      ]}
                      onPress={() => {
                        triggerHaptic('selection');
                        setDatePickerTarget('to');
                      }}
                      activeOpacity={0.7}
                    >
                      <Calendar
                        size={14}
                        color={toDate ? colors.primary : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.datePickerText,
                          {
                            color: toDate
                              ? colors.textPrimary
                              : colors.textSecondary,
                            fontWeight: toDate ? '700' : '500',
                          },
                        ]}
                      >
                        {toDate || 'Select Date'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Quick Date Pills */}
                <Text
                  style={[
                    styles.inputSublabel,
                    { color: colors.textSecondary, marginTop: 10 },
                  ]}
                >
                  QUICK DATE
                </Text>
                <View style={styles.chipsWrap}>
                  {[
                    {
                      label: 'All (Clear)',
                      active: isAllDates,
                      onPress: () => {
                        setFromDate('');
                        setToDate('');
                      },
                    },
                    {
                      label: 'Today',
                      active: isTodaySelected,
                      onPress: () => {
                        const t = getTodayDate();
                        setFromDate(t);
                        setToDate(t);
                      },
                    },
                    {
                      label: 'Yesterday',
                      active: isYesterdaySelected,
                      onPress: () => {
                        const y = getYesterdayDate();
                        setFromDate(y);
                        setToDate(y);
                      },
                    },
                  ].map((pill) => (
                    <TouchableOpacity
                      key={pill.label}
                      onPress={() => {
                        triggerHaptic('selection');
                        pill.onPress();
                      }}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: pill.active
                            ? colors.primary
                            : isDark
                            ? '#101726'
                            : '#F8FAFC',
                          borderColor: pill.active
                            ? colors.primary
                            : isDark
                            ? '#1E293B'
                            : '#E2E8F0',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: pill.active
                              ? isDark
                                ? '#0B111A'
                                : '#FFFFFF'
                              : colors.textPrimary,
                          },
                        ]}
                      >
                        {pill.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 2. Role Filter */}
              <View style={styles.sectionBlock}>
                <Text
                  style={[styles.sectionLabel, { color: colors.textSecondary }]}
                >
                  ROLE
                </Text>
                <View style={styles.chipsWrap}>
                  {ROLE_OPTIONS.map((opt) => {
                    const active = roleFilter === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value || 'default'}
                        onPress={() => {
                          triggerHaptic('selection');
                          setRoleFilter(opt.value);
                          setStaffFilter('all');
                        }}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: active
                              ? colors.primary
                              : isDark
                              ? '#101726'
                              : '#F8FAFC',
                            borderColor: active
                              ? colors.primary
                              : isDark
                              ? '#1E293B'
                              : '#E2E8F0',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            {
                              color: active
                                ? isDark
                                  ? '#0B111A'
                                  : '#FFFFFF'
                                : colors.textPrimary,
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

              {/* 3. Staff Member Filter */}
              <View style={styles.sectionBlock}>
                <Text
                  style={[styles.sectionLabel, { color: colors.textSecondary }]}
                >
                  STAFF MEMBER
                </Text>
                {!roleFilter ? (
                  <View
                    style={[
                      styles.hintBox,
                      {
                        backgroundColor: isDark ? '#101726' : '#F8FAFC',
                        borderColor: isDark ? '#1E293B' : '#E2E8F0',
                      },
                    ]}
                  >
                    <Users size={15} color={colors.textMuted} />
                    <Text
                      style={[styles.hintText, { color: colors.textSecondary }]}
                    >
                      Select a Role above to filter by specific Staff Member.
                    </Text>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.staffListBox,
                      {
                        backgroundColor: isDark ? '#101726' : '#F8FAFC',
                        borderColor: isDark ? '#1E293B' : '#E2E8F0',
                      },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        triggerHaptic('selection');
                        setStaffFilter('all');
                      }}
                      style={[
                        styles.staffRow,
                        {
                          borderBottomColor: isDark ? '#1E293B' : '#E2E8F0',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.staffRowText,
                          {
                            color: colors.textPrimary,
                            fontWeight: staffFilter === 'all' ? '800' : '600',
                          },
                        ]}
                      >
                        {roleFilter === 'sales_executive'
                          ? 'All Sales Executives'
                          : roleFilter === 'receptionist'
                          ? 'All Receptionists'
                          : 'All Staff Members'}
                      </Text>
                      {staffFilter === 'all' ? (
                        <Check size={16} color={colors.primary} />
                      ) : null}
                    </TouchableOpacity>

                    {staffOptions.map((u, idx) => {
                      const selected = staffFilter === String(u.id);
                      const isLast = idx === staffOptions.length - 1;
                      return (
                        <TouchableOpacity
                          key={u.id}
                          onPress={() => {
                            triggerHaptic('selection');
                            setStaffFilter(String(u.id));
                          }}
                          style={[
                            styles.staffRow,
                            !isLast && {
                              borderBottomWidth: 1,
                              borderBottomColor: isDark ? '#1E293B' : '#E2E8F0',
                            },
                            isLast && { borderBottomWidth: 0 },
                          ]}
                        >
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.staffRowText,
                                {
                                  color: colors.textPrimary,
                                  fontWeight: selected ? '800' : '600',
                                },
                              ]}
                            >
                              {u.name}
                            </Text>
                            {roleFilter === 'all' && u.role ? (
                              <Text
                                style={[
                                  styles.staffRowRole,
                                  { color: colors.textSecondary },
                                ]}
                              >
                                {u.role}
                              </Text>
                            ) : null}
                          </View>
                          {selected ? (
                            <Check size={16} color={colors.primary} />
                          ) : null}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* 4. Review Status (All Recordings Tab) */}
              {activeTab === 'recordings' ? (
                <View style={styles.sectionBlock}>
                  <Text
                    style={[
                      styles.sectionLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    REVIEW STATUS
                  </Text>
                  <View style={styles.chipsWrap}>
                    {REVIEW_STATUS_OPTIONS.map((opt) => {
                      const active = reviewStatusFilter === opt.value;
                      return (
                        <TouchableOpacity
                          key={opt.value}
                          onPress={() => {
                            triggerHaptic('selection');
                            setReviewStatusFilter(opt.value);
                          }}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: active
                                ? colors.primary
                                : isDark
                                ? '#101726'
                                : '#F8FAFC',
                              borderColor: active
                                ? colors.primary
                                : isDark
                                ? '#1E293B'
                                : '#E2E8F0',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              {
                                color: active
                                  ? isDark
                                    ? '#0B111A'
                                    : '#FFFFFF'
                                  : colors.textPrimary,
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
              ) : null}
            </ScrollView>

            {/* Footer */}
            <View
              style={[
                styles.footerRow,
                { borderTopColor: isDark ? '#1E293B' : '#F1F5F9' },
              ]}
            >
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('impactLight');
                  onReset();
                }}
                style={[
                  styles.footerResetBtn,
                  {
                    backgroundColor: isDark ? '#101726' : '#F8FAFC',
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                  },
                ]}
              >
                <Text
                  style={[styles.footerResetText, { color: colors.textPrimary }]}
                >
                  Reset All
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('impactMedium');
                  onApply();
                }}
                style={[
                  styles.footerApplyBtn,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.footerApplyText,
                    { color: isDark ? '#0B111A' : '#FFFFFF' },
                  ]}
                >
                  Apply Filters
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <DatePickerModal
        visible={datePickerTarget !== null}
        title={
          datePickerTarget === 'from' ? 'Select From Date' : 'Select To Date'
        }
        initialDate={datePickerTarget === 'from' ? fromDate : toDate}
        allowFuture={false}
        allowPast={true}
        onClose={() => setDatePickerTarget(null)}
        onSelectDate={(dateStr) => {
          if (datePickerTarget === 'from') {
            setFromDate(dateStr);
          } else if (datePickerTarget === 'to') {
            setToDate(dateStr);
          }
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    maxHeight: '85%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  grabHandleRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  grabHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resetText: {
    fontSize: 12,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flexGrow: 0,
  },
  scrollContent: {
    padding: 18,
    gap: 18,
  },
  sectionBlock: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  dateInputsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateCol: {
    flex: 1,
    gap: 5,
  },
  inputSublabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  datePickerText: {
    fontSize: 13,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  hintText: {
    fontSize: 12,
    flex: 1,
  },
  staffListBox: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  staffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
  },
  staffRowText: {
    fontSize: 13,
  },
  staffRowRole: {
    fontSize: 11,
    marginTop: 1,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  footerResetBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 11,
    borderWidth: 1,
  },
  footerResetText: {
    fontSize: 13,
    fontWeight: '700',
  },
  footerApplyBtn: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 11,
  },
  footerApplyText: {
    fontSize: 13,
    fontWeight: '800',
  },
});

