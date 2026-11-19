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
  ChevronDown,
  Filter,
  RotateCcw,
  User,
  X,
  Folder,
  Activity,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../core/theme/colors';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { DatePickerModal } from '../../leads/components/DatePickerModal';
import { ActivityLogFilterOptions, ActivityLogUser } from '../types';

interface ActivityLogFilterModalProps {
  visible: boolean;
  filterOptions: ActivityLogFilterOptions;
  selectedUser: string | number;
  selectedModule: string;
  selectedAction: string;
  startDate: string;
  endDate: string;
  onClose: () => void;
  onApply: (filters: {
    user_id: string | number;
    module: string;
    action: string;
    start_date: string;
    end_date: string;
  }) => void;
  onReset: () => void;
}

export const ActivityLogFilterModal: React.FC<ActivityLogFilterModalProps> = ({
  visible,
  filterOptions,
  selectedUser,
  selectedModule,
  selectedAction,
  startDate,
  endDate,
  onClose,
  onApply,
  onReset,
}) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Local draft state
  const [draftUser, setDraftUser] = useState<string | number>(selectedUser);
  const [draftModule, setDraftModule] = useState<string>(selectedModule);
  const [draftAction, setDraftAction] = useState<string>(selectedAction);
  const [draftStartDate, setDraftStartDate] = useState<string>(startDate);
  const [draftEndDate, setDraftEndDate] = useState<string>(endDate);

  // Sub-pickers
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Sync draft with incoming props when opening
  React.useEffect(() => {
    if (visible) {
      setDraftUser(selectedUser);
      setDraftModule(selectedModule);
      setDraftAction(selectedAction);
      setDraftStartDate(startDate);
      setDraftEndDate(endDate);
    }
  }, [visible, selectedUser, selectedModule, selectedAction, startDate, endDate]);

  if (!visible) return null;

  const handleApply = () => {
    triggerHaptic('impactLight');
    onApply({
      user_id: draftUser,
      module: draftModule,
      action: draftAction,
      start_date: draftStartDate,
      end_date: draftEndDate,
    });
    onClose();
  };

  const handleReset = () => {
    triggerHaptic('impactLight');
    setDraftUser('all');
    setDraftModule('all');
    setDraftAction('all');
    setDraftStartDate('');
    setDraftEndDate('');
    onReset();
    onClose();
  };

  const formatDisplayDate = (dStr: string) => {
    if (!dStr) return '';
    try {
      const parts = dStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    } catch (_) {}
    return dStr;
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
            styles.sheetContainer,
            {
              backgroundColor: isDark ? '#101726' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
              paddingBottom: Math.max(insets.bottom + 16, 24),
            },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.sheetHeader,
              { borderBottomColor: isDark ? '#1E293B' : '#F1F5F9' },
            ]}
          >
            <View style={styles.headerTitleRow}>
              <View
                style={[
                  styles.filterIconBox,
                  {
                    backgroundColor: isDark
                      ? 'rgba(88, 99, 42, 0.2)'
                      : '#EFF3DF',
                    borderColor: isDark
                      ? 'rgba(88, 99, 42, 0.4)'
                      : '#DCE9A2',
                  },
                ]}
              >
                <Filter size={15} color={colors.primary} strokeWidth={2.4} />
              </View>
              <Text
                style={[
                  styles.sheetTitle,
                  { color: isDark ? '#F8FAFC' : '#0F172A' },
                ]}
              >
                Filter Activity Records
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color={isDark ? '#94A3B8' : '#64748B'} />
            </TouchableOpacity>
          </View>

          {/* Form Scroll Body */}
          <ScrollView
            style={styles.formScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.formContent}
          >
            {/* 1. User Filter */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <User size={13} color={colors.primary} />
                <Text
                  style={[
                    styles.groupLabel,
                    { color: isDark ? '#F8FAFC' : '#0F172A' },
                  ]}
                >
                  Select User
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsScroll}
              >
                <TouchableOpacity
                  style={[
                    styles.chip,
                    draftUser === 'all' && [
                      styles.chipActive,
                      { backgroundColor: colors.primary, borderColor: colors.primary },
                    ],
                    {
                      backgroundColor: isDark ? '#162032' : '#F8FAFC',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                  onPress={() => setDraftUser('all')}
                >
                  <Text
                    style={[
                      styles.chipText,
                      draftUser === 'all' && styles.chipTextActive,
                      { color: draftUser === 'all' ? '#FFFFFF' : isDark ? '#CBD5E1' : '#475569' },
                    ]}
                  >
                    All Users
                  </Text>
                </TouchableOpacity>

                {filterOptions.users.map((u) => {
                  const isSel = String(draftUser) === String(u.id);
                  return (
                    <TouchableOpacity
                      key={`user-chip-${u.id}`}
                      style={[
                        styles.chip,
                        isSel && [
                          styles.chipActive,
                          { backgroundColor: colors.primary, borderColor: colors.primary },
                        ],
                        {
                          backgroundColor: isDark ? '#162032' : '#F8FAFC',
                          borderColor: isDark ? '#1E293B' : '#E2E8F0',
                        },
                      ]}
                      onPress={() => setDraftUser(u.id)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSel && styles.chipTextActive,
                          { color: isSel ? '#FFFFFF' : isDark ? '#CBD5E1' : '#475569' },
                        ]}
                      >
                        {u.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* 2. Module Filter */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Folder size={13} color="#0284C7" />
                <Text
                  style={[
                    styles.groupLabel,
                    { color: isDark ? '#F8FAFC' : '#0F172A' },
                  ]}
                >
                  Select Module
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsScroll}
              >
                <TouchableOpacity
                  style={[
                    styles.chip,
                    draftModule === 'all' && [
                      styles.chipActive,
                      { backgroundColor: '#0284C7', borderColor: '#0284C7' },
                    ],
                    {
                      backgroundColor: isDark ? '#162032' : '#F8FAFC',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                  onPress={() => setDraftModule('all')}
                >
                  <Text
                    style={[
                      styles.chipText,
                      draftModule === 'all' && styles.chipTextActive,
                      { color: draftModule === 'all' ? '#FFFFFF' : isDark ? '#CBD5E1' : '#475569' },
                    ]}
                  >
                    All Modules
                  </Text>
                </TouchableOpacity>

                {filterOptions.modules.map((m) => {
                  const isSel = draftModule.toLowerCase() === m.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={`module-chip-${m}`}
                      style={[
                        styles.chip,
                        isSel && [
                          styles.chipActive,
                          { backgroundColor: '#0284C7', borderColor: '#0284C7' },
                        ],
                        {
                          backgroundColor: isDark ? '#162032' : '#F8FAFC',
                          borderColor: isDark ? '#1E293B' : '#E2E8F0',
                        },
                      ]}
                      onPress={() => setDraftModule(m)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSel && styles.chipTextActive,
                          { color: isSel ? '#FFFFFF' : isDark ? '#CBD5E1' : '#475569' },
                        ]}
                      >
                        {m}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* 3. Action Filter */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Activity size={13} color="#D97706" />
                <Text
                  style={[
                    styles.groupLabel,
                    { color: isDark ? '#F8FAFC' : '#0F172A' },
                  ]}
                >
                  Select Action
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsScroll}
              >
                <TouchableOpacity
                  style={[
                    styles.chip,
                    draftAction === 'all' && [
                      styles.chipActive,
                      { backgroundColor: '#D97706', borderColor: '#D97706' },
                    ],
                    {
                      backgroundColor: isDark ? '#162032' : '#F8FAFC',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                  onPress={() => setDraftAction('all')}
                >
                  <Text
                    style={[
                      styles.chipText,
                      draftAction === 'all' && styles.chipTextActive,
                      { color: draftAction === 'all' ? '#FFFFFF' : isDark ? '#CBD5E1' : '#475569' },
                    ]}
                  >
                    All Actions
                  </Text>
                </TouchableOpacity>

                {filterOptions.actions.map((act) => {
                  const isSel = draftAction.toLowerCase() === act.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={`action-chip-${act}`}
                      style={[
                        styles.chip,
                        isSel && [
                          styles.chipActive,
                          { backgroundColor: '#D97706', borderColor: '#D97706' },
                        ],
                        {
                          backgroundColor: isDark ? '#162032' : '#F8FAFC',
                          borderColor: isDark ? '#1E293B' : '#E2E8F0',
                        },
                      ]}
                      onPress={() => setDraftAction(act)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSel && styles.chipTextActive,
                          { color: isSel ? '#FFFFFF' : isDark ? '#CBD5E1' : '#475569' },
                        ]}
                      >
                        {act.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* 4. Date Range Filter */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Calendar size={13} color={colors.primary} />
                <Text
                  style={[
                    styles.groupLabel,
                    { color: isDark ? '#F8FAFC' : '#0F172A' },
                  ]}
                >
                  Date Range
                </Text>
              </View>

              <View style={styles.datePickerRow}>
                {/* Start Date */}
                <TouchableOpacity
                  style={[
                    styles.dateBox,
                    {
                      backgroundColor: isDark ? '#162032' : '#F8FAFC',
                      borderColor: draftStartDate
                        ? colors.primary
                        : isDark
                        ? '#1E293B'
                        : '#CBD5E1',
                    },
                  ]}
                  onPress={() => setShowStartDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dateLabel,
                      { color: isDark ? '#94A3B8' : '#64748B' },
                    ]}
                  >
                    From:
                  </Text>
                  <Text
                    style={[
                      styles.dateValue,
                      {
                        color: draftStartDate
                          ? isDark
                            ? '#F8FAFC'
                            : '#0F172A'
                          : isDark
                          ? '#64748B'
                          : '#94A3B8',
                      },
                    ]}
                  >
                    {draftStartDate
                      ? formatDisplayDate(draftStartDate)
                      : 'dd/mm/yyyy'}
                  </Text>
                  {draftStartDate ? (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        setDraftStartDate('');
                      }}
                    >
                      <X size={14} color={isDark ? '#94A3B8' : '#64748B'} />
                    </TouchableOpacity>
                  ) : (
                    <Calendar size={14} color={isDark ? '#94A3B8' : '#64748B'} />
                  )}
                </TouchableOpacity>

                {/* End Date */}
                <TouchableOpacity
                  style={[
                    styles.dateBox,
                    {
                      backgroundColor: isDark ? '#162032' : '#F8FAFC',
                      borderColor: draftEndDate
                        ? colors.primary
                        : isDark
                        ? '#1E293B'
                        : '#CBD5E1',
                    },
                  ]}
                  onPress={() => setShowEndDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dateLabel,
                      { color: isDark ? '#94A3B8' : '#64748B' },
                    ]}
                  >
                    To:
                  </Text>
                  <Text
                    style={[
                      styles.dateValue,
                      {
                        color: draftEndDate
                          ? isDark
                            ? '#F8FAFC'
                            : '#0F172A'
                          : isDark
                          ? '#64748B'
                          : '#94A3B8',
                      },
                    ]}
                  >
                    {draftEndDate
                      ? formatDisplayDate(draftEndDate)
                      : 'dd/mm/yyyy'}
                  </Text>
                  {draftEndDate ? (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        setDraftEndDate('');
                      }}
                    >
                      <X size={14} color={isDark ? '#94A3B8' : '#64748B'} />
                    </TouchableOpacity>
                  ) : (
                    <Calendar size={14} color={isDark ? '#94A3B8' : '#64748B'} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View
            style={[
              styles.sheetFooter,
              { borderTopColor: isDark ? '#1E293B' : '#F1F5F9' },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.resetBtn,
                {
                  backgroundColor: isDark ? '#162032' : '#F1F5F9',
                  borderColor: isDark ? '#1E293B' : '#CBD5E1',
                },
              ]}
              onPress={handleReset}
              activeOpacity={0.7}
            >
              <RotateCcw size={14} color={isDark ? '#94A3B8' : '#64748B'} />
              <Text
                style={[
                  styles.resetBtnText,
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
              >
                Reset All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.applyBtn,
                { backgroundColor: colors.primary },
              ]}
              onPress={handleApply}
              activeOpacity={0.8}
            >
              <Check size={16} color="#FFFFFF" strokeWidth={2.4} />
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Start Date Picker */}
      <DatePickerModal
        visible={showStartDatePicker}
        title="Select Start Date (From)"
        initialDate={draftStartDate || undefined}
        allowFuture={false}
        allowPast={true}
        onClose={() => setShowStartDatePicker(false)}
        onSelectDate={(dt) => {
          setDraftStartDate(dt);
          setShowStartDatePicker(false);
        }}
      />

      {/* End Date Picker */}
      <DatePickerModal
        visible={showEndDatePicker}
        title="Select End Date (To)"
        initialDate={draftEndDate || draftStartDate || undefined}
        allowFuture={false}
        allowPast={true}
        onClose={() => setShowEndDatePicker(false)}
        onSelectDate={(dt) => {
          setDraftEndDate(dt);
          setShowEndDatePicker(false);
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
  sheetContainer: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    maxHeight: '85%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterIconBox: {
    width: 28,
    height: 28,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  formScroll: {
    maxHeight: 450,
  },
  formContent: {
    padding: 16,
    gap: 16,
  },
  formGroup: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  chipsScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipActive: {},
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    fontWeight: '700',
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateBox: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  dateValue: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    marginHorizontal: 6,
  },
  sheetFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  applyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: 8,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

