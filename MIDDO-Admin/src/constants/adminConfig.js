export const navItems = [
  {key: 'dashboard', label: 'Dashboard', short: 'DB'},
  {key: 'reports', label: 'Reports', short: 'RP'},
  {key: 'performance', label: 'Performance', short: 'PF'},
  {key: 'commission', label: 'Commission', short: 'CM'},
  {key: 'orders', label: 'Orders', short: 'OR'},
  {key: 'kyc', label: 'KYC', short: 'KY'},
  {key: 'subscriptions', label: 'Subscriptions', short: 'SB'},
  {key: 'homeChefs', label: 'HomeChefs', short: 'HC'},
  {key: 'customers', label: 'Customers', short: 'CU'},
  {key: 'admins', label: 'Admins', short: 'AD'},
  {key: 'schedule', label: 'Schedule', short: 'SC'},
  {key: 'plans', label: 'Plans', short: 'PL'},
  {key: 'wallet', label: 'Wallet', short: 'WL'},
  {key: 'reviews', label: 'Reviews', short: 'RV'},
  {key: 'support', label: 'Support', short: 'SP'},
  {key: 'notifications', label: 'Notifications', short: 'NT'},
  {key: 'superAdmin', label: 'Super Admin', short: 'SA'},
];

export const initialHomeChefForm = {
  image: '',
  name: '',
  owner: '',
  email: '',
  phone: '',
  badge: '',
  cuisine: '',
  tags: '',
  rating: '',
  reviewCount: '',
  distance: '',
  location: '',
  address: '',
  liveAddress: '',
  latitude: '',
  longitude: '',
  time: '',
  experience: '',
  subscribers: '',
  price: '',
  about: '',
  fssaiStatus: '',
  foodType: '',
  achievement: '',
  hygieneRating: '',
  orders: '',
  status: 'Active',
  weeklyMenu: '[]',
  sampleMenu: '[]',
};

export const initialCategoryForm = {
  icon: '',
  label: '',
  sortOrder: '',
};

export const initialAdminForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'admin',
  isActive: true,
};

export const initialPlanForm = {
  name: '',
  durationDays: 7,
  meals: '',
  price: '',
  users: 0,
  status: 'Visible',
};

export const accountRoleOptions = [
  {value: 'super_admin', label: 'Super Admin'},
  {value: 'admin', label: 'Admin'},
  {value: 'homechefs', label: 'Homechefs / HomeChef'},
  {value: 'rider', label: 'Rider'},
  {value: 'customer', label: 'Customer'},
];

export const managedTables = [
  {key: 'products', label: 'Products'},
  {key: 'categories', label: 'Categories'},
  {key: 'homeChefs', label: 'Home Chefs'},
  {key: 'homeChefChangeRequests', label: 'HomeChef Change Requests'},
  {key: 'homeChefChangeSettings', label: 'HomeChef Change Settings'},
  {key: 'meals', label: 'Home Meals'},
  {key: 'scheduleItems', label: 'Meal Schedule'},
  {key: 'plans', label: 'Subscription Plans'},
  {key: 'orders', label: 'Orders'},
  {key: 'subscriptions', label: 'Subscriptions'},
  {key: 'subscriptionRequests', label: 'Subscription Requests'},
  {key: 'customers', label: 'Customers'},
  {key: 'notifications', label: 'Notifications'},
  {key: 'walletTransactions', label: 'Wallet Transactions'},
  {key: 'reviews', label: 'Reviews'},
  {key: 'supportTickets', label: 'Support Tickets'},
];

export const registerRoles = [
  {value: 'customer', label: 'User / Customer'},
  {value: 'homechefs', label: 'Homechefs'},
  {value: 'rider', label: 'Rider'},
];

export const mealTypeOptions = ['Breakfast', 'Lunch', 'Dinner', 'Lunch + Dinner', 'Weekly Tiffin'];
export const productIconOptions = ['🍛', '🥘', '🍚', '🍱', '🥗', '🍲', '🫓', '🥙', '🍽️'];
export const productTagOptions = [
  'Veg, Home Style',
  'Veg, Healthy',
  'Veg, Punjabi',
  'Veg, South Indian',
  'Jain, Veg',
  'South Indian, Veg',
  'Healthy, Low Oil',
  'Bestseller, Home Style',
];
export const productStatusOptions = ['Active', 'Draft', 'Review', 'Hidden'];
export const trackingStatuses = ['Order Confirmed', 'Preparing', 'Ready', 'Out For Delivery', 'Delivered'];

export const permissionActions = ['create', 'read', 'update', 'delete'];
export const permissionLabelMap = {
  admins: 'Admins',
  categories: 'Categories',
  customers: 'Customers',
  homeChefs: 'HomeChefs',
  meals: 'Meals',
  notifications: 'Notifications',
  orders: 'Orders',
  plans: 'Plans',
  products: 'Products',
  reviews: 'Reviews',
  scheduleItems: 'Schedule Items',
  subscriptions: 'Subscriptions',
  subscriptionRequests: 'Subscription Requests',
  supportTickets: 'Support Tickets',
  walletTransactions: 'Wallet Transactions',
};
export const permissionGroups = [
  {key: 'admins', label: 'Admins'},
  ...managedTables,
].map(table => ({
  key: table.key,
  label: permissionLabelMap[table.key] || table.label,
  permissions: permissionActions.map(action => `${table.key}:${action}`),
}));
export const allPermissionKeys = permissionGroups.flatMap(group => group.permissions);
