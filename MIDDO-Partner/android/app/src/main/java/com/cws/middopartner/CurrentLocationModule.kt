package com.cws.middopartner

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Bundle
import androidx.core.app.ActivityCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class CurrentLocationModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "CurrentLocation"

  @ReactMethod
  fun getCurrentLocation(promise: Promise) {
    if (!hasLocationPermission()) {
      promise.reject("LOCATION_PERMISSION_DENIED", "Location permission is not granted")
      return
    }

    val locationManager =
      reactContext.getSystemService(Context.LOCATION_SERVICE) as LocationManager
    val providers = listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER)
      .filter { provider ->
        try {
          locationManager.isProviderEnabled(provider)
        } catch (_error: Exception) {
          false
        }
      }

    if (providers.isEmpty()) {
      promise.reject("LOCATION_DISABLED", "Location services are disabled")
      return
    }

    val lastKnown = providers
      .mapNotNull { provider ->
        try {
          locationManager.getLastKnownLocation(provider)
        } catch (_error: SecurityException) {
          null
        }
      }
      .maxByOrNull { it.time }

    if (lastKnown != null && System.currentTimeMillis() - lastKnown.time <= MAX_LAST_KNOWN_AGE_MS) {
      promise.resolve(toMap(lastKnown))
      return
    }

    var resolved = false
    val listener =
      object : LocationListener {
        override fun onLocationChanged(location: Location) {
          if (resolved) return
          resolved = true
          locationManager.removeUpdates(this)
          promise.resolve(toMap(location))
        }

        override fun onProviderDisabled(provider: String) = Unit
        override fun onProviderEnabled(provider: String) = Unit
        override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) = Unit
      }

    try {
      providers.forEach { provider ->
        locationManager.requestLocationUpdates(provider, 0L, 0f, listener, reactContext.mainLooper)
      }
      android.os.Handler(reactContext.mainLooper).postDelayed({
        if (!resolved) {
          resolved = true
          locationManager.removeUpdates(listener)
          if (lastKnown != null) {
            promise.resolve(toMap(lastKnown))
          } else {
            promise.reject("LOCATION_TIMEOUT", "Unable to fetch current location")
          }
        }
      }, LOCATION_TIMEOUT_MS)
    } catch (error: SecurityException) {
      promise.reject("LOCATION_PERMISSION_DENIED", error.message)
    } catch (error: Exception) {
      promise.reject("LOCATION_FAILED", error.message ?: "Unable to fetch current location")
    }
  }

  private fun hasLocationPermission(): Boolean {
    val fine = ActivityCompat.checkSelfPermission(
      reactContext,
      Manifest.permission.ACCESS_FINE_LOCATION,
    ) == PackageManager.PERMISSION_GRANTED
    val coarse = ActivityCompat.checkSelfPermission(
      reactContext,
      Manifest.permission.ACCESS_COARSE_LOCATION,
    ) == PackageManager.PERMISSION_GRANTED

    return fine || coarse
  }

  private fun toMap(location: Location) =
    Arguments.createMap().apply {
      putDouble("latitude", location.latitude)
      putDouble("longitude", location.longitude)
      putDouble("accuracy", location.accuracy.toDouble())
      putDouble("timestamp", location.time.toDouble())
      putString("provider", location.provider)
    }

  companion object {
    private const val LOCATION_TIMEOUT_MS = 12000L
    private const val MAX_LAST_KNOWN_AGE_MS = 30000L
  }
}
