const authRouter = require("./auth");
const doctorRouter = require("./Doctor");
const patientRouter = require("./Patient");
const templateRouter = require("./Template");
const userRouter = require("./User");
const usgReportRouter = require("./USGReport");

module.exports = {
  doctorRouter,
  patientRouter,
  usgReportRouter,
  userRouter,
  authRouter,
  templateRouter,
};
