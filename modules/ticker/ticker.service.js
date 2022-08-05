const db = require("../../_helpers/db");

const create = async (params) => {
  const ticker = new db.Ticker(params);
  await ticker.save();
  return ticker;
};

const update = async (id, params) => {
  const ticker = await getTicker(id);

  if (
    params.name &&
    ticker.description !== params.name &&
    (await db.Ticker.findOne({ description: params.name }))
  ) {
    throw `Name ${params.name} is already taken`;
  }

  Object.assign(ticker, params);
  ticker.updated = Date.now();
  await ticker.save();

  return ticker;
};

const getById = async (id) => {
  const ticker = await getTicker(id);
  return ticker;
};

const getAll = async () => {
  const ticker = await db.Ticker.find();
  return ticker;
};

const _delete = async (id) => {
  const ticker = await getTicker(id);
  await ticker.remove();
};

const getTicker = async (id) => {
  if (!db.isValidId(id)) throw "ticker not found";
  const ticker = await db.Ticker.findById(id);
  if (!ticker) throw "ticker not found";
  return ticker;
};

module.exports = {
  create,
  update,
  getById,
  getAll,
  delete: _delete,
};
