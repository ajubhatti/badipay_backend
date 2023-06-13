const { mplanApiKey } = require("../_helpers/constant");
const axios = require("axios");

const getMlanUrl = (params) => {
  switch (params.type) {
    case "roffer":
      return `https://www.mplan.in/api/plans.php?apikey=${mplanApiKey}&offer=roffer&tel=${params.accountNo}&operator=${params.operator}`;
    case "viewPlan":
      return `https://www.mplan.in/api/plans.php?apikey=${mplanApiKey}&cricle=${params.circle}&operator=${params.operator}`;
    case "dthInfo":
      return `https://www.mplan.in/api/Dthinfo.php?apikey=${mplanApiKey}&offer=roffer&tel=${params.accountNo}&operator=${params.operator}`;
    case "dthplans":
      return `https://www.mplan.in/api/dthplans.php?apikey=${mplanApiKey}&operator=${params.operator}`;
    case "dthRoffer":
      return `https://www.mplan.in/api/DthRoffer.php?apikey=${mplanApiKey}&offer=roffer&tel=${params.accountNo}&operator=${params.operator}`;
    case "postpaid":
      return `https://www.mplan.in/api/Bsnl.php?apikey=${mplanApiKey}&offer=roffer&tel=${params.accountNo}&operator=${params.operator}&stdcode=${params.stdcode}`;
    case "electricinfo":
      return `https://www.mplan.in/api/electricinfo.php?apikey=${mplanApiKey}&offer=roffer&tel=${params.accountNo}&operator=${params.operator}`;
    case "operatorinfo":
      return `http://operatorcheck.mplan.in/api/operatorinfo.php?apikey=${mplanApiKey}&tel=${params.accountNo}`;
    case "dthoperatorinfo":
      return `http://operatorcheck.mplan.in/api/dthoperatorinfo.php?apikey=${mplanApiKey}&tel=${params.accountNo}`;
    default:
      return "";
  }
};

const getMplanPlan = async (params) => {
  try {
    let type = params.type ? params.type : "viewPlan";
    console.log({ type });

    const url = await getMlanUrl(params);

    console.log("url ---", url);

    return await axios
      .get(url)
      .then((res) => {
        console.log(`Status: ${res}`);
        console.log("Body: ", res.data);
        return res.data;
      })
      .catch((err) => {
        console.error(err);
        throw err;
      });
  } catch (err) {
    throw err;
  }
};

module.exports = {
  getMplanPlan,
};
