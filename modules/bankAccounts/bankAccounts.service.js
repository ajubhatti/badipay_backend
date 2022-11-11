const db = require("../../_helpers/db");
const { getBankById } = require("../banks/banks.service");

const create = async (params) => {
  try {
    let bankAccountExist = await db.BankAccounts.findOne({
      accountNo: params.accountNo,
    });

    if (bankAccountExist) {
      throw `${params.accountNo} is already added`;
    }

    const banksAccounts = new db.BankAccounts(params);
    await banksAccounts.save();
    return banksAccounts;
  } catch (err) {
    return err;
  }
};

const update = async (id, params) => {
  try {
    const banksAccounts = await getBankAccount(id);
    if (
      params.accountNo &&
      banksAccounts.accountNo !== params.accountNo &&
      (await db.BankAccounts.findOne({ accountNo: params.accountNo }))
    ) {
      throw `${params.accountNo} is already taken`;
    }

    Object.assign(banksAccounts, params);
    banksAccounts.updated = Date.now();
    await banksAccounts.save();
    return banksAccounts;
  } catch (err) {
    return err;
  }
};

const getBankAccountById = async (id) => {
  try {
    let banksAccounts = await db.BankAccounts.findById(id);
    let temp = JSON.stringify(banksAccounts);
    let result = JSON.parse(temp);
    if (banksAccounts) {
      let bankdetail = await getBankById(banksAccounts.bankId);
      result.bankdetails = bankdetail;
    }
    return result;
  } catch (err) {
    return err;
  }
};

const getAll = async () => {
  try {
    return await db.BankAccounts.aggregate([
      {
        $lookup: {
          from: "banks",
          localField: "bankId",
          foreignField: "_id",
          as: "bankdetail",
        },
      },
      { $unwind: "$bankdetail" },
      {
        $project: {
          _id: 1,
          accountNo: 1,
          accountName: 1,
          accountDetail: 1,
          ifscCode: 1,
          bankId: 1,
          bankName: "$bankdetail.bankName",
        },
      },
    ]);
  } catch (err) {
    return err;
  }
};

const _delete = async (id) => {
  try {
    const banksAccounts = await getBankAccount(id);
    await banksAccounts.remove();
  } catch (err) {
    return err;
  }
};

const getBankAccount = async (id) => {
  try {
    if (!db.isValidId(id)) throw "Bank account not found";
    const banksAccounts = await db.BankAccounts.findById(id);

    if (!banksAccounts) throw "Bank account not found";
    return banksAccounts;
  } catch (err) {
    return err;
  }
};

module.exports = {
  create,
  update,
  getBankAccountById,
  getAll,
  delete: _delete,
};
