import React, { useState, useEffect } from 'react';
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
  Cake,
  Heart,
  Users,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';

export type DateFilterType = 'all' | 'missing_dob' | 'missing_anniversary' | 'missing_both' | 'has_both';
export type DateFieldOption = 'any' | 'birth_date' | 'anniversary_date' | 'created_at';

export interface CustomerDatesFilterState {
  filterType: DateFilterType;
  dateField: DateFieldOption;
  fromDate: string | null; // YYYY-MM-DD
  toDate: string | null;   // YYYY-MM-DD
}

interface CustomerDatesFilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: CustomerDatesFilterState;
  onApply: (filters: CustomerDatesFilterState) => void;
  counts: {
    total: number;
    missingDob: number;
    missingAnniv: number;
    missingBoth: number;
    hasBoth: number;
    filteredCount: number;
  };
  onOpenDatePicker: (
    field: 'from' | 'to',
    initialDate: string | null,
    onSelect: (dateStr: string) => void
  ) => void;
}

const FILTER_PRESETS: { key: DateFilterType; label: string; icon: any; color: string }[] = [
  { key: 'all', label: 'All Leads', icon: Users, color: '#58632A' },
  { key: 'missing_dob', label: 'Missing Birth Date', icon: Cake, color: '#E11D48' },
  { key: 'missing_anniversary', label: 'Missing Anniversary', icon: Heart, color: '#2563EB' },
  { key: 'missing_both', label: 'Missing Both Dates', icon: Calendar, color: '#DC2626' },
  { key: 'has_both', label: 'Has Both Dates', icon: Check, color: '#16A34A' },
];

const DATE_FIELD_OPTIONS: { key: DateFieldOption; label: string; hint: string }[] = [
  { key: 'any', label: 'Any Date', hint: 'Matches Birthday or Anniversary' },
  { key: 'birth_date', label: 'Birth Date (DOB)', hint: 'Filter specifically by customer birthday' },
  { key: 'anniversary_date', label: 'Anniversary Date', hint: 'Filter specifically by wedding anniversary' },
  { key: 'created_at', label: 'Lead Added Date', hint: 'Filter by when lead was registered in CRM' },
];

