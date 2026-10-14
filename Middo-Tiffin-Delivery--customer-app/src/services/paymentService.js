import RazorpayCheckout from 'react-native-razorpay';
import { paymentConfig } from '../config/payment';
function parseAmountToPaise(amount) {
  const rupees = Number(String(amount).replace(/[^\d.]/g, ''));
  if (!Number.isFinite(rupees) || rupees <= 0) {
    throw new Error('Invalid payment amount');
  }
  return Math.round(rupees * 100);
}
function getPaymentErrorMessage(error) {
  const razorpayError = error;
  return (
    razorpayError?.description ||
    razorpayError?.reason ||
    'Payment failed or was cancelled. Please try again.'
  );
}
export async function startRazorpayPayment({
  amount,
  contact = '9876543210',
  customerName,
  description,
  email = 'customer@middo.test',
  paymentMethod = 'UPI',
}) {
  const shouldOpenNativeCheckout =
    paymentConfig.useNativeCheckout ||
    ['Credit Card', 'Debit Card', 'Net Banking'].includes(paymentMethod);
  if (!shouldOpenNativeCheckout) {
    await new Promise(resolve => setTimeout(resolve, 450));
    return {
      razorpay_order_id: `order_mock_${Date.now()}`,
      razorpay_payment_id: `pay_mock_${Date.now()}`,
      razorpay_signature: 'mock_signature',
    };
  }
  try {
    const method =
      paymentMethod === 'Net Banking'
        ? {
            card: false,
            netbanking: true,
            upi: false,
            wallet: false,
          }
        : paymentMethod === 'Credit Card' || paymentMethod === 'Debit Card'
        ? {
            card: true,
            netbanking: false,
            upi: false,
            wallet: false,
          }
        : {
            card: false,
            netbanking: false,
            upi: true,
            wallet: false,
          };
    return await RazorpayCheckout.open({
      amount: parseAmountToPaise(amount),
      currency: 'INR',
      description,
      key: paymentConfig.razorpayKeyId,
      method,
      name: 'MIDDO',
      prefill: {
        contact,
        email,
        name: customerName,
      },
      theme: {
        color: '#ff6a00',
      },
    });
  } catch (error) {
    throw new Error(getPaymentErrorMessage(error));
  }
}
