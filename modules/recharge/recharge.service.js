const db = require("../../_helpers/db");
const axios = require("axios");
const bcrypt = require("bcryptjs");

var priorityCount = 1;

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
          console.log("finalrechargeData -------", finalRechargeData);

          if (
            (finalRechargeData && finalRechargeData.TRNSTATUS == 0) ||
            finalRechargeData.STATUSCODE == 0 ||
            finalRechargeData.errorcode == 200
          ) {
            params.status = "success";
          }

          let discountData = await getDiscountData(finalRechargeData);

          console.log("discout data ---", discountData);
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
    throw err;
  }
};

const getDiscountData = async (params) => {
  const { rechargeBy, rechargeDoneBy } = params;
  let discount = await db.ServiceDiscount.findOne({
    apiId: rechargeDoneBy._id,
    operatorId: rechargeBy._id,
  });

  return discount;
};

const addDiscount = async (params, discountData) => {
  var account = await db.Account.findById({ _id: params.userId });

  if (account.referralId) {
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
};

const updateReferalUserDiscount = async (params, discountData) => {
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
  return await account.save();
};

const updateUserData = async (params) => {
  var account = await db.Account.findById({ _id: params.userId });

  let walletCount = account.walletBalance - params.amount;
  let userPayload = { walletBalance: walletCount };
  Object.assign(account, userPayload);
  return await account.save();
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
      console.log("-----------------------------------------------");
      console.log("rechargeData", rechargeData);
      if (
        (rechargeData && rechargeData.TRNSTATUS == 0) ||
        rechargeData.STATUSCODE == 0 ||
        rechargeData.errorcode == 200
      ) {
        return rechargeData;
      } else {
        console.log(
          "recursiveFunctions----",
          params,
          typeof apiPriority,
          apiPriority++
        );
        let result = await recursiveFunction(params, operator, apiPriority++);
        // result.rechargeBy = operator;

        console.log("result======>", result);
        return result;
      }
    }
  } catch (err) {}
};

const priorityCheck = async (operator, priority) => {
  return operator.referenceApis.find(
    (x) => x.priority && x.priority == priority && x.isActive
  );
};

const doRecharge = async (filterData, payload) => {
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
};

const ambikaRecharge = async (params) => {
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
};

const RecharegeWaleRecharge = async (params) => {
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
};

const getOperatorById = async (params) => {
  return await db.Company.findOne({ _id: params.operator });
};

const update = async (id, params) => {
  const rechargeData = await getState(id);

  Object.assign(rechargeData, params);
  rechargeData.updated = Date.now();
  await rechargeData.save();

  return rechargeData;
};

const getById = async (id) => {
  const rechargeData = await getState(id);
  return rechargeData;
};

const getAll = async () => {
  const rechargeData = await db.Recharge.find();
  return rechargeData;
};

const _delete = async (id) => {
  const rechargeData = await getState(id);
  await rechargeData.remove();
};

const getState = async (id) => {
  if (!db.isValidId(id)) throw "Recharge not found";
  const rechargeData = await db.Recharge.findById(id);
  if (!rechargeData) throw "Recharge not found";
  return rechargeData;
};

module.exports = {
  create,
  update,
  getById,
  getAll,
  delete: _delete,
};
