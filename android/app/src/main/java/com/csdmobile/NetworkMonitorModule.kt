package com.csdmobile

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.os.Build
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

class NetworkMonitorModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  companion object {
    private const val EVENT_NAME = "NetworkStatusChanged"
  }

  private val connectivityManager: ConnectivityManager? =
    reactContext.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager

  private var networkCallback: ConnectivityManager.NetworkCallback? = null
  private var lastConnected: Boolean? = null
  private var lastValidated: Boolean? = null

  init {
    registerCallback()
  }

  override fun getName(): String = "NetworkMonitor"

  private fun readNetworkState(): Pair<Boolean, Boolean> {
    val cm = connectivityManager ?: return Pair(true, true)
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      val activeNetwork = cm.activeNetwork
      val caps = if (activeNetwork != null) cm.getNetworkCapabilities(activeNetwork) else null
      val hasInternet = caps?.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) == true
      val isValidated = caps?.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED) == true
      Pair(hasInternet, isValidated)
    } else {
      @Suppress("DEPRECATION")
      val info = cm.activeNetworkInfo
      @Suppress("DEPRECATION")
      val connected = info != null && info.isConnected
      Pair(connected, connected)
    }
  }

  private fun createStateMap(isConnected: Boolean, isValidated: Boolean): WritableMap {
    val map = Arguments.createMap()
    map.putBoolean("isConnected", isConnected)
    map.putBoolean("isValidated", isValidated)
    return map
  }

  private fun emitCurrentStateIfChanged() {
    val (isConnected, isValidated) = readNetworkState()
    if (lastConnected == isConnected && lastValidated == isValidated) {
      return
    }
    lastConnected = isConnected
    lastValidated = isValidated

    if (!reactContext.hasActiveReactInstance()) {
      return
    }

    try {
      reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit(EVENT_NAME, createStateMap(isConnected, isValidated))
    } catch (_: Exception) {
    }
  }

  private fun registerCallback() {
    val cm = connectivityManager ?: return
    val callback = object : ConnectivityManager.NetworkCallback() {
      override fun onAvailable(network: Network) {
        emitCurrentStateIfChanged()
      }

      override fun onLost(network: Network) {
        emitCurrentStateIfChanged()
      }

      override fun onCapabilitiesChanged(
        network: Network,
        networkCapabilities: NetworkCapabilities
      ) {
        emitCurrentStateIfChanged()
      }

      override fun onUnavailable() {
        emitCurrentStateIfChanged()
      }
    }

    networkCallback = callback
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
        cm.registerDefaultNetworkCallback(callback)
      } else {
        val request = NetworkRequest.Builder()
          .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
          .build()
        cm.registerNetworkCallback(request, callback)
      }
      val (isConnected, isValidated) = readNetworkState()
      lastConnected = isConnected
      lastValidated = isValidated
    } catch (_: Exception) {
    }
  }

  @ReactMethod
  fun getCurrentStatus(promise: Promise) {
    val (isConnected, isValidated) = readNetworkState()
    lastConnected = isConnected
    lastValidated = isValidated
    promise.resolve(createStateMap(isConnected, isValidated))
  }

  @ReactMethod
  fun addListener(eventName: String) {
    // Required for NativeEventEmitter compatibility
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    // Required for NativeEventEmitter compatibility
  }

  override fun invalidate() {
    super.invalidate()
    val cm = connectivityManager ?: return
    val cb = networkCallback ?: return
    networkCallback = null
    try {
      cm.unregisterNetworkCallback(cb)
    } catch (_: Exception) {
    }
  }
}

