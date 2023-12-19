const db = require("../_helpers/db");

const create = async (params) => {
  const adminLoyalty = new db.AdminLoyalty(params);
  await adminLoyalty.save();
  return adminLoyalty;
};

const update = async (id, params) => {
  const adminLoyalty = await getAdminLoyalty(id);
  Object.assign(adminLoyalty, params);
  adminLoyalty.updated = Date.now();
  await adminLoyalty.save();

  return adminLoyalty;
};

const getById = async (id) => {
  const adminLoyalty = await getAdminLoyalty(id);
  return adminLoyalty;
};

const getAll = async () => {
  const adminLoyalty = await db.AdminLoyalty.find();
  return adminLoyalty;
};

const getAll2 = async (req, res, next) => {
  try {
    await db.AdminLoyalty.find().then((result) => {
      res.status(200).json({
        status: 200,
        message: "success",
        data: {
          data: result,
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
  const adminLoyalty = await getAdminLoyalty(id);
  await adminLoyalty.remove();
};

const getAdminLoyalty = async (id) => {
  if (!db.isValidId(id)) throw "AdminLoyalty found";
  const adminLoyalty = await db.AdminLoyalty.findById(id);
  if (!adminLoyalty) throw "AdminLoyalty found";
  return adminLoyalty;
};

module.exports = {
  create,
  update,
  getById,
  getAll,
  getAll2,
  delete: _delete,
};
