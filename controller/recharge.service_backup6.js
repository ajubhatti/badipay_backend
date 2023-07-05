const db = require("../_helpers/db");
const axios = require("axios");
const bcrypt = require("bcryptjs");
const { updateTransactionById } = require("./transaction.service");
const { CONSTANT_STATUS } = require("../_helpers/constant");
const mongoose = require("mongoose");
const { roundOfNumber } = require("../_middleware/middleware");
const moment = require("moment");
const { operatorConfigDataPageWise } = require("./operatorConfig.services");
const {
  successResponseByRechargeWale,
  rechargeWaleRechargeData,
} = require("../_helpers/responses");

var priorityCount = 1;

const createNewRecharge = async (params) => {
  try {
    if (params.requiredFields) {
      for (let i = 0; i < params.requiredFields.length; i++) {
        if (
          params.requiredFields[i].fieldValue === "mobileNo" ||
          params.requiredFields[i].fieldValue === "accountNo"
        ) {
          params.customerNo = params.requiredFields[i].value;
        } else {
          params[params.requiredFields[i].fieldValue] =
            params.requiredFields[i].value;
        }
      }
    }
    if (!params.transactionPin) {
      throw "Transaction pin not found!";
    } else {
      const account = await db.Account.findOne({ _id: params.userId });
      if (
        account &&
        !bcrypt.compareSync(params.transactionPin, account.transactionPin)
      ) {
        throw "Your transaction pin not matched!";
      } else {
        if (
          account &&
          (account.walletBalance <= 0 ||
            account.walletBalance - params.amount < 0)
        ) {
          throw "Your wallet balance is not enough!";
        } else {
          let operator = await getOperatorById(params);
          if (operator) {
            let finalRechargeData = await recursiveFunction(params, operator);
            console.log("line 179 --finalrecharge data->>", finalRechargeData);
            priorityCount = 1;

            if (finalRechargeData) {
              params.responseData = finalRechargeData;
              params.rechargeByOperator =
                finalRechargeData.operatorConfig.operatorData;
              params.rechargeByApi = finalRechargeData.operatorConfig.apiData;
              params.operatorId = finalRechargeData.operatorConfig.operatorId;
              params.apiId = finalRechargeData.operatorConfig.apiId;

              const rechargeData = new db.Recharge(params);
              const rechargeResult = await rechargeData.save();
              console.log({ rechargeResult });

              if (
                (finalRechargeData && finalRechargeData.TRNSTATUS == 0) ||
                (finalRechargeData.STATUSCODE &&
                  finalRechargeData.STATUSCODE == 0) ||
                finalRechargeData.errorcode == 200
              ) {
                console.log("========== if success =================");
                await addDiscount(params, rechargeResult);
                Object.assign(rechargeResult, {
                  status: CONSTANT_STATUS.SUCCESS,
                });
                await rechargeResult.save();
                await updateUserData(params);
                return rechargeResult;
              } else {
                console.log("========== if fail =================");
                Object.assign(rechargeResult, {
                  status: CONSTANT_STATUS.FAILED,
                });
                await rechargeResult.save();
                await updateTransactionData2(
                  params.userId,
                  params,
                  finalRechargeData,
                  rechargeResult
                );
              }

              return rechargeResult;
            } else {
              throw "Recharge can not be proceed!";
            }
          } else {
            throw "operator not found!";
          }
        }
      }
    }
  } catch (err) {
    console.error({ err });
    throw err;
  }
};

const addDiscount = async (params, rechargeResult) => {
  try {
    let userAccount = await db.Account.findById({ _id: params.userId });
    await addDiscountAmount(userAccount, params, "user", rechargeResult);

    const referalUser = await db.Referral.findOne({
      userId: params.userId,
    });

    if (referalUser && referalUser.referredUser) {
      await updateReferalUserDiscount(
        params,
        rechargeResult,
        referalUser.referredUser
      );
    }
  } catch (err) {
    console.error(err);
  }
};

