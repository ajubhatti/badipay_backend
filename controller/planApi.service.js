const db = require("../_helpers/db");

const create = async (params) => {
  let apiExist = await db.PlanApis.findOne({ stateName: params.stateName });

  if (apiExist) {
    throw `Name ${params.stateName} is already added?`;
  }

  const planApi = new db.PlanApis(params);
  await planApi.save();
  return planApi;
};

const update = async (id, params) => {
  const planApi = await getPlan(id);

  if (
    params.name &&
    planApi.stateName !== params.name &&
    (await db.PlanApis.findOne({ stateName: params.name }))
  ) {
    throw `Name ${params.name} is already taken?`;
  }

  Object.assign(planApi, params);
  planApi.updated = Date.now();
  await planApi.save();

  return planApi;
};

const getById = async (id) => {
  const planApi = await getPlan(id);
  return planApi;
};

const getAll = async () => {
  const planApi = await db.PlanApis.find();
  return planApi;
};

const _delete = async (id) => {
  const planApi = await getPlan(id);
  await planApi.remove();
};

const getPlan = async (id) => {
  if (!db.isValidId(id)) throw "Api not found?";
  const planApi = await db.PlanApis.findById(id);
  if (!planApi) throw "Api not found?";
  return planApi;
};

module.exports = {
  create,
  update,
  getById,
  getAll,
  delete: _delete,
};
