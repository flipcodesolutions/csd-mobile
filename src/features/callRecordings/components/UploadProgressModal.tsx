import React from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AlertTriangle,
  CheckCircle2,
  X,
  XCircle,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../core/theme/ThemeContext';
import { formatBytes } from '../callRecordingService';
import { MAX_FILE_SIZE_MB, UploadQueueItem } from '../types';

export interface UploadModalState {
  open: boolean;
  isComplete: boolean;
  totalEligible: number;
  completedEligible: number;
  uploadedCount: number;
  failedCount: number;
  currentFileName: string;
  items: UploadQueueItem[];
  oversizedFiles: { name: string; size: number }[];
  failedFiles: { name: string; message: string }[];
}

interface UploadProgressModalProps {
  state: UploadModalState;
  onClose: () => void;
}

export const UploadProgressModal: React.FC<UploadProgressModalProps> = ({
  state,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  if (!state.open) return null;

  const progressPct =
    state.totalEligible > 0
      ? Math.round((state.completedEligible / state.totalEligible) * 100)
      : 100;

  const hasIssues =
    state.oversizedFiles.length > 0 || state.failedCount > 0;

  return (
    <Modal
      visible={state.open}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (state.isComplete) onClose();
      }}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
              paddingBottom: Math.max(insets.bottom, 16),
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
              {!state.isComplete ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : hasIssues ? (
                <AlertTriangle size={20} color={colors.warning} />
              ) : (
                <CheckCircle2 size={20} color={colors.success} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  {state.isComplete
                    ? 'Upload Summary'
                    : `Uploading Recordings (${state.completedEligible} / ${state.totalEligible})`}
                </Text>
                <Text
                  style={[styles.subtitle, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {state.isComplete
                    ? 'All eligible files processed (1 file at a time).'
                    : `Uploading 1 by 1 — ${state.currentFileName || '...'}`}
                </Text>
              </View>
            </View>

            {state.isComplete ? (
              <TouchableOpacity
                onPress={onClose}
                style={[
                  styles.closeBtn,
                  { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                ]}
              >
                <X size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>

          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Progress Bar */}
            {state.totalEligible > 0 ? (
              <View style={styles.progressSection}>
                <View style={styles.progressTop}>
                  <Text
                    style={[styles.progressLabel, { color: colors.textPrimary }]}
                  >
                    Progress: {state.completedEligible} of {state.totalEligible}{' '}
                    recording(s)
                  </Text>
                  <Text
                    style={[styles.progressPct, { color: colors.primary }]}
                  >
                    {progressPct}%
                  </Text>
                </View>
                <View
                  style={[
                    styles.progressTrack,
                    { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${progressPct}%`,
                        backgroundColor: state.isComplete
                          ? colors.success
                          : colors.primary,
                      },
                    ]}
                  />
                </View>
              </View>
            ) : null}

            {/* Summary Badges */}
            <View style={styles.badgesRow}>
              <View
                style={[
                  styles.summaryBadge,
                  {
                    backgroundColor: isDark
                      ? 'rgba(16, 185, 129, 0.16)'
                      : '#ECFDF5',
                    borderColor: isDark
                      ? 'rgba(16, 185, 129, 0.35)'
                      : '#A7F3D0',
                  },
                ]}
              >
                <CheckCircle2 size={13} color={colors.success} />
                <Text
                  style={[styles.summaryBadgeText, { color: colors.success }]}
                >
                  Uploaded: {state.uploadedCount}
                </Text>
              </View>

              {state.oversizedFiles.length > 0 ? (
                <View
                  style={[
                    styles.summaryBadge,
                    {
                      backgroundColor: isDark
                        ? 'rgba(245, 158, 11, 0.16)'
                        : '#FFFBEB',
                      borderColor: isDark
                        ? 'rgba(245, 158, 11, 0.35)'
                        : '#FDE68A',
                    },
                  ]}
                >
                  <AlertTriangle size={13} color={colors.warning} />
                  <Text
                    style={[styles.summaryBadgeText, { color: colors.warning }]}
                  >
                    Skipped (&gt; {MAX_FILE_SIZE_MB} MB):{' '}
                    {state.oversizedFiles.length}
                  </Text>
                </View>
              ) : null}

              {state.failedCount > 0 ? (
                <View
                  style={[
                    styles.summaryBadge,
                    {
                      backgroundColor: isDark
                        ? 'rgba(239, 68, 68, 0.16)'
                        : '#FEF2F2',
                      borderColor: isDark
                        ? 'rgba(239, 68, 68, 0.35)'
                        : '#FECACA',
                    },
                  ]}
                >
                  <XCircle size={13} color={colors.danger} />
                  <Text
                    style={[styles.summaryBadgeText, { color: colors.danger }]}
                  >
                    Failed: {state.failedCount}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Oversized Files Alert */}
            {state.isComplete && state.oversizedFiles.length > 0 ? (
              <View
                style={[
                  styles.alertBox,
                  {
                    backgroundColor: isDark
                      ? 'rgba(245, 158, 11, 0.12)'
                      : '#FFFBEB',
                    borderColor: isDark
                      ? 'rgba(245, 158, 11, 0.4)'
                      : '#FCD34D',
                  },
                ]}
              >
                <Text style={[styles.alertTitle, { color: colors.warning }]}>
                  {state.oversizedFiles.length} file(s) exceed{' '}
                  {MAX_FILE_SIZE_MB} MB limit (skipped):
                </Text>
                <Text
                  style={[styles.alertBody, { color: colors.textSecondary }]}
                >
                  Files larger than {MAX_FILE_SIZE_MB} MB cannot be uploaded.
                  Please reduce file size and upload again.
                </Text>
                {state.oversizedFiles.map((f, idx) => (
                  <Text
                    key={`${f.name}_${idx}`}
                    style={[styles.alertListItem, { color: colors.textPrimary }]}
                  >
                    • {f.name} ({formatBytes(f.size)})
                  </Text>
                ))}
              </View>
            ) : null}

            {/* Failed Files Alert */}
            {state.isComplete && state.failedFiles.length > 0 ? (
              <View
                style={[
                  styles.alertBox,
                  {
                    backgroundColor: isDark
                      ? 'rgba(239, 68, 68, 0.12)'
                      : '#FEF2F2',
                    borderColor: isDark
                      ? 'rgba(239, 68, 68, 0.4)'
                      : '#FECACA',
                  },
                ]}
              >
                <Text style={[styles.alertTitle, { color: colors.danger }]}>
                  Upload errors ({state.failedFiles.length}):
                </Text>
                {state.failedFiles.map((f, idx) => (
                  <Text
                    key={`${f.name}_${idx}`}
                    style={[styles.alertListItem, { color: colors.textPrimary }]}
                  >
                    • {f.name}: {f.message}
                  </Text>
                ))}
              </View>
            ) : null}

            {/* Per-File Status List */}
            <View
              style={[
                styles.itemsList,
                { borderColor: isDark ? '#1E293B' : '#E2E8F0' },
              ]}
            >
              {state.items.map((item, idx) => (
                <View
                  key={item.key}
                  style={[
                    styles.itemRow,
                    idx < state.items.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                >
                  <Text
                    style={[styles.itemIdx, { color: colors.textMuted }]}
                  >
                    #{idx + 1}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.itemName, { color: colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text
                      style={[styles.itemSize, { color: colors.textMuted }]}
                    >
                      {formatBytes(item.size)}
                    </Text>
                  </View>

                  {item.status === 'uploaded' && (
                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor: isDark
                            ? 'rgba(16, 185, 129, 0.16)'
                            : '#ECFDF5',
                        },
                      ]}
                    >
                      <Text
                        style={[styles.statusText, { color: colors.success }]}
                      >
                        Uploaded
                      </Text>
                    </View>
                  )}
                  {item.status === 'uploading' && (
                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor: isDark
                            ? 'rgba(37, 99, 235, 0.18)'
                            : '#EFF6FF',
                        },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: '#2563EB' }]}>
                        Uploading...
                      </Text>
                    </View>
                  )}
                  {item.status === 'pending' && (
                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Waiting
                      </Text>
                    </View>
                  )}
                  {item.status === 'skipped_size' && (
                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor: isDark
                            ? 'rgba(245, 158, 11, 0.16)'
                            : '#FFFBEB',
                        },
                      ]}
                    >
                      <Text
                        style={[styles.statusText, { color: colors.warning }]}
                      >
                        &gt; {MAX_FILE_SIZE_MB} MB
                      </Text>
                    </View>
                  )}
                  {item.status === 'failed' && (
                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor: isDark
                            ? 'rgba(239, 68, 68, 0.16)'
                            : '#FEF2F2',
                        },
                      ]}
                    >
                      <Text
                        style={[styles.statusText, { color: colors.danger }]}
                      >
                        Failed
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Footer */}
          <View
            style={[
              styles.footer,
              { borderTopColor: isDark ? '#1E293B' : '#E2E8F0' },
            ]}
          >
            <TouchableOpacity
              disabled={!state.isComplete}
              onPress={onClose}
              style={[
                styles.closeFooterBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: state.isComplete ? 1 : 0.5,
                },
              ]}
            >
              <Text
                style={[
                  styles.closeFooterText,
                  { color: isDark ? '#0B111A' : '#FFFFFF' },
                ]}
              >
                {state.isComplete ? 'Close' : 'Uploading... Please wait'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    maxHeight: '86%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    flexGrow: 0,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  progressSection: {
    gap: 6,
  },
  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressPct: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  summaryBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  alertBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  alertTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  alertBody: {
    fontSize: 11,
    lineHeight: 16,
  },
  alertListItem: {
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 2,
  },
  itemsList: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 8,
  },
  itemIdx: {
    fontSize: 11,
    fontWeight: '700',
    minWidth: 24,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemSize: {
    fontSize: 10,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  closeFooterBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
  },
  closeFooterText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
