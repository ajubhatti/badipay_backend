const db = require("../../_helpers/db");
const axios = require("axios");

var priorityCount = 1;

const create = async (params) => {
  let operator = await getOperatorById(params);
  if (operator) {
    let filteredOperator = await priorityCheck(operator, priorityCount);
    if (!filteredOperator) {
      priorityCount++;
      filteredOperator = await priorityCheck(operator, priorityCount);
    } else {
      let payload = {
        amount: params.amount,
        operatorCode: filteredOperator.apiCode,
        regMobileNumber: params.mobileNo,
      };
      let res = await doRecharge(filteredOperator.apiName, payload);
      if (res && res.errorcode != 200) {
        priorityCount++;
        await recursiveFunction(params, operator);
      }
      const rechargeData = new db.Recharge(params);
      await rechargeData.save();
      return rechargeData;
    }
  }
};

const create2 = async (params) => {
  try {
    let operator = await getOperatorById(params);
    console.log("params----", params, operator);
    if (operator) {
      let priority = 1;
      let finalRechargeData = await recursiveFunction(
        params,
        operator,
        priority
      );
      console.log("finalrechargeData -------", finalRechargeData);

      if (
        (finalRechargeData && finalRechargeData.TRNSTATUS == 0) ||
        finalRechargeData.STATUSCODE == 0 ||
        finalRechargeData.errorcode == 200
      ) {
        params.status = "success";
      }

      params.customerNo = params.mobileNo;
      params.responseData = finalRechargeData;
      params.rechargeBy = finalRechargeData.rechargeBy;

      console.log("finalrechargeData -------", params);

      const rechargeData = new db.Recharge(params);
      await rechargeData.save();
      return rechargeData;
    }
  } catch (err) {
    return err;
  }
};

const recursiveFunction = async (params, operator, apiPriority) => {
  try {
    console.log("recursive function-------", apiPriority);
    let filteredOperator = await priorityCheck(operator, apiPriority);
    if (!filteredOperator) {
      apiPriority++;
      filteredOperator = await priorityCheck(operator, apiPriority);
    } else {
      let payload = {
        amount: params.amount,
        operatorCode: filteredOperator.apiCode,
        regMobileNumber: params.mobileNo,
      };

      let rechargeData = await doRecharge(filteredOperator.apiName, payload);
      rechargeData.rechargeBy = operator;
      console.log("-----------------------------------------------");
      console.log("recharge data", rechargeData);
      if (
        (rechargeData && rechargeData.TRNSTATUS == 0) ||
        rechargeData.STATUSCODE == 0 ||
        rechargeData.errorcode == 200
      ) {
        console.log("rechargeData ----68----" + JSON.stringify(rechargeData));
        return rechargeData;
      } else {
        console.log(
          "recursiveFunction",
          params,
          typeof apiPriority,
          apiPriority++
        );
        let result = await recursiveFunction(params, operator, apiPriority++);
        // result.rechargeBy = operator;
        return result;
      }
    }
  } catch (err) {}
};

const priorityCheck = async (operator, priority) => {
  console.log("priority check", priority);
  return operator.referenceApis.find(
    (x) => x.priority && x.priority == priority && x.isActive
  );
};

const doRecharge = async (apiName, payload) => {
  console.log("apiName ----", apiName);
  if (apiName == "RechargeWale") {
    let rechargeWaleRes = await RecharegeWaleRecharge(payload);
    console.log({ rechargeWaleRes });

    if (rechargeWaleRes.errorcode != 200) {
      return rechargeWaleRes;
    } else {
      return rechargeWaleRes;
    }
  }

  if (apiName == "Ambika") {
    let ambikaRes = await ambikaRecharge(payload);
    console.log({ ambikaRes });

    if (ambikaRes.errorcode != 200) {
      return ambikaRes;
    } else {
      return ambikaRes;
    }
  }
};

const ambikaRecharge = async (params) => {
  const { amount, operatorCode, regMobileNumber } = params;

  let longitude = 72.8399872;
  let latitude = 21.1910656;
  let areaPincode = 395002;
  let optional1 = "";
  let optional2 = "";
  let optional3 = "";
  let optional4 = "";
  let AMBIKA_TOKEN = "759f6d09ef62ec7c86da53e986151519";
  let AMBIKA_USERID = 16900;
  let AMBIKA_CUSTOMERNO = 7227062486;

  let token = process.env.AMBIKA_TOKEN || AMBIKA_TOKEN;
  let userID = process.env.AMBIKA_USERID || AMBIKA_USERID;
  let cutomerNo = process.env.AMBIKA_CUSTOMERNO || AMBIKA_CUSTOMERNO;
  var timeStamp = Math.round(new Date().getTime() / 1000);

  let serviceUrl = `http://api.ambikamultiservices.com/API/TransactionAPI?UserID=${userID}&Token=${token}&Account=${regMobileNumber}&Amount=${amount}&SPKey=${operatorCode}&ApiRequestID=${timeStamp}&Optional1=${optional1}&Optional2=${optional2}&Optional3=${optional3}&Optional4=${optional4}&GEOCode=${longitude},${latitude}&CustomerNumber=${cutomerNo}&Pincode=${areaPincode}&Format=1`;
  console.log({ serviceUrl });

  return await axios
    .get(serviceUrl)
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      console.log({ err });
      console.error(err);
      return err;
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
  console.log({ serviceUrl });

  return await axios
    .get(serviceUrl)
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      console.log({ err });
      console.error(err);
    });
};

const getOperatorById = async (params) => {
  return await db.Company.findOne({ _id: params.operator });
};

const update = async (id, params) => {
  const rechargeData = await getState(id);

  Object.assign(rechargeData, params);
  rechargeData.updated = Date.now();
  await rechargeData.save();

  return rechargeData;
};

const getById = async (id) => {
  const rechargeData = await getState(id);
  return rechargeData;
};

const getAll = async () => {
  const rechargeData = await db.Recharge.find();
  return rechargeData;
};

const _delete = async (id) => {
  const rechargeData = await getState(id);
  await rechargeData.remove();
};

const getState = async (id) => {
  if (!db.isValidId(id)) throw "Recharge not found";
  const rechargeData = await db.Recharge.findById(id);
  if (!rechargeData) throw "Recharge not found";
  return rechargeData;
};

module.exports = {
  create,
  create2,
  update,
  getById,
  getAll,
  delete: _delete,
};
