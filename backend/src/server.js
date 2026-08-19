require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/database");
const logger = require("./utils/logger");

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
};

startServer();
