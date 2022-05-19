const db = require("../../_helpers/db");

const create = async (params) => {
  let serviceExist = await db.Services.findOne({
    serviceName: params.serviceName,
  });

  if (serviceExist) {
    throw `name ${params.serviceName} is already added`;
  }

  const service = new db.Services(params);
  await service.save();
  return service;
};

const update = async (id, params) => {
  const service = await getService(id);

  if (
    params.name &&
    service.serviceName !== params.name &&
    (await db.Services.findOne({ serviceName: params.name }))
  ) {
    throw `Name ${params.name} is already taken`;
  }

  Object.assign(service, params);
  service.updated = Date.now();
  await service.save();

  return service;
};

const getById = async (id) => {
  const service = await getService(id);
  return service;
};

const getAll = async () => {
  const services = await db.Services.find();
  return services;
};

const _delete = async (id) => {
  const service = await getService(id);
  await service.remove();
};

const getService = async (id) => {
  if (!db.isValidId(id)) throw "Service not found";
  const service = await db.Services.findById(id);
  if (!service) throw "Service not found";
  return service;
};

module.exports = {
  create,
  update,
  getById,
  getAll,
  delete: _delete,
};
