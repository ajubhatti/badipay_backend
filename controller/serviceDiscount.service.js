const { creates, reads, updates, removes } = require("../_middleware/crud");
const db = require("../_helpers/db");

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

module.exports = {
  create,
  update,
  getById,
  getAll,
  getDiscountList,
  _delete,
};
