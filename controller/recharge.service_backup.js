const db = require("../_helpers/db");
const axios = require("axios");
const bcrypt = require("bcryptjs");
const { updateTransactionById } = require("./transaction.service");
const { CONSTANT_STATUS } = require("../_helpers/constant");
const mongoose = require("mongoose");
const { roundOfNumber } = require("../_middleware/middleware");
const moment = require("moment");
const { operatorConfigDataPageWise } = require("./operatorConfig.services");

var priorityCount = 1;
var lastTransactionsReport = {};
var responseJSON = {
  STATUSCODE: "0",
  STATUSMSG: CONSTANT_STATUS.SUCCESS,
  REFNO: "1679739513",
  TRNID: 50239930,
  TRNSTATUS: 1,
  TRNSTATUSDESC: CONSTANT_STATUS.SUCCESS,
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
          console.log({ operator });
          if (operator) {
            let finalRechargeData = await recursiveFunction2(params, operator);
            console.log("finalrecharge data:---->>", finalRechargeData);
            // let finalRechargeData = responseJSON;
            priorityCount = 1;

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

            if (finalRechargeData) {
              // params.customerNo = params.mobileNo;
              params.responseData = finalRechargeData;
              params.rechargeByOperator = finalRechargeData.rechargeOperator;
              params.rechargeByApi = finalRechargeData.rechargeApi;
              params.operatorId =
                finalRechargeData.rechargeOperator.providerType;
              params.apiId = finalRechargeData.rechargeApi._id;

              // we can delet this two keys because we already save it in rechargeByOperator and rechargeByApi
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
                Object.assign(rechargeResult, {
                  status: CONSTANT_STATUS.SUCCESS,
                });
                await rechargeResult.save();
              } else {
                await updateTransactionData2(
                  params.userId,
                  params,
                  lastTransactionsReport,
                  rechargeResult
                );
              }

              await updateUserData(params);

              res.status(200).json({
                status: 200,
                data: rechargeData,
                message: "Recharge successful",
              });
            } else {
              // params.customerNo = params.mobileNo;
              params.responseData = finalRechargeData || lastTransactionsReport;
              params.rechargeByOperator = {};
              params.rechargeByApi = {};

              const rechargeData = new db.Recharge(params);
              const rechargeResult = await rechargeData.save();

              await updateTransactionData3(
                params.userId,
                params,
                lastTransactionsReport,
                rechargeResult
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
    type,
    rechargeResult,
    discountData
  );
};

const getDiscountData = async (params) => {
  try {
    if (params) {
      const { rechargeByOperator, rechargeByApi } = params;
      let discount = await db.ServiceDiscount.findOne({
        apiId: rechargeByApi._id,
        operatorId: rechargeByOperator._id,
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
      payload.customerNo = params.mobileNo;
      payload.operatorName = "";
      payload.operatorId = "";
      payload.rechargeData = rechargeResult.responseData;
      payload.amount = roundOfNumber(params.amount) || 0;
      payload.userBalance =
        roundOfNumber(accountDetail.walletBalance) -
          roundOfNumber(discountAmount) || 0;
      payload.requestAmount = roundOfNumber(params.amount) || 0;
      payload.rechargeAmount = roundOfNumber(rechargeAmount) || 0;
      payload.cashBackAmount = roundOfNumber(discountAmount);
      payload.userFinalBalance = roundOfNumber(userFinalBalance);
      payload.apiProvider = rechargeResult.rechargeByApi._id;
      payload.serviceType = rechargeResult.rechargeByOperator.providerType;
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
    console.log("check type and payload ---", userType, payload);
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

        console.log("lyltyPayld ---------", lyltyPayld);

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
          referralCashBack: roundOfNumber(discountAmount),
          netCashBack:
            roundOfNumber(cashBack.netCashBack) - roundOfNumber(discountAmount),
          status: CONSTANT_STATUS.SUCCESS,
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

    return transactionRes;
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
    payload.amount = roundOfNumber(params.amount) || 0;
    payload.userBalance = roundOfNumber(accountDetail.walletBalance) || 0;
    payload.requestAmount = roundOfNumber(params.amount) || 0;
    payload.rechargeAmount = 0;
    payload.cashBackAmount = 0;
    payload.userFinalBalance = roundOfNumber(accountDetail.walletBalance);

    payload.transactionId = (await db.Transactions.countDocuments()) + 1;
    const transactionData = new db.Transactions(payload);

    let transactionRes = await transactionData.save();

    Object.assign(rechargeResult, { status: payload.status });
    await rechargeResult.save(); // update recharge data

    return transactionRes;
  } catch (err) {
    console.error(err);
  }
};

const updateTransactionData3 = async (
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

    Object.assign(rechargeResult, { status: payload.status });
    await rechargeResult.save(); // update recharge data

    return transactionRes;
  } catch (err) {
    console.error(err);
  }
};

const recursiveFunction2 = async (params, operator) => {
  try {
    let operatorConfigList = await operatorConfigDataPageWise({
      operator: operator._id,
    });

    if (operator && operatorConfigList.data.length >= priorityCount) {
      let filteredOperator;
      if (!filteredOperator) {
        filteredOperator = await priorityCheck(
          priorityCount,
          operatorConfigList
        );
        priorityCount++;
        // return await rechargeFunction(params, operator, filteredOperator);
      }

      console.log({ filteredOperator });
      return await rechargeFunction(params, operator, filteredOperator);
      // else {
      //   return await rechargeFunction(params, operator, filteredOperator);
      // }
    } else {
      // throw Error();
      // throw new Error("operator not found");

      return "operator not found";
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

    console.log({ payload });

    let rechargeData = await doRecharge(filteredOperator, payload);
    console.log("rechargedata --- >>", rechargeData);
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

const priorityCheck = async (priority, operatorConfig) => {
  try {
    return await operatorConfig.data.find((x) => {
      return x.priority && x.priority == priority && x.isActive;
    });
  } catch (err) {
    console.error(err);
  }
};

const doRecharge = async (filterData, payload) => {
  try {
    const { apiName } = filterData.apiData;

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
    console.log({ rechargeData, transactionId });

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

    console.log("date -----------", params.startDate, params.endDate);
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
      console.log(rechargeResult[i]._id);
      let transactionRslt = await db.Transactions.findOne({
        rechargeId: rechargeResult[i]._id,
        requestAmount: { $gt: 0 },
      });

      if (transactionRslt) {
        transactionRslt = JSON.parse(JSON.stringify(transactionRslt));
        console.log({ transactionRslt });
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
  createRecharge,
  updateRechargeById,
  getById,
  getAll,
  delete: _delete,
  rechargeListWithPagination,
};