const updateReferalUserDiscount = async (
  params,
  rechargeResult,
  referredUser
) => {
  try {
    let userAccount = await db.Account.findById({
      _id: referredUser,
    });

    await addDiscountAmount(userAccount, params, "referral", rechargeResult);
  } catch (err) {
    console.error(err);
  }
};

const addDiscountAmount = async (account, params, userType, rechargeResult) => {
  let discountData = await getDiscountData(params);
  let disAmount = 0;
  if (rechargeResult) {
    if (userType === "referral") {
      const { referalDiscount, referalDiscountType } = discountData;
      if (referalDiscountType === "percentage") {
        let percentageAmount = referalDiscount / 100;
        disAmount = roundOfNumber(Number(params.amount) * percentageAmount);
      } else {
        disAmount = roundOfNumber(referalDiscount);
      }
    } else {
      const { userDiscount, userDiscountType } = discountData;
      if (userDiscountType === "percentage") {
        let percentageAmount = userDiscount / 100;
        disAmount = roundOfNumber(Number(params.amount) * percentageAmount);
      } else {
        disAmount = roundOfNumber(userDiscount);
      }
    }
  }
  let rewardAmount = account.rewardedBalance + disAmount;
  let walletBalance = account.walletBalance + disAmount;

  let userPayload = {
    lastDiscount: roundOfNumber(disAmount), //last discount amount update
    rewardedBalance: roundOfNumber(rewardAmount), // total discount amount upate
    walletBalance: roundOfNumber(walletBalance), // user wallet balance update
  };

  Object.assign(account, userPayload);
  await account.save();

  await updateTransactionData(
    account._id,
    params,
    disAmount,
    userType,
    rechargeResult,
    discountData
  );
};

const getDiscountData = async (params) => {
  try {
    const { operatorId, apiId } = params;
    let discount = await db.ServiceDiscount.findOne({
      apiId: mongoose.Types.ObjectId(apiId),
      operatorId: mongoose.Types.ObjectId(operatorId),
    });
    return discount;
  } catch (err) {
    console.error({ err });
    return null;
  }
};

