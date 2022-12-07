const config = require("../../config.json");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const sendEmail = require("../../_helpers/send-email");
const db = require("../../_helpers/db");
const Role = require("../../_helpers/role");
const { generateReferralCode } = require("../referral/referral.services");
const {
  sendSms,
  sendForgotPasswordSms,
  sendRegisterSms,
} = require("../../_helpers/send-sms");
const otpGenerator = require("otp-generator");

const register = async (params, origin) => {
  // validate
  let userExist = await db.Account.findOne({
    $or: [{ email: params.email }, { phoneNumber: params.phoneNumber }],
  });
  if (userExist) {
    // send already registered error in email to prevent account enumeration
    // await sendAlreadyRegisteredEmail(params.email, origin);
    return { account: userExist, message: "User already exist" };
  }

  // create account object
  const account = new db.Account(params);

  // first registered account is an admin
  const isFirstAccount = (await db.Account.countDocuments({})) === 0;
  account.role = Role.User;
  account.verificationToken = randomTokenString();
  account.otp = randomOTPGenerate();
  account.otpDate = new Date();

  // hash password
  account.passwordHash = hash(params.password);
  // save account
  await account.save().then((res) => {
    addReferalId(params, res);
  });

  // send email
  // await sendVerificationEmail(account, origin);
  sendRegisterSms(account.phoneNumber, account.otp);
  if (account.email) {
    // sendVerificationOTPEmail(account, origin);
  }

  return {
    account,
    message:
      "Registration successful, We have sent you and OTP on your registered phone number.",
  };
};

const addReferalId = async (params, res) => {
  const referalData = await db.Referral.findOne({
    referralCode: params.referrelId,
  });

  if (referalData) {
    referalData.referredBy = [...referalData.referredBy, res._id];

    referalData.updated = Date.now();
    await referalData.save();
  } else {
    throw new Error("Could not find");
  }
};

const authenticate = async ({ mobileNo, password, ipAddress }) => {
  const account = await db.Account.findOne({ phoneNumber: mobileNo });

  if (!account) {
    throw "Account not available";
  }

  if (!account.isVerified) {
    const aMinuteAgo = new Date(Date.now() - 1000 * 60 * 30);
    if (account.otpDate <= aMinuteAgo) {
      let userOtp = randomOTPGenerate();
      account.otp = userOtp;
      account.otpDate = new Date();
      updateUserData(account);

      sendSms(account.phoneNumber, userOtp);
    }
    throw "Your account not verified please verify your account.verify link sended to your account.";
  }
  if (!bcrypt.compareSync(password, account.passwordHash)) {
    throw "Your email or password not matched";
  }

  // authentication successful so generate jwt and refresh tokens
  const token = generateJwtToken(account);
  const refreshToken = generateRefreshToken(account, ipAddress);

  // save refresh token
  await refreshToken.save();

  // return basic details and tokens
  return {
    ...basicDetails(account),
    token,
    refreshToken: refreshToken.token,
  };
};

const authenticateAdmin = async ({ mobileNo, password, ipAddress }) => {
  const account = await db.Account.findOne({ phoneNumber: mobileNo });

  if (!account) {
    throw "Account not available";
  }

  if (!bcrypt.compareSync(password, account.passwordHash)) {
    throw "Your email or password not matched";
  }

  // authentication successful so generate jwt and refresh tokens
  const token = generateJwtToken(account);
  const refreshToken = generateRefreshToken(account, ipAddress);

  // save refresh token
  await refreshToken.save();

  // return basic details and tokens
  return {
    ...basicDetails(account),
    token,
    refreshToken: refreshToken.token,
  };
};

const resendOtp = async ({ mobileNo }) => {
  const account = await db.Account.findOne({ phoneNumber: mobileNo });
  if (!account) {
    throw "Account not available";
  }
  let userOtp = randomOTPGenerate();
  account.otp = userOtp;
  account.otpDate = new Date();
  updateUserData(account);

  sendSms(account.phoneNumber, userOtp);

  // return basic details and tokens
  return {
    otp: userOtp,
  };
};

const refreshToken = async ({ token, ipAddress }) => {
  const refreshToken = await getRefreshToken(token);
  const { account } = refreshToken;

  // replace old refresh token with a new one and save
  const newRefreshToken = generateRefreshToken(account, ipAddress);
  refreshToken.revoked = Date.now();
  refreshToken.revokedByIp = ipAddress;
  refreshToken.replacedByToken = newRefreshToken.token;
  await refreshToken.save();
  await newRefreshToken.save();

  // generate new jwt
  const jwtToken = generateJwtToken(account);

  // return basic details and tokens
  return {
    ...basicDetails(account),
    jwtToken,
    refreshToken: newRefreshToken.token,
  };
};

