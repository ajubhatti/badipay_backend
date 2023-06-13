const db = require("../_helpers/db");
const {
  fetchAllData,
  fetchDataById,
  deleteData,
} = require("../_middleware/fetchingData");
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
        let slabData = await slab.save();

        return slabData;
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

    await service.save().then((result) => {
      res
        .status(200)
        .json({ status: 200, data: result, message: "Updated Succesfully." });
    });
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
  } catch (err) {
    throw err;
  }
  const params = req.body;
  params.dataBase = db.OperatorConfig;
  return await fetchAllData(params);
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

const slabListDataPageWise = async (params) => {
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

    console.log({ match });

    const aggregateRules = [
      {
        $match: match,
      },
      {
        $sort: sort,
      },
      { $skip: skipNo },
      { $limit: params.limits },
      {
        $lookup: {
          from: "apis",
          localField: "serviceApiId",
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
          from: "companies",
          localField: "operatorId",
          foreignField: "_id",
          as: "companyData",
        },
      },
      { $unwind: "$companyData" },
    ];

    console.log({ aggregateRules });

    await db.OperatorConfig.aggregate(aggregateRules).then((result) => {
      return {
        sort,
        filter,
        count: result.length,
        page,
        pages,
        data: result,
        total,
      };
    });
  } catch (err) {
    throw err;
  }
};

const scanAndAdd = async () => {
  try {
    const apis = await db.Apis.find();
    const companies = await db.Company.find();

    for (let i = 0; i < apis.length; i++) {
      for (let j = 0; j < companies.length; j++) {
        let payload = {
          slabId: Math.floor(Date.now() / 1000),
          apiId: apis[i]._id,
          serviceId: companies[j].providerType,
          operatorId: companies[j]._id,
        };

        const getOperator = await db.OperatorConfig.findOne({
          apiId: apis[i]._id,
          operatorId: companies[j]._id,
        });

        if (!getOperator) {
          const slab = new db.OperatorConfig(payload);
          let slabData = await slab.save();
        }
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
  slabListDataPageWise,
  scanAndAdd,
};
