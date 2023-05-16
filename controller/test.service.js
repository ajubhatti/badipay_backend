const config = require("../config.json");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const sendEmail = require("../_helpers/send-email");
const db = require("../_helpers/db");
const Role = require("../_helpers/role");
const { generateReferralCode } = require("./referral.services");
const {
  sendForgotPasswordSms,
  sendRegisterSms,
} = require("../_helpers/send-sms");
const { encrypt, decrypt } = require("../_middleware/encryptDecrypt");

const register = async (params, origin) => {
  try {
    let userExist = await db.Test.findOne({
      $or: [{ email: params.email }, { phoneNumber: params.phoneNumber }],
    });
    if (userExist) {
      throw "User already exist with User name or Number or Email!";
    }

    // create account object
    const account = new db.Test(params);

    // first registered account is an admin
    const isFirstAccount = (await db.Test.countDocuments({})) === 0;
    account.role = Role.User;
    account.verificationToken = randomTokenString();
    account.otp = randomOTPGenerate();
    account.otpDate = new Date();

    // hash password
    account.passwordHash = hash(params.password);
    let encrpt = await encrypt(params.password);
    console.log({ encrpt });
    account.passwordEncrpt = encrpt;
    account.isVerified = true;
    account.verificationStatus = true;
    // save account
    await account.save().then(async (res) => {
      console.log({ res });
      if (params.referralId) {
        addReferalId(params, res);
      }
      return res;
    });
  } catch (err) {
    console.log({ err });
    throw err;
  }
};

const userRegister = async (req, res, next) => {
  const params = req.body;

  let MobileNoExist = await db.Test.findOne({
    phoneNumber: params.phoneNumber,
  });
  let emailExist = await db.Test.findOne({
    email: params.email,
  });
  if (MobileNoExist) {
    res.status(400).json({
      status: 400,
      message: "User already exist with Mobile Number!",
      data: "",
    });
    return;
  }
  if (emailExist) {
    res.status(400).json({
      status: 400,
      message: "User already exist with Email!",
      data: "",
    });
    return;
  }

  // create account object
  const account = new db.Test(params);
  account.role = Role.User;
  account.verificationToken = randomTokenString();
  account.otp = randomOTPGenerate();
  account.otpDate = new Date();
  account.passwordHash = hash(params.password);
  // save account
  await account.save().then(async (res) => {
    if (params.referralId) {
      addReferalId(params, res);
    }
    await sendRegisterSms(account.phoneNumber, account.otp)
      .then((smsResult) => {
        if (smsResult.status == 200) {
          const jsnRes = strToObj(smsResult.data);

          if (jsnRes && jsnRes.code === 200) {
            res.status(200).json({
              status: 200,
              message: "We have sent OTP on your registered phone number",
              data: "",
            });
          } else {
            res.status(jsnRes.code).json({
              status: jsnRes.code,
              message: jsnRes.cause,
              data: jsnRes,
            });
          }
        } else {
          res.status(400).json({
            status: 400,
            message: "something went wrong",
            data: smsResult,
          });
        }
      })
      .catch((err) => {
        res.status(400).json({
          status: 400,
          message: "something went wrong",
          data: err,
        });
      });
  });
};

const addReferalId = async (params, res) => {
  const referralData = await db.Referral.findOne({
    referralCode: params.referralId,
  });
  if (referralData) {
    referralData.referredUser = [...referralData.referredUser, res._id];
    referralData.updated = Date.now();
    await referralData.save();

    const referalUser = await db.Referral.findOne({
      userId: params.userId,
    });

    if (referalUser) {
      referalUser.referredBy = [...referalUser.referredBy, referralData.userId];
      referalUser.updated = Date.now();
      await referalUser.save();
    }
  } else {
    throw new Error("Could not find");
  }
};

