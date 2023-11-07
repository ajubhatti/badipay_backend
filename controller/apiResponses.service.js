const db = require("../_helpers/db");
const {
  addOperatorConfigByScan,
  updateConfigByApiId,
} = require("./operatorConfig.services");

const create = async (params) => {
  try {
    let apiExist = await db.ApiResponse.findOne({
      apiName: params.apiName,
    });

    if (apiExist) {
      throw `name ${params.apiName} is already added`;
    }

    const apiService = new db.ApiResponse(params);
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
      (await db.ApiResponse.findOne({ apiName: params.apiName }))
    ) {
      throw `Name ${params.apiName} is already taken`;
    }

    Object.assign(apiService, params);
    apiService.updated = Date.now();
    await apiService.save();

    await updateConfigByApiId(id, params);
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
    // const aggregateRules = [
    //   {
    //     $lookup: {
    //       from: "accounts",
    //       localField: "userId",
    //       foreignField: "_id",
    //       as: "userDetail",
    //     },
    //   },
    //   { $unwind: "$userDetail" },
    // ];

    // const services = await db.ApiResponse.aggregate(aggregateRules);
    const services = await db.ApiResponse.find(params);
    return services;
  } catch (err) {
    throw err;
  }
};

const _delete = async (id) => {
  try {
    const apiService = await getApiService(id);
    await apiService.remove();
    return "success";
  } catch (err) {
    throw err;
  }
};

const getApiService = async (id) => {
  try {
    if (!db.isValidId(id)) throw "Service not found";
    const apiService = await db.ApiResponse.findById(id);
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
