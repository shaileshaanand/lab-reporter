const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");

require("express-async-errors");

const errorHandlerMiddleware = require("./middleware/errorHandler");
const { doctorRouter, patientRouter, usgReportRouter } = require("./routes");

const app = express();

app.use(cors());
app.use(helmet());
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else if (process.env.NODE_ENV === "production") {
  app.use(morgan("common"));
}
app.use(express.json());

app.use("/api/v1/doctor", doctorRouter);
app.use("/api/v1/patient", patientRouter);
app.use("/api/v1/usg-report", usgReportRouter);

app.use(errorHandlerMiddleware);
module.exports = app;
