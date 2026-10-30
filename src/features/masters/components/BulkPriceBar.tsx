import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Check, X } from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';

interface BulkPriceBarProps {
  selectedCount: number;
  batchPrice: string;
  isSubmitting: boolean;
  onChangeBatchPrice: (val: string) => void;
  onSaveBulk: () => void;
  onDeselectAll: () => void;
}

export const BulkPriceBar: React.FC<BulkPriceBarProps> = ({
  selectedCount,
  batchPrice,
  isSubmitting,
  onChangeBatchPrice,
  onSaveBulk,
  onDeselectAll,
}) => {
  const { colors, isDark } = useTheme();

  if (selectedCount === 0) return null;

  return (
    <View
      style={[
        styles.floatingBar,
        {
          backgroundColor: isDark ? '#1E293B' : '#0F172A',
          borderColor: isDark ? '#334155' : '#1E293B',
        },
      ]}
    >
      {/* 1. Selected Count Pill */}
      <View style={styles.selectedBadge}>
        <Text style={styles.selectedCountText}>{selectedCount}</Text>
        <Text style={styles.selectedLabelText}>Selected</Text>
      </View>

      {/* 2. Batch Price Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.rupeeIcon}>₹</Text>
        <TextInput
          style={styles.batchInput}
          value={batchPrice}
          onChangeText={onChangeBatchPrice}
          placeholder="New batch rate..."
          placeholderTextColor="#94A3B8"
          keyboardType="numeric"
        />
      </View>

      {/* 3. Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            triggerHaptic('notificationSuccess');
            onSaveBulk();
          }}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Check size={14} color="#FFFFFF" strokeWidth={2.8} />
              <Text style={styles.saveBtnText}>Save</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => {
            triggerHaptic('selection');
            onDeselectAll();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={16} color="#94A3B8" strokeWidth={2.4} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingBar: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    gap: 10,
  },
  selectedBadge: {
    alignItems: 'center',
    paddingRight: 6,
    borderRightWidth: 1,
    borderRightColor: '#334155',
  },
  selectedCountText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '900',
  },
  selectedLabelText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    height: 38,
    borderRadius: 8,
    paddingHorizontal: 10,
    gap: 4,
  },
  rupeeIcon: {
    color: '#4ADE80',
    fontSize: 13,
    fontWeight: '800',
  },
  batchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    height: '100%',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  cancelBtn: {
    padding: 6,
  },
});
