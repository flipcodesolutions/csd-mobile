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
import {
  CANONICAL_CALL_OUTCOMES,
  FollowUpStats,
  FollowUpTab,
} from '../types';

export interface FollowUpsFilterModalProps {
  visible: boolean;
  onClose: () => void;
  activeTab: FollowUpTab;
  setActiveTab: (tab: FollowUpTab) => void;
  selectedOutcome: string;
  setSelectedOutcome: (outcome: string) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  timingStats: FollowUpStats;
  outcomeCounts: Record<string, number>;
  activeFiltersCount: number;
  onReset: () => void;
  onApply: () => void;
}

export const FollowUpsFilterModal: React.FC<FollowUpsFilterModalProps> = ({
  visible,
  onClose,
  activeTab,
  setActiveTab,
  selectedOutcome,
  setSelectedOutcome,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  timingStats,
  outcomeCounts,
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
    setStartDate(today);
    setEndDate(today);
  };

  const handleSetThisWeek = () => {
    triggerHaptic('selection');
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(now.setDate(diff)).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    setStartDate(monday);
    setEndDate(today);
  };

  const handleSetThisMonth = () => {
    triggerHaptic('selection');
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    setStartDate(firstDay);
    setEndDate(today);
  };

  const handleClearDates = () => {
    triggerHaptic('selection');
    setStartDate('');
    setEndDate('');
  };

  const timingTabs: { id: FollowUpTab; label: string; count: number }[] = [
    { id: 'all', label: 'All Follow-ups', count: timingStats.total || 0 },
    { id: 'overdue', label: 'Overdue', count: timingStats.overdue || 0 },
    { id: 'today', label: 'Due Today', count: timingStats.due_today || 0 },
    { id: 'upcoming', label: 'Upcoming', count: timingStats.upcoming || 0 },
  ];

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
                  style={[
                    styles.headerTitle,
                    { color: colors.textPrimary },
                  ]}
                >
                  Filter Follow-Ups
                </Text>
                {activeFiltersCount > 0 && (
                  <View
                    style={[
                      styles.activeBadge,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text style={styles.activeBadgeText}>
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
              {/* 1. Date Range Section */}
              <View style={styles.sectionBlock}>
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  INTERACTION DATE RANGE
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
                          borderColor: startDate
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
                        color={startDate ? colors.primary : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.datePickerText,
                          {
                            color: startDate
                              ? colors.textPrimary
                              : colors.textSecondary,
                            fontWeight: startDate ? '700' : '500',
                          },
                        ]}
                      >
                        {startDate || 'Select Date'}
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
                          borderColor: endDate
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
                        color={endDate ? colors.primary : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.datePickerText,
                          {
                            color: endDate
                              ? colors.textPrimary
                              : colors.textSecondary,
                            fontWeight: endDate ? '700' : '500',
                          },
                        ]}
                      >
                        {endDate || 'Select Date'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Quick Date Presets */}
                <View style={styles.presetsRow}>
                  <TouchableOpacity
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: isDark ? '#101726' : '#F1F5F9',
                        borderColor: isDark ? '#1E293B' : '#E2E8F0',
                      },
                    ]}
                    onPress={handleSetToday}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Today
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: isDark ? '#101726' : '#F1F5F9',
                        borderColor: isDark ? '#1E293B' : '#E2E8F0',
                      },
                    ]}
                    onPress={handleSetThisWeek}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      This Week
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: isDark ? '#101726' : '#F1F5F9',
                        borderColor: isDark ? '#1E293B' : '#E2E8F0',
                      },
                    ]}
                    onPress={handleSetThisMonth}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      This Month
                    </Text>
                  </TouchableOpacity>

                  {(startDate || endDate) && (
                    <TouchableOpacity
                      style={[
                        styles.presetChip,
                        {
                          backgroundColor: isDark
                            ? 'rgba(239, 68, 68, 0.15)'
                            : '#FEE2E2',
                          borderColor: '#DC2626',
                        },
                      ]}
                      onPress={handleClearDates}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.presetChipText, { color: '#DC2626' }]}>
                        Clear
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* 2. Timing / Due Filter Section */}
              <View style={styles.sectionBlock}>
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  FOLLOW-UP TIMELINE & SCHEDULE
                </Text>
                <View style={styles.chipsWrap}>
                  {timingTabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <TouchableOpacity
                        key={tab.id}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isActive
                              ? colors.primary
                              : isDark
                              ? '#101726'
                              : '#F8FAFC',
                            borderColor: isActive
                              ? colors.primaryDark
                              : isDark
                              ? '#1E293B'
                              : '#E2E8F0',
                          },
                        ]}
                        onPress={() => {
                          triggerHaptic('selection');
                          setActiveTab(tab.id);
                        }}
                        activeOpacity={0.7}
                      >
                        {isActive && (
                          <Check
                            size={12}
                            color="#FFFFFF"
                            strokeWidth={3}
                            style={{ marginRight: 4 }}
                          />
                        )}
                        <Text
                          style={[
                            styles.chipText,
                            {
                              color: isActive
                                ? '#FFFFFF'
                                : colors.textPrimary,
                              fontWeight: isActive ? '700' : '500',
                            },
                          ]}
                        >
                          {tab.label}
                        </Text>
                        <View
                          style={[
                            styles.chipCountBadge,
                            {
                              backgroundColor: isActive
                                ? 'rgba(255, 255, 255, 0.25)'
                                : isDark
                                ? '#1E293B'
                                : '#E2E8F0',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipCountText,
                              {
                                color: isActive
                                  ? '#FFFFFF'
                                  : colors.textSecondary,
                              },
                            ]}
                          >
                            {tab.count}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 3. Call Outcome Section */}
              <View style={styles.sectionBlock}>
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  CALL OUTCOME STATUS
                </Text>
                <View style={styles.chipsWrap}>
                  {/* Option: All Outcomes */}
                  <TouchableOpacity
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          selectedOutcome === 'all'
                            ? colors.primary
                            : isDark
                            ? '#101726'
                            : '#F8FAFC',
                        borderColor:
                          selectedOutcome === 'all'
                            ? colors.primaryDark
                            : isDark
                            ? '#1E293B'
                            : '#E2E8F0',
                      },
                    ]}
                    onPress={() => {
                      triggerHaptic('selection');
                      setSelectedOutcome('all');
                    }}
                    activeOpacity={0.7}
                  >
                    {selectedOutcome === 'all' && (
                      <Check
                        size={12}
                        color="#FFFFFF"
                        strokeWidth={3}
                        style={{ marginRight: 4 }}
                      />
                    )}
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color:
                            selectedOutcome === 'all'
                              ? '#FFFFFF'
                              : colors.textPrimary,
                          fontWeight: selectedOutcome === 'all' ? '700' : '500',
                        },
                      ]}
                    >
                      All Outcomes
                    </Text>
                    <View
                      style={[
                        styles.chipCountBadge,
                        {
                          backgroundColor:
                            selectedOutcome === 'all'
                              ? 'rgba(255, 255, 255, 0.25)'
                              : isDark
                              ? '#1E293B'
                              : '#E2E8F0',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipCountText,
                          {
                            color:
                              selectedOutcome === 'all'
                                ? '#FFFFFF'
                                : colors.textSecondary,
                          },
                        ]}
                      >
                        {outcomeCounts['all'] ?? 0}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* 7 Canonical Outcomes */}
                  {CANONICAL_CALL_OUTCOMES.map((oc) => {
                    const isActive = selectedOutcome === oc;
                    const cnt = outcomeCounts[oc] ?? 0;
                    return (
                      <TouchableOpacity
                        key={oc}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isActive
                              ? colors.primary
                              : isDark
                              ? '#101726'
                              : '#F8FAFC',
                            borderColor: isActive
                              ? colors.primaryDark
                              : isDark
                              ? '#1E293B'
                              : '#E2E8F0',
                          },
                        ]}
                        onPress={() => {
                          triggerHaptic('selection');
                          setSelectedOutcome(oc);
                        }}
                        activeOpacity={0.7}
                      >
                        {isActive && (
                          <Check
                            size={12}
                            color="#FFFFFF"
                            strokeWidth={3}
                            style={{ marginRight: 4 }}
                          />
                        )}
                        <Text
                          style={[
                            styles.chipText,
                            {
                              color: isActive
                                ? '#FFFFFF'
                                : colors.textPrimary,
                              fontWeight: isActive ? '700' : '500',
                            },
                          ]}
                        >
                          {oc}
                        </Text>
                        <View
                          style={[
                            styles.chipCountBadge,
                            {
                              backgroundColor: isActive
                                ? 'rgba(255, 255, 255, 0.25)'
                                : isDark
                                ? '#1E293B'
                                : '#E2E8F0',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipCountText,
                              {
                                color: isActive
                                  ? '#FFFFFF'
                                  : colors.textSecondary,
                              },
                            ]}
                          >
                            {cnt}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Apply Button Footer */}
            <View
              style={[
                styles.footer,
                { borderTopColor: isDark ? '#1E293B' : '#F1F5F9' },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.applyBtn,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => {
                  triggerHaptic('impactMedium');
                  onApply();
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.applyBtnText}>
                  Apply Filters
                  {activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Pickers */}
      <DatePickerModal
        visible={datePickerTarget !== null}
        title={datePickerTarget === 'from' ? 'Select Start Date (From)' : 'Select End Date (To)'}
        initialDate={
          (datePickerTarget === 'from' ? startDate : endDate) ||
          new Date().toISOString().split('T')[0]
        }
        allowFuture={true}
        allowPast={true}
        onClose={() => setDatePickerTarget(null)}
        onSelectDate={(formattedDate: string) => {
          if (datePickerTarget === 'from') {
            setStartDate(formattedDate);
          } else {
            setEndDate(formattedDate);
          }
          setDatePickerTarget(null);
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 15, 26, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '85%',
  },
  grabHandleRow: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  grabHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  activeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
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
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  resetText: {
    fontSize: 12,
    fontWeight: '600',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    maxHeight: 460,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  sectionBlock: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  dateInputsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateCol: {
    flex: 1,
  },
  inputSublabel: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  datePickerText: {
    fontSize: 12.5,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  chipText: {
    fontSize: 12,
  },
  chipCountBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    marginLeft: 6,
  },
  chipCountText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  applyBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

