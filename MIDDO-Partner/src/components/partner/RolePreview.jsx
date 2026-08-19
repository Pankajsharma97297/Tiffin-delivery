import React from 'react';
import { Image, Text, View, StyleSheet } from 'react-native';
import { roleOptions } from '../../data/partnerData';
import { colors } from '../../theme/colors';

export function RolePreview({ compact, onOrange }) {
  return (
    <View style={[styles.rolePreview, compact ? styles.rolePreviewCompact : null]}>
      {roleOptions.map(role => (
        <View key={role.key} style={[styles.rolePreviewCard, onOrange ? styles.rolePreviewCardOrange : null]}>
          <View style={styles.roleIconBox}>
            <Image source={role.icon} style={styles.rolePreviewIcon} />
          </View>
          <Text style={[styles.rolePreviewTitle, onOrange ? styles.rolePreviewTitleOrange : null]}>{role.label}</Text>
          <Text style={[styles.rolePreviewCopy, onOrange ? styles.rolePreviewCopyOrange : null]}>{role.subtitle}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  roleIconBox: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.orangeSoft,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    marginBottom: 12,
    width: 56,
  },
  rolePreview: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
    width: '100%',
  },
  rolePreviewCard: {
    backgroundColor: colors.white,
    borderColor: '#eee0d7',
    borderRadius: 15,
    borderWidth: 1,
    // elevation: 3,
    flex: 1,
    minHeight: 170,
    padding: 14,
    // shadowColor: '#000',
    // shadowOffset: { height: 5, width: 0 },
    // shadowOpacity: 0.07,
    // // shadowRadius: 14,
  },
  rolePreviewCardOrange: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderColor: 'rgba(255,255,255,0.26)',
    minHeight: 148,
  },
  rolePreviewCompact: {
    gap: 18,
    marginTop: 0,
    width: '84%',
  },
  rolePreviewCopy: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  rolePreviewCopyOrange: {
    color: colors.white,
    opacity: 0.9,
  },
  rolePreviewIcon: {
    height: 28,
    tintColor: colors.orange,
    width: 28,
  },
  rolePreviewTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  rolePreviewTitleOrange: {
    color: colors.white,
  },
});
