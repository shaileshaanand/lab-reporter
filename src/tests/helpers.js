const mongoose = require("mongoose");

const dbConnect = require("../helpers/dbConnect");
const models = require("../models");

const connectTestDb = async () => {
  await dbConnect(process.env.MONGO_TEST_URI);
};

const disconnectTestDb = async () => {
  await mongoose.connection.close();
};

const clearDb = async () => {
  await Promise.all(Object.keys(models).map((model) => models[model].deleteMany({})));
};

module.exports = { connectTestDb, disconnectTestDb, clearDb };
