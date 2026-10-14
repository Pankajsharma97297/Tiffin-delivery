import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowLeftIcon } from './ArrowLeftIcon';
import { colors } from '../theme/colors';
export function PageHeader({ title, subtitle, topInset, onBack, onForward }) {
  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: Math.max(48, topInset + 16),
        },
      ]}
    >
      <Pressable onPress={onBack} hitSlop={12} style={styles.iconButton}>
        <ArrowLeftIcon />
      </Pressable>
      <View style={styles.titleWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {onForward ? (
        <Pressable onPress={onForward} hitSlop={12} style={styles.iconButton}>
          <Text style={styles.iconText}>›</Text>
        </Pressable>
      ) : (
        <View style={styles.iconPlaceholder} />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  header: {
    minHeight: 150,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginHorizontal: -18,
    paddingHorizontal: 18,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: colors.orange,
  },
  iconButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  iconPlaceholder: {
    width: 34,
    height: 34,
  },
  iconText: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '500',
  },
  titleWrap: {
    flex: 1,
    paddingTop: 6,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 6,
    color: '#fff',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
});
