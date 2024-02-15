const mongoose = require("mongoose");
const db = require("../_helpers/db");
const axios = require("axios");
const bcrypt = require("bcryptjs");
const { CONSTANT_STATUS } = require("../_helpers/constant");
const { updateTransactionById } = require("./transaction.service");
const { roundOfNumber } = require("../_middleware/middleware");
const { operatorConfigDataPageWise } = require("./operatorConfig.services");
const { updateComplaintByRechargeId } = require("./rechargeComplaints.service");
const utilityServices = require("../controller/utility.services");
const {
  successResponseByRechargeWale,
  rechargeWaleRechargeData,
  pendingResponseByRechargeWale,
} = require("../_helpers/responses");
const moment = require("moment");

var priorityCount = 1;
var timer = null;
var lastApiResponse = undefined;

const createNewRecharge = async (req, res) => {
  try {
    const params = req.body;
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
      res
        .status(400)
        .json({ status: 400, data: "", message: "Transaction pin not found!" });
    } else {
      const account = await db.Account.findOne({ _id: params.userId });
      console.log({ account });
      if (!account.isActive) {
        res.status(400).json({
          status: 400,
          data: "",
          message: "Account not active!",
        });
      } else {
        if (
          account &&
          !bcrypt.compareSync(params.transactionPin, account.transactionPin)
        ) {
          res.status(400).json({
            status: 400,
            data: "",
            message: "Your transact`  ion pin not matched!",
          });
        } else {
          if (
            account &&
            (roundOfNumber(account.walletBalance) <= 0 ||
              roundOfNumber(account.walletBalance) -
                roundOfNumber(params.amount) <
                0)
          ) {
            res.status(400).json({
              status: 400,
              data: "",
              message: "Your wallet balance is not enough!",
            });
          } else {
            let operator = await getOperatorById(params);

            if (operator) {
              console.log({ operator, params });
              var { accountData, rechargeData, transactionData } =
                await createInitialTransaction(params);
              console.log({ accountData, rechargeData, transactionData });
              // await updateUserData(params, "initial");
              lastApiResponse = "";
              let finalRechargeData = await recursiveFunction(params, operator);

              console.log({ finalRechargeData });
              priorityCount = 1;

              if (finalRechargeData || finalRechargeData !== "") {
                params.rechargeData = finalRechargeData;
                params.operatorId = finalRechargeData.operatorId;
                params.apiId = finalRechargeData.apiId;
                params.serviceCategoryId = finalRechargeData.serviceCategoryId;
                params.serviceId = finalRechargeData.serviceId;

                Object.assign(rechargeData, params);
                const rechargeResult = await rechargeData.save();
                console.log({ rechargeResult });

                const apiConfigData = await db.ApiConfig.findOne({
                  apiId: params.apiId,
                  categoryId: params.serviceCategoryId,
                });

                let responseStatus = String(
                  finalRechargeData[apiConfigData.responseStatus]
                );

                if (
                  (responseStatus &&
                    apiConfigData.successValue
                      .split(",")
                      .includes(responseStatus)) ||
                  (finalRechargeData && finalRechargeData.TRNSTATUS == 0) ||
                  (finalRechargeData.STATUSCODE &&
                    finalRechargeData.STATUSCODE == 1) ||
                  finalRechargeData.errorcode == 200
                ) {
                  console.log("recharge success ---------");
                  Object.assign(rechargeResult, {
                    status: CONSTANT_STATUS.SUCCESS,
                  });
                  await rechargeResult.save();
                  await addDiscount(params, rechargeResult, "");
                  // return "Transaction successful.";

                  res.status(200).json({
                    status: 200,
                    data: rechargeResult,
                    message: "Transaction successful.",
                  });
                } else if (
                  apiConfigData.pendingValue.split(",").includes(responseStatus)
                ) {
                  console.log("recharge pending---------");
                  Object.assign(rechargeResult, {
                    status: CONSTANT_STATUS.PENDING,
                  });
                  await rechargeResult.save();
                  await updateTransactionData2(
                    params.userId,
                    params,
                    finalRechargeData,
                    rechargeResult
                  );

                  await checkTransactionStatusRecursive(
                    params.userId,
                    params,
                    rechargeResult
                  );
                  // return "Transaction pending!";
                  res.status(500).json({
                    status: 500,
                    data: rechargeResult,
                    message: "Transaction pending!",
                  });
                } else {
                  console.log("recharge fail---------");
                  Object.assign(rechargeResult, {
                    status: CONSTANT_STATUS.FAILED,
                  });
                  await rechargeResult.save();
                  await addDiscount(params, rechargeResult, "");
                  await updateUserData(params, "failed");
                  // throw "Transaction can not be proceed!";

                  res.status(400).json({
                    status: 400,
                    data: "",
                    message:
                      rechargeResult.rechargeData.opid ||
                      rechargeResult.rechargeData.message ||
                      rechargeResult.rechargeData.msg,
                  });
                }
              } else {
                // throw "Transaction can not be proceed!";
                await updateUserData(params, "failed");
                res.status(400).json({
                  status: 400,
                  data: finalRechargeData,
                  message: "",
                });
              }
            } else {
              // throw "Transaction can not be proceed!";
              res.status(400).json({
                status: 400,
                data: "",
                message: "Operator not found!",
              });
            }
          }
        }
      }
    }
  } catch (err) {
    console.log({ err });
    res.status(400).json({
      status: 400,
      data: err,
      message: "Something went wrong!",
    });
  }
};

const createInitialTransaction = async (params) => {
  const account = await db.Account.findOne({ _id: params.userId });

  let walletBalance =
    roundOfNumber(account.walletBalance) - roundOfNumber(params.amount);

  let userPayload = {
    walletBalance: roundOfNumber(walletBalance), // user wallet balance update
  };

  Object.assign(account, userPayload);
  let accountData = await account.save();

  let rechargeDt = {
    userId: params.userId,
    customerNo: params.customerNo,
    operator: params.operator,
    state: params.state,
    amount: params.amount,
    operatorId: params.operator,
  };

  const rechargeData = new db.Recharge(rechargeDt);
  await rechargeData.save();

  let transactionDt = {
    userId: params.userId,
    customerNo: params.customerNo,
    transactionId: (await db.Transactions.countDocuments()) + 1,
    amount: params.amount,
    rechargeId: rechargeData._id,
    operatorId: params.operator,
    type: "debit",
    totalAmount: 0,
    userBalance: roundOfNumber(accountData.walletBalance),
    requestAmount: roundOfNumber(params.amount),
    cashBackAmount: 0,
    rechargeAmount: 0,
    userFinalBalance: roundOfNumber(accountData.walletBalance),
  };

  const transactionData = new db.Transactions(transactionDt);
  await transactionData.save();

  return {
    accountData,
    transactionData,
    rechargeData,
  };
};

