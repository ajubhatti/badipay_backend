const { mplanApiKey } = require("../../_helpers/constant");
const axios = require("axios");

const getMplanPlan = async (params) => {
  let url = "";
  let type = params.type ? params.type : "allOffer";
  console.log({ type });

  if (type === "roffer") {
    url = `https://www.mplan.in/api/plans.php?apikey=${mplanApiKey}&offer=roffer&tel=${params.phone}&operator=${params.operator}`;
  }
  if (type === "allOffer") {
    url = `https://www.mplan.in/api/plans.php?apikey=${mplanApiKey}&cricle=${params.circle}&operator=${params.operator}`;
  }
  if (type === "dthInfo") {
    url = `https://www.mplan.in/api/Dthinfo.php?apikey=${mplanApiKey}&offer=roffer&tel=${params.accountNo}&operator=${params.operator}`;
  }
  if (type === "dthplans") {
    url = `https://www.mplan.in/api/dthplans.php?apikey=${mplanApiKey}&operator=${params.oeprator}`;
  }
  if (type === "dthRoffer") {
    url = `https://www.mplan.in/api/DthRoffer.php?apikey=${mplanApiKey}&offer=roffer&tel=${params.accountNo}&operator=${params.operator}`;
  }
  if (type === "postpaid") {
    url = `https://www.mplan.in/api/Bsnl.php?apikey=${mplanApiKey}&offer=roffer&tel=${params.accountNo}&operator=${params.oeprator}&stdcode=${params.stdcode}`;
  }
  if (type === "electricinfo") {
    url = `https://www.mplan.in/api/electricinfo.php?apikey=${mplanApiKey}&offer=roffer&tel=${params.accountNo}&operator=${params.oeprator}`;
  }
  if (type === "operatorinfo") {
    url = `http://operatorcheck.mplan.in/api/operatorinfo.php?apikey=${mplanApiKey}&tel=${params.accountNo}`;
  }
  if (type === "dthoperatorinfo") {
    url = `http://operatorcheck.mplan.in/api/dthoperatorinfo.php?apikey=${mplanApiKey}&tel=${params.accountNo}`;
  }

  console.log("url ---", url);
  //   return url;
  return await axios
    .get(url)
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
  getMplanPlan,
};
