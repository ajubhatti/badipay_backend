const db = require("../_helpers/db");
const axios = require("axios");
const bcrypt = require("bcryptjs");

var priorityCount = 1;
var lastTransactionsReport = {};
var responseJSON = {
  STATUSCODE: "0",
  STATUSMSG: "Success",
  REFNO: "1679739513",
  TRNID: 50239930,
  TRNSTATUS: 1,
  TRNSTATUSDESC: "Success",
  OPRID: "2865867125",
  BAL: 125.8355,
  rechargeApi: {
    _id: "632cd4c77cbd0e5d32d50fbd",
    apiName: "RechargeWale",
    apiDetail: "Recharge Wale",
    apiImage: "",
    isActive: true,
    created: "2022-09-22T21:33:59.185Z",
    __v: 0,
    apiCode: "AR",
    pendingLimit: "1",
    priority: "1",
    failureLimit: "1",
  },
  rechargeOperator: {
    _id: "632da0e95e38c36f95b2a77d",
    companyName: "Airtel",
    mobileAppCode: "1",
    companyDetail: "Airtel recharge",
    image: "",
    isActive: true,
    isVisible: true,
    providerType: "61ebf005b15b7b52ddc35dff",
    minAmount: 1,
    maxAmount: 1000,
    referenceApis: [
      {
        _id: "632cd4c77cbd0e5d32d50fbd",
        apiName: "RechargeWale",
        apiDetail: "Recharge Wale",
        apiImage: "",
        isActive: true,
        created: "2022-09-22T21:33:59.185Z",
        __v: 0,
        apiCode: "AR",
        pendingLimit: "1",
        priority: "1",
        failureLimit: "1",
      },
      {
        _id: "632974511164a0942d5d56 e1",
        apiName: "Ambika",
        apiDetail: "ambika api",
        apiImage: "",
        isActive: true,
        created: "2022-09-20T08:05:37.763Z",
        __v: 0,
        updated: "2022-09-22T21:53:41.053Z",
        apiCode: "201",
        pendingLimit: "1",
        priority: "2",
        failureLimit: "0",
      },
    ],
    created: "2022-09-23T12:04:57.054Z",
    __v: 19,
    updated: "2022-12-26T08:45:13.204Z",
    discountByApi: [],
  },
};

const createRecharge = async (req, res, next) => {
  try {
    lastTransactionsReport = {};
    const params = req.body;
    if (!params.transactionPin) {
      res
        .status(400)
        .json({ status: 400, data: "", message: "transaction pin not found" });
    } else {
      const account = await db.Account.findOne({ _id: params.userId });
      if (
        account &&
        !bcrypt.compareSync(params.transactionPin, account.transactionPin)
      ) {
        res.status(400).json({
          status: 400,
          data: "",
          message: "your transaction pin not matched!",
        });
      } else {
        console.log({ account });
        if (account && account.walletBalance <= 0) {
          res.status(400).json({
            status: 400,
            data: "",
            message: "your wallet balance is not enough!",
          });
        } else {
          let operator = await getOperatorById(params);
          if (operator) {
            let finalRechargeData = await recursiveFunction2(params, operator);
            // let finalRechargeData = responseJSON;
            priorityCount = 1;

            if (finalRechargeData) {
              params.customerNo = params.mobileNo;
              params.responseData = finalRechargeData;
              params.rechargeBy = finalRechargeData.rechargeOperator;
              params.rechargeByApi = finalRechargeData.rechargeApi;

              // we can delet this two keys because we already save it in rechargeBy and rechargeByApi
              // delete finalRechargeData.rechargeOperator;
              // delete finalRechargeData.rechargeApi;
              const rechargeData = new db.Recharge(params);
              const rechargeResult = await rechargeData.save();

              if (
                (finalRechargeData && finalRechargeData.TRNSTATUS == 0) ||
                (finalRechargeData.STATUSCODE &&
                  finalRechargeData.STATUSCODE == 0) ||
                finalRechargeData.errorcode == 200
              ) {
                await addDiscount2(params, rechargeResult);
              } else {
                await updateTransactionData2(
                  params.userId,
                  params,
                  0,
                  "credit",
                  "user",
                  lastTransactionsReport
                );
              }

              await updateUserData(params);

              res.status(200).json({
                status: 200,
                data: rechargeData,
                message: "Recharge successful",
              });
            } else {
              await updateTransactionData2(
                params.userId,
                params,
                0,
                "credit",
                "user",
                lastTransactionsReport
              );
              res.status(400).json({
                status: 400,
                data: "",
                message: "Recharge can not be proceed!",
              });
            }
          } else {
            res.status(400).json({
              status: 400,
              data: "",
              message: "operator not matched!",
            });
          }
        }
      }
    }
  } catch (err) {
    console.error({ err });
    res.status(500).json({ status: 500, message: "", data: err });
  }
};

