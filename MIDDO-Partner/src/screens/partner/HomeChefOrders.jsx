import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { homeChefStatusFlow } from '../../data/partnerData';
import { useTheme } from '../../context/ThemeContext';
import {
  OrderCard,
  ScreenTitle,
  SearchPill,
  SegmentRow,
  SmallButton,
} from '../../components/partner';

export function HomeChefOrders({ capacityReached, onAdvanceStatus, orders }) {
  const { themeColors } = useTheme();

  return (
    <>
      <ScreenTitle title="Order Management" />
      <SearchPill placeholder="Search orders, customers..." />
      <SegmentRow items={['Today', 'Upcoming', 'Trial', 'Subs']} />
      {!orders.length ? <Text style={[styles.emptyText, { color: themeColors.muted }]}>No live orders assigned yet.</Text> : null}
      {capacityReached ? (
        <Text style={styles.capacityText}>
          Daily capacity reached. New orders are stopped until capacity is increased.
        </Text>
      ) : null}
      {orders.map(order => {
        const nextStatus = homeChefStatusFlow[order.status];
        const isAcceptBlocked = capacityReached && order.status === 'New Order';

        return (
          <OrderCard
            key={order.id}
            amount={'Rs. ' + order.amount}
            meta={'#' + order.id + ' - ' + order.slot}
            status={order.status}
            subtitle={order.meal}
            tag={order.type}
            title={order.customer}
          >
            {nextStatus ? (
              <SmallButton
                disabled={isAcceptBlocked}
                full
                label={isAcceptBlocked ? 'Capacity Full' : 'Move to ' + nextStatus}
                onPress={() => onAdvanceStatus(order.id)}
              />
            ) : null}
          </OrderCard>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  capacityText: {
    color: '#c0392b',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 18,
    textAlign: 'center',
  },
});
