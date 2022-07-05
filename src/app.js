const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");

require("express-async-errors");

const authenticationMiddleware = require("./middleware/authentication");
const errorHandlerMiddleware = require("./middleware/errorHandler");
const { doctorRouter, patientRouter, usgReportRouter, userRouter, authRouter, templateRouter } = require("./routes");

const app = express();

app.use(cors());
app.use(helmet());
if (process.env.NODE_ENV === "dev") {
  app.use(morgan("dev"));
} else if (process.env.NODE_ENV === "production") {
  app.use(morgan("common"));
}
app.use(express.json());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/doctor", authenticationMiddleware, doctorRouter);
app.use("/api/v1/patient", authenticationMiddleware, patientRouter);
app.use("/api/v1/usg-report", authenticationMiddleware, usgReportRouter);
app.use("/api/v1/user", authenticationMiddleware, userRouter);
app.use("/api/v1/template", authenticationMiddleware, templateRouter);

app.use(errorHandlerMiddleware);
module.exports = app;