const addDiscount = async (params, rechargeResult, rechargeId) => {
  try {
    let userAccount = await db.Account.findById({ _id: params.userId });
    await addDiscountAmount(
      userAccount,
      params,
      "user",
      rechargeResult,
      rechargeId
    );

    const referalUser = await db.Referral.findOne({
      userId: params.userId,
    });

    console.log("my referral user ---------", { referalUser });

    if (referalUser && referalUser.referredUser) {
      let referralUserAccount = await db.Account.findById({
        _id: referalUser.referredUser,
      });

      await addDiscountAmount(
        referralUserAccount,
        params,
        "referral",
        rechargeResult,
        rechargeId
      );
    }
  } catch (err) {
    console.error({ err });
    return err;
  }
};

const addDiscountAmount = async (
  account,
  params,
  userType,
  rechargeResult,
  rechargeId
) => {
  let discountData = await getDiscountData(params);

  let disAmount = 0;
  if (rechargeResult && discountData) {
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

  if (rechargeResult.status !== "failed") {
    let rewardAmount =
      roundOfNumber(account.rewardedBalance) + roundOfNumber(disAmount);
    let walletBalance =
      roundOfNumber(account.walletBalance) + roundOfNumber(disAmount);

    let userPayload = {
      lastDiscount: roundOfNumber(disAmount), //last discount amount update
      rewardedBalance: roundOfNumber(rewardAmount), // total discount amount upate
      walletBalance: roundOfNumber(walletBalance), // user wallet balance update
    };

    Object.assign(account, userPayload);
    await account.save();
  }

  if (!!rechargeId) {
    // this function call when API res pending and after that is success so we get rechargeId
    await updateTransactionData3(
      account._id,
      params,
      disAmount,
      userType,
      rechargeResult,
      discountData
    );
  } else {
    // this funciton is call when API res is success or failed
    // await updateTransactionDataNew(
    //   account._id,
    //   params,
    //   disAmount,
    //   userType,
    //   rechargeResult,
    //   discountData
    // );
    await updateTransactions(
      account._id,
      params,
      disAmount,
      userType,
      rechargeResult,
      discountData
    );
  }
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

const updateUserData = async (params, type) => {
  console.log("update usre data---", { params, type });
  try {
    let account = await db.Account.findById({ _id: params.userId });

    let walletCount =
      type !== "failed"
        ? roundOfNumber(account.walletBalance) - roundOfNumber(params.amount)
        : roundOfNumber(account.walletBalance) + roundOfNumber(params.amount);
    let userPayload = { walletBalance: roundOfNumber(walletCount) };

    Object.assign(account, userPayload);
    return await account.save();
  } catch (err) {
    console.error({ err });
    return null;
  }
};

const updateUserData2 = async (params, type) => {
  try {
    let account = await db.Account.findById({ _id: params.userId });

    let walletCount =
      roundOfNumber(account.walletBalance) - roundOfNumber(params.amount);
    let userPayload = { walletBalance: roundOfNumber(walletCount) };

    Object.assign(account, userPayload);
    return await account.save();
  } catch (err) {
    console.error({ err });
    return null;
  }
};

const updateTransactionDataNew = async (
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
      type: "debit",
      customerNo: "",
      status:
        rechargeResult.status !== "failed"
          ? CONSTANT_STATUS.SUCCESS
          : CONSTANT_STATUS.FAILED,
    };

    if (rechargeResult.status !== "failed") {
      let rechargeAmount =
        roundOfNumber(params.amount) - roundOfNumber(discountAmount || 0);

      if (userType == "user") {
        payload.slipNo = params.slipNo || "";
        payload.remark = params.remark || "";
        payload.description = params.description || {};
        payload.customerNo = params.mobileNo || params.customerNo;
        payload.operatorName = "";
        payload.operatorId = rechargeResult.operatorId;
        payload.rechargeData = rechargeResult.rechargeData;

        payload.amount = roundOfNumber(params.amount) || 0;
        payload.userBalance =
          roundOfNumber(accountDetail.walletBalance) -
          roundOfNumber(discountAmount || 0) +
          roundOfNumber(params.amount || 0);
        payload.requestAmount = roundOfNumber(params.amount) || 0;
        payload.rechargeAmount = roundOfNumber(rechargeAmount) || 0;
        payload.cashBackAmount = roundOfNumber(discountAmount) || 0;
        payload.userFinalBalance =
          roundOfNumber(accountDetail.walletBalance) || 0;

        payload.apiId = rechargeResult.apiId;
        payload.serviceId = rechargeResult.serviceId;
        payload.serviceCategoryId = rechargeResult.serviceCategoryId;
      } else {
        payload.amount = 0;
        payload.userBalance =
          roundOfNumber(accountDetail.walletBalance) -
            roundOfNumber(discountAmount) || 0;
        payload.cashBackAmount = roundOfNumber(discountAmount) || 0;
        payload.userFinalBalance =
          roundOfNumber(accountDetail.walletBalance) || 0;
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
          cashBackReceive: roundOfNumber(adminDiscnt) || 0,
          userCashBack: roundOfNumber(discountAmount) || 0,
          referralCashBack: 0,
          netCashBack:
            roundOfNumber(adminDiscnt || 0) -
            roundOfNumber(discountAmount || 0),
          finalAmount:
            roundOfNumber(params.amount || 0) -
            roundOfNumber(discountAmount || 0),
          status: payload.status,
          apiId: rechargeResult.apiId,
          operatorId: rechargeResult.providerType,
        };

        const cashBackData = await new db.Cashback(cashBackPayload);
        await cashBackData.save();
      } else {
        let cashBack = await db.Cashback.findOne({
          rechargeId: rechargeResult._id,
        });

        if (cashBack) {
          let updatePayld = {
            referralCashBack: roundOfNumber(discountAmount) || 0,
            netCashBack:
              roundOfNumber(cashBack.netCashBack || 0) -
              roundOfNumber(discountAmount || 0),
            status: CONSTANT_STATUS.SUCCESS,
            finalAmount:
              roundOfNumber(cashBack.finalAmount) -
              roundOfNumber(discountAmount),
          };

          Object.assign(cashBack, updatePayld);
          cashBack.updated = Date.now();
          await cashBack.save();
        }
      }
    } else {
      let rechargeAmount = roundOfNumber(params.amount);

      if (userType == "user") {
        payload.slipNo = params.slipNo || "";
        payload.remark = params.remark || "";
        payload.description = params.description || {};
        payload.customerNo = params.mobileNo || params.customerNo;
        payload.operatorName = "";
        payload.operatorId = rechargeResult.operatorId;
        payload.rechargeData = rechargeResult.rechargeData;
        payload.amount = roundOfNumber(params.amount) || 0;
        payload.userBalance =
          roundOfNumber(accountDetail.walletBalance) +
          roundOfNumber(params.amount);
        payload.requestAmount = roundOfNumber(params.amount) || 0;
        payload.rechargeAmount = 0;
        payload.cashBackAmount = 0;
        payload.userFinalBalance =
          roundOfNumber(accountDetail.walletBalance) +
            roundOfNumber(params.amount) || 0;
        payload.apiId = rechargeResult.apiId;
        payload.serviceId = rechargeResult.serviceId;
        payload.serviceCategoryId = rechargeResult.serviceCategoryId;
      } else {
        payload.amount = 0;
        payload.userBalance = roundOfNumber(accountDetail.walletBalance);
        payload.cashBackAmount = 0;
        payload.userFinalBalance =
          roundOfNumber(accountDetail.walletBalance) || 0;
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
          rechargeAmount: 0,
          cashBackReceive: 0,
          userCashBack: 0,
          referralCashBack: 0,
          netCashBack: 0,
          finalAmount: 0,
          status: payload.status,
          apiId: rechargeResult.apiId,
          operatorId: rechargeResult.operatorId,
          requestAmountBckup: roundOfNumber(params.amount || 0),
          rechargeAmountBckup: roundOfNumber(rechargeAmount) || 0,
          cashBackReceiveBckup: roundOfNumber(adminDiscnt) || 0,
          userCashBackBckup: roundOfNumber(discountAmount) || 0,
          referralCashBackBckup: 0,
          netCashBackBckup:
            roundOfNumber(adminDiscnt || 0) -
            roundOfNumber(discountAmount || 0),
          finalAmountBackup:
            roundOfNumber(params.amount || 0) -
            roundOfNumber(discountAmount || 0),
        };

        const cashBackData = await new db.Cashback(cashBackPayload);
        await cashBackData.save();
      } else {
        let cashBack = await db.Cashback.findOne({
          rechargeId: rechargeResult._id,
        });

        if (cashBack) {
          let updatePayld = {
            referralCashBack: 0,
            netCashBack: 0,
            status: CONSTANT_STATUS.SUCCESS,
            finalAmount: roundOfNumber(cashBack.finalAmount),
            referralCashBackBckup: roundOfNumber(discountAmount),
            netCashBackBckup:
              roundOfNumber(cashBack.netCashBack || 0) -
              roundOfNumber(discountAmount || 0),
            finalAmountBackup:
              roundOfNumber(cashBack.finalAmount) -
              roundOfNumber(discountAmount),
          };

          Object.assign(cashBack, updatePayld);
          cashBack.updated = Date.now();
          await cashBack.save();
        }
      }
    }
  } catch (err) {
    console.error({ err });
  }
};

