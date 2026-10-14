import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { styles } from './homeStyles';

export function GroupOrderSheet({
  bottomInset,
  joinCode,
  mode,
  onClose,
  onDone,
  onGenerate,
  onCopyInvite,
  onJoinCodeChange,
  inviteCopied,
}) {
  const canJoin = joinCode.trim().length > 0;
  return (
    <View style={styles.sheetOverlay}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View
        style={[
          styles.groupSheet,
          {
            paddingBottom: Math.max(22, bottomInset + 14),
          },
        ]}
      >
        <View style={styles.sheetTitleRow}>
          <Text style={styles.sheetTitle}>
            {mode === 'join' ? 'Join a Group Order' : 'Create Group Order'}
          </Text>
          <Pressable onPress={onClose} style={styles.sheetClose}>
            <Text style={styles.sheetCloseText}>×</Text>
          </Pressable>
        </View>

        {mode === 'create' ? (
          <>
            <View style={styles.rulesBox}>
              <Text style={styles.rulesTitle}>Group Order Rules</Text>
              <Text style={styles.rulesText}>
                • Minimum 5 members required to activate group discount
              </Text>
              <Text style={styles.rulesText}>
                • All members must be within 500m delivery radius
              </Text>
              <Text style={styles.rulesText}>
                • If a member skips, discount is recalculated for remaining
                members
              </Text>
            </View>
            <Pressable onPress={onGenerate} style={styles.sheetPrimaryButton}>
              <Text style={styles.sheetPrimaryText}>Generate Invite Code</Text>
            </Pressable>
          </>
        ) : null}

        {mode === 'invite' ? (
          <>
            <View style={styles.inviteBox}>
              <Text style={styles.inviteLabel}>Your Group Invite Code</Text>
              <Text style={styles.inviteCode}>MIDDO-4K2X9</Text>
              <Text style={styles.inviteHelp}>
                Share this with friends to join your group
              </Text>
            </View>
            <Pressable onPress={onCopyInvite} style={styles.copyBox}>
              <Text style={styles.copyCode}>MIDDO-4K2X9</Text>
              <Text style={styles.copyText}>
                {inviteCopied ? '✓ Copied' : '▢ Copy'}
              </Text>
            </Pressable>
            <View style={styles.memberBox}>
              <Text style={styles.memberText}>
                ⚭ 1 / 5 members joined — discount pending
              </Text>
            </View>
            <Pressable onPress={onDone} style={styles.sheetPrimaryButton}>
              <Text style={styles.sheetPrimaryText}>Done</Text>
            </Pressable>
          </>
        ) : null}

        {mode === 'join' ? (
          <>
            <Text style={styles.joinBody}>
              Enter the invite code shared by your friend. You must be within a
              500-meter delivery radius to join.
            </Text>
            <View style={styles.joinInputWrap}>
              <Text style={styles.joinIcon}>⚭</Text>
              <TextInput
                value={joinCode}
                onChangeText={onJoinCodeChange}
                placeholder="Enter invite code (e.g. MIDDO-4K2X9)"
                placeholderTextColor="#a35d00"
                style={styles.joinInput}
              />
            </View>
            <Pressable
              disabled={!canJoin}
              onPress={onDone}
              style={[
                styles.sheetPrimaryButton,
                !canJoin ? styles.sheetDisabled : undefined,
              ]}
            >
              <Text
                style={[
                  styles.sheetPrimaryText,
                  !canJoin ? styles.sheetDisabledText : undefined,
                ]}
              >
                Join Group
              </Text>
            </Pressable>
          </>
        ) : null}
      </View>
    </View>
  );
}
