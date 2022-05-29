const db = require("../../_helpers/db");

const create = async (params) => {
  let subFaqsExist = await db.SubFaqs.findOne({ title: params.title });
  if (subFaqsExist) {
    throw `${params.title} is already added`;
  }
  const subFaqData = new db.SubFaqs(params);
  await subFaqData.save();
  return subFaqData;
};

const update = async (id, params) => {
  const subFaqData = await getSubFaqById(id);

  Object.assign(subFaqData, params);
  subFaqData.updated = Date.now();
  await subFaqData.save();

  return subFaqData;
};

const getById = async (id) => {
  const subFaqData = await getSubFaqById(id);
  return subFaqData;
};

const getAll = async () => {
  const subFaqData = await db.SubFaqs.find();
  return subFaqData;
};

const deleteById = async (id) => {
  const banksAccounts = await getSubFaqById(id);
  await banksAccounts.remove();
};

const getSubFaqById = async (id) => {
  if (!db.isValidId(id)) throw "sub faq not found";
  const subFaqData = await db.SubFaqs.findById(id);
  if (!subFaqData) throw "sub faq not found";
  return subFaqData;
};

module.exports = {
  create,
  update,
  getById,
  getAll,
  deleteById,
};
