import { NativeModules, Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { api, getApiBaseUrl, getAuthToken } from '../../core/api/client';
import {
  BatchUploadProgress,
  BatchUploadResult,
  CallRecordingItem,
  SelectedAudioFile,
} from './types';

const { CallRecordingMedia } = NativeModules;

export const formatDateLocal = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const getTodayDate = (): string => formatDateLocal(new Date());

export const getYesterdayDate = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDateLocal(d);
};

export const formatBytes = (bytes?: number | string | null): string => {
  const num = Number(bytes || 0);
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(2)} MB`;
};

export const formatDurationMs = (ms: number): string => {
  const totalSec = Math.max(0, Math.floor((ms || 0) / 1000));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const isAuditRole = (role?: string | null): boolean => {
  const r = String(role || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ');
  return (
    r === 'super admin' ||
    r === 'admin' ||
    r === 'sales manager' ||
    r.includes('admin') ||
    r.includes('manager')
  );
};

export const getRoleBadgeColors = (
  role?: string | null,
  isDark = false
): { bg: string; text: string; border: string } => {
  const r = String(role || '').toLowerCase();
  if (r.includes('admin')) {
    return {
      bg: isDark ? 'rgba(239, 68, 68, 0.18)' : '#FEE2E2',
      text: isDark ? '#FCA5A5' : '#DC2626',
      border: isDark ? 'rgba(239, 68, 68, 0.35)' : '#FECACA',
    };
  }
  if (r.includes('manager')) {
    return {
      bg: isDark ? 'rgba(245, 158, 11, 0.18)' : '#FEF3C7',
      text: isDark ? '#FCD34D' : '#D97706',
      border: isDark ? 'rgba(245, 158, 11, 0.35)' : '#FDE68A',
    };
  }
  if (r.includes('reception')) {
    return {
      bg: isDark ? 'rgba(139, 92, 246, 0.18)' : '#EDE9FE',
      text: isDark ? '#C4B5FD' : '#7C3AED',
      border: isDark ? 'rgba(139, 92, 246, 0.35)' : '#DDD6FE',
    };
  }
  return {
    bg: isDark ? 'rgba(16, 185, 129, 0.18)' : '#ECFDF5',
    text: isDark ? '#6EE7B7' : '#059669',
    border: isDark ? 'rgba(16, 185, 129, 0.35)' : '#A7F3D0',
  };
};

// Track single active audio player across the screen so recordings never overlap
let activePlayerId: number | null = null;
const activePlayerListeners = new Set<(id: number | null) => void>();

export const setActiveAudioPlayerId = (id: number | null) => {
  activePlayerId = id;
  activePlayerListeners.forEach((cb) => cb(id));
};

export const getActiveAudioPlayerId = () => activePlayerId;

export const subscribeActiveAudioPlayer = (
  cb: (id: number | null) => void
): (() => void) => {
  activePlayerListeners.add(cb);
  return () => {
    activePlayerListeners.delete(cb);
  };
};

export const callRecordingMediaBridge = {
  isAvailable: (): boolean => Boolean(CallRecordingMedia),

  pickAudioFiles: async (): Promise<SelectedAudioFile[]> => {
    if (!CallRecordingMedia?.pickAudioFiles) {
      throw new Error(
        Platform.OS === 'ios'
          ? 'Audio file picker native module is not linked on iOS yet.'
          : 'Audio picker native module is unavailable. Please rebuild the Android app.'
      );
    }
    const files = await CallRecordingMedia.pickAudioFiles();
    return Array.isArray(files) ? files : [];
  },

  loadAndPlay: async (filePath: string, speed = 1): Promise<{ durationMs: number }> => {
    if (!CallRecordingMedia?.loadAndPlay) {
      throw new Error('Audio player native module is unavailable.');
    }
    return CallRecordingMedia.loadAndPlay(filePath, speed);
  },

  play: async (): Promise<void> => {
    if (CallRecordingMedia?.play) {
      await CallRecordingMedia.play();
    }
  },

  pause: async (): Promise<void> => {
    if (CallRecordingMedia?.pause) {
      await CallRecordingMedia.pause();
    }
  },

  stop: async (): Promise<void> => {
    if (CallRecordingMedia?.stop) {
      await CallRecordingMedia.stop();
    }
  },

  seekTo: async (positionMs: number): Promise<void> => {
    if (CallRecordingMedia?.seekTo) {
      await CallRecordingMedia.seekTo(positionMs);
    }
  },

  setSpeed: async (speed: number): Promise<void> => {
    if (CallRecordingMedia?.setSpeed) {
      await CallRecordingMedia.setSpeed(speed);
    }
  },

  getStatus: async (): Promise<{
    isPlaying: boolean;
    positionMs: number;
    durationMs: number;
    speed: number;
    filePath?: string;
  }> => {
    if (!CallRecordingMedia?.getStatus) {
      return { isPlaying: false, positionMs: 0, durationMs: 0, speed: 1 };
    }
    return CallRecordingMedia.getStatus();
  },
};

export const callRecordingService = {
  getSummary: async (params: Record<string, any> = {}) => {
    const response = await api.get('/call-recordings/summary', { params });
    return response.data;
  },

  getRecordings: async (params: Record<string, any> = {}) => {
    const response = await api.get('/call-recordings', { params });
    return response.data;
  },

  getStaffDetail: async (userId: number | string, params: Record<string, any> = {}) => {
    const response = await api.get(`/call-recordings/staff/${userId}`, { params });
    return response.data;
  },

  /**
   * Bulk upload multiple audio files sequentially (1 file per request) under a single batch ID
   * with live per-file progress updates so each recording's progress & validation is tracked individually.
   */
  uploadBatch: async (
    files: SelectedAudioFile[],
    metadata: {
      recording_date?: string;
      notes?: string | null;
      lead_id?: number;
      follow_up_id?: number;
      batch_id?: string;
    } = {},
    onProgress?: (progress: BatchUploadProgress) => void
  ): Promise<BatchUploadResult> => {
    const fileList = Array.isArray(files) ? files : [];
    if (fileList.length === 0) {
      throw new Error('Please select at least one audio file.');
    }

    const batchId =
      metadata.batch_id ||
      `batch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const chunkSize = 1;
    const uploadedRecords: CallRecordingItem[] = [];
    const errors: { files: string[]; message: string }[] = [];
    let completed = 0;

    for (let i = 0; i < fileList.length; i += chunkSize) {
      const chunk = fileList.slice(i, i + chunkSize);
      const activeFile = chunk[0];

      if (onProgress) {
        onProgress({
          phase: 'uploading',
          currentIndex: i,
          currentFileName: activeFile?.name || '',
          completed,
          total: fileList.length,
          percent: Math.round((completed / fileList.length) * 100),
        });
      }

      const formData = new FormData();

      if (metadata.recording_date) {
        formData.append('recording_date', metadata.recording_date);
      }
      if (metadata.notes) {
        formData.append('notes', metadata.notes);
      }
      if (metadata.lead_id) {
        formData.append('lead_id', String(metadata.lead_id));
      }
      if (metadata.follow_up_id) {
        formData.append('follow_up_id', String(metadata.follow_up_id));
      }
      formData.append('batch_id', batchId);

      chunk.forEach((file) => {
        formData.append('files[]', {
          uri: file.uri,
          name: file.name,
          type: file.type || 'audio/mpeg',
        } as any);
      });

      try {
        const res = await api.post('/call-recordings', formData, {
          timeout: 120000,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        if (res.data?.status && Array.isArray(res.data?.data)) {
          uploadedRecords.push(...res.data.data);
        }
        completed += chunk.length;
        if (onProgress) {
          onProgress({
            phase: 'uploaded',
            currentIndex: i,
            currentFileName: activeFile?.name || '',
            completed,
            total: fileList.length,
            percent: Math.round((completed / fileList.length) * 100),
          });
        }
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to upload recording.';
        errors.push({
          files: chunk.map((f) => f.name),
          message: msg,
        });
        completed += chunk.length;
        if (onProgress) {
          onProgress({
            phase: 'failed',
            currentIndex: i,
            currentFileName: activeFile?.name || '',
            errorMessage: msg,
            completed,
            total: fileList.length,
            percent: Math.round((completed / fileList.length) * 100),
          });
        }
      }
    }

    return {
      status: uploadedRecords.length > 0 && errors.length === 0,
      partial: uploadedRecords.length > 0 && errors.length > 0,
      batch_id: batchId,
      uploaded_count: uploadedRecords.length,
      data: uploadedRecords,
      errors,
    };
  },

  reviewRecording: async (
    id: number,
    payload: { review_status: 'verified' | 'flagged'; review_remark?: string }
  ) => {
    const response = await api.post(`/call-recordings/${id}/review`, {
      review_status: payload.review_status,
      review_remark: payload.review_remark || '',
    });
    return response.data;
  },

  deleteRecording: async (id: number) => {
    const response = await api.delete(`/call-recordings/${id}`);
    return response.data;
  },

  /**
   * Delete (or preview count with dryRun=true) all recordings older than 1 month.
   */
  deleteOlderThanMonth: async (dryRun = false) => {
    const response = await api.post('/call-recordings/delete-older-than-month', {
      dry_run: dryRun,
    });
    return response.data;
  },

  /**
   * Download authenticated audio stream to local cache for reliable playback.
   */
  downloadAudioToCache: async (id: number, fileName = 'recording.mp3'): Promise<string> => {
    const extMatch = fileName.split('.').pop()?.toLowerCase();
    const ext = extMatch && extMatch.length <= 5 ? extMatch : 'mp3';
    const cacheDir = ReactNativeBlobUtil.fs.dirs.CacheDir;
    const destPath = `${cacheDir}/call_rec_${id}.${ext}`;

    const exists = await ReactNativeBlobUtil.fs.exists(destPath);
    if (exists) {
      const stat = await ReactNativeBlobUtil.fs.stat(destPath);
      if (Number(stat?.size || 0) > 0) {
        return destPath;
      }
    }

    const baseUrl = getApiBaseUrl();
    const token = getAuthToken();
    const url = `${baseUrl}/call-recordings/${id}/stream`;

    const headers: Record<string, string> = {
      Accept: 'audio/*, application/octet-stream',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await ReactNativeBlobUtil.config({
      path: destPath,
      fileCache: true,
    }).fetch('GET', url, headers);

    const status = res.info().status;
    if (status < 200 || status >= 300) {
      try {
        await ReactNativeBlobUtil.fs.unlink(destPath);
      } catch {}
      throw new Error(`Unable to load audio (HTTP ${status})`);
    }

    return res.path();
  },
};

export default callRecordingService;
