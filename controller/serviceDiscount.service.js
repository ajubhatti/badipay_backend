const db = require("../_helpers/db");
const mongoose = require("mongoose");

const create = async (params) => {
  const discount = new db.ServiceDiscount(params);
  await discount.save();
  return discount;
};

const getById = async (id) => {
  const discountData = await getDiscount(id);
  return discountData;
};

const getAll = async () => {
  const discountData = await db.ServiceDiscount.find();
  return discountData;
};

const _delete = async (id) => {
  const discountData = await getDiscount(id);
  await discountData.remove();
};

const update = async (id, params) => {
  const discountData = await getDiscount(id);

  Object.assign(discountData, params);
  discountData.updated = Date.now();
  await discountData.save();

  return discountData;
};

const getDiscount = async (id) => {
  try {
    if (!db.isValidId(id)) throw "discount not found";
    const discount = await db.ServiceDiscount.findById(id);
    if (!discount) throw "discount not found";
    return discount;
  } catch (err) {
    throw err;
  }
};

const getDiscountList = async (params) => {
  try {
    const apiData = await db.Apis.findById(params.apiId);

    var companyData = await db.Company.find({
      providerType: params.serviceId,
    });

    var companyData = JSON.parse(JSON.stringify(companyData));

    for (let i = 0; i < companyData.length; i++) {
      const company = companyData[i];
      const disData = await db.ServiceDiscount.findOne({
        operatorId: company._id,
        serviceId: params.serviceId,
        apiId: params.apiId,
      });

      companyData[i].discountData = disData;
      companyData[i].apiData = apiData;
    }

    console.log({ companyData });

    return companyData;
  } catch (err) {
    throw err;
  }
};

const AddbyScan = async () => {
  let opConf = await db.OperatorConfig.find();
  for (let i = 0; i < opConf.length; i++) {
    let getConfig = await db.ServiceDiscount.findOne({
      operatorConfigId: opConf[i]._id,
    });
    console.log({ getConfig });
    if (!getConfig) {
      let payload = {
        apiId: opConf[i].apiId,
        serviceId: opConf[i].serviceId,
        operatorId: opConf[i].operatorId,
        operatorConfigId: opConf[i]._id,
      };
      const discount = new db.ServiceDiscount(payload);
      await discount.save();
    }
  }
  return await db.ServiceDiscount.find();
};

const discountListPageWise = async (params) => {
  try {
    const filter = params;
    const match = {};

    const sort = {};
    const orderByColumn = params.sortBy || "created";
    const orderByDirection = params.orderBy || "DESC";
    if (orderByColumn && orderByDirection) {
      sort[orderByColumn] = orderByDirection == "DESC" ? -1 : 1;
    }
    if (params.apis) {
      match.apiId = mongoose.Types.ObjectId(params.apis);
    }
    if (params.provider) {
      match.serviceId = mongoose.Types.ObjectId(params.provider);
    }
    if (params.operator) {
      match.operatorId = mongoose.Types.ObjectId(params.operator);
    }

    const total = await db.ServiceDiscount.find().countDocuments(match);

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

    console.log({ aggregateRules });

    let aggrResult = await db.ServiceDiscount.aggregate(aggregateRules);
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

module.exports = {
  create,
  update,
  getById,
  getAll,
  getDiscountList,
  _delete,
  AddbyScan,
  discountListPageWise,
};
