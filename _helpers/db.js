const config = require("../config.json");
const mongoose = require("mongoose");
const Grid = require("gridfs-stream");

const connectionOptions = { useNewUrlParser: true, useUnifiedTopology: true };

let DB_RETRIES = 0; // global variable that counts retry attempts
const connectWithRetry = () => {
  let connectionString = process.env.DB_URL || config.connectionString1;
  // let connectionString = config.connectionString1;
  return mongoose
    .connect(connectionString, connectionOptions)
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

let gfs;

const conn = mongoose.connection;
conn.once("open", function () {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("photos");
});

mongoose.Promise = global.Promise;

const isValidId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

module.exports = {
  Account: require("../models/accounts"),
  RefreshToken: require("../models/refresh-token"),
  Services: require("../models/services"),
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
  State: require("../models/states"),
  User: require("../models/user"),
  UserAccount: require("../models/userAccounts"),
  Apis: require("../models/apis"),
  Recharge: require("../models/recharge"),
  Transactions: require("../models/transaction"),
  PaymentMode: require("../models/paymentModes"),
  ServiceDiscount: require("../models/serviceDiscount"),
  Slabs: require("../models/slabs"),
  Cashback: require("../models/cashBack"),
  AdminLoyalty: require("../models/adminLoyalty"),
  Test: require("../models/test"),
  OperatorConfig: require("../models/operatorConfig"),
  Operator: require("../models/operator"),
  PaymentGateway: require("../models/paymentGateways"),
  paymentGatewayTxn: require("../models/paymentGatewayTxn"),
  CallBack: require("../models/callBack"),
  RechargeComplaints: require("../models/rechargeComplaints"),
  Utility: require("../models/utility"),
  ApiResponse: require("../models/apiresponses"),
  ServiceCategory: require("../models/serviceCategory"),
  ApiConfig: require("../models/apiConfig"),
  PlanApis: require("../models/planApis"),
  isValidId,
};
