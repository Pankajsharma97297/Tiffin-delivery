import React from 'react';
import { Image, Text, View, StyleSheet } from 'react-native';
import { Icons } from '../../theme/images';
import { StatsGrid } from './StatsGrid';
import { colors } from '../../theme/colors';

export function KitchenMockup() {
  return (
    <View style={styles.mockupCard}>
      <View style={styles.mockupHeader}>
        <Text style={styles.mockupTitle}>HomeChef Dashboard</Text>
        <Text style={styles.mockupBadge}>Open</Text>
      </View>
      <StatsGrid compact items={[["Today's Orders", '8'], ['Earnings', '₹640'], ['Pending', '3'], ['Kitchen', 'Open']]} />
      <View style={styles.weekStrip}>
        <View style={styles.weekIconBox}>
          <Image source={Icons.Calendar} style={styles.weekIcon} />
        </View>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <Text key={day} style={styles.weekDay}>{day}</Text>)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mockupBadge: {
    backgroundColor: colors.greenSoft,
    borderRadius: 6,
    color: colors.green,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  mockupCard: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 15,
    borderWidth: 1,
    elevation: 4,
    marginTop: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  mockupHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  mockupTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  weekDay: {
    backgroundColor: '#fff8f2',
    borderRadius: 8,
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 7,
    paddingVertical: 6,
  },
  weekIcon: {
    height: 13,
    tintColor: colors.orange,
    width: 13,
  },
  weekIconBox: {
    alignItems: 'center',
    backgroundColor: colors.orangeSoft,
    borderRadius: 8,
    height: 27,
    justifyContent: 'center',
    width: 27,
  },
  weekStrip: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
});
