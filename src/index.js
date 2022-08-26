/* eslint-disable no-console */
/* istanbul ignore file */

const app = require("./app");
const dbConnect = require("./helpers/dbConnect");

const start = async () => {
  const mongo_uri = process.env.MONGO_URI;
  const port = process.env.PORT || 3000;
  console.log(`Connecting to MongoDB at ${mongo_uri}`);
  await dbConnect(mongo_uri);
  console.log(`Connected to MongoDB at ${mongo_uri}`);
  const server = await app.listen(port);
  console.log(`Server started on port ${port}`);

  const shutdown = () => {
    console.log("Stopping ...");
    server.close(() => {
      console.log("Stopped");
      process.exit();
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

start();