const addDiscount2 = async (params, rechargeResult) => {
  try {
    var account = await db.Account.findById({ _id: params.userId });
    let discountData = await getDiscountData(params);

    await addDiscountAmount(
      account,
      params,
      discountData,
      "user",
      rechargeResult
    );

    const referalUserData = await db.Referral.findOne({
      userId: params.userId,
    });

    if (referalUserData && referalUserData.referredUser) {
      await updateReferalUserDiscount(params, rechargeResult, discountData);
    }
  } catch (err) {
    console.error(err);
  }
};

const updateReferalUserDiscount = async (
  params,
  rechargeResult,
  discountData
) => {
  try {
    const referalUserData = await db.Referral.findOne({
      userId: params.userId,
    });

    var account = await db.Account.findById({
      _id: referalUserData.referredUser,
    });

    console.log("referal account ---", account);
    await addDiscountAmount(
      account,
      params,
      discountData,
      "referral",
      rechargeResult
    );
  } catch (err) {
    console.error(err);
  }
};

const addDiscountAmount = async (
  account,
  params,
  discountData,
  type,
  rechargeResult
) => {
  let disAmount = 0;
  if (rechargeResult) {
    if (type === "referral") {
      const { referalDiscount, referalDiscountType } = discountData;
      if (referalDiscountType === "percentage") {
        let percentageAmount = referalDiscount / 100;
        disAmount = round(Number(params.amount) * percentageAmount, 2);
      } else {
        disAmount = round(referalDiscount, 2);
      }
    } else {
      const { userDiscount, userDiscountType } = discountData;
      if (userDiscountType === "percentage") {
        let percentageAmount = userDiscount / 100;
        disAmount = round(Number(params.amount) * percentageAmount, 2);
      } else {
        disAmount = round(userDiscount, 2);
      }
    }
  }
  let rewardAmount = account.rewardedBalance + disAmount;
  let walletBalance = account.walletBalance + disAmount;

  let userPayload = {
    lastDiscount: round(disAmount, 2), //last discount amount update
    rewardedBalance: round(rewardAmount, 2), // total discount amount upate
    walletBalance: round(walletBalance, 2), // user wallet balance update
  };

  Object.assign(account, userPayload);
  await account.save();

  await updateTransactionData(
    account._id,
    params,
    disAmount,
    type,
    rechargeResult,
    discountData
  );
};

const getDiscountData = async (params) => {
  try {
    if (params) {
      const { rechargeBy, rechargeByApi } = params;
      let discount = await db.ServiceDiscount.findOne({
        apiId: rechargeByApi._id,
        operatorId: rechargeBy._id,
      });

      return discount;
    } else {
      return null;
    }
  } catch (err) {
    console.error({ err });
    // throw err;
    return null;
  }
};

const updateUserData = async (params) => {
  try {
    var account = await db.Account.findById({ _id: params.userId });

    let walletCount = account.walletBalance - params.amount;
    let userPayload = { walletBalance: walletCount };
    Object.assign(account, userPayload);
    return await account.save();
  } catch (err) {
    console.error(err);
  }
};