const updateUserData = async (params) => {
  try {
    let account = await db.Account.findById({ _id: params.userId });

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
      status: CONSTANT_STATUS.SUCCESS,
    };

    let rechargeAmount =
      roundOfNumber(params.amount) - roundOfNumber(discountAmount);
    let userFinalBalance =
      roundOfNumber(accountDetail.walletBalance) -
      roundOfNumber(discountAmount) -
      roundOfNumber(rechargeAmount);

    if (userType == "user") {
      payload.slipNo = params.slipNo || "";
      payload.remark = params.remark || "";
      payload.description = params.description || {};
      payload.customerNo = params.mobileNo || params.customerNo;
      payload.operatorName = "";
      payload.operatorId = rechargeResult.operatorId;
      payload.rechargeData = rechargeResult.responseData;
      payload.amount = roundOfNumber(params.amount) || 0;
      payload.userBalance =
        roundOfNumber(accountDetail.walletBalance) -
          roundOfNumber(discountAmount) || 0;
      payload.requestAmount = roundOfNumber(params.amount) || 0;
      payload.rechargeAmount = roundOfNumber(rechargeAmount) || 0;
      payload.cashBackAmount = roundOfNumber(discountAmount);
      payload.userFinalBalance = roundOfNumber(userFinalBalance);
      payload.apiProvider = rechargeResult.apiId;
      payload.serviceType =
        rechargeResult.responseData.operatorConfig.serviceId;
    } else {
      payload.amount = 0;
      payload.userBalance =
        roundOfNumber(accountDetail.walletBalance) -
          roundOfNumber(discountAmount) || 0;
      payload.cashBackAmount = roundOfNumber(discountAmount);
      payload.userFinalBalance = roundOfNumber(accountDetail.walletBalance);
    }

    payload.rechargeId = rechargeResult._id;
    payload.transactionId = (await db.Transactions.countDocuments()) + 1;

    const transactionData = new db.Transactions(payload);
    let transactionRes = await transactionData.save();

    if (userType == "user") {
      let adminDiscnt = 0;
      const { adminDiscount, adminDiscountType } = discountData;
      if (adminDiscountType === "percentage") {
        let percentageAmount = adminDiscount / 100;
        adminDiscnt = roundOfNumber(Number(params.amount) * percentageAmount);
      } else {
        adminDiscnt = roundOfNumber(adminDiscount);
      }

      let cashBackPayload = {
        requestAmount: params.amount,
        rechargeId: rechargeResult._id,
        userId: params.userId,
        transactionId: transactionRes._id,
        rechargeAmount: roundOfNumber(rechargeAmount) || 0,
        cashBackReceive: roundOfNumber(adminDiscnt),
        userCashBack: roundOfNumber(discountAmount),
        referralCashBack: 0,
        netCashBack: roundOfNumber(adminDiscnt) - roundOfNumber(discountAmount),
        status: payload.status,
        apiId: rechargeResult.rechargeByApi._id,
        operatorId: rechargeResult.rechargeByOperator.providerType,
      };

      const cashBackData = await new db.Cashback(cashBackPayload);
      await cashBackData.save();

      let loyaltyData = await db.AdminLoyalty.find();
      if (loyaltyData.length > 0) {
        let loyaltyRes = loyaltyData[0];

        let lyltyPayld = {
          requestAmount:
            roundOfNumber(loyaltyRes.requestAmount) +
            roundOfNumber(params.amount),

          rechargeAmount:
            roundOfNumber(loyaltyRes.rechargeAmount) +
            roundOfNumber(rechargeAmount),

          cashBackReceive:
            roundOfNumber(loyaltyRes.cashBackReceive) +
            roundOfNumber(adminDiscnt),

          userCashBack:
            roundOfNumber(loyaltyRes.userCashBack) +
            roundOfNumber(discountAmount),

          referralCashBack: roundOfNumber(loyaltyRes.referralCashBack) + 0,

          netCashBack:
            roundOfNumber(loyaltyRes.netCashBack) +
            roundOfNumber(loyaltyRes.netCashBack) +
            roundOfNumber(adminDiscnt) -
            roundOfNumber(discountAmount),
        };

        Object.assign(loyaltyRes, lyltyPayld);
        loyaltyRes.updated = Date.now();
        await loyaltyRes.save();
      } else {
        let addlyltyPayld = {
          requestAmount: roundOfNumber(params.amount),
          rechargeAmount: roundOfNumber(rechargeAmount),
          cashBackReceive: roundOfNumber(adminDiscnt),
          userCashBack: roundOfNumber(discountAmount),
          referralCashBack: 0,
          netCashBack:
            roundOfNumber(adminDiscnt) - roundOfNumber(discountAmount),
        };

        const loyaltyData = new db.AdminLoyalty(addlyltyPayld);
        await loyaltyData.save();
      }
    } else {
      let cashBack = await db.Cashback.findOne({
        rechargeId: rechargeResult._id,
      });

      if (cashBack) {
        let updatePayld = {
          referralCashBack: roundOfNumber(discountAmount),
          netCashBack:
            roundOfNumber(cashBack.netCashBack) - roundOfNumber(discountAmount),
          status: CONSTANT_STATUS.SUCCESS,
        };

        Object.assign(cashBack, updatePayld);
        cashBack.updated = Date.now();
        await cashBack.save();

        let loyaltyData = await db.AdminLoyalty.find();
        if (loyaltyData.length > 0) {
          let loyaltyRes = loyaltyData[0];
          let lyltyPayld = {
            referralCashBack:
              roundOfNumber(loyaltyRes.referralCashBack) +
              roundOfNumber(discountAmount),

            netCashBack:
              roundOfNumber(loyaltyRes.netCashBack) +
              roundOfNumber(loyaltyRes.netCashBack) -
              roundOfNumber(discountAmount),
          };

          Object.assign(loyaltyRes, lyltyPayld);
          loyaltyRes.updated = Date.now();
          await loyaltyRes.save();
        }
      }
    }
  } catch (err) {
    console.error({ err });
  }
};

