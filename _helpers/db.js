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
  Account: require("../modules/accounts/accounts.model"),
  RefreshToken: require("../modules/accounts/refresh-token.model"),
  Services: require("../modules/services/services.model"),
  Company: require("../modules/company/company.model"),
  AmbikaSlab: require("../modules/ambika-slab/ambikaSlab.model"),
  Wallet: require("../modules/wallet/wallet.model"),
  WalletTransaction: require("../modules/walletTransaction/walletTransaction.model"),
  Banks: require("../modules/banks/banks.model"),
  BankAccounts: require("../modules/bankAccounts/bankAccounts.model"),
  Banners: require("../modules/banners/banners.model"),
  Ticker: require("../modules/ticker/ticker.model"),
  Referral: require("../modules/referral/referral.model"),
  ContactUs: require("../modules/contactUs/contactUs.model"),
  Support: require("../modules/supports/support.model"),
  SubSupport: require("../modules/subSupports/subSupport.model"),
  Faqs: require("../modules/faqs/faqs.model"),
  SubFaqs: require("../modules/faqSubFaqs/subFaqs.model"),
  MyBanner: require("../modules/banner/banner.model"),
  State: require("../modules/state/states.model"),
  User: require("../modules/user/user.model"),
  UserAccount: require("../modules/userAccounts/userAccounts.model"),
  Apis: require("../modules/apis/apis.model"),
  Recharge: require("../modules/recharge/recharge.model"),
  Transactions: require("../modules/transactions/transaction.model"),
  PaymentMode: require("../modules/paymentMode/paymentModes.model"),
  ServiceDiscount: require("../modules/service-discount/serviceDiscount.modal"),

  isValidId,
};
