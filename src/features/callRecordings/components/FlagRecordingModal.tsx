import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Flag, X } from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { CallRecordingItem } from '../types';

interface FlagRecordingModalProps {
  visible: boolean;
  recording: CallRecordingItem | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (remark: string) => void;
}

export const FlagRecordingModal: React.FC<FlagRecordingModalProps> = ({
  visible,
  recording,
  submitting,
  onClose,
  onSubmit,
}) => {
  const { colors, isDark } = useTheme();
  const [remark, setRemark] = useState('');

  useEffect(() => {
    if (visible) {
      setRemark(recording?.review_remark || '');
    }
  }, [visible, recording]);

  const canSubmit = remark.trim().length > 0 && !submitting;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.centered}
          pointerEvents="box-none"
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                borderColor: isDark ? '#1E293B' : '#E2E8F0',
              },
            ]}
          >
            <View
              style={[
                styles.header,
                { borderBottomColor: isDark ? '#1E293B' : '#E2E8F0' },
              ]}
            >
              <View style={styles.titleRow}>
                <Flag size={17} color={colors.danger} />
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  Flag Call Recording
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                disabled={submitting}
                style={[
                  styles.closeBtn,
                  { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                ]}
              >
                <X size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.fileLabel, { color: colors.textSecondary }]}>
              File:{' '}
              <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>
                {recording?.original_name || 'Recording'}
              </Text>
            </Text>

            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
              Reason / Remark *
            </Text>
            <TextInput
              value={remark}
              onChangeText={setRemark}
              placeholder="e.g., Audio is blank, wrong call, or incomplete conversation..."
              placeholderTextColor={colors.inputPlaceholder}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                  color: colors.textPrimary,
                },
              ]}
            />

            <View style={styles.footer}>
              <TouchableOpacity
                onPress={onClose}
                disabled={submitting}
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
                onPress={() => canSubmit && onSubmit(remark.trim())}
                disabled={!canSubmit}
                style={[
                  styles.submitBtn,
                  {
                    backgroundColor: colors.danger,
                    opacity: canSubmit ? 1 : 0.5,
                  },
                ]}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitText}>Flag Recording</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  centered: {
    width: '100%',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileLabel: {
    fontSize: 12,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    minHeight: 90,
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '700',
  },
  submitBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 125,
    alignItems: 'center',
  },
  submitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

