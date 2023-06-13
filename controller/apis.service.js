const db = require("../_helpers/db");
const axios = require("axios");
const {
  fetchGetAllData,
  fetchAllData,
  fetchDataById,
  deleteData,
} = require("../_middleware/fetchingData");
const { scanAndAdd } = require("./operatorSlabs.services");

const create = async (params) => {
  let apiExist = await db.Apis.findOne({
    apiName: params.apiName,
  });

  if (apiExist) {
    throw `name ${params.apiName} is already added`;
  }

  const apiService = new db.Apis(params);
  await apiService.save();
  await scanAndAdd();
  return apiService;
};

const update = async (id, params) => {
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
};

const getById = async (id) => {
  const service = await getApiService(id);
  return service;
  // console.log("getById", params.id);
  // params.dataBase = db.Apis;
  // return await fetchDataById(params);
};

const getAll = async (params) => {
  params.dataBase = db.Apis;
  console.log({ params });
  return await fetchAllData(params);
  // const services = await db.Apis.find();
  // return services;
};

const _delete = async (id) => {
  const apiService = await getApiService(id);
  await apiService.remove();

  deleteData();
};

const getApiService = async (id) => {
  console.log("Getting API Service", id);
  if (!db.isValidId(id)) throw "Service not found";
  const apiService = await db.Apis.findById(id);
  if (!apiService) throw "Service not found";
  return apiService;
};

module.exports = {
  create,
  update,
  getById,
  getAll,
  delete: _delete,
};
