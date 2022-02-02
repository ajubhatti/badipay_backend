const config = require('../config.json');
const mongoose = require('mongoose');

const connectionOptions = { useNewUrlParser: true, useUnifiedTopology: true };
mongoose.connect(process.env.MONGODB_URI || config.connectionString,connectionOptions);
mongoose.Promise = global.Promise;

module.exports = {
    Account : require('../accounts/accounts.model'),
    RefreshToken : require('../accounts/refresh-token.model'),
    Services: require('../services/services.model'),
    Wallet: require('../wallet/wallet.model'),
    Banks: require('../banks/banks.model'),
    BankAccounts:require('../bankAccounts/bankAccounts.model'),
    isValidId
};

function isValidId(id){
    return mongoose.Types.ObjectId.isValid(id)
}