const updateTransactionData = async (
  userId,
  params,
  discountAmount,
  userType,
  rechargeResult,
  discountData
) => {
  try {
    console.log({
      userId,
      params,
      discountAmount,
      userType,
      rechargeResult,
      discountData,
    });
    let accountDetail = await db.Account.findById({ _id: userId });

    let payload = {
      userId: userId,
      slipNo: "",
      remark: "",
      description: {},
      operatorId: "",
      operatorName: "",
      requestAmount: 0,
      rechargeAmount: 0,
      cashBackAmount: 0,
      type: "credit",
      customerNo: "",
      status: "success",
    };

    let rechargeAmount = round(params.amount, 2) - round(discountAmount, 2);
    let userFinalBalance =
      round(accountDetail.walletBalance, 2) -
      round(discountAmount, 2) -
      round(rechargeAmount, 2);

    if (userType == "user") {
      payload.slipNo = params.slipNo || "";
      payload.remark = params.remark || "";
      payload.description = params.description || {};
      payload.customerNo = params.mobileNo;
      payload.operatorName = "";
      payload.operatorId = "";
      payload.rechargeData = rechargeResult.responseData;
      payload.amount = round(params.amount, 2) || 0;
      payload.userBalance =
        round(accountDetail.walletBalance, 2) - round(discountAmount, 2) || 0;
      payload.requestAmount = round(params.amount, 2) || 0;
      payload.rechargeAmount = round(rechargeAmount, 2) || 0;
      payload.cashBackAmount = round(discountAmount, 2);
      payload.userFinalBalance = round(userFinalBalance, 2);
      payload.apiProvider = rechargeResult.rechargeByApi._id;
      payload.serviceType = rechargeResult.rechargeBy.providerType;
    } else {
      payload.amount = 0;
      payload.userBalance =
        round(accountDetail.walletBalance, 2) - round(discountAmount, 2) || 0;
      payload.cashBackAmount = round(discountAmount, 2);
      payload.userFinalBalance = round(accountDetail.walletBalance, 2);
    }

    payload.rechargeId = rechargeResult._id;
    payload.transactionId = (await db.Transactions.countDocuments()) + 1;
    console.log("check type and payload ---", userType, payload);
    const transactionData = new db.Transactions(payload);
    let transactionRes = await transactionData.save();

    if (userType == "user") {
      let adminDiscnt = 0;
      const { adminDiscount, adminDiscountType } = discountData;
      if (adminDiscountType === "percentage") {
        let percentageAmount = adminDiscount / 100;
        adminDiscnt = round(Number(params.amount) * percentageAmount, 2);
      } else {
        adminDiscnt = round(adminDiscount, 2);
      }

      let cashBackPayload = {
        requestAmount: params.amount,
        rechargeId: rechargeResult._id,
        userId: params.userId,
        transactionId: transactionRes._id,
        rechargeAmount: round(params.amount, 2),
        cashBackReceive: round(adminDiscnt, 2),
        userCashBack: round(discountAmount, 2),
        referralCashBack: 0,
        netCashBack: round(adminDiscnt, 2) - round(discountAmount, 2),
      };

      console.log({ cashBackPayload });
      const cashBackData = await new db.Cashback(cashBackPayload);
      await cashBackData.save();
      console.log("cashback save ----", cashBackData);

      let loyaltyData = await db.AdminLoyalty.find();
      if (loyaltyData.length > 0) {
        let loyaltyRes = loyaltyData[0];
        console.log("loyaltyRes data ------", loyaltyRes);
        console.log(
          "check type ----",
          loyaltyRes.netCashBack,
          adminDiscnt,
          discountAmount
        );
        let lyltyPayld = {
          requestAmount:
            round(loyaltyRes.requestAmount, 2) + round(params.amount, 2),

          rechargeAmount:
            round(loyaltyRes.rechargeAmount, 2) + round(rechargeAmount, 2),

          cashBackReceive:
            round(loyaltyRes.cashBackReceive, 2) + round(adminDiscnt, 2),

          userCashBack:
            round(loyaltyRes.userCashBack, 2) + round(discountAmount, 2),

          referralCashBack: round(loyaltyRes.referralCashBack, 2) + 0,

          netCashBack:
            round(loyaltyRes.netCashBack, 2) +
            round(loyaltyRes.netCashBack, 2) +
            round(adminDiscnt, 2) -
            round(discountAmount, 2),
        };

        console.log("lyltyPayld ---------", lyltyPayld);

        Object.assign(loyaltyRes, lyltyPayld);
        loyaltyRes.updated = Date.now();
        await loyaltyRes.save();
      } else {
        let addlyltyPayld = {
          requestAmount: round(params.amount, 2),
          rechargeAmount: round(rechargeAmount, 2),
          cashBackReceive: round(adminDiscnt, 2),
          userCashBack: round(discountAmount, 2),
          referralCashBack: 0,
          netCashBack: round(adminDiscnt, 2) - round(discountAmount, 2),
        };
        console.log("addlyltyPayld -------------", addlyltyPayld);
        const loyaltyData = new db.AdminLoyalty(addlyltyPayld);
        await loyaltyData.save();
      }
    } else {
      console.log("recharge id ---------------", rechargeResult._id);
      let cashBack = await db.Cashback.findOne({
        rechargeId: rechargeResult._id,
      });
      console.log("update cashback ---", cashBack);
      if (cashBack) {
        let updatePayld = {
          referralCashBack: round(discountAmount, 2),
          netCashBack:
            round(cashBack.netCashBack, 2) - round(discountAmount, 2),
        };

        console.log("update payload ---", updatePayld);

        Object.assign(cashBack, updatePayld);
        cashBack.updated = Date.now();
        await cashBack.save();

        let loyaltyData = await db.AdminLoyalty.find();
        if (loyaltyData.length > 0) {
          let loyaltyRes = loyaltyData[0];
          let lyltyPayld = {
            referralCashBack:
              round(loyaltyRes.referralCashBack, 2) + round(discountAmount, 2),

            netCashBack:
              round(loyaltyRes.netCashBack, 2) +
              round(loyaltyRes.netCashBack) -
              round(discountAmount, 2),
          };

          Object.assign(loyaltyRes, lyltyPayld);
          loyaltyRes.updated = Date.now();
          await loyaltyRes.save();
        }
      }
    }

    return transactionRes;
  } catch (err) {
    console.error({ err });
  }
};

