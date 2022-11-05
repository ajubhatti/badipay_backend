const db = require("../../_helpers/db");

const create = async (params) => {
  let modeExist = await db.PaymentMode.findOne({ modeName: params.modeName });

  if (modeExist) {
    throw `name ${params.modeName} is already added`;
  }

  const mode = new db.PaymentMode(params);
  await mode.save();
  return mode;
};

const update = async (id, params) => {
  const modes = await getModes(id);

  if (
    params.name &&
    modes.modeName !== params.name &&
    (await db.PaymentMode.findOne({ modeName: params.name }))
  ) {
    throw `Name ${params.name} is already taken`;
  }

  Object.assign(modes, params);
  modes.updated = Date.now();
  await modes.save();

  return modes;
};

const getModeById = async (id) => {
  try {
    const modes = await getModes(id);
    if (!modes) {
      return {};
    }
    return modes;
  } catch (err) {
    return err;
  }
};

const getAll = async () => {
  const modes = await db.PaymentMode.find();
  return modes;
};

const _delete = async (id) => {
  const modes = await getModes(id);
  await modes.remove();
};

const getModes = async (id) => {
  if (!db.isValidId(id)) throw "Mode not found";
  const modes = await db.PaymentMode.findById(id);
  if (!modes) throw "Mode not found";
  return modes;
};

module.exports = {
  create,
  update,
  getModeById,
  getAll,
  delete: _delete,
};
