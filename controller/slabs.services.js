const db = require("../_helpers/db");
const {
  fetchAllData,
  fetchDataById,
  deleteData,
} = require("../_middleware/fetchingData");
const mongoose = require("mongoose");

const create = async (req, res, next) => {
  try {
    const params = req.body;

    if (
      params.SPKey &&
      params.serviceId &&
      params.operatorId &&
      params.serviceApiId
    ) {
      let serviceExist = await db.Slabs.findOne({
        serviceId: params.serviceId,
        operatorId: params.operatorId,
        serviceApiId: params.serviceApiId,
        SPKey: params.SPKey,
      });

      if (!serviceExist) {
        params.slabId = Math.floor(Date.now() / 1000);
        const slab = new db.Slabs(params);
        let slabData = await slab.save();

        res
          .status(200)
          .json({ status: 200, data: slabData, message: "success" });
      } else {
        res.status(400).json({
          status: 400,
          data: "",
          message: `already added`,
        });
      }
    }
  } catch (err) {
    res.status(500).json({ status: 500, data: err, message: "fail" });
  }
};

const update = async (req, res, next) => {
  try {
    const params = req.params;
    const body = req.body;
    const id = mongoose.Types.ObjectId(params.id);

    const service = await getService(id);

    Object.assign(service, body);
    service.updated = Date.now();

    await service.save().then((result) => {
      res
        .status(200)
        .json({ status: 200, data: result, message: "Updated Succesfully." });
    });
  } catch (err) {
    res.status(500).json({ status: 500, data: "", message: err });
  }
};

const getById = async (req, res, next) => {
  const params = req.body;
  params.dataBase = db.Slabs;
  return await fetchDataById(params);
};

const getAll = async (req, res, next) => {
  const params = req.body;
  params.dataBase = db.Slabs;
  return await fetchAllData(params);
};

const _delete = async (req, res, next) => {
  try {
    const params = req.params;
    const id = mongoose.Types.ObjectId(params.id);

    const service = await getService(id);
    await service.remove();

    await service.remove().then((result) => {
      res
        .status(200)
        .json({ status: 200, data: "", message: "deleted Succesfully." });
    });
  } catch (err) {
    res.status(500).json({ status: 500, data: "", message: err });
  }
};

const getService = async (id) => {
  if (!db.isValidId(id)) throw "slab not found";
  const service = await db.Slabs.findById(id);
  if (!service) throw "slab not found";
  return service;
};

const getListByType = async (params) => {
  const serviceList = await db.Slabs.find({
    serviceProviderType: params.type,
  });
  return serviceList;
};

const slabListDataPageWise = async (req, res, next) => {
  try {
    const params = req.body;
    const filter = req.body;
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

    const total = await db.Slabs.find(searchObj).countDocuments(match);

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

    await db.Slabs.aggregate(aggregateRules).then((result) => {
      res.status(200).json({
        status: 200,
        message: "success",
        data: {
          sort,
          filter,
          count: result.length,
          page,
          pages,
          data: result,
          total,
        },
      });
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
  getListByType,
  slabListDataPageWise,
};