const authenticate = async ({ mobileNo, password, ipAddress }) => {
  const account = await db.Test.findOne({ phoneNumber: mobileNo });

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

      sendRegisterSms(account.phoneNumber, userOtp);
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

const authenticate2 = async (req, res, next) => {
  const { mobileNo, password } = req.body;
  const ipAddress = req.ip;

  const account = await db.Test.findOne({ phoneNumber: mobileNo });

  if (!account) {
    res
      .status(400)
      .json({ status: 400, message: "Account not available!", data: "" });
  } else {
    if (!bcrypt.compareSync(password, account.passwordHash)) {
      res.status(400).json({
        status: 400,
        messae: "Your email or password not matched",
        data: "",
      });
      return;
    } else {
      if (!account.isVerified) {
        const aMinuteAgo = new Date(Date.now() - 1000 * 60 * 30);
        if (account.otpDate <= aMinuteAgo) {
          let userOtp = randomOTPGenerate();
          account.otp = userOtp;
          account.otpDate = new Date();
          updateUserData(account);

          sendRegisterSms(account.phoneNumber, userOtp);
        }
        res.status(203).json({
          status: 203,
          message:
            "Your account not verified!, please verify by OTP verification., We have sent OTP on your registered Mobile No.",
          data: "",
        });
      } else {
        // authentication successful so generate jwt and refresh tokens
        const token = generateJwtToken(account);
        const refreshToken = generateRefreshToken(account, ipAddress);

        // save refresh token
        await refreshToken.save();

        // return basic details and tokens
        res.status(200).json({
          status: 200,
          message: "Success",
          data: {
            ...basicDetails(account),
            token,
            refreshToken: refreshToken.token,
          },
        });
      }
    }
  }
};

const authenticateAdmin = async ({ mobileNo, password, ipAddress }) => {
  const account = await db.Test.findOne({ phoneNumber: mobileNo });

  if (!account || (account && account.role !== "admin")) {
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

const resendOtp = async (req, res, next) => {
  const { mobileNo } = req.body;
  const account = await db.Test.findOne({ phoneNumber: mobileNo });
  if (!account) {
    res
      .status(400)
      .json({ status: 400, message: "Account not available", data: "" });
  }
  let userOtp = randomOTPGenerate();
  account.otp = userOtp;
  account.otpDate = new Date();
  const userSaveRes = await account.save();
  if (userSaveRes) {
    await sendForgotPasswordSms(account.phoneNumber, account.otp)
      .then(async (smsResult) => {
        if (smsResult.status == 200) {
          console.log("smsResult ---", smsResult.data);
          let jsnRes = smsResult.data[0];
          if (typeof smsResult.data == "string") {
            jsnRes = strToObj(smsResult.data);
          }
          console.log("jsnRes----", jsnRes);
          if (jsnRes && jsnRes.code == 1300) {
            res.status(200).json({
              status: 200,
              message: `OTP send succefully to mobile no ${jsnRes.destination}`,
              data: "",
            });
          } else {
            res.status(jsnRes.code).json({
              status: jsnRes.code,
              message: jsnRes.cause,
              data: jsnRes,
            });
          }
        } else {
          res.status(400).json({
            status: 400,
            message: "something went wrong",
            data: smsResult,
          });
        }
      })
      .catch((err) => {
        res.status(400).json({
          status: 400,
          message: "something went wrong",
          data: err,
        });
      });
  }
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
  const account = await db.Test.findOne({ verificationToken: token });
  if (!account) throw "Verification failed";
  const referralData = await generateReferralCode(account._id);

  account.referralId = referralData._id;
  account.referrelCode = referralData.referralCode;
  account.verifiedDate = Date.now();
  account.verificationToken = undefined;
  account.verificationStatus = true;
  await account.save();
};

const verifyMobileNo = async ({ mobileNo, otp, ipAddress }) => {
  const account = await db.Test.findOne({ phoneNumber: mobileNo });

  if (!account || account.otp != otp) throw "Verification failed";
  const referralData = await generateReferralCode(account._id);

  account.referralId = referralData._id;
  account.referrelCode = referralData.referralCode;
  account.verifiedDate = Date.now();
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

const verifyPhoneNoOtp = async (req, res, next) => {
  const { mobileNo, otp } = req.body;
  const ipAddress = req.ip;
  const account = await db.Test.findOne({ phoneNumber: mobileNo });

  if (!account || account.otp != otp) {
    res
      .status(400)
      .json({ status: 400, message: "Verification failed", data: "" });
  } else {
    const aMinuteAgo = new Date(Date.now() - 1000 * 60 * 30);
    if (account.otpDate <= aMinuteAgo) {
      res.status(400).json({
        status: 400,
        message: "OTP expired!, please resend OTP",
        data: "",
      });
    } else {
      account.otp = undefined;
      await account.save();

      const token = generateJwtToken(account);
      const refreshToken = generateRefreshToken(account, ipAddress);

      res.status(200).json({
        status: 200,
        message: "OTP verified successfully.",
        data: "",
      });
    }
  }
};

const forgotPassword = async ({ phoneNumber }, origin) => {
  // const account = await db.Test.findOne({ email });
  const account = await db.Test.findOne({ phoneNumber });

  // always return ok response to prevent email enumeration
  if (!account) return;

  // create reset token that expires after 24 hours
  let userOtp = await randomOTPGenerate();
  account.resetToken = {
    token: userOtp,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
  await account.save();

  sendPasswordResetPhone(account, origin);
};

const forgotPassword2 = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;
    const origin = req.get("origin");

    const account = await db.Test.findOne({ phoneNumber });
    if (!account) {
      res
        .status(400)
        .json({ status: 400, message: "Account not found", data: "" });
    } else {
      let userOtp = await randomOTPGenerate();
      account.otp = userOtp;
      account.otpDate = new Date();

      await account
        .save()
        .then(async (result) => {
          if (result) {
            await sendForgotPasswordSms(account.phoneNumber, account.otp)
              .then(async (smsResult) => {
                if (smsResult.status == 200) {
                  console.log("smsResult ---", smsResult.data);
                  let jsnRes = smsResult.data[0];
                  if (typeof smsResult.data == "string") {
                    jsnRes = strToObj(smsResult.data);
                  }
                  console.log("jsnRes----", jsnRes);
                  if (jsnRes && jsnRes.code == 1300) {
                    res.status(200).json({
                      status: 200,
                      message: `OTP send succefully to mobile no ${jsnRes.destination}`,
                      data: "",
                    });
                  } else {
                    res.status(jsnRes.code).json({
                      status: jsnRes.code,
                      message: jsnRes.cause,
                      data: jsnRes,
                    });
                  }
                } else {
                  res.status(400).json({
                    status: 400,
                    message: "something went wrong",
                    data: smsResult,
                  });
                }
              })
              .catch((err) => {
                res.status(400).json({
                  status: 400,
                  message: "something went wrong",
                  data: err,
                });
              });
          }
        })
        .catch((err) => {
          res
            .status(400)
            .json({ status: 400, message: "something went wrong", data: err });
        });
    }
  } catch (err) {
    res
      .status(400)
      .json({ status: 400, message: "something went wrong", data: err });
  }
};

const forgotTransactionPin = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;
    const origin = req.get("origin");

    const account = await db.Test.findOne({ phoneNumber });
    if (!account) {
      res
        .status(400)
        .json({ status: 400, message: "Account not found", data: "" });
    } else {
      let userOtp = await randomOTPGenerate();
      account.otp = userOtp;
      account.otpDate = new Date();

      await account
        .save()
        .then(async (result) => {
          if (result) {
            await sendForgotPasswordSms(account.phoneNumber, account.otp)
              .then(async (smsResult) => {
                if (smsResult.status == 200) {
                  console.log("smsResult ---", smsResult.data);
                  let jsnRes = smsResult.data[0];
                  if (typeof smsResult.data == "string") {
                    jsnRes = strToObj(smsResult.data);
                  }
                  console.log("jsnRes----", jsnRes);
                  if (jsnRes && jsnRes.code == 1300) {
                    res.status(200).json({
                      status: 200,
                      message: `OTP send succefully to mobile no ${jsnRes.destination}`,
                      data: "",
                    });
                  } else {
                    res.status(jsnRes.code).json({
                      status: jsnRes.code,
                      message: jsnRes.cause,
                      data: jsnRes,
                    });
                  }
                } else {
                  res.status(400).json({
                    status: 400,
                    message: "something went wrong",
                    data: smsResult,
                  });
                }
              })
              .catch((err) => {
                res.status(400).json({
                  status: 400,
                  message: "something went wrong",
                  data: err,
                });
              });
          }
        })
        .catch((err) => {
          res
            .status(400)
            .json({ status: 400, message: "something went wrong", data: err });
        });
    }
  } catch (err) {
    res
      .status(400)
      .json({ status: 400, message: "something went wrong", data: err });
  }
};

const validateResetToken = async ({ token }) => {
  const account = await db.Test.findOne({
    "resetToken.token": token,
    "resetToken.expires": { $gt: Date.now() },
  });

  if (!account) throw "Invalid token";
};

const resetPassword = async ({ token, password, phoneNumber }) => {
  let account = await db.Test.findOne({
    phoneNumber: phoneNumber,
  });

  if (!account) throw "Invalid user!";
  if (
    account.resetToken.token === token &&
    account.resetToken.expires > Date.now()
  ) {
    // update password and remove reset token
    account.passwordHash = hash(password);
    account.passwordResetDate = Date.now();
    account.resetToken = undefined;
    account.otp = undefined;
    await account.save();
  } else {
    throw "OTP not valid!";
  }
};

const resetPassword2 = async (req, res, next) => {
  const { token, password, phoneNumber } = req.body;
  let account = await db.Test.findOne({
    phoneNumber: phoneNumber,
  });

  if (!account) {
    res
      .status(400)
      .json({ status: 400, message: "Account not found.", data: "" });
  } else {
    account.passwordHash = hash(password);
    account.passwordResetDate = Date.now();
    account.resetToken = undefined;
    account.otp = undefined;

    await account.save().then((result) => {
      res.status(200).json({
        status: 200,
        message: "Password change successfully.",
        data: "",
      });
    });
  }
};

const resetTransactionPin = async (req, res, next) => {
  try {
    const { transactionPin, phoneNumber } = req.body;
    let account = await db.Test.findOne({
      phoneNumber: phoneNumber,
    });

    if (!account) {
      res
        .status(400)
        .json({ status: 400, message: "Account not found!", data: "" });
    } else {
      account.transactionPin = hash(transactionPin);
      account.transactionPinResetDate = Date.now();
      account.otp = undefined;

      await account
        .save()
        .then((result) => {
          res.status(200).json({
            status: 200,
            message: "Pin change successfully.",
            data: "",
          });
        })
        .catch((err) => {
          res.status(200).json({
            status: 400,
            message: "Something went wrong!",
            data: err,
          });
        });
    }
  } catch (err) {
    res
      .status(400)
      .json({ status: 400, message: "Something went wrong!", data: "" });
  }
};

const getAll = async (params) => {
  var startDate = new Date(params.startDate);
  var endDate = new Date(params.endDate);

  const accounts = await db.Test.find();
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

const getAll2 = async (req, res, next) => {
  try {
    const params = req.body;
    const filter = req.body;
    let match = {};
    let match2 = {};
    console.log({ params });

    let searchKeyword = params.searchParams;
    if (searchKeyword) {
      match = {
        $or: [
          { userName: { $regex: searchKeyword, $options: "i" } },
          { phoneNumber: { $regex: searchKeyword, $options: "i" } },
        ],
      };
    }

    const orderByColumn = params.sortBy || "created";
    const orderByDirection = params.orderBy || "DESC";
    const sort = {};

    if (orderByColumn && orderByDirection) {
      sort[orderByColumn] = orderByDirection == "DESC" ? -1 : 1;
    }

    if (params.status) {
      match.statusOfWalletRequest = params.status;
    }

    if (params.startDate && params.endDate) {
      var startDate = new Date(params.startDate); // this is the starting date that looks like ISODate("2014-10-03T04:00:00.188Z")

      startDate.setSeconds(0);
      startDate.setHours(0);
      startDate.setMinutes(0);

      var endDate = new Date(params.endDate);

      endDate.setHours(23);
      endDate.setMinutes(59);
      endDate.setSeconds(59);

      let created = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
      match.createdAt = created;
      match2.createdAt = created;
    }

    console.log({ match });

    const total = await db.Test.find().countDocuments(match);
    const page = parseInt(params.page) || 1;
    const pageSize = parseInt(params.limits) || 10;
    const skipNo = (page - 1) * pageSize;
    const pages = Math.ceil(total / pageSize);

    const aggregateRules = [
      {
        $match: match,
      },
      {
        $sort: sort,
      },
      { $skip: skipNo },
      { $limit: params.limits },
    ];

    console.log(JSON.stringify(aggregateRules));

    let userListData = await db.Test.aggregate(aggregateRules);

    for (let i = 0; i < userListData.length; i++) {
      if (userListData[i].passwordEncrpt) {
        userListData[i].passDecrypt = decrypt(userListData[i].passwordEncrpt);
      }

      let referalData = await db.Referral.findOne({
        userId: userListData[i]._id,
      });

      let temp = JSON.stringify(referalData);
      let result = JSON.parse(temp);

      if (result) {
        if (result.referredUser) {
          let referedUser = await db.Test.findById(result.referredUser);

          if (referedUser) {
            result.userName = referedUser.userName;
            userListData[i].referedUser = result;
          }
        }
      }
    }

    res.status(200).json({
      status: 200,
      message: "success",
      data: {
        sort,
        filter,
        count: userListData.length,
        page,
        pages,
        data: userListData,
        total,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 500,
      message: "Server Error",
      data: error,
    });
  }
};

const getUserById = async (id, ipAddress) => {
  try {
    const account = await db.Test.findOne({ _id: id });
    // let decrypted;
    if (account && account.passwordEncrpt) {
      console.log("passwordEncrpt---", account.passwordEncrpt);
      let decrypted = decrypt(account.passwordEncrpt);
      console.log("decrypted---", { decrypted });
      account.decryptedPass = decrypted;
    }

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
  } catch (err) {
    console.log({ err });
    throw err;
  }
};

const create = async (params) => {
  try {
    if (await db.Test.findOne({ email: params.email })) {
      throw 'Email "' + params.email + '" is already registered';
    }

    const account = new db.Test(params);
    account.verifiedDate = Date.now();

    // hash password
    account.passwordHash = hash(params.password);

    // save account
    // await account.save();
    await account.save().then(async (res) => {
      if (params.referralId) {
        await addReferalId(params, res);
      }
    });

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
    (await db.Test.findOne({ email: params.email }))
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

const transactionPinUpdate2 = async (req, res, next) => {
  try {
    const params = req.body;
    const account = await db.Test.findOne({ _id: params.userId });
    if (!account) {
      res
        .status(400)
        .json({ status: 400, message: "Account not available", data: {} });
    } else {
      if (!account.transactionPin || account.transactionPin === "") {
        if (bcrypt.compareSync(params.transactionPin, account.passwordHash)) {
          res.status(400).json({
            status: 400,
            message: "Your pin and password can not be same!",
            data: {},
          });
        } else {
          let payload = {
            transactionPin: hash(params.transactionPin),
            hasTransactionPin: true,
            updated: Date.now(),
          };

          console.log({ payload });

          Object.assign(account, payload);
          await account.save().then((result) => {
            res.status(200).json({
              status: 200,
              message: "success",
              data: result,
            });
          });
        }
      } else {
        if (
          account.transactionPin &&
          !bcrypt.compareSync(params.transactionPin, account.transactionPin)
        ) {
          res
            .status(400)
            .json({ status: 400, message: "Your pin not match!", data: {} });
        } else {
          if (
            bcrypt.compareSync(params.newTransactionPin, account.passwordHash)
          ) {
            res.status(400).json({
              status: 400,
              message: "Your pin and password can not be same!",
              data: {},
            });
          } else if (
            bcrypt.compareSync(params.newTransactionPin, account.transactionPin)
          ) {
            res.status(400).json({
              status: 400,
              message: "Your pin and new pin can not be same!",
              data: {},
            });
          } else {
            let payload = {
              transactionPin: hash(params.newTransactionPin),
              updated: Date.now(),
            };

            Object.assign(account, payload);
            await account.save().then((result) => {
              res.status(200).json({
                status: 200,
                message: "success",
                data: result,
              });
            });
          }
        }
      }
    }
  } catch (err) {
    res.status(400).json({
      status: 400,
      message: "something went wrong",
      data: err,
    });
  }
};

const passwordUpdate = async (params) => {
  try {
    const account = await db.Test.findOne({ _id: params.userId });
    if (!account) {
      throw "Account not available";
    } else {
      if (!bcrypt.compareSync(params.currentPassword, account.passwordHash)) {
        throw "Your password not matched";
      } else {
        if (bcrypt.compareSync(params.newPassword, account.passwordHash)) {
          throw "old and new Password are same";
        } else {
          if (bcrypt.compareSync(params.newPassword, account.transactionPin)) {
            throw "Your pin and password can not be same";
          } else {
            params.passwordHash = hash(params.newPassword);
            Object.assign(account, params);
            account.updated = Date.now();
            return await account.save();
          }
        }
      }
    }
  } catch (err) {
    return err;
  }
};

const passwordUpdate2 = async (req, res, next) => {
  try {
    const { body } = req;
    const account = await db.Test.findOne({ _id: body.userId });
    if (!account) {
      res
        .status(400)
        .json({ status: 400, message: "Account not available", data: {} });
    } else {
      if (!bcrypt.compareSync(body.currentPassword, account.passwordHash)) {
        res.status(400).json({
          status: 400,
          message: "Your password not matched",
          data: {},
        });
      } else {
        if (bcrypt.compareSync(body.newPassword, account.passwordHash)) {
          res.status(400).json({
            status: 400,
            message: "old and new Password are same",
            data: {},
          });
        } else {
          if (bcrypt.compareSync(body.newPassword, account.transactionPin)) {
            res.status(400).json({
              status: 400,
              message: "Your password and transaction pin can not be same",
              data: {},
            });
          } else {
            body.passwordHash = hash(body.newPassword);
            Object.assign(account, body);
            account.updated = Date.now();
            await account.save().then((result) => {
              res.status(200).json({
                status: 200,
                message: "success",
                data: result,
              });
            });
          }
        }
      }
    }
  } catch (err) {
    res.status(400).json({
      status: 400,
      message: "some thing went wrong",
      data: err,
    });
  }
};

const checkPassword = async (params) => {
  const account = await db.Test.findOne({ _id: params.userId });
  if (!account) {
    throw "Account not available";
  } else {
    if (bcrypt.compareSync(params.newPassword, account.passwordHash)) {
      throw new Error("old and new Password are same");
    }
  }
};

const updateUserData = async (account) => {
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
    const referralData = await db.Referral.findOne({ referralCode: code });

    if (referralData) {
      const account = await db.Test.findOne({
        _id: referralData.userId,
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
  const account = await db.Test.findById(id);
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
    location,
    balance,
    isVerified,
    isActive,
    created,
    updated,
    verifiedDate,
    verificationToken,
    transactionPin,
    hasTransactionPin,
    walletBalance,
    isFirstLogin,
    stateId,
    city,
    pincode,
    transactionPinResetDate,
    pendingBalance,
    rewardedBalance,
  } = account;
  return {
    id,
    userName,
    phoneNumber,
    email,
    role,
    location,
    balance,
    isVerified,
    isActive,
    created,
    updated,
    verifiedDate,
    verificationToken,
    transactionPin,
    hasTransactionPin,
    walletBalance,
    isFirstLogin,
    stateId,
    city,
    pincode,
    transactionPinResetDate,
    pendingBalance,
    rewardedBalance,
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

const strToObj = (str) => {
  var obj = {};
  if (str && typeof str === "string") {
    var objStr = str.match(/\{(.)+\}/g);
    eval("obj =" + objStr);
  }
  return obj;
};

module.exports = {
  register,
  userRegister, //updated - registre2
  authenticate,
  authenticate2,
  refreshToken,
  revokeToken,

  verifyEmail,
  verifyMobileNo,
  verifyPhoneNoOtp, //updated - verifyMobileNo2
  forgotPassword,
  forgotPassword2, // updated
  forgotTransactionPin,
  validateResetToken,
  resetPassword,
  resetPassword2, // updated
  resetTransactionPin,

  getuserFromReferralCode,

  getAll,
  getAll2,
  getUserById,
  create,
  update,
  delete: _delete,
  getPincode,
  resendOtp,

  getUserIsFirstLogin,

  transactionPinUpdate2, // updated
  passwordUpdate,
  authenticateAdmin,
  passwordUpdate2, // updated
};
