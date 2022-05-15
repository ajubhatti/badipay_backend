const db = require("../../_helpers/db");
const accountsService = require("../accounts/accounts.service");

const getAll = async (params) => {
  //   const walletData = await db.walletTransaction.find({});

  let walletData = await db.walletTransaction.aggregate([
    {
      $lookup: {
        from: "accounts",
        localField: "userId",
        foreignField: "_id",
        as: "userdetail",
      },
    },
  ]);

  var startDate = new Date(params.startDate);
  var endDate = new Date(params.endDate);

  let filterData = walletData;
  if (params.startDate && params.endDate) {
    filterData = filterData.filter((user) => {
      let date = new Date(user.created);
      return date >= startDate && date <= endDate;
    });
  }

  // let bankData = await db.walletTransaction.aggregate([
  //   {
  //     $lookup: {
  //       from: "bankaccounts",
  //       localField: "bank",
  //       foreignField: "_id",
  //       as: "bankData",
  //     },
  //   },
  // ]);

  //   filterData.map(async (wallet) => {
  //     let user = await accountsService.getById(wallet.userId);
  //     filterData.userdata = user;
  //   });

  //   if (params.role) {
  //     filterData = filterData.filter((user) => {
  //       return user.role == params.role;
  //     });
  //   }

  //   if (params.searchParams) {
  //     filterData = filterData.filter((user) => {
  //       if (user.userName.includes(params.searchParams)) {
  //         return user.userName.includes(params.searchParams);
  //       } else {
  //         return user.phoneNumber.includes(params.searchParams);
  //       }
  //     });
  //   }

  return filterData;
};

const getById = async (id) => {
  const walletData = await getWallet(id);
  return walletData;
};

const create = async (params) => {
  if (await db.walletTransaction.findOne({ slipNo: params.slipNo })) {
    throw "slip no " + params.slipNo + " already taken.";
  }

  const wallet = new db.walletTransaction(params);

  return await wallet.save();
};

const update = async (id, params) => {
  const wallet = await getWallet(id);

  // validate (if slip no. was changed)
  if (
    params.slipNo &&
    wallet.slipNo !== params.slipNo &&
    (await db.Account.findOne({ slipNo: params.slipNo }))
  ) {
    throw 'slip no "' + params.slipNo + '" is already taken';
  }

  // copy params to account and save
  Object.assign(wallet, params);
  return await wallet.save();
};

const updateExistingBalance = async (params) => {
  let accountDetail = await accountsService.getById(params.userId);

  if (accountDetail) {
    if (params.type == "add") {
      accountDetail.balance = Number(accountDetail.balance)
        ? Number(accountDetail.balance) + Number(params.amount)
        : Number(params.amount);
    } else {
      accountDetail.balance = Number(accountDetail.balance)
        ? Number(accountDetail.balance) - Number(params.amount)
        : Number(params.amount);
    }
    delete accountDetail._id;

    await accountsService.update(params.userId, accountDetail);

    const walletData = await getWalletByUserId(params.userId);

    let userWalletData = walletData[0];

    let requestPayload = {
      userId: params.userId,
      requestAmount: params.amount,
      remark: params.remarks,
      paymentType: "1",
      bank: userWalletData.bank,
      referenceNo: userWalletData.referenceNo,
      depositBank: userWalletData.depositBank,
      depositBranch: userWalletData.depositBranch,
      amount: userWalletData.amount,
      debitAmount: userWalletData.debitAmount,
      creditAmount: userWalletData.creditAmount,
      finalWalletAmount: userWalletData.finalWalletAmount,
      amountType: userWalletData.amountType,
      approveBy: userWalletData.approveBy,
      password: params.password,
    };

    const wallet = new db.walletTransaction(requestPayload);

    wallet.save();
    return wallet;
  } else {
    throw "user not found";
  }
};

const _delete = async (id) => {
  const wallet = await getWallet(id);
  return await wallet.remove();
};

const getWallet = async (id) => {
  if (!db.isValidId(id)) throw "wallet not found";
  const walletData = await db.walletTransaction.findById(id);
  if (!walletData) throw "wallet not found";
  return walletData;
};

const getTransctionByUserId = async (userId) => {
  const walletData = await db.walletTransaction.find({ userId: userId });
  if (!walletData) throw "wallet not found";
  return walletData;
};

module.exports = {
  create,
  update,
  getAll,
  getById,
  delete: _delete,
  updateExistingBalance,
  getTransctionByUserId,
};
