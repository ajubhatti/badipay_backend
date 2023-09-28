const mongoose = require("mongoose");
const shortid = require("shortid");
const db = require("../_helpers/db");
const { getUserById } = require("../controller/accounts.service");
const { getBankAccountById } = require("../controller/bankAccounts.service");
const { fetchAllData } = require("../_middleware/fetchingData");
const generateRandomNumber = require("../_helpers/randomNumber");
const { CONSTANT_STATUS } = require("../_helpers/constant");
const moment = require("moment");
const { roundOfNumber } = require("../_middleware/middleware");
const dayjs = require("dayjs");

const getAll = async (params) => {
  try {
    console.log({ params });
    const filter = params;
    let match = {};

    let searchKeyword = params.search;
    if (searchKeyword) {
      match = {
        $or: [
          { transactionId: { $regex: searchKeyword, $options: "i" } },
          { customerNo: { $regex: searchKeyword, $options: "i" } },
          {
            "userDetail.phoneNumber": { $regex: searchKeyword, $options: "i" },
          },
        ],
      };
    }

    if (params.userId) {
      match.userId = mongoose.Types.ObjectId(params.userId);
    }

    if (params.services) {
      match.serviceType = { $regex: params.services, $options: "i" };
    }

    if (params.api) {
      match.apiProvider = { $regex: params.api, $options: "i" };
    }

    const orderByColumn = params.sortBy || "updated";
    const orderByDirection = params.orderBy || "DESC";
    const sort = {};

    if (orderByColumn && orderByDirection) {
      sort[orderByColumn] = orderByDirection == "DESC" ? -1 : 1;
    }

    if (params.status) {
      match.status = params.status;
    }

    if (params.startDate && params.endDate) {
      // var startDate = new Date(params.startDate); // this is the starting date that looks like ISODate("2014-10-03T04:00:00.188Z")

      // startDate.setSeconds(0);
      // startDate.setHours(0);
      // startDate.setMinutes(0);

      // var endDate = new Date(params.endDate);

      // endDate.setHours(23);
      // endDate.setMinutes(59);
      // endDate.setSeconds(59);

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

    const total = await db.Transactions.find().countDocuments(match);
    const page = parseInt(params.page) || 1;
    const pageSize = parseInt(params.limits) || 10;
    const skipNo = (page - 1) * pageSize;
    const pages = Math.ceil(total / pageSize);

    const aggregateRules = [
      {
        $sort: sort,
      },
      { $skip: skipNo },
      {
        $lookup: {
          from: "accounts",
          localField: "userId",
          foreignField: "_id",
          as: "userDetail",
        },
      },
      { $unwind: "$userDetail" },
      {
        $match: match,
      },
    ];

    if (params.limits) {
      aggregateRules.push({ $limit: params.limits });
    }

    console.log(JSON.stringify(aggregateRules));

    let walletResult = await db.Transactions.aggregate(aggregateRules).then(
      async (result) => {
        result = JSON.parse(JSON.stringify(result));
        for (let i = 0; i < result.length; i++) {
          if (
            (result[i] && result[i].apiProvider) ||
            (result[i] && result[i].serviceType)
          ) {
            let serviceType = await db.Services.findById(result[i].serviceType);
            result[i].serviceTypeName = serviceType.serviceName || "";
          }
        }
        return result;
      }
    );

    return {
      sort,
      filter,
      count: walletResult.length,
      page,
      pages,
      data: walletResult,
      total,
    };
  } catch (err) {
    console.error(err);
    throw err;
  }
};

const getAll2 = async (params) => {
  params.dataBase = db.Transactions;
  let res = await fetchAllData(params);
  return res;
};

const getTrasactionById = async (id) => {
  const transaction = await getTransaction(id);
  return transaction;
};

const create = async (params) => {
  params.transactionId = await referalcodeGenerator();
  const transaction = new db.Transactions(params);
  return await transaction.save();
};

const referalcodeGenerator = async () => {
  shortid.characters(
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@"
  );
  return await shortid.generate();
};

const updateTransactionById = async (id, params) => {
  try {
    console.log({ id, params });
    // const transaction = await getTransaction(id);

    const transactionData = await db.Transactions.find({
      rechargeId: params.rechargeId,
    });

    console.log({ transactionData });
    console.log(
      "api id --",
      transactionData[0].apiProvider,
      "operator ID ---",
      transactionData[0].operatorId
    );

    //  get user and referal user transaction data
    if (transactionData) {
      for (let i = 0; i < transactionData.length; i++) {
        let usrTrscn = transactionData[i];

        const accountData = await db.Account.findById(usrTrscn.userId);
        console.log(
          params.status,
          usrTrscn.status,
          params.status != usrTrscn.status,
          params.status != "success"
        );
        if (
          params.status &&
          params.status != usrTrscn.status &&
          params.status != "success"
        ) {
          if (usrTrscn.isPendingOrFail != true) {
            let blnc = accountData.walletBalance;
            let dscnt = accountData.rewardedBalance;

            if (usrTrscn.requestAmount) {
              blnc = blnc + usrTrscn.requestAmount;
            }

            if (usrTrscn.cashBackAmount) {
              blnc = blnc - usrTrscn.cashBackAmount;
            }

            let userDisAmount =
              dscnt != 0 ? dscnt - usrTrscn.cashBackAmount : 0;

            let userPayload = {
              discount: userDisAmount,
              rewardedBalance: userDisAmount,
              walletBalance: blnc,
            };

            Object.assign(accountData, userPayload);
            await accountData.save();

            let transactionPayload = {
              userBalance: roundOfNumber(
                usrTrscn.userBalance ? usrTrscn.userBalance : 0
              ),
              requestAmount: roundOfNumber(
                usrTrscn.requestAmount ? usrTrscn.requestAmount : 0
              ),
              rechargeAmount: 0,
              cashBackAmount: 0,
              userFinalBalance: roundOfNumber(
                usrTrscn.userFinalBalance && usrTrscn.rechargeAmount
                  ? usrTrscn.userFinalBalance + usrTrscn.rechargeAmount
                  : 0
              ),
              requestAmountBack: roundOfNumber(
                usrTrscn.requestAmount ? usrTrscn.requestAmount : 0
              ),
              cashBackAmountBack: roundOfNumber(
                usrTrscn.cashBackAmount ? usrTrscn.cashBackAmount : 0
              ),
              rechargeAmountBack: roundOfNumber(
                usrTrscn.rechargeAmount ? usrTrscn.rechargeAmount : 0
              ),
              status: params.status,
              isPendingOrFail: true,
            };

            Object.assign(usrTrscn, transactionPayload);
            await usrTrscn.save();

            console.log({ usrTrscn });

            let cashBackData = await db.Cashback.findOne({
              transactionId: usrTrscn._id,
            });

            console.log({ cashBackData });
            if (cashBackData) {
              let pyld = {
                requestAmount: 0,
                rechargeAmount: 0,
                cashBackReceive: 0,
                userCashBack: 0,
                referralCashBack: 0,
                netCashBack: 0,
                requestAmountBckup: cashBackData.requestAmount || 0,
                rechargeAmountBckup: cashBackData.rechargeAmount || 0,
                cashBackReceiveBckup: cashBackData.cashBackReceive || 0,
                userCashBackBckup: cashBackData.userCashBack || 0,
                referralCashBackBckup: cashBackData.referralCashBack || 0,
                netCashBackBckup: cashBackData.netCashBack || 0,
              };
              if (params.status == CONSTANT_STATUS.PENDING) {
                pyld.status = params.status;
              } else {
                pyld.status = params.status;
              }

              console.log({ pyld });

              Object.assign(cashBackData, pyld);
              cashBackData.updated = Date.now();
              await cashBackData.save();
            }

            // await db.Cashback.find({}).then((result) => {
            //   console.log(result);
            // });

            // let loyaltyData = await db.AdminLoyalty.findOne({});
            // if (loyaltyData) {
            //   let loyaltyRes = loyaltyData;
            //   console.log("loyaltyRes data ------", loyaltyRes);
            //   console.log(
            //     "check type ----",
            //     loyaltyRes.netCashBack,
            //     adminDiscnt,
            //     discountAmount
            //   );

            //   let lyltyPayld = {
            //     requestAmount:
            //       roundOfNumber(loyaltyRes.requestAmount) + roundOfNumber(params.amount),

            //     rechargeAmount:
            //       roundOfNumber(loyaltyRes.rechargeAmount) + roundOfNumber(rechargeAmount),

            //     cashBackReceive:
            //       roundOfNumber(loyaltyRes.cashBackReceive) + roundOfNumber(adminDiscnt),

            //     userCashBack:
            //       roundOfNumber(loyaltyRes.userCashBack) + roundOfNumber(discountAmount),

            //     referralCashBack: roundOfNumber(loyaltyRes.referralCashBack) + 0,

            //     netCashBack:
            //       roundOfNumber(loyaltyRes.netCashBack) +
            //       roundOfNumber(loyaltyRes.netCashBack) +
            //       roundOfNumber(adminDiscnt) -
            //       roundOfNumber(discountAmount),
            //   };

            //   console.log("lyltyPayld ---------", lyltyPayld);

            //   Object.assign(loyaltyRes, lyltyPayld);
            //   loyaltyRes.updated = Date.now();
            //   await loyaltyRes.save();
            // }
          } else {
            let transactionPayload = { status: params.status };
            Object.assign(usrTrscn, transactionPayload);
            await usrTrscn.save();

            let cashBackData = await db.Cashback.findOne({
              transactionId: usrTrscn._id,
            });

            if (cashBackData) {
              let pyld = { status: CONSTANT_STATUS.REFUND };

              if (params.status == CONSTANT_STATUS.PENDING) {
                pyld.status = CONSTANT_STATUS.PENDING;
              }

              Object.assign(cashBackData, pyld);
              cashBackData.updated = Date.now();
              await cashBackData.save();
            }
          }
        } else if (
          params.status &&
          params.status != usrTrscn.status &&
          params.status == "success"
        ) {
          console.log({ usrTrscn, accountData });

          let discountData = await db.ServiceDiscount.findOne({
            apiId: mongoose.Types.ObjectId(usrTrscn.apiProvider),
            operatorId: mongoose.Types.ObjectId(usrTrscn.operatorId),
          });

          console.log("check discount data -----", discountData);
          // -------------------------------------------------------------------------
          let disAmount = 0;
          let adminDiscnt = 0;
          if (discountData) {
            if (usrTrscn.amount === 0) {
              const { referalDiscount, referalDiscountType } = discountData;
              if (referalDiscountType === "percentage") {
                let percentageAmount = referalDiscount / 100;
                disAmount = roundOfNumber(
                  Number(transactionData[0].amount) * percentageAmount
                );
              } else {
                disAmount = roundOfNumber(referalDiscount);
              }
            } else {
              const { userDiscount, userDiscountType } = discountData;
              if (userDiscountType === "percentage") {
                let percentageAmount = userDiscount / 100;
                disAmount = roundOfNumber(
                  Number(usrTrscn.amount) * percentageAmount
                );
              } else {
                disAmount = roundOfNumber(userDiscount);
              }
            }

            const { adminDiscount, adminDiscountType } = discountData;
            if (adminDiscountType === "percentage") {
              let percentageAmount = adminDiscount / 100;
              adminDiscnt = roundOfNumber(
                Number(params.amount) * percentageAmount
              );
            } else {
              adminDiscnt = roundOfNumber(adminDiscount);
            }
          }

          console.log("disAmount ==============>", disAmount);
          // ---------------------------------------------------------------------------------

          let blnc = accountData.walletBalance;
          let dscnt = accountData.rewardedBalance;

          console.log("usrTrscn.requestAmount ---", usrTrscn.requestAmount);

          blnc =
            usrTrscn.requestAmount != 0
              ? blnc - usrTrscn.requestAmount
              : blnc - usrTrscn.amount;

          blnc =
            usrTrscn.cashBackAmount != 0
              ? blnc + usrTrscn.cashBackAmount
              : blnc + disAmount;

          let userDisAmount =
            usrTrscn.cashBackAmount != 0
              ? usrTrscn.cashBackAmount + dscnt
              : disAmount + dscnt;

          let userPayload = {
            discount: roundOfNumber(userDisAmount),
            rewardedBalance: roundOfNumber(userDisAmount),
            walletBalance: roundOfNumber(blnc),
          };

          console.log("userPayload ----", userPayload);

          Object.assign(accountData, userPayload);
          await accountData.save();

          let transactionPayload = {
            userBalance: roundOfNumber(blnc),

            requestAmount: roundOfNumber(
              usrTrscn.requestAmountBack
                ? usrTrscn.requestAmountBack
                : usrTrscn.requestAmount
            ),

            rechargeAmount: roundOfNumber(
              usrTrscn.rechargeAmountBack
                ? usrTrscn.rechargeAmountBack
                : usrTrscn.rechargeAmount
                ? usrTrscn.rechargeAmount
                : usrTrscn.amount - disAmount
            ),
            cashBackAmount: roundOfNumber(
              usrTrscn.cashBackAmountBack
                ? usrTrscn.cashBackAmountBack
                : usrTrscn.cashBackAmount
                ? usrTrscn.cashBackAmount
                : disAmount
            ),
            userFinalBalance: roundOfNumber(
              usrTrscn.rechargeAmountBack
                ? blnc - usrTrscn.rechargeAmountBack
                : blnc - usrTrscn.rechargeAmount
            ),

            userFinalBalance: roundOfNumber(blnc),

            // userBalance: roundOfNumber(usrTrscn.userBalance) || null,
            // requestAmount: roundOfNumber(usrTrscn.requestAmountBack) || null,
            // rechargeAmount: roundOfNumber(usrTrscn.rechargeAmountBack),
            // cashBackAmount: roundOfNumber(usrTrscn.cashBackAmountBack),
            // userFinalBalance:
            //   usrTrscn.userFinalBalance - usrTrscn.rechargeAmountBack,

            requestAmountBack: 0,
            cashBackAmountBack: 0,
            rechargeAmountBack: 0,
            status: params.status,
            isPendingOrFail: false,
          };

          console.log({ transactionPayload });

          Object.assign(usrTrscn, transactionPayload);
          await usrTrscn.save();

          let cashBackData = await db.Cashback.findOne({
            transactionId: usrTrscn._id,
          });

          console.log({ cashBackData });

          if (cashBackData) {
            let pyld = {
              requestAmount:
                (cashBackData.requestAmount || 0) +
                (cashBackData.requestAmountBckup || 0),
              rechargeAmount:
                (cashBackData.rechargeAmount || 0) +
                (cashBackData.rechargeAmountBckup || 0),
              cashBackReceive:
                (cashBackData.cashBackReceive || 0) +
                (cashBackData.cashBackReceiveBckup || 0),
              userCashBack:
                (cashBackData.userCashBack || 0) +
                (cashBackData.userCashBackBckup || 0),
              referralCashBack:
                (cashBackData.referralCashBack || 0) +
                (cashBackData.referralCashBackBckup || 0),
              netCashBack:
                (cashBackData.netCashBack || 0) +
                (cashBackData.netCashBackBckup || 0),

              // ===========================================
              requestAmountBckup: 0,
              rechargeAmountBckup: 0,
              cashBackReceiveBckup: 0,
              userCashBackBckup: 0,
              referralCashBackBckup: 0,
              netCashBackBckup: 0,
              status: params.status,
            };

            console.log({ pyld });

            Object.assign(cashBackData, pyld);
            cashBackData.updated = Date.now();
            await cashBackData.save();
          } else {
            let cashBackPayload = {
              requestAmount: usrTrscn.requestAmount,
              rechargeId: usrTrscn.rechargeId,
              userId: usrTrscn.userId,
              transactionId: usrTrscn._id,
              rechargeAmount:
                roundOfNumber(
                  usrTrscn.rechargeAmountBack
                    ? usrTrscn.rechargeAmountBack
                    : usrTrscn.rechargeAmount
                    ? usrTrscn.rechargeAmount
                    : usrTrscn.amount - disAmount
                ) || 0,
              cashBackReceive: roundOfNumber(
                usrTrscn.cashBackAmountBack
                  ? usrTrscn.cashBackAmountBack
                  : usrTrscn.cashBackAmount
                  ? usrTrscn.cashBackAmount
                  : disAmount
              ),
              userCashBack: roundOfNumber(disAmount),
              referralCashBack: 0,
              netCashBack:
                roundOfNumber(adminDiscnt) - roundOfNumber(disAmount),
              status: params.status,
              apiId: usrTrscn.apiProvider,
              operatorId: usrTrscn.operatorId,
            };

            const cashBackData = await new db.Cashback(cashBackPayload);
          }
        }
      }
    }
    return "success";
    // Object.assign(transaction, params);
    // return await transaction.save();
  } catch (err) {
    console.log({ err });
  }
};

const _delete = async (id) => {
  const transaction = await getTransaction(id);
  return await transaction.remove();
};

const getTransaction = async (id) => {
  if (!db.isValidId(id)) throw "transaction not found";
  const transaction = await db.Transactions.findById(id);
  if (!transaction) throw "transaction not found";
  return transaction;
};

const getTransctionByUserId = async (userId) => {
  try {
    let transaction = await db.Transactions.find({ userId: userId });

    // let banksAccounts = await db.BankAccounts.findById(id);
    let temp = JSON.stringify(transaction);
    let result = JSON.parse(temp);

    if (result) {
      result.map(async (x, index) => {
        let tempX = JSON.stringify(x);
        let resultX = JSON.parse(tempX);
        result[index].userdetail = await getUserById(userId);
      });
    }

    if (!transaction) throw "transaction data not found";

    return result;
  } catch (err) {
    console.error(err);
    return err;
  }
};

const createTransactions = async (req, res, next) => {
  try {
    const params = req.body;
    let lastCount = await db.Transactions.countDocuments();
    params.transactionId = await generateRandomNumber(6);
    const transaction = new db.Transactions(params);
    return await transaction.save();
  } catch (err) {
    console.error(err);
    return next(err);
  }
};

const transactionListWithPagination = async (params) => {
  try {
    const filter = params;
    let match = {};

    let searchKeyword = params.search;
    if (searchKeyword) {
      match = {
        $or: [
          { transactionId: { $regex: searchKeyword, $options: "i" } },
          { customerNo: { $regex: searchKeyword, $options: "i" } },
          {
            "userDetail.phoneNumber": { $regex: searchKeyword, $options: "i" },
          },
        ],
      };
    }

    const orderByColumn = params.sortBy || "updated";
    const orderByDirection = params.orderBy || "DESC";
    const sort = {};

    if (orderByColumn && orderByDirection) {
      sort[orderByColumn] = orderByDirection == "DESC" ? -1 : 1;
    }

    if (params.status) {
      match.status = params.status;
    }
    if (params.userId) {
      match.userId = mongoose.Types.ObjectId(params.userId);
    }
    if (params.startDate && params.endDate) {
      var startDate = new Date(params.startDate); // this is the starting date that looks like ISODate("2014-10-03T04:00:00.188Z")

      var start = new Date(params.startDate);
      start.setHours(0, 0, 0, 0);

      var end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);

      const start1 = dayjs().startOf("day"); // set to 12:00 am today
      const end1 = dayjs().endOf("day"); // set to 23:59 pm today

      let updated = {
        $gte: start1,
        $lte: end1,
      };
      match.updated = updated;
    }

    console.log({ match });

    const total = await db.Transactions.find().countDocuments(match);
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

      // {
      //   $lookup: {
      //     from: "accounts",
      //     localField: "userId",
      //     foreignField: "_id",
      //     as: "userDetail",
      //   },
      // },
      // { $unwind: "$userDetail" },
      // {
      //   $lookup: {
      //     from: "paymentmodes",
      //     localField: "paymentType",
      //     foreignField: "_id",
      //     as: "paymentMode",
      //   },
      // },
      // { $unwind: "$paymentMode" },
    ];

    if (params.limits) {
      aggregateRules.push({ $limit: params.limits });
    }

    let result = await db.Transactions.aggregate(aggregateRules);
    return {
      sort,
      filter,
      count: result.length,
      page,
      pages,
      data: result,
      total,
    };
  } catch (err) {
    console.error(err);
    throw err;
  }
};

const scanAndUpdate = async () => {
  console.log("----scanAndUpdate----");
  const transaction = await db.Transactions.find({});
  console.log({ transaction });
  for (let i = 0; i < transaction.length; i++) {
    transaction[i].updated = transaction[i].created;
    await transaction[i].save();
  }
  return transaction;
};

module.exports = {
  create,
  createTransactions,
  updateTransactionById,
  getAll,
  getAll2,
  getTrasactionById,
  delete: _delete,
  getTransctionByUserId,
  transactionListWithPagination,
  scanAndUpdate,
};
