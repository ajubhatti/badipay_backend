const express = require("express");
const router = express.Router();
const Joi = require("joi");
const validateRequest = require("../_middleware/validate-request");
const authorize = require("../_middleware/authorize");
const Role = require("../_helpers/role");
const testAccountService = require("../controller/test.service");
const { getuserFromReferralCode } = require("../controller/test.service");
// const jwt = require("express-jwt");
const jwt = require("jsonwebtoken");
const { secret } = require("../config.json");

const register = (req, res, next) => {
  testAccountService
    .register(req.body, req.get("origin"))
    .then((account) =>
      res.json({
        status: 200,
        data: account,
        message:
          "Registration successful, please check your email for verification instructions",
      })
    )
    .catch(next);
};

const authenticateSchema = (req, res, next) => {
  const schema = Joi.object({
    mobileNo: Joi.string().required(),
    password: Joi.string().required(),
  });
  validateRequest(req, next, schema);
};

const authenticate = async (req, res, next) => {
  const { mobileNo, password } = req.body;
  const ipAddress = req.ip;
  await testAccountService
    .authenticate({ mobileNo, password, ipAddress })
    .then(({ refreshToken, ...account }) => {
      setTokenCookie(res, refreshToken);
      res.json({ status: 200, message: "login successfully", data: account });
    })
    .catch(next);
};

const adminLogin = async (req, res, next) => {
  const { mobileNo, password } = req.body;
  const ipAddress = req.ip;
  await testAccountService
    .authenticateAdmin({ mobileNo, password, ipAddress })
    .then(({ refreshToken, ...account }) => {
      setTokenCookie(res, refreshToken);
      res.json({ status: 200, message: "login successfully", data: account });
    })
    .catch(next);
};

const refreshToken = (req, res, next) => {
  const token = req.cookies.refreshToken;
  const ipAddress = req.ip;
  testAccountService
    .refreshToken({ token, ipAddress })
    .then(({ refreshToken, ...account }) => {
      setTokenCookie(res, refreshToken);
      res.json({ status: 200, data: account, message: "success" });
    })
    .catch(next);
};

const revokeTokenSchema = (req, res, next) => {
  const schema = Joi.object({
    token: Joi.string().empty(""),
  });
  validateRequest(req, next, schema);
};

const revokeToken = (req, res, next) => {
  // accept token from request body or cookie
  const token = req.body.token || req.cookies.refreshToken;
  const ipAddress = req.ip;

  if (!token) return res.status(400).json({ message: "Token is required" });

  // users can revoke their own tokens and admins can revoke any tokens
  if (!req.user.ownsToken(token) && req.user.role !== Role.Admin) {
    return res
      .status(401)
      .json({ status: 401, data: [], message: "Unauthorized" });
  }

  testAccountService
    .revokeToken({ token, ipAddress })
    .then(() => res.json({ status: 200, data: [], message: "Token revoked" }))
    .catch(next);
};

const verifyEmailSchema = (req, res, next) => {
  const schema = Joi.object({
    token: Joi.string().required(),
  });
  validateRequest(req, next, schema);
};

const verifyEmail = (req, res, next) => {
  testAccountService
    .verifyEmail(req.body)
    .then(() =>
      res.json({
        status: 200,
        data: [],
        message: "Verification successful, you can now login",
      })
    )
    .catch(next);
};

const verifyPhoneSchema = (req, res, next) => {
  const schema = Joi.object({
    mobileNo: Joi.string().required(),
    otp: Joi.string().required(),
  });
  validateRequest(req, next, schema);
};

const verifyPhoneNo = (req, res, next) => {
  const { mobileNo, otp } = req.body;
  const ipAddress = req.ip;
  testAccountService
    .verifyMobileNo({ mobileNo, otp, ipAddress })
    .then((data) =>
      res.json({
        status: 200,
        data: data,
        message: "Verification successful, you can now login",
      })
    )
    .catch(next);
};

const forgotPasswordSchema = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
  });
  validateRequest(req, next, schema);
};

const forgotPassword = (req, res, next) => {
  testAccountService
    .forgotPassword2(req.body, req.get("origin"))
    .then(() =>
      res.json({
        status: 200,
        data: [],
        message:
          "We have send otp to your registered mobile No. or Please check your email for password reset instructions",
      })
    )
    .catch(next);
};

const validateResetTokenSchema = (req, res, next) => {
  const schema = Joi.object({
    token: Joi.string().required(),
  });
  validateRequest(req, next, schema);
};

const validateResetToken = (req, res, next) => {
  testAccountService
    .validateResetToken(req.body)
    .then(() => res.json({ status: 200, data: [], message: "Token is valid" }))
    .catch(next);
};

const resetPasswordSchema = (req, res, next) => {
  const schema = Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
  });
  validateRequest(req, next, schema);
};

const resetPassword = (req, res, next) => {
  testAccountService
    .resetPassword(req.body)
    .then(() =>
      res.json({
        status: 200,
        data: [],
        message: "Password reset successful, you can now login",
      })
    )
    .catch(next);
};

const getAll = (req, res, next) => {
  testAccountService
    .getAll(req.body)
    .then((accounts) =>
      res.json({ status: 200, data: accounts, message: "success" })
    )
    .catch(next);
};

const getById = (req, res, next) => {
  if (req.headers && req.headers.authorization) {
    var authorization = req.headers.authorization.split(" ")[1],
      decoded;

    // users can get their own account and admins can get any account

    try {
      decoded = jwt.verify(authorization, secret);
    } catch (e) {
      return res.status(401).send("unauthorized");
    }
  }
  var userId = decoded.id;

  testAccountService
    .getUserById(userId)
    .then((account) =>
      res.json({ status: 200, data: account, message: "success" })
    )
    .catch(next);
};

