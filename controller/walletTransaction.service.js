const db = require("../_helpers/db");
const accountsService = require("../controller/accounts.service");
const { getBankAccountById } = require("../controller/bankAccounts.service");
const { getModeById } = require("../controller/paymentModes.service");
const { getTrasactionById } = require("../controller/transaction.service");
const transaction = require("../controller/transaction.service");

const getAll = async (params) => {
  let walletData = await db.WalletTransaction.aggregate([
    {
      $lookup: {
        from: "accounts",
        localField: "userId",
        foreignField: "_id",
        as: "userdetail",
      },
    },
    { $unwind: "$userdetail" },
    { $sort: { created: -1 } },
  ]).then(async (result) => {
    result = JSON.parse(JSON.stringify(result));
    for (let i = 0; i < result.length; i++) {
      result[i].bankData = {};
      result[i].paymnetModeData = {};

      let bankData = await getBankAccountById(result[i].creditAccount);
      result[i].bankData = bankData || {};
      if (result[i].paymentType) {
        let paymnetModeData = await getModeById(result[i].paymentType);
        result[i].paymnetModeData = paymnetModeData || {};
      }
    }
    return result;
  });

  let temp = JSON.stringify(walletData);
  let paramsResult = JSON.parse(temp);

  var startDate = new Date(params.startDate);
  var endDate = new Date(params.endDate);

  let filterData = walletData;
  if (params.startDate && params.endDate) {
    filterData = filterData.filter((user) => {
      let date = new Date(user.created);
      return date >= startDate && date <= endDate;
    });
  }

  // let bankData = await db.WalletTransaction.aggregate([
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
  if (await db.WalletTransaction.findOne({ slipNo: params.slipNo })) {
    throw "slip no " + params.slipNo + " already taken.";
  }
  const wallet = new db.WalletTransaction(params);
  let walletRes = await wallet.save();
  console.log({ walletRes });
  if (walletRes) {
    let payload = {
      userId: params.userId,
      amount: params.requestAmount,
      slipNo: params.slipNo,
      remark: params.remark,
      type: "credit",
      status: "pending",
      // description: walletRes,
    };
    let trnscRes = await transaction.create(payload);
    console.log("trnscRes", trnscRes);
    return wallet;
  }
};

const create2 = async (params) => {
  try {
    if (await db.Transactions.findOne({ slipNo: params.slipNo })) {
      return "slip no " + params.slipNo + " already taken.";
    }
    if (!params.userId) {
      return "userId is required";
    }
    let payload = {
      userId: params.userId,
      amount: params.requestAmount || "",
      slipNo: params.slipNo || "",
      remark: params.remark || "",
      type: "credit",
      status: "pending",
      description: params.description || {},
    };

    let trnscRes = await transaction.create(payload);
    console.log({ trnscRes });
    let temp = JSON.stringify(params);
    let paramsResult = JSON.parse(temp);
    if (trnscRes) {
      paramsResult.transactionId = trnscRes._id;
    }
    console.log({ paramsResult });
    const wallet = new db.WalletTransaction(paramsResult);

    let walletRes = await wallet.save();
    console.log({ walletRes });
    if (walletRes) {
      return walletRes;
    }
  } catch (err) {
    console.log("err---", err);
    return err;
  }
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

    const wallet = await new db.WalletTransaction(requestPayload);

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
  const walletData = await db.WalletTransaction.findById(id);
  if (!walletData) throw "wallet not found";
  return walletData;
};

const getTransctionByUserId = async (userId) => {
  try {
    let walletData1 = await db.WalletTransaction.find({ userId });

    if (!walletData1) throw "wallet data not found";
    return walletData1;
  } catch (err) {
    console.log(err);
    return err;
  }
};

