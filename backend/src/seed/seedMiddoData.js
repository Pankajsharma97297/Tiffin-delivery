require("dotenv").config();

const mongoose = require("mongoose");
const getMongoOptions = require("../config/mongoOptions");

const AppContent = require("../models/AppContent");
const Category = require("../models/Category");
const Customer = require("../models/Customer");
const HomeChef = require("../models/HomeChef");
const Meal = require("../models/Meal");
const Notification = require("../models/Notification");
const Order = require("../models/Order");
const Plan = require("../models/Plan");
const Product = require("../models/Product");
const Review = require("../models/Review");
const ScheduleItem = require("../models/ScheduleItem");
const Subscription = require("../models/Subscription");
const SuperAdmin = require("../models/SuperAdmin");
const SupportTicket = require("../models/SupportTicket");
const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");
const {
  getSeedSuperAdmin,
  getSeedUsers,
} = require("../config/seedCredentials");
const logger = require("../utils/logger");

const collections = [
  AppContent,
  Category,
  Customer,
  HomeChef,
  Meal,
  Notification,
  Order,
  Plan,
  Product,
  Review,
  ScheduleItem,
  Subscription,
  SuperAdmin,
  SupportTicket,
  User,
  WalletTransaction,
];

const weeklyMenus = {
  maaKiRasoi: [
    {
      day: "MON",
      icon: "🍛",
      title: "Dal Makhani Thali",
      items: "Dal, Roti, Rice, Salad",
      mealType: "Lunch",
      price: "₹99",
    },
    {
      day: "TUE",
      icon: "🥙",
      title: "Chole Bhature",
      items: "Chole, 2 Bhature, Pickle",
      mealType: "Lunch",
      price: "₹95",
    },
    {
      day: "WED",
      icon: "🍚",
      title: "Rajma Chawal",
      items: "Rajma, Steamed Rice, Papad",
      mealType: "Lunch",
      price: "₹89",
    },
    {
      day: "THU",
      icon: "🥘",
      title: "Kadhi Pakora",
      items: "Kadhi, Rice, Roti, Sabzi",
      mealType: "Lunch",
      price: "₹89",
    },
    {
      day: "FRI",
      icon: "🍲",
      title: "Paneer Butter Masala",
      items: "Paneer, Naan, Rice, Raita",
      mealType: "Dinner",
      price: "₹109",
    },
    {
      day: "SAT",
      icon: "🫓",
      title: "Aloo Paratha",
      items: "2 Parathas, Curd, Pickle, Butter",
      mealType: "Breakfast",
      price: "₹79",
    },
    {
      day: "SUN",
      icon: "🍱",
      title: "Special Thali",
      items: "Dal, Sabzi, Roti, Rice, Dessert",
      mealType: "Lunch",
      price: "₹119",
    },
  ],
  gharKaSwad: [
    {
      day: "MON",
      icon: "🍱",
      title: "Gujarati Dal Thali",
      items: "Dal, Rice, Roti, Shaak",
      mealType: "Lunch",
      price: "₹85",
    },
    {
      day: "TUE",
      icon: "🥗",
      title: "Jain Sabzi Box",
      items: "Jain sabzi, Roti, Rice, Salad",
      mealType: "Lunch",
      price: "₹82",
    },
    {
      day: "WED",
      icon: "🥘",
      title: "Kadhi Khichdi",
      items: "Kadhi, Khichdi, Papad",
      mealType: "Dinner",
      price: "₹75",
    },
    {
      day: "THU",
      icon: "🍛",
      title: "Sev Tameta Thali",
      items: "Sev tameta, Roti, Rice, Pickle",
      mealType: "Lunch",
      price: "₹88",
    },
    {
      day: "FRI",
      icon: "🍲",
      title: "Undhiyu Meal",
      items: "Undhiyu, Puri, Dal, Rice",
      mealType: "Lunch",
      price: "₹105",
    },
    {
      day: "SAT",
      icon: "🫓",
      title: "Thepla Combo",
      items: "Thepla, Curd, Pickle, Chutney",
      mealType: "Breakfast",
      price: "₹69",
    },
    {
      day: "SUN",
      icon: "🍽️",
      title: "Gujarati Special",
      items: "Dal, Kadhi, 2 Shaak, Roti, Rice",
      mealType: "Lunch",
      price: "₹115",
    },
  ],
  southSpice: [
    {
      day: "MON",
      icon: "🍚",
      title: "Sambar Rice Bowl",
      items: "Sambar rice, Poriyal, Papad",
      mealType: "Lunch",
      price: "₹75",
    },
    {
      day: "TUE",
      icon: "🥘",
      title: "Lemon Rice Combo",
      items: "Lemon rice, Curd, Pickle",
      mealType: "Lunch",
      price: "₹70",
    },
    {
      day: "WED",
      icon: "🍱",
      title: "Mini South Thali",
      items: "Rice, Sambar, Rasam, Sabzi",
      mealType: "Lunch",
      price: "₹89",
    },
    {
      day: "THU",
      icon: "🍛",
      title: "Curd Rice Meal",
      items: "Curd rice, Poriyal, Pickle",
      mealType: "Dinner",
      price: "₹72",
    },
    {
      day: "FRI",
      icon: "🥗",
      title: "Millet Pongal",
      items: "Pongal, Chutney, Sambar",
      mealType: "Breakfast",
      price: "₹80",
    },
    {
      day: "SAT",
      icon: "🍲",
      title: "Bisi Bele Bath",
      items: "Bisi bele bath, Raita, Papad",
      mealType: "Lunch",
      price: "₹92",
    },
    {
      day: "SUN",
      icon: "🍽️",
      title: "South Special Thali",
      items: "Rice, Sambar, Rasam, Curd, Sweet",
      mealType: "Lunch",
      price: "₹110",
    },
  ],
  punjabiTadka: [
    {
      day: "MON",
      icon: "🥘",
      title: "Rajma Masala",
      items: "Rajma, Rice, Salad",
      mealType: "Lunch",
      price: "₹95",
    },
    {
      day: "TUE",
      icon: "🍛",
      title: "Chole Kulche",
      items: "Chole, 2 Kulche, Pickle",
      mealType: "Lunch",
      price: "₹99",
    },
    {
      day: "WED",
      icon: "🍲",
      title: "Paneer Tikka Masala",
      items: "Paneer, Roti, Rice, Raita",
      mealType: "Dinner",
      price: "₹115",
    },
    {
      day: "THU",
      icon: "🫓",
      title: "Stuffed Paratha",
      items: "2 Parathas, Curd, Butter",
      mealType: "Breakfast",
      price: "₹85",
    },
    {
      day: "FRI",
      icon: "🍱",
      title: "Punjabi Thali",
      items: "Dal, Sabzi, Roti, Rice, Salad",
      mealType: "Lunch",
      price: "₹109",
    },
    {
      day: "SAT",
      icon: "🥗",
      title: "Healthy Punjabi Box",
      items: "Dal, Millet Roti, Sabzi, Salad",
      mealType: "Lunch",
      price: "₹99",
    },
    {
      day: "SUN",
      icon: "🍽️",
      title: "Sunday Tadka Special",
      items: "Paneer, Dal, Roti, Rice, Sweet",
      mealType: "Lunch",
      price: "₹129",
    },
  ],
};

