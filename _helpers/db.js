const config = require("../config.json");
const mongoose = require("mongoose");

const connectionOptions = { useNewUrlParser: true, useUnifiedTopology: true };
mongoose.connect(
  process.env.MONGODB_URI || config.connectionString1,
  connectionOptions
);
mongoose.Promise = global.Promise;

const isValidId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

module.exports = {
  Account: require("../modules/accounts/accounts.model"),
  RefreshToken: require("../modules/accounts/refresh-token.model"),
  Services: require("../modules/services/services.model"),
  Wallet: require("../modules/wallet/wallet.model"),
  walletTransaction: require("../modules/walletTransaction/walletTransaction.model"),
  Banks: require("../modules/banks/banks.model"),
  BankAccounts: require("../modules/bankAccounts/bankAccounts.model"),
  Banners: require("../modules/banners/banners.model"),
  Ticker: require("../modules/ticker/ticker.model"),

  isValidId,
};