const updateWalletStatus = async (params) => {
  try {
    console.log({ params });
    // if (params.password) {
    //   const account = await db.Account.findOne({ _id: userId });
    //   if (!bcrypt.compareSync(password, account.passwordHash)) {
    //     throw "Your email or password not matched";
    //   }
    // }
    const wallet = await getWallet(params.id);
    console.log({ wallet });
    delete params.id;
    delete params.userId;
    params.finalWalletAmount = wallet.requestAmount;

    let approveAmount = wallet.requestAmount;
    if (params.amount) {
      approveAmount =
        approveAmount > 0 ? approveAmount - params.amount : approveAmount;
      params.approveAmount = approveAmount;
      params.debitAmount = params.amount;
    }
    console.log({ params });

    params.statusChangeDate = new Date();

    Object.assign(wallet, params);
    let walletRes = await wallet.save();

    console.log({ walletRes });

    if (walletRes) {
      walletRes.transactionId;
      let transactionData = await getTrasactionById(walletRes.transactionId);
      let payload = { status: params.statusOfWalletRequest };
      Object.assign(transactionData, payload);
      let transactionRes = await transactionData.save();

      console.log({ transactionRes });

      if (params.statusOfWalletRequest === "approve") {
        var account = await db.Account.findById({ _id: wallet.userId });
        console.log({ account });
        let walletCount = account.walletBalance + wallet.requestAmount;
        if (params.amount) {
          walletCount = walletCount - params.amount;
        }
        console.log({ walletCount });

        // here update user wallet balance

        let userPayload = { walletBalance: walletCount };
        Object.assign(account, userPayload);
        let accRes = await account.save();
        console.log({ accRes });

        if (params.amount) {
          let payload = {
            userId: wallet.userId,
            amount: params.amount || "",
            type: "debit",
            status: "approve",
            description: params.reason || "",
          };

          let trnscRes = await transaction.create(payload);
          console.log({ trnscRes });
        }
      }

      return walletRes;
    }
  } catch (err) {
    console.log(err);
    return err;
  }
};

const getWalletWithPagination = async (params) => {
  // example array of 150 items to be paged
  const items = [...Array(150).keys()].map((i) => ({
    id: i + 1,
    name: "Item " + (i + 1),
  }));

  // get page from query params or default to first page
  const page = parseInt(params.page) || 1;

  // get pager object for specified page
  const pageSize = 5;
  const pager = paginate(items.length, page, pageSize);

  // get page of items from items array
  const pageOfItems = items.slice(pager.startIndex, pager.endIndex + 1);

  // return pager object and current page of items
  return { pager, pageOfItems };
};

const getWalletWithPagination2 = async (params) => {
  let perPage = 3;
  let page = params.page || 1;
  let searchKeyword = params.search;

  let searchObj = {};
  if (searchKeyword) {
    searchObj = /^(?:\d*\.\d{1,2}|\d+)$/.test(searchKeyword)
      ? {
          $or: [{ discount: searchKeyword }, { price: searchKeyword }],
        }
      : { name: new RegExp(`${searchKeyword.toString().trim()}`, "i") };
  }
  // tmpSearch = { name: new RegExp(search, 'i') }

  products
    .find(searchObj)
    .sort({ name: 1 })
    .skip(perPage * page - perPage)
    .limit(perPage)
    .exec(function (err, docs) {
      products.count(searchObj).exec(function (err, count) {
        return {
          search: searchKeyword,
          quotes: docs,
          current: page,
          pages: Math.ceil(count / perPage),
        };
      });
    });
};

const getWalletWithPagination3 = async (params) => {
  const orderByColumn = params.order_by_column || "created_at";
  const orderByDirection = params.order_by_direction || "desc";
  const page = params.page || 1;
  const limit = params.limit || 20;
  const where = {};

  if (params.status) {
    where.status = params.status;
  }

  const images = await db.WalletTransaction.find()
    .where(where)
    .orderBy(orderByColumn, orderByDirection)
    .limit(limit)
    .offset((page - 1) * limit);

  return { images };
};

// router.get("/posts", authenticate, async (req, res) => {
//   //const _ispublished = req.query.published;
//   const match = {};
//   const sort = {};

//   if (req.query.published) {
//     match.published = req.query.published === "true";
//   }

//   if (req.query.sortBy && req.query.OrderBy) {
//     sort[req.query.sortBy] = req.query.OrderBy === "desc" ? -1 : 1;
//   }

//   try {
//     await req.user
//       .populate({
//         path: "posts",
//         match,
//         options: {
//           limit: parseInt(req.query.limit),
//           skip: parseInt(req.query.skip),
//           sort,
//         },
//       })
//       .execPopulate();
//     res.send(req.user.posts);
//   } catch (error) {
//     res.status(500).send();
//   }
// });

module.exports = {
  create,
  create2,
  update,
  getAll,
  getById,
  delete: _delete,
  updateExistingBalance,
  getTransctionByUserId,
  updateWalletStatus,
};