const updateTransactions = async (
  userId,
  params,
  discountAmount,
  userType,
  rechargeResult,
  discountData
) => {
  try {
    let accountDetail = await db.Account.findById({ _id: userId });
    const {
      status,
      rechargeData,
      operatorId,
      apiId,
      serviceId,
      serviceCategoryId,
    } = rechargeResult;

    console.log("updateTransations ---------", userType, rechargeResult);

    let payload = {
      userId: userId,
      type: "debit",
      status:
        status !== "failed" ? CONSTANT_STATUS.SUCCESS : CONSTANT_STATUS.FAILED,
    };

    if (userType == "user") {
      // ============ transaction start ====================
      payload.slipNo = params.slipNo || "";
      payload.remark = params.remark || "";
      payload.description = params.description || {};
      payload.customerNo = params.mobileNo || params.customerNo;
      payload.operatorName = "";
      payload.operatorId = operatorId;
      payload.rechargeData = rechargeData;
      payload.amount = roundOfNumber(params.amount) || 0;
      payload.requestAmount = roundOfNumber(params.amount) || 0;
      payload.apiId = apiId;
      payload.serviceId = serviceId;
      payload.serviceCategoryId = serviceCategoryId;

      payload.userBalance =
        status !== "failed"
          ? roundOfNumber(accountDetail.walletBalance) -
            roundOfNumber(discountAmount || 0) +
            roundOfNumber(params.amount || 0)
          : roundOfNumber(accountDetail.walletBalance || 0) +
            roundOfNumber(params.amount || 0);
      payload.rechargeAmount =
        status !== "failed"
          ? roundOfNumber(params.amount) - roundOfNumber(discountAmount || 0)
          : 0 || 0;
      payload.cashBackAmount =
        status !== "failed" ? roundOfNumber(discountAmount || 0) : 0 || 0;
      payload.userFinalBalance =
        status !== "failed"
          ? roundOfNumber(accountDetail.walletBalance)
          : roundOfNumber(accountDetail.walletBalance) +
              roundOfNumber(params.amount) || 0;

      let usrTrscn = db.Transactions.findOne({
        rechargeId: rechargeResult._id,
      });

      console.log({ usrTrscn });

      Object.assign(usrTrscn, payload);
      let transactionRes = await usrTrscn.save();
      console.log({ transactionRes });
      // ============ transaction end ====================

      // =========== cashback start ================
      {
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
          status: payload.status,
          apiId: rechargeResult.apiId,
          operatorId: rechargeResult.operatorId,
          rechargeAmount:
            status !== "failed" ? roundOfNumber(rechargeAmount) : 0 || 0,
          cashBackReceive:
            status !== "failed" ? roundOfNumber(adminDiscnt) : 0 || 0,
          userCashBack:
            status !== "failed" ? roundOfNumber(discountAmount) : 0 || 0,
          referralCashBack: 0,
          netCashBack:
            status !== "failed"
              ? roundOfNumber(adminDiscnt || 0) -
                roundOfNumber(discountAmount || 0)
              : 0,
          finalAmount:
            status !== "failed"
              ? roundOfNumber(params.amount || 0) -
                roundOfNumber(discountAmount || 0)
              : 0,
          requestAmountBckup:
            status !== "failed" ? 0 : roundOfNumber(params.amount || 0),
          rechargeAmountBckup:
            status !== "failed" ? 0 : roundOfNumber(rechargeAmount) || 0,
          cashBackReceiveBckup:
            status !== "failed" ? 0 : roundOfNumber(adminDiscnt) || 0,
          userCashBackBckup:
            status !== "failed" ? 0 : roundOfNumber(discountAmount) || 0,
          referralCashBackBckup: status !== "failed" ? 0 : 0,
          netCashBackBckup:
            status !== "failed"
              ? 0
              : roundOfNumber(adminDiscnt || 0) -
                roundOfNumber(discountAmount || 0),
          finalAmountBackup:
            status !== "failed"
              ? 0
              : roundOfNumber(params.amount || 0) -
                roundOfNumber(discountAmount || 0),
        };

        const cashBackData = await new db.Cashback(cashBackPayload);
        await cashBackData.save();
      }
      // =========== cashbak end ===================
    } else {
      //  ============ transaction start =================
      payload.amount = 0;
      payload.userBalance =
        status !== "failed"
          ? roundOfNumber(accountDetail.walletBalance) -
            roundOfNumber(discountAmount)
          : roundOfNumber(accountDetail.walletBalance) || 0;
      payload.cashBackAmount =
        status !== "failed" ? roundOfNumber(discountAmount) : 0 || 0;
      payload.userFinalBalance =
        status !== "failed"
          ? roundOfNumber(accountDetail.walletBalance)
          : roundOfNumber(accountDetail.walletBalance) || 0;

      payload.rechargeId = rechargeResult._id;
      payload.transactionId = (await db.Transactions.countDocuments()) + 1;

      const transactionData = new db.Transactions(payload);
      let transactionRes = await transactionData.save();
      //  ============ transaction end =================

      // ================ cashback start ===============
      let cashBack = await db.Cashback.findOne({
        rechargeId: rechargeResult._id,
      });

      if (cashBack) {
        let updatePayld = {
          status: CONSTANT_STATUS.SUCCESS,
          referralCashBack:
            status !== "failed" ? roundOfNumber(discountAmount) : 0 || 0,
          netCashBack:
            status !== "failed"
              ? roundOfNumber(cashBack.netCashBack || 0) -
                roundOfNumber(discountAmount || 0)
              : 0,
          finalAmount:
            status !== "failed"
              ? roundOfNumber(cashBack.finalAmount) -
                roundOfNumber(discountAmount)
              : roundOfNumber(cashBack.finalAmount),
          referralCashBackBckup:
            status !== "failed" ? 0 : roundOfNumber(discountAmount),
          netCashBackBckup:
            status !== "failed"
              ? 0
              : roundOfNumber(cashBack.netCashBack || 0) -
                roundOfNumber(discountAmount || 0),
          finalAmountBackup:
            status !== "failed"
              ? 0
              : roundOfNumber(cashBack.finalAmount) -
                roundOfNumber(discountAmount),
        };

        Object.assign(cashBack, updatePayld);
        cashBack.updated = Date.now();
        await cashBack.save();
      }
      // ================ cashback end =================
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
      type: "debit",
      status: CONSTANT_STATUS.PENDING,
    };

    payload.slipNo = params.slipNo || "";
    payload.remark = params.remark || "";
    payload.description = params.description || {};
    payload.customerNo = params.mobileNo || params.customerNo || "";
    payload.operatorName = "";
    payload.operatorId = rechargeResult.operatorId;
    payload.rechargeData = rechargeData;

    payload.amount = roundOfNumber(params.amount) || 0;
    payload.userBalance =
      roundOfNumber(accountDetail.walletBalance) +
      roundOfNumber(params.amount || 0);
    payload.requestAmount = roundOfNumber(params.amount) || 0;
    payload.rechargeAmount = 0;
    payload.cashBackAmount = 0;
    payload.userFinalBalance = roundOfNumber(accountDetail.walletBalance) || 0;

    payload.apiId = rechargeResult.apiId;
    payload.serviceId = rechargeResult.serviceId;
    payload.serviceCategoryId = rechargeResult.serviceCategoryId;
    payload.rechargeId = rechargeResult._id;
    payload.transactionId = (await db.Transactions.countDocuments()) + 1;
    const transactionData = new db.Transactions(payload);
    await transactionData.save();
  } catch (err) {
    console.error({ err });
  }
};

