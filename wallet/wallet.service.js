const db = require('../_helpers/db');

const getAll = async () => {
    const walletData = await db.Wallet.find({});
    return walletData;
}

const getById = async (id) => { 
    const walletData = await getWallet(id);
    return walletData;
}

const create = async (params) => { 
    if (db.Wallet.findOne({slipNo : params.slipNo})) { 
        throw "slip no "+ params.slipNo +" already registered."
    }
    const wallet = new db.Wallet(params);

    return await wallet.save();
}

const update = async (id,params) => { 
    const wallet = await getWallet(id)

    // validate (if slip no was changed)
    if (params.slipNo && wallet.slipNo !== params.slipNo && await db.Account.findOne({ slipNo: params.slipNo })) {
        throw 'slip no "' + params.slipNo + '" is already taken';
    }

    // copy params to account and save
    Object.assign(wallet, params);
    return await wallet.save();
}

const _delete = async (id) => {
    const wallet = await getWallet(id);
    return await wallet.remove()
}

const getWallet = async (id)=> {
    if (!db.isValidId(id)) throw 'wallet not found';
    const walletData = await db.Wallet.findById(id);
    if (!walletData) throw 'wallet not found';
    return walletData;
}

module.exports = {
    create,
    update,
    getAll,
    getById,
    delete:_delete
}