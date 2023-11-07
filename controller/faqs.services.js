const db = require("../_helpers/db");

const create = async (params) => {
  let supportExist = await db.Faqs.findOne({ title: params.title });
  if (supportExist) {
    throw `${params.title} is already added`;
  }
  const faqData = new db.Faqs(params);
  await faqData.save();
  return faqData;
};

const update = async (id, params) => {
  const faqData = await getFaqById(id);

  Object.assign(faqData, params);
  faqData.updated = Date.now();
  await faqData.save();

  return faqData;
};

const getById = async (id) => {
  const faqData = await getFaqById(id);
  return faqData;
};

const getAll = async () => {
  const faqData = await db.Faqs.find();
  return faqData;
};

const getAllDetail = async () => {
  let rtrnData = await db.Faqs.aggregate([
    {
      $lookup: {
        from: "SubSupports",
        localField: "_id",
        foreignField: "supportId",
        as: "subSupportdetail",
      },
    },
  ]);

  return rtrnData;
};

const deleteById = async (id) => {
  const faqData = await getFaqById(id);
  await faqData.remove();
};

const getFaqById = async (id) => {
  if (!db.isValidId(id)) throw "faq not found";
  const faqData = await db.Faqs.findById(id);
  if (!faqData) throw "faq not found";
  return faqData;
};

module.exports = {
  create,
  update,
  getById,
  getAll,
  deleteById,
  getAllDetail,
};
