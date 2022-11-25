const express = require("express");
const router = express.Router();
const Joi = require("joi");
const validateRequest = require("../../_middleware/validate-request");
const authorize = require("../../_middleware/authorize");
const Role = require("../../_helpers/role");
const accountService = require("./accounts.service");
const { getuserFromReferralCode } = require("./accounts.service");
const jwt = require("express-jwt");
const { secret } = require("../../config.json");

const register = (req, res, next) => {
  accountService
    .register(req.body, req.get("origin"))
    .then((account) =>
      res.json({
        status: 200,
        data: [],
        message: account.message
          ? account.message
          : "Registration successful, please check your email for verification instructions",
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
  await accountService
    .authenticate({ mobileNo, password, ipAddress })
    .then(({ refreshToken, ...account }) => {
      setTokenCookie(res, refreshToken);
      res.json({ status: 200, message: "login successfully", data: account });
    })
    .catch(next);
};

const adminLogin = async (req, res) => {
  const { mobileNo, password } = req.body;
  const ipAddress = req.ip;
  await accountService
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
    mobileNo: Joi.string().required(),
    otp: Joi.string().required(),
  });
  validateRequest(req, next, schema);
};

const verifyPhoneNo = (req, res, next) => {
  const { mobileNo, otp } = req.body;
  const ipAddress = req.ip;
  accountService
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
  accountService
    .forgotPassword(req.body, req.get("origin"))
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
  if (req.headers && req.headers.authorization) {
    var authorization = req.headers.authorization.split(" ")[1],
      decoded;
    console.log("authorization", authorization);
    // users can get their own account and admins can get any account
    const usertoken = req.headers.authorization;
    const token = usertoken.split(" ");
    // const decoded1 = jwt.verify(token[1], secret);
    // console.log(decoded1);
    try {
      decoded = jwt.verify(authorization, secret);
      console.log("decoded.id", decoded.id);
    } catch (e) {
      return res.status(401).send("unauthorized");
    }
  }

  if (req.params.id !== req.user.id && req.user.role !== Role.Admin) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  accountService
    .getUserById(req.params.id)
    .then((account) =>
      res.json({ status: 200, data: account, message: "success" })
    )
    .catch(next);
};

const getUserById = (req, res, next) => {
  accountService
    .getUserById(req.body.id)
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

const resendOtp = (req, res, next) => {
  const { mobileNo } = req.body;
  accountService
    .resendOtp({ mobileNo })
    .then((data) => {
      res.json({
        status: 200,
        message: "otp send successfully",
        data: data,
      });
    })
    .catch(next);
};

const getUserIsFirstLogin = (req, res, next) => {
  const { id } = req.params;
  accountService.getUserIsFirstLogin(id).then((data) => {
    res.json({
      status: 200,
      message: data.message,
      data: data.data,
    });
  });
};

const changePassword = (req, res, next) => {
  accountService
    .passwordUpdate(req.body)
    .then((account) => {
      console.log({ account });
      res.json({ status: 200, data: account, message: "success" });
    })
    .catch(next);
};

const changeTransactionPin = (req, res, next) => {
  accountService
    .transactionPinUpdate(req.body)
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

// routes
router.post("/register", register);
router.post("/login", authenticateSchema, authenticate);

router.post("/refresh-token", refreshToken);
router.post("/revoke-token", authorize(), revokeTokenSchema, revokeToken);

router.post("/verify-email", verifyEmailSchema, verifyEmail);
router.post("/verify-phone-no", verifyPhoneSchema, verifyPhoneNo);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.post("/getAll", getAll);
router.get("/:id", getById);
router.post("/getUserById", getUserById);
router.post("/", create);

router.put("/:id", update);
router.delete("/:id", authorize(), _delete);

router.post(
  "/validate-reset-token",
  validateResetTokenSchema,
  validateResetToken
);

router.post("/getByReferralCode", getuserByReferralCode);
router.post("/resendOtp", resendOtp);
router.get("/getUserIsFirstLogin/:id", getUserIsFirstLogin);
router.post("/changePassword", changePassword);
router.post("/changeTransactionPin", changeTransactionPin);

router.post("/adminLogin", adminLogin);

module.exports = router;
