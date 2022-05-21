const express = require("express");
const router = express.Router();
const Joi = require("joi");
const validateRequest = require("../../_middleware/validate-request");
const authorize = require("../../_middleware/authorize");
const Role = require("../../_helpers/role");
const accountService = require("./accounts.service");
const { getuserFromReferralCode } = require("./accounts.service");

const registerSchema = (req, res, next) => {
  const schema = Joi.object({
    userName: Joi.string().required(),
    phoneNumber: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
    acceptTerms: Joi.boolean().valid(true).required(),
  });
  validateRequest(req, next, schema);
};

const register = (req, res, next) => {
  accountService
    .register(req.body, req.get("origin"))
    .then((account) =>
      res.json({
        status: 200,
        data: account?.account ? account?.account : [],
        message: account.message
          ? account.message
          : "Registration successful, please check your email for verification instructions",
      })
    )
    .catch(next);
};

const authenticateSchema = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
  });
  validateRequest(req, next, schema);
};

const authenticate = (req, res, next) => {
  const { email, password } = req.body;
  const ipAddress = req.ip;
  accountService
    .authenticate({ email, password, ipAddress })
    .then(({ refreshToken, ...account }) => {
      setTokenCookie(res, refreshToken);
      res.json({ status: 200, message: "login successfully", data: account });
    })
    .catch(next);
};

const refreshToken = (req, res, next) => {
  const token = req.cookies.refreshToken;
  const ipAddress = req.ip;
  accountService
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

  accountService
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
  accountService
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
    otp: Joi.string().required(),
  });
  validateRequest(req, next, schema);
};

const verifyPhoneNo = (req, res, next) => {
  accountService
    .verifyMobileNo(req.body)
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
  accountService
    .forgotPassword(req.body, req.get("origin"))
    .then(() =>
      res.json({
        status: 200,
        data: [],
        message: "Please check your email for password reset instructions",
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
  accountService
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
  accountService
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
  accountService
    .getAll(req.body)
    .then((accounts) =>
      res.json({ status: 200, data: accounts, message: "success" })
    )
    .catch(next);
};

const getById = (req, res, next) => {
  // users can get their own account and admins can get any account
  if (req.params.id !== req.user.id && req.user.role !== Role.Admin) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  accountService
    .getById(req.params.id)
    .then((account) =>
      res.json({ status: 200, data: account, message: "success" })
    )
    .catch(next);
};

const getUserById = (req, res, next) => {
  accountService
    .getById(req.body.id)
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
  accountService
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

  accountService
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

  accountService
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
  accountService.getuserFromReferralCode(req.body.code).then((account) => {
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

// routes
router.post("/register", register);
router.post("/login", authenticate);
router.post("/refresh-token", refreshToken);
router.post("/revoke-token", authorize(), revokeTokenSchema, revokeToken);
router.post("/verify-email", verifyEmailSchema, verifyEmail);

router.post("/verify-phone-no", verifyPhoneSchema, verifyPhoneNo);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/getAll", getAll);
router.get("/:id", getById);
router.post("/getUserById", getUserById);
router.post("/", authorize(Role.Admin), createSchema, create);
router.put("/:id", update);
router.delete("/:id", authorize(), _delete);
router.post(
  "/validate-reset-token",
  validateResetTokenSchema,
  validateResetToken
);

router.post("/getByReferralCode", getuserByReferralCode);

module.exports = router;
