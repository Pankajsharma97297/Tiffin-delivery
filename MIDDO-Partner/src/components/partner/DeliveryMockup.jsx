import React from 'react';
import { Image, Text, View, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { Icons } from '../../theme/images';

export function DeliveryMockup() {
  return (
    <View style={styles.mockupCard}>
      <View style={styles.mockupHeader}>
        <View style={styles.titleRow}>
          <View style={styles.truckIconBox}>
            <Image source={Icons.DeliveryTruck} style={styles.truckIcon} />
          </View>
          <Text style={styles.mockupTitle}>Delivery Partner</Text>
        </View>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>ONLINE</Text>
        </View>
      </View>
      <View style={styles.routeCard}>
        <View style={styles.routeTopRow}>
          <View style={styles.routeIconBox}>
            <Image source={Icons.ChefCap} style={styles.routeIcon} />
          </View>
          <Text style={styles.mockupLine}>Pickup from assigned HomeChef</Text>
        </View>
        <View style={styles.routePath} />
        <View style={styles.routeBottomRow}>
          <Text style={styles.mockupLine}>Drop at customer address</Text>
          <View style={styles.homeIconBox}>
            <Image source={Icons.Home} style={styles.homeIcon} />
          </View>
        </View>
      </View>
      <View style={styles.orderCard}>
        <View>
          <Text style={styles.orderTitle}>Assigned Order</Text>
          <Text style={styles.orderMeta}>Customer and route sync live</Text>
          <Text style={styles.orderMeta}>Slot from backend</Text>
        </View>
        <Image source={Icons.Location} style={styles.locationIcon} />
      </View>
      <View style={styles.assignmentToast}>
        <Image source={Icons.Bell} style={styles.toastIcon} />
        <Text style={styles.assignmentToastText}>New delivery assigned!</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  assignmentToast: {
    alignItems: 'center',
    backgroundColor: colors.orangeSoft,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  assignmentToastText: {
    color: colors.orange,
    fontSize: 12,
    fontWeight: '900',
  },
  homeIcon: {
    height: 16,
    tintColor: colors.green,
    width: 16,
  },
  homeIconBox: {
    alignItems: 'center',
    backgroundColor: colors.greenSoft,
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  locationIcon: {
    height: 20,
    tintColor: colors.orange,
    width: 20,
  },
  mockupCard: {
    backgroundColor: colors.white,
    borderColor: '#eadbd1',
    borderRadius: 14,
    borderWidth: 1,
    elevation: 4,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    width: '100%',
  },
  mockupHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  mockupLine: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  mockupTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  orderCard: {
    alignItems: 'center',
    backgroundColor: '#f3f0ed',
    borderRadius: 9,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    padding: 11,
  },
  orderMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  orderTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 3,
  },
  routeCard: {
    borderColor: '#e2d5cd',
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 12,
  },
  routeBottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    // marginTop: 24,
  },
  routeIcon: {
    height: 14,
    tintColor: colors.orange,
    width: 14,
  },
  routeIconBox: {
    alignItems: 'center',
    backgroundColor: colors.orangeSoft,
    borderRadius: 13,
    height: 26,
    justifyContent: 'center',
    marginRight: 8,
    width: 26,
  },
  routePath: {
    alignSelf: 'center',
    borderColor: colors.orange,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
    height: 45,
     marginVertical: 5,
  },
  routeTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  statusPill: {
    backgroundColor: colors.greenSoft,
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusText: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '900',
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  toastIcon: {
    height: 15,
    tintColor: colors.orange,
    width: 15,
  },
  truckIcon: {
    height: 18,
    tintColor: colors.orange,
    width: 18,
  },
  truckIconBox: {
    alignItems: 'center',
    backgroundColor: colors.orangeSoft,
    borderRadius: 10,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
});