const sampleMenus = {
  maaKiRasoi: [
    {
      icon: "🍚",
      title: "Dal Makhani Thali Rice",
      items: "Dal, Roti, Rice, Salad",
      price: "₹99",
    },
    {
      icon: "🥙",
      title: "Chole Bhature",
      items: "Chole, 2 Bhature, Pickle",
      price: "₹95",
    },
    {
      icon: "🍚",
      title: "Rajma Chawal",
      items: "Rajma, Steamed Rice, Papad",
      price: "₹89",
    },
  ],
  gharKaSwad: [
    {
      icon: "🍱",
      title: "Gujarati Mini Thali",
      items: "Dal, Roti, Rice, Shaak",
      price: "₹85",
    },
    {
      icon: "🥗",
      title: "Jain Sabzi Box",
      items: "Jain sabzi, Roti, Salad",
      price: "₹82",
    },
    {
      icon: "🫓",
      title: "Thepla Combo",
      items: "Thepla, Curd, Pickle",
      price: "₹69",
    },
  ],
  southSpice: [
    {
      icon: "🍚",
      title: "Sambar Rice Bowl",
      items: "Sambar rice, Poriyal, Papad",
      price: "₹75",
    },
    {
      icon: "🥘",
      title: "Lemon Rice Combo",
      items: "Lemon rice, Curd, Pickle",
      price: "₹70",
    },
    {
      icon: "🍽️",
      title: "South Special Thali",
      items: "Rice, Sambar, Rasam, Sweet",
      price: "₹110",
    },
  ],
  punjabiTadka: [
    {
      icon: "🥘",
      title: "Rajma Masala",
      items: "Rajma, Rice, Salad",
      price: "₹95",
    },
    {
      icon: "🍛",
      title: "Chole Kulche",
      items: "Chole, 2 Kulche, Pickle",
      price: "₹99",
    },
    {
      icon: "🍲",
      title: "Paneer Tikka Masala",
      items: "Paneer, Roti, Rice, Raita",
      price: "₹115",
    },
  ],
};

