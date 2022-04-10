const db = require("../../_helpers/db");

module.exports = {
  create,
  update,
  getById,
  getAll,
  delete: _delete,
};

async function create(params) {
  const ticker = new db.Ticker(params);
  await ticker.save();
  return ticker;
}

async function update(id, params) {
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
}

async function getById(id) {
  const ticker = await getTicker(id);
  return ticker;
}

async function getAll() {
  const ticker = await db.Ticker.find();
  return ticker;
}

async function _delete(id) {
  const ticker = await getTicker(id);
  await ticker.remove();
}

async function getTicker(id) {
  if (!db.isValidId(id)) throw "ticker not found";
  const ticker = await db.Ticker.findById(id);
  if (!ticker) throw "ticker not found";
  return ticker;
}
