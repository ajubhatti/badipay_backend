const db = require("../_helpers/db");
const { addOperatorConfigByScan } = require("./operatorConfig.services");
const mongoose = require("mongoose");

const create = async (params) => {
  try {
    let apiExist = await db.Apis.findOne({
      apiName: params.apiName,
    });

    if (apiExist) {
      throw `name ${params.apiName} is already added`;
    }

    const apiService = new db.Apis(params);
    await apiService.save();
    await addOperatorConfigByScan();
    return apiService;
  } catch (err) {
    throw err;
  }
};

const update = async (id, params) => {
  try {
    const apiService = await getApiService(id);
    if (
      params.apiName &&
      apiService.apiName !== params.apiName &&
      (await db.Apis.findOne({ apiName: params.apiName }))
    ) {
      throw `Name ${params.apiName} is already taken`;
    }

    Object.assign(apiService, params);
    apiService.updated = Date.now();
    await apiService.save();

    return apiService;
  } catch (err) {
    throw err;
  }
};

const getById = async (id) => {
  try {
    const service = await getApiService(id);
    return service;
  } catch (err) {
    throw err;
  }
};

const getAll = async (params) => {
  try {
    const services = await db.Apis.find(params);
    return services;
  } catch (err) {
    throw err;
  }
};

const _delete = async (id) => {
  try {
    const apiService = await getApiService(id);
    await apiService.remove();
    await db.OperatorConfig.deleteMany({ apiId: mongoose.Types.ObjectId(id) });
    await db.ServiceDiscount.deleteMany({ apiId: mongoose.Types.ObjectId(id) });
    return "success";
  } catch (err) {
    throw err;
  }
};

const getApiService = async (id) => {
  try {
    console.log("Getting API Service", id);
    if (!db.isValidId(id)) throw "Service not found";
    const apiService = await db.Apis.findById(id);
    if (!apiService) throw "Service not found";
    return apiService;
  } catch (err) {
    throw err;
  }
};

module.exports = {
  create,
  update,
  getById,
  getAll,
  delete: _delete,
};
