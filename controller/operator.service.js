const db = require("../_helpers/db");
const mongoose = require("mongoose");
const { addOperatorConfigByScan } = require("./operatorConfig.services");

const create = async (params) => {
  try {
    let operatorExist = await db.Operator.findOne({
      operatorName: params.operatorName,
    });
    if (operatorExist) {
      throw `${params.operatorName} is already added`;
    }
    const operator = new db.Operator(params);
    let newOperator = await operator.save();
    await addOperatorConfigByScan();
    return newOperator;
  } catch (err) {
    throw err;
  }
};

const update = async (id, params) => {
  try {
    const operator = await getOperator(id);
    if (
      params.name &&
      operator.operatorName !== params.name &&
      (await db.Operator.findOne({ operatorName: params.name }))
    ) {
      throw `${params.name} is already taken`;
    }
    Object.assign(operator, params);
    operator.updated = Date.now();
    return await operator.save();
  } catch (err) {
    throw err;
  }
};

const getById = async (id) => {
  try {
    return await getOperator(id);
  } catch (err) {
    throw err;
  }
};

const getAll = async (params) => {
  try {
    const filter = params;
    let match = {};

    let searchKeyword = params.search;
    if (searchKeyword) {
      match = {
        $or: [
          { serviceId: { $regex: searchKeyword, $options: "i" } },
          { _id: { $regex: searchKeyword, $options: "i" } },
        ],
      };
    }

    if (params.serviceId) {
      match.providerType = mongoose.Types.ObjectId(params.serviceId);
    }

    const orderByColumn = params.sortBy || "created";
    const orderByDirection = params.orderBy || "DESC";
    const sort = {};

    if (orderByColumn && orderByDirection) {
      sort[orderByColumn] = orderByDirection == "DESC" ? -1 : 1;
    }

    if (params.startDate && params.endDate) {
      var startDate = new Date(params.startDate); // this is the starting date that looks like ISODate("2014-10-03T04:00:00.188Z")

      startDate.setSeconds(0);
      startDate.setHours(0);
      startDate.setMinutes(0);

      var endDate = new Date(params.endDate);

      endDate.setHours(23);
      endDate.setMinutes(59);
      endDate.setSeconds(59);
      let created = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
      match.created = created;
    }

    const total = await db.Recharge.find().countDocuments(match);

    const aggregateRules = [
      {
        $match: match,
      },
      {
        $sort: sort,
      },
      // {
      //   $lookup: {
      //     from: "accounts",
      //     localField: "userId",
      //     foreignField: "_id",
      //     as: "userDetail",
      //   },
      // },
      // { $unwind: "$userDetail" },
    ];

    const result = await db.Operator.aggregate(aggregateRules);

    return {
      sort,
      filter,
      count: result.length,
      data: result,
      total,
    };
  } catch (err) {
    console.error(err);
    throw err;
  }
};

const getOperatorWithPagination = async (params) => {
  try {
    const filter = params;
    let match = {};

    let searchKeyword = params.search;
    // if (searchKeyword) {
    //   match = {
    //     $or: [
    //       { transactionId: { $regex: searchKeyword, $options: "i" } },
    //       { customerNo: { $regex: searchKeyword, $options: "i" } },
    //     ],
    //   };
    // }

    if (params.serviceId) {
      match.providerType = mongoose.Types.ObjectId(params.serviceId);
    }

    const orderByColumn = params.sortBy || "created";
    const orderByDirection = params.orderBy || "DESC";
    const sort = {};

    if (orderByColumn && orderByDirection) {
      sort[orderByColumn] = orderByDirection == "DESC" ? -1 : 1;
    }

    if (params.startDate && params.endDate) {
      var startDate = new Date(params.startDate); // this is the starting date that looks like ISODate("2014-10-03T04:00:00.188Z")

      startDate.setSeconds(0);
      startDate.setHours(0);
      startDate.setMinutes(0);

      var endDate = new Date(params.endDate);

      endDate.setHours(23);
      endDate.setMinutes(59);
      endDate.setSeconds(59);
      let created = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
      match.created = created;
    }

    const total = await db.Recharge.find().countDocuments(match);
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

      // {
      //   $lookup: {
      //     from: "accounts",
      //     localField: "userId",
      //     foreignField: "_id",
      //     as: "userDetail",
      //   },
      // },
      // { $unwind: "$userDetail" },
    ];

    if (params.limits) {
      aggregateRules.push({ $limit: params.limits });
    }

    const result = await db.Operator.aggregate(aggregateRules);

    return {
      sort,
      filter,
      count: result.length,
      page,
      pages,
      data: result,
      total,
    };
  } catch (err) {
    console.error(err);
    throw err;
  }
};

const _delete = async (id) => {
  try {
    const operator = await getOperator(id);
    await operator.remove();
    await db.OperatorConfig.deleteMany({
      operatorId: mongoose.Types.ObjectId(id),
    });
    await db.ServiceDiscount.deleteMany({
      operatorId: mongoose.Types.ObjectId(id),
    });

    return "Success";
  } catch (err) {
    throw err;
  }
};

const getOperator = async (id) => {
  try {
    if (!db.isValidId(id)) throw "Operator not found";
    const operator = await db.Operator.findById(id);
    if (!operator) throw "Operator not found";
    return operator;
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
  getOperatorWithPagination,
};
