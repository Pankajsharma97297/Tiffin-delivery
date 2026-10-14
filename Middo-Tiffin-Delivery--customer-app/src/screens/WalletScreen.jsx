import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ArrowLeftIcon } from '../components/ArrowLeftIcon';
import { useTheme } from '../context/ThemeContext';
import { BottomNav } from '../components/BottomNav';
import { fetchHomeData } from '../services/homeApi';
import { startRazorpayPayment } from '../services/paymentService';
import { fetchWalletTransactions, topUpWallet } from '../services/walletApi';
import { colors } from '../theme/colors';
import { Icons } from '../theme/images';
export function WalletScreen({
  topInset,
  bottomInset,
  onNavigate,
  onBackHome,
}) {
  const { darkMode, themeColors } = useTheme();
  const [customer, setCustomer] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [localTransactions, setLocalTransactions] = useState([]);
  const balance = Number(customer?.walletBalance || 0);
  useEffect(() => {
    fetchHomeData()
      .then(data => {
        setCustomer(data.customer);
        return fetchWalletTransactions({
          customer: data.customer?.name,
          email: data.customer?.email,
          phone: data.customer?.phone,
        });
      })
      .then(rows => {
        setLocalTransactions(
          rows.map(row => {
            const isCredit = String(row.amount || '').startsWith('+');
            return [
              isCredit ? Icons.TransitionIn : Icons.TransitionOut,
              row.type || 'Wallet',
              row.note || '',
              row.amount || '₹0',
              isCredit ? 'green' : 'red',
              row._id,
            ];
          }),
        );
      })
      .catch(() => undefined);
  }, []);
  const addBalance = async amountLabel => {
    const numericAmount = Number(String(amountLabel).replace(/[^\d.]/g, ''));
    if (!numericAmount || numericAmount <= 0) {
      Alert.alert('Wallet', 'Please enter a valid amount.');
      return;
    }
    setIsAdding(true);
    try {
      const payment = await startRazorpayPayment({
        amount: `₹${numericAmount}`,
        contact: customer?.phone,
        customerName: customer?.name || '',
        description: 'MIDDO wallet top-up',
        email: customer?.email,
        paymentMethod: 'UPI',
      });
      const result = await topUpWallet({
        amount: `₹${numericAmount}`,
        customer: customer?.name,
        email: customer?.email,
        note: 'Top-up via UPI',
        paymentId: payment.razorpay_payment_id,
        paymentMethod: 'UPI',
        phone: customer?.phone,
      });
      setCustomer(result.customer);
      setLocalTransactions(current => [
        [
          Icons.TransitionIn,
          'Top-up via UPI',
          'Added to wallet · just now',
          `+₹${numericAmount}`,
          'green',
        ],
        ...current,
      ]);
      setCustomAmount('');
      Alert.alert('Wallet updated', `₹${numericAmount} added to wallet.`);
    } catch (error) {
      Alert.alert(
        'Top-up failed',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsAdding(false);
    }
  };
  return (
    <View style={[styles.screen, { backgroundColor: themeColors.surface }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(96, bottomInset + 84),
          },
        ]}
        showsVerticalScrollIndicator
      >
        <View
          style={[
            styles.walletHero,
            {
              paddingTop: Math.max(48, topInset + 16),
            },
          ]}
        >
          <View style={styles.heroTop}>
            <Pressable
              onPress={onBackHome}
              hitSlop={12}
              style={styles.backButton}
            >
              <ArrowLeftIcon />
            </Pressable>
            <Text style={styles.heroTitle}>Middo Wallet</Text>
            <View style={styles.heroSpacer} />
          </View>

          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balance}>₹{balance}</Text>
            <Text style={styles.updated}>Updated just now</Text>
          </View>

          <Text style={styles.quickLabel}>Quick Add</Text>
          <View style={styles.quickRow}>
            {['₹100', '₹200', '₹500', '₹1000'].map(amount => (
              <Pressable
                disabled={isAdding}
                key={amount}
                onPress={() => addBalance(amount)}
                style={styles.quickAmount}
              >
                <Text style={styles.quickAmountText}>{amount}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View
          style={[
            styles.addRow,
            {
              backgroundColor: themeColors.card,
              borderColor: themeColors.line,
            },
          ]}
        >
          <Text style={styles.plus}>＋</Text>
          <TextInput
            keyboardType="number-pad"
            onChangeText={setCustomAmount}
            placeholder="Enter custom amount to add"
            placeholderTextColor={themeColors.placeholder}
            style={[styles.addInput, { color: themeColors.text }]}
            value={customAmount}
          />
          <Pressable
            disabled={isAdding}
            onPress={() => addBalance(customAmount)}
            style={styles.addButton}
          >
            <Text style={styles.addText}>{isAdding ? 'Adding...' : 'Add'}</Text>
          </Pressable>
        </View>
        <View
          style={[
            styles.groupCard,
            {
              backgroundColor: themeColors.cardHighlight,
              borderColor: themeColors.line,
            },
          ]}
        >
          <Image
            source={Icons.Gift}
            style={[
              styles.gift,
              darkMode ? styles.giftDark : styles.giftLight,
            ]}
          />
          <View style={styles.groupCopy}>
            <Text style={[styles.groupTitle, { color: themeColors.text }]}>
              Create Group & Get Extra Discount
            </Text>
            <Text style={[styles.groupBody, { color: themeColors.muted }]}>
              Invite friends to join your tiffin group and unlock exclusive
              group discounts on your subscription!
            </Text>
          </View>
          <Pressable style={styles.createButton}>
            <Text style={styles.createText}>Create</Text>
          </Pressable>
        </View>
        <Text style={[styles.sectionTitle, { color: themeColors.surfaceText }]}>Transaction History</Text>
        <View style={styles.txList}>
          {localTransactions.length ? localTransactions.map(
            ([icon, title, sub, amount, tone, id], index) => (
              <View
                key={id || `${title}-${sub}-${amount}-${index}`}
                style={[
                  styles.txCard,
                  {
                    backgroundColor: themeColors.card,
                    borderColor: themeColors.line,
                  },
                ]}
              >
                <View
                  style={[
                    styles.txIcon,
                    tone === 'green' ? styles.greenBg : styles.redBg,
                  ]}
                >
                  <Image
                    source={icon}
                    style={[
                      styles.txIconImage,
                      tone === 'green'
                        ? styles.txIconImageGreen
                        : styles.txIconImageRed,
                    ]}
                  />
                </View>
                <View style={styles.txCopy}>
                  <Text style={[styles.txTitle, { color: themeColors.text }]}>
                    {title}
                  </Text>
                  <Text style={[styles.txSub, { color: themeColors.muted }]}>
                    {sub}
                  </Text>
                </View>
                <Text
                  style={
                    tone === 'green' ? styles.amountGreen : styles.amountRed
                  }
                >
                  {amount}
                </Text>
              </View>
            ),
          ) : (
            <Text style={[styles.emptyText, { color: themeColors.muted }]}>
              No wallet transactions yet.
            </Text>
          )}
        </View>
      </ScrollView>
      <BottomNav
        activeTab="wallet"
        bottomInset={bottomInset}
        onNavigate={onNavigate}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    paddingHorizontal: 18,
  },
  walletHero: {
    marginHorizontal: -18,
    paddingHorizontal: 18,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: colors.orange,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  heroTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
  },
  heroSpacer: {
    width: 34,
    height: 34,
  },
  balanceCard: {
    marginTop: 18,
    marginHorizontal: 0,
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  balanceLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  balance: {
    marginTop: 6,
    color: '#fff',
    fontSize: 36,
    fontWeight: '900',
  },
  updated: {
    marginTop: 4,
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  quickLabel: {
    marginTop: 16,
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  quickAmount: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.26)',
  },
  quickAmountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  addRow: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  plus: {
    color: colors.orange,
    fontSize: 18,
  },
  addInput: {
    flex: 1,
    minHeight: 42,
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
  },
  addButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.orange,
  },
  addText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
  groupCard: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    minHeight: 118,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ffc5ae',
    borderRadius: 16,
    backgroundColor: '#fff0e8',
  },
  gift: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  giftLight: {
    tintColor: colors.orange,
  },
  giftDark: {
    tintColor: '#ffb58f',
  },
  groupCopy: {
    flex: 1,
  },
  groupTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  groupBody: {
    marginTop: 6,
    color: '#666',
    fontSize: 12,
    lineHeight: 18,
  },
  createButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#ffe1d6',
  },
  createText: {
    color: colors.orange,
    fontSize: 11,
    fontWeight: '900',
  },
  sectionTitle: {
    marginTop: 22,
    marginBottom: 10,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  txList: {
    gap: 10,
  },
  emptyText: {
    paddingVertical: 16,
    color: '#777',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  txIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  txIconImage: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
  txIconImageGreen: {
    tintColor: '#0aa64f',
  },
  txIconImageRed: {
    tintColor: '#ff4e4e',
  },
  greenBg: {
    color: '#0aa64f',
    backgroundColor: '#e9fbef',
  },
  redBg: {
    color: '#ff4e4e',
    backgroundColor: '#fff0f0',
  },
  txCopy: {
    flex: 1,
  },
  txTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  txSub: {
    marginTop: 3,
    color: '#777',
    fontSize: 11,
  },
  amountGreen: {
    color: '#00a64f',
    fontSize: 13,
    fontWeight: '900',
  },
  amountRed: {
    color: '#ff3b3b',
    fontSize: 13,
    fontWeight: '900',
  },
});
