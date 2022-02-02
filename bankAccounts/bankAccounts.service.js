const db = require('../_helpers/db');

module.exports = {
    create,
    update,
    getById,
    getAll,
    delete:_delete
}

async function create(params) {
    let bankAccountExist = await db.BankAccounts.findOne({ accountNo: params.accountNo });

    if (bankAccountExist) {
        throw `${params.accountNo} is already added`;
    }    

    const banksAccounts = new db.BankAccounts(params);
    await banksAccounts.save();
    return banksAccounts;
}

async function update(id,params) {
    const banksAccounts = await getBankAccount(id);

    if (params.accountNo && banks.accountNo !== params.accountNo && await db.BankAccounts.findOne({ accountNo: params.accountNo })) {
        throw `${params.accountNo} is already taken`;
    }

    Object.assign(banksAccounts, params);
    banksAccounts.updated = Date.now();
    await banksAccounts.save();

    return banksAccounts;
}

async function getById(id){
    const banksAccounts = await getBankAccount(id);
    return banksAccounts;
}

async function getAll() {
    const banksAccounts = await db.BankAccounts.find();
    return banksAccounts;
}

async function _delete(id) {
    const banksAccounts = await getBankAccount(id);
    await banksAccounts.remove();
}

async function getBankAccount(id) {
    if (!db.isValidId(id)) throw 'Bank account not found';
    const banksAccounts = await db.BankAccounts.findById(id);
    if (!banksAccounts) throw 'Bank account not found';
    return banksAccounts;
}