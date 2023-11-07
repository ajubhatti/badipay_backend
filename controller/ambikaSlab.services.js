const db = require("../_helpers/db");
const axios = require("axios");
const { AMBIKA_TOKEN, AMBIKA_USERID } = require("../_helpers/constant");
const {
  fetchGetAllData,
  fetchAllData,
  fetchDataById,
  deleteData,
} = require("../_middleware/fetchingData");

const create = async (params) => {
  let serviceExist = await db.AmbikaSlab.findOne({
    serviceProvider: params.serviceProvider,
    SPKey: params.serviceProvider,
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

const getById = async (params) => {
  // const service = await getService(id);
  // return service;

  params.dataBase = db.AmbikaSlab;
  return await fetchDataById(params);
};

const getAll = async (params) => {
  params.dataBase = db.AmbikaSlab;
  return await fetchAllData(params);
  // const services = await db.AmbikaSlab.find();
  // return services;
};

const _delete = async (id) => {
  const service = await getService(id);
  await service.remove();

  deleteData();
};

const getService = async (id) => {
  if (!db.isValidId(id)) throw "Service not found";
  const service = await db.AmbikaSlab.findById(id);
  if (!service) throw "Service not found";
  return service;
};

const getListByType = async (params) => {
  const serviceList = await db.AmbikaSlab.find({
    serviceProviderType: params.type,
  });
  return serviceList;
};

const ambikaRecharge = async (params) => {
  const {
    amount,
    operatorCode,
    areaPincode,
    regMobileNumber,
    longitude,
    latitude,
    optional1,
    optional2,
    optional3,
    optional4,
  } = params;

  let token = process.env.AMBIKA_TOKEN || AMBIKA_TOKEN;
  let userID = process.env.AMBIKA_USERID || AMBIKA_USERID;
  let cutomerNo = process.env.AMBIKA_CUSTOMERNO || AMBIKA_CUSTOMERNO;
  var timeStamp = Math.round(new Date().getTime() / 1000);

  let serviceUrl = `http://api.ambikamultiservices.com/API/TransactionAPI?UserID=${userID}&Token=${token}&Account=${regMobileNumber}&Amount=${amount}&SPKey=${operatorCode}&ApiRequestID=${timeStamp}&Optional1=${optional1}&Optional2=${optional2}&Optional3=${optional3}&Optional4=${optional4}&GEOCode=${longitude},${latitude}&CustomerNumber=${cutomerNo}&Pincode=${areaPincode}&Format=1`;

  return await axios
    .get(serviceUrl)
    .then((res) => {
      if (res.data.errorcode) {
        RecharegeWaleRecharge(params);
      }
      return res.data;
    })
    .catch((err) => {
      console.error(err);
    });
};

const RecharegeWaleRecharge = async (params) => {
  const { amount, operatorCode, regMobileNumber } = params;

  var timeStamp = Math.round(new Date().getTime() / 1000);

  let mobileNo = 8200717122;
  let apiKey = "QfnXHtK9ehMwULqzwY9PimddkEGksbLKBpr";
  let refNo = timeStamp;
  let reqType = "RECH";
  let serviceCode = operatorCode;
  let customerNo = regMobileNumber;
  let refMobileNo = "";
  let amounts = amount;
  let stv = 0;

  let serviceUrl = `http://www.rechargewaleapi.com/RWARechargeAPI/RechargeAPI.aspx?MobileNo=${mobileNo}&APIKey=${apiKey}&REQTYPE=${reqType}&REFNO=${refNo}&SERCODE=${serviceCode}&CUSTNO=${customerNo}&REFMOBILENO=${refMobileNo}&AMT=${amounts}&STV=${stv}&RESPTYPE=JSON`;

  return await axios
    .get(serviceUrl)
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
  ambikaRecharge,
  getListByType,
};