// this function call when API res pending and after that is only success so we get rechargeId and status SUCCESS
const updateTransactionData3 = async (
  userId,
  params,
  discountAmount,
  userType,
  rechargeResult,
  discountData
) => {
  try {
    let accountDetail = await db.Account.findById({ _id: userId });
    let transactionResult = await db.Transactions.findOne({
      rechargeId: rechargeResult._id,
    });

    const rechargeData = await db.Recharge.findOne({ _id: rechargeResult._id });
    Object.assign(rechargeData, { status: CONSTANT_STATUS.SUCCESS });
    rechargeData.updated = Date.now();
    await rechargeData.save();

    let payload = {
      operatorId: "",
      operatorName: "",
      requestAmount: 0,
      rechargeAmount: 0,
      cashBackAmount: 0,
      type: "debit",
      status: CONSTANT_STATUS.SUCCESS,
    };

    let rechargeAmount =
      roundOfNumber(params.amount) - roundOfNumber(discountAmount || 0);

    if (userType == "user") {
      payload.operatorName = "";
      payload.operatorId = rechargeResult.operatorId;
      payload.rechargeData = rechargeResult.rechargeData;
      payload.amount = roundOfNumber(params.amount) || 0;
      payload.userBalance =
        roundOfNumber(accountDetail.walletBalance) -
        roundOfNumber(discountAmount || 0) +
        roundOfNumber(params.amount || 0);
      payload.requestAmount = roundOfNumber(params.amount) || 0;
      payload.rechargeAmount = roundOfNumber(rechargeAmount) || 0;
      payload.cashBackAmount = roundOfNumber(discountAmount) || 0;
      payload.userFinalBalance =
        roundOfNumber(accountDetail.walletBalance) || 0;
      payload.apiId = rechargeResult.apiId;
      payload.serviceId = rechargeResult.serviceId;
      payload.serviceCategoryId = rechargeResult.serviceCategoryId;
    } else {
      payload.amount = 0;
      payload.userBalance =
        roundOfNumber(accountDetail.walletBalance) -
          roundOfNumber(discountAmount) || 0;
      payload.cashBackAmount = roundOfNumber(discountAmount) || 0;
      payload.userFinalBalance =
        roundOfNumber(accountDetail.walletBalance) || 0;
    }

    Object.assign(transactionResult, payload);
    transactionResult.updated = Date.now();
    let transactionRes = await transactionResult.save();

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
        cashBackReceive: roundOfNumber(adminDiscnt) || 0,
        userCashBack: roundOfNumber(discountAmount) || 0,
        referralCashBack: 0,
        netCashBack:
          roundOfNumber(adminDiscnt || 0) - roundOfNumber(discountAmount || 0),
        finalAmount:
          roundOfNumber(params.amount || 0) -
          roundOfNumber(discountAmount || 0),
        status: payload.status,
        apiId: rechargeResult.apiId,
        operatorId: rechargeResult.providerType,
      };

      const cashBackData = await new db.Cashback(cashBackPayload);
      await cashBackData.save();
    } else {
      let cashBack = await db.Cashback.findOne({
        rechargeId: rechargeResult._id,
      });

      if (cashBack) {
        let updatePayld = {
          referralCashBack: roundOfNumber(discountAmount) || 0,
          netCashBack:
            roundOfNumber(cashBack.netCashBack || 0) -
            roundOfNumber(discountAmount || 0),
          finalAmount:
            roundOfNumber(cashBack.finalAmount || 0) -
            roundOfNumber(discountAmount || 0),
          status: CONSTANT_STATUS.SUCCESS,
        };

        Object.assign(cashBack, updatePayld);
        cashBack.updated = Date.now();
        await cashBack.save();
      }
    }
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
      let filteredOperator = await priorityCheck(
        priorityCount,
        operatorConfigList
      );
      priorityCount++;

      console.log({ filteredOperator });

      if (
        filteredOperator &&
        filteredOperator.serviceId &&
        filteredOperator.apiId
      ) {
        const { serviceId, apiId, serviceData } = filteredOperator;

        let apiConfigData = await db.ApiConfig.findOne({
          apiId: apiId,
          categoryId: serviceData.serviceCategoryId,
        });

        console.log({ apiConfigData });

        if (apiConfigData) {
          let apiRes = await rechargeFunction(
            apiConfigData,
            params,
            filteredOperator
          );
          // apiRes.operatorConfig = filteredOperator;
          lastApiResponse = apiRes;
          console.log({ apiRes });
          if (typeof apiRes !== "string") {
            if (filteredOperator && apiRes) {
              let responseStatus = String(
                apiRes[apiConfigData.checkStatusResponseValue]
              );
              /*  ------- check for success and pending value ------ */
              if (
                (responseStatus &&
                  apiConfigData.successValue
                    .split(",")
                    .includes(responseStatus)) ||
                apiConfigData.pendingValue.split(",").includes(responseStatus)
              ) {
                return lastApiResponse;
                /* -------  check for fail response ------ */
              } else {
                if (
                  operatorConfigList &&
                  operatorConfigList.data.length >= priorityCount
                ) {
                  return await recursiveFunction(params, operator);
                } else {
                  return lastApiResponse;
                }
              }
            }
          } else {
            return apiRes;
          }
        } else {
          return await recursiveFunction(params, operator);
        }
      } else {
        return await recursiveFunction(params, operator);
      }
    } else {
      return lastApiResponse;
    }
  } catch (err) {
    console.error({ err });
    return err;
  }
};

