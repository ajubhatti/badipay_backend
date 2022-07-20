const express = require("express");
const router = express.Router();
const bodyParser = express.json();
const { requireSignin, isAuth } = require("../userAuth/userAuth.services");

const {
  userFromJwtFull,
  userById,
  userByIdPrivate,
  readUser,
  updateUser,
} = require("./user.service");

router.get("/user/me", requireSignin, userFromJwtFull, isAuth, readUser); // must be befeore /user/:userId paths
router.get("/user/:userIdPrivate", requireSignin, isAuth, readUser);
router.post("/user/:userId", requireSignin, isAuth, bodyParser, updateUser);
router.param("userId", userById);
router.param("userIdPrivate", userByIdPrivate);

module.exports = router;
