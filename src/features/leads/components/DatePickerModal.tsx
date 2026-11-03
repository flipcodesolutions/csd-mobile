import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';

interface DatePickerModalProps {
  visible: boolean;
  title: string;
  initialDate?: string; // YYYY-MM-DD
  allowFuture?: boolean;
  onClose: () => void;
  onSelectDate: (dateStr: string) => void;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  title,
  initialDate,
  allowFuture = false,
  onClose,
  onSelectDate,
}) => {
  const { colors, isDark } = useTheme();

  // Current today
  const today = useMemo(() => new Date(), []);
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();

  const [currentYear, setCurrentYear] = useState(todayYear);
  const [currentMonth, setCurrentMonth] = useState(todayMonth);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showYearPicker, setShowYearPicker] = useState(false);

  // Initialize from initialDate if provided
  useEffect(() => {
    if (visible) {
      if (initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate)) {
        const parts = initialDate.split('-');
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        setCurrentYear(y);
        setCurrentMonth(m);
        setSelectedDay(d);
      } else {
        setCurrentYear(todayYear);
        setCurrentMonth(todayMonth);
        setSelectedDay(null);
      }
      setShowYearPicker(false);
    }
  }, [visible, initialDate, todayYear, todayMonth]);

  // Days in current month
  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  // First day of current month (0: Sunday, 1: Monday, ...)
  const firstDayIndex = useMemo(() => {
    return new Date(currentYear, currentMonth, 1).getDay();
  }, [currentYear, currentMonth]);

  // Year list for fast year selection
  const yearsList = useMemo(() => {
    const list: number[] = [];
    const maxYear = allowFuture ? todayYear + 10 : todayYear;
    const minYear = allowFuture ? todayYear - 2 : 1950;
    for (let y = maxYear; y >= minYear; y--) {
      list.push(y);
    }
    return list;
  }, [todayYear, allowFuture]);

  // Navigate month
  const handlePrevMonth = () => {
    triggerHaptic('selection');
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    triggerHaptic('selection');
    if (!allowFuture && currentYear === todayYear && currentMonth >= todayMonth) {
      return;
    }
    if (allowFuture && currentYear >= todayYear + 10 && currentMonth === 11) {
      return;
    }
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Select a day
  const handleDayPress = (day: number) => {
    if (!allowFuture) {
      const checkDate = new Date(currentYear, currentMonth, day);
      const startOfToday = new Date(todayYear, todayMonth, todayDate, 23, 59, 59);
      if (checkDate > startOfToday) {
        triggerHaptic('notificationWarning');
        return;
      }
    }

    triggerHaptic('selection');
    setSelectedDay(day);
    const mm = String(currentMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const formatted = `${currentYear}-${mm}-${dd}`;
    onSelectDate(formatted);
    onClose();
  };

  const isNextDisabled = !allowFuture
    ? currentYear === todayYear && currentMonth >= todayMonth
    : currentYear >= todayYear + 10 && currentMonth === 11;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[
            styles.calendarCard,
            {
              backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
            },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.headerRow,
              { borderBottomColor: isDark ? '#1E293B' : '#F1F5F9' },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <CalendarIcon size={18} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                {title}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={[
                styles.closeBtn,
                { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
              ]}
            >
              <X size={15} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Month / Year Bar */}
          <View style={styles.monthNavRow}>
            <TouchableOpacity
              style={[
                styles.navBtn,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                },
              ]}
              onPress={handlePrevMonth}
            >
              <ChevronLeft size={16} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.monthYearSelector,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                },
              ]}
              onPress={() => {
                triggerHaptic('selection');
                setShowYearPicker(!showYearPicker);
              }}
            >
              <Text
                style={[
                  styles.monthYearText,
                  { color: colors.textPrimary },
                ]}
              >
                {MONTH_NAMES[currentMonth]} {currentYear} ▾
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.navBtn,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                  opacity: isNextDisabled ? 0.3 : 1,
                },
              ]}
              onPress={handleNextMonth}
              disabled={isNextDisabled}
            >
              <ChevronRight size={16} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Fast Year Picker Overlay */}
          {showYearPicker ? (
            <View
              style={[
                styles.yearPickerContainer,
                {
                  backgroundColor: isDark ? '#101726' : '#F8FAFC',
                  borderColor: isDark ? '#1E293B' : '#CBD5E1',
                },
              ]}
            >
              <Text
                style={[
                  styles.yearPickerNotice,
                  { color: colors.textSecondary },
                ]}
              >
                Select Year (Current & Past Only):
              </Text>
              <ScrollView
                style={{ maxHeight: 200 }}
                contentContainerStyle={styles.yearsGrid}
                showsVerticalScrollIndicator={true}
              >
                {yearsList.map((y) => {
                  const isSel = currentYear === y;
                  return (
                    <TouchableOpacity
                      key={y}
                      style={[
                        styles.yearChip,
                        {
                          backgroundColor: isSel
                            ? colors.primary
                            : isDark
                            ? '#131B2E'
                            : '#FFFFFF',
                          borderColor: isSel
                            ? colors.primaryDark
                            : isDark
                            ? '#1E293B'
                            : '#E2E8F0',
                        },
                      ]}
                      onPress={() => {
                        triggerHaptic('selection');
                        setCurrentYear(y);
                        // If selecting todayYear and currentMonth > todayMonth, clamp to todayMonth
                        if (y === todayYear && currentMonth > todayMonth) {
                          setCurrentMonth(todayMonth);
                        }
                        setShowYearPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.yearChipText,
                          { color: isSel ? '#FFFFFF' : colors.textPrimary },
                        ]}
                      >
                        {y}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ) : (
            <>
              {/* Days Header */}
              <View style={styles.weekDaysRow}>
                {WEEK_DAYS.map((wd) => (
                  <Text
                    key={wd}
                    style={[styles.weekDayText, { color: colors.textSecondary }]}
                  >
                    {wd}
                  </Text>
                ))}
              </View>

              {/* Days Grid */}
              <View style={styles.daysGrid}>
                {/* Empty cells before 1st of month */}
                {Array.from({ length: firstDayIndex }).map((_, idx) => (
                  <View key={`empty-${idx}`} style={styles.dayCell} />
                ))}

                {/* Actual month days */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const day = idx + 1;
                  const isToday =
                    currentYear === todayYear &&
                    currentMonth === todayMonth &&
                    day === todayDate;

                  // Check if future
                  const isFuture =
                    currentYear > todayYear ||
                    (currentYear === todayYear && currentMonth > todayMonth) ||
                    (currentYear === todayYear &&
                      currentMonth === todayMonth &&
                      day > todayDate);

                  const isBlocked = !allowFuture && isFuture;
                  const isSelected = selectedDay === day;

                  return (
                    <TouchableOpacity
                      key={`day-${day}`}
                      style={[
                        styles.dayCell,
                        isSelected && [
                          styles.dayCellSelected,
                          { backgroundColor: colors.primary },
                        ],
                        isToday &&
                          !isSelected && [
                            styles.dayCellToday,
                            { borderColor: colors.primary },
                          ],
                        isBlocked && styles.dayCellDisabled,
                      ]}
                      onPress={() => handleDayPress(day)}
                      disabled={isBlocked}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          {
                            color: isSelected
                              ? '#FFFFFF'
                              : isBlocked
                              ? isDark
                                ? '#475569'
                                : '#CBD5E1'
                              : colors.textPrimary,
                            fontWeight: isSelected || isToday ? '800' : '500',
                          },
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* Footer Note */}
          <View
            style={[
              styles.footerRow,
              { borderTopColor: isDark ? '#1E293B' : '#F1F5F9' },
            ]}
          >
            <Text style={[styles.footerNotice, { color: colors.textSecondary }]}>
              ℹ️ Only current & past dates are selectable
            </Text>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('selection');
                onSelectDate('');
                onClose();
              }}
            >
              <Text style={[styles.clearBtnText, { color: '#EF4444' }]}>
                Clear Date
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
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthYearSelector: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  monthYearText: {
    fontSize: 13,
    fontWeight: '800',
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  dayCellSelected: {
    borderRadius: 10,
  },
  dayCellToday: {
    borderWidth: 1,
    borderRadius: 10,
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 12,
  },
  yearPickerContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginVertical: 6,
  },
  yearPickerNotice: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
  },
  yearsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  yearChip: {
    width: '30%',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  footerNotice: {
    fontSize: 10,
    fontWeight: '600',
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

export default DatePickerModal;

