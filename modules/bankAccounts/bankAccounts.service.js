const db = require("../../_helpers/db");

module.exports = {
  create,
  update,
  getById,
  getAll,
  delete: _delete,
};

async function create(params) {
  let bankAccountExist = await db.BankAccounts.findOne({
    accountNo: params.accountNo,
  });

  if (bankAccountExist) {
    throw `${params.accountNo} is already added`;
  }

  const banksAccounts = new db.BankAccounts(params);
  await banksAccounts.save();
  return banksAccounts;
}

async function update(id, params) {
  const banksAccounts = await getBankAccount(id);

  if (
    params.accountNo &&
    banks.accountNo !== params.accountNo &&
    (await db.BankAccounts.findOne({ accountNo: params.accountNo }))
  ) {
    throw `${params.accountNo} is already taken`;
  }

  Object.assign(banksAccounts, params);
  banksAccounts.updated = Date.now();
  await banksAccounts.save();

  return banksAccounts;
}

async function getById(id) {
  const banksAccounts = await getBankAccount(id);
  return banksAccounts;
}

async function getAll() {
  await db.BankAccounts.find({}).then(async (res) => {
    return res.map(async (bnkAcc) => {
      let bank = await db.Banks.find({ _id: bnkAcc.bankId });
      bnkAcc.bankName = bank[0].bankName;

      return bnkAcc;
    });
  });

  let data = await db.BankAccounts.aggregate([
    {
      $lookup: {
        from: "banks",
        localField: "bankId",
        foreignField: "_id",
        as: "bankdetail",
      },
    },
  ]);

  // for (let i = 0; i < banksAccounts.length; i++) {
  //     let bank = await db.Banks.findById(banksAccounts[i].bankId);
  //     banksAccounts[i].bankName = bank;
  // }

  return data;
}

async function _delete(id) {
  const banksAccounts = await getBankAccount(id);
  await banksAccounts.remove();
}

async function getBankAccount(id) {
  if (!db.isValidId(id)) throw "Bank account not found";
  const banksAccounts = await db.BankAccounts.findById(id);
  if (!banksAccounts) throw "Bank account not found";
  return banksAccounts;
}
