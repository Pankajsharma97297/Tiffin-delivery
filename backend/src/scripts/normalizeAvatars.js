require("dotenv").config();

const mongoose = require("mongoose");

const connectDB = require("../config/database");
const Customer = require("../models/Customer");
const User = require("../models/User");
const { toStoredAvatarPath } = require("../utils/avatarPath");

const normalizeModelAvatars = async (Model, label) => {
  const records = await Model.find({
    avatar: { $exists: true, $nin: ["", null] },
  }).select("_id avatar");

  let kept = 0;
  let removed = 0;

  for (const record of records) {
    const cleanAvatar = toStoredAvatarPath(record.avatar);

    if (cleanAvatar) {
      await Model.updateOne(
        { _id: record._id },
        { $set: { avatar: cleanAvatar } },
      );
      kept += 1;
    } else {
      await Model.updateOne({ _id: record._id }, { $unset: { avatar: "" } });
      removed += 1;
    }
  }

  console.log(`${label}: ${kept} valid avatars kept, ${removed} invalid avatars removed`);
};

const run = async () => {
  await connectDB();
  await normalizeModelAvatars(Customer, "Customers");
  await normalizeModelAvatars(User, "Users");
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
