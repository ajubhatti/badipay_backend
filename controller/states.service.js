const db = require("../_helpers/db");

const create = async (params) => {
  let stateExist = await db.State.findOne({ stateName: params.stateName });

  if (stateExist) {
    throw `name ${params.stateName} is already added`;
  }

  const states = new db.State(params);
  await states.save();
  return states;
};

const update = async (id, params) => {
  const states = await getState(id);

  if (
    params.name &&
    states.stateName !== params.name &&
    (await db.State.findOne({ stateName: params.name }))
  ) {
    throw `Name ${params.name} is already taken`;
  }

  Object.assign(states, params);
  states.updated = Date.now();
  await states.save();

  return states;
};

const getById = async (id) => {
  const states = await getState(id);
  return states;
};

const getAll = async () => {
  const states = await db.State.find();
  return states;
};

const _delete = async (id) => {
  const states = await getState(id);
  await states.remove();
};

const getState = async (id) => {
  if (!db.isValidId(id)) throw "State not found";
  const states = await db.State.findById(id);
  if (!states) throw "State not found";
  return states;
};

module.exports = {
  create,
  update,
  getById,
  getAll,
  delete: _delete,
};
