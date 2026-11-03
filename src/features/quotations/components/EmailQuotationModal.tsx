import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Mail, Send, X } from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { showSuccessToast, showErrorToast } from '../../../core/utils/toast';
import { quotationService } from '../quotationService';

interface EmailQuotationModalProps {
  visible: boolean;
  quotationId: number;
  initialEmail?: string;
  vehicleName?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EmailQuotationModal: React.FC<EmailQuotationModalProps> = ({
  visible,
  quotationId,
  initialEmail = '',
  vehicleName = 'Selected Vehicle',
  onClose,
  onSuccess,
}) => {
  const { colors, isDark } = useTheme();

  const [email, setEmail] = useState(initialEmail);
  const [subject, setSubject] = useState(
    `Official Vehicle Quotation – ${vehicleName} | Defence Autolink`
  );
  const [message, setMessage] = useState(
    `Dear Customer,\n\nPlease find attached the official vehicle quotation with CSD price breakdown for your reference.\n\nBest Regards,\nDefence Autolink Team`
  );
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!email.trim() || !email.includes('@')) {
      showErrorToast('Invalid Email', 'Please enter a valid recipient email address.');
      return;
    }

    try {
      setSending(true);
      await quotationService.sendEmail(quotationId, {
        recipient_email: email.trim(),
        custom_subject: subject.trim(),
        custom_message: message.trim(),
      });
      showSuccessToast('Email Sent', `Quotation PDF successfully emailed to ${email.trim()}`);
      onClose();
      onSuccess?.();
    } catch (err: any) {
      showErrorToast(
        'Sending Failed',
        err?.response?.data?.message || err.message || 'Could not send quotation email'
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Mail size={20} color="#1E3A8A" />
              </View>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                Email Quotation PDF
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={isDark ? '#94A3B8' : '#64748B'} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.formContent}>
            <Text style={[styles.inputLabel, { color: isDark ? '#CBD5E1' : '#334155' }]}>
              Recipient Email <Text style={styles.req}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                  color: isDark ? '#FFFFFF' : '#0F172A',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                },
              ]}
              value={email}
              onChangeText={setEmail}
              placeholder="customer@example.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={[styles.inputLabel, { color: isDark ? '#CBD5E1' : '#334155' }]}>
              Subject
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                  color: isDark ? '#FFFFFF' : '#0F172A',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                },
              ]}
              value={subject}
              onChangeText={setSubject}
              placeholder="Email subject..."
              placeholderTextColor="#94A3B8"
            />

            <Text style={[styles.inputLabel, { color: isDark ? '#CBD5E1' : '#334155' }]}>
              Personalized Note
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                  color: isDark ? '#FFFFFF' : '#0F172A',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                },
              ]}
              value={message}
              onChangeText={setMessage}
              placeholder="Message body..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Footer */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn]}
              onPress={onClose}
              disabled={sending}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.submitBtn]}
              onPress={handleSend}
              disabled={sending}
              activeOpacity={0.8}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Send size={16} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>Send Email</Text>
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
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    borderRadius: 14,
    padding: 18,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    backgroundColor: '#E0E7FF',
    padding: 8,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  formContent: {
    gap: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  req: {
    color: '#EF4444',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelBtn: {
    backgroundColor: '#E2E8F0',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  submitBtn: {
    backgroundColor: '#1E3A8A',
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

