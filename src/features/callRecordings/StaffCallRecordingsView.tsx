import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  FileAudio,
  Headphones,
  Mic,
  PhoneOutgoing,
  Plus,
  ShieldCheck,
  X,
} from 'lucide-react-native';
import { useTheme } from '../../core/theme/ThemeContext';
import { triggerHaptic } from '../../core/utils/haptics';
import {
  showErrorToast,
  showSuccessToast,
  showWarningToast,
} from '../../core/utils/toast';
import { DatePickerModal } from '../leads/components/DatePickerModal';
import {
  callRecordingMediaBridge,
  callRecordingService,
  formatBytes,
  getTodayDate,
  getYesterdayDate,
} from './callRecordingService';
import {
  ALLOWED_AUDIO_EXTENSIONS,
  AuditFollowUpItem,
  BatchUploadProgress,
  CallRecordingItem,
  CallRecordingsPagination,
  MAX_AUDIO_FILE_SIZE,
  SelectedAudioFile,
  StaffDailyRow,
  StaffSummaryStats,
} from './types';
import { ComplianceBadge } from './components/CallRecordingBadges';
import { CallRecordingDetailModal } from './components/CallRecordingDetailModal';

interface StaffCallRecordingsViewProps {
  currentUser: { id?: number; name?: string; role?: string } | null;
}

