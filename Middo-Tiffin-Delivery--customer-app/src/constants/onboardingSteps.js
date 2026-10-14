import { Icons, Images } from '../theme/images';

export const onboardingSteps = [
  {
    screen: 1,
    eyebrow: 'STEP 1 OF 3',
    title: 'Fresh Tiffin,\nEvery Day',
    body: 'Enjoy home-style meals crafted by local tiffin vendors. Healthy, hygienic, and delivered right to your door.',
    image:Images.Step1,
    badges: true,
    chips: [
      {
        icon: '🥗',
        label: 'Healthy',
      },
      {
        icon: '🏠',
        label: 'Home-style',
      },
      {
        icon: '⚡',
        label: 'Daily Fresh',
      },
    ],
  },
  {
    screen: 2,
    eyebrow: 'STEP 2 OF 3',
    title: 'Near You,\nAlways',
    body: 'Discover tiffin vendors within 6-7 km of your location. Save multiple addresses and switch anytime - vendors refresh automatically.',
        image:Images.Step2,
    imageWide: true,
    features: [
      {
        icon: Icons.Location,
        label: 'Location-based vendor discovery',
      },
      {
        icon: Icons.Home,
        label: 'Multiple saved addresses',
      },
      {
        icon: Icons.Sync,
        label: 'Auto-refresh on address change',
      },
    ],
  },
  {
    screen: 3,
    eyebrow: 'STEP 3 OF 3',
    title: 'Total Control,\nZero Stress',
    body: "Track your tiffin live, skip meals when you're away, and pay seamlessly. Your subscription, your rules.",
        image:Images.Step3,
    imageWide: true,
    features: [
      {
         icon: Icons.Pickup,
        label: 'Real-time delivery tracking',
      },
      {
         icon: Icons.Calendar,
        label: 'Skip meals anytime, hassle-free',
      },
      {
        icon: Icons.CreditCard,
        label: 'Secure wallet & easy payments',
      },
    ],
  },
];