function round(num, decimalPlaces = 0) {
  if (!Number.isNaN(num)) {
    num = Math.round(num + "e" + decimalPlaces);
    return Number(num + "e" + -decimalPlaces);
  }
}

const updateTransactionData2 = async (
  userId,
  params,
  amount,
  type,
  discountType,
  rechargeData
) => {
  try {
    let accountDetail = await db.Account.findById({ _id: userId });
    let payload = {
      userId: userId,
      slipNo: "",
      remark: "",
      description: {},
      operatorId: "",
      operatorName: "",
      requestAmount: 0,
      rechargeAmount: 0,
      cashBackAmount: 0,
      type: "credit",
      customerNo: "",
      status: "pending",
    };

    if (lastTransactionsReport) {
      if (
        (lastTransactionsReport.TRNSTATUS &&
          lastTransactionsReport.TRNSTATUS !== 4) ||
        (lastTransactionsReport.TRNSTATUSDESC &&
          lastTransactionsReport.TRNSTATUSDESC !== "Pending") ||
        (lastTransactionsReport.status && lastTransactionsReport.status !== 4)
      ) {
        payload.status = "failed";
      }
    }

    payload.slipNo = params.slipNo || "";
    payload.remark = params.remark || "";
    payload.description = params.description || {};
    payload.customerNo = params.mobileNo;
    payload.operatorName = "";
    payload.operatorId = "";
    payload.rechargeData = rechargeData;
    payload.amount = params.amount || 0;
    payload.userBalance = accountDetail.walletBalance || 0;
    payload.requestAmount = params.amount || 0;
    payload.rechargeAmount = 0;
    payload.cashBackAmount = 0;
    payload.userFinalBalance = accountDetail.walletBalance;

    payload.transactionId = (await db.Transactions.countDocuments()) + 1;
    const transactionData = new db.Transactions(payload);

    let transactionRes = await transactionData.save();

    return transactionRes;
  } catch (err) {
    console.error(err);
  }
};

const recursiveFunction2 = async (params, operator) => {
  try {
    if (operator && operator.referenceApis.length >= priorityCount) {
      let filteredOperator;
      if (!filteredOperator) {
        filteredOperator = await priorityCheck(operator, priorityCount);
        priorityCount++;
        return await rechargeFunction(params, operator, filteredOperator);
      } else {
        return await rechargeFunction(params, operator, filteredOperator);
      }
    } else {
      // throw Error();
      // throw new Error("operator not found");

      return;
    }
  } catch (err) {
    console.error({ err });
    return err;
  }
};

const rechargeFunction = async (params, operator, filteredOperator) => {
  try {
    let payload = {
      amount: params.amount,
      operatorCode: filteredOperator.apiCode,
      regMobileNumber: params.mobileNo,
    };

    let rechargeData = await doRecharge(filteredOperator, payload);
    delete operator.referenceApis;
    rechargeData.rechargeOperator = operator;

    lastTransactionsReport = rechargeData;
    if (
      (rechargeData && rechargeData.TRNSTATUS == 0) ||
      (rechargeData.STATUSCODE && rechargeData.STATUSCODE == 0) ||
      rechargeData.errorcode == 200
    ) {
      return rechargeData;
    } else {
      await recursiveFunction2(params, operator);
    }
  } catch (err) {
    console.error(err);
  }
};

const priorityCheck = async (operator, priority) => {
  try {
    return await operator.referenceApis.find((x) => {
      return x.priority && x.priority == priority && x.isActive;
    });
  } catch (err) {
    console.error(err);
  }
};