export const StaffCallRecordingsView: React.FC<StaffCallRecordingsViewProps> = ({
  currentUser,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [fromDate, setFromDate] = useState<string>(getTodayDate());
  const [toDate, setToDate] = useState<string>(getTodayDate());
  const [datePickerTarget, setDatePickerTarget] = useState<'from' | 'to' | null>(null);

  const [summary, setSummary] = useState<StaffSummaryStats>({
    total_follow_ups: 0,
    call_follow_ups: 0,
    recordings_uploaded: 0,
    pending_review: 0,
    verified_count: 0,
    flagged_count: 0,
    missing_count: 0,
  });
  const [dailyRows, setDailyRows] = useState<StaffDailyRow[]>([]);
  const [pagination, setPagination] = useState<CallRecordingsPagination>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Bulk upload state
  const [selectedFiles, setSelectedFiles] = useState<SelectedAudioFile[]>([]);
  const [batchNotes, setBatchNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<BatchUploadProgress>({
    completed: 0,
    total: 0,
    percent: 0,
  });

  // Day detail modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeDayDate, setActiveDayDate] = useState('');
  const [dayDetail, setDayDetail] = useState<{
    follow_ups: AuditFollowUpItem[];
    recordings: CallRecordingItem[];
  }>({
    follow_ups: [],
    recordings: [],
  });

  const loadData = useCallback(
    async (page = currentPage, pullRefresh = false) => {
      if (pullRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      try {
        const params: Record<string, any> = {
          page,
          per_page: 10,
        };
        if (fromDate) params.from_date = fromDate;
        if (toDate) params.to_date = toDate;

        const res = await callRecordingService.getSummary(params);
        if (res?.status) {
          if (res.summary) setSummary(res.summary);
          setDailyRows(Array.isArray(res.daily_rows) ? res.daily_rows : []);
          if (res.pagination) setPagination(res.pagination);
        }
      } catch (err: any) {
        showErrorToast(
          'Load Failed',
          err?.response?.data?.message || 'Failed to load call recordings.'
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [fromDate, toDate, currentPage]
  );

  useEffect(() => {
    loadData(currentPage);
  }, [loadData, currentPage]);

  const handlePickFiles = async () => {
    if (isUploading) return;
    triggerHaptic('impactLight');
    try {
      const incoming = await callRecordingMediaBridge.pickAudioFiles();
      if (!incoming || incoming.length === 0) return;

      const valid: SelectedAudioFile[] = [];
      const rejected: string[] = [];

      incoming.forEach((file) => {
        const ext = (file.name.split('.').pop() || '').toLowerCase();
        if (!ALLOWED_AUDIO_EXTENSIONS.includes(ext)) {
          rejected.push(`${file.name} (unsupported .${ext || 'file'})`);
          return;
        }
        if (file.size > MAX_AUDIO_FILE_SIZE) {
          rejected.push(`${file.name} (> 50MB)`);
          return;
        }
        valid.push(file);
      });

      if (rejected.length > 0) {
        showWarningToast(
          `Skipped ${rejected.length} file(s)`,
          rejected.slice(0, 2).join(', ')
        );
      }

      if (valid.length > 0) {
        setSelectedFiles((prev) => {
          const existingKeys = new Set(prev.map((f) => `${f.name}_${f.size}`));
          const deduped = valid.filter((f) => !existingKeys.has(`${f.name}_${f.size}`));
          return [...prev, ...deduped];
        });
      }
    } catch (err: any) {
      if (err?.code === 'CANCELLED') return;
      showErrorToast('Audio Picker', err?.message || 'Unable to select audio files.');
    }
  };

  const handleRemoveFile = (index: number) => {
    triggerHaptic('selection');
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleBulkUpload = async () => {
    if (selectedFiles.length === 0) {
      showWarningToast('No Files Selected', 'Please select one or more call recordings first.');
      return;
    }

    triggerHaptic('impactMedium');
    setIsUploading(true);
    setUploadProgress({ completed: 0, total: selectedFiles.length, percent: 0 });

    try {
      const todayDate = getTodayDate();
      const result = await callRecordingService.uploadBatch(
        selectedFiles,
        {
          recording_date: todayDate,
          notes: batchNotes.trim() || null,
        },
        (progress) => setUploadProgress(progress)
      );

      if (result.uploaded_count > 0) {
        if (result.partial) {
          showWarningToast(
            'Partial Upload',
            `${result.uploaded_count} recording(s) uploaded for ${todayDate}.`
          );
        } else {
          showSuccessToast(
            'Uploaded Successfully',
            `${result.uploaded_count} call recording(s) uploaded for ${todayDate}.`
          );
        }
      }

      if (result.errors.length > 0) {
        showErrorToast('Upload Error', result.errors[0].message);
      }

      if (!result.partial && result.errors.length === 0) {
        setSelectedFiles([]);
        setBatchNotes('');
      }

      setCurrentPage(1);
      await loadData(1);
    } catch (err: any) {
      showErrorToast('Upload Failed', err?.message || 'Bulk upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenDayDetail = async (row: StaffDailyRow) => {
    if (!currentUser?.id) {
      showErrorToast('Profile Missing', 'Unable to identify current staff user.');
      return;
    }
    triggerHaptic('selection');
    setActiveDayDate(row.date);
    setDetailModalOpen(true);
    setDetailLoading(true);
    setDayDetail({ follow_ups: [], recordings: [] });
    try {
      const res = await callRecordingService.getStaffDetail(currentUser.id, {
        date: row.date,
      });
      if (res?.status) {
        setDayDetail({
          follow_ups: Array.isArray(res.follow_ups) ? res.follow_ups : [],
          recordings: Array.isArray(res.recordings) ? res.recordings : [],
        });
      }
    } catch (err: any) {
      showErrorToast(
        'Load Failed',
        err?.response?.data?.message || 'Failed to load day details.'
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeleteRecording = (rec: CallRecordingItem) => {
    Alert.alert(
      'Delete Recording',
      `Are you sure you want to delete "${rec.original_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await callRecordingService.deleteRecording(rec.id);
              if (res?.status) {
                showSuccessToast('Deleted', 'Recording deleted successfully.');
                setDayDetail((prev) => ({
                  ...prev,
                  recordings: prev.recordings.filter((r) => r.id !== rec.id),
                }));
                loadData(currentPage);
              } else {
                showErrorToast('Delete Failed', res?.message || 'Failed to delete recording.');
              }
            } catch (err: any) {
              showErrorToast(
                'Delete Failed',
                err?.response?.data?.message || 'Unable to delete recording.'
              );
            }
          },
        },
      ]
    );
  };

  const totalSelectedSize = useMemo(
    () => selectedFiles.reduce((acc, f) => acc + (f.size || 0), 0),
    [selectedFiles]
  );

  const todayStr = getTodayDate();
  const yesterdayStr = getYesterdayDate();
  const isAllDates = !fromDate && !toDate;
  const isTodaySelected = fromDate === todayStr && toDate === todayStr;
  const isYesterdaySelected = fromDate === yesterdayStr && toDate === yesterdayStr;

  const dateRangeLabel = isAllDates
    ? 'All Dates'
    : fromDate === toDate
      ? fromDate
      : `${fromDate || '...'} to ${toDate || '...'}`;

  const cardSurface = isDark ? '#131B2E' : '#FFFFFF';
  const cardBorder = isDark ? '#1E293B' : '#E2E8F0';
  const missingAccent = summary.missing_count > 0 ? '#DC2626' : '#059669';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Math.max(insets.bottom + 24, 32) },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => loadData(currentPage, true)}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
          {/* Single-Line Horizontal KPI Deck (Matching LeadsScreen) */}
      <View style={styles.kpiDeckWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.kpiDeckScroll}
          >
        {/* Card 1: Call Follow-Ups */}
        <View
          style={[
            styles.kpiCard,
            {
              backgroundColor: isDark ? '#101726' : '#FFFFFF',
              borderColor: cardBorder,
              borderTopColor: '#2563EB',
            },
          ]}
        >
          <View style={styles.kpiTopRow}>
            <View
              style={[
                styles.kpiIconBox,
                { backgroundColor: isDark ? '#2563EB25' : '#2563EB15' },
              ]}
            >
              <PhoneOutgoing size={14} color="#2563EB" strokeWidth={2.4} />
            </View>
            <Text style={styles.kpiCardLabel}>FOLLOW-UPS</Text>
          </View>
          <Text style={[styles.kpiCountText, { color: colors.textPrimary }]}>
            {summary.call_follow_ups}
          </Text>
          <Text
            style={[styles.kpiSubText, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            Total Follow-ups: {summary.total_follow_ups}
          </Text>
        </View>

        {/* Card 2: Recordings Uploaded */}
        <View
          style={[
            styles.kpiCard,
            {
              backgroundColor: isDark ? '#101726' : '#FFFFFF',
              borderColor: cardBorder,
              borderTopColor: '#059669',
            },
          ]}
        >
          <View style={styles.kpiTopRow}>
            <View
              style={[
                styles.kpiIconBox,
                { backgroundColor: isDark ? '#05966925' : '#05966915' },
              ]}
            >
              <Mic size={14} color="#059669" strokeWidth={2.4} />
            </View>
            <Text style={styles.kpiCardLabel}>UPLOADED</Text>
          </View>
          <Text style={[styles.kpiCountText, { color: colors.textPrimary }]}>
            {summary.recordings_uploaded}
          </Text>
          <Text
            style={[styles.kpiSubText, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {dateRangeLabel}
          </Text>
        </View>

            {/* Card 3: Pending / Missing */}
          <View
            style={[
              styles.kpiCard,
              {
                backgroundColor: isDark ? '#101726' : '#FFFFFF',
                borderColor:
                  summary.missing_count > 0
                    ? isDark
                      ? '#2D1B22'
                      : '#FEE2E2'
                    : cardBorder,
                borderTopColor: missingAccent,
              },
            ]}
          >
                <View style={styles.kpiTopRow}>
                  <View
                    style={[
                      styles.kpiIconBox,
                      {
                        backgroundColor: isDark
                          ? `${missingAccent}25`
                          : `${missingAccent}15`,
                      },
                    ]}
                  >
                    {summary.missing_count > 0 ? (
                      <AlertTriangle
                        size={14}
                        color={missingAccent}
                        strokeWidth={2.4}
                      />
                    ) : (
                      <CheckCircle2
                        size={14}
                        color={missingAccent}
                        strokeWidth={2.4}
                      />
                    )}
                  </View>
                  <Text style={[styles.kpiCardLabel, { color: missingAccent }]}>
                    MISSING
                  </Text>
                </View>
            <Text style={[styles.kpiCountText, { color: missingAccent }]}>
                  {summary.missing_count}
                </Text>
                <Text
                  style={[styles.kpiSubText, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {summary.missing_count === 0 && summary.call_follow_ups > 0
                    ? 'All calls uploaded!'
                    : 'Upload to match calls'}
                </Text>
            </View>

            {/* Card 4: Verification */}
            <View
              style={[
                styles.kpiCard,
                styles.kpiCardWide,
                {
                  backgroundColor: isDark ? '#101726' : '#FFFFFF',
                  borderColor: cardBorder,
                  borderTopColor: '#D97706',
                },
              ]}
            >
              <View style={styles.kpiTopRow}>
                <View
                  style={[
                    styles.kpiIconBox,
                    { backgroundColor: isDark ? '#D9770625' : '#D9770615' },
                  ]}
                >
                  <ShieldCheck size={14} color="#D97706" strokeWidth={2.4} />
                </View>
                <Text style={styles.kpiCardLabel}>VERIFICATION</Text>
              </View>
                <View style={styles.kpiPillWrap}>
                  <View
                    style={[
                      styles.miniBadge,
                      {
                        backgroundColor: isDark
                      ? 'rgba(16, 185, 129, 0.16)'
                        : '#ECFDF5',
                  },
                ]}
              >
                    <Text style={[styles.miniBadgeText, { color: colors.success }]}>
                      {summary.verified_count} Verified
                    </Text>
                </View>
              <View
                style={[
                  styles.miniBadge,
                  {
                    backgroundColor: isDark
                      ? 'rgba(245, 158, 11, 0.16)'
                      : '#FFFBEB',
                  },
                ]}
              >
                <Text style={[styles.miniBadgeText, { color: colors.warning }]}>
                  {summary.pending_review} Pending
                </Text>
              </View>
              {summary.flagged_count > 0 ? (
                <View
                  style={[
                    styles.miniBadge,
                    {
                      backgroundColor: isDark
                        ? 'rgba(239, 68, 68, 0.16)'
                        : '#FEF2F2',
                    },
                  ]}
                >
                  <Text style={[styles.miniBadgeText, { color: colors.danger }]}>
                    {summary.flagged_count} Flagged
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
    </ScrollView>
      </View >

  {/* Bulk Upload Card */ }
  < View
style = {
  [
  styles.sectionCard,
  { backgroundColor: cardSurface, borderColor: cardBorder },
        ]}
  >
        <View style={styles.sectionHeaderRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.sectionTitleRow}>
              <CloudUpload size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Bulk Upload Call Recordings
              </Text>
            </View>
            <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
              Select all recordings together for {todayStr} (no individual linking required).
            </Text>
          </View>
          {selectedFiles.length > 0 ? (
            <TouchableOpacity
              onPress={() => setSelectedFiles([])}
              disabled={isUploading}
              style={[
                styles.clearFilesBtn,
                {
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.4)' : '#FECACA',
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.14)' : '#FEF2F2',
                },
              ]}
            >
              <Text style={[styles.clearFilesText, { color: colors.danger }]}>
                Clear ({selectedFiles.length})
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={handlePickFiles}
          disabled={isUploading}
          activeOpacity={0.8}
          style={[
            styles.dropZone,
            {
              borderColor: colors.primary,
              backgroundColor: isDark
                ? 'rgba(189, 207, 121, 0.06)'
                : 'rgba(74, 93, 35, 0.04)',
              opacity: isUploading ? 0.6 : 1,
            },
          ]}
        >
          <View
            style={[
              styles.dropIconCircle,
              {
                backgroundColor: isDark
                  ? 'rgba(189, 207, 121, 0.14)'
                  : '#E8F2D0',
              },
            ]}
          >
            <Mic size={24} color={colors.primary} />
          </View>
          <Text style={[styles.dropTitle, { color: colors.textPrimary }]}>
            Tap to Select Call Recordings
          </Text>
          <Text style={[styles.dropSub, { color: colors.textSecondary }]}>
            Multi-select audio files (.mp3, .m4a, .wav, .aac, .ogg, .amr, .3gp — max 50MB/file)
          </Text>
        </TouchableOpacity>

{
  selectedFiles.length > 0 ? (
    <View
      style={[
        styles.queueBox,
        {
          backgroundColor: isDark ? '#0D131F' : '#F8FAFC',
          borderColor: cardBorder,
        },
      ]}
    >
      <View style={styles.queueTopRow}>
        <Text style={[styles.queueTitle, { color: colors.textPrimary }]}>
          Selected: {selectedFiles.length} file
          {selectedFiles.length > 1 ? 's' : ''} ({formatBytes(totalSelectedSize)})
        </Text>
        <TouchableOpacity
          onPress={handlePickFiles}
          disabled={isUploading}
          style={[
            styles.addMoreBtn,
            {
              borderColor: colors.primary,
              backgroundColor: isDark
                ? 'rgba(189, 207, 121, 0.12)'
                : '#F2F5E8',
            },
          ]}
        >
          <Plus size={13} color={colors.primary} />
          <Text style={[styles.addMoreText, { color: colors.primary }]}>
            Add More
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.fileChipList}>
        {selectedFiles.map((file, idx) => (
          <View
            key={`${file.name}_${file.size}_${idx}`}
            style={[
              styles.fileChip,
              {
                backgroundColor: cardSurface,
                borderColor: cardBorder,
              },
            ]}
          >
            <FileAudio size={14} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.fileName, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {file.name}
              </Text>
              <Text style={[styles.fileSize, { color: colors.textMuted }]}>
                {formatBytes(file.size)}
              </Text>
            </View>
            {!isUploading ? (
              <TouchableOpacity
                onPress={() => handleRemoveFile(idx)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={16} color={colors.danger} />
              </TouchableOpacity>
            ) : null}
          </View>
        ))}
      </View>

      <Text style={[styles.noteLabel, { color: colors.textSecondary }]}>
        Optional Note (applies to this batch)
      </Text>
      <TextInput
        value={batchNotes}
        onChangeText={setBatchNotes}
        editable={!isUploading}
        placeholder="e.g., Evening follow-up recordings (10 calls)"
        placeholderTextColor={colors.inputPlaceholder}
        style={[
          styles.noteInput,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
            color: colors.textPrimary,
          },
        ]}
      />

      <TouchableOpacity
        onPress={handleBulkUpload}
        disabled={isUploading}
        activeOpacity={0.85}
        style={[
          styles.uploadBtn,
          {
            backgroundColor: colors.primary,
            opacity: isUploading ? 0.8 : 1,
          },
        ]}
      >
        {isUploading ? (
          <>
            <ActivityIndicator
              size="small"
              color={isDark ? '#0B111A' : '#FFFFFF'}
            />
            <Text
              style={[
                styles.uploadBtnText,
                { color: isDark ? '#0B111A' : '#FFFFFF' },
              ]}
            >
              Uploading {uploadProgress.completed}/{uploadProgress.total}...
            </Text>
          </>
        ) : (
          <>
            <CloudUpload
              size={16}
              color={isDark ? '#0B111A' : '#FFFFFF'}
            />
            <Text
              style={[
                styles.uploadBtnText,
                { color: isDark ? '#0B111A' : '#FFFFFF' },
              ]}
            >
              Upload All {selectedFiles.length} Recording
              {selectedFiles.length > 1 ? 's' : ''}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {isUploading ? (
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
                width: `${uploadProgress.percent}%`,
                backgroundColor: colors.primary,
              },
            ]}
          />
        </View>
      ) : null}
    </View>
  ) : null
}
      </View >

  {/* Date Filter Bar */ }
  < View
style = {
  [
  styles.sectionCard,
  { backgroundColor: cardSurface, borderColor: cardBorder },
        ]}
  >
        <View style={styles.dateRow}>
          <TouchableOpacity
            onPress={() => setDatePickerTarget('from')}
            style={[
              styles.dateInputBtn,
              {
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
              },
            ]}
          >
            <Calendar size={14} color={colors.primary} />
            <View>
              <Text style={[styles.dateInputLabel, { color: colors.textMuted }]}>
                From Date
              </Text>
              <Text style={[styles.dateInputVal, { color: colors.textPrimary }]}>
                {fromDate || 'Any'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setDatePickerTarget('to')}
            style={[
              styles.dateInputBtn,
              {
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
              },
            ]}
          >
            <Calendar size={14} color={colors.primary} />
            <View>
              <Text style={[styles.dateInputLabel, { color: colors.textMuted }]}>
                To Date
              </Text>
              <Text style={[styles.dateInputVal, { color: colors.textPrimary }]}>
                {toDate || 'Any'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.quickDateRow}>
          <Text style={[styles.quickLabel, { color: colors.textSecondary }]}>
            Quick Date:
          </Text>
          {[
            {
              label: 'All (Clear)',
              active: isAllDates,
              onPress: () => {
                setFromDate('');
                setToDate('');
                setCurrentPage(1);
              },
            },
            {
              label: 'Today',
              active: isTodaySelected,
              onPress: () => {
                const t = getTodayDate();
                setFromDate(t);
                setToDate(t);
                setCurrentPage(1);
              },
            },
            {
              label: 'Yesterday',
              active: isYesterdaySelected,
              onPress: () => {
                const y = getYesterdayDate();
                setFromDate(y);
                setToDate(y);
                setCurrentPage(1);
              },
            },
          ].map((pill) => (
            <TouchableOpacity
              key={pill.label}
              onPress={() => {
                triggerHaptic('selection');
                pill.onPress();
              }}
              style={[
                styles.quickPill,
                {
                  backgroundColor: pill.active
                    ? colors.primary
                    : isDark
                      ? '#1E293B'
                      : '#F1F5F9',
                  borderColor: pill.active ? colors.primary : cardBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.quickPillText,
                  {
                    color: pill.active
                      ? isDark
                        ? '#0B111A'
                        : '#FFFFFF'
                      : colors.textPrimary,
                  },
                ]}
              >
                {pill.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View >

  {/* Daily Follow-Ups & Call Recordings List */ }
  < View
style = {
  [
  styles.sectionCard,
  { backgroundColor: cardSurface, borderColor: cardBorder },
        ]}
  >
  <View style={styles.listHeaderRow}>
    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
      Daily Follow-Ups & Recordings
    </Text>
    <View
      style={[
        styles.countBadge,
        { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
      ]}
    >
      <Text style={[styles.countBadgeText, { color: colors.textSecondary }]}>
        {pagination.total || 0} Days
      </Text>
    </View>
  </View>

{
  isLoading ? (
    <View style={styles.centerBox}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        Loading daily summary...
      </Text>
    </View>
  ) : dailyRows.length === 0 ? (
    <View style={styles.centerBox}>
      <Mic size={32} color={colors.textMuted} />
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        No follow-ups or recordings found{' '}
        {isAllDates ? 'yet' : `for ${dateRangeLabel}`}.
      </Text>
    </View>
  ) : (
    <View style={styles.cardsStack}>
      {dailyRows.map((row) => (
        <View
          key={row.date}
          style={[
            styles.dayCard,
            {
              backgroundColor: isDark ? '#0D131F' : '#F8FAFC',
              borderColor: cardBorder,
            },
          ]}
        >
          <View style={styles.dayCardTop}>
            <View style={styles.dayDateRow}>
              <Calendar size={15} color={colors.primary} />
              <Text style={[styles.dayDateText, { color: colors.textPrimary }]}>
                {row.date}
              </Text>
            </View>
            <ComplianceBadge
              compliance_status={row.compliance_status}
              recordings_uploaded={row.recordings_uploaded}
              call_follow_ups={row.call_follow_ups}
              missing_count={row.missing_count}
            />
          </View>

          <View style={styles.dayMetricsRow}>
            <View
              style={[
                styles.metricBox,
                { backgroundColor: cardSurface, borderColor: cardBorder },
              ]}
            >
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                Call Follow-Ups
              </Text>
              <Text style={[styles.metricVal, { color: colors.textPrimary }]}>
                {row.call_follow_ups}
                {row.total_follow_ups !== row.call_follow_ups ? (
                  <Text style={[styles.metricSub, { color: colors.textMuted }]}>
                    {' '}
                    ({row.total_follow_ups} total)
                  </Text>
                ) : null}
              </Text>
            </View>

            <View
              style={[
                styles.metricBox,
                { backgroundColor: cardSurface, borderColor: cardBorder },
              ]}
            >
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                Uploaded
              </Text>
              <Text style={[styles.metricVal, { color: colors.primary }]}>
                {row.recordings_uploaded}
              </Text>
            </View>
          </View>

          <View style={styles.dayBottomRow}>
            <View style={styles.verificationPills}>
              {row.verified_count > 0 ? (
                <Text style={[styles.verifPill, { color: colors.success }]}>
                  {row.verified_count} Verified
                </Text>
              ) : null}
              {row.pending_count > 0 ? (
                <Text style={[styles.verifPill, { color: colors.warning }]}>
                  {row.pending_count} Pending
                </Text>
              ) : null}
              {row.flagged_count > 0 ? (
                <Text style={[styles.verifPill, { color: colors.danger }]}>
                  {row.flagged_count} Flagged
                </Text>
              ) : null}
            </View>

            <TouchableOpacity
              onPress={() => handleOpenDayDetail(row)}
              activeOpacity={0.8}
              style={[
                styles.viewListenBtn,
                { backgroundColor: colors.primary },
              ]}
            >
              <Headphones
                size={14}
                color={isDark ? '#0B111A' : '#FFFFFF'}
              />
              <Text
                style={[
                  styles.viewListenText,
                  { color: isDark ? '#0B111A' : '#FFFFFF' },
                ]}
              >
                View & Listen ({row.recordings_uploaded})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  )
}

{/* Pagination */ }
{
  pagination.last_page > 1 ? (
    <View
      style={[
        styles.paginationRow,
        { borderTopColor: cardBorder },
      ]}
    >
      <TouchableOpacity
        disabled={pagination.current_page <= 1}
        onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
        style={[
          styles.pageBtn,
          {
            borderColor: cardBorder,
            opacity: pagination.current_page <= 1 ? 0.4 : 1,
          },
        ]}
      >
        <ChevronLeft size={16} color={colors.textPrimary} />
        <Text style={[styles.pageBtnText, { color: colors.textPrimary }]}>
          Prev
        </Text>
      </TouchableOpacity>

      <Text style={[styles.pageInfo, { color: colors.textSecondary }]}>
        Page {pagination.current_page} of {pagination.last_page}
      </Text>

      <TouchableOpacity
        disabled={pagination.current_page >= pagination.last_page}
        onPress={() =>
          setCurrentPage((p) => Math.min(pagination.last_page, p + 1))
        }
        style={[
          styles.pageBtn,
          {
            borderColor: cardBorder,
            opacity:
              pagination.current_page >= pagination.last_page ? 0.4 : 1,
          },
        ]}
      >
        <Text style={[styles.pageBtnText, { color: colors.textPrimary }]}>
          Next
        </Text>
        <ChevronRight size={16} color={colors.textPrimary} />
      </TouchableOpacity>
    </View>
  ) : null
}
      </View >

  {/* Date Picker Modal */ }
  < DatePickerModal
visible = { datePickerTarget !== null}
title = { datePickerTarget === 'from' ? 'Select From Date' : 'Select To Date'}
initialDate = { datePickerTarget === 'from' ? fromDate : toDate}
allowFuture = { false}
allowPast = { true}
onClose = {() => setDatePickerTarget(null)}
onSelectDate = {(dateStr) => {
  if (datePickerTarget === 'from') {
    setFromDate(dateStr);
  } else if (datePickerTarget === 'to') {
    setToDate(dateStr);
  }
  setCurrentPage(1);
}}
      />

{/* Day Detail Modal */ }
<CallRecordingDetailModal
  visible={detailModalOpen}
  mode="staff"
  title={`Follow-Ups & Recordings — ${activeDayDate}`}
  subtitle={`${currentUser?.name || 'Staff'} (${currentUser?.role || 'Sales Executive'})`}
  loading={detailLoading}
  followUps={dayDetail.follow_ups}
  recordings={dayDetail.recordings}
  onClose={() => setDetailModalOpen(false)}
  onDelete={handleDeleteRecording}
/>
    </ScrollView >
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
    content: { padding: 14, paddingTop: 10, gap: 12 },
    kpiDeckWrapper: {
      marginHorizontal: -14,
      paddingVertical: 2,
    },
    kpiDeckScroll: {
      paddingHorizontal: 14,
      gap: 10,
    },
    kpiCard: {
      width: 154,
      borderRadius: 12,
      borderWidth: 1,
      borderTopWidth: 3,
      padding: 10,
      justifyContent: 'space-between',
      minHeight: 96,
    },
      kpiCardWide: {
        width: 184,
      },
        kpiTopRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 4,
        },
        kpiIconBox: {
          width: 26,
          height: 26,
          borderRadius: 6,
          alignItems: 'center',
          justifyContent: 'center',
        },
        kpiCardLabel: {
          fontSize: 9,
          fontWeight: '800',
          color: '#64748B',
          letterSpacing: 0.3,
        },
          kpiCountText: {
            fontSize: 20,
            fontWeight: '800',
            letterSpacing: -0.5,
          },
          kpiSubText: {
            fontSize: 9.5,
            fontWeight: '500',
            marginTop: 1,
          },
          kpiPillWrap: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 4,
            marginTop: 4,
          },
          miniBadge: {
            paddingHorizontal: 6,
            paddingVertical: 3,
            borderRadius: 5,
          },
          miniBadgeText: {
            fontSize: 9.5,
            fontWeight: '700',
          },
          sectionCard: {
            borderRadius: 14,
            borderWidth: 1,
            padding: 14,
            gap: 12,
          },
          sectionHeaderRow: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 8,
          },
          sectionTitleRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 7,
          },
          sectionTitle: {
            fontSize: 15,
            fontWeight: '800',
          },
          sectionHint: {
            fontSize: 11,
            marginTop: 3,
          },
          clearFilesBtn: {
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 8,
            borderWidth: 1,
          },
          clearFilesText: {
            fontSize: 11,
            fontWeight: '700',
          },
          dropZone: {
            borderWidth: 1.5,
            borderStyle: 'dashed',
            borderRadius: 12,
            paddingVertical: 20,
            paddingHorizontal: 16,
            alignItems: 'center',
            gap: 6,
          },
          dropIconCircle: {
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 4,
          },
          dropTitle: {
            fontSize: 14,
            fontWeight: '700',
            textAlign: 'center',
          },
          dropSub: {
            fontSize: 11,
            textAlign: 'center',
            lineHeight: 16,
          },
          queueBox: {
            borderRadius: 12,
            borderWidth: 1,
            padding: 12,
            gap: 10,
          },
          queueTopRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          },
          queueTitle: {
            fontSize: 12,
            fontWeight: '700',
          },
          addMoreBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 8,
            borderWidth: 1,
            gap: 4,
          },
          addMoreText: {
            fontSize: 11,
            fontWeight: '700',
          },
          fileChipList: {
            gap: 7,
          },
          fileChip: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 10,
            paddingVertical: 8,
            borderRadius: 9,
            borderWidth: 1,
            gap: 8,
          },
          fileName: {
            fontSize: 12,
            fontWeight: '600',
          },
          fileSize: {
            fontSize: 10,
          },
          noteLabel: {
            fontSize: 11,
            fontWeight: '700',
          },
          noteInput: {
            borderWidth: 1,
            borderRadius: 9,
            paddingHorizontal: 12,
            paddingVertical: 9,
            fontSize: 13,
          },
          uploadBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 12,
            borderRadius: 10,
            gap: 8,
          },
          uploadBtnText: {
            fontSize: 13,
            fontWeight: '800',
          },
          progressTrack: {
            height: 6,
            borderRadius: 3,
            overflow: 'hidden',
          },
          progressFill: {
            height: '100%',
            borderRadius: 3,
          },
          dateRow: {
            flexDirection: 'row',
            gap: 10,
          },
          dateInputBtn: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            borderWidth: 1,
            borderRadius: 10,
            paddingHorizontal: 10,
            paddingVertical: 8,
          },
          dateInputLabel: {
            fontSize: 10,
            fontWeight: '600',
          },
          dateInputVal: {
            fontSize: 12,
            fontWeight: '700',
          },
          quickDateRow: {
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 6,
          },
          quickLabel: {
            fontSize: 11,
            fontWeight: '700',
            marginRight: 2,
          },
          quickPill: {
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 14,
            borderWidth: 1,
          },
          quickPillText: {
            fontSize: 11,
            fontWeight: '700',
          },
          listHeaderRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          },
          countBadge: {
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
          },
          countBadgeText: {
            fontSize: 11,
            fontWeight: '700',
          },
          centerBox: {
            paddingVertical: 32,
            alignItems: 'center',
            gap: 8,
          },
          emptyText: {
            fontSize: 13,
            textAlign: 'center',
          },
          cardsStack: {
            gap: 10,
          },
          dayCard: {
            borderRadius: 12,
            borderWidth: 1,
            padding: 12,
            gap: 10,
          },
          dayCardTop: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
          },
          dayDateRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          },
          dayDateText: {
            fontSize: 14,
            fontWeight: '800',
          },
          dayMetricsRow: {
            flexDirection: 'row',
            gap: 8,
          },
          metricBox: {
            flex: 1,
            borderRadius: 9,
            borderWidth: 1,
            paddingHorizontal: 10,
            paddingVertical: 8,
          },
          metricLabel: {
            fontSize: 10,
            fontWeight: '700',
          },
          metricVal: {
            fontSize: 16,
            fontWeight: '800',
            marginTop: 2,
          },
          metricSub: {
            fontSize: 11,
            fontWeight: '500',
          },
          dayBottomRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
          },
          verificationPills: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
          },
          verifPill: {
            fontSize: 11,
            fontWeight: '700',
          },
          viewListenBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 9,
            gap: 6,
          },
          viewListenText: {
            fontSize: 12,
            fontWeight: '700',
          },
          paginationRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 12,
            borderTopWidth: 1,
          },
          pageBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
            borderWidth: 1,
            gap: 4,
          },
          pageBtnText: {
            fontSize: 12,
            fontWeight: '700',
          },
          pageInfo: {
            fontSize: 12,
            fontWeight: '600',
          },
        });
