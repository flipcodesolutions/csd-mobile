import React from 'react';
import {
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../core/theme/ThemeContext';
import { CustomerLead } from '../types';

interface Prospect360ModalProps {
  visible: boolean;
  lead: CustomerLead | null;
  onClose: () => void;
  onCall: (phone: string) => void;
  onConvertToDeal: (lead: CustomerLead) => void;
}

export const Prospect360Modal: React.FC<Prospect360ModalProps> = ({
  visible,
  lead,
  onClose,
  onCall,
  onConvertToDeal,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  if (!visible || !lead) return null;

  const initials = lead.name
    ? lead.name
        .trim()
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'LD';

  const brandName = lead.brand_name || 'MARUTI SUZUKI';
  const modelVariant =
    lead.model_variant ||
    `${lead.model_name || 'Brezza'} ${lead.variant_name || 'ZXi'}`.trim();
  const segmentShort =
    lead.vehicle_segment === '2 Wheeler' ||
    (lead as any).vehicle_segment_display === '2W'
      ? '2W'
      : '4W';
  const cityState = [lead.city, lead.state].filter(Boolean).join(', ') || 'Delhi, CSD';
  const assignedRep = lead.assigned_user_name || 'Admin User (Super Admin)';
  const budgetText =
    typeof lead.budget === 'number'
      ? `₹${lead.budget.toLocaleString('en-IN')}`
      : lead.budget || 'CSD Entitlement';
  const timelineText = lead.purchase_timeline || 'Immediate (< 7 Days)';

  const isDealWon =
    lead.is_converted ||
    lead.status_name === 'Deal Won' ||
    lead.status_name === 'Booked' ||
    lead.status_name === 'Delivered';

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

          {/* Navigation Header */}
          <View
            style={[
              styles.sheetHeader,
              { borderBottomColor: isDark ? '#1E293B' : '#F1F5F9' },
            ]}
          >
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.logoBadge,
                  {
                    backgroundColor: isDark ? '#101726' : '#F8FAFC',
                    borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  },
                ]}
              >
                <Image
                  source={require('../../../../assets/logo.png')}
                  style={styles.logoImg}
                  resizeMode="contain"
                />
              </View>
              <View>
                <View style={styles.headerTitleRow}>
                  <View
                    style={[
                      styles.livePulseDot,
                      { backgroundColor: colors.emerald },
                    ]}
                  />
                  <Text style={[styles.leadTag, { color: colors.emerald }]}>
                    LIVE LEAD #{lead.id}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.sheetTitle,
                    { color: colors.textPrimary },
                  ]}
                >
                  Prospect 360° Profile
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.closeBtn,
                {
                  backgroundColor: isDark ? '#162030' : '#F1F5F9',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.closeIcon, { color: colors.textPrimary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Scrollable Dossier Content */}
          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.formContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero Profile Card */}
            <View
              style={[
                styles.heroCard,
                {
                  backgroundColor: isDark ? '#101726' : '#F8FAFC',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
            >
              <View style={styles.avatarWrapper}>
                <View
                  style={[
                    styles.avatarRing,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.avatarHeroText,
                      { color: isDark ? colors.primary : colors.primaryDark },
                    ]}
                  >
                    {initials}
                  </Text>
                </View>
                <View
                  style={[
                    styles.csdHeroBadge,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={styles.csdHeroText}>CSD</Text>
                </View>
              </View>

              <Text
                style={[
                  styles.heroName,
                  { color: colors.textPrimary },
                ]}
              >
                {lead.name}
              </Text>
              <Text
                style={[
                  styles.heroSub,
                  { color: colors.textSecondary },
                ]}
              >
                ID #{lead.id} • {segmentShort} Priority Allocation
              </Text>

              {/* Status Indicator Pills */}
              <View style={styles.statusPillsRow}>
                <View
                  style={[
                    styles.hotPillHero,
                    {
                      backgroundColor: isDark
                        ? 'rgba(239, 68, 68, 0.15)'
                        : '#FFF1F2',
                      borderColor: isDark
                        ? 'rgba(239, 68, 68, 0.4)'
                        : '#FECDD3',
                    },
                  ]}
                >
                  <View style={styles.pulseDotRed} />
                  <Text
                    style={[
                      styles.hotTextHero,
                      { color: isDark ? '#F87171' : '#E11D48' },
                    ]}
                  >
                    {lead.priority.toUpperCase()} PRIORITY
                  </Text>
                </View>

                <View
                  style={[
                    styles.stagePillHero,
                    {
                      backgroundColor: isDealWon
                        ? isDark
                          ? 'rgba(16, 185, 129, 0.15)'
                          : '#ECFDF5'
                        : isDark
                        ? '#162030'
                        : '#F1F5F9',
                      borderColor: isDealWon
                        ? isDark
                          ? 'rgba(16, 185, 129, 0.35)'
                          : '#A7F3D0'
                        : isDark
                        ? '#1E293B'
                        : '#CBD5E1',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.stageTextHero,
                      {
                        color: isDealWon
                          ? isDark
                            ? '#10B981'
                            : '#059669'
                          : colors.textSecondary,
                      },
                    ]}
                  >
                    {lead.status_name || (isDealWon ? 'Deal Won' : 'Active Pipeline')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Contact & Location Card */}
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: isDark ? '#101726' : '#FFFFFF',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
            >
              <View
                style={[
                  styles.sectionHeader,
                  { borderBottomColor: isDark ? '#1E293B' : '#F1F5F9' },
                ]}
              >
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  CONTACT & LOCATION
                </Text>
                <View
                  style={[
                    styles.verifiedChip,
                    {
                      backgroundColor: isDark
                        ? 'rgba(16, 185, 129, 0.15)'
                        : '#ECFDF5',
                      borderColor: isDark
                        ? 'rgba(16, 185, 129, 0.3)'
                        : '#A7F3D0',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.verifiedChipText,
                      { color: isDark ? '#10B981' : '#059669' },
                    ]}
                  >
                    Verified
                  </Text>
                </View>
              </View>

              <View style={styles.cardItemRow}>
                <View style={styles.itemIconBox}>
                  <Text>📞</Text>
                </View>
                <View style={styles.itemTextBox}>
                  <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                    PRIMARY PHONE
                  </Text>
                  <Text style={[styles.itemMain, { color: colors.textPrimary }]}>
                    {lead.phone}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.quickActionBtn,
                    { backgroundColor: colors.orange },
                  ]}
                  onPress={() => onCall(lead.phone)}
                >
                  <Text style={styles.quickActionText}>Call</Text>
                </TouchableOpacity>
              </View>

              {lead.email ? (
                <View style={styles.cardItemRow}>
                  <View style={styles.itemIconBox}>
                    <Text>✉️</Text>
                  </View>
                  <View style={styles.itemTextBox}>
                    <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                      EMAIL ADDRESS
                    </Text>
                    <Text style={[styles.itemMain, { color: colors.textPrimary }]}>
                      {lead.email}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.quickActionBtn,
                      {
                        backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                        borderWidth: 1,
                        borderColor: isDark ? '#334155' : '#CBD5E1',
                      },
                    ]}
                    onPress={() => Linking.openURL(`mailto:${lead.email}`)}
                  >
                    <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>
                      Mail
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <View style={styles.cardItemRow}>
                <View style={styles.itemIconBox}>
                  <Text>📍</Text>
                </View>
                <View style={styles.itemTextBox}>
                  <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                    STATION & STATE
                  </Text>
                  <Text style={[styles.itemMain, { color: colors.textPrimary }]}>
                    {cityState}
                  </Text>
                </View>
              </View>
            </View>

            {/* Vehicle Specification Box */}
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: isDark ? '#101726' : '#FFFFFF',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
            >
              <View
                style={[
                  styles.sectionHeader,
                  { borderBottomColor: isDark ? '#1E293B' : '#F1F5F9' },
                ]}
              >
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  VEHICLE OF INTEREST
                </Text>
                <View
                  style={[
                    styles.segBadge360,
                    {
                      backgroundColor: isDark ? '#162030' : '#F1F5F9',
                      borderColor: isDark ? '#1E293B' : '#CBD5E1',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.segBadge360Text,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {segmentShort}
                  </Text>
                </View>
              </View>

              <View style={styles.vehRow}>
                <Text style={[styles.vehBrand, { color: colors.gold }]}>
                  {brandName.toUpperCase()} • CSD APPROVED
                </Text>
                <Text style={[styles.vehModel, { color: colors.textPrimary }]}>
                  {modelVariant}
                </Text>
              </View>
            </View>

            {/* Procurement & Entitlement Details */}
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: isDark ? '#101726' : '#FFFFFF',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
            >
              <View
                style={[
                  styles.sectionHeader,
                  { borderBottomColor: isDark ? '#1E293B' : '#F1F5F9' },
                ]}
              >
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  CSD ENTITLEMENT & BUDGET
                </Text>
              </View>

              <View style={styles.grid2x2}>
                <View style={styles.gridParam}>
                  <Text style={[styles.paramLabel, { color: colors.textSecondary }]}>
                    ENTITLEMENT BUDGET
                  </Text>
                  <Text style={[styles.paramValue, { color: colors.emerald }]}>
                    {budgetText}
                  </Text>
                </View>

                <View style={styles.gridParam}>
                  <Text style={[styles.paramLabel, { color: colors.textSecondary }]}>
                    BUYING TIMELINE
                  </Text>
                  <Text style={[styles.paramValue, { color: colors.textPrimary }]}>
                    {timelineText}
                  </Text>
                </View>

                <View style={styles.gridParam}>
                  <Text style={[styles.paramLabel, { color: colors.textSecondary }]}>
                    LEAD SOURCE
                  </Text>
                  <Text style={[styles.paramValue, { color: colors.textPrimary }]}>
                    {lead.source_name || 'Direct CSD Walk-in'}
                  </Text>
                </View>

                <View style={styles.gridParam}>
                  <Text style={[styles.paramLabel, { color: colors.textSecondary }]}>
                    ASSIGNED OFFICER
                  </Text>
                  <Text style={[styles.paramValue, { color: colors.textPrimary }]}>
                    {assignedRep}
                  </Text>
                </View>
              </View>

              {lead.notes ? (
                <View
                  style={[
                    styles.notesBox,
                    {
                      backgroundColor: isDark ? '#131B2E' : '#F8FAFC',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                >
                  <Text style={[styles.notesLabel, { color: colors.textSecondary }]}>
                    NOTES & COMMENTS:
                  </Text>
                  <Text style={[styles.notesContent, { color: colors.textPrimary }]}>
                    {lead.notes}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Follow-Ups Activity Log */}
            {lead.follow_ups && lead.follow_ups.length > 0 && (
              <View
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: isDark ? '#101726' : '#FFFFFF',
                    borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  },
                ]}
              >
                <View
                  style={[
                    styles.sectionHeader,
                    { borderBottomColor: isDark ? '#1E293B' : '#F1F5F9' },
                  ]}
                >
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    FOLLOW-UP HISTORY ({lead.follow_ups.length})
                  </Text>
                </View>

                <View style={styles.followUpsList}>
                  {lead.follow_ups.map((fu, idx) => (
                    <View
                      key={fu.id || idx}
                      style={[
                        styles.followUpItem,
                        {
                          borderBottomColor: isDark ? '#1E293B' : '#F1F5F9',
                          borderBottomWidth:
                            idx < (lead.follow_ups?.length || 0) - 1 ? 1 : 0,
                        },
                      ]}
                    >
                      <View style={styles.fuHeader}>
                        <Text style={[styles.fuDate, { color: colors.textSecondary }]}>
                          📅 {fu.follow_up_date}
                        </Text>
                        <Text
                          style={[
                            styles.fuStatus,
                            { color: isDark ? colors.primary : colors.primaryDark },
                          ]}
                        >
                          {fu.status}
                        </Text>
                      </View>
                      <Text style={[styles.fuNotes, { color: colors.textPrimary }]}>
                        {fu.notes}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Bottom Sticky Action Dock */}
          <View
            style={[
              styles.actionDock,
              {
                borderTopColor: isDark ? '#1E293B' : '#F1F5F9',
                backgroundColor: isDark ? '#131B2E' : '#FFFFFF',
                paddingBottom: Math.max(insets.bottom, 28) + 8,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.callDockBtn,
                { backgroundColor: colors.orange },
              ]}
              onPress={() => onCall(lead.phone)}
              activeOpacity={0.8}
            >
              <Text style={styles.dockBtnIcon}>📞</Text>
              <Text style={styles.dockBtnText}>Call Customer Now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.convertDockBtn,
                {
                  backgroundColor: colors.emerald,
                },
              ]}
              onPress={() => {
                onClose();
                onConvertToDeal(lead);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.dockBtnIcon}>🤝</Text>
              <Text style={styles.dockBtnText}>Convert to Deal</Text>
            </TouchableOpacity>
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    maxHeight: '94%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  grabHandleRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  grabHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  leadTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  formScroll: {
    maxHeight: 540,
  },
  formContent: {
    padding: 18,
    gap: 14,
  },
  heroCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 4,
  },
  avatarRing: {
    width: 68,
    height: 68,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHeroText: {
    fontSize: 22,
    fontWeight: '900',
  },
  csdHeroBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 9999,
  },
  csdHeroText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  heroName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  heroSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  statusPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  hotPillHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
    borderWidth: 1,
  },
  pulseDotRed: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  hotTextHero: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stagePillHero: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
    borderWidth: 1,
  },
  stageTextHero: {
    fontSize: 9,
    fontWeight: '800',
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  verifiedChip: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
  },
  verifiedChipText: {
    fontSize: 9,
    fontWeight: '700',
  },
  cardItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTextBox: {
    flex: 1,
  },
  itemSub: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  itemMain: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  quickActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  segBadge360: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  segBadge360Text: {
    fontSize: 10,
    fontWeight: '900',
  },
  vehRow: {
    gap: 2,
  },
  vehBrand: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  vehModel: {
    fontSize: 13,
    fontWeight: '800',
  },
  grid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridParam: {
    width: '48%',
    gap: 2,
  },
  paramLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  paramValue: {
    fontSize: 11,
    fontWeight: '700',
  },
  notesBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    gap: 4,
  },
  notesLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  notesContent: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
  },
  followUpsList: {
    gap: 8,
  },
  followUpItem: {
    paddingVertical: 6,
    gap: 4,
  },
  fuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fuDate: {
    fontSize: 10,
    fontWeight: '600',
  },
  fuStatus: {
    fontSize: 10,
    fontWeight: '800',
  },
  fuNotes: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionDock: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  callDockBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  convertDockBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  dockBtnIcon: {
    fontSize: 12,
  },
  dockBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});

export default Prospect360Modal;
