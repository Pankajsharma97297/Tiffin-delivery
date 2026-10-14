import React, { useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { styles } from './homeStyles';

export function CheckoutSheet({
  address,
  bottomInset,
  chef,
  ordering,
  paymentMethod,
  onAddressChange,
  onClose,
  onPaymentMethodChange,
  onPlaceOrder,
  paymentMethods,
}) {
  const { themeColors } = useTheme();
  const canPay = address.trim().length > 8;
  const availablePaymentMethods = paymentMethods || [];
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const keyboardLift =
    Platform.OS === 'android' ? Math.max(0, keyboardHeight - bottomInset) : 0;
  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', event => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);
  return (
    <View style={styles.sheetOverlay}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? bottomInset : 0}
        style={[
          styles.keyboardAvoider,
          {
            paddingBottom: keyboardLift,
          },
        ]}
      >
        <View
          style={[
            styles.checkoutSheet,
            { backgroundColor: themeColors.card },
            keyboardHeight > 0 ? styles.checkoutSheetKeyboardOpen : undefined,
          ]}
        >
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.checkoutSheetContent,
              {
                paddingBottom: Math.max(22, bottomInset + 18),
              },
            ]}
          >
            <View style={styles.sheetTitleRow}>
              <Text style={styles.sheetTitle}>Checkout</Text>
              <Pressable onPress={onClose} style={styles.sheetClose}>
                <Text style={styles.sheetCloseText}>×</Text>
              </Pressable>
            </View>

            <View style={styles.checkoutStepper}>
              <Text style={styles.stepDone}>1 Browse Meals</Text>
              <Text style={styles.stepDone}>2 Add to Cart</Text>
              <Text style={styles.stepActive}>3 Checkout</Text>
            </View>

            <View style={styles.cartCard}>
              <Text style={styles.cartLabel}>Cart</Text>
              <View style={styles.cartRow}>
                <Text style={styles.cartIcon}>{chef.image}</Text>
                <View style={styles.cartCopy}>
                  <Text style={styles.cartTitle}>{chef.cuisine} Tiffin</Text>
                  <Text style={styles.cartMeta}>
                    {chef.name} · {chef.time}
                  </Text>
                  {chef.tags?.length ? (
                    <Text style={styles.cartTags}>
                      {chef.tags.join(' · ')}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.cartPrice}>
                  {String(chef.price || '').replace('/meal', '')}
                </Text>
              </View>
            </View>

            <Text style={styles.checkoutLabel}>Delivery Address</Text>
            <TextInput
              multiline
              returnKeyType="done"
              scrollEnabled={false}
              value={address}
              onChangeText={onAddressChange}
              placeholder="Enter complete delivery address"
              placeholderTextColor="#9b8d86"
              style={styles.addressInput}
            />

            <Text style={styles.checkoutLabel}>Payment Method</Text>
            <View style={styles.paymentGrid}>
              {availablePaymentMethods.map(method => (
                <Pressable
                  key={method}
                  onPress={() => onPaymentMethodChange(method)}
                  style={[
                    styles.paymentOption,
                    paymentMethod === method
                      ? styles.paymentOptionActive
                      : undefined,
                  ]}
                >
                  <Text
                    style={[
                      styles.paymentOptionText,
                      paymentMethod === method
                        ? styles.paymentOptionTextActive
                        : undefined,
                    ]}
                  >
                    {method}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.noCodText}>
              COD removed · online payment only
            </Text>

            <Pressable
              disabled={!canPay || ordering}
              onPress={onPlaceOrder}
              style={[
                styles.sheetPrimaryButton,
                !canPay || ordering ? styles.sheetDisabled : undefined,
              ]}
            >
              <Text
                style={[
                  styles.sheetPrimaryText,
                  !canPay || ordering ? styles.sheetDisabledText : undefined,
                ]}
              >
                {ordering
                  ? 'Placing Order...'
                  : `Pay & Place Order · ${String(chef.price || '').replace(
                      '/meal',
                      '',
                    )}`}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
