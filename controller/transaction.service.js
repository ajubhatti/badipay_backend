const mongoose = require("mongoose");
const shortid = require("shortid");
const db = require("../_helpers/db");
const { getUserById } = require("../controller/accounts.service");
const accountsService = require("../controller/accounts.service");
const { getBankAccountById } = require("../controller/bankAccounts.service");
const { fetchAllData } = require("../_middleware/fetchingData");
const generateRandomNumber = require("../_helpers/randomNumber");

const getAll = async (req, res, next) => {
  try {
    const params = req.body;
    const filter = req.body;
    let match = {};
    console.log({ params });

    let searchKeyword = params.search;
    if (searchKeyword) {
      match = {
        $or: [
          { transactionId: { $regex: searchKeyword, $options: "i" } },
          { customerNo: { $regex: searchKeyword, $options: "i" } },
        ],
      };
    }

    const orderByColumn = params.sortBy || "created";
    const orderByDirection = params.orderBy || "desc";
    const sort = {};

    if (orderByColumn && orderByDirection) {
      sort[orderByColumn] = orderByDirection === "desc" ? -1 : 1;
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
      match.created = created;
    }

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
      { $limit: params.limits },
      {
        $lookup: {
          from: "accounts",
          localField: "userId",
          foreignField: "_id",
          as: "userDetail",
        },
      },
      { $unwind: "$userDetail" },
      // {
      //   $lookup: {
      //     from: "paymentmodes",
      //     localField: "paymentType",
      //     foreignField: "_id",
      //     as: "paymentMode",
      //   },
      // },
      // { $unwind: "$paymentMode" },

      // {
      //   $lookup: {
      //     from: "transactions",
      //     localField: "transactionId",
      //     foreignField: "_id",
      //     as: "transactionData",
      //   },
      // },
      // { $unwind: "$transactionData" },
    ];

    console.log(JSON.stringify(aggregateRules));

    await db.Transactions.aggregate(aggregateRules).then((result) => {
      res.status(200).json({
        status: 200,
        message: "success",
        data: {
          sort,
          filter,
          count: result.length,
          page,
          pages,
          data: result,
          total,
        },
      });
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

const getAll2 = async (params) => {
  params.dataBase = db.Transactions;
  let res = await fetchAllData(params);
  console.log(`${res}`);
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

const update = async (id, params) => {
  const transaction = await getTransaction(id);

  const transactionData = await db.Transactions.find({
    rechargeId: params.rechargeId,
  });
  // copy params to account and save
  if (
    params.status &&
    params.status != transaction.status &&
    params.status != "success"
  ) {
    //  get user and referal user transaction data
    if (transactionData) {
      for (let i = 0; i < transactionData.length; i++) {
        let userTransaction = transactionData[i];
        const accountData = await db.Account.findById(userTransaction.userId);

        let blnc = accountData.walletBalance;
        let dscnt = accountData.rewardedBalance;

        if (userTransaction.requestAmount) {
          blnc = blnc + userTransaction.requestAmount;
        }

        if (userTransaction.cashBackAmount) {
          blnc = blnc - userTransaction.cashBackAmount;
        }

        let userDisAmount =
          accountData.rewardedBalance != 0
            ? accountData.rewardedBalance - userTransaction.cashBackAmount
            : 0;

        let rewardAmount =
          accountData.rewardedBalance != 0
            ? accountData.rewardedBalance - userTransaction.cashBackAmount
            : 0;

        let userPayload = {
          discount: userDisAmount,
          rewardedBalance: rewardAmount,
          walletBalance: blnc,
        };

        console.log({ userPayload });

        Object.assign(accountData, userPayload);
        await accountData.save();

        let transactionPayload = {};

        transactionPayload.userBalance = userTransaction.userBalance || null;
        transactionPayload.requestAmount =
          userTransaction.requestAmount || null;
        transactionPayload.rechargeAmount = 0;
        transactionPayload.cashBackAmount = 0;
        transactionPayload.userFinalBalance =
          userTransaction.userFinalBalance +
          userTransaction.requestAmount -
          userTransaction.cashBackAmount;

        transactionPayload.requestAmountBack = userTransaction.requestAmount;
        transactionPayload.cashBackAmountBack = userTransaction.cashBackAmount;
        transactionPayload.rechargeAmountBack = userTransaction.rechargeAmount;

        console.log({ transactionPayload });

        Object.assign(userTransaction, transactionPayload);
        await userTransaction.save();
      }
    }
  } else if (
    params.status &&
    params.status != transaction.status &&
    params.status == "success"
  ) {
    console.log({ params });
    for (let i = 0; i < transactionData.length; i++) {
      let userTransaction = transactionData[i];
      const accountData = await db.Account.findById(userTransaction.userId);

      let blnc = accountData.walletBalance;
      let dscnt = accountData.rewardedBalance;

      if (userTransaction.requestAmount) {
        blnc = blnc != 0 ? blnc - userTransaction.requestAmount : 0;
      }

      if (userTransaction.cashBackAmount) {
        blnc = blnc + userTransaction.cashBackAmount;
      }

      let userDisAmount = accountData.rewardedBalance + dscnt;
      let rewardAmount = accountData.rewardedBalance + dscnt;

      let userPayload = {
        discount: userDisAmount,
        rewardedBalance: rewardAmount,
        walletBalance: blnc,
      };

      console.log({ userPayload });

      Object.assign(accountData, userPayload);
      await accountData.save();

      let transactionPayload = {};

      transactionPayload.userBalance = userTransaction.userBalance || null;
      transactionPayload.requestAmount = userTransaction.requestAmount || null;
      transactionPayload.rechargeAmount = userTransaction.rechargeAmountBack;
      transactionPayload.cashBackAmount = userTransaction.cashBackAmount;
      transactionPayload.userFinalBalance =
        userTransaction.userFinalBalance -
        userTransaction.requestAmount +
        userTransaction.cashBackAmount;

      transactionPayload.requestAmountBack = 0;
      transactionPayload.cashBackAmountBack = 0;
      transactionPayload.rechargeAmountBack = 0;

      console.log({ transactionPayload });

      Object.assign(userTransaction, transactionPayload);
      await userTransaction.save();
    }
  }
  Object.assign(transaction, params);
  return await transaction.save();
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
    console.log(transaction);
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

    console.log("result: " + result);

    if (!transaction) throw "transaction data not found";

    return result;
  } catch (err) {
    console.log(err);
    return err;
  }
};

const createTransactions = async (req, res, next) => {
  try {
    const params = req.body;
    console.log({ params });

    let lastCount = await db.Transactions.countDocuments();
    console.log("lastCount: " + lastCount);
    params.transactionId = await generateRandomNumber(6);
    // params.transactionId = lastCount;

    const transaction = new db.Transactions(params);
    return await transaction.save();
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

const transactionListPageWise = async (req, res, next) => {
  try {
    const params = req.body;
    const filter = req.body;
    let match = {};
    console.log({ params });

    let searchKeyword = params.search;
    if (searchKeyword) {
      match = {
        $or: [
          { transactionId: { $regex: searchKeyword, $options: "i" } },
          { customerNo: { $regex: searchKeyword, $options: "i" } },
        ],
      };
    }

    const orderByColumn = params.sortBy || "created";
    const orderByDirection = params.orderBy || "desc";
    const sort = {};

    if (orderByColumn && orderByDirection) {
      sort[orderByColumn] = orderByDirection === "desc" ? -1 : 1;
    }

    if (params.status) {
      match.statusOfWalletRequest = params.status;
    }
    if (params.userId) {
      match.userId = mongoose.Types.ObjectId(params.userId);
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
      match.created = created;
    }

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
      { $limit: params.limits },
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

      // {
      //   $lookup: {
      //     from: "transactions",
      //     localField: "transactionId",
      //     foreignField: "_id",
      //     as: "transactionData",
      //   },
      // },
      // { $unwind: "$transactionData" },
    ];

    console.log(JSON.stringify(aggregateRules));

    await db.Transactions.aggregate(aggregateRules).then((result) => {
      res.status(200).json({
        status: 200,
        message: "success",
        data: {
          sort,
          filter,
          count: result.length,
          page,
          pages,
          data: result,
          total,
        },
      });
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
  create,
  createTransactions,
  update,
  getAll,
  getAll2,
  getTrasactionById,
  delete: _delete,
  getTransctionByUserId,
  transactionListPageWise,
};
