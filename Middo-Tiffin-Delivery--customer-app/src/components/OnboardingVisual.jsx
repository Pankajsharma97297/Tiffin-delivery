import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { Icons } from '../theme/images';
export function OnboardingVisual({ compact, step }) {
  return (
    <View
      style={[
        styles.visualWrap,
        step.imageWide ? styles.visualWrapWide : undefined,
        compact && styles.visualWrapCompact,
        compact && step.imageWide ? styles.visualWrapWideCompact : undefined,
      ]}
    >
      <Image source={step.image} style={styles.visualImage} />
      {step.badges ? <FreshMealCallouts /> : null}
      {step.screen === 2 ? <VendorMapCallouts /> : null}
      {step.screen === 3 ? <TrackingCallouts /> : null}
    </View>
  );
}
function FreshMealCallouts() {
  return (
    <>
      <View style={[styles.badge, styles.hygienicBadge]}>
        {/* <Text style={styles.check}>✓</Text> */}
        <Image source={Icons.CircleCheck} style={styles.check} />
        <Text style={styles.hygienicText}>Hygienic</Text>
      </View>
      <View style={[styles.badge, styles.freshBadge]}>
        <Text style={styles.freshText}>100% Fresh</Text>
      </View>
    </>
  );
}
function VendorMapCallouts() {
  return (
    <>
      <View style={[styles.badge, styles.vendorNearbyBadge]}>
        <Text style={styles.vendorNearbyText}>8 Vendors Nearby</Text>
      </View>
      <View style={[styles.badge, styles.radiusBadge]}>
        <Image source={Icons.Location} style={styles.radiusImage} />
        <Text style={styles.radiusText}>6 KM Radius</Text>
      </View>
    </>
  );
}
function TrackingCallouts() {
  return (
    <>
      <View style={[styles.badge, styles.liveBadge]}>
        <Text style={styles.liveText}>LIVE</Text>
      </View>
      <View style={[styles.badge, styles.arrivalBadge]}>
        <View style={styles.arrivalIconWrap}>
          {/* <Text style={styles.arrivalIcon}>🚚</Text> */}
          <Image source={Icons.Pickup} style={styles.arrivalIcon} />
        </View>
        <View style={styles.arrivalCopy}>
          <Text style={styles.arrivalTitle}>Arriving in 12 mins</Text>
          <Text style={styles.arrivalSubtitle}>Raju is on the way</Text>
        </View>
      </View>
    </>
  );
}
const styles = StyleSheet.create({
  visualWrap: {
    width: 238,
    maxWidth: '76%',
    aspectRatio: 1,
    alignSelf: 'center',
    marginTop: 34,
    borderRadius: 20,
  },
  visualWrapCompact: {
    width: 136,
    maxWidth: '46%',
    marginTop: 8,
  },
  visualWrapWide: {
    width: 248,
  },
  visualWrapWideCompact: {
    width: 144,
  },
  visualImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#fff8f2',
  },
  badge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
    shadowColor: '#191919',
    shadowOpacity: 0.16,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 4,
  },
  hygienicBadge: {
    right: 15,
    top: 16,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#fffdf9',
  },
  check: {
    width: 14,
    height: 14,
    tintColor: colors.green,
  },
  hygienicText: {
    color: '#333336',
    fontSize: 13,
    fontWeight: '700',
  },
  freshBadge: {
    left: 16,
    bottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.orange,
  },
  freshText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  vendorNearbyBadge: {
    top: 32,
    right: 14,
    paddingHorizontal: 13,
    paddingVertical: 9,
    backgroundColor: colors.orange,
    borderRadius: 16,
  },
  vendorNearbyText: {
    color: '#fff',
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '900',
  },
  radiusBadge: {
    left: 14,
    bottom: 13,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#fff',
    borderRadius: 14,
  },
  radiusImage: {
    width: 15,
    height: 15,
    marginRight: 6,
    tintColor: colors.orengeicon,
  },
  radiusIcon: {
    color: colors.orange,
    fontSize: 13,
    lineHeight: 15,
    fontWeight: '900',
  },
  radiusText: {
    color: '#333336',
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '800',
  },
  liveBadge: {
    left: 18,
    top: 32,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.green,
    borderRadius: 999,
  },
  liveText: {
    color: '#fff',
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '900',
  },
  arrivalBadge: {
    left: 15,
    right: 15,
    bottom: 14,
    minHeight: 58,
    paddingHorizontal: 13,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 14,
    shadowColor: '#6c3a26',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 5,
  },
  arrivalIconWrap: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: '#fff0e8',
  },
  arrivalIcon: {
    width: 14,
    height: 14,
    tintColor: colors.orengeicon,
  },
  arrivalCopy: {
    flex: 1,
  },
  arrivalTitle: {
    color: '#2f2f32',
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '900',
  },
  arrivalSubtitle: {
    marginTop: 2,
    color: '#777',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '500',
  },
});
