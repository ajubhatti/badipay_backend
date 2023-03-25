const db = require("../_helpers/db");

const create = async (params) => {
  const cashBack = new db.Cashback(params);
  await cashBack.save();
  return cashBack;
};

const update = async (id, params) => {
  const cashBack = await getCashBack(id);
  Object.assign(cashBack, params);
  cashBack.updated = Date.now();
  await cashBack.save();

  return cashBack;
};

const getById = async (id) => {
  const cashBack = await getCashBack(id);
  return cashBack;
};

const getAll = async () => {
  const cashBacks = await db.Cashback.find();
  return cashBacks;
};

const getAll2 = async (req, res, next) => {
  try {
    const params = req.body;
    const filter = req.body;
    let match = {};
    console.log({ params });

    let searchKeyword = params.search;
    if (searchKeyword) {
      match = {
        $or: [
          { transactionId: { $regex: searchKeyword, $options: "i" } },
          { customerNo: { $regex: searchKeyword, $options: "i" } },
        ],
      };
    }

    const orderByColumn = params.sortBy || "created";
    const orderByDirection = params.orderBy || "desc";
    const sort = {};

    if (orderByColumn && orderByDirection) {
      sort[orderByColumn] = orderByDirection === "desc" ? -1 : 1;
    }

    if (params.status) {
      match.statusOfWalletRequest = params.status;
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

    const total = await db.Cashback.find().countDocuments(match);
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
          from: "accounts",
          localField: "userId",
          foreignField: "_id",
          as: "userDetail",
        },
      },
      { $unwind: "$userDetail" },
      // {
      //   $lookup: {
      //     from: "paymentmodes",
      //     localField: "paymentType",
      //     foreignField: "_id",
      //     as: "paymentMode",
      //   },
      // },
      // { $unwind: "$paymentMode" },

      {
        $lookup: {
          from: "transactions",
          localField: "transactionId",
          foreignField: "_id",
          as: "transactionData",
        },
      },
      { $unwind: "$transactionData" },
    ];

    console.log(JSON.stringify(aggregateRules));

    await db.Cashback.aggregate(aggregateRules).then((result) => {
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
    console.error(error);
    res.status(500).json({
      status: 500,
      message: "Server Error",
      data: error,
    });
  }
};

const _delete = async (id) => {
  const cashBack = await getCashBack(id);
  await cashBack.remove();
};

const getCashBack = async (id) => {
  if (!db.isValidId(id)) throw "cash back not found";
  const cashBack = await db.Cashback.findById(id);
  if (!cashBack) throw "cash back not found";
  return cashBack;
};

module.exports = {
  create,
  update,
  getById,
  getAll,
  getAll2,
  delete: _delete,
};
