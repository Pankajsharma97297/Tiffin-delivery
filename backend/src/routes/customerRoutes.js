const express = require("express");

const {
  createPaymentOrder,
  createReview,
  createSupportTicket,
  getActiveSubscription,
  getCustomerContent,
  getMealById,
  getSubscriptionCalendar,
  getSupportMetadata,
  getTracking,
  listCustomerOrders,
  listMeals,
  listNotifications,
  listPlans,
  listReviews,
  listSubscriptions,
  purchaseSubscription,
  registerPushToken,
  skipMeal,
  verifyPayment,
} = require("../controllers/customerController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/plans", listPlans);
router.get("/meals", listMeals);
router.get("/meals/:mealId", getMealById);
router.get("/reviews", listReviews);
router.get("/content", getCustomerContent);

router.use(protect);

router.get("/subscriptions", listSubscriptions);
router.get("/subscriptions/active", getActiveSubscription);
router.post("/subscriptions", purchaseSubscription);
router.get("/subscriptions/calendar", getSubscriptionCalendar);
router.post("/subscriptions/skip-meal", skipMeal);

router.get("/orders", listCustomerOrders);
router.get("/orders/:orderId/tracking", getTracking);

router.post("/reviews", createReview);

router.get("/notifications", listNotifications);
router.post("/notifications/register-device", registerPushToken);

router.get("/support", getSupportMetadata);
router.post("/support/tickets", createSupportTicket);

router.post("/payments/create-order", createPaymentOrder);
router.post("/payments/verify", verifyPayment);

module.exports = router;
