const db = require("../_helpers/db");
const axios = require("axios");
const bcrypt = require("bcryptjs");
const transactionService = require("./transaction.service");
const generateRandomNumber = require("../_helpers/randomNumber");
var priorityCount = 1;
var lastTransactionsReport = {};

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
        let operator = await getOperatorById(params);
        if (operator) {
          let finalRechargeData = await recursiveFunction2(params, operator);
          priorityCount = 1;
          console.log("final recharge data ----------", finalRechargeData);
          if (finalRechargeData) {
            if (
              (finalRechargeData && finalRechargeData.TRNSTATUS == 0) ||
              (finalRechargeData.STATUSCODE &&
                finalRechargeData.STATUSCODE == 0) ||
              finalRechargeData.errorcode == 200
            ) {
              await addDiscount2(params, finalRechargeData);
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

            params.customerNo = params.mobileNo;
            params.responseData = finalRechargeData;
            params.rechargeBy = finalRechargeData.rechargeOperator;
            params.rechargeByApi = finalRechargeData.rechargeApi;

            const rechargeData = new db.Recharge(params);
            await rechargeData.save().then(async () => {
              await updateUserData(params);
            });

            res.status(200).json({
              status: 200,
              data: rechargeData,
              message: "Recharge successful",
            });
          } else {
            updateTransactionData2(
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
  } catch (err) {
    console.error({ err });
    res.status(500).json({ status: 500, message: "", data: err });
  }
};

const addDiscount2 = async (params, rechargeData) => {
  try {
    var account = await db.Account.findById({ _id: params.userId });

    if (account && account.referralId) {
      updateReferalUserDiscount(account, params, rechargeData);
    }

    let disAmount = 0;
    if (rechargeData) {
      let discountData = await getDiscountData(rechargeData);
      console.log("discout data ---", discountData);
      if (discountData) {
        const { amount, type } = discountData;
        if (type === "percentage") {
          let percentageAmount = amount / 100;
          disAmount = Number(params.amount) * percentageAmount;
        } else {
          disAmount = amount;
        }
      }
    }

    let rewardAmount = account.rewardedBalance + disAmount;
    let userDisAmount = account.discount + disAmount;
    let walletBalance = account.walletBalance + disAmount;

    let userPayload = {
      discount: userDisAmount,
      rewardedBalance: rewardAmount,
      walletBalance: walletBalance,
    };
    Object.assign(account, userPayload);
    await account.save();

    await updateTransactionData(
      params.userId,
      params,
      disAmount,
      "credit",
      "user",
      rechargeData
    );
  } catch (err) {
    console.error(err);
  }
};

const updateReferalUserDiscount = async (accountData, params, rechargeData) => {
  try {
    let disAmount = 0;
    if (rechargeData) {
      let discountData = await getDiscountData(rechargeData);
      if (discountData) {
        const { referalAmount, referalType } = discountData;
        if (referalType === "percentage") {
          let percentageAmount = referalAmount / 100;
          disAmount =
            Number(params.amount) + Number(params.amount) * percentageAmount;
        } else {
          disAmount = Number(params.amount) + referalAmount;
        }
      }
    }

    var account = await db.Account.findById({ _id: accountData.referralId });
    let rewardAmount = account.rewardedBalance + disAmount;
    let userDisAmount = account.discount + disAmount;
    let walletBalance = account.walletBalance + disAmount;

    let userPayload = {
      discount: userDisAmount,
      rewardedBalance: rewardAmount,
      walletBalance: walletBalance,
    };

    Object.assign(account, userPayload);
    await account.save();
    await updateTransactionData(
      params.referralId,
      params,
      disAmount,
      "credit",
      "referral",
      rechargeData
    );
  } catch (err) {
    console.error(err);
  }
};

const getDiscountData = async (params) => {
  try {
    if (params) {
      const { rechargeOperator, rechargeApi } = params;
      let discount = await db.ServiceDiscount.findOne({
        apiId: rechargeApi._id,
        operatorId: rechargeOperator._id,
      });

      return discount;
    } else {
      return null;
    }
  } catch (err) {
    console.error({ err });
    // throw err;
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
  amount,
  type,
  discountType,
  rechargeData
) => {
  try {
    console.log({ userId, params, amount, type, discountType, rechargeData });

    let accountDetail = await db.Account.findById({ _id: userId });
    let payload = {
      userId: userId,
      slipNo: "",
      remark: "",
      description: {},
      operatorId: "",
      operatorName: "",
      requestAmount: null,
      rechargeAmount: null,
      cashBackAmount: null,
      type: "credit",
      customerNo: "",
      status: "success",
    };

    let rechargeAmount = params.amount - amount;
    let userFinalBalance = accountDetail.walletBalance - rechargeAmount;

    if (discountType == "user") {
      payload.slipNo = params.slipNo || "";
      payload.remark = params.remark || "";
      payload.description = params.description || {};
      payload.customerNo = params.mobileNo;
      payload.operatorName = "";
      payload.operatorId = "";
      payload.rechargeData = rechargeData;
      payload.amount = params.amount || null;
      payload.userBalance = accountDetail.walletBalance || null;
      payload.requestAmount = params.amount || null;
      payload.rechargeAmount = rechargeAmount || null;
      payload.cashBackAmount = amount;
      payload.userFinalBalance = userFinalBalance;
    } else {
      payload.amount = null;
      payload.userBalance = accountDetail.walletBalance || null;
      payload.cashBackAmount = amount;
      payload.userFinalBalance = userFinalBalance;
    }

    payload.transactionId = (await db.Transactions.countDocuments()) + 1;
    // params.transactionId = lastCount;
    const transactionData = new db.Transactions(payload);
    console.log("transactions payload ---", { payload, transactionData });
    let transactionRes = await transactionData.save();
    console.log({ transactionRes });
    return transactionRes;
  } catch (err) {
    console.error(err);
  }
};

const updateTransactionData2 = async (
  userId,
  params,
  amount,
  type,
  discountType,
  rechargeData
) => {
  try {
    console.log({ userId, params, amount, type, discountType, rechargeData });

    let accountDetail = await db.Account.findById({ _id: userId });
    let payload = {
      userId: userId,
      slipNo: "",
      remark: "",
      description: {},
      operatorId: "",
      operatorName: "",
      requestAmount: null,
      rechargeAmount: null,
      cashBackAmount: null,
      type: "credit",
      customerNo: "",
      status: "pending",
    };

    if (lastTransactionsReport) {
      console.log("lst trans cation report ----------", lastTransactionsReport);

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
    payload.amount = params.amount || null;
    payload.userBalance = accountDetail.walletBalance || null;
    payload.requestAmount = params.amount || null;
    payload.rechargeAmount = null;
    payload.cashBackAmount = null;
    payload.userFinalBalance = accountDetail.walletBalance;

    payload.transactionId = (await db.Transactions.countDocuments()) + 1;
    // params.transactionId = lastCount;
    const transactionData = new db.Transactions(payload);
    console.log("transactions payload in cancel and pending ---", {
      payload,
      transactionData,
    });
    let transactionRes = await transactionData.save();
    console.log({ transactionRes });
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
    console.log("in recharge fun ----------", { payload, filteredOperator });

    let rechargeData = await doRecharge(filteredOperator, payload);
    rechargeData.rechargeOperator = operator;
    console.log("-----------------------------------------------");
    console.log("rechargeData", rechargeData);
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
