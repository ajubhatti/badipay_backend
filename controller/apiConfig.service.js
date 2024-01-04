const db = require("../_helpers/db");
const mongoose = require("mongoose");

const create = async (params) => {
  try {
    let apiExist = await db.ApiConfig.findOne({
      apiName: params.apiName,
    });

    if (apiExist) {
      throw `name ${params.apiName} is already added`;
    }

    const apiConfig = new db.ApiConfig(params);
    await apiConfig.save();
    return apiConfig;
  } catch (err) {
    throw err;
  }
};

const update = async (id, params) => {
  try {
    const apiConfig = await getApiConfig(id);
    // if (
    //   params.apiName &&
    //   apiConfig.apiName !== params.apiName &&
    //   (await db.ApiConfig.findOne({ apiName: params.apiName }))
    // ) {
    //   throw `Name ${params.apiName} is already taken`;
    // }

    Object.assign(apiConfig, params);
    apiConfig.updated = Date.now();
    return apiConfig.save();
  } catch (err) {
    throw err;
  }
};

const getById = async (id) => {
  try {
    return await getApiConfig(id);
  } catch (err) {
    throw err;
  }
};

const getAllApiConfigs = async (params) => {
  try {
    const match = {};

    if (params.apis) {
      match.apiId = mongoose.Types.ObjectId(params.apis);
    }
    if (params.category) {
      match.categoryId = mongoose.Types.ObjectId(params.category);
    }
    if (params.service) {
      match.serviceId = mongoose.Types.ObjectId(params.service);
    }
    if (params.operator) {
      match.operatorId = mongoose.Types.ObjectId(params.operator);
    }
    if (params.status) {
      match.isActive = params.status;
    }

    const aggregateRules = [
      {
        $match: match,
      },
      {
        $lookup: {
          from: "apis",
          localField: "apiId",
          foreignField: "_id",
          as: "apiData",
        },
      },
      { $unwind: "$apiData" },
      {
        $lookup: {
          from: "servicecategories",
          localField: "categoryId",
          foreignField: "_id",
          as: "categoryData",
        },
      },
      { $unwind: "$categoryData" },
    ];

    const result = await db.ApiConfig.aggregate(aggregateRules);
    // const services = await db.ApiConfig.find(params);
    return result;
  } catch (err) {
    throw err;
  }
};

const _delete = async (id) => {
  try {
    const apiConfig = await getApiConfig(id);
    await apiConfig.remove();
    // await db.OperatorConfig.deleteMany({ apiId: mongoose.Types.ObjectId(id) });
    // await db.ServiceDiscount.deleteMany({ apiId: mongoose.Types.ObjectId(id) });
    return "success";
  } catch (err) {
    throw err;
  }
};

const getApiConfig = async (id) => {
  try {
    if (!db.isValidId(id)) throw "Api config not found";
    const apiConfig = await db.ApiConfig.findById(id);
    if (!apiConfig) throw "Api config not found";
    return apiConfig;
  } catch (err) {
    throw err;
  }
};

const addApiConfigByScan = async (params) => {
  try {
    const apis = await db.Apis.find();
    const category = await db.ServiceCategory.find();

    if (apis.length && category.length) {
      for (let i = 0; i < apis.length; i++) {
        for (let j = 0; j < category.length; j++) {
          let payload = {
            apiId: apis[i]._id,
            categoryId: category[j]._id,
            isActive: false,
          };

          const configExist = await db.ApiConfig.findOne({
            apiId: apis[i]._id,
            categoryId: category[j]._id,
          });

          if (!configExist) {
            const slab = new db.ApiConfig(payload);
            await slab.save();
          }
        }
      }
    }

    return await db.ApiConfig.find();
  } catch (err) {
    console.error({ err });
    throw err;
  }
};

const updateApiConfigByApiId = async (apiId, params) => {
  const operatorConfigList = await db.ApiConfig.find({
    apiId: apiId,
  });

  for (let i = 0; i < operatorConfigList.length; i++) {
    operatorConfigList[i].isActive = params.isActive;
    await operatorConfigList[i].save();
  }

  return operatorConfigList;
};

module.exports = {
  create,
  update,
  getById,
  getAllApiConfigs,
  delete: _delete,
  addApiConfigByScan,
  updateApiConfigByApiId,
};