const updateTransactionData2 = async (
  userId,
  params,
  rechargeData,
  rechargeResult
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
      status: CONSTANT_STATUS.PENDING,
    };

    if (rechargeData) {
      if (
        (rechargeData.TRNSTATUS && rechargeData.TRNSTATUS !== 4) ||
        (rechargeData.TRNSTATUSDESC &&
          rechargeData.TRNSTATUSDESC !== CONSTANT_STATUS.PENDING) ||
        (rechargeData.status && rechargeData.status !== 4)
      ) {
        payload.status = CONSTANT_STATUS.FAILED;
      }
    }

    payload.slipNo = params.slipNo || "";
    payload.remark = params.remark || "";
    payload.description = params.description || {};
    payload.customerNo = params.mobileNo || params.customerNo;
    payload.operatorName = "";
    payload.operatorId = rechargeResult.operatorId;
    payload.rechargeData = rechargeData;
    payload.amount = roundOfNumber(params.amount) || 0;
    payload.userBalance = roundOfNumber(accountDetail.walletBalance) || 0;
    payload.requestAmount = roundOfNumber(params.amount) || 0;
    payload.rechargeAmount = 0;
    payload.cashBackAmount = 0;
    payload.userFinalBalance = roundOfNumber(accountDetail.walletBalance);
    payload.apiProvider = rechargeResult.apiId;
    payload.serviceType = rechargeResult.responseData.operatorConfig.serviceId;

    payload.rechargeId = rechargeResult._id;
    payload.transactionId = (await db.Transactions.countDocuments()) + 1;
    const transactionData = new db.Transactions(payload);
    await transactionData.save();
  } catch (err) {
    console.error({ err });
  }
};

const recursiveFunction = async (params, operator) => {
  try {
    let operatorConfigList = await operatorConfigDataPageWise({
      operator: params.operator,
    });

    if (operatorConfigList && operatorConfigList.data.length >= priorityCount) {
      let filteredOperator;
      if (!filteredOperator) {
        filteredOperator = await priorityCheck(
          priorityCount,
          operatorConfigList
        );
        priorityCount++;
        if (filteredOperator) {
          let apiRes = await rechargeFunction(
            params,
            operator,
            filteredOperator
          );
          console.log({ apiRes });
          if (
            apiRes &&
            ((apiRes && apiRes.TRNSTATUS == 0) ||
              (apiRes.STATUSCODE && apiRes.STATUSCODE == 0) ||
              apiRes.errorcode == 200)
          ) {
            console.log("-------------- success ------------------");
            return apiRes;
          } else {
            if (
              operatorConfigList &&
              operatorConfigList.data.length >= priorityCount
            ) {
              console.log("-------------- recurse ------------------");
              return await recursiveFunction(params, operator);
            } else {
              console.log("-------------- fail ------------------");
              return apiRes;
            }
          }
        }
      }
    }
  } catch (err) {
    console.error({ err });
    return err;
  }
};

const priorityCheck = async (priority, operatorConfig) => {
  return await operatorConfig.data.find((x) => {
    return x.priority && x.priority == priority && x.isActive;
  });
};

const rechargeFunction = async (params, operator, filteredOperatorConfig) => {
  try {
    let payload = {
      amount: params.amount,
      operatorCode: filteredOperatorConfig.apiCode,
      regMobileNumber: params.customerNo,
    };

    if (params.requiredFields) {
      for (let i = 0; i < params.requiredFields.length; i++) {
        if (
          params.requiredFields[i].fieldValue === "mobileNo" ||
          params.requiredFields[i].fieldValue === "accountNo"
        ) {
          payload.regMobileNumber = params.requiredFields[i].value;
        } else {
          payload[params.requiredFields[i].fieldValue] =
            params.requiredFields[i].value;
        }
      }
    }

    let rechargeRes = await doRecharge(filteredOperatorConfig, payload);
    rechargeRes.operatorConfig = filteredOperatorConfig;
    // let rechargeRes = rechargeWaleRechargeData;

    return rechargeRes;
  } catch (err) {
    console.error(err);
    return err;
  }
};

