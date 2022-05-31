const express = require("express");

const {
  newUSGReport,
  getUSGReport,
  updateUSGReport,
  listUSGReports,
  deleteUSGReport,
} = require("../controllers/USGReport");

const router = express.Router();
router.post("", newUSGReport);
router.get("", listUSGReports);
router.get("/:id", getUSGReport);
router.put("/:id", updateUSGReport);
router.delete("/:id", deleteUSGReport);

module.exports = router;