const priorityCheck = async (priority, configList) => {
  return await configList.data.find((x) => {
    return x.priority && x.priority == priority && x.isActive;
  });
};

const rechargeFunction = async (
  apiConfigData,
  params,
  filteredOperatorConfig
) => {
  try {
    const { apiData, apiCode, serviceData, operatorData } =
      filteredOperatorConfig;

    if (apiConfigData.requestURL && apiCode) {
      let payload = {
        requestURL: apiConfigData.requestURL,
        token: apiData.token,
        amount: params.amount,
        operatorCode: apiCode,
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

      console.log({ payload });

      const serviceUrl = await createServiceUrl(payload);

      const rechargeRes = await doRechargeNew(serviceUrl);

      rechargeRes.serviceId = serviceData._id;
      rechargeRes.operatorId = operatorData._id;
      rechargeRes.apiId = apiConfigData.apiId;
      rechargeRes.serviceCategoryId = apiConfigData.categoryId;

      //   // const rechargeRes = pendingResponseByRechargeWale;    //static response set
      rechargeRes.userId = params.userId;
      rechargeRes.mobileNo = payload.regMobileNumber;
      rechargeRes.transactionId = (await db.Transactions.countDocuments()) + 1;
      await saveApiResponse(rechargeRes);

      return rechargeRes;
    }
    // else {
    //   return "api config not set!";
    // }
  } catch (err) {
    return err;
  }
};

const saveApiResponse = async (rechargeRes) => {
  const rechargeResponse = new db.ApiResponse({ response: rechargeRes });
  await rechargeResponse.save();
};

const checkTransactionStatusRecursive = async (
  userId,
  params,
  rechargeResult
) => {
  try {
    const utilityData = await utilityServices.getAll();

    let time = Number(utilityData[0].timeLimit);
    let type = utilityData[0].timeType;

    let dayInMilliseconds = 1000;
    if (type == "day") {
      dayInMilliseconds = 1000 * 60 * 60 * 24 * time;
    } else if (type == "hour") {
      dayInMilliseconds = 1000 * 60 * 60 * time;
    } else if (type == "minute") {
      dayInMilliseconds = 60 * 1000 * time;
    } else {
      dayInMilliseconds = 1000 * time;
    }

    // this fn call from here bcoz no need to fetch data from every time cycle
    let apiConfigData = await db.ApiConfig.findOne({
      apiId: rechargeResult.apiId,
      categoryId: rechargeResult.serviceCategoryId,
    });

    let apiData = await db.Apis.findOne({
      _id: rechargeResult.apiId,
    });

    await new Promise((resolve) => {
      timer = setTimeout(() => {
        statusCheck(userId, params, rechargeResult, apiConfigData, apiData);
        resolve(true);
      }, dayInMilliseconds);
    });
  } catch (err) {
    return err;
  }
};

async function delayTest(utilityData) {
  let time = Number(utilityData[0].timeLimit);
  let type = utilityData[0].timeType;

  let dayInMilliseconds = 1000;
  if (type == "day") {
    dayInMilliseconds = 1000 * 60 * 60 * 24 * time;
  } else if (type == "hour") {
    dayInMilliseconds = 1000 * 60 * 60 * time;
  } else if (type == "minute") {
    dayInMilliseconds = 60 * 1000 * time;
  } else {
    dayInMilliseconds = 1000 * time;
  }

  let random = Math.floor(Math.random() * 11);

  for (let i = 0; i <= 10; i++) {
    await new Promise((resolve) => {
      let time = setTimeout(() => {
        resolve(true);
      }, dayInMilliseconds);

      if (random == i) {
        clearTimeout(time);
      }
    });
  }
}

const statusCheck = async (
  userId,
  params,
  rechargeResult,
  apiConfigData,
  apiData
) => {
  let statusRes = await checkTransactionStatus(
    apiConfigData,
    apiData,
    rechargeResult
  );

  let responseStatus = String(
    statusRes[apiConfigData.checkStatusResponseValue]
  );

  if (apiConfigData.pendingValue.split(",").includes(responseStatus)) {
    await checkTransactionStatusRecursive(userId, params, rechargeResult);
  } else {
    if (apiConfigData.failureValue.split(",").includes(responseStatus)) {
      await updateRechargeById(rechargeResult._id, {
        status: CONSTANT_STATUS.FAILED,
      });
    } else {
      await updateRechargeById(rechargeResult._id, {
        status: CONSTANT_STATUS.SUCCESS,
      });
    }
    clearTimeout(timer);
  }
};

const checkTransactionStatus = async (
  apiConfigData,
  apiData,
  rechargeResult
) => {
  try {
    const { rechargeData } = rechargeResult;

    let serviceUrl = apiConfigData.checkStatusURL;

    serviceUrl = serviceUrl.replace("_apikey", apiData.token);
    serviceUrl = serviceUrl.replace(
      "_apirequestid",
      rechargeData[apiConfigData.requestId]
    );
    if (rechargeData[apiConfigData.responseTransactionId]) {
      serviceUrl = serviceUrl.replace(
        "_transactionid",
        rechargeData[apiConfigData.responseTransactionId]
      );
    }

    return await axios
      .get(serviceUrl)
      .then((res) => {
        return res.data;
      })
      .catch((err) => {
        return err;
      });
  } catch (err) {
    console.error({ err });
    return err;
  }
};

const doRecharge = async (apiData, apiConfigData, params) => {
  try {
    const { amount, operatorCode, regMobileNumber } = params;

    let timeStamp = Math.round(new Date().getTime() / 1000);
    let serviceUrl = apiConfigData.requestURL;
    serviceUrl = serviceUrl.replace("_number", timeStamp);
    serviceUrl = serviceUrl.replace("_amount", amount);
    serviceUrl = serviceUrl.replace("_spkey", operatorCode);
    serviceUrl = serviceUrl.replace("_account", regMobileNumber);
    serviceUrl = serviceUrl.replace("_apirequestid", timeStamp);
    serviceUrl = serviceUrl.replace("_apikey", apiData.token);

    return await axios
      .get(serviceUrl)
      .then((res) => {
        return res.data;
      })
      .catch((err) => {
        return err;
      });
  } catch (err) {
    console.error({ err });
    return err;
  }
};

const createServiceUrl = async (params) => {
  try {
    const { amount, operatorCode, regMobileNumber, token, requestURL } = params;
    let timeStamp = Math.round(new Date().getTime() / 1000);

    let serviceUrl = requestURL;
    serviceUrl = serviceUrl.replace("_number", timeStamp);
    serviceUrl = serviceUrl.replace("_amount", amount);
    serviceUrl = serviceUrl.replace("_spkey", operatorCode);
    serviceUrl = serviceUrl.replace("_account", regMobileNumber);
    serviceUrl = serviceUrl.replace("_apirequestid", timeStamp);
    serviceUrl = serviceUrl.replace("_apikey", token);

    return serviceUrl;
  } catch (err) {
    console.error({ err });
    return err;
  }
};

const doRechargeNew = async (serviceUrl) => {
  try {
    console.log({ serviceUrl });
    return await axios
      .get(serviceUrl)
      .then((res) => {
        return res.data;
      })
      .catch((err) => {
        return err;
      });
  } catch (err) {
    console.error({ err });
    return err;
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
    const result = await getRecharge(id);

    Object.assign(result, params);
    result.updated = Date.now();
    await result.save();

    let transaction = await db.Transactions.findOne({ rechargeId: id });
    let transactionId = transaction._id;
    params.rechargeId = id;
    await updateTransactionById(transactionId, params);
    return result;
  } catch (err) {
    console.error({ err });
  }
};

const getById = async (id) => {
  try {
    const result = await getRecharge(id);
    return result;
  } catch (err) {
    console.error({ err });
  }
};

const getAll = async () => {
  try {
    const result = await db.Recharge.find();
    return result;
  } catch (err) {
    console.error({ err });
  }
};

const _delete = async (id) => {
  try {
    const result = await getRecharge(id);
    await result.remove();
  } catch (err) {
    console.error({ err });
  }
};

const getRecharge = async (id) => {
  try {
    if (!db.isValidId(id)) throw "Recharge not found";
    const result = await db.Recharge.findById(id);
    if (!result) throw "Recharge not found";
    return result;
  } catch (err) {
    console.error({ err });
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
          { customerNo: { $regex: searchKeyword, $options: "i" } },
          {
            "userDetail.phoneNumber": { $regex: searchKeyword, $options: "i" },
          },
        ],
      };
    }

    if (params.category) {
      match.serviceCategoryId = mongoose.Types.ObjectId(params.category);
    }

    if (params.services) {
      match.serviceId = mongoose.Types.ObjectId(params.services);
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

    const orderByColumn = params.sortBy || "createdAt";
    const orderByDirection = params.orderBy || "DESC";
    const sort = {};

    if (orderByColumn && orderByDirection) {
      sort[orderByColumn] = orderByDirection == "DESC" ? -1 : 1;
    }

    if (params.startDate && params.endDate) {
      var start = new Date(params.startDate);
      start.setHours(0, 0, 0, 0);

      var end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);

      var today = moment(start).startOf("day");
      var tomorrow = moment(end).endOf("day");
      var startDate = moment(new Date(params.startDate)).format("YYYY-MM-DD");
      var endDate = moment(new Date(params.endDate)).format("YYYY-MM-DD");

      let created = {
        $gte: start,
        $lte: end,
      };

      match.updated = created;
    }

    const total = await db.Recharge.find().countDocuments(match);
    const page = parseInt(params.page) || 1;
    const pageSize = parseInt(params.limits) || 10;
    const skipNo = (page - 1) * pageSize;
    const pages = Math.ceil(total / pageSize);

    const aggregateRules = [
      {
        $lookup: {
          from: "accounts",
          localField: "userId",
          foreignField: "_id",
          as: "userDetail",
        },
      },
      { $unwind: { path: "$userDetail", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "apis",
          localField: "apiId",
          foreignField: "_id",
          as: "apiData",
        },
      },
      { $unwind: { path: "$apiData", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "operators",
          localField: "operatorId",
          foreignField: "_id",
          as: "operatorData",
        },
      },
      { $unwind: { path: "$operatorData", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "services",
          localField: "serviceId",
          foreignField: "_id",
          as: "serviceData",
        },
      },
      { $unwind: { path: "$serviceData", preserveNullAndEmptyArrays: true } },
      {
        $match: match,
      },
      {
        $sort: sort,
      },
      { $skip: skipNo },
      { $limit: params.limits },
    ];

    const rechargeResult = await db.Recharge.aggregate(aggregateRules).then(
      async (rslt) => {
        for (let i = 0; i < rslt.length; i++) {
          let transactionRslt = await db.Transactions.findOne({
            rechargeId: rslt[i]._id,
            requestAmount: { $gt: 0 },
          });

          if (transactionRslt) {
            transactionRslt.serviceTypeName = transactionRslt.serviceTypeName;
            rslt[i].transactionData = transactionRslt;
          }
        }
        return rslt;
      }
    );

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
  } catch (err) {
    console.error({ err });
    res.status(500).json({
      status: 500,
      message: "Server Error",
      data: err,
    });
  }
};

