import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  DeviceEventEmitter,
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { Pause, Play, RotateCcw, Volume2 } from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { triggerHaptic } from '../../../core/utils/haptics';
import {
  callRecordingMediaBridge,
  callRecordingService,
  formatDurationMs,
  getActiveAudioPlayerId,
  setActiveAudioPlayerId,
  subscribeActiveAudioPlayer,
} from '../callRecordingService';

interface CallRecordingAudioPlayerProps {
  recordingId: number;
  fileName?: string;
}

const SPEED_OPTIONS = [1, 1.5, 2];

export const CallRecordingAudioPlayer: React.FC<CallRecordingAudioPlayerProps> = ({
  recordingId,
  fileName = 'Recording',
}) => {
  const { colors, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [error, setError] = useState('');
  const [trackWidth, setTrackWidth] = useState(0);

  const cachedPathRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (getActiveAudioPlayerId() === recordingId) {
        setActiveAudioPlayerId(null);
        callRecordingMediaBridge.stop().catch(() => {});
      }
    };
  }, [recordingId]);

  // Reset this player if another recording becomes active
  useEffect(() => {
    const unsub = subscribeActiveAudioPlayer((activeId) => {
      if (activeId !== recordingId && isMountedRef.current) {
        setIsPlaying(false);
        setIsLoaded(false);
        setPositionMs(0);
      }
    });
    return unsub;
  }, [recordingId]);

  // Listen to native completion / error events
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      'CallRecordingPlayerEvent',
      (evt: { type?: string; what?: number }) => {
        if (!isMountedRef.current || getActiveAudioPlayerId() !== recordingId) {
          return;
        }
        if (evt?.type === 'completed') {
          setIsPlaying(false);
          setPositionMs(durationMs);
        } else if (evt?.type === 'error') {
          setIsPlaying(false);
          setIsLoaded(false);
          setError('Unable to play this audio format');
        }
      }
    );
    return () => sub.remove();
  }, [recordingId, durationMs]);

  // Poll progress while playing
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(async () => {
      if (getActiveAudioPlayerId() !== recordingId) return;
      try {
        const status = await callRecordingMediaBridge.getStatus();
        if (!isMountedRef.current) return;
        setPositionMs(status.positionMs || 0);
        if (status.durationMs > 0) {
          setDurationMs(status.durationMs);
        }
        if (!status.isPlaying && status.positionMs >= status.durationMs && status.durationMs > 0) {
          setIsPlaying(false);
        }
      } catch {}
    }, 350);

    return () => clearInterval(timer);
  }, [isPlaying, recordingId]);

  const handleLoadAndPlay = async () => {
    triggerHaptic('impactLight');
    setIsLoading(true);
    setError('');
    try {
      const localPath =
        cachedPathRef.current ||
        (await callRecordingService.downloadAudioToCache(recordingId, fileName));
      cachedPathRef.current = localPath;

      if (!callRecordingMediaBridge.isAvailable()) {
        if (Platform.OS === 'ios') {
          await ReactNativeBlobUtil.ios.openDocument(localPath);
          return;
        }
        await ReactNativeBlobUtil.android.actionViewIntent(localPath, 'audio/*');
        return;
      }

      setActiveAudioPlayerId(recordingId);
      const res = await callRecordingMediaBridge.loadAndPlay(localPath, playbackRate);
      if (!isMountedRef.current) return;
      setDurationMs(res?.durationMs || 0);
      setPositionMs(0);
      setIsLoaded(true);
      setIsPlaying(true);
    } catch (err: any) {
      if (!isMountedRef.current) return;
      setError(err?.message || 'Unable to load audio');
      setIsLoaded(false);
      setIsPlaying(false);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleTogglePlayPause = async () => {
    if (!isLoaded || getActiveAudioPlayerId() !== recordingId) {
      await handleLoadAndPlay();
      return;
    }

    triggerHaptic('selection');
    try {
      if (isPlaying) {
        await callRecordingMediaBridge.pause();
        setIsPlaying(false);
      } else {
        if (durationMs > 0 && positionMs >= durationMs - 250) {
          await callRecordingMediaBridge.seekTo(0);
          setPositionMs(0);
        }
        await callRecordingMediaBridge.play();
        setIsPlaying(true);
      }
    } catch (err: any) {
      setError(err?.message || 'Playback error');
    }
  };

  const handleCycleSpeed = async () => {
    triggerHaptic('selection');
    const next =
      SPEED_OPTIONS[(SPEED_OPTIONS.indexOf(playbackRate) + 1) % SPEED_OPTIONS.length];
    setPlaybackRate(next);
    if (isLoaded && getActiveAudioPlayerId() === recordingId) {
      try {
        await callRecordingMediaBridge.setSpeed(next);
      } catch {}
    }
  };

  const handleSeekPress = async (locationX: number) => {
    if (!isLoaded || trackWidth <= 0 || durationMs <= 0) return;
    const ratio = Math.max(0, Math.min(1, locationX / trackWidth));
    const targetMs = Math.round(ratio * durationMs);
    setPositionMs(targetMs);
    try {
      await callRecordingMediaBridge.seekTo(targetMs);
    } catch {}
  };

  const handleTrackLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  if (error) {
    return (
      <View style={styles.errorRow}>
        <View
          style={[
            styles.errorBadge,
            {
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.16)' : '#FEF2F2',
              borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : '#FECACA',
            },
          ]}
        >
          <Text
            style={[styles.errorText, { color: isDark ? '#F87171' : '#DC2626' }]}
            numberOfLines={1}
          >
            {error}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleLoadAndPlay}
          style={[
            styles.retryBtn,
            {
              borderColor: isDark ? '#334155' : '#CBD5E1',
              backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
            },
          ]}
        >
          <RotateCcw size={12} color={colors.textPrimary} />
          <Text style={[styles.retryText, { color: colors.textPrimary }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isLoaded) {
    return (
      <TouchableOpacity
        onPress={handleLoadAndPlay}
        disabled={isLoading}
        activeOpacity={0.8}
        style={[
          styles.playPillBtn,
          {
            backgroundColor: isDark ? 'rgba(189, 207, 121, 0.12)' : '#F2F5E8',
            borderColor: colors.primary,
          },
          isLoading && { opacity: 0.7 },
        ]}
      >
        {isLoading ? (
          <>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.playPillText, { color: colors.primary }]}>
              Loading audio...
            </Text>
          </>
        ) : (
          <>
            <Volume2 size={15} color={colors.primary} />
            <Text style={[styles.playPillText, { color: colors.primary }]}>
              Play Recording
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  }

  const progressPercent =
    durationMs > 0 ? Math.min(100, Math.max(0, (positionMs / durationMs) * 100)) : 0;

  return (
    <View
      style={[
        styles.playerContainer,
        {
          backgroundColor: isDark ? '#101726' : '#F8FAFC',
          borderColor: isDark ? '#1E293B' : '#E2E8F0',
        },
      ]}
    >
      <TouchableOpacity
        onPress={handleTogglePlayPause}
        activeOpacity={0.8}
        style={[styles.playPauseCircle, { backgroundColor: colors.primary }]}
      >
        {isPlaying ? (
          <Pause size={14} color={isDark ? '#0B111A' : '#FFFFFF'} />
        ) : (
          <Play size={14} color={isDark ? '#0B111A' : '#FFFFFF'} />
        )}
      </TouchableOpacity>

      <View style={styles.progressSection}>
        <TouchableOpacity
          activeOpacity={1}
          onLayout={handleTrackLayout}
          onPress={(e) => handleSeekPress(e.nativeEvent.locationX)}
          style={styles.trackHitArea}
        >
          <View
            style={[
              styles.trackBg,
              { backgroundColor: isDark ? '#1E293B' : '#CBD5E1' },
            ]}
          >
            <View
              style={[
                styles.trackFill,
                {
                  width: `${progressPercent}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>
        </TouchableOpacity>

        <View style={styles.timeRow}>
          <Text style={[styles.timeText, { color: colors.textSecondary }]}>
            {formatDurationMs(positionMs)} / {formatDurationMs(durationMs)}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleCycleSpeed}
        activeOpacity={0.75}
        style={[
          styles.speedBtn,
          {
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            borderColor: isDark ? '#334155' : '#CBD5E1',
          },
        ]}
      >
        <Text style={[styles.speedText, { color: colors.textPrimary }]}>
          {playbackRate}x
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  playPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 7,
  },
  playPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  playerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  playPauseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressSection: {
    flex: 1,
  },
  trackHitArea: {
    paddingVertical: 6,
  },
  trackBg: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 3,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  speedBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 38,
    alignItems: 'center',
  },
  speedText: {
    fontSize: 11,
    fontWeight: '700',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  errorBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    maxWidth: '72%',
  },
  errorText: {
    fontSize: 11,
    fontWeight: '600',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  retryText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
