const db = require("../_helpers/db");
const accountsService = require("../controller/accounts.service");
const walletTransaction = require("../controller/walletTransaction.service");

const getAll = async () => {
  const utilityData = await db.Utility.find({});
  return utilityData;
};

const getById = async (id) => {
  const utilityData = await getUtility(id);
  return utilityData;
};

const create = async (params) => {
  const wallet = new db.Utility(params);
  await wallet.save();
};

const update = async (id, params) => {
  const utilityData = await getUtility(id);
  // copy params to account and save
  Object.assign(utilityData, params);
  return await utilityData.save();
};

const _delete = async (id) => {
  const utility = await getUtility(id);
  return await utility.remove();
};

const getUtility = async (id) => {
  if (!db.isValidId(id)) throw "utility not found";
  const utilityData = await db.Utility.findById(id);
  if (!utilityData) throw "utility not found";
  return utilityData;
};

module.exports = {
  create,
  update,
  getAll,
  getById,
  delete: _delete,
};