const revokeToken = async ({ token, ipAddress }) => {
  const refreshToken = await getRefreshToken(token);

  // revoke token and save
  refreshToken.revoked = Date.now();
  refreshToken.revokedByIp = ipAddress;
  await refreshToken.save();
};

const verifyEmail = async ({ token }) => {
  const account = await db.Account.findOne({ verificationToken: token });
  if (!account) throw "Verification failed";
  const referalData = await generateReferralCode(account._id);

  account.referralId = referalData._id;
  account.referrelCode = referalData.referralCode;
  account.verified = Date.now();
  account.verificationToken = undefined;
  account.verificationStatus = true;
  await account.save();
};

const verifyMobileNo = async ({ mobileNo, otp, ipAddress }) => {
  const account = await db.Account.findOne({ phoneNumber: mobileNo });

  if (!account || account.otp != otp) throw "Verification failed";
  const referalData = await generateReferralCode(account._id);

  account.referralId = referalData._id;
  account.referrelCode = referalData.referralCode;
  account.verified = Date.now();
  account.otp = undefined;
  account.verificationToken = undefined;
  account.verificationStatus = true;
  account.isVerified = true;
  await account.save();
  // return account;

  // authentication successful so generate jwt and refresh tokens
  const token = generateJwtToken(account);
  const refreshToken = generateRefreshToken(account, ipAddress);

  // save refresh token
  await refreshToken.save();

  // return basic details and tokens
  return {
    ...basicDetails(account),
    token,
    refreshToken: refreshToken.token,
  };
};

