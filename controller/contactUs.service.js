const db = require("../_helpers/db");

const create = async (params) => {
  const contactUsData = new db.ContactUs(params);

  await contactUsData.save();
  return contactUsData;
};

const update = async (id, params) => {
  const contactUsData = await getBanks(id);

  Object.assign(contactUsData, params);
  contactUsData.updated = Date.now();
  await contactUsData.save();

  return contactUsData;
};

const getById = async (id) => {
  const contactUsData = await getBanks(id);
  return contactUsData;
};

const getAll = async () => {
  const contactUsData = await db.ContactUs.find();
  return contactUsData;
};

const _delete = async (id) => {
  const contactUsData = await getBanks(id);
  await contactUsData.remove();
};

const getBanks = async (id) => {
  if (!db.isValidId(id)) throw "Bank not found";
  const contactUsData = await db.ContactUs.findById(id);
  if (!contactUsData) throw "Bank not found";
  return contactUsData;
};

const getWithPagination = async (params) => {
  try {
    const filter = params;
    const match = {};

    let searchObj = {};
    if (params.search) {
      let searchKeyword = params.search;
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

    if (params.status) {
      match.isActive = params.status;
    }

    const total = await db.ContactUs.find(searchObj).countDocuments(match);

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
    ];

    if (params.limits) {
      aggregateRules.push({ $limit: params.limits });
    }

    let aggrResult = await db.ContactUs.aggregate(aggregateRules);
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
    console.error({ err });
    throw err;
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
