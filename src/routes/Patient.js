const express = require("express");

const { newPatient, listPatients, deletePatient, updatePatient, getPatient } = require("../controllers/Patient");

const router = express.Router();
router.post("", newPatient);
router.get("", listPatients);
router.get("/:id", getPatient);
router.put("/:id", updatePatient);
router.delete("/:id", deletePatient);

module.exports = router;
