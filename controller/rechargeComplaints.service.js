const db = require("../_helpers/db");
const axios = require("axios");
const { CONSTANT_STATUS } = require("../_helpers/constant");

const create = async (params) => {
  const data = new db.RechargeComplaints(params);
  await data.save();
  return data;
};

const update = async (id, params) => {
  const data = await getComplaints(id);
  Object.assign(data, params);
  data.updated = Date.now();
  return await data.save();
};

const getById = async (id) => {
  return await getComplaints(id);
};

const getAll = async () => {
  const aggregateRules = [
    {
      $lookup: {
        from: "recharges",
        localField: "rechargeId",
        foreignField: "_id",
        as: "rechargeDetail",
      },
    },
    { $unwind: "$rechargeDetail" },
    {
      $lookup: {
        from: "transactions",
        localField: "transactionId",
        foreignField: "_id",
        as: "transactionDetail",
      },
    },
    { $unwind: "$transactionDetail" },
  ];

  const rechargeResult = await db.RechargeComplaints.aggregate(aggregateRules);
  return rechargeResult;
};

const _delete = async (id) => {
  const data = await getComplaints(id);
  await data.remove();
};

const getComplaints = async (id) => {
  if (!db.isValidId(id)) throw "Bank not found";
  const data = await db.RechargeComplaints.findById(id);
  if (!data) throw "Data not found";
  return data;
};

const createRechargeComplaints = async (params) => {
  try {
    console.log({ params });
    let apiData = await db.Apis.findById(params.rechargeByApi._id);
    let serviceUrl = apiData.disputeRequestURL;
    console.log({ serviceUrl });

    serviceUrl = serviceUrl.replace("_apikey", apiData.token);
    if (params.rechargeData.REFNO) {
      serviceUrl = serviceUrl.replace(
        "_apirequestid",
        params.rechargeData.REFNO
      );
    }

    if (params.rechargeData.rpid) {
      serviceUrl = serviceUrl.replace(
        "_transactionid",
        params.rechargeData.rpid
      );
    }

    console.log("check status url ---------->>>>>>>>>>>>>", serviceUrl);

    return await axios
      .get(serviceUrl)
      .then(async (res) => {
        if (res.data.STATUSCODE == "0" || res.data.status == "2") {
          console.log("success res ---", res.data);
          let rechargeResult = await db.Recharge.findById(params._id);

          Object.assign(rechargeResult, {
            complaintStatus: CONSTANT_STATUS.PENDING,
          });

          await rechargeResult.save();
          let payload = {
            rechargeId: params._id,
            status: CONSTANT_STATUS.PENDING,
            transactionId: params.transactionData._id,
          };
          await create(payload);
        }
        console.log("res check status data --------", res.data);
        return res.data;
      })
      .catch((err) => {
        return err;
      });
  } catch (err) {
    console.error(err);
    return err;
  }
};

module.exports = {
  create,
  update,
  getById,
  getAll,
  delete: _delete,
  createRechargeComplaints,
};
