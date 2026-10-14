package com.cws.tiffinapp

import android.app.Activity
import android.content.Intent
import android.database.Cursor
import android.net.Uri
import android.os.Build
import android.provider.OpenableColumns
import java.io.File
import java.io.FileOutputStream
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class ProfileImagePickerModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private var pendingPromise: Promise? = null

  private val activityEventListener: ActivityEventListener =
    object : BaseActivityEventListener() {
      override fun onActivityResult(
        activity: Activity,
        requestCode: Int,
        resultCode: Int,
        data: Intent?
      ) {
        if (requestCode != REQUEST_CODE) {
          return
        }

        val promise = pendingPromise
        pendingPromise = null

        if (promise == null) {
          return
        }

        if (resultCode != Activity.RESULT_OK || data?.data == null) {
          promise.reject("PICKER_CANCELLED", "Image selection was cancelled")
          return
        }

        try {
          val uri = data.data as Uri
          val resolver = reactContext.contentResolver
          val mimeType = resolver.getType(uri) ?: "image/jpeg"
          val originalName = getFileName(uri) ?: "profile-image"
          val cachedFile = copyImageToCache(uri, originalName, mimeType)
          val result = Arguments.createMap()
          result.putString("uri", Uri.fromFile(cachedFile).toString())
          result.putString("mimeType", mimeType)
          result.putString("fileName", cachedFile.name)
          promise.resolve(result)
        } catch (error: Exception) {
          promise.reject("PICKER_FAILED", error.message ?: "Unable to select image")
        }
      }
    }

  init {
    reactContext.addActivityEventListener(activityEventListener)
  }

  override fun getName(): String = "ProfileImagePicker"

  @ReactMethod
  fun pickImage(promise: Promise) {
    val activity = reactApplicationContext.currentActivity

    if (activity == null) {
      promise.reject("NO_ACTIVITY", "App is not ready to open image picker")
      return
    }

    if (pendingPromise != null) {
      promise.reject("PICKER_BUSY", "Image picker is already open")
      return
    }

    pendingPromise = promise

    try {
      val intent =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
          Intent(android.provider.MediaStore.ACTION_PICK_IMAGES).apply {
            type = "image/*"
          }
        } else {
          Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
            type = "image/*"
            addCategory(Intent.CATEGORY_OPENABLE)
          }
        }.apply {
          addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
      activity.startActivityForResult(intent, REQUEST_CODE)
    } catch (error: Exception) {
      pendingPromise = null
      promise.reject("PICKER_OPEN_FAILED", error.message ?: "Unable to open image picker")
    }
  }

  private fun copyImageToCache(uri: Uri, originalName: String, mimeType: String): File {
    val extension = when (mimeType) {
      "image/png" -> "png"
      "image/webp" -> "webp"
      else -> "jpg"
    }
    val baseName = originalName
      .replace(Regex("\\.[^.]+$"), "")
      .replace(Regex("[^A-Za-z0-9_-]"), "-")
      .take(40)
      .ifBlank { "profile-image" }
    val cacheDir = File(reactContext.cacheDir, "profile-images")
    cacheDir.mkdirs()
    val outputFile = File(cacheDir, "$baseName-${System.currentTimeMillis()}.$extension")
    val inputStream = reactContext.contentResolver.openInputStream(uri)
      ?: throw IllegalStateException("Unable to read selected image")

    inputStream.use { input ->
      FileOutputStream(outputFile).use { output ->
        input.copyTo(output)
      }
    }

    return outputFile
  }

  private fun getFileName(uri: Uri): String? {
    var cursor: Cursor? = null

    return try {
      cursor = reactContext.contentResolver.query(uri, null, null, null, null)
      val nameIndex = cursor?.getColumnIndex(OpenableColumns.DISPLAY_NAME) ?: -1

      if (cursor != null && cursor.moveToFirst() && nameIndex >= 0) {
        cursor.getString(nameIndex)
      } else {
        uri.lastPathSegment
      }
    } finally {
      cursor?.close()
    }
  }

  companion object {
    private const val REQUEST_CODE = 8801
  }
}
