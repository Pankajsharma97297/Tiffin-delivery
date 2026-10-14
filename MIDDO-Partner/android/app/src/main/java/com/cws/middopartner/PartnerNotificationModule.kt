package com.cws.middopartner

import android.Manifest
import android.app.PendingIntent
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class PartnerNotificationModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "PartnerNotification"

  private val channelId = "middo_partner_orders_high"

  private fun ensureNotificationChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }

    val channel = android.app.NotificationChannel(
      channelId,
      "Order & Delivery Notifications",
      android.app.NotificationManager.IMPORTANCE_HIGH,
    ).apply {
      description = "Notifications for new assigned orders and deliveries"
      enableVibration(true)
      enableLights(true)
      lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
    }

    val manager = reactContext.getSystemService(
      android.content.Context.NOTIFICATION_SERVICE,
    ) as? android.app.NotificationManager
    manager?.createNotificationChannel(channel)
  }

  @ReactMethod
  fun show(title: String?, body: String?) {
    ensureNotificationChannel()

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      val allowed = ContextCompat.checkSelfPermission(
        reactContext,
        Manifest.permission.POST_NOTIFICATIONS,
      ) == PackageManager.PERMISSION_GRANTED

      if (!allowed) {
        return
      }
    }

    val launchIntent = reactContext.packageManager.getLaunchIntentForPackage(reactContext.packageName)
      ?: Intent(reactContext, MainActivity::class.java)
    launchIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)

    val pendingIntent = PendingIntent.getActivity(
      reactContext,
      System.currentTimeMillis().toInt(),
      launchIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )

    val notification = NotificationCompat.Builder(reactContext, channelId)
      .setSmallIcon(reactContext.applicationInfo.icon)
      .setContentTitle(title?.takeIf { it.isNotBlank() } ?: "MIDDO Partner")
      .setContentText(body?.takeIf { it.isNotBlank() } ?: "You have a new update.")
      .setStyle(NotificationCompat.BigTextStyle().bigText(body ?: "You have a new update."))
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setCategory(NotificationCompat.CATEGORY_MESSAGE)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setAutoCancel(true)
      .setDefaults(NotificationCompat.DEFAULT_ALL)
      .setContentIntent(pendingIntent)
      .build()

    NotificationManagerCompat.from(reactContext).notify(
      System.currentTimeMillis().toInt(),
      notification,
    )
  }
}
