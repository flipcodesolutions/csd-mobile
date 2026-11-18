import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Car,
  Check,
  Search,
  User,
  X,
} from 'lucide-react-native';
import { Deal } from '../../deals/types';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';

interface DealPickerModalProps {
  visible: boolean;
  deals: Deal[];
  selectedDealId?: number;
  onClose: () => void;
  onSelectDeal: (deal: Deal) => void;
}

export const DealPickerModal: React.FC<DealPickerModalProps> = ({
  visible,
  deals,
  selectedDealId,
  onClose,
  onSelectDeal,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const formatInr = (val?: number | string) => {
    const num = Number(val || 0);
    return '₹' + num.toLocaleString('en-IN');
  };

  const filteredDeals = deals.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = (d.customer_name || '').toLowerCase();
    const dealNo = (d.deal_number || '').toLowerCase();
    const phone = (d.customer_phone || '').toLowerCase();
    const vehicle = (d.model_variant || d.model_name || '').toLowerCase();
    return name.includes(q) || dealNo.includes(q) || phone.includes(q) || vehicle.includes(q);
  });

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View
          style={[
            styles.container,
            {
              backgroundColor: isDark ? '#101726' : '#FFFFFF',
              maxHeight: '85%',
              paddingBottom: keyboardVisible ? 12 : Math.max(insets.bottom, 16),
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
            <View style={styles.headerLeft}>
              <Car size={18} color="#2563EB" />
              <View>
                <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                  Select Vehicle Deal
                </Text>
                <Text style={styles.headerSub}>
                  Search & choose deal by customer name or deal number
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.searchSection}>
            <View
              style={[
                styles.searchBox,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                },
              ]}
            >
              <Search size={15} color="#64748B" />
              <TextInput
                style={[styles.searchInput, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
                value={search}
                onChangeText={setSearch}
                placeholder="Search name, phone, deal no, vehicle..."
                placeholderTextColor="#94A3B8"
                autoFocus={true}
              />
              {search ? (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <X size={14} color="#64748B" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Deals List */}
          <FlatList
            data={filteredDeals}
            keyExtractor={(item) => `deal-pick-${item.id}`}
            contentContainerStyle={[styles.listContent, keyboardVisible ? { paddingBottom: 40 } : undefined]}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isSelected = selectedDealId === item.id;
              const netAmount = Number(item.net_amount || item.total_amount || 0);
              const paidAmount = Number(item.paid_amount || item.total_paid || 0);
              const balanceDue = Number(
                item.balance_due !== undefined ? item.balance_due : Math.max(0, netAmount - paidAmount)
              );
              const isFullyPaid = balanceDue <= 0 || item.payment_status === 'fully_paid';

              return (
                <TouchableOpacity
                  style={[
                    styles.dealCard,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? '#1E3A8A'
                          : '#EFF6FF'
                        : isDark
                        ? '#1E293B'
                        : '#FFFFFF',
                      borderColor: isSelected
                        ? '#2563EB'
                        : isDark
                        ? '#334155'
                        : '#E2E8F0',
                    },
                  ]}
                  onPress={() => {
                    triggerHaptic('selection');
                    onSelectDeal(item);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardTopRow}>
                    <View style={styles.dealNoPill}>
                      <Text style={styles.dealNoText}>{item.deal_number || `DEAL-${item.id}`}</Text>
                    </View>
                    <View
                      style={[
                        styles.duePill,
                        isFullyPaid ? styles.fullyPaidPill : styles.pendingPill,
                      ]}
                    >
                      <Text
                        style={[
                          styles.duePillText,
                          isFullyPaid ? styles.fullyPaidText : styles.pendingText,
                        ]}
                      >
                        {isFullyPaid ? 'Fully Paid' : `Due: ${formatInr(balanceDue)}`}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[styles.customerName, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
                    numberOfLines={1}
                  >
                    {item.customer_name}
                  </Text>
                  <Text style={styles.vehicleSub} numberOfLines={1}>
                    {item.model_variant || item.model_name || 'Vehicle'} • {item.customer_phone || '-'}
                  </Text>

                  <View style={styles.cardBottomRow}>
                    <Text style={styles.finSnippet}>
                      Net: {formatInr(netAmount)} • Paid: {formatInr(paidAmount)}
                    </Text>
                    {isSelected && <Check size={16} color="#2563EB" strokeWidth={2.5} />}
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No matching deals found.</Text>
              </View>
            }
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: 'hidden',
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
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  searchSection: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 20,
    gap: 8,
  },
  dealCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dealNoPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dealNoText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  duePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fullyPaidPill: {
    backgroundColor: '#DCFCE7',
  },
  pendingPill: {
    backgroundColor: '#FEE2E2',
  },
  duePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  fullyPaidText: {
    color: '#15803D',
  },
  pendingText: {
    color: '#B91C1C',
  },
  customerName: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  vehicleSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  finSnippet: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
  },
});

