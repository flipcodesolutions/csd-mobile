package com.csdmobile

import android.app.Activity
import android.content.Intent
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.PlaybackParams
import android.net.Uri
import android.os.Build
import android.provider.OpenableColumns
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File
import java.io.FileOutputStream

class CallRecordingMediaModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  companion object {
    private const val PICK_AUDIO_REQUEST_CODE = 48291
    private const val PLAYER_EVENT_NAME = "CallRecordingPlayerEvent"
  }

  private var pickerPromise: Promise? = null
  private var mediaPlayer: MediaPlayer? = null
  private var currentFilePath: String? = null
  private var currentSpeed: Float = 1.0f
  private var isPrepared: Boolean = false

  private val activityEventListener = object : BaseActivityEventListener() {
    override fun onActivityResult(
      activity: Activity,
      requestCode: Int,
      resultCode: Int,
      data: Intent?
    ) {
      if (requestCode != PICK_AUDIO_REQUEST_CODE) return

      val promise = pickerPromise
      pickerPromise = null
      if (promise == null) return

      if (resultCode != Activity.RESULT_OK || data == null) {
        promise.reject("CANCELLED", "Audio selection cancelled")
        return
      }

      try {
        val uris = mutableListOf<Uri>()
        val clipData = data.clipData
        if (clipData != null && clipData.itemCount > 0) {
          for (i in 0 until clipData.itemCount) {
            clipData.getItemAt(i)?.uri?.let { uris.add(it) }
          }
        } else {
          data.data?.let { uris.add(it) }
        }

        if (uris.isEmpty()) {
          promise.reject("CANCELLED", "No files selected")
          return
        }

        val pickDir = File(reactContext.cacheDir, "call_recordings_pick")
        if (!pickDir.exists()) {
          pickDir.mkdirs()
        }

        val resultArray = Arguments.createArray()
        val resolver = reactContext.contentResolver

        for ((index, uri) in uris.withIndex()) {
          var displayName = "recording_${System.currentTimeMillis()}_$index.mp3"
          var fileSize: Long = 0

          resolver.query(uri, null, null, null, null)?.use { cursor ->
            if (cursor.moveToFirst()) {
              val nameIdx = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
              if (nameIdx >= 0) {
                cursor.getString(nameIdx)?.takeIf { it.isNotBlank() }?.let {
                  displayName = it
                }
              }
              val sizeIdx = cursor.getColumnIndex(OpenableColumns.SIZE)
              if (sizeIdx >= 0 && !cursor.isNull(sizeIdx)) {
                fileSize = cursor.getLong(sizeIdx)
              }
            }
          }

          val mimeType = resolver.getType(uri) ?: "audio/mpeg"
          val safeName = displayName.replace(Regex("[^a-zA-Z0-9._-]"), "_")
          val uniqueName = "${System.currentTimeMillis()}_${index}_$safeName"
          val destFile = File(pickDir, uniqueName)

          resolver.openInputStream(uri)?.use { input ->
            FileOutputStream(destFile).use { output ->
              input.copyTo(output)
            }
          } ?: continue

          if (fileSize <= 0L) {
            fileSize = destFile.length()
          }

          val map = Arguments.createMap()
          map.putString("uri", "file://${destFile.absolutePath}")
          map.putString("name", displayName)
          map.putDouble("size", fileSize.toDouble())
          map.putString("type", mimeType)
          resultArray.pushMap(map)
        }

        promise.resolve(resultArray)
      } catch (e: Exception) {
        promise.reject("PICK_ERROR", e.message ?: "Failed to read selected audio files", e)
      }
    }
  }

  init {
    reactContext.addActivityEventListener(activityEventListener)
  }

  override fun getName(): String = "CallRecordingMedia"

  private fun emitEvent(type: String, extra: WritableMap? = null) {
    try {
      val payload = extra ?: Arguments.createMap()
      payload.putString("type", type)
      reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit(PLAYER_EVENT_NAME, payload)
    } catch (_: Exception) {
    }
  }

  @ReactMethod
  fun addListener(eventName: String) {
    // Required for NativeEventEmitter compatibility
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    // Required for NativeEventEmitter compatibility
  }

  @ReactMethod
  fun pickAudioFiles(promise: Promise) {
    val activity = reactContext.currentActivity
    if (activity == null) {
      promise.reject("NO_ACTIVITY", "Current activity is unavailable")
      return
    }
    if (pickerPromise != null) {
      pickerPromise?.reject("CANCELLED", "Superseded by another picker request")
      pickerPromise = null
    }

    pickerPromise = promise
    try {
      val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
        addCategory(Intent.CATEGORY_OPENABLE)
        type = "*/*"
        putExtra(
          Intent.EXTRA_MIME_TYPES,
          arrayOf(
            "audio/*",
            "application/ogg",
            "video/3gpp",
            "video/mp4"
          )
        )
        putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
      }
      activity.startActivityForResult(intent, PICK_AUDIO_REQUEST_CODE)
    } catch (e: Exception) {
      pickerPromise = null
      promise.reject("PICK_LAUNCH_ERROR", e.message ?: "Unable to open audio file picker", e)
    }
  }

  private fun releasePlayerInternal() {
    isPrepared = false
    currentFilePath = null
    mediaPlayer?.let { player ->
      try {
        if (player.isPlaying) {
          player.stop()
        }
      } catch (_: Exception) {
      }
      try {
        player.reset()
      } catch (_: Exception) {
      }
      try {
        player.release()
      } catch (_: Exception) {
      }
    }
    mediaPlayer = null
  }

  @ReactMethod
  fun loadAndPlay(filePath: String, speed: Double, promise: Promise) {
    try {
      releasePlayerInternal()

      val cleanPath = if (filePath.startsWith("file://")) {
        filePath.removePrefix("file://")
      } else {
        filePath
      }

      val player = MediaPlayer()
      mediaPlayer = player
      currentFilePath = cleanPath
      currentSpeed = speed.toFloat().coerceIn(0.5f, 2.5f)

      player.setAudioAttributes(
        AudioAttributes.Builder()
          .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
          .setUsage(AudioAttributes.USAGE_MEDIA)
          .build()
      )

      var settled = false

      player.setOnPreparedListener { mp ->
        isPrepared = true
        try {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && currentSpeed != 1.0f) {
            mp.playbackParams = PlaybackParams().setSpeed(currentSpeed)
          }
          mp.start()
          if (!settled) {
            settled = true
            val res = Arguments.createMap()
            res.putDouble("durationMs", mp.duration.toDouble())
            promise.resolve(res)
          }
        } catch (e: Exception) {
          if (!settled) {
            settled = true
            promise.reject("PLAY_ERROR", e.message ?: "Failed to start playback", e)
          }
        }
      }

      player.setOnCompletionListener {
        val map = Arguments.createMap()
        map.putString("filePath", cleanPath)
        emitEvent("completed", map)
      }

      player.setOnErrorListener { _, what, extra ->
        isPrepared = false
        val map = Arguments.createMap()
        map.putInt("what", what)
        map.putInt("extra", extra)
        emitEvent("error", map)
        if (!settled) {
          settled = true
          promise.reject("MEDIA_ERROR", "Unable to play this audio format (code $what)")
        }
        true
      }

      player.setDataSource(cleanPath)
      player.prepareAsync()
    } catch (e: Exception) {
      releasePlayerInternal()
      promise.reject("LOAD_ERROR", e.message ?: "Failed to load audio file", e)
    }
  }

  @ReactMethod
  fun play(promise: Promise) {
    try {
      val player = mediaPlayer
      if (player == null || !isPrepared) {
        promise.reject("NOT_READY", "No audio loaded")
        return
      }
      if (!player.isPlaying) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && currentSpeed != 1.0f) {
          try {
            player.playbackParams = PlaybackParams().setSpeed(currentSpeed)
          } catch (_: Exception) {
          }
        }
        player.start()
      }
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("PLAY_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun pause(promise: Promise) {
    try {
      val player = mediaPlayer
      if (player != null && isPrepared && player.isPlaying) {
        player.pause()
      }
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("PAUSE_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun stop(promise: Promise) {
    try {
      releasePlayerInternal()
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("STOP_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun seekTo(positionMs: Double, promise: Promise) {
    try {
      val player = mediaPlayer
      if (player == null || !isPrepared) {
        promise.reject("NOT_READY", "No audio loaded")
        return
      }
      player.seekTo(positionMs.toInt().coerceAtLeast(0))
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("SEEK_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun setSpeed(speed: Double, promise: Promise) {
    try {
      currentSpeed = speed.toFloat().coerceIn(0.5f, 2.5f)
      val player = mediaPlayer
      if (player != null && isPrepared && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        val wasPlaying = player.isPlaying
        player.playbackParams = PlaybackParams().setSpeed(currentSpeed)
        if (!wasPlaying && player.isPlaying) {
          player.pause()
        }
      }
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("SPEED_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun getStatus(promise: Promise) {
    try {
      val player = mediaPlayer
      val map = Arguments.createMap()
      if (player != null && isPrepared) {
        map.putBoolean("isPlaying", player.isPlaying)
        map.putDouble("positionMs", player.currentPosition.toDouble())
        map.putDouble("durationMs", player.duration.toDouble())
        map.putDouble("speed", currentSpeed.toDouble())
        map.putString("filePath", currentFilePath)
      } else {
        map.putBoolean("isPlaying", false)
        map.putDouble("positionMs", 0.0)
        map.putDouble("durationMs", 0.0)
        map.putDouble("speed", currentSpeed.toDouble())
      }
      promise.resolve(map)
    } catch (e: Exception) {
      promise.reject("STATUS_ERROR", e.message, e)
    }
  }

  override fun invalidate() {
    releasePlayerInternal()
    reactContext.removeActivityEventListener(activityEventListener)
    super.invalidate()
  }
}