const doRecharge = async (filterData, payload) => {
  try {
    const { apiName } = filterData;
    if (apiName == "RechargeWale") {
      let rechargeWaleRes = await RecharegeWaleRecharge(payload);

      rechargeWaleRes.rechargeApi = filterData;
      if (rechargeWaleRes.errorcode != 200) {
        return rechargeWaleRes;
      } else {
        return rechargeWaleRes;
      }
    }

    if (apiName == "Ambika") {
      let ambikaRes = await ambikaRecharge(payload);

      ambikaRes.rechargeApi = filterData;
      if (ambikaRes.errorcode != 200) {
        return ambikaRes;
      } else {
        return ambikaRes;
      }
    }
  } catch (err) {
    console.error(err);
  }
};

const ambikaRecharge = async (params) => {
  try {
    const { amount, operatorCode, regMobileNumber } = params;

    let longitude = 72.8399872;
    let latitude = 21.1910656;
    let areaPincode = 395002;
    let optional1 = "";
    let optional2 = "";
    let optional3 = "";
    let optional4 = "";
    let AMBIKA_TOKEN = "759f6d09ef62ec7c86da53e986151519";
    let AMBIKA_USERID = 16900;
    let AMBIKA_CUSTOMERNO = 7227062486;

    let token = process.env.AMBIKA_TOKEN || AMBIKA_TOKEN;
    let userID = process.env.AMBIKA_USERID || AMBIKA_USERID;
    let cutomerNo = process.env.AMBIKA_CUSTOMERNO || AMBIKA_CUSTOMERNO;
    var timeStamp = Math.round(new Date().getTime() / 1000);

    let serviceUrl = `http://api.ambikamultiservices.com/API/TransactionAPI?UserID=${userID}&Token=${token}&Account=${regMobileNumber}&Amount=${amount}&SPKey=${operatorCode}&ApiRequestID=${timeStamp}&Optional1=${optional1}&Optional2=${optional2}&Optional3=${optional3}&Optional4=${optional4}&GEOCode=${longitude},${latitude}&CustomerNumber=${cutomerNo}&Pincode=${areaPincode}&Format=1`;

    console.log("service url ambika ---------------------------", serviceUrl);

    return await axios
      .get(serviceUrl)
      .then((res) => {
        return res.data;
      })
      .catch((err) => {
        return err;
      });
  } catch (err) {
    console.error(err);
  }
};

const RecharegeWaleRecharge = async (params) => {
  try {
    const { amount, operatorCode, regMobileNumber } = params;

    var timeStamp = Math.round(new Date().getTime() / 1000);

    let mobileNo = 8200717122;
    let apiKey = "QfnXHtK9ehMwULqzwY9PimddkEGksbLKBpr";
    let refNo = timeStamp;
    let reqType = "RECH";
    let serviceCode = operatorCode;
    let customerNo = regMobileNumber;
    let refMobileNo = "";
    let amounts = amount;
    let stv = 0;

    let serviceUrl = `http://www.rechargewaleapi.com/RWARechargeAPI/RechargeAPI.aspx?MobileNo=${mobileNo}&APIKey=${apiKey}&REQTYPE=${reqType}&REFNO=${refNo}&SERCODE=${serviceCode}&CUSTNO=${customerNo}&REFMOBILENO=${refMobileNo}&AMT=${amounts}&STV=${stv}&RESPTYPE=JSON`;
    console.log("service url recharge ---------------------------", serviceUrl);

    return await axios
      .get(serviceUrl)
      .then((res) => {
        return res.data;
      })
      .catch((err) => {
        return err;
      });
  } catch (err) {
    console.error(err);
  }
};

const getOperatorById = async (params) => {
  try {
    return await db.Company.findOne({ _id: params.operator });
  } catch (err) {
    throw err;
  }
};

const update = async (id, params) => {
  try {
    const rechargeData = await getState(id);

    Object.assign(rechargeData, params);
    rechargeData.updated = Date.now();
    await rechargeData.save();

    return rechargeData;
  } catch (err) {
    console.error(err);
  }
};

const getById = async (id) => {
  try {
    const rechargeData = await getState(id);
    return rechargeData;
  } catch (err) {
    console.error(err);
  }
};

const getAll = async () => {
  try {
    const rechargeData = await db.Recharge.find();
    return rechargeData;
  } catch (err) {
    console.error(err);
  }
};

const _delete = async (id) => {
  try {
    const rechargeData = await getRecharge(id);
    await rechargeData.remove();
  } catch (err) {
    console.error(err);
  }
};

const getRecharge = async (id) => {
  try {
    if (!db.isValidId(id)) throw "Recharge not found";
    const rechargeData = await db.Recharge.findById(id);
    if (!rechargeData) throw "Recharge not found";
    return rechargeData;
  } catch (err) {
    console.error(err);
  }
};

module.exports = {
  createRecharge,
  update,
  getById,
  getAll,
  delete: _delete,
};
