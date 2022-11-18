const express = require("express");

const { login, getGoogleLoginUrl, googleLogin } = require("../controllers/auth");

const router = express.Router();
router.post("/login", login);
router.get("/get-google-login-url", getGoogleLoginUrl);
router.post("/google-login", googleLogin);

module.exports = router;