const rechargeListWithPagination2 = async (req, res, next) => {
  try {
    const params = req.body;
    const filter = req.body;
    let match = {};

    let searchKeyword = params.search;
    if (searchKeyword) {
      match = {
        $or: [
          { customerNo: { $regex: searchKeyword, $options: "i" } },
          // {
          //   "userDetail.phoneNumber": { $regex: searchKeyword, $options: "i" },
          // },
        ],
      };
    }

    if (params.services) {
      match.serviceId = mongoose.Types.ObjectId(params.services);
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

    const orderByColumn = params.sortBy || "createdAt";
    const orderByDirection = params.orderBy || "DESC";
    const sort = {};

    if (orderByColumn && orderByDirection) {
      sort[orderByColumn] = orderByDirection == "DESC" ? -1 : 1;
    }

    if (params.startDate && params.endDate) {
      var start = new Date(params.startDate);
      start.setHours(0, 0, 0, 0);

      var end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);

      var today = moment(start).startOf("day");
      var tomorrow = moment(end).endOf("day");
      var startDate = moment(new Date(params.startDate)).format("YYYY-MM-DD");
      var endDate = moment(new Date(params.endDate)).format("YYYY-MM-DD");

      let created = {
        $gte: start,
        $lte: end,
      };

      match.updated = created;
    }

    // const total = await db.Recharge.find().countDocuments(match);
    const page = parseInt(params.page) || 1;
    const pageSize = parseInt(params.limits) || 10;
    const skipNo = (page - 1) * pageSize;
    // const pages = Math.ceil(total / pageSize);

    // const aggregateRules = [
    //   // {
    //   //   $sort: sort,
    //   // },
    //   { $skip: skipNo },
    //   { $limit: params.limits },
    //   {
    //     $lookup: {
    //       from: "accounts",
    //       localField: "userId",
    //       foreignField: "_id",
    //       as: "userDetail",
    //     },
    //   },
    //   { $unwind: "$userDetail" },
    //   {
    //     $match: match,
    //   },
    // ];

    // const rechargeResult = await db.Recharge.aggregate(aggregateRules).then(
    //   async (rslt) => {
    //     for (let i = 0; i < rslt.length; i++) {
    //       let transactionRslt = await db.Transactions.findOne({
    //         rechargeId: rslt[i]._id,
    //         requestAmount: { $gt: 0 },
    //       });

    //       if (transactionRslt) {
    //         transactionRslt = JSON.parse(JSON.stringify(transactionRslt));

    //         let serviceData = await db.Services.findById(
    //           transactionRslt.serviceId
    //         );
    //         transactionRslt.serviceTypeName = serviceData.serviceName || "";
    //         rslt[i].transactionData = transactionRslt;
    //       }
    //     }
    //     return rslt;
    //   }
    // );

    // res.status(200).json({
    //   status: 200,
    //   message: CONSTANT_STATUS.SUCCESS,
    //   data: {
    //     sort,
    //     filter,
    //     count: rechargeResult.length,
    //     page,
    //     pages,
    //     data: rechargeResult,
    //     total,
    //   },
    // });

    const pipeline = [
      {
        $lookup: {
          from: "accounts",
          localField: "userId",
          foreignField: "_id",
          as: "userDetail",
        },
      },
      {
        $match: {
          $and: [match], //provide the match criteria here
        },
      },
      {
        $facet: {
          orders: [
            {
              $sort: sort,
            },
            {
              $skip: +skipNo,
            },
            {
              $limit: +pageSize,
            },
          ],
          count: [
            {
              $group: {
                _id: null,
                count: {
                  $sum: 1,
                },
              },
            },
          ],
        },
      },
    ];

    //create the query from the pipeline
    const query = await db.Recharge.aggregate(pipeline).then(async (result) => {
      console.log({ result });
    });

    //execute the query
    // const queryResponse = await query.exec();

    res.status(200).json({
      status: 200,
      message: CONSTANT_STATUS.SUCCESS,
      data: {
        sort,
        filter,
        count: 0,
        page,
        // pages,
        data: [],
        // total,
      },
    });
  } catch (err) {
    console.error({ err });
    res.status(500).json({
      status: 500,
      message: "Server Error",
      data: err,
    });
  }
};

