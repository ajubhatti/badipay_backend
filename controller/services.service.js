const db = require("../_helpers/db");
const axios = require("axios");

const create = async (params) => {
  let serviceExist = await db.Services.findOne({
    serviceName: params.serviceName,
  });

  if (serviceExist) {
    throw `name ${params.serviceName} is already added`;
  }

  const service = new db.Services(params);
  await service.save();
  return service;
};

const update = async (id, params) => {
  const service = await getService(id);

  if (
    params.name &&
    service.serviceName !== params.name &&
    (await db.Services.findOne({ serviceName: params.name }))
  ) {
    throw `Name ${params.name} is already taken`;
  }

  Object.assign(service, params);
  service.updated = Date.now();
  await service.save();

  return service;
};

const getById = async (id) => {
  const service = await getService(id);
  return service;
};

const getAll = async () => {
  const services = await db.Services.find();
  return services;
};

const _delete = async (id) => {
  const service = await getService(id);
  await service.remove();
};

const getService = async (id) => {
  if (!db.isValidId(id)) throw "Service not found";
  const service = await db.Services.findById(id);
  if (!service) throw "Service not found";
  return service;
};

const getPlan = async (params) => {
  const { operator, tel, offer, apiKey } = params;
  return await axios
    .get(
      `https://www.mplan.in/api/plans.php?apikey=${apiKey}&offer=${offer}&tel=${tel}&operator=${operator}`
    )
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      console.error(err);
    });
};

const ambikaRecharge = async (params) => {
  const {
    userID,
    token,
    consumerNo,
    amount,
    operatorCode,
    uniqueRefNo,
    areaPincode,
    regMobileNumber,
    longitude,
    latitude,
    format,
    optional1,
    optional2,
    optional3,
    optional4,
  } = params;
  return await axios
    .get(
      `http://api.ambikamultiservices.com/API/TransactionAPI?UserID=${userID}&Token=${token}&Account=${consumerNo}&Amount=${amount}&SPKey=${operatorCode}&APIRequestID=${uniqueRefNo}&Optional1=${optional1}&Optional2=${optional2}&Optional3=${optional3}&Optional4=${optional4}&GEOCode=${longitude},${latitude}&CustomerNumber=${regMobileNumber}&Pincode=${areaPincode}&Format=${format}`
    )
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      console.error(err);
    });
};

module.exports = {
  create,
  update,
  getById,
  getAll,
  delete: _delete,
  getPlan,
  ambikaRecharge,
};
