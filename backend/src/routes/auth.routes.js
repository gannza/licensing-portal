const express = require("express");
const { authenticate } = require("../middleware/auth");
const {
  register,
  login,
  me,
  refresh,
  logout,
  changePassword,
} = require("../controllers/authController");
const {
  validateRegister,
  validateLogin,
  validateChangePassword,
} = require("../dto");

const router = express.Router();

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", authenticate, me);

router.post(
  "/change-password",
  authenticate,
  validateChangePassword,
  changePassword,
);

module.exports = router;
