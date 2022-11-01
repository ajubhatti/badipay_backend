const db = require("../../_helpers/db");
const { uid } = require("uid");
const { getUserById } = require("../accounts/accounts.service");
const accountsService = require("../accounts/accounts.service");
const { getBankAccountById } = require("../bankAccounts/bankAccounts.service");

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

const getTrasactionById = async (id) => {
  const transaction = await getTransaction(id);
  return transaction;
};

const create = async (params) => {
  params.transactionId = uid(16);
  const transaction = new db.Transactions(params);
  return await transaction.save();
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

module.exports = {
  create,
  update,
  getAll,
  getTrasactionById,
  delete: _delete,
  getTransctionByUserId,
};