export const CustomerDatesFilterModal: React.FC<CustomerDatesFilterModalProps> = ({
  visible,
  onClose,
  filters,
  onApply,
  counts,
  onOpenDatePicker,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [localFilters, setLocalFilters] = useState<CustomerDatesFilterState>(filters);

  useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
    }
  }, [visible, filters]);

  if (!visible) return null;

  const formatDateDisplay = (isoDate: string | null): string => {
    if (!isoDate) return 'dd/mm/yyyy';
    try {
      const parts = isoDate.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return isoDate;
    } catch {
      return isoDate;
    }
  };

  const getPresetCount = (type: DateFilterType) => {
    switch (type) {
      case 'all':
        return counts.total;
      case 'missing_dob':
        return counts.missingDob;
      case 'missing_anniversary':
        return counts.missingAnniv;
      case 'missing_both':
        return counts.missingBoth;
      case 'has_both':
        return counts.hasBoth;
      default:
        return 0;
    }
  };

  const activeFiltersCount =
    (localFilters.filterType !== 'all' ? 1 : 0) +
    (localFilters.fromDate ? 1 : 0) +
    (localFilters.toDate ? 1 : 0) +
    (localFilters.dateField !== 'any' ? 1 : 0);

  const handleReset = () => {
    triggerHaptic('impactLight');
    setLocalFilters({
      filterType: 'all',
      dateField: 'any',
      fromDate: null,
      toDate: null,
    });
  };

  const handleApply = () => {
    triggerHaptic('notificationSuccess');
    onApply(localFilters);
    onClose();
  };

  return (
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

          {/* Modal Header */}
          <View
            style={[
              styles.headerRow,
              { borderBottomColor: isDark ? '#1E293B' : '#F1F5F9' },
            ]}
          >
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.filterIconBadge,
                  { backgroundColor: isDark ? '#1E293B' : '#EEF2E6' },
                ]}
              >
                <SlidersHorizontal size={18} color="#58632A" strokeWidth={2.4} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                  Filter Leads Dates
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                  {counts.filteredCount} Records Matching
                </Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              {activeFiltersCount > 0 && (
                <TouchableOpacity
                  onPress={handleReset}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.resetBtn}
                >
                  <RotateCcw size={13} color={colors.textSecondary} strokeWidth={2} />
                  <Text style={[styles.resetText, { color: colors.textSecondary }]}>
                    Reset
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('selection');
                  onClose();
                }}
                style={[
                  styles.closeBtn,
                  { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                ]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={18} color={colors.textPrimary} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Modal Body */}
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Section 1: Lead Date Status Category */}
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Customer Date Status
              </Text>
              <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
                Quickly target leads with missing or populated celebration dates
              </Text>

              <View style={styles.presetsList}>
                {FILTER_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const isSelected = localFilters.filterType === preset.key;
                  const count = getPresetCount(preset.key);

                  return (
                    <TouchableOpacity
                      key={preset.key}
                      onPress={() => {
                        triggerHaptic('selection');
                        setLocalFilters((prev) => ({ ...prev, filterType: preset.key }));
                      }}
                      activeOpacity={0.7}
                      style={[
                        styles.presetCard,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? '#1E293B'
                              : '#F4F7EB'
                            : isDark
                              ? '#0F172A'
                              : '#F8FAFC',
                          borderColor: isSelected
                            ? '#58632A'
                            : isDark
                              ? '#1E293B'
                              : '#E2E8F0',
                        },
                      ]}
                    >
                      <View style={styles.presetLeft}>
                        <View
                          style={[
                            styles.presetIconWrap,
                            { backgroundColor: `${preset.color}18` },
                          ]}
                        >
                          <Icon size={16} color={preset.color} strokeWidth={2.2} />
                        </View>
                        <Text
                          style={[
                            styles.presetLabel,
                            {
                              color: isSelected
                                ? '#58632A'
                                : colors.textPrimary,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          {preset.label}
                        </Text>
                      </View>

                      <View style={styles.presetRight}>
                        <View
                          style={[
                            styles.countPill,
                            {
                              backgroundColor: isSelected
                                ? '#58632A'
                                : isDark
                                  ? '#334155'
                                  : '#E2E8F0',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.countPillText,
                              {
                                color: isSelected
                                  ? '#FFFFFF'
                                  : colors.textSecondary,
                              },
                            ]}
                          >
                            {count}
                          </Text>
                        </View>
                        {isSelected && (
                          <View style={styles.selectedTick}>
                            <Check size={14} color="#58632A" strokeWidth={3} />
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 2: Date Field Selector */}
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Filter Date Field
              </Text>
              <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
                Select which date column applies to the range below
              </Text>

              <View style={styles.dateFieldChipsRow}>
                {DATE_FIELD_OPTIONS.map((opt) => {
                  const isSelected = localFilters.dateField === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      onPress={() => {
                        triggerHaptic('selection');
                        setLocalFilters((prev) => ({ ...prev, dateField: opt.key }));
                      }}
                      activeOpacity={0.7}
                      style={[
                        styles.fieldChip,
                        {
                          backgroundColor: isSelected
                            ? '#58632A'
                            : isDark
                              ? '#0F172A'
                              : '#F1F5F9',
                          borderColor: isSelected
                            ? '#58632A'
                            : isDark
                              ? '#1E293B'
                              : '#CBD5E1',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.fieldChipText,
                          {
                            color: isSelected
                              ? '#FFFFFF'
                              : colors.textPrimary,
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

            {/* Section 3: Date Range (From - To) */}
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Date Range
              </Text>
              <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
                Leave blank for Any Date or set start and end boundaries
              </Text>

              <View style={styles.rangeRow}>
                {/* From Date Box */}
                <View style={styles.rangeCol}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    From
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic('selection');
                      onOpenDatePicker('from', localFilters.fromDate, (d) => {
                        setLocalFilters((prev) => ({ ...prev, fromDate: d }));
                      });
                    }}
                    activeOpacity={0.8}
                    style={[
                      styles.datePickerInput,
                      {
                        backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                        borderColor: localFilters.fromDate
                          ? '#58632A'
                          : isDark
                            ? '#1E293B'
                            : '#CBD5E1',
                      },
                    ]}
                  >
                    <Calendar size={16} color={localFilters.fromDate ? '#58632A' : colors.textSecondary} strokeWidth={2} />
                    <Text
                      style={[
                        styles.dateInputText,
                        {
                          color: localFilters.fromDate
                            ? colors.textPrimary
                            : colors.textSecondary,
                          fontWeight: localFilters.fromDate ? '600' : '400',
                        },
                      ]}
                    >
                      {formatDateDisplay(localFilters.fromDate)}
                    </Text>

                    {localFilters.fromDate ? (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          triggerHaptic('selection');
                          setLocalFilters((prev) => ({ ...prev, fromDate: null }));
                        }}
                        style={styles.clearDateBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <X size={14} color="#64748B" strokeWidth={2.5} />
                      </TouchableOpacity>
                    ) : null}
                  </TouchableOpacity>
                </View>

                {/* To Date Box */}
                <View style={styles.rangeCol}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    To
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic('selection');
                      onOpenDatePicker('to', localFilters.toDate, (d) => {
                        setLocalFilters((prev) => ({ ...prev, toDate: d }));
                      });
                    }}
                    activeOpacity={0.8}
                    style={[
                      styles.datePickerInput,
                      {
                        backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                        borderColor: localFilters.toDate
                          ? '#58632A'
                          : isDark
                            ? '#1E293B'
                            : '#CBD5E1',
                      },
                    ]}
                  >
                    <Calendar size={16} color={localFilters.toDate ? '#58632A' : colors.textSecondary} strokeWidth={2} />
                    <Text
                      style={[
                        styles.dateInputText,
                        {
                          color: localFilters.toDate
                            ? colors.textPrimary
                            : colors.textSecondary,
                          fontWeight: localFilters.toDate ? '600' : '400',
                        },
                      ]}
                    >
                      {formatDateDisplay(localFilters.toDate)}
                    </Text>

                    {localFilters.toDate ? (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          triggerHaptic('selection');
                          setLocalFilters((prev) => ({ ...prev, toDate: null }));
                        }}
                        style={styles.clearDateBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <X size={14} color="#64748B" strokeWidth={2.5} />
                      </TouchableOpacity>
                    ) : null}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Modal Footer */}
          <View
            style={[
              styles.footerContainer,
              {
                paddingBottom: Math.max(insets.bottom, 16),
                borderTopColor: isDark ? '#1E293B' : '#E2E8F0',
                backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
              },
            ]}
          >
            <TouchableOpacity
              onPress={handleReset}
              activeOpacity={0.8}
              style={[
                styles.footerResetBtn,
                {
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                },
              ]}
            >
              <RotateCcw size={15} color={colors.textSecondary} strokeWidth={2.2} />
              <Text style={[styles.footerResetText, { color: colors.textSecondary }]}>
                Clear All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleApply}
              activeOpacity={0.85}
              style={[styles.footerApplyBtn, { backgroundColor: '#58632A' }]}
            >
              <Text style={styles.footerApplyText}>
                Apply Filters ({counts.filteredCount})
              </Text>
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
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    maxHeight: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  grabHandleRow: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  grabHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  resetText: {
    fontSize: 12,
    fontWeight: '600',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    flexGrow: 0,
  },
  scrollContent: {
    padding: 18,
    gap: 22,
  },
  sectionBlock: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionHint: {
    fontSize: 12,
    fontWeight: '400',
    marginBottom: 6,
  },
  presetsList: {
    gap: 8,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  presetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  presetIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetLabel: {
    fontSize: 14,
  },
  presetRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  countPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  selectedTick: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EEF2E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateFieldChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fieldChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  fieldChipText: {
    fontSize: 13,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  rangeCol: {
    flex: 1,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  datePickerInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.2,
    gap: 8,
  },
  dateInputText: {
    flex: 1,
    fontSize: 13,
  },
  clearDateBtn: {
    padding: 2,
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  footerResetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
  },
  footerResetText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footerApplyBtn: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    shadowColor: '#58632A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  footerApplyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

