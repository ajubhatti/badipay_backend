const db = require("../../_helpers/db");

const create = async (params) => {
  let bankExist = await db.Banks.findOne({ bankName: params.bankName });

  if (bankExist) {
    throw `name ${params.bankName} is already added`;
  }

  const banks = new db.Banks(params);
  await banks.save();
  return banks;
};

const update = async (id, params) => {
  const banks = await getBanks(id);

  if (
    params.name &&
    banks.bankName !== params.name &&
    (await db.Banks.findOne({ bankName: params.name }))
  ) {
    throw `Name ${params.name} is already taken`;
  }

  Object.assign(banks, params);
  banks.updated = Date.now();
  await banks.save();

  return banks;
};

const getBankById = async (id) => {
  const banks = await getBanks(id);
  return banks;
};

const getAll = async () => {
  const banks = await db.Banks.find();
  return banks;
};

const _delete = async (id) => {
  const banks = await getBanks(id);
  await banks.remove();
};

const getBanks = async (id) => {
  if (!db.isValidId(id)) throw "Bank not found";
  const banks = await db.Banks.findById(id);
  if (!banks) throw "Bank not found";
  return banks;
};

module.exports = {
  create,
  update,
  getBankById,
  getAll,
  delete: _delete,
};
