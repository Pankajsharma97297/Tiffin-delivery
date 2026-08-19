const mongoose = require("mongoose");
const getMongoOptions = require("./mongoOptions");
const logger = require("../utils/logger");

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is missing in environment variables");
  }

  try {
    await mongoose.connect(mongoUri, getMongoOptions());
    logger.info(`MongoDB connected: ${mongoose.connection.name}`);
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