const doRecharge = async (filterOperatorConfig, payload) => {
  try {
    const { apiName } = filterOperatorConfig.apiData;

    if (apiName == "RechargeWale") {
      return await RecharegeWaleRecharge(payload);
    }

    if (apiName == "Ambika") {
      return await ambikaRecharge(payload);
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
    let timeStamp = Math.round(new Date().getTime() / 1000);

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

    let timeStamp = Math.round(new Date().getTime() / 1000);
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
    return await db.Operator.findOne({ _id: params.operator });
  } catch (err) {
    throw err;
  }
};

const updateRechargeById = async (id, params) => {
  try {
    const rechargeData = await getRecharge(id);

    Object.assign(rechargeData, params);
    rechargeData.updated = Date.now();
    await rechargeData.save();

    let transaction = await db.Transactions.findOne({ rechargeId: id });

    let transactionId = transaction._id;

    await updateTransactionById(transactionId, params);

    return rechargeData;
  } catch (err) {
    console.error(err);
  }
};

const getById = async (id) => {
  try {
    const rechargeData = await getRecharge(id);
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

const rechargeListWithPagination = async (req, res, next) => {
  try {
    const params = req.body;
    const filter = req.body;
    let match = {};

    let searchKeyword = params.search;
    if (searchKeyword) {
      match = {
        $or: [
          { transactionId: { $regex: searchKeyword, $options: "i" } },
          { customerNo: { $regex: searchKeyword, $options: "i" } },
        ],
      };
    }

    if (params.services) {
      match.operatorId = mongoose.Types.ObjectId(params.services);
    }

    if (params.api) {
      match.apiId = mongoose.Types.ObjectId(params.api);
    }

    if (params.status) {
      match.status = params.status;
    }
    if (params.userId) {
      match.userId = mongoose.Types.ObjectId(params.userId);
    }

    const orderByColumn = params.sortBy || "created";
    const orderByDirection = params.orderBy || "DESC";
    const sort = {};

    if (orderByColumn && orderByDirection) {
      sort[orderByColumn] = orderByDirection == "DESC" ? -1 : 1;
    }

    if (params.startDate && params.endDate) {
      let startDate = new Date(params.startDate); // this is the starting date that looks like ISODate("2014-10-03T04:00:00.188Z")

      // startDate.setSeconds(0);
      // startDate.setHours(0);
      // startDate.setMinutes(0);

      let endDate = new Date(params.endDate);

      // endDate.setHours(23);
      // endDate.setMinutes(59);
      // endDate.setSeconds(59);
      let created = {
        // $gte: new ISODate(startDate),
        // $lte: new ISODate(endDate),
        $gte: moment.utc(startDate).toDate(),
        $lte: moment.utc(endDate).endOf("day").toDate(),
      };
      match.created = created;
    }

    console.log(JSON.stringify(match));

    const total = await db.Recharge.find().countDocuments(match);
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

    const rechargeResult = await db.Recharge.aggregate(aggregateRules);

    for (let i = 0; i < rechargeResult.length; i++) {
      let transactionRslt = await db.Transactions.findOne({
        rechargeId: rechargeResult[i]._id,
        requestAmount: { $gt: 0 },
      });

      if (transactionRslt) {
        transactionRslt = JSON.parse(JSON.stringify(transactionRslt));

        let serviceType = await db.Services.findById(
          transactionRslt.serviceType
        );
        transactionRslt.serviceTypeName = serviceType.serviceName || "";
        rechargeResult[i].transactionData = transactionRslt;
      }
      let userDetail = await db.Account.findById(rechargeResult[i].userId);
      rechargeResult[i].userDetail = userDetail;
    }

    res.status(200).json({
      status: 200,
      message: CONSTANT_STATUS.SUCCESS,
      data: {
        sort,
        filter,
        count: rechargeResult.length,
        page,
        pages,
        data: rechargeResult,
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

module.exports = {
  updateRechargeById,
  getById,
  getAll,
  delete: _delete,
  rechargeListWithPagination,
  createNewRecharge,
};
