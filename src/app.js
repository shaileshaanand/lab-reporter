const express = require("express");
require("express-async-errors");

const errorHandlerMiddleware = require("./middleware/errorHandler");
const { doctorRouter, patientRouter, usgReportRouter } = require("./routes");

const app = express();

app.use(express.json());

app.use("/api/v1/doctor", doctorRouter);
app.use("/api/v1/patient", patientRouter);
app.use("/api/v1/usg-report", usgReportRouter);

app.use(errorHandlerMiddleware);
module.exports = app;
