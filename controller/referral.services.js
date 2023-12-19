const db = require("../_helpers/db");
const shortid = require("shortid");

const generateReferralCode = async (userId) => {
  var referalData = await db.Referral.findOne({ userId: userId });
  if (referalData) {
    referalData = referalData;
  } else {
    referalData = await saveReferralCodeOfUser(userId);
  }
  return referalData;
};

const saveReferralCodeOfUser = async (userId) => {
  // let code = await referalcodeGenerator();
  let code = Math.floor(10000000 + Math.random() * 90000000);
  let paramsData = {
    referralCode: code,
    userId: userId,
  };

  const referal = new db.Referral(paramsData);
  await referal.save();
  return referal;
};

const referalcodeGenerator = async () => {
  shortid.characters(
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@"
  );
  return await shortid.generate();
};

module.exports = {
  generateReferralCode,
};