const me = (req, res, next) => {
  if (req.headers && req.headers.authorization) {
    var authorization = req.headers.authorization.split(" ")[1],
      decoded;

    try {
      decoded = jwt.verify(authorization, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).send("unauthorized!!!!");
    }
    var userId = decoded.id;
    // Fetch the user by id
    db.User.findOne({ _id: userId }).then(function (user) {
      // Do something with the user
      return res.send(200);
    });
  }
  return res.status(400).json({ error: "System Error: User not found 73" });
};

const getUserById = (req, res, next) => {
  const ipAddress = req.ip;

  const { id } = req.params;

  testAccountService
    .getUserById(id, ipAddress)
    .then((account) =>
      res.json({ status: 200, data: account, message: "success" })
    )
    .catch(next);
};

const createSchema = (req, res, next) => {
  const schema = Joi.object({
    userName: Joi.string().required(),
    phoneNumber: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
    role: Joi.string().valid(Role.Admin, Role.User).required(),
  });
  validateRequest(req, next, schema);
};

const create = (req, res, next) => {
  testAccountService
    .create(req.body)
    .then((account) =>
      res.json({ status: 200, data: account, message: "success" })
    )
    .catch(next);
};

const updateSchema = (req, res, next) => {
  const schemaRules = {
    userName: Joi.string().empty(""),
    phoneNumber: Joi.string().empty(""),
    email: Joi.string().email().empty(""),
    password: Joi.string().min(6).empty(""),
    confirmPassword: Joi.string().valid(Joi.ref("password")).empty(""),
  };

  // // only admins can update role
  // if (req.user.role === Role.Admin) {
  //     schemaRules.role = Joi.string().valid(Role.Admin, Role.User).empty('');
  // }
  const schema = Joi.object(schemaRules).with("password", "confirmPassword");
  validateRequest(req, next, schema);
};

const update = (req, res, next) => {
  // users can update their own account and admins can update any account
  // if (req.params.id !== req.user.id && req.user.role !== Role.Admin) {
  //     return res.status(401).json({ message: 'Unauthorized' });
  // }

  testAccountService
    .update(req.params.id, req.body)
    .then((account) =>
      res.json({ status: 200, data: account, message: "success" })
    )
    .catch(next);
};

const _delete = (req, res, next) => {
  // users can delete their own account and admins can delete any account
  if (req.params.id !== req.user.id && req.user.role !== Role.Admin) {
    return res
      .status(401)
      .json({ status: 401, message: "Unauthorized", message: "fail" });
  }

  testAccountService
    .delete(req.params.id)
    .then(() =>
      res.json({
        status: 200,
        message: "Account deleted successfully",
        data: [],
      })
    )
    .catch(next);
};

const getuserByReferralCode = (req, res, next) => {
  testAccountService.getuserFromReferralCode(req.body.code).then((account) => {
    res.json({ status: 200, data: account, message: "success" });
  });
};

// helper functions

const setTokenCookie = (res, token) => {
  // create cookie with refresh token that expires in 7 days
  const cookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };
  res.cookie("refreshToken", token, cookieOptions);
};

const getUserIsFirstLogin = (req, res, next) => {
  const { id } = req.params;
  testAccountService.getUserIsFirstLogin(id).then((data) => {
    res.json({
      status: 200,
      message: data.message,
      data: data.data,
    });
  });
};

const changePassword = (req, res, next) => {
  testAccountService
    .passwordUpdate(req.body)
    .then((account) => {
      res.json({ status: 200, data: account, message: "success" });
    })
    .catch(next);
};

const changeTransactionPin = (req, res, next) => {
  testAccountService
    .transactionPinUpdate(req.body)
    .then((account) =>
      res.json({ status: 200, data: account, message: "success" })
    )
    .catch(next);
};

// routes
router.post("/userRegister", register);
router.post("/register", testAccountService.userRegister); // updated
// router.post("/login", authenticateSchema, authenticate);
router.post("/login", authenticateSchema, testAccountService.authenticate2);

router.post("/refresh-token", refreshToken);
router.post("/revoke-token", authorize(), revokeTokenSchema, revokeToken);

router.post("/verify-email", verifyEmailSchema, verifyEmail);
router.post("/verify-phone-no", verifyPhoneSchema, verifyPhoneNo);

router.post(
  "/verify-phone-no-otp",
  verifyPhoneSchema,
  testAccountService.verifyPhoneNoOtp
);

router.post("/forgot-password", testAccountService.forgotPassword2);
router.post("/forgot-transaction-pin", testAccountService.forgotTransactionPin);
// router.post("/reset-password", resetPassword);
router.post("/reset-password", testAccountService.resetPassword2);
router.post("/reset-transaction-pin", testAccountService.resetTransactionPin);

// router.post("/getAll", getAll);
router.post("/getAll", testAccountService.getAll2);

router.post("/", create);

router.put("/:id", update);
router.delete("/:id", authorize(), _delete);

router.post(
  "/validate-reset-token",
  validateResetTokenSchema,
  validateResetToken
);

router.post("/getByReferralCode", getuserByReferralCode);
router.post("/resendOtp", testAccountService.resendOtp);
router.get("/getUserIsFirstLogin/:id", getUserIsFirstLogin);

router.post("/changePassword", testAccountService.passwordUpdate2);
router.post("/changeTransactionPin", testAccountService.transactionPinUpdate2);

router.post("/adminLogin", adminLogin);

// =============================================
router.get("/getById", getById);
router.get("/getUserById/:id", getUserById);
router.get("/me", me);

module.exports = router;
