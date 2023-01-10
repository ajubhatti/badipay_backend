const db = require("../_helpers/db");
const axios = require("axios");
const bcrypt = require("bcryptjs");
const transactionService = require("./transaction.service");
const generateRandomNumber = require("../_helpers/randomNumber");

var priorityCount = 1;

const createRecharge = async (req, res, next) => {
  try {
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
          console.log({ finalRechargeData });
          priorityCount = 1;
          if (finalRechargeData) {
            if (
              (finalRechargeData && finalRechargeData.TRNSTATUS == 0) ||
              (finalRechargeData.STATUSCODE &&
                finalRechargeData.STATUSCODE == 0) ||
              finalRechargeData.errorcode == 200
            ) {
              let discountData = await getDiscountData(finalRechargeData);

              console.log("discout data ---", discountData);
              if (discountData) {
                await addDiscount(params, discountData);
              } else {
                params.status = finalRechargeData.TRNSTATUSDESC || "success";
                await updateTransactionData(
                  params.userId,
                  params,
                  params.amount,
                  "debit"
                );
              }
            }

            params.customerNo = params.mobileNo;
            params.responseData = finalRechargeData;
            params.rechargeBy = finalRechargeData.rechargeBy;
            params.rechargeByApi = finalRechargeData.rechargeByApi;

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

const create = async (params) => {
  try {
    if (!params.transactionPin) {
      throw "transaction pin not found";
    } else {
      const account = await db.Account.findOne({ _id: params.userId });

      if (!bcrypt.compareSync(params.transactionPin, account.transactionPin)) {
        throw "your transaction pin not matched!";
      } else {
        let operator = await getOperatorById(params);

        if (operator) {
          let priority = 1;
          let finalRechargeData = await recursiveFunction(
            params,
            operator,
            priority
          );

          if (
            (finalRechargeData && finalRechargeData.TRNSTATUS == 0) ||
            (finalRechargeData.STATUSCODE &&
              finalRechargeData.STATUSCODE == 0) ||
            finalRechargeData.errorcode == 200
          ) {
            params.status = "success";
            await updateTransactionData(
              params.userId,
              params,
              params.amount,
              "debit"
            );
          }

          let discountData = await getDiscountData(finalRechargeData);

          if (discountData) {
            addDiscount(params, discountData);
          }
          params.customerNo = params.mobileNo;
          params.responseData = finalRechargeData;
          params.rechargeBy = finalRechargeData.rechargeBy;
          params.rechargeByApi = finalRechargeData.rechargeByApi;

          const rechargeData = new db.Recharge(params);
          await rechargeData.save().then(async () => {
            await updateUserData(params);
          });
          return rechargeData;
        }
      }
    }
  } catch (err) {
    console.error({ err });

    throw err;
  }
};

const getDiscountData = async (params) => {
  try {
    const { rechargeBy, rechargeDoneBy } = params;
    let discount = await db.ServiceDiscount.findOne({
      apiId: rechargeDoneBy._id,
      operatorId: rechargeBy._id,
    });

    return discount;
  } catch (err) {
    console.error({ err });
    // throw err;
  }
};

const addDiscount = async (params, discountData) => {
  try {
    var account = await db.Account.findById({ _id: params.userId });

    if (account && account.referralId) {
      updateReferalUserDiscount(params.discountData);
    }

    const { amount, type } = discountData;
    let disAmount = 0;
    if (type === "percentage") {
      let percentageAmount = amount / 100;
      disAmount = Number(params.amount) * percentageAmount;
    } else {
      disAmount = amount;
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

    await updateTransactionData(params.userId, params, disAmount, "credit");
  } catch (err) {
    console.error(err);
  }
};

const updateReferalUserDiscount = async (params, discountData) => {
  try {
    var account = await db.Account.findById({ _id: params.referralId });

    const { referalAmount, referalType } = discountData;
    let disAmount = 0;
    if (referalType === "percentage") {
      let percentageAmount = referalAmount / 100;
      disAmount =
        Number(params.amount) + Number(params.amount) * percentageAmount;
    } else {
      disAmount = Number(params.amount) + referalAmount;
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
    await updateTransactionData(params.referralId, params, disAmount, "credit");
  } catch (err) {
    console.error(err);
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

const updateTransactionData = async (userId, params, amount, type) => {
  try {
    let accountDetail = await await db.Account.findById({ _id: userId });
    console.log("account detail ---------------", accountDetail);
    let payload = {
      userId: params.userId,
      status: params.status == "Success" ? "approve" : "pending",
      slipNo: "",
      remark: "",
      description: {},
      operatorName: "",
      requestAmount: null,
      rechargeAmount: null,
      cashBackAmount: null,
    };

    if (type == "debit") {
      payload.type = "debit";
      payload.amount = params.amount || null;
      payload.slipNo = params.slipNo || "";
      payload.remark = params.remark || "";
      payload.userBalance = accountDetail.walletBalance || null;
      payload.description = params.description || {};
      payload.customerNo = params.mobileNo;
      payload.operatorName = "";
      payload.requestAmount = params.amount || null;
      payload.rechargeAmount = params.amount || null;
      payload.userFinalBalance = accountDetail.walletBalance - params.amount;
    } else {
      payload.type = "credit";
      payload.amount = null;
      payload.userBalance = accountDetail.walletBalance || null;
      payload.customerNo = params.mobileNo;
      payload.cashBackAmount = amount;
      payload.userFinalBalance = accountDetail.walletBalance + amount;
    }

    payload.transactionId = await generateRandomNumber(6);
    // params.transactionId = lastCount;
    const transactionData = new db.Transactions(payload);
    console.log("transactions payload ---", { payload, transactionData });
    return await transactionData.save();
  } catch (err) {
    console.error(err);
  }
};

const recursiveFunction = async (params, operator, apiPriority) => {
  try {
    let filteredOperator = await priorityCheck(operator, apiPriority);

    if (!filteredOperator) {
      apiPriority++;
      filteredOperator = await priorityCheck(operator, apiPriority);
    } else {
      let payload = {
        amount: params.amount,
        operatorCode: filteredOperator.apiCode,
        regMobileNumber: params.mobileNo,
      };

      let rechargeData = await doRecharge(filteredOperator, payload);
      rechargeData.rechargeBy = operator;

      if (
        (rechargeData && rechargeData.TRNSTATUS == 0) ||
        (rechargeData.STATUSCODE && rechargeData.STATUSCODE == 0) ||
        rechargeData.errorcode == 200
      ) {
        return rechargeData;
      } else {
        let result = await recursiveFunction(params, operator, apiPriority++);
        // result.rechargeBy = operator;

        console.log(result);
        return result;
      }
    }
  } catch (err) {
    console.error({ err });
    return err;
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
    rechargeData.rechargeBy = operator;
    console.log("-----------------------------------------------");
    console.log("rechargeData", rechargeData);
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

      rechargeWaleRes.rechargeDoneBy = filterData;
      if (rechargeWaleRes.errorcode != 200) {
        return rechargeWaleRes;
      } else {
        return rechargeWaleRes;
      }
    }

    if (apiName == "Ambika") {
      let ambikaRes = await ambikaRecharge(payload);

      ambikaRes.rechargeDoneBy = filterData;
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
  create,
  createRecharge,
  update,
  getById,
  getAll,
  delete: _delete,
};
