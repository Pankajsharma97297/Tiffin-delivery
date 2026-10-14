import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { styles } from './homeStyles';

export function ActiveSubscriptionCard({ subscription }) {
  const { themeColors } = useTheme();
  if (!subscription) {
    return null;
  }
  const chefLabel =
    subscription.homeChefOwner && subscription.homeChefName
      ? `${subscription.homeChefOwner} · ${subscription.homeChefName}`
      : subscription.homeChefName;
  return (
    <View
      style={[
        styles.subscriptionCard,
        { backgroundColor: themeColors.card, borderColor: themeColors.line },
      ]}
    >
      <View>
        <Text style={styles.subscriptionLabel}>Active Plan</Text>
        {subscription.plan ? (
          <Text style={[styles.subscriptionTitle, { color: themeColors.text }]}>
            {subscription.plan}
          </Text>
        ) : null}
        {chefLabel ? (
          <Text style={styles.subscriptionMeta}>{chefLabel}</Text>
        ) : null}
        {subscription.address ? (
          <Text style={styles.subscriptionMeta}>{subscription.address}</Text>
        ) : null}
      </View>
      <View style={styles.subscriptionAmount}>
        <Text style={styles.subscriptionPrice}>
          {subscription.amount || '-'}
        </Text>
        <Text style={styles.subscriptionRenewal}>
          Renewal {subscription.renewal || '-'}
        </Text>
      </View>
    </View>
  );
}
