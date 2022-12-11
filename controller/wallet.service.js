const db = require("../_helpers/db");
const accountsService = require("../controller/accounts.service");
const walletTransaction = require("../controller/walletTransaction.service");

const getAll = async (params) => {
  //   const walletData = await db.Wallet.find({});

  let walletData = await db.Wallet.aggregate([
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

  // let bankData = await db.Wallet.aggregate([
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
  if (await db.Wallet.findOne({ slipNo: params.slipNo })) {
    throw "slip no " + params.slipNo + " already taken.";
  }
  console.log("Slip " + params);

  const wallet = new db.Wallet(params);
  await wallet.save();
};

const update = async (id, params) => {
  const wallet = await getWallet(id);

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
  const walletData = await getWalletByUserId(params.userId);

  if (walletData) {
  } else {
    let payload = {
      userId: params.userId,
      finalWalletAmount: 0,
    };
    const wallet = new db.Wallet(params);

    await wallet.save();
  }
  let userWalletData = walletData[0];

  if (params.type == "add") {
    userWalletData.finalWalletAmount = userWalletData.finalWalletAmount
      ? userWalletData.finalWalletAmount + params.amount
      : params.amount;
  } else {
    userWalletData.finalWalletAmount = userWalletData.finalWalletAmount
      ? userWalletData.finalWalletAmount - params.amount
      : params.amount;
  }
  let walletUpdateData = await update(userWalletData._id, userWalletData);

  walletUpdateData.requestAmount = params.amount;
  if (params.type == "add") {
    walletUpdateData.creditAmount = params.amount;
  } else {
    walletUpdateData.debitAmount = params.amount;
  }
  let requestPayload = {
    userId: walletUpdateData.userId,
    requestAmount: walletUpdateData.requestAmount,
    remark: params.remark,
    paymentType: walletUpdateData.paymentType,
    bank: walletUpdateData.bank,
    referenceNo: walletUpdateData.referenceNo,
    depositBank: walletUpdateData.depositBank,
    depositBranch: walletUpdateData.depositBranch,
    amount: walletUpdateData.amount,
    debitAmount: walletUpdateData.debitAmount,
    creditAmount: walletUpdateData.creditAmount,
    finalWalletAmount: walletUpdateData.finalWalletAmount,
    amountType: walletUpdateData.amountType,
    approveBy: walletUpdateData.approveBy,
    password: params.password,
    statusOfWallet: walletUpdateData.statusOfWallet,
    isActive: walletUpdateData.isActive,
    statusOfWalletRequest: walletUpdateData.statusOfWalletRequest,
  };

  // walletTransaction.create(walletUpdateData);
  const wallet = new db.walletTransaction(requestPayload);

  await wallet.save();

  const account = await db.Account.findById(params.userId);

  account.balance = walletUpdateData.finalWalletAmount;
  await account.save();
  return walletUpdateData;
};

const _delete = async (id) => {
  const wallet = await getWallet(id);
  return await wallet.remove();
};

const getWallet = async (id) => {
  if (!db.isValidId(id)) throw "wallet not found";
  const walletData = await db.Wallet.findById(id);
  if (!walletData) throw "wallet not found";
  return walletData;
};

const getWalletByUserId = async (userId) => {
  const walletData = await db.Wallet.find({ userId: userId });
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
  getWalletByUserId,
};
