const getMongoOptions = () =>
  process.env.MONGO_DB_NAME ? { dbName: process.env.MONGO_DB_NAME } : {};

module.exports = getMongoOptions;
