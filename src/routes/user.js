const express = require("express");
const login = require("../controllers/user.js");
const register = require("../controllers/user.js");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

module.exports = router;
