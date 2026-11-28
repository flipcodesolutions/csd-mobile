import { useEffect, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';

interface NativeNetworkStatus {
  isConnected: boolean;
  isValidated?: boolean;
}

interface NetworkMonitorNativeModule {
  getCurrentStatus: () => Promise<NativeNetworkStatus>;
  addListener: (eventName: string) => void;
  removeListeners: (count: number) => void;
}

const NativeNetworkMonitor = NativeModules.NetworkMonitor as
  | NetworkMonitorNativeModule
  | undefined;

const NETWORK_EVENT_NAME = 'NetworkStatusChanged';
const OFFLINE_DEBOUNCE_MS = 250;
const REACHABILITY_TIMEOUT_MS = 3500;
const ONLINE_POLL_INTERVAL_MS = 5000;
const OFFLINE_POLL_INTERVAL_MS = 2500;

let reachabilityUrl = 'https://api.defenceautolink.com';
let isOnlineState = true;
let offlineDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let inFlightReachabilityCheck: Promise<boolean> | null = null;
let lastNativeStatus: NativeNetworkStatus | null = null;
let monitorCleanup: (() => void) | null = null;

const listeners = new Set<(online: boolean) => void>();

const isJestEnv = (): boolean =>
  Boolean((globalThis as any)?.process?.env?.JEST_WORKER_ID);

export const setNetworkReachabilityUrl = (url: string) => {
  if (!url) return;
  try {
    const match = url.match(/^https?:\/\/[^/]+/i);
    if (match?.[0]) {
      reachabilityUrl = match[0];
    }
  } catch {
    // Keep existing reachability URL
  }
};

export const getIsNetworkOnline = (): boolean => isOnlineState;

const notifyListeners = (nextOnline: boolean) => {
  if (isOnlineState === nextOnline) return;
  isOnlineState = nextOnline;
  listeners.forEach((listener) => {
    try {
      listener(nextOnline);
    } catch {
      // Ignore subscriber errors
    }
  });
};

const clearOfflineDebounce = () => {
  if (offlineDebounceTimer) {
    clearTimeout(offlineDebounceTimer);
    offlineDebounceTimer = null;
  }
};

const setOnlineImmediate = () => {
  clearOfflineDebounce();
  notifyListeners(true);
  updatePollSchedule();
};

const scheduleOffline = () => {
  if (!isOnlineState) {
    clearOfflineDebounce();
    return;
  }
  if (offlineDebounceTimer) return;
  offlineDebounceTimer = setTimeout(() => {
    offlineDebounceTimer = null;
    notifyListeners(false);
    updatePollSchedule();
  }, OFFLINE_DEBOUNCE_MS);
};

const checkInternetReachability = async (): Promise<boolean> => {
  if (inFlightReachabilityCheck) {
    return inFlightReachabilityCheck;
  }

  inFlightReachabilityCheck = (async () => {
    const controller =
      typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller
      ? setTimeout(() => controller.abort(), REACHABILITY_TIMEOUT_MS)
      : null;

    try {
      await fetch(reachabilityUrl, {
        method: 'HEAD',
        headers: {
          'Cache-Control': 'no-cache',
        },
        signal: controller?.signal,
      });
      return true;
    } catch {
      return false;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      inFlightReachabilityCheck = null;
    }
  })();

  return inFlightReachabilityCheck;
};

const handleNativeStatus = async (status: NativeNetworkStatus) => {
  lastNativeStatus = status;

  if (!status.isConnected) {
    scheduleOffline();
    return;
  }

  if (status.isValidated !== false) {
    setOnlineImmediate();
    return;
  }

  // Connected to a network interface that Android hasn't validated yet (e.g. WiFi without internet)
  const reachable = await checkInternetReachability();
  if (lastNativeStatus && !lastNativeStatus.isConnected) {
    scheduleOffline();
    return;
  }
  if (reachable) {
    setOnlineImmediate();
  } else {
    scheduleOffline();
  }
};

const refreshNetworkStatus = async () => {
  if (isJestEnv()) return;

  if (NativeNetworkMonitor?.getCurrentStatus) {
    try {
      const status = await NativeNetworkMonitor.getCurrentStatus();
      await handleNativeStatus(status);
      return;
    } catch {
      // Fall through to reachability check
    }
  }

  const reachable = await checkInternetReachability();
  if (reachable) {
    setOnlineImmediate();
  } else {
    scheduleOffline();
  }
};

const clearPollTimer = () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
};

function updatePollSchedule() {
  clearPollTimer();

  if (listeners.size === 0 || isJestEnv()) {
    return;
  }
  if (AppState.currentState && AppState.currentState !== 'active') {
    return;
  }

  // Native module gives instant OS callbacks when connected & validated or fully disconnected.
  // Only poll when native module is unavailable or when connected to an unvalidated network.
  const needsFallbackPolling =
    !NativeNetworkMonitor ||
    (lastNativeStatus?.isConnected && lastNativeStatus?.isValidated === false);

  if (!needsFallbackPolling) {
    return;
  }

  const intervalMs = isOnlineState
    ? ONLINE_POLL_INTERVAL_MS
    : OFFLINE_POLL_INTERVAL_MS;

  pollTimer = setInterval(() => {
    refreshNetworkStatus();
  }, intervalMs);
}

const startMonitoring = () => {
  if (monitorCleanup || isJestEnv()) return;

  let nativeSub: { remove: () => void } | null = null;
  if (NativeNetworkMonitor) {
    try {
      const emitter = new NativeEventEmitter(NativeNetworkMonitor as any);
      nativeSub = emitter.addListener(
        NETWORK_EVENT_NAME,
        (status: unknown) => {
          handleNativeStatus(status as NativeNetworkStatus);
        }
      );
    } catch {
      nativeSub = null;
    }
  }

  const appStateSub = AppState.addEventListener(
    'change',
    (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        refreshNetworkStatus();
        updatePollSchedule();
      } else {
        clearPollTimer();
      }
    }
  );

  refreshNetworkStatus();
  updatePollSchedule();

  monitorCleanup = () => {
    clearOfflineDebounce();
    clearPollTimer();
    nativeSub?.remove();
    appStateSub.remove();
    monitorCleanup = null;
  };
};

export const subscribeNetworkStatus = (
  listener: (online: boolean) => void
): (() => void) => {
  listeners.add(listener);
  if (listeners.size === 1) {
    startMonitoring();
  }
  listener(isOnlineState);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && monitorCleanup) {
      monitorCleanup();
    }
  };
};

export const reportNetworkSuccess = () => {
  if (lastNativeStatus && !lastNativeStatus.isConnected) {
    lastNativeStatus = { isConnected: true, isValidated: true };
  }
  setOnlineImmediate();
};

export const reportNetworkFailure = () => {
  if (Platform.OS === 'web') return;
  refreshNetworkStatus();
};

export const useNetworkStatus = (): boolean => {
  const [isOnline, setIsOnline] = useState<boolean>(isOnlineState);

  useEffect(() => {
    return subscribeNetworkStatus(setIsOnline);
  }, []);

  return isOnline;
};
