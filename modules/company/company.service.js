const db = require("../../_helpers/db");

const create = async (params) => {
  let companyExist = await db.Company.findOne({
    companyName: params.companyName,
  });

  if (companyExist) {
    throw `name ${params.companyName} is already added`;
  }

  const company = new db.Company(params);
  await company.save();
  return company;
};

const update = async (id, params) => {
  const company = await getCompany(id);

  if (
    params.name &&
    company.companyName !== params.name &&
    (await db.Company.findOne({ companyName: params.name }))
  ) {
    throw `Name ${params.name} is already taken`;
  }

  Object.assign(company, params);
  company.updated = Date.now();
  await company.save();

  return company;
};

const getById = async () => {
  const company = await getCompany(id);
  return company;
};

const getAll = async (params) => {
  try {
    console.log({ params });
    const pageNumber = parseInt(params.page) || 0;
    const limit = parseInt(params.perPage) || 12;
    const result = {};
    const totalPosts = await db.Company.countDocuments().exec();
    let startIndex = pageNumber * limit;
    const endIndex = (pageNumber + 1) * limit;
    result.totalPosts = totalPosts;
    if (startIndex > 0) {
      result.previous = {
        pageNumber: pageNumber - 1,
        limit: limit,
      };
    }
    if (endIndex < (await db.Company.countDocuments().exec())) {
      result.next = {
        pageNumber: pageNumber + 1,
        limit: limit,
      };
    }
    result.data = await db.Company.find()
      .sort("-_id")
      .skip(startIndex)
      .limit(limit)
      .exec();
    result.rowsPerPage = limit;
    return result;
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Sorry, something went wrong" });
  }

  // const company = await db.Company.find().limit(limitValue).skip(skipValue);
  // return company;
};

const _delete = async (id) => {
  const company = await getCompany(id);
  await company.remove();
};

const getCompany = async (id) => {
  if (!db.isValidId(id)) throw "Company not found";
  const company = await db.Company.findById(id);
  if (!company) throw "Company not found";
  return company;
};

module.exports = {
  create,
  update,
  getById,
  getAll,
  delete: _delete,
};
