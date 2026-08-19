const Category = require("../models/Category");
const Customer = require("../models/Customer");
const HomeChefChangeRequest = require("../models/HomeChefChangeRequest");
const HomeChefChangeSetting = require("../models/HomeChefChangeSetting");
const HomeChef = require("../models/HomeChef");
const Meal = require("../models/Meal");
const Notification = require("../models/Notification");
const Order = require("../models/Order");
const Plan = require("../models/Plan");
const Product = require("../models/Product");
const Review = require("../models/Review");
const ScheduleItem = require("../models/ScheduleItem");
const Subscription = require("../models/Subscription");
const SubscriptionRequest = require("../models/SubscriptionRequest");
const SupportTicket = require("../models/SupportTicket");
const WalletTransaction = require("../models/WalletTransaction");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const tableMap = {
  categories: Category,
  customers: Customer,
  homeChefChangeRequests: HomeChefChangeRequest,
  homeChefChangeSettings: HomeChefChangeSetting,
  homeChefs: HomeChef,
  meals: Meal,
  notifications: Notification,
  orders: Order,
  plans: Plan,
  products: Product,
  reviews: Review,
  scheduleItems: ScheduleItem,
  subscriptions: Subscription,
  subscriptionRequests: SubscriptionRequest,
  supportTickets: SupportTicket,
  walletTransactions: WalletTransaction,
};

const tableNames = Object.keys(tableMap);

const getTables = asyncHandler(async (req, res) => {
  return sendSuccess(res, 200, "Tables fetched", { tables: tableNames });
});

const getAllTablesData = asyncHandler(async (req, res) => {
  const entries = await Promise.all(
    tableNames.map(async (table) => [
      table,
      await tableMap[table].find().lean(),
    ]),
  );

  return sendSuccess(
    res,
    200,
    "All table data fetched",
    Object.fromEntries(entries),
  );
});

const getTableData = asyncHandler(async (req, res) => {
  const { table } = req.params;
  const Model = tableMap[table];

  if (!Model) {
    return res.status(404).json({
      success: false,
      message: `Unknown table: ${table}`,
      tables: tableNames,
    });
  }

  const rows = await Model.find().lean();
  return sendSuccess(res, 200, `${table} data fetched`, { table, rows });
});

module.exports = {
  getAllTablesData,
  getTableData,
  getTables,
  tableMap,
  tableNames,
};
