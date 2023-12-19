const db = require("../_helpers/db");

const create = async (params) => {
  let supportExist = await db.Support.findOne({ title: params.title });
  if (supportExist) {
    throw `${params.title} is already added`;
  }
  const supportData = new db.Support(params);
  await supportData.save();
  return supportData;
};

const update = async (id, params) => {
  const supportData = await getSupportById(id);

  Object.assign(supportData, params);
  supportData.updated = Date.now();
  await supportData.save();

  return supportData;
};

const getById = async (id) => {
  const supportData = await getSupportById(id);
  return supportData;
};

const getAll = async () => {
  const supportData = await db.Support.find();
  return supportData;
};

const getAllDetail = async () => {
  let rtrnData = await db.Support.aggregate([
    {
      $lookup: {
        from: "subsupports",
        localField: "_id",
        foreignField: "supportId",
        as: "subSupportdetail",
      },
    },
  ]);

  return rtrnData;
};

const deleteById = async (id) => {
  const banksAccounts = await getSupportById(id);
  await banksAccounts.remove();
};

const getSupportById = async (id) => {
  if (!db.isValidId(id)) throw "support not found";
  const supportData = await db.BankAccounts.findById(id);
  if (!supportData) throw "support not found";
  return supportData;
};

module.exports = {
  create,
  update,
  getById,
  getAll,
  deleteById,
  getAllDetail,
};
