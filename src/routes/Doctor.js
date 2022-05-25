const express = require("express");

const { newDoctor, listDoctors, deleteDoctor, updateDoctor, getDoctor } = require("../controllers/Doctor");

const router = express.Router();
router.post("", newDoctor);
router.get("", listDoctors);
router.get("/:id", getDoctor);
router.put("/:id", updateDoctor);
router.delete("/:id", deleteDoctor);

module.exports = router;
