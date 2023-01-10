const express = require("express");
const authController = require('../controllers/auth');

const router = express.Router();

router.post("/signup", authController.postUserSignUp);

router.post("/login", authController.postUserLogin);

router.post("/reset-password", authController.postResetPassword);

router.get("/new-password/:token" , authController.getNewPassword)

router.post("/new-password", authController.postNewPassword);

module.exports = router;