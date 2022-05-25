const db = require("../../_helpers/db");

const create = async (params) => {
  const contactUsData = new db.ContactUs(params);
  console.log("params", params);
  await contactUsData.save();
  return contactUsData;
};

const update = async (id, params) => {
  const contactUsData = await getBanks(id);

  Object.assign(contactUsData, params);
  contactUsData.updated = Date.now();
  await contactUsData.save();

  return contactUsData;
};

const getById = async (id) => {
  const contactUsData = await getBanks(id);
  return contactUsData;
};

const getAll = async () => {
  const contactUsData = await db.ContactUs.find();
  return contactUsData;
};

const _delete = async (id) => {
  const contactUsData = await getBanks(id);
  await contactUsData.remove();
};

const getBanks = async (id) => {
  if (!db.isValidId(id)) throw "Bank not found";
  const contactUsData = await db.ContactUs.findById(id);
  if (!contactUsData) throw "Bank not found";
  return contactUsData;
};

module.exports = {
  create,
  update,
  getById,
  getAll,
  delete: _delete,
};
