const db = require("../../_helpers/db");
const axios = require("axios");

const create = async (params) => {
  let serviceExist = await db.AmbikaSlab.findOne({
    serviceProvider: params.serviceProvider,
  });

  if (serviceExist) {
    throw `name ${params.serviceProvider} is already added`;
  }

  const service = new db.AmbikaSlab(params);
  await service.save();
  return service;
};

const update = async (id, params) => {
  const service = await getService(id);
  if (
    params.serviceProvider &&
    service.serviceProvider !== params.serviceProvider &&
    (await db.AmbikaSlab.findOne({ serviceProvider: params.serviceProvider }))
  ) {
    throw `Name ${params.serviceProvider} is already taken`;
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
  const services = await db.AmbikaSlab.find();
  return services;
};

const _delete = async (id) => {
  const service = await getService(id);
  await service.remove();
};

const getService = async (id) => {
  if (!db.isValidId(id)) throw "Service not found";
  const service = await db.AmbikaSlab.findById(id);
  if (!service) throw "Service not found";
  return service;
};

const getListByType = async (params) => {
  console.log(params);
  const serviceList = await db.AmbikaSlab.find({
    serviceProviderType: params.type,
  });
  return serviceList;
};

const ambikaRecharge = async (params) => {
  console.log("params", params);
  // const {
  //   userID,
  //   token,
  //   consumerNo,
  //   amount,
  //   operatorCode,
  //   uniqueRefNo,
  //   areaPincode,
  //   regMobileNumber,
  //   longitude,
  //   latitude,
  //   format,
  //   optional1,
  //   optional2,
  //   optional3,
  //   optional4,
  // } = params;

  let userID = 16900;
  let token = "759f6d09ef62ec7c86da53e986151519";
  let consumerNo = "7227062486";
  let amount = 21;
  let operatorCode = 116;
  let uniqueRefNo = 32043443023;
  let areaPincode = 395002;
  let regMobileNumber = 9033501636;
  let longitude = 72.8399;
  let latitude = 21.1877;
  let format = 1;
  let optional1 = "";
  let optional2 = "";
  let optional3 = "";
  let optional4 = "";
  return await axios
    .get(
      `http://api.ambikamultiservices.com/API/TransactionAPI?UserID=${userID}&Token=${token}&Account=${consumerNo}&Amount=${amount}&SPKey=${operatorCode}&ApiRequestID=${uniqueRefNo}&Optional1=${optional1}&Optional2=${optional2}&Optional3=${optional3}&Optional4=${optional4}&GEOCode=${longitude},${latitude}&CustomerNumber=${regMobileNumber}&Pincode=${areaPincode}&Format=${format}`
    )
    .then((res) => {
      console.log(`Status: ${res}`);
      console.log("Body: ", res.data);
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
  ambikaRecharge,
  getListByType,
};
