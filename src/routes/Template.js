const express = require("express");

const {
  newTemplate,
  updateTemplate,
  deleteTemplate,
  listTemplates,
  getTemplate,
  syncTemplate,
} = require("../controllers/Template");

const router = express.Router();
router.post("", newTemplate);
router.put("/:id", updateTemplate);
router.delete("/:id", deleteTemplate);
router.get("", listTemplates);
router.get("/:id", getTemplate);
router.post("/:id/sync", syncTemplate);

module.exports = router;
