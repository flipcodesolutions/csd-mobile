import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../colors';
import { salesExecutiveApi } from '../lib/apiServices';

interface Props {
  onSelectLead: (leadId: number) => void;
}

const STATUS_FILTERS = [
  'All',
  'In Follow-Up',
  'New',
  'Test Drive Scheduled',
  'Quotation Sent',
  'Negotiation',
  'Deal Won',
  'Deal Lost',
];

export const SalesExecutiveLeadsScreen: React.FC<Props> = ({ onSelectLead }) => {
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchLeads = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMessage('');

    try {
      const params: any = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (selectedStatus !== 'All') params.status = selectedStatus;

      const res = await salesExecutiveApi.getAssignedLeads(params);
      if (res && res.status) {
        setLeads(res.data || []);
      } else {
        setErrorMessage(res?.message || 'Unable to load leads.');
      }
    } catch (error: any) {
      console.log('Error fetching assigned leads:', error);
      setErrorMessage(error?.response?.data?.message || 'Failed to connect to server.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchTerm, selectedStatus]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleCall = (phone: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch((err) => {
      console.log('Error launching dialer:', err);
    });
  };

  const getPriorityBadgeStyle = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'hot':
        return { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444', border: '#ef4444' };
      case 'warm':
        return { bg: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b', border: '#f59e0b' };
      case 'cold':
        return { bg: 'rgba(56, 189, 248, 0.2)', text: '#38bdf8', border: '#38bdf8' };
      default:
        return { bg: 'rgba(148, 163, 184, 0.2)', text: '#94a3b8', border: '#94a3b8' };
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'deal won':
      case 'converted':
        return { bg: 'rgba(34, 197, 94, 0.2)', text: '#22c55e' };
      case 'deal lost':
        return { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' };
      case 'in follow-up':
      case 'in follow up':
        return { bg: 'rgba(59, 130, 246, 0.2)', text: '#3b82f6' };
      case 'test drive scheduled':
        return { bg: 'rgba(168, 85, 247, 0.2)', text: '#a855f7' };
      default:
        return { bg: 'rgba(100, 116, 139, 0.2)', text: '#94a3b8' };
    }
  };

  const renderLeadCard = ({ item }: { item: any }) => {
    const priorityStyle = getPriorityBadgeStyle(item.priority);
    const statusStyle = getStatusBadgeStyle(item.status_name);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => onSelectLead(item.id)}
      >
        {/* Card Header: Customer Name & Priority Badge */}
        <View style={styles.cardHeader}>
          <View style={styles.customerNameBox}>
            <Text style={styles.customerName}>{item.name}</Text>
            {item.city && (
              <Text style={styles.cityText}>
                📍 {item.city}
                {item.state ? `, ${item.state}` : ''}
              </Text>
            )}
          </View>
          <View
            style={[
              styles.badge,
              { backgroundColor: priorityStyle.bg, borderColor: priorityStyle.border },
            ]}
          >
            <Text style={[styles.badgeText, { color: priorityStyle.text }]}>
              {item.priority || 'Standard'}
            </Text>
          </View>
        </View>

        {/* Vehicle Requirement */}
        <View style={styles.vehicleRow}>
          <Text style={styles.vehicleIcon}>🚗</Text>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleModel}>{item.model_variant || 'Model not specified'}</Text>
            <Text style={styles.vehicleSegment}>
              {item.vehicle_segment} {item.brand_name ? `• ${item.brand_name}` : ''}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusPillText, { color: statusStyle.text }]}>
              {item.status_name || 'New'}
            </Text>
          </View>
        </View>

        {/* Scheduled Next Follow-Up (if any) */}
        {item.latest_follow_up?.next_follow_up_date && (
          <View style={styles.nextFollowUpBanner}>
            <Text style={styles.nextFollowUpIcon}>⏰</Text>
            <Text style={styles.nextFollowUpText}>
              Next: <Text style={styles.boldText}>{item.latest_follow_up.next_follow_up_date}</Text>
              {item.latest_follow_up.next_follow_up_time
                ? ` (${item.latest_follow_up.next_follow_up_time})`
                : ''}
            </Text>
          </View>
        )}

        {/* Card Actions Footer */}
        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => handleCall(item.phone)}
          >
            <Text style={styles.callButtonIcon}>📞</Text>
            <Text style={styles.callButtonText}>Call {item.phone}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => onSelectLead(item.id)}
          >
            <Text style={styles.viewButtonText}>View & Follow-Up →</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search assigned leads by name, phone, model..."
          placeholderTextColor="#64748b"
          value={searchTerm}
          onChangeText={setSearchTerm}
          returnKeyType="search"
          onSubmitEditing={() => fetchLeads()}
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => setSearchTerm('')} style={styles.clearSearchBtn}>
            <Text style={styles.clearSearchText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Status Filter Chips (Horizontal Scroll) */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
        >
          {STATUS_FILTERS.map((st) => {
            const isSelected = selectedStatus === st;
            return (
              <TouchableOpacity
                key={st}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setSelectedStatus(st)}
              >
                <Text
                  style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}
                >
                  {st}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Error Alert */}
      {errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchLeads()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* 4. Leads FlatList */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading assigned leads...</Text>
        </View>
      ) : (
        <FlatList
          data={leads}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderLeadCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchLeads(true)}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📂</Text>
              <Text style={styles.emptyTitle}>No Leads Assigned</Text>
              <Text style={styles.emptySubtitle}>
                {searchTerm || selectedStatus !== 'All'
                  ? 'No leads found matching current search/filter.'
                  : 'You do not have any customer leads assigned to you right now.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: colors.textPrimary,
    fontSize: 14,
  },
  clearSearchBtn: {
    padding: 6,
  },
  clearSearchText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  filterWrapper: {
    marginBottom: 8,
  },
  filterList: {
    paddingHorizontal: 14,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryHover,
  },
  filterChipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 14,
    paddingTop: 4,
    gap: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  customerNameBox: {
    flex: 1,
    marginRight: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cityText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  vehicleIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleModel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  vehicleSegment: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  nextFollowUpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.orange,
    borderWidth: 1,
    borderColor: 'rgba(238, 104, 0, 0.2)',
  },
  nextFollowUpIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  nextFollowUpText: {
    fontSize: 12,
    color: colors.orange,
  },
  boldText: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 128, 0.08)',
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  callButtonIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  callButtonText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  viewButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primaryHover,
    paddingVertical: 9,
    borderRadius: 8,
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  loadingText: {
    color: colors.textMuted,
    marginTop: 12,
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
    marginHorizontal: 14,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.danger,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    flex: 1,
  },
  retryBtn: {
    backgroundColor: colors.danger,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});
