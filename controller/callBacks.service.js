const db = require("../_helpers/db");

const create = async (params) => {
  const data = new db.CallBack(params);
  await data.save();
  return data;
};

const update = async (id, params) => {
  const data = await getCallbacks(id);
  Object.assign(data, params);
  data.updated = Date.now();
  return await data.save();
};

const getById = async (id) => {
  return await getCallbacks(id);
};

const getAll = async () => {
  return await db.CallBack.find({}).sort({ createdAt: -1 });
};

const _delete = async (id) => {
  const data = await getCallbacks(id);
  await data.remove();
};

const getCallbacks = async (id) => {
  if (!db.isValidId(id)) throw "Bank not found";  
  const data = await db.CallBack.findById(id);
  if (!data) throw "call back data not found";
  return data;
};

module.exports = {
  create,
  update,
  getById,
  getAll,
  delete: _delete,
};
