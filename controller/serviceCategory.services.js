const db = require("../_helpers/db");

const getAll = async () => {
  const categoryData = await db.ServiceCategory.find({});
  return categoryData;
};

const getById = async (id) => {
  const categoryData = await getCategory(id);
  return categoryData;
};

const create = async (params) => {
  const wallet = new db.ServiceCategory(params);
  await wallet.save();
};

const update = async (id, params) => {
  const categoryData = await getCategory(id);
  // copy params to account and save
  Object.assign(categoryData, params);
  return await categoryData.save();
};

const _delete = async (id) => {
  const categoryData = await getCategory(id);
  return await categoryData.remove();
};

const getCategory = async (id) => {
  if (!db.isValidId(id)) throw "Category data not found";
  const categoryData = await db.ServiceCategory.findById(id);
  if (!categoryData) throw "Category data not found";
  return categoryData;
};

module.exports = {
  create,
  update,
  getAll,
  getById,
  delete: _delete,
};
