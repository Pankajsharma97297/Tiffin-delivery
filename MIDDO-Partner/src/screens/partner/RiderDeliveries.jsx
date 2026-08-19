import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { riderStatusFlow } from '../../data/partnerData';
import { DeliveryCard, SearchPill, SegmentRow } from '../../components/partner';
import { useTheme } from '../../context/ThemeContext';

export function RiderDeliveries({ deliveries, deliveryHistory = [], onAdvanceStatus, onCall, onMaps }) {
  const { darkMode, themeColors } = useTheme();
  const [activeSegment, setActiveSegment] = useState(0);

  // Active = not yet Delivered
  const activeDeliveries = deliveries.filter(delivery => delivery.status !== 'Delivered');

  // History = passed-in history prop (persisted delivered orders) + any Delivered in current list
  const completedInCurrent = deliveries.filter(delivery => delivery.status === 'Delivered');
  const historyDeliveries = useMemo(() => {
    // Merge persisted history with any currently-delivered orders (dedup by id)
    const historyIds = new Set(deliveryHistory.map(d => d.id));
    const extra = completedInCurrent.filter(d => !historyIds.has(d.id));
    return [...deliveryHistory, ...extra];
  }, [deliveryHistory, completedInCurrent]);

  const batchGroups = useMemo(() => {
    return activeDeliveries.reduce((groups, delivery) => {
      const group = groups[delivery.batch] || [];
      return { ...groups, [delivery.batch]: [...group, delivery] };
    }, {});
  }, [activeDeliveries]);

  const renderDeliveryCard = delivery => {
    const nextStatus = riderStatusFlow[delivery.status];
    return (
      <DeliveryCard
        key={delivery.id}
        delivery={delivery}
        nextStatus={nextStatus}
        onAdvanceStatus={onAdvanceStatus}
        onCall={onCall}
        onMaps={onMaps}
      />
    );
  };

  const renderHistoryCard = delivery => {
    // History cards — no advance button (already Delivered)
    return (
      <DeliveryCard
        key={delivery.id}
        delivery={delivery}
        nextStatus={null}
        onAdvanceStatus={null}
        onCall={onCall}
        onMaps={onMaps}
      />
    );
  };

  const searchBandBg = darkMode ? '#121e28' : '#279fda';

  return (
    <>
      <View style={[styles.searchBand, { backgroundColor: searchBandBg }]}>
        <SearchPill delivery placeholder="Search deliveries..." />
      </View>
      <SegmentRow
        activeIndex={activeSegment}
        delivery
        items={['Active', 'Batch', 'History']}
        onSelect={setActiveSegment}
      />

      {activeSegment === 0 ? (
        activeDeliveries.length > 0
          ? activeDeliveries.map(renderDeliveryCard)
          : <Text style={[styles.emptyText, { color: themeColors.muted }]}>No active deliveries right now.</Text>
      ) : null}

      {activeSegment === 1 ? (
        Object.keys(batchGroups).length > 0 ? (
          Object.entries(batchGroups).map(([batch, batchDeliveries]) => (
            <View key={batch}>
              <View style={[styles.batchSummary, darkMode ? { backgroundColor: '#10202e', borderColor: '#1a3045' } : null]}>
                <View style={styles.batchTitleRow}>
                  <Text style={[styles.batchTitle, darkMode ? { color: '#38bdf8' } : null]}>Batch {batch}</Text>
                  <Text style={[styles.batchCount, darkMode ? { backgroundColor: '#163550', color: '#7dd3fc' } : null]}>{batchDeliveries.length} deliveries</Text>
                </View>
                <Text style={[styles.batchMeta, { color: themeColors.muted }]}>
                  {batchDeliveries.map(delivery => delivery.pickup).filter((pickup, index, list) => list.indexOf(pickup) === index).join(' · ')}
                </Text>
                <Text style={styles.batchAmount}>₹{batchDeliveries.reduce((sum, delivery) => sum + delivery.amount, 0)} route earning</Text>
              </View>
              {batchDeliveries.map(renderDeliveryCard)}
            </View>
          ))
        ) : <Text style={[styles.emptyText, { color: themeColors.muted }]}>No batch deliveries assigned.</Text>
      ) : null}

      {activeSegment === 2 ? (
        historyDeliveries.length > 0 ? (
          <>
            <View style={styles.historyHeader}>
              <Text style={[styles.historyTitle, { color: themeColors.ink }]}>Delivered Orders ({historyDeliveries.length})</Text>
              <Text style={styles.historyEarning}>
                ₹{historyDeliveries.reduce((sum, d) => sum + (d.amount || 0), 0)} total
              </Text>
            </View>
            {historyDeliveries.map(renderHistoryCard)}
          </>
        ) : (
          <Text style={[styles.emptyText, { color: themeColors.muted }]}>No completed deliveries yet.</Text>
        )
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  searchBand: {
    marginHorizontal: -14,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  batchTitle: {
    color: '#1167ff',
    fontSize: 15,
    fontWeight: '900',
  },
  batchTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  batchAmount: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 7,
  },
  batchCount: {
    backgroundColor: '#dcebff',
    borderRadius: 999,
    color: '#1167ff',
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  batchMeta: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 7,
  },
  batchSummary: {
    backgroundColor: '#f7fbff',
    borderColor: '#cfe8ff',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 18,
    textAlign: 'center',
  },
  historyEarning: {
    color: '#22c55e',
    fontSize: 13,
    fontWeight: '900',
  },
  historyHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
});