const forgotPassword = async ({ phoneNumber }, origin) => {
  // const account = await db.Account.findOne({ email });
  const account = await db.Account.findOne({ phoneNumber });

  // always return ok response to prevent email enumeration
  if (!account) return;

  // create reset token that expires after 24 hours
  let userOtp = await randomOTPGenerate();
  account.resetToken = {
    token: userOtp,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
  await account.save();

  // send email
  // await sendPasswordResetEmail(account, origin);
  // sendSms(account.phoneNumber, userOtp);

  sendPasswordResetPhone(account, origin);
};

const validateResetToken = async ({ token }) => {
  const account = await db.Account.findOne({
    "resetToken.token": token,
    "resetToken.expires": { $gt: Date.now() },
  });

  if (!account) throw "Invalid token";
};

const resetPassword = async ({ token, password, phoneNumber }) => {
  let account = await db.Account.findOne({
    phoneNumber: phoneNumber,
  });

  if (!account) throw "Invalid user!";
  if (
    account.resetToken.token === token &&
    account.resetToken.expires > Date.now()
  ) {
    // update password and remove reset token
    account.passwordHash = hash(password);
    account.passwordReset = Date.now();
    account.resetToken = undefined;
    account.otp = undefined;
    await account.save();
  } else {
    throw "OTP not valid!";
  }
};

const getAll = async (params) => {
  var startDate = new Date(params.startDate);
  var endDate = new Date(params.endDate);

  const accounts = await db.Account.find();
  let filterData = accounts;
  if (params.startDate && params.endDate) {
    filterData = filterData.filter((user) => {
      let date = new Date(user.created);
      return date >= startDate && date <= endDate;
    });
  }

  if (params.role) {
    filterData = filterData.filter((user) => {
      return user.role == params.role;
    });
  }

  if (params.searchParams) {
    filterData = filterData.filter((user) => {
      if (user.userName.includes(params.searchParams)) {
        return user.userName.includes(params.searchParams);
      } else {
        return user.phoneNumber.includes(params.searchParams);
      }
    });
  }

  return filterData.map((x) => basicDetails(x));
};

const getUserById = async (id, ipAddress) => {
  const account = await db.Account.findOne({ _id: id });

  const token = generateJwtToken(account);
  const refreshToken = generateRefreshToken(account, ipAddress);

  // save refresh token
  await refreshToken.save();

  // return basic details and tokens
  return {
    ...basicDetails(account),
    token,
    refreshToken: refreshToken.token,
  };
  // return basicDetails(account);
  return account;
};

const create = async (params) => {
  try {
    if (await db.Account.findOne({ email: params.email })) {
      throw 'Email "' + params.email + '" is already registered';
    }

    const account = new db.Account(params);
    account.verified = Date.now();

    // hash password
    account.passwordHash = hash(params.password);

    // save account
    await account.save();

    return basicDetails(account);
  } catch (err) {
    return err;
  }
};

const update = async (id, params) => {
  const account = await getAccount(id);

  // validate (if email was changed)
  if (
    params.email &&
    account.email !== params.email &&
    (await db.Account.findOne({ email: params.email }))
  ) {
    throw 'Email "' + params.email + '" is already taken';
  }

  // hash password if it was entered
  if (params.password) {
    params.passwordHash = hash(params.password);
  }
  // if (params.transactionPin) {
  //   params.transactionPin = hash(params.transactionPin);
  // }

  // copy params to account and save
  account.updated = Date.now();
  Object.assign(account, params);
  await account.save();

  return basicDetails(account);
};

const transactionPinUpdate = async (params) => {
  try {
    const account = await db.Account.findOne({ _id: params.userId });
    if (!account) {
      throw "Account not available";
    } else {
      if (
        !account.transactionPin ||
        account.transactionPin === "" ||
        account.transactionPin === undefinded
      ) {
        params.transactionPin = hash(params.transactionPin);
        params.hasTransactionPin = true;
        account.updated = Date.now();
        Object.assign(account, params);
        return await account.save();
      } else {
        if (
          account.transactionPin &&
          !bcrypt.compareSync(params.transactionPin, account.transactionPin)
        ) {
          throw "Your pin not matched";
        } else {
          params.transactionPin = hash(params.newTransactionPin);
          params.hasTransactionPin = true;
          account.updated = Date.now();
          Object.assign(account, params);
          return await account.save();
        }
      }
    }

    return await account.save();
  } catch (err) {
    return err;
  }
};

const passwordUpdate = async (params) => {
  try {
    const account = await db.Account.findOne({ _id: params.userId });
    if (!account) {
      throw "Account not available";
    } else {
      if (!bcrypt.compareSync(params.currentPassword, account.passwordHash)) {
        throw "Your password not matched";
      } else {
        params.passwordHash = hash(params.newPassword);
        Object.assign(account, params);
        account.updated = Date.now();
        return await account.save();
      }
    }
  } catch (err) {
    return err;
  }
};

const updateUserData = async (account) => {
  // copy params to account and save
  // Object.assign(account, params);
  account.updated = Date.now();
  await account.save();

  return basicDetails(account);
};

const _delete = async (id) => {
  const account = await getAccount(id);
  await account.remove();
};

const getuserFromReferralCode = async (code) => {
  try {
    const referalData = await db.Referral.findOne({ referralCode: code });

    if (referalData) {
      const account = await db.Account.findOne({
        _id: referalData.userId,
      });
      if (!account) {
        throw "user not found";
      } else {
        return basicDetails(account);
      }
    } else {
      throw new Error("Could not find");
    }
  } catch (err) {
    throw err;
  }
};

// helper functions

const getAccount = async (id) => {
  if (!db.isValidId(id)) throw "Account not found";
  const account = await db.Account.findById(id);
  if (!account) throw "Account not found";
  return account;
};

const getRefreshToken = async (token) => {
  const refreshToken = await db.RefreshToken.findOne({ token }).populate(
    "account"
  );
  if (!refreshToken || !refreshToken.isActive) throw "Invalid token";
  return refreshToken;
};

const hash = (password) => {
  return bcrypt.hashSync(password, 10);
};

const generateJwtToken = (account) => {
  // create a jwt token containing the account id that expires in 15 minutes
  return jwt.sign({ sub: account.id, id: account.id }, config.secret, {
    expiresIn: "15m",
  });
};

const generateRefreshToken = (account, ipAddress) => {
  // create a refresh token that expires in 7 days
  return new db.RefreshToken({
    account: account.id,
    token: randomTokenString(),
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdByIp: ipAddress,
  });
};

const randomTokenString = () => {
  return crypto.randomBytes(40).toString("hex");
};

const randomOTPGenerate = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

const basicDetails = (account) => {
  const {
    id,
    userName,
    phoneNumber,
    email,
    role,
    verified,
    location,
    balance,
    isVerified,
    isActive,
    created,
    updated,
    verificationToken,
    transactionPin,
    hasTransactionPin,
    walletBalance,
  } = account;
  return {
    id,
    userName,
    phoneNumber,
    email,
    role,
    verified,
    location,
    balance,
    isVerified,
    isActive,
    created,
    updated,
    verificationToken,
    transactionPin,
    hasTransactionPin,
    walletBalance,
  };
};
// this function call on user registration for sending user verification link
const sendVerificationEmail = async (account, origin) => {
  let message;
  if (origin) {
    const verifyUrl = `${origin}/auth/verify-email?token=${account.verificationToken}`;
    message = `<p>Please click the below link to verify your email address:</p>
                   <p><a href="${verifyUrl}">${verifyUrl}</a></p>`;
  } else {
    message = `<p>Please use the below token to verify your email address with the <code>/auth/verify-email</code> api route:</p>
     <p><code>${account.verificationToken}</code></p>`;
  }

  await sendEmail({
    to: account.email,
    subject: "Sign-up Verification API - Verify Email",
    html: `<h4>Verify Email</h4>
               <p>Thanks for registering!</p>
               ${message}`,
  });
};

const sendVerificationOTPEmail = async (account, origin) => {
  let message;
  if (origin) {
    const verifyUrl = `${origin}/auth/verify-phone-no?token=${account.otp}`;
    message = `<p>Please click the below link to verify your email address:</p>
                   <p><a href="${verifyUrl}">${verifyUrl}</a></p>`;
  } else {
    message = `<p>Please use the below token to verify your email address with the <code>/auth/verify-email</code> api route:</p>
     <p><code>${account.otp}</code></p>`;
  }

  await sendEmail({
    to: account.email,
    subject: "Sign-up Verification API - Verify Email",
    html: `<h4>Verify Email</h4>
               <p>Thanks for registering!</p>
               ${message}`,
  });
};

const sendAlreadyRegisteredEmail = async (email, origin) => {
  let message;
  if (origin) {
    message = `<p>If you don't know your password please visit the <a href="${origin}/auth/forgot-password">forgot password</a> page.</p>`;
  } else {
    message = `<p>If you don't know your password you can reset it via the <code>/auth/forgot-password</code> api route.</p>`;
  }

  await sendEmail({
    to: email,
    subject: "Sign-up Verification API - Email Already Registered",
    html: `<h4>Email Already Registered</h4>
               <p>Your email <strong>${email}</strong> is already registered.</p>
               ${message}`,
  });
};

const sendPasswordResetEmail = async (account, origin) => {
  let message;
  if (origin) {
    const resetUrl = `${origin}/auth/reset-password?token=${account.resetToken.token}`;
    message = `<p>Please click the below link to reset your password, the link will be valid for 1 day:</p>
                   <p><a href="${resetUrl}">${resetUrl}</a></p>`;
  } else {
    message = `<p>Please use the below token to reset your password with the <code>/auth/reset-password</code> api route:</p>
                   <p><code>${account.resetToken.token}</code></p>`;
  }

  await sendEmail({
    to: account.email,
    subject: "Sign-up Verification API - Reset Password",
    html: `<h4>Reset Password Email</h4>
               ${message}`,
  });
};

const sendPasswordResetPhone = async (account, origin) => {
  let message;
  console.log("account in send", account);
  if (origin) {
    const resetUrl = `${origin}/auth/reset-password?token=${account.resetToken.token}`;
    message = `<p>Please click the below link to reset your password, the link will be valid for 1 day:</p>
                   <p><a href="${resetUrl}">${resetUrl}</a></p>`;
  } else {
    message = `<p>Please use the below token to reset your password with the <code>/auth/reset-password</code> api route:</p>
                   <p><code>${account.resetToken.token}</code></p>`;
  }
  console.log("message", message);
  sendForgotPasswordSms(account.phoneNumber, account.resetToken.token);

  await sendEmail({
    to: account.email,
    subject: "Sign-up Verification API - Reset Password",
    html: `<h4>Reset Password Email</h4>
               ${message}`,
  });
};

const getPincode = async (data) => {
  console.log("data`", data);
};

const getUserIsFirstLogin = async (id) => {
  const account = await getAccount(id);
  let message = "User first time login";
  let isFirstTime = true;
  if (account.isFirstLogin) {
    account.isFirstLogin = false;
    await account.save();
  } else {
    isFirstTime = false;
    message = "User login";
  }
  return { data: isFirstTime, message: message };
};

module.exports = {
  register,
  authenticate,
  refreshToken,
  revokeToken,

  verifyEmail,
  verifyMobileNo,
  forgotPassword,
  validateResetToken,
  resetPassword,
  getuserFromReferralCode,

  getAll,
  getUserById,
  create,
  update,
  delete: _delete,
  getPincode,
  resendOtp,

  getUserIsFirstLogin,

  transactionPinUpdate,
  passwordUpdate,
  authenticateAdmin,
};
