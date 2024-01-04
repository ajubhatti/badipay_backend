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
    const aggregateRules = [
      {
        $lookup: {
          from: "apiconfigs",
          localField: "response.apiId",
          foreignField: "apiId",
          as: "apiData",
        },
      },
      { $unwind: { path: "$apiData", preserveNullAndEmptyArrays: true } },
      {
        $sort: { createdAt: -1 },
      },
    ];

    const services = await db.ApiResponse.aggregate(aggregateRules);

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

const getWithPagination = async (req, res, next) => {
  try {
    const params = req.body;
    const filter = req.body;
    let match = {};

    let searchKeyword = params.search;
    if (searchKeyword) {
      match = {
        $or: [{ customerNo: { $regex: searchKeyword, $options: "i" } }],
      };
    }

    if (params.services) {
      match.serviceId = mongoose.Types.ObjectId(params.services);
    }

    if (params.api) {
      match.apiId = mongoose.Types.ObjectId(params.api);
    }

    if (params.status) {
      match.status = params.status;
    }
    if (params.userId) {
      match.userId = mongoose.Types.ObjectId(params.userId);
    }

    const orderByColumn = params.sortBy || "updatedAt";
    const orderByDirection = params.orderBy || "DESC";
    const sort = {};

    if (orderByColumn && orderByDirection) {
      sort[orderByColumn] = orderByDirection == "DESC" ? -1 : 1;
    }

    if (params.startDate && params.endDate) {
      var start = new Date(params.startDate);
      start.setHours(0, 0, 0, 0);

      var end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);

      let updated = {
        $gte: start,
        $lte: end,
      };
      match.updated = updated;
    }

    const total = await db.Recharge.find().countDocuments(match);
    const page = parseInt(params.page) || 1;
    const pageSize = parseInt(params.limits) || 10;
    const skipNo = (page - 1) * pageSize;
    const pages = Math.ceil(total / pageSize);

    const aggregateRules = [
      {
        $sort: sort,
      },
      // { $skip: skipNo },
      // { $limit: params.limits },
      {
        $lookup: {
          from: "accounts",
          localField: "userId",
          foreignField: "_id",
          as: "userDetail",
        },
      },
      { $unwind: "$userDetail" },
      {
        $match: match,
      },
    ];

    const rechargeResult = await db.ApiResponse.aggregate(aggregateRules);

    res.status(200).json({
      status: 200,
      message: CONSTANT_STATUS.SUCCESS,
      data: {
        sort,
        filter,
        count: rechargeResult.length,
        page,
        pages,
        data: rechargeResult,
        total,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: "Server Error",
      data: error,
    });
  }
};

module.exports = {
  create,
  update,
  getById,
  getAll,
  delete: _delete,
  getWithPagination,
};
