const db = require("../_helpers/db");
const { fetchAllData } = require("../_middleware/fetchingData");
const mongoose = require("mongoose");

const create = async (params) => {
  try {
    console.log({ params });
    if (
      params.apiCode &&
      params.serviceId &&
      params.operatorId &&
      params.serviceApiId
    ) {
      let serviceExist = await db.OperatorConfig.findOne({
        serviceId: params.serviceId,
        operatorId: params.operatorId,
        serviceApiId: params.serviceApiId,
        apiCode: params.apiCode,
      });

      if (!serviceExist) {
        params.slabId = Math.floor(Date.now() / 1000);
        const slab = new db.OperatorConfig(params);

        return await slab.save();
      } else {
        throw "Already added!";
      }
    }
  } catch (err) {
    console.log({ err });
    throw err;
  }
};

const update = async (id, params) => {
  try {
    id = mongoose.Types.ObjectId(id);
    console.log({ id });
    const service = await getService(id);

    console.log({ service });

    Object.assign(service, params);
    service.updated = Date.now();

    return await service.save();
  } catch (err) {
    console.log({ err });
    throw err;
  }
};

const getById = async (id) => {
  try {
    const service = await getService(id);
    return service;
  } catch (err) {
    throw err;
  }
};

const getAll = async (req, res, next) => {
  try {
    const params = req.body;
    return await db.OperatorConfig.find();
  } catch (err) {
    throw err;
  }
};

const _delete = async (params) => {
  try {
    const id = mongoose.Types.ObjectId(params.id);
    console.log({ id });
    const service = await getService(id);

    return await service.remove();
  } catch (err) {
    throw err;
  }
};

const getService = async (id) => {
  if (!db.isValidId(id)) throw "slab not found";
  const service = await db.OperatorConfig.findById(id);
  if (!service) throw "slab not found";
  return service;
};

const getListByType = async (params) => {
  try {
    console.log(params);
    const serviceList = await db.OperatorConfig.find({
      serviceProviderType: params.type,
    });
    return serviceList;
  } catch (err) {
    throw err;
  }
};

const operatorConfigDataPageWise = async (params) => {
  try {
    const filter = params;
    const match = {};

    let searchObj = {};
    let searchKeyword = params.search;
    if (searchKeyword) {
      searchObj = /^(?:\d*\.\d{1,2}|\d+)$/.test(searchKeyword)
        ? {
            $or: [
              { serviceProviderName: searchKeyword },
              { price: searchKeyword },
            ],
          }
        : {
            serviceProviderName: new RegExp(
              `${searchKeyword.toString().trim()}`,
              "i"
            ),
          };
    }

    const sort = {};
    const orderByColumn = params.sortBy || "created";
    const orderByDirection = params.orderBy || "DESC";
    if (orderByColumn && orderByDirection) {
      sort[orderByColumn] = orderByDirection == "DESC" ? -1 : 1;
    }
    if (params.apis) {
      match.serviceApiId = mongoose.Types.ObjectId(params.apis);
    }
    if (params.providerType) {
      match.serviceId = mongoose.Types.ObjectId(params.providerType);
    }
    if (params.operator) {
      match.operatorId = mongoose.Types.ObjectId(params.operator);
    }
    if (params.status) {
      match.isActive = params.status;
    }

    const total = await db.OperatorConfig.find(searchObj).countDocuments(match);

    const page = parseInt(params.page) || 1;
    const pageSize = parseInt(params.limits) || 10;
    const skipNo = (page - 1) * pageSize;
    const pages = Math.ceil(total / pageSize);

    const aggregateRules = [
      {
        $match: match,
      },
      {
        $sort: sort,
      },
      { $skip: skipNo },
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
          from: "services",
          localField: "serviceId",
          foreignField: "_id",
          as: "serviceData",
        },
      },
      { $unwind: "$serviceData" },
      {
        $lookup: {
          from: "operators",
          localField: "operatorId",
          foreignField: "_id",
          as: "operatorData",
        },
      },
      { $unwind: "$operatorData" },
    ];

    if (params.limit) {
      aggregateRules.push({ $limit: params.limits });
    }

    let aggrResult = await db.OperatorConfig.aggregate(aggregateRules);
    let resultData = {
      sort,
      filter,
      count: aggrResult.length,
      page,
      pages,
      data: aggrResult,
      total,
    };

    return resultData;
  } catch (err) {
    console.log({ err });
    throw err;
  }
};

const scanAndAdd = async () => {
  try {
    const apis = await db.Apis.find();
    const operator = await db.Operator.find();

    console.log({ apis, operator });
    if (apis.length && operator.length) {
      let priority = 1;
      for (let i = 0; i < apis.length; i++) {
        for (let j = 0; j < operator.length; j++) {
          let payload = {
            slabId: Math.floor(Date.now() / 1000),
            apiId: apis[i]._id,
            serviceId: operator[j].providerType,
            operatorId: operator[j]._id,
            priority: priority,
          };

          const getOperator = await db.OperatorConfig.findOne({
            apiId: apis[i]._id,
            operatorId: operator[j]._id,
          });

          if (!getOperator) {
            const slab = new db.OperatorConfig(payload);
            await slab.save();
          }
        }
        priority++;
      }
    }

    return await db.OperatorConfig.find();
  } catch (err) {
    console.log({ err });
    throw err;
  }
};

module.exports = {
  create,
  update,
  getById,
  getAll,
  delete: _delete,
  getListByType,
  operatorConfigDataPageWise,
  scanAndAdd,
};
