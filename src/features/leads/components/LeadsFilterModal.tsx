import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Check, RotateCcw, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { BrandItem, UserItem } from '../types';

interface LeadsFilterModalProps {
  visible: boolean;
  onClose: () => void;
  segment: 'All' | '4 Wheeler' | '2 Wheeler';
  setSegment: (val: 'All' | '4 Wheeler' | '2 Wheeler') => void;
  priority: 'All' | 'Hot' | 'Warm' | 'Cold';
  setPriority: (val: 'All' | 'Hot' | 'Warm' | 'Cold') => void;
  stage: string;
  setStage: (val: string) => void;
  selectedBrand: string;
  setSelectedBrand: (val: string) => void;
  selectedUser: number | null;
  setSelectedUser: (val: number | null) => void;
  brands: BrandItem[];
  users: UserItem[];
  stageCounts: Record<string, number>;
  activeFiltersCount: number;
  onReset: () => void;
  onApply: () => void;
}

export const LeadsFilterModal: React.FC<LeadsFilterModalProps> = ({
  visible,
  onClose,
  segment,
  setSegment,
  priority,
  setPriority,
  stage,
  setStage,
  selectedBrand,
  setSelectedBrand,
  selectedUser,
  setSelectedUser,
  brands,
  users,
  stageCounts,
  activeFiltersCount,
  onReset,
  onApply,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const stagesList = [
    'All',
    'New',
    'In Follow-Up',
    'Negotiation',
    'Deal Won',
    'Deal Lost',
  ];

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
          <View style={styles.modalContent}>
        {/* Modal Header */}
        <View
          style={[
            styles.headerRow,
            { borderBottomColor: isDark ? '#1E293B' : '#F1F5F9' },
          ]}
        >
          <View style={styles.headerLeft}>
            <Text
              style={[
                styles.headerTitle,
                { color: colors.textPrimary },
              ]}
            >
              Filter Pipeline
            </Text>
            {activeFiltersCount > 0 && (
              <View
                style={[
                  styles.activeCountBadge,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={styles.activeCountText}>
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
                <RotateCcw size={13} color={colors.textSecondary} strokeWidth={2} />
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

        {/* Scrollable Filter Options */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Vehicle Segment */}
          <View style={styles.sectionBlock}>
            <Text
              style={[
                styles.sectionLabel,
                { color: colors.textSecondary },
              ]}
            >
              VEHICLE SEGMENT
            </Text>
            <View style={styles.chipsRow}>
              {(
                [
                  { key: 'All', label: 'All Segments' },
                  { key: '4 Wheeler', label: '4W Passenger' },
                  { key: '2 Wheeler', label: '2W Motorbikes' },
                ] as const
              ).map(({ key: seg, label }) => {
                const isActive = segment === seg;
                return (
                  <TouchableOpacity
                    key={seg}
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
                      setSegment(seg);
                    }}
                    activeOpacity={0.7}
                  >
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
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 2. Priority / Urgency */}
          <View style={styles.sectionBlock}>
            <Text
              style={[
                styles.sectionLabel,
                { color: colors.textSecondary },
              ]}
            >
              PRIORITY & URGENCY
            </Text>
            <View style={styles.chipsRow}>
              {(['All', 'Hot', 'Warm', 'Cold'] as const).map((p) => {
                const isActive = priority === p;
                return (
                  <TouchableOpacity
                    key={p}
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
                      setPriority(p);
                    }}
                    activeOpacity={0.7}
                  >
                    {p !== 'All' && (
                      <View
                        style={[
                          styles.chipDot,
                          {
                            backgroundColor:
                              p === 'Hot'
                                ? '#EF4444'
                                : p === 'Warm'
                                ? '#F59E0B'
                                : '#38BDF8',
                          },
                        ]}
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
                      {p === 'All' ? 'All Priority' : `${p} Leads`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 3. Pipeline Stage */}
          <View style={styles.sectionBlock}>
            <Text
              style={[
                styles.sectionLabel,
                { color: colors.textSecondary },
              ]}
            >
              PIPELINE STAGE
            </Text>
            <View style={styles.chipsGrid}>
              {stagesList.map((st) => {
                const isActive = stage === st;
                const count =
                  st === 'All'
                    ? Object.values(stageCounts).reduce(
                        (a, b) => a + b,
                        0
                      )
                    : stageCounts[st] || 0;
                return (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.chip,
                      styles.stageChip,
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
                      setStage(st);
                    }}
                    activeOpacity={0.7}
                  >
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
                      {st}
                    </Text>
                    <View
                      style={[
                        styles.countPill,
                        {
                          backgroundColor: isActive
                            ? 'rgba(255,255,255,0.25)'
                            : isDark
                            ? '#1E293B'
                            : '#E2E8F0',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.countText,
                          {
                            color: isActive
                              ? '#FFFFFF'
                              : colors.textSecondary,
                          },
                        ]}
                      >
                        {count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 4. Brand Filter */}
          {brands.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text
                style={[
                  styles.sectionLabel,
                  { color: colors.textSecondary },
                ]}
              >
                VEHICLE BRAND
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalPills}
              >
                <TouchableOpacity
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        selectedBrand === 'All'
                          ? colors.primary
                          : isDark
                          ? '#101726'
                          : '#F8FAFC',
                      borderColor:
                        selectedBrand === 'All'
                          ? colors.primaryDark
                          : isDark
                          ? '#1E293B'
                          : '#E2E8F0',
                    },
                  ]}
                  onPress={() => {
                    triggerHaptic('selection');
                    setSelectedBrand('All');
                  }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color:
                          selectedBrand === 'All'
                            ? '#FFFFFF'
                            : colors.textPrimary,
                        fontWeight:
                          selectedBrand === 'All' ? '700' : '500',
                      },
                    ]}
                  >
                    All Brands
                  </Text>
                </TouchableOpacity>
                {brands.map((b) => {
                  const isActive = selectedBrand === b.name;
                  return (
                    <TouchableOpacity
                      key={b.id}
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
                        setSelectedBrand(isActive ? 'All' : b.name);
                      }}
                    >
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
                        {b.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* 5. Assigned User Filter */}
          {users.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text
                style={[
                  styles.sectionLabel,
                  { color: colors.textSecondary },
                ]}
              >
                ASSIGNED SALES EXECUTIVE
              </Text>
              <View style={styles.chipsRow}>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        selectedUser === null
                          ? colors.primary
                          : isDark
                          ? '#101726'
                          : '#F8FAFC',
                      borderColor:
                        selectedUser === null
                          ? colors.primaryDark
                          : isDark
                          ? '#1E293B'
                          : '#E2E8F0',
                    },
                  ]}
                  onPress={() => {
                    triggerHaptic('selection');
                    setSelectedUser(null);
                  }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color:
                          selectedUser === null
                            ? '#FFFFFF'
                            : colors.textPrimary,
                        fontWeight:
                          selectedUser === null ? '700' : '500',
                      },
                    ]}
                  >
                    All Team
                  </Text>
                </TouchableOpacity>
                {users.slice(0, 6).map((u) => {
                  const isActive = selectedUser === u.id;
                  return (
                    <TouchableOpacity
                      key={u.id}
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
                        setSelectedUser(isActive ? null : u.id);
                      }}
                    >
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
                        {u.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Modal Footer Actions */}
        <View
          style={[
            styles.footerRow,
            {
              borderTopColor: isDark ? '#1E293B' : '#F1F5F9',
              backgroundColor: isDark ? '#0D1322' : '#FFFFFF',
              paddingBottom: Math.max(insets.bottom, 24) + 10,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.resetFooterBtn,
              {
                borderColor: isDark ? '#1E293B' : '#E2E8F0',
                backgroundColor: isDark ? '#131B2E' : '#F8FAFC',
              },
            ]}
            onPress={() => {
              triggerHaptic('impactLight');
              onReset();
            }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.resetFooterText,
                { color: colors.textSecondary },
              ]}
            >
              Reset
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.applyFooterBtn,
              { backgroundColor: colors.primary },
            ]}
            onPress={() => {
              triggerHaptic('impactMedium');
              onApply();
              onClose();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.applyFooterText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
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
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    height: '84%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  grabHandleRow: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  grabHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
  },
  modalContent: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  activeCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  activeCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  sectionBlock: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  stageChip: {
    justifyContent: 'space-between',
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipText: {
    fontSize: 13,
  },
  countPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    marginLeft: 4,
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
  },
  horizontalPills: {
    gap: 8,
    paddingVertical: 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  resetFooterBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetFooterText: {
    fontSize: 14,
    fontWeight: '700',
  },
  applyFooterBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyFooterText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
