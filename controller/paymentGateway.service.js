const db = require("../_helpers/db");
const { addOperatorConfigByScan } = require("./operatorConfig.services");

const create = async (params) => {
  try {
    let exist = await db.PaymentGateway.findOne({
      name: params.name,
    });

    if (exist) {
      throw `name ${params.name} is already added`;
    }

    const paymentGatewayService = new db.PaymentGateway(params);
    return await paymentGatewayService.save();
  } catch (err) {
    throw err;
  }
};

const update = async (id, params) => {
  try {
    const paymentGatewayService = await getApiService(id);
    if (
      params.name &&
      paymentGatewayService.name !== params.name &&
      (await db.PaymentGateway.findOne({ name: params.name }))
    ) {
      throw `Name ${params.name} is already taken`;
    }

    Object.assign(paymentGatewayService, params);
    paymentGatewayService.updated = Date.now();
    return await paymentGatewayService.save();
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
    const services = await db.PaymentGateway.find(params);
    return services;
  } catch (err) {
    throw err;
  }
};

const _delete = async (id) => {
  try {
    const paymentGatewayService = await getApiService(id);
    await paymentGatewayService.remove();
    return "success";
  } catch (err) {
    throw err;
  }
};

const getApiService = async (id) => {
  try {
    if (!db.isValidId(id)) throw "Service not found";
    const paymentGatewayService = await db.PaymentGateway.findById(id);
    if (!paymentGatewayService) throw "Service not found";
    return paymentGatewayService;
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
};
