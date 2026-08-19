import { Icons, NavIcon } from '../theme/images';

export const roleOptions = [
  {
    key: 'homechef',
    icon: Icons.ChefCap,
    label: 'HomeChef',
    subtitle: 'Cook & earn from home',
  },
  {
    key: 'rider',
    icon: Icons.DeliveryTruck,
    label: 'Delivery',
    subtitle: 'Deliver & earn daily',
  },
];

export const homeChefStatusFlow = {
  'New Order': 'Accepted',
  Pending: 'Accepted',
  Accepted: 'Preparing',
  Preparing: 'Ready For Pickup',
  'Ready For Pickup': 'Completed',
};

export const riderStatusFlow = {
  Ready: 'Picked Up',
  Assigned: 'Picked Up',
  'Picked Up': 'Out for Delivery',
  'Out for Delivery': 'Delivered',
};

export const tabLabels = {
  alerts: 'Alerts',
  deliveries: 'Deliveries',
  earnings: 'Earnings',
  home: 'Home',
  orders: 'Orders',
  profile: 'Profile',
  settings: 'Settings',
};

export const tabIcons = {
  alerts: NavIcon.Alerts,
  deliveries: NavIcon.Deliveries,
  earnings: NavIcon.Earnings,
  home: NavIcon.Home,
  orders: NavIcon.Orders,
  profile: NavIcon.Profile,
};

export const onboardingScreens = [
  {
    title: 'Two Roles, One App',
    copy: 'Join as a HomeChef and cook delicious home meals, or sign up as a Delivery Partner and earn by delivering to customers daily.',
  },
  {
    title: 'Manage Your Kitchen',
    copy: 'View daily orders, manage weekly menu, track earnings, and control kitchen status from one dashboard.',
  },
  {
    title: 'Deliver Smart, Earn More',
    copy: 'See assigned deliveries, batch route order, customer calls, and Google Maps navigation from your phone.',
  },
];
