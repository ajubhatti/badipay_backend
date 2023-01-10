const mongoose = require("mongoose");
const shortid = require("shortid");
const db = require("../_helpers/db");
const { getUserById } = require("../controller/accounts.service");
const accountsService = require("../controller/accounts.service");
const { getBankAccountById } = require("../controller/bankAccounts.service");
const { fetchAllData } = require("../_middleware/fetchingData");
const generateRandomNumber = require("../_helpers/randomNumber");

const getAll = async (params) => {
  const filterData = await db.Transactions.find({}).sort({ createdAt: -1 });

  let transaction = await db.Transactions.aggregate([
    {
      $lookup: {
        from: "accounts",
        localField: "userId",
        foreignField: "_id",
        as: "userdetail",
      },
    },
    { $unwind: "$userdetail" },
    { $sort: { _id: -1 } },
  ]);

  // console.log({ transaction });

  // var startDate = new Date(params.startDate);
  // var endDate = new Date(params.endDate);

  // let filterData = transaction;
  // if (params.startDate && params.endDate) {
  //   filterData = filterData.filter((user) => {
  //     let date = new Date(user.created);
  //     return date >= startDate && date <= endDate;
  //   });
  // }

  // let bankData = await db.Transactions.aggregate([
  //   {
  //     $lookup: {
  //       from: "bankaccounts",
  //       localField: "bank",
  //       foreignField: "_id",
  //       as: "bankData",
  //     },
  //   },
  // ]);

  // filterData.map(async (transation) => {
  //   console.log({ transation });
  //   let user = await accountsService.getById(transation.userId);
  //   filterData.userdata = user;
  // });

  //   if (params.role) {
  //     filterData = filterData.filter((user) => {
  //       return user.role == params.role;
  //     });
  //   }

  //   if (params.searchParams) {
  //     filterData = filterData.filter((user) => {
  //       if (user.userName.includes(params.searchParams)) {
  //         return user.userName.includes(params.searchParams);
  //       } else {
  //         return user.phoneNumber.includes(params.searchParams);
  //       }
  //     });
  //   }

  return transaction;
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

  // copy params to account and save
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
    const match = {};
    console.log({ params });
    let searchObj = {};
    let searchKeyword = params.search;
    if (searchKeyword) {
      searchObj = /^(?:\d*\.\d{1,2}|\d+)$/.test(searchKeyword)
        ? {
            $or: [{ search: searchKeyword }, { price: searchKeyword }],
          }
        : {
            search: new RegExp(`${searchKeyword.toString().trim()}`, "i"),
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
      let created = {
        $gte: new Date(params.startDate),
        $lt: new Date(params.endDate),
      };
      match.created = created;
    }

    const total = await db.Transactions.find(searchObj).countDocuments(match);
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
