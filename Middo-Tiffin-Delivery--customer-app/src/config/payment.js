import { getEnv } from './env';

export const paymentConfig = {
  provider: 'Razorpay',
  razorpayKeyId: getEnv('MIDDO_RAZORPAY_KEY_ID', 'rzp_test_1sjnKZ3EsBduvp'),
  useNativeCheckout: getEnv('MIDDO_USE_NATIVE_CHECKOUT') === 'true',
};