const seedData = {
  categories: [
    { icon: "🥦", label: "All", sortOrder: 1 },
    { icon: "🍛", label: "Veg", sortOrder: 2 },
    { icon: "🥗", label: "Healthy", sortOrder: 3 },
    { icon: "🫘", label: "Jain", sortOrder: 4 },
    { icon: "🍱", label: "Home", sortOrder: 5 },
    { icon: "🥘", label: "Punjabi", sortOrder: 6 },
  ],
  customers: [
    {
      name: "Rahul Sharma",
      avatar: "👨🏽",
      phone: "+91 98765 43210",
      email: "rahul.sharma@email.com",
      location: "Bandra West, Mumbai",
      address: "Bandra West, Mumbai 400050",
      walletBalance: 250,
      rating: "4.8",
      orders: 48,
    },
    {
      name: "Ananya Mehta",
      avatar: "👩🏻",
      phone: "+91 91190 34521",
      email: "ananya.mehta@email.com",
      location: "Andheri East, Mumbai",
      address: "Andheri East, Mumbai 400069",
      walletBalance: 120,
      rating: "4.6",
      orders: 22,
    },
    {
      name: "Ravi Kumar",
      avatar: "👨🏻",
      phone: "+91 99888 77665",
      email: "ravi.kumar@email.com",
      location: "Powai, Mumbai",
      address: "Powai, Mumbai 400076",
      walletBalance: 500,
      rating: "4.5",
      orders: 9,
    },
  ],
  meals: [
    {
      type: "today",
      icon: "🍛",
      title: "Dal Makhani Thali",
      status: "On the way 🛵",
      meta: "Lunch · Arriving by 12:30 PM",
      chef: "Sunita Devi · Maa Ki Rasoi",
    },
    {
      type: "next",
      icon: "🌙",
      title: "Paneer Butter Masala",
      meta: "Dinner · Today 7:30 PM",
    },
    {
      type: "tomorrow",
      icon: "🥙",
      title: "Chole Bhature",
      meta: "Lunch + Dinner · Tue, 17 Jan",
    },
  ],
  scheduleItems: [
    {
      day: "MON",
      icon: "🍛",
      meal: "Dal",
      title: "Dal Makhani Thali",
      mealType: "Lunch",
      meta: "Lunch · Today by 12:30 PM",
      chef: "Sunita Devi · Maa Ki Rasoi",
      status: "Out For Delivery",
      sortOrder: 1,
    },
    {
      day: "TUE",
      icon: "🥙",
      meal: "Chole",
      title: "Chole Bhature",
      mealType: "Lunch + Dinner",
      meta: "Lunch + Dinner · Tomorrow",
      chef: "Sunita Devi · Maa Ki Rasoi",
      status: "Scheduled",
      active: true,
      sortOrder: 2,
    },
    {
      day: "WED",
      icon: "🍚",
      meal: "Rajma",
      title: "Rajma Rice Bowl",
      mealType: "Lunch",
      meta: "Lunch · Wednesday by 12:30 PM",
      chef: "Kiran Patel · Ghar Ka Swad",
      status: "Scheduled",
      sortOrder: 3,
    },
    {
      day: "THU",
      icon: "🥘",
      meal: "Kadhi",
      title: "Kadhi Pakora Thali",
      mealType: "Lunch",
      meta: "Lunch · Thursday by 12:30 PM",
      chef: "Kiran Patel · Ghar Ka Swad",
      status: "Scheduled",
      sortOrder: 4,
    },
    {
      day: "FRI",
      icon: "🍲",
      meal: "Paneer",
      title: "Paneer Butter Masala",
      mealType: "Dinner",
      meta: "Dinner · Friday 7:30 PM",
      chef: "Sunita Devi · Maa Ki Rasoi",
      status: "Scheduled",
      sortOrder: 5,
    },
    {
      day: "SAT",
      icon: "🫓",
      meal: "Aloo",
      title: "Aloo Paratha Combo",
      mealType: "Breakfast",
      meta: "Breakfast · Saturday 9:00 AM",
      chef: "Harpreet Kaur · Punjabi Tadka",
      status: "Scheduled",
      sortOrder: 6,
    },
    {
      day: "SUN",
      icon: "🥫",
      meal: "Special",
      title: "Sunday Special Thali",
      mealType: "Lunch",
      meta: "Lunch · Sunday by 1:00 PM",
      chef: "Sunita Devi · Maa Ki Rasoi",
      status: "Scheduled",
      sortOrder: 7,
    },
  ],
  homeChefs: [
    {
      image: "🍱",
      name: "Maa Ki Rasoi",
      owner: "Sunita Devi",
      badge: "Bestseller",
      cuisine: "North Indian",
      tags: ["Veg", "Home Style"],
      rating: "4.8",
      reviewCount: 142,
      distance: "1.2 km",
      location: "Bandra West",
      time: "30 min",
      experience: "3 yrs",
      subscribers: "500+",
      price: "₹89/meal",
      about:
        "I'm Sunita Devi, a passionate home cook serving North Indian meals from Maa Ki Rasoi. This weekly calendar is updated by the kitchen, so your meals stay fresh, planned and transparent.",
      fssaiStatus: "Certified",
      foodType: "100% Veg",
      achievement: "Top HomeChef",
      hygieneRating: "A+",
      orders: 64,
      status: "Active",
      isAssigned: true,
      weeklyMenu: weeklyMenus.maaKiRasoi,
      sampleMenu: sampleMenus.maaKiRasoi,
    },
    {
      image: "🍛",
      name: "Ghar Ka Swad",
      owner: "Kiran Patel",
      badge: "Top Rated",
      cuisine: "Gujarati · Jain",
      tags: ["Veg", "Jain"],
      rating: "4.6",
      reviewCount: 96,
      distance: "2.4 km",
      location: "Andheri East",
      time: "40 min",
      experience: "5 yrs",
      subscribers: "320+",
      price: "₹75/meal",
      about:
        "Kiran Patel prepares Gujarati and Jain meals with simple ingredients, balanced spices and a rotating weekly menu.",
      fssaiStatus: "Certified",
      foodType: "Veg Jain",
      achievement: "Top Rated",
      hygieneRating: "A",
      orders: 42,
      status: "Active",
      weeklyMenu: weeklyMenus.gharKaSwad,
      sampleMenu: sampleMenus.gharKaSwad,
    },
    {
      image: "🥘",
      name: "South Spice",
      owner: "Meena Iyer",
      badge: "New",
      cuisine: "South Indian",
      tags: ["Veg", "South Indian"],
      rating: "4.5",
      reviewCount: 74,
      distance: "3.1 km",
      location: "Powai",
      time: "45 min",
      experience: "4 yrs",
      subscribers: "210+",
      price: "₹70/meal",
      about:
        "Meena Iyer serves fresh South Indian home meals with rice bowls, pongal, curd rice and seasonal specials.",
      fssaiStatus: "In Review",
      foodType: "100% Veg",
      achievement: "Regional Specialist",
      hygieneRating: "A",
      orders: 31,
      status: "Review",
      weeklyMenu: weeklyMenus.southSpice,
      sampleMenu: sampleMenus.southSpice,
    },
    {
      image: "🥘",
      name: "Punjabi Tadka",
      owner: "Harpreet Kaur",
      badge: "New",
      cuisine: "Punjabi",
      tags: ["Veg", "Punjabi"],
      rating: "4.7",
      reviewCount: 88,
      distance: "2.0 km",
      location: "Khar West",
      time: "35 min",
      experience: "6 yrs",
      subscribers: "410+",
      price: "₹95/meal",
      about:
        "Harpreet Kaur cooks Punjabi comfort meals with rich gravies, parathas and wholesome thalis.",
      fssaiStatus: "Certified",
      foodType: "100% Veg",
      achievement: "Customer Favourite",
      hygieneRating: "A+",
      orders: 18,
      status: "Active",
      weeklyMenu: weeklyMenus.punjabiTadka,
      sampleMenu: sampleMenus.punjabiTadka,
    },
  ],
  orders: [
    {
      orderId: "MID20841",
      customer: "Rahul Sharma",
      meal: "Dal Makhani Thali",
      chef: "Maa Ki Rasoi",
      status: "Out For Delivery",
      amount: "₹89",
      eta: "12:30 PM",
      paymentMethod: "UPI",
      paymentId: "seed_pay_20841",
    },
    {
      orderId: "MID20842",
      customer: "Ananya Mehta",
      meal: "Gujarati Thali",
      chef: "Ghar Ka Swad",
      status: "Preparing",
      amount: "₹75",
      eta: "01:05 PM",
      paymentMethod: "UPI",
      paymentId: "seed_pay_20842",
    },
    {
      orderId: "MID20843",
      customer: "Ravi Kumar",
      meal: "Paneer Butter Masala",
      chef: "South Spice",
      status: "Delivered",
      amount: "₹99",
      eta: "Delivered",
      paymentMethod: "Debit Card",
      paymentId: "seed_pay_20843",
    },
    {
      orderId: "MID20844",
      customer: "Priya Nair",
      meal: "Chole Bhature",
      chef: "Maa Ki Rasoi",
      status: "Preparing",
      amount: "₹85",
      eta: "01:25 PM",
      paymentMethod: "Net Banking",
      paymentId: "seed_pay_20844",
    },
  ],
  subscriptions: [
    {
      customer: "Rahul Sharma",
      plan: "Monthly Lunch + Dinner",
      nextMeal: "Paneer Butter Masala",
      skipped: "0",
      renewal: "24 Jan",
    },
    {
      customer: "Ananya Mehta",
      plan: "Weekly Lunch",
      nextMeal: "Gujarati Thali",
      skipped: "1",
      renewal: "18 Jan",
    },
    {
      customer: "Ravi Kumar",
      plan: "Trial 3 Meals",
      nextMeal: "Rajma Rice",
      skipped: "0",
      renewal: "Ends Today",
    },
  ],
  plans: [
    {
      name: "7 Days Plan",
      meals: "7 days · 7 meals",
      price: "₹499",
      users: 842,
      status: "Visible",
    },
    {
      name: "15 Days Plan",
      meals: "15 days · 15 meals",
      price: "₹999",
      users: 934,
      status: "Visible",
    },
    {
      name: "30 Days Plan",
      meals: "30 days · 30 meals",
      price: "₹1,899",
      users: 1388,
      status: "Visible",
    },
  ],
  products: [
    {
      image: "🍛",
      name: "Dal Makhani Thali",
      category: "Veg",
      description: "Dal makhani, rice, roti, salad and pickle.",
      mealType: "Lunch",
      tags: ["Veg", "North Indian"],
      price: "₹89",
      status: "Active",
      createdBy: "admin@middo.com",
    },
    {
      image: "🥙",
      name: "Chole Bhature",
      category: "Punjabi",
      description: "Classic chole with soft bhature and onion salad.",
      mealType: "Lunch + Dinner",
      tags: ["Veg", "Punjabi"],
      price: "₹85",
      status: "Active",
      createdBy: "admin@middo.com",
    },
    {
      image: "🥗",
      name: "Healthy Jain Bowl",
      category: "Healthy",
      description: "Light jain meal bowl with dal, sabzi and millet roti.",
      mealType: "Dinner",
      tags: ["Healthy", "Jain"],
      price: "₹99",
      status: "Active",
      createdBy: "admin@middo.com",
    },
  ],
  walletTransactions: [
    {
      customer: "Rahul Sharma",
      type: "Refund",
      amount: "+₹75",
      note: "Delay refund",
    },
    {
      customer: "Ananya Mehta",
      type: "Top-up",
      amount: "+₹500",
      note: "UPI wallet add",
    },
    {
      customer: "Ravi Kumar",
      type: "Order",
      amount: "-₹89",
      note: "Dal Makhani Thali",
    },
  ],
  reviews: [
    {
      customer: "Rahul Sharma",
      chef: "Maa Ki Rasoi",
      rating: "5.0",
      text: "Fresh food and timely delivery.",
    },
    {
      customer: "Priya Nair",
      chef: "South Spice",
      rating: "4.0",
      text: "Taste was good, packaging can improve.",
    },
    {
      customer: "Ravi Kumar",
      chef: "Ghar Ka Swad",
      rating: "4.5",
      text: "Good home style food.",
    },
  ],
  supportTickets: [
    {
      ticketId: "TCK-1021",
      customer: "Rahul Sharma",
      channel: "WhatsApp",
      issue: "Meal delayed",
      priority: "High",
    },
    {
      ticketId: "TCK-1022",
      customer: "Ananya Mehta",
      channel: "AI Chatbot",
      issue: "Plan change request",
      priority: "Medium",
    },
    {
      ticketId: "TCK-1023",
      customer: "Ravi Kumar",
      channel: "Help Center",
      issue: "Refund status",
      priority: "Low",
    },
  ],
  notifications: [
    {
      title: "Meal is out for delivery",
      body: "Your active lunch order is on the way.",
      category: "orderUpdates",
      audience: "Customers",
      icon: "🛵",
      tone: "green",
      status: "Published",
    },
    {
      title: "Wallet refund credited",
      body: "A service adjustment has been credited to your wallet.",
      category: "orderUpdates",
      audience: "Customers",
      icon: "💳",
      tone: "blue",
      status: "Published",
    },
    {
      title: "New Punjabi Tadka menu live",
      body: "Fresh weekly items are now available from nearby HomeChefs.",
      category: "promotions",
      audience: "Customers",
      icon: "🍱",
      tone: "peach",
      status: "Published",
    },
  ],
  appContent: [
    {
      key: "onboarding",
      value: [
        {
          eyebrow: "STEP 1 OF 3",
          title: "Fresh Tiffin,\nEvery Day",
          body:
            "Enjoy home-style meals crafted by local tiffin vendors. Healthy, hygienic, and delivered right to your door.",
          imageKey: "Step1",
          badges: true,
          chips: [
            { icon: "🥗", label: "Healthy" },
            { icon: "🏠", label: "Home-style" },
            { icon: "⚡", label: "Daily Fresh" },
          ],
        },
        {
          eyebrow: "STEP 2 OF 3",
          title: "Near You,\nAlways",
          body:
            "Discover tiffin vendors within 6-7 km of your location. Save multiple addresses and switch anytime.",
          imageKey: "Step2",
          imageWide: true,
          features: [
            { iconKey: "Location", label: "Location-based vendor discovery" },
            { iconKey: "Home", label: "Multiple saved addresses" },
            { iconKey: "Rotate", label: "Auto-refresh on address change" },
          ],
        },
        {
          eyebrow: "STEP 3 OF 3",
          title: "Total Control,\nZero Stress",
          body:
            "Track your tiffin live, skip meals when you're away, and pay seamlessly.",
          imageKey: "Step3",
          imageWide: true,
          features: [
            { iconKey: "pickup", label: "Real-time delivery tracking" },
            { iconKey: "calender", label: "Skip meals anytime" },
            { iconKey: "credit_card", label: "Secure wallet and easy payments" },
          ],
        },
      ],
    },
    {
      key: "paymentMethods",
      value: ["UPI", "Credit Card", "Debit Card", "Net Banking", "Wallet"],
    },
    {
      key: "skipReasons",
      value: [
        "Going out today",
        "Travelling",
        "Already have food",
        "Fasting",
        "Not feeling well",
        "Other",
      ],
    },
    {
      key: "trackingStatuses",
      value: [
        { icon: "✓", label: "Order Confirmed" },
        { icon: "👨‍🍳", label: "Preparing" },
        { icon: "📦", label: "Ready" },
        { icon: "🛵", label: "Out For Delivery" },
        { icon: "📍", label: "Delivered" },
      ],
    },
    {
      key: "support",
      value: {
        channels: [
          { icon: "💬", label: "Chat", tone: "green" },
          { icon: "📞", label: "Call", tone: "blue" },
          { icon: "✉️", label: "Email", tone: "orange" },
        ],
        topics: [
          { icon: "🚴", label: "Delivery" },
          { icon: "💳", label: "Payments" },
          { icon: "📅", label: "Subscription" },
          { icon: "🍛", label: "Meals" },
          { icon: "👤", label: "Account" },
          { icon: "💰", label: "Refunds" },
        ],
        faqs: [
          {
            question: "How do I skip a meal?",
            answer:
              "Open Subscription Calendar, choose Skip Upcoming Meal, and submit before the kitchen cut-off.",
          },
          {
            question: "Can I change my delivery address?",
            answer:
              "Use Saved Addresses or submit a location-change request from the skip meal flow.",
          },
          {
            question: "What if my meal is late or missing?",
            answer:
              "Open live tracking first, then contact support so the team can coordinate with the HomeChef or process a wallet refund.",
          },
          {
            question: "How does the wallet work?",
            answer:
              "Wallet balance can be used for eligible orders, refunds, promotional credits, and quick top-ups.",
          },
        ],
      },
    },
  ],
};

