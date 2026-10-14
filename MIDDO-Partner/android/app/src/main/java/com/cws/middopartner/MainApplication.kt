package com.cws.middopartner

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          add(ProfileImagePickerPackage())
          add(CurrentLocationPackage())
          add(PartnerNotificationPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    createNotificationChannel()
    loadReactNative(this)
  }

  private fun createNotificationChannel() {
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
      val channelId = "middo_partner_orders_high"
      val name = "Order & Delivery Notifications"
      val descriptionText = "Notifications for new assigned orders and deliveries"
      val importance = android.app.NotificationManager.IMPORTANCE_HIGH
      val channel = android.app.NotificationChannel(channelId, name, importance).apply {
        description = descriptionText
        enableVibration(true)
        enableLights(true)
      }
      val notificationManager = getSystemService(android.content.Context.NOTIFICATION_SERVICE) as? android.app.NotificationManager
      notificationManager?.createNotificationChannel(channel)
    }
  }
}
