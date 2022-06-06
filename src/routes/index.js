const authRouter = require("./auth");
const doctorRouter = require("./Doctor");
const patientRouter = require("./Patient");
const userRouter = require("./User");
const usgReportRouter = require("./USGReport");

module.exports = {
  doctorRouter,
  patientRouter,
  usgReportRouter,
  userRouter,
  authRouter,
};