const compactFilter = (filter) =>
  Object.fromEntries(
    Object.entries(filter).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );

const upsertMany = (Model, rows, getFilter) => {
  if (!rows.length) {
    return Promise.resolve();
  }

  return Model.bulkWrite(
    rows.map((row) => ({
      updateOne: {
        filter: compactFilter(getFilter(row)),
        update: { $set: row },
        upsert: true,
      },
    })),
  );
};

async function upsertSuperAdmin(adminData) {
  const admin = await SuperAdmin.findOne({ email: adminData.email }).select(
    "+password",
  );

  if (admin) {
    Object.assign(admin, adminData, {
      permissions: SuperAdmin.superAdminPermissions,
    });
    await admin.save();
    return;
  }

  await SuperAdmin.create({
    ...adminData,
    permissions: SuperAdmin.superAdminPermissions,
  });
}

async function upsertUser(userData) {
  const user = await User.findOne({ email: userData.email }).select(
    "+password",
  );

  if (user) {
    Object.assign(user, userData, { isActive: true });
    await user.save();
    return;
  }

  await User.create({ ...userData, isActive: true });
}

async function seed() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing in .env");
  }

  await mongoose.connect(process.env.MONGO_URI, getMongoOptions());

  await upsertMany(Category, seedData.categories, (row) => ({
    label: row.label,
  }));
  await upsertMany(Customer, seedData.customers, (row) => ({
    email: row.email,
    phone: row.phone,
  }));
  await upsertMany(Meal, seedData.meals, (row) => ({
    title: row.title,
  }));
  await upsertMany(ScheduleItem, seedData.scheduleItems, (row) => ({
    day: row.day,
  }));
  await upsertMany(HomeChef, seedData.homeChefs, (row) => ({
    name: row.name,
  }));
  await upsertMany(Order, seedData.orders, (row) => ({
    orderId: row.orderId,
  }));
  await upsertMany(Subscription, seedData.subscriptions, (row) => ({
    customerPhone: row.customerPhone,
    plan: row.plan,
  }));
  await upsertMany(Plan, seedData.plans, (row) => ({
    name: row.name,
  }));
  await upsertMany(Product, seedData.products, (row) => ({
    name: row.name,
  }));
  await upsertMany(WalletTransaction, seedData.walletTransactions, (row) => ({
    customer: row.customer,
    type: row.type,
    amount: row.amount,
    note: row.note,
  }));
  await upsertMany(Review, seedData.reviews, (row) => ({
    customer: row.customer,
    text: row.text,
  }));
  await upsertMany(SupportTicket, seedData.supportTickets, (row) => ({
    ticketId: row.ticketId,
  }));
  await upsertMany(Notification, seedData.notifications, (row) => ({
    title: row.title,
    message: row.message,
  }));
  await upsertMany(AppContent, seedData.appContent, (row) => ({
    key: row.key,
  }));
  await upsertSuperAdmin(getSeedSuperAdmin());
  await Promise.all(getSeedUsers().map(upsertUser));

  logger.info("MIDDO seed data upserted successfully");
  logger.info("Seeded accounts are configured from environment variables");
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  logger.error(`Seed failed: ${error.message}`);
  await mongoose.disconnect();
  process.exit(1);
});
