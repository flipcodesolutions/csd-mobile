import React from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AlertTriangle, Trash2, X } from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';

interface CleanupOldRecordingsModalProps {
  visible: boolean;
  loadingPreview: boolean;
  deleting: boolean;
  cutoffDate: string;
  count: number;
  onClose: () => void;
  onConfirm: () => void;
}

export const CleanupOldRecordingsModal: React.FC<CleanupOldRecordingsModalProps> = ({
  visible,
  loadingPreview,
  deleting,
  cutoffDate,
  count,
  onClose,
  onConfirm,
}) => {
  const { colors, isDark } = useTheme();

  if (!visible) return null;

  const canConfirm = !loadingPreview && !deleting && count > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!deleting) onClose();
      }}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => !deleting && onClose()}
        />

        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
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
              <AlertTriangle size={20} color={colors.warning} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  Delete Recordings Older Than 1 Month
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Permanent cleanup of old audio files & database records
                </Text>
              </View>
            </View>
            {!deleting ? (
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

          {/* Body */}
          {loadingPreview ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.danger} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Checking recordings older than 1 month...
              </Text>
            </View>
          ) : (
            <View style={styles.body}>
              <View
                style={[
                  styles.warningBanner,
                  {
                    backgroundColor: isDark
                      ? 'rgba(239, 68, 68, 0.14)'
                      : '#FEF2F2',
                    borderColor: isDark
                      ? 'rgba(239, 68, 68, 0.4)'
                      : '#FECACA',
                  },
                ]}
              >
                <Text style={[styles.cutoffText, { color: colors.danger }]}>
                  Cutoff Date: {cutoffDate || '-'}
                </Text>
                <Text
                  style={[styles.warningBody, { color: colors.textSecondary }]}
                >
                  All call recording records and audio files dated strictly before{' '}
                  <Text style={{ fontWeight: '800', color: colors.textPrimary }}>
                    {cutoffDate || '-'}
                  </Text>{' '}
                  will be permanently deleted. This action cannot be undone.
                </Text>
              </View>

              <View
                style={[
                  styles.countRow,
                  {
                    backgroundColor: isDark ? '#0D131F' : '#F8FAFC',
                    borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  },
                ]}
              >
                <Text
                  style={[styles.countLabel, { color: colors.textPrimary }]}
                >
                  Matching recordings before {cutoffDate || '-'}:
                </Text>
                <View
                  style={[
                    styles.countBadge,
                    {
                      backgroundColor:
                        count > 0
                          ? colors.danger
                          : isDark
                          ? '#334155'
                          : '#64748B',
                    },
                  ]}
                >
                  <Text style={styles.countBadgeText}>
                    {count} Recording{count === 1 ? '' : 's'}
                  </Text>
                </View>
              </View>

              {count === 0 ? (
                <Text
                  style={[styles.noneText, { color: colors.textSecondary }]}
                >
                  No call recordings found before {cutoffDate || '-'}.
                </Text>
              ) : null}
            </View>
          )}

          {/* Footer */}
          <View
            style={[
              styles.footer,
              { borderTopColor: isDark ? '#1E293B' : '#E2E8F0' },
            ]}
          >
            <TouchableOpacity
              onPress={onClose}
              disabled={deleting}
              style={[
                styles.cancelBtn,
                {
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                },
              ]}
            >
              <Text style={[styles.cancelText, { color: colors.textPrimary }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              disabled={!canConfirm}
              style={[
                styles.deleteBtn,
                {
                  backgroundColor: colors.danger,
                  opacity: canConfirm ? 1 : 0.45,
                },
              ]}
            >
              {deleting ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.deleteText}>Deleting...</Text>
                </>
              ) : (
                <>
                  <Trash2 size={14} color="#FFFFFF" />
                  <Text style={styles.deleteText}>
                    Delete {count} Recording{count === 1 ? '' : 's'}
                  </Text>
                </>
              )}
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
  loadingBox: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
  },
  body: {
    padding: 16,
    gap: 12,
  },
  warningBanner: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 5,
  },
  cutoffText: {
    fontSize: 13,
    fontWeight: '800',
  },
  warningBody: {
    fontSize: 12,
    lineHeight: 17,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  countLabel: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  noneText: {
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '700',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  deleteText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
