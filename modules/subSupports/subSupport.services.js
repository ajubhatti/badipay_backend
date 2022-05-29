const db = require("../../_helpers/db");

const create = async (params) => {
  let subSupportExist = await db.SubSupport.findOne({ title: params.title });
  if (subSupportExist) {
    throw `${params.title} is already added`;
  }
  const subSupportData = new db.SubSupport(params);
  await subSupportData.save();
  return subSupportData;
};

const update = async (id, params) => {
  const subSupportData = await getSupportById(id);

  Object.assign(subSupportData, params);
  subSupportData.updated = Date.now();
  await subSupportData.save();

  return subSupportData;
};

const getById = async (id) => {
  const subSupportData = await getSupportById(id);
  return subSupportData;
};

const getAll = async () => {
  const subSupportData = await db.SubSupport.find();
  return subSupportData;
};

const deleteById = async (id) => {
  const banksAccounts = await getSupportById(id);
  await banksAccounts.remove();
};

const getSupportById = async (id) => {
  if (!db.isValidId(id)) throw "support not found";
  const subSupportData = await db.SubSupport.findById(id);
  if (!subSupportData) throw "support not found";
  return subSupportData;
};

module.exports = {
  create,
  update,
  getById,
  getAll,
  deleteById,
};
