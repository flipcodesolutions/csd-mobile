import React, { useState, useEffect } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Clock, Check, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';

interface TimePickerModalProps {
  visible: boolean;
  title: string;
  initialTime?: string; // e.g. "02:30 PM" or "14:30"
  onClose: () => void;
  onSelectTime: (formattedTime: string) => void;
}

const HOURS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
const PRESETS = [
  '09:00 AM',
  '10:30 AM',
  '11:00 AM',
  '02:30 PM',
  '04:00 PM',
  '05:30 PM',
  '06:00 PM',
];

export const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  title,
  initialTime,
  onClose,
  onSelectTime,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [selectedHour, setSelectedHour] = useState('10');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');

  useEffect(() => {
    if (visible) {
      if (initialTime && initialTime.trim()) {
        const cleaned = initialTime.trim();
        // Check for "HH:MM AM/PM"
        const match12 = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
        if (match12) {
          let h = parseInt(match12[1], 10);
          const m = match12[2];
          const p = (match12[3] || 'AM').toUpperCase() as 'AM' | 'PM';
          if (h > 12) {
            h = h - 12;
            setSelectedPeriod('PM');
          } else {
            setSelectedPeriod(p);
          }
          setSelectedHour(String(h).padStart(2, '0'));
          // Round minute to nearest 5 or keep
          const minNum = parseInt(m, 10);
          const nearest5 = Math.round(minNum / 5) * 5;
          const clampedMin = nearest5 >= 60 ? 55 : nearest5;
          setSelectedMinute(String(clampedMin).padStart(2, '0'));
        }
      }
    }
  }, [visible, initialTime]);

  const handleConfirm = () => {
    triggerHaptic('selection');
    const result = `${selectedHour}:${selectedMinute} ${selectedPeriod}`;
    onSelectTime(result);
    onClose();
  };

  const handleApplyPreset = (preset: string) => {
    triggerHaptic('selection');
    const parts = preset.split(' ');
    const [h, m] = parts[0].split(':');
    setSelectedHour(h);
    setSelectedMinute(m);
    setSelectedPeriod(parts[1] as 'AM' | 'PM');
  };

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
            styles.sheetContainer,
            {
              backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: isDark
                      ? 'rgba(56, 189, 248, 0.15)'
                      : '#E0F2FE',
                  },
                ]}
              >
                <Clock
                  size={18}
                  color={isDark ? '#38BDF8' : '#0284C7'}
                  strokeWidth={2.5}
                />
              </View>
              <Text
                style={[styles.headerTitle, { color: colors.textPrimary }]}
              >
                {title}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={[
                styles.closeBtn,
                { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
              ]}
            >
              <X size={16} color={colors.textSecondary} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>

          {/* Time Display Header */}
          <View
            style={[
              styles.displayBox,
              {
                backgroundColor: isDark ? '#101726' : '#F8FAFC',
                borderColor: isDark ? '#1E293B' : '#E2E8F0',
              },
            ]}
          >
            <Text style={[styles.timeDisplayText, { color: colors.primary }]}>
              {selectedHour}:{selectedMinute}
            </Text>
            <View style={styles.periodBadge}>
              <Text style={styles.periodBadgeText}>{selectedPeriod}</Text>
            </View>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* AM / PM Toggle */}
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                PERIOD
              </Text>
              <View style={styles.periodRow}>
                {(['AM', 'PM'] as const).map((p) => {
                  const isSel = selectedPeriod === p;
                  return (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.periodBtn,
                        {
                          backgroundColor: isSel
                            ? colors.primary
                            : isDark
                            ? '#101726'
                            : '#F1F5F9',
                          borderColor: isSel
                            ? colors.primaryDark
                            : isDark
                            ? '#1E293B'
                            : '#CBD5E1',
                        },
                      ]}
                      onPress={() => {
                        triggerHaptic('selection');
                        setSelectedPeriod(p);
                      }}
                    >
                      <Text
                        style={[
                          styles.periodBtnText,
                          {
                            color: isSel ? '#FFFFFF' : colors.textPrimary,
                            fontWeight: isSel ? '700' : '500',
                          },
                        ]}
                      >
                        {p}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Hours Selector */}
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                HOUR
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsScroll}
              >
                {HOURS.map((h) => {
                  const isSel = selectedHour === h;
                  return (
                    <TouchableOpacity
                      key={h}
                      style={[
                        styles.hourChip,
                        {
                          backgroundColor: isSel
                            ? colors.primary
                            : isDark
                            ? '#101726'
                            : '#F8FAFC',
                          borderColor: isSel
                            ? colors.primaryDark
                            : isDark
                            ? '#1E293B'
                            : '#E2E8F0',
                        },
                      ]}
                      onPress={() => {
                        triggerHaptic('selection');
                        setSelectedHour(h);
                      }}
                    >
                      <Text
                        style={[
                          styles.chipNumText,
                          {
                            color: isSel ? '#FFFFFF' : colors.textPrimary,
                            fontWeight: isSel ? '700' : '500',
                          },
                        ]}
                      >
                        {h}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Minutes Selector */}
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                MINUTES
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsScroll}
              >
                {MINUTES.map((m) => {
                  const isSel = selectedMinute === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.hourChip,
                        {
                          backgroundColor: isSel
                            ? colors.primary
                            : isDark
                            ? '#101726'
                            : '#F8FAFC',
                          borderColor: isSel
                            ? colors.primaryDark
                            : isDark
                            ? '#1E293B'
                            : '#E2E8F0',
                        },
                      ]}
                      onPress={() => {
                        triggerHaptic('selection');
                        setSelectedMinute(m);
                      }}
                    >
                      <Text
                        style={[
                          styles.chipNumText,
                          {
                            color: isSel ? '#FFFFFF' : colors.textPrimary,
                            fontWeight: isSel ? '700' : '500',
                          },
                        ]}
                      >
                        {m}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Quick Presets */}
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                COMMON TIME PRESETS
              </Text>
              <View style={styles.presetsWrap}>
                {PRESETS.map((pst) => (
                  <TouchableOpacity
                    key={pst}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: isDark ? '#101726' : '#F1F5F9',
                        borderColor: isDark ? '#1E293B' : '#E2E8F0',
                      },
                    ]}
                    onPress={() => handleApplyPreset(pst)}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {pst}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[
                styles.cancelBtn,
                {
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  backgroundColor: isDark ? '#101726' : '#F1F5F9',
                },
              ]}
              onPress={onClose}
            >
              <Text
                style={[styles.cancelBtnText, { color: colors.textSecondary }]}
              >
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                { backgroundColor: colors.primary },
              ]}
              onPress={handleConfirm}
            >
              <Check size={16} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 6 }} />
              <Text style={styles.confirmBtnText}>Confirm Time</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sheetContainer: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '85%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  displayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  timeDisplayText: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  periodBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  periodBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  scrollArea: {
    maxHeight: 320,
  },
  sectionRow: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  periodRow: {
    flexDirection: 'row',
    gap: 10,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodBtnText: {
    fontSize: 13,
  },
  chipsScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  hourChip: {
    minWidth: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  chipNumText: {
    fontSize: 14,
  },
  presetsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

