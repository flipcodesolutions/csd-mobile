import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Calendar,
  Check,
  ChevronDown,
  Edit3,
  X,
} from 'lucide-react-native';
import { Deal, UpdateDealPayload } from '../types';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import { showErrorToast, showSuccessToast } from '../../../core/utils/toast';
import { dealService } from '../dealService';
import { DatePickerModal } from '../../leads/components/DatePickerModal';

interface UpdateDealStageModalProps {
  visible: boolean;
  deal: Deal | null;
  onClose: () => void;
  onSuccess: () => void;
}

// Exactly 5 Delivery Stages matching Screenshot 1 (media_1794902338063_bc15f387.png)
export const DELIVERY_STAGES = [
  'Booking Confirmed',
  'In Transit',
  'Ready for Delivery',
  'Delivered',
  'Cancelled',
];

export const UpdateDealStageModal: React.FC<UpdateDealStageModalProps> = ({
  visible,
  deal,
  onClose,
  onSuccess,
}) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [stage, setStage] = useState('Booking Confirmed');
  const [color, setColor] = useState('Standard');
  const [vinChassis, setVinChassis] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [engineNumber, setEngineNumber] = useState('');
  const [registrationNo, setRegistrationNo] = useState('');
  const [notes, setNotes] = useState('');

  const [showStagePicker, setShowStagePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (deal) {
      // Map existing stage
      const existingStage = deal.delivery_stage || deal.deal_status || 'Booking Confirmed';
      const matched = DELIVERY_STAGES.find(
        (s) =>
          s.toLowerCase().replace(/\s/g, '_') === existingStage.toLowerCase() ||
          s.toLowerCase() === existingStage.toLowerCase()
      );
      setStage(matched || 'Booking Confirmed');
      setColor(deal.color || 'Standard');
      setVinChassis(deal.vin_chassis_number || deal.vin || '');
      setExpectedDate(deal.expected_delivery_date || '');
      setEngineNumber(deal.engine_number || '');
      setRegistrationNo(deal.registration_number || deal.rto_no || '');
      setNotes(deal.notes || '');
    }
  }, [deal]);

  const handleSave = async () => {
    if (!deal) return;
    triggerHaptic();
    setSubmitting(true);

    try {
      const payload: UpdateDealPayload = {
        deal_status: stage.toLowerCase().replace(/\s/g, '_'),
        color: color.trim() || 'Standard',
        vin_chassis_number: vinChassis.trim() || undefined,
        engine_number: engineNumber.trim() || undefined,
        registration_number: registrationNo.trim() || undefined,
        expected_delivery_date: expectedDate || undefined,
        notes: notes.trim() || undefined,
      };

      await dealService.update(deal.id, payload);
      showSuccessToast('Deal Updated', `Deal ${deal.deal_number || deal.id} stage updated.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      showErrorToast(
        'Update Failed',
        err?.response?.data?.message || err?.message || 'Could not update deal stage.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!deal) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              maxHeight: '90%',
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: isDark ? '#334155' : '#E2E8F0' }]}>
            <View style={styles.headerLeft}>
              <Edit3 size={18} color="#D97706" />
              <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                Update Deal & Delivery Stage
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Deal Reference Card */}
            <View
              style={[
                styles.refCard,
                {
                  backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                },
              ]}
            >
              <Text style={styles.refLabel}>DEAL REFERENCE</Text>
              <Text style={[styles.refDealNo, { color: isDark ? '#60A5FA' : '#1D4ED8' }]}>
                {deal.deal_number || `DEAL-${deal.id}`}
              </Text>
              <Text style={[styles.refSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                {deal.customer_name} ({deal.model_variant || deal.model_name || 'Vehicle'})
              </Text>
            </View>

            {/* Delivery Stage & Color */}
            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={[styles.fieldLabel, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                  Delivery Stage <Text style={styles.req}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[
                    styles.selector,
                    {
                      backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                      borderColor: isDark ? '#334155' : '#CBD5E1',
                    },
                  ]}
                  onPress={() => setShowStagePicker(!showStagePicker)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.selectorText, { color: isDark ? '#FFF' : '#0F172A' }]}>
                    {stage}
                  </Text>
                  <ChevronDown size={16} color="#64748B" />
                </TouchableOpacity>

                {showStagePicker && (
                  <View
                    style={[
                      styles.dropdownMenu,
                      {
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                        borderColor: isDark ? '#334155' : '#CBD5E1',
                      },
                    ]}
                  >
                    {DELIVERY_STAGES.map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[
                          styles.dropdownItem,
                          stage === s && { backgroundColor: isDark ? '#334155' : '#EFF6FF' },
                        ]}
                        onPress={() => {
                          setStage(s);
                          setShowStagePicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            { color: isDark ? '#FFFFFF' : '#0F172A' },
                            stage === s && { color: '#2563EB', fontWeight: '800' },
                          ]}
                        >
                          {stage === s ? `✓ ${s}` : s}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.gridCol}>
                <Text style={[styles.fieldLabel, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                  Vehicle Color
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
                  value={color}
                  onChangeText={setColor}
                  placeholder="e.g. Standard"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* VIN / Chassis Number & Expected Delivery Date */}
            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={[styles.fieldLabel, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                  VIN / Chassis Number
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
                  value={vinChassis}
                  onChangeText={setVinChassis}
                  placeholder="e.g. MALBA81CLNM123456"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.gridCol}>
                <Text style={[styles.fieldLabel, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                  Expected Delivery Date
                </Text>
                <TouchableOpacity
                  style={[
                    styles.selector,
                    {
                      backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                      borderColor: isDark ? '#334155' : '#CBD5E1',
                    },
                  ]}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.selectorText,
                      { color: expectedDate ? (isDark ? '#FFF' : '#0F172A') : '#94A3B8' },
                    ]}
                  >
                    {expectedDate || 'Select Date'}
                  </Text>
                  <Calendar size={15} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Engine Number & Registration Number */}
            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={[styles.fieldLabel, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                  Engine Number
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
                  value={engineNumber}
                  onChangeText={setEngineNumber}
                  placeholder="e.g. K15C123456"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.gridCol}>
                <Text style={[styles.fieldLabel, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                  Registration / RTO No.
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
                  value={registrationNo}
                  onChangeText={setRegistrationNo}
                  placeholder="e.g. GJ-01-AB-1234"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {/* Deal Notes / Remarks */}
            <View style={styles.formGroup}>
              <Text style={[styles.fieldLabel, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                Deal Notes / Remarks
              </Text>
              <TextInput
                style={[
                  styles.textarea,
                  {
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                  },
                ]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Enter stage update comments, allocation remarks..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={[styles.footerActions, { borderTopColor: isDark ? '#334155' : '#E2E8F0' }]}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, submitting && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Date Picker Modal - Strictly current & future dates as per user requirement */}
      <DatePickerModal
        visible={showDatePicker}
        title="Select Expected Delivery Date"
        initialDate={expectedDate}
        allowFuture={true}
        allowPast={false}
        onClose={() => setShowDatePicker(false)}
        onSelectDate={(d) => {
          setExpectedDate(d);
          setShowDatePicker(false);
        }}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  container: {
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
  },
  refCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  refLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  refDealNo: {
    fontSize: 15,
    fontWeight: '900',
  },
  refSub: {
    fontSize: 12,
    marginTop: 2,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  gridCol: {
    flex: 1,
    position: 'relative',
  },
  formGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  req: {
    color: '#EF4444',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  selector: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 58,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    zIndex: 999,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  dropdownItemText: {
    fontSize: 12,
    fontWeight: '600',
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    minHeight: 70,
  },
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#58632A',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
