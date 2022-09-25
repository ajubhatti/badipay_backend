const db = require("../../_helpers/db");

const create = async (params) => {
  console.log({ params });
  const rechargeData = new db.Recharge(params);
  await rechargeData.save();
  return rechargeData;
};

const update = async (id, params) => {
  const rechargeData = await getState(id);

  Object.assign(rechargeData, params);
  rechargeData.updated = Date.now();
  await rechargeData.save();

  return rechargeData;
};

const getById = async (id) => {
  const rechargeData = await getState(id);
  return rechargeData;
};

const getAll = async () => {
  const rechargeData = await db.Recharge.find();
  return rechargeData;
};

const _delete = async (id) => {
  const rechargeData = await getState(id);
  await rechargeData.remove();
};

const getState = async (id) => {
  if (!db.isValidId(id)) throw "Recharge not found";
  const rechargeData = await db.Recharge.findById(id);
  if (!rechargeData) throw "Recharge not found";
  return rechargeData;
};

module.exports = {
  create,
  update,
  getById,
  getAll,
  delete: _delete,
};
