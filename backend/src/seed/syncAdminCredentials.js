require("dotenv").config();

const mongoose = require("mongoose");
const getMongoOptions = require("../config/mongoOptions");

const SuperAdmin = require("../models/SuperAdmin");
const User = require("../models/User");
const {
  getSeedSuperAdmin,
  getSeedUsers,
} = require("../config/seedCredentials");
const logger = require("../utils/logger");

async function upsertUser(userData) {
  const user = await User.findOne({ email: userData.email }).select(
    "+password",
  );

  if (user) {
    user.name = userData.name;
    user.phone = userData.phone;
    user.password = userData.password;
    user.role = userData.role;
    user.isActive = true;
    await user.save();
    return;
  }

  await User.create({ ...userData, isActive: true });
}

async function syncCredentials() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing in .env");
  }

  await mongoose.connect(process.env.MONGO_URI, getMongoOptions());

  await SuperAdmin.deleteMany({
    email: { $in: ["admin@middo.com", "superadmin@middo.com"] },
  });

  await SuperAdmin.create({
    ...getSeedSuperAdmin(),
    permissions: SuperAdmin.superAdminPermissions,
  });

  const users = getSeedUsers();
  await Promise.all(users.map(upsertUser));

  logger.info("MIDDO admin credentials synced");
  logger.info("Seeded accounts are configured from environment variables");

  await mongoose.disconnect();
}

syncCredentials().catch(async (error) => {
  logger.error(`Credential sync failed: ${error.message}`);
  await mongoose.disconnect();
  process.exit(1);
});
