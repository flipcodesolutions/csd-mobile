import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Check,
  FileAudio,
  Flag,
  Mic,
  PhoneOutgoing,
  Trash2,
  X,
} from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { formatBytes } from '../callRecordingService';
import { AuditFollowUpItem, CallRecordingItem } from '../types';
import { CallRecordingAudioPlayer } from './CallRecordingAudioPlayer';
import { ReviewStatusBadge } from './CallRecordingBadges';

interface CallRecordingDetailModalProps {
  visible: boolean;
  mode: 'staff' | 'audit';
  title: string;
  subtitle: string;
  loading: boolean;
  followUps: AuditFollowUpItem[];
  recordings: CallRecordingItem[];
  onClose: () => void;
  onVerify?: (recording: CallRecordingItem) => void;
  onFlag?: (recording: CallRecordingItem) => void;
  onDelete?: (recording: CallRecordingItem) => void;
}

export const CallRecordingDetailModal: React.FC<CallRecordingDetailModalProps> = ({
  visible,
  mode,
  title,
  subtitle,
  loading,
  followUps,
  recordings,
  onClose,
  onVerify,
  onFlag,
  onDelete,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'recordings' | 'followups'>('recordings');

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
            styles.sheet,
            {
              backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
              paddingBottom: Math.max(insets.bottom, 14),
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
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
                {title}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                {subtitle}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeBtn,
                { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
              ]}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Segmented Switch */}
          <View
            style={[
              styles.segmentBar,
              {
                backgroundColor: isDark ? '#0B111A' : '#F1F5F9',
                borderColor: isDark ? '#1E293B' : '#E2E8F0',
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('selection');
                setActiveTab('recordings');
              }}
              style={[
                styles.segmentBtn,
                activeTab === 'recordings' && {
                  backgroundColor: colors.primary,
                },
              ]}
            >
              <Mic
                size={14}
                color={
                  activeTab === 'recordings'
                    ? isDark
                      ? '#0B111A'
                      : '#FFFFFF'
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.segmentText,
                  {
                    color:
                      activeTab === 'recordings'
                        ? isDark
                          ? '#0B111A'
                          : '#FFFFFF'
                        : colors.textSecondary,
                  },
                ]}
              >
                Recordings ({recordings.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                triggerHaptic('selection');
                setActiveTab('followups');
              }}
              style={[
                styles.segmentBtn,
                activeTab === 'followups' && {
                  backgroundColor: colors.primary,
                },
              ]}
            >
              <PhoneOutgoing
                size={14}
                color={
                  activeTab === 'followups'
                    ? isDark
                      ? '#0B111A'
                      : '#FFFFFF'
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.segmentText,
                  {
                    color:
                      activeTab === 'followups'
                        ? isDark
                          ? '#0B111A'
                          : '#FFFFFF'
                        : colors.textSecondary,
                  },
                ]}
              >
                Follow-Ups ({followUps.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Body */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading follow-ups and recordings...
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollBody}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {activeTab === 'recordings' ? (
                recordings.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <FileAudio size={34} color={colors.textMuted} />
                    <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
                      No recordings uploaded in this period.
                    </Text>
                  </View>
                ) : (
                  recordings.map((rec) => (
                    <View
                      key={rec.id}
                      style={[
                        styles.itemCard,
                        {
                          backgroundColor: isDark ? '#0D131F' : '#F8FAFC',
                          borderColor: isDark ? '#1E293B' : '#E2E8F0',
                        },
                      ]}
                    >
                      <View style={styles.itemTopRow}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text
                            style={[styles.itemTitle, { color: colors.textPrimary }]}
                            numberOfLines={2}
                          >
                            {rec.original_name}
                          </Text>
                          <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
                            {rec.recording_date ? `${rec.recording_date} • ` : ''}
                            {formatBytes(rec.file_size)}
                            {rec.phone_number ? ` • ${rec.phone_number}` : ''}
                          </Text>
                        </View>
                        <ReviewStatusBadge
                          status={rec.review_status}
                          pendingLabel={mode === 'staff' ? 'Pending Review' : 'Pending'}
                        />
                      </View>

                      {rec.notes ? (
                        <Text style={[styles.itemNote, { color: colors.textSecondary }]}>
                          Note: {rec.notes}
                        </Text>
                      ) : null}

                      {rec.review_remark ? (
                        <Text style={[styles.itemRemark, { color: colors.danger }]}>
                          {mode === 'staff' ? 'Manager Remark: ' : 'Remark: '}
                          {rec.review_remark}
                        </Text>
                      ) : null}

                      <View style={styles.playerWrap}>
                        <CallRecordingAudioPlayer
                          recordingId={rec.id}
                          fileName={rec.original_name}
                        />
                      </View>

                      {mode === 'audit' ? (
                        <View style={styles.actionRow}>
                          <TouchableOpacity
                            onPress={() => {
                              triggerHaptic('selection');
                              onVerify?.(rec);
                            }}
                            disabled={rec.review_status === 'verified'}
                            style={[
                              styles.actionBtn,
                              {
                                borderColor: isDark
                                  ? 'rgba(16, 185, 129, 0.4)'
                                  : '#A7F3D0',
                                backgroundColor: isDark
                                  ? 'rgba(16, 185, 129, 0.14)'
                                  : '#ECFDF5',
                                opacity: rec.review_status === 'verified' ? 0.45 : 1,
                              },
                            ]}
                          >
                            <Check size={14} color={isDark ? '#34D399' : '#059669'} />
                            <Text
                              style={[
                                styles.actionBtnText,
                                { color: isDark ? '#34D399' : '#059669' },
                              ]}
                            >
                              Verify
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => {
                              triggerHaptic('selection');
                              onFlag?.(rec);
                            }}
                            style={[
                              styles.actionBtn,
                              {
                                borderColor: isDark
                                  ? 'rgba(239, 68, 68, 0.4)'
                                  : '#FECACA',
                                backgroundColor: isDark
                                  ? 'rgba(239, 68, 68, 0.14)'
                                  : '#FEF2F2',
                              },
                            ]}
                          >
                            <Flag size={14} color={isDark ? '#F87171' : '#DC2626'} />
                            <Text
                              style={[
                                styles.actionBtnText,
                                { color: isDark ? '#F87171' : '#DC2626' },
                              ]}
                            >
                              Flag
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ) : rec.review_status !== 'verified' ? (
                        <View style={styles.actionRow}>
                          <TouchableOpacity
                            onPress={() => {
                              triggerHaptic('notificationWarning');
                              onDelete?.(rec);
                            }}
                            style={[
                              styles.actionBtn,
                              {
                                borderColor: isDark
                                  ? 'rgba(239, 68, 68, 0.4)'
                                  : '#FECACA',
                                backgroundColor: isDark
                                  ? 'rgba(239, 68, 68, 0.14)'
                                  : '#FEF2F2',
                              },
                            ]}
                          >
                            <Trash2 size={14} color={isDark ? '#F87171' : '#DC2626'} />
                            <Text
                              style={[
                                styles.actionBtnText,
                                { color: isDark ? '#F87171' : '#DC2626' },
                              ]}
                            >
                              Delete
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ) : null}
                    </View>
                  ))
                )
              ) : followUps.length === 0 ? (
                <View style={styles.emptyBox}>
                  <PhoneOutgoing size={34} color={colors.textMuted} />
                  <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
                    No follow-ups logged in this period.
                  </Text>
                </View>
              ) : (
                followUps.map((fu) => (
                  <View
                    key={fu.id}
                    style={[
                      styles.itemCard,
                      {
                        backgroundColor: isDark ? '#0D131F' : '#F8FAFC',
                        borderColor: isDark ? '#1E293B' : '#E2E8F0',
                      },
                    ]}
                  >
                    <View style={styles.itemTopRow}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>
                          {fu.lead?.name || 'Unknown Lead'}
                        </Text>
                        <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
                          {fu.lead?.phone || '-'} • {fu.type || 'Call'}
                          {fu.follow_up_date ? ` • ${fu.follow_up_date}` : ''}
                          {fu.follow_up_time ? ` • ${fu.follow_up_time}` : ''}
                        </Text>
                      </View>
                      {fu.status ? (
                        <View
                          style={[
                            styles.statusChip,
                            {
                              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                              borderColor: isDark ? '#334155' : '#CBD5E1',
                            },
                          ]}
                        >
                          <Text
                            style={[styles.statusChipText, { color: colors.textPrimary }]}
                          >
                            {fu.status}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {fu.notes ? (
                      <Text style={[styles.itemNote, { color: colors.textSecondary }]}>
                        {fu.notes}
                      </Text>
                    ) : null}
                  </View>
                ))
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '88%',
    minHeight: '55%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
  },
  loadingBox: {
    paddingVertical: 50,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 10,
  },
  emptyBox: {
    paddingVertical: 42,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  itemCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  itemMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  itemNote: {
    fontSize: 12,
  },
  itemRemark: {
    fontSize: 12,
    fontWeight: '600',
  },
  playerWrap: {
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
});

