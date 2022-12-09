const config = require("../config.json");
const mongoose = require("mongoose");

const connectionOptions = { useNewUrlParser: true, useUnifiedTopology: true };

let DB_RETRIES = 0; // global variable that counts retry attempts
const connectWithRetry = () => {
  return mongoose
    .connect(process.env.DB_URL || config.connectionString1, connectionOptions)
    .then((m) => {
      console.log("Mongo DB Connected");
    })
    .catch((err) => {
      // little trick to retry connection  every 2^n secords. i.e.  2,4,8, 16, 32, 64 ...
      DB_RETRIES++;
      let retrytime = Math.pow(2, DB_RETRIES) * 1000;
      console.error(
        "Mongo DB failed to connect on startup - retrying in " +
          retrytime / 1000 +
          " sec.",
        err.stack
      );
      setTimeout(connectWithRetry, retrytime);
    });
};

connectWithRetry();

mongoose.Promise = global.Promise;

const isValidId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

module.exports = {
  Account: require("../models/accounts"),
  RefreshToken: require("../models/refresh-token"),
  Services: require("../models/services"),
  Company: require("../models/company"),
  AmbikaSlab: require("../models/ambikaSlab"),
  Wallet: require("../models/wallet"),
  WalletTransaction: require("../models/walletTransaction"),
  Banks: require("../models/banks"),
  BankAccounts: require("../models/bankAccounts"),
  Banners: require("../models/banners"),
  Ticker: require("../models/ticker"),
  Referral: require("../models/referral"),
  ContactUs: require("../models/contactUs"),
  Support: require("../models/support"),
  SubSupport: require("../models/subSupport"),
  Faqs: require("../models/faqs"),
  SubFaqs: require("../models/subFaqs"),
  MyBanner: require("../models/banner"),
  State: require("../models/states"),
  User: require("../models/user"),
  UserAccount: require("../models/userAccounts"),
  Apis: require("../models/apis"),
  Recharge: require("../models/recharge"),
  Transactions: require("../models/transaction"),
  PaymentMode: require("../models/paymentModes"),
  ServiceDiscount: require("../models/serviceDiscount"),

  isValidId,
};
