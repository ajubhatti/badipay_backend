const db = require('../_helpers/db');

module.exports = {
    create,
    update,
    getById,
    getAll,
    delete:_delete
}

async function create(params) {
    let bankExist = await db.Banks.findOne({ bankName: params.bankName });

    if (bankExist) {
        throw `name ${params.bankName} is already added`;
    }    

    const banks = new db.Banks(params);
    await banks.save();
    return banks;
}

async function update(id,params) {
    const banks = await getBanks(id);

    if (params.name && banks.bankName !== params.name && await db.Banks.findOne({ bankName: params.name })) {
        throw `Name ${params.name} is already taken`;
    }

    Object.assign(banks, params);
    banks.updated = Date.now();
    await banks.save();

    return banks;
}

async function getById(id){
    const banks = await getBanks(id);
    return banks;
}

async function getAll() {
    const banks = await db.Banks.find();
    return banks;
}

async function _delete(id) {
    const banks = await getBanks(id);
    await banks.remove();
}

async function getBanks(id) {
    if (!db.isValidId(id)) throw 'Bank not found';
    const banks = await db.Banks.findById(id);
    if (!banks) throw 'Bank not found';
    return banks;
}