const rechargeListForReports = async (req, res, next) => {
  try {
    const params = req.body;
    const filter = req.body;
    let match = {};

    let searchKeyword = params.search;
    if (searchKeyword) {
      match = {
        $or: [
          { customerNo: { $regex: searchKeyword, $options: "i" } },
          {
            "userDetail.phoneNumber": { $regex: searchKeyword, $options: "i" },
          },
        ],
      };
    }

    if (params.services) {
      match.serviceId = mongoose.Types.ObjectId(params.services);
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

    const orderByColumn = params.sortBy || "updatedAt";
    const orderByDirection = params.orderBy || "DESC";
    const sort = {};

    if (orderByColumn && orderByDirection) {
      sort[orderByColumn] = orderByDirection == "DESC" ? -1 : 1;
    }

    if (params.startDate && params.endDate) {
      var start = new Date(params.startDate);
      start.setHours(0, 0, 0, 0);

      var end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);

      let updated = {
        $gte: start,
        $lte: end,
      };
      match.updated = updated;
    }

    const aggregateRules = [
      {
        $lookup: {
          from: "accounts",
          localField: "userId",
          foreignField: "_id",
          as: "userDetail",
        },
      },
      { $unwind: { path: "$userDetail", preserveNullAndEmptyArrays: true } },
      {
        $match: match,
      },
    ];

    const rechargeResult = await db.Recharge.aggregate(aggregateRules).then(
      async (rslt) => {
        for (let i = 0; i < rslt.length; i++) {
          let transactionRslt = await db.Transactions.findOne({
            rechargeId: rslt[i]._id,
            requestAmount: { $gt: 0 },
          });

          if (transactionRslt) {
            transactionRslt.serviceTypeName = transactionRslt.serviceTypeName;
            rslt[i].transactionData = transactionRslt;
          }
        }
        return rslt;
      }
    );

    // for (let i = 0; i < rechargeResult.length; i++) {
    //   let transactionRslt = await db.Transactions.findOne({
    //     rechargeId: rechargeResult[i]._id,
    //     requestAmount: { $gt: 0 },
    //   });

    //   if (transactionRslt) {
    //     transactionRslt = JSON.parse(JSON.stringify(transactionRslt));

    //     let serviceData = await db.Services.findById(
    //       transactionRslt.serviceId
    //     );
    //     transactionRslt.serviceTypeName = serviceData.serviceName || "";
    //     rechargeResult[i].transactionData = transactionRslt;
    //   }
    // }

    res.status(200).json({
      status: 200,
      message: CONSTANT_STATUS.SUCCESS,
      data: {
        count: rechargeResult.length,
        data: rechargeResult,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: "Server Error",
      data: error,
    });
  }
};

const getRechargeData = async (params) => {
  let transactionData;
  if (params.liveID) {
    transactionData = await db.Recharge.findOne({
      "rechargeData.opid": params.liveID,
    });
  }
  if (!transactionData) {
    let transactionData1 = await db.Recharge.findOne({
      "rechargeData.TRNID": Number(params.TrnID || params.TRNID),
    });
    if (!transactionData1) {
      let transactionData2 = await db.Recharge.findOne({
        "rechargeData.TrnID": Number(params.TrnID || params.TRNID),
      });
      if (!transactionData2) {
        let transactionData3 = await db.Recharge.findOne({
          "rechargeData.agentid": params.agentid,
        });
        return transactionData3;
      } else {
        return transactionData2;
      }
    } else {
      return transactionData1;
    }
  } else {
    return transactionData;
  }
};

const rechargeCallBack = async (req) => {
  try {
    let params = req.query;

    let rechargeData = await getRechargeData(params);

    let apiConfigData = await db.ApiConfig.findOne({
      apiId: rechargeData.apiId,
      categoryId: rechargeData.serviceCategoryId,
    });

    const status = String(params.status || params.Status);

    if (apiConfigData) {
      if (apiConfigData.refundedValue.split(",").includes(status)) {
        updateComplaintByRechargeId(rechargeData._id, {
          status: CONSTANT_STATUS.REFUND,
        });
        return await updateRechargeById(rechargeData._id, {
          status: CONSTANT_STATUS.REFUND,
        });
      } else if (apiConfigData.failureValue.split(",").includes(status)) {
        updateComplaintByRechargeId(rechargeData._id, {
          status: CONSTANT_STATUS.FAILED,
        });
        return await updateRechargeById(rechargeData._id, {
          status: CONSTANT_STATUS.FAILED,
        });
      } else if (apiConfigData.successValue.split(",").includes(status)) {
        updateComplaintByRechargeId(rechargeData._id, {
          status: CONSTANT_STATUS.SUCCESS,
        });
        return await updateRechargeById(rechargeData._id, {
          status: CONSTANT_STATUS.SUCCESS,
        });
      }
    }
  } catch (err) {
    throw err;
  }
};

const updateComplaintsStatus = async (req) => {
  let params = req.body;
  update(params.id, {
    status: CONSTANT_STATUS.REFUND,
  });
  return await updateRechargeById(params.id, {
    status: CONSTANT_STATUS.SUCCESS,
  });
};

const scanAndUpdate = async () => {
  const recharge = await db.Recharge.find({});
  for (let i = 0; i < recharge.length; i++) {
    if (!recharge[i].updated) {
      recharge[i].updated = recharge[i].created;
    }

    if (
      !recharge[i].serviceCategoryId &&
      recharge[i].rechargeData.operatorConfig
    ) {
      recharge[i].serviceCategoryId =
        recharge[i].rechargeData.operatorConfig.serviceData.serviceCategoryId;
    }

    if (!recharge[i].serviceId && recharge[i].rechargeData.operatorConfig) {
      recharge[i].serviceId =
        recharge[i].rechargeData.operatorConfig.serviceData._id;
    }

    if (!recharge[i].serviceCategoryId) {
      let serviceData = await db.Services.findOne({
        _id: recharge[i].serviceId,
      });
      recharge[i].serviceCategoryId = serviceData.serviceCategoryId;
    }

    await recharge[i].save();
  }
  return recharge;
};

module.exports = {
  updateRechargeById,
  getById,
  getAll,
  delete: _delete,
  rechargeListWithPagination,
  rechargeListWithPagination2,
  createNewRecharge,
  rechargeCallBack,
  updateComplaintsStatus,
  checkTransactionStatusRecursive,
  scanAndUpdate,
  rechargeListForReports,
};
