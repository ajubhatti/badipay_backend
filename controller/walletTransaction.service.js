const db = require("../_helpers/db");
const accountsService = require("../controller/accounts.service");
const { getBankAccountById } = require("../controller/bankAccounts.service");
const { getModeById } = require("../controller/paymentModes.service");
const { getTrasactionById } = require("../controller/transaction.service");
const transaction = require("../controller/transaction.service");
const generateRandomNumber = require("../_helpers/randomNumber");
const mongoose = require("mongoose");

const getAll = async (params) => {
  let walletTransactionData = await db.WalletTransaction.aggregate([
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

  let temp = JSON.stringify(walletTransactionData);
  let paramsResult = JSON.parse(temp);

  var startDate = new Date(params.startDate);
  var endDate = new Date(params.endDate);

  let filterData = walletTransactionData;
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

  //   filterData.map(async (x) => {
  //     let user = await accountsService.getById(x.userId);
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
  const walletTransactionData = await getWalletTransactionById(id);
  return walletTransactionData;
};

const createWallet = async (req, res, next) => {
  try {
    const params = req.body;

    if (await db.Transactions.findOne({ slipNo: params.slipNo })) {
      res.status(400).json({
        status: 500,
        message: "slip no " + params.slipNo + " already taken.",
        data: "",
      });
    }
    if (!params.userId) {
      res.status(400).json({
        status: 500,
        message: "userId is required",
        data: "",
      });
    }

    let accountDetail = await accountsService.getUserById(params.userId);
    console.log("account detail ---------------", accountDetail);
    let payload = {
      userId: params.userId,
      amount: params.requestAmount || null,
      slipNo: params.slipNo || "",
      remark: params.remark || "",
      type: "credit",
      status: "pending",
      description: params.description || {},
      transactionId: await generateRandomNumber(6),
      totalAmount: null,
      customerNo: "",
      operatorName: "",
      userBalance: accountDetail.walletBalance || null,
      requestAmount: params.requestAmount || null,
      cashBackAmount: null,
      rechargeAmount: null,
      userFinalBalance: null,
    };

    const transactionData = new db.Transactions(payload);
    let transactionSave = await transactionData.save();

    if (transactionSave) {
      let lastCount = await db.WalletTransaction.countDocuments();

      let temp = JSON.stringify(params);
      let paramsResult = JSON.parse(temp);

      if (transactionSave) {
        paramsResult.walletTransactionId = lastCount + 1;
        paramsResult.transactionId = transactionSave._id;
      }

      const walletTransactionData = new db.WalletTransaction(paramsResult);

      let walletSave = await walletTransactionData.save();
      if (walletSave) {
        return res.status(200).json({
          status: 200,
          data: walletSave,
          message: "success",
        });
      } else {
        return res.status(500).json({
          status: 500,
          data: "",
          message: "fail",
        });
      }
    } else {
      res.status(500).json({
        status: 500,
        message: "fail",
        data: "",
      });
    }
  } catch (err) {
    console.log({ err });
    res.status(500).json({
      status: 500,
      message: "server error",
      data: err,
    });
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
    // let rndmNmbr = await generateRandomNumber(8);

    let accountDetail = await accountsService.getUserById(params.userId);

    let payload = {
      userId: params.userId,
      amount: params.requestAmount || null,
      requestAmount: params.requestAmount || null,
      slipNo: params.slipNo || "",
      remark: params.remark || "",
      type: "credit",
      status: "pending",
      userBalance: accountDetail.walletBalance || null,
      description: params.description || {},
    };

    let trnscRes = await transaction.create(payload);

    let lastCount = await db.WalletTransaction.countDocuments();

    let temp = JSON.stringify(params);
    let paramsResult = JSON.parse(temp);
    if (trnscRes) {
      paramsResult.walletTransactionId = lastCount + 1;
      paramsResult.transactionId = trnscRes._id;
    }
    const walletTransactionData = new db.WalletTransaction(paramsResult);

    let walletRes = await walletTransactionData.save();
    if (walletRes) {
      return walletRes;
    }
  } catch (err) {
    throw new error(err);
  }
};

const update = async (id, params) => {
  const walletTransactionData = await getWalletTransactionById(id);
  if (
    params.slipNo &&
    walletTransactionData.slipNo !== params.slipNo &&
    (await db.Account.findOne({ slipNo: params.slipNo }))
  ) {
    throw 'slip no "' + params.slipNo + '" is already taken';
  }

  // copy params to account and save
  Object.assign(walletTransactionData, params);
  return await walletTransactionData.save();
};

const updateExistingBalance = async (params) => {
  try {
    console.log({ params });
    let accountDetail = await db.Account.findOne({ _id: params.userId });
    // let accountDetail = await accountsService.getById(params.userId);
    console.log({ accountDetail });

    let calBalance = 0;

    if (accountDetail) {
      if (params.type == "add") {
        calBalance = Number(accountDetail.walletBalance)
          ? Number(accountDetail.walletBalance) + Number(params.amount)
          : Number(params.amount);
      } else {
        calBalance = Number(accountDetail.walletBalance)
          ? Number(accountDetail.walletBalance) - Number(params.amount)
          : Number(params.amount);
      }

      // const walletTransactionData = await db.WalletTransaction.find({
      //   userId: params.userId,
      // });

      // let userWalletData = walletTransactionData;

      // console.log({ userWalletData });

      // let requestPayload = {
      //   userId: params.userId,
      //   requestAmount: params.amount,
      //   remark: params.remarks,
      //   paymentType: "1",
      //   bank: userWalletData.bank,
      //   referenceNo: userWalletData.referenceNo,
      //   depositBank: userWalletData.depositBank,
      //   depositBranch: userWalletData.depositBranch,
      //   amount: userWalletData.amount,
      //   debitAmount: userWalletData.debitAmount,
      //   creditAmount: userWalletData.creditAmount,
      //   finalWalletAmount: userWalletData.finalWalletAmount,
      //   amountType: userWalletData.amountType,
      //   approveBy: userWalletData.approveBy,
      // };

      // const walletTransaction = await new db.WalletTransaction(requestPayload);

      // walletTransaction.save();
      // return walletTransaction;

      let payload = {
        userId: params.userId,
        amount: calBalance || 0,
        slipNo: params.slipNo || "",
        remark: params.remark || "",
        type: params.type === "add" ? "credit" : "debit",
        status: "success",
        description: params.remarks || {},
        transactionId: (await db.Transactions.countDocuments()) + 1,
        totalAmount: 0,
        userBalance: accountDetail.walletBalance || 0,
        requestAmount: params.amount || 0,
        cashBackAmount: 0,
        rechargeAmount: 0,
        userFinalBalance: calBalance,
      };

      const transactionData = new db.Transactions(payload);
      await transactionData.save();

      accountDetail.walletBalance = calBalance;
      delete accountDetail._id;

      let userData = await accountsService.update(params.userId, accountDetail);
      return userData;
    } else {
      throw "user not found";
    }
  } catch (e) {
    console.log(e);
    return e;
  }
};

const _delete = async (id) => {
  const walletTransac = await getWalletTransactionById(id);
  return await walletTransac.remove();
};

const getWalletTransactionById = async (id) => {
  if (!db.isValidId(id)) throw "walletTransaction not found";
  const walletTransactionData = await db.WalletTransaction.findById(id);
  if (!walletTransactionData) throw "walletTransaction not found";
  return walletTransactionData;
};

const getTransctionByUserId = async (userId) => {
  try {
    let walletData1 = await db.WalletTransaction.find({ userId });

    if (!walletData1) throw "walletTransaction data not found";
    return walletData1;
  } catch (err) {
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

    const walletTransactionData = await getWalletTransactionById(params.id);
    delete params.id;
    delete params.userId;

    let approveAmount = walletTransactionData.requestAmount;

    // for deduction amount by admin
    if (params.amount) {
      approveAmount =
        approveAmount > 0 ? approveAmount - params.amount : approveAmount;
      params.approveAmount = approveAmount;
      params.debitAmount = params.amount;
    }

    params.finalWalletAmount = approveAmount;

    params.statusChangeDate = new Date();

    Object.assign(walletTransactionData, params);
    let walletRes = await walletTransactionData.save();

    if (walletRes) {
      if (params.statusOfWalletRequest === "approve") {
        var account = await db.Account.findOne({
          _id: walletTransactionData.userId,
        });
        let walletCount =
          account.walletBalance + walletTransactionData.requestAmount;

        let userPayload = { walletBalance: walletCount };
        Object.assign(account, userPayload);
        await account.save();

        let transactionData = await getTrasactionById(walletRes.transactionId);

        let transactionPayload = {
          userId: walletTransactionData.userId,
          amount: walletCount || "",
          type: "debit",
          status: "success",
          description: params.reason || "",
          userBalance: transactionData.userBalance || null,
          userFinalBalance: walletCount,
          requestAmount: walletTransactionData.requestAmount,
        };
        Object.assign(transactionData, transactionPayload);
        await transactionData.save();
      }
      return walletRes;
    }
  } catch (err) {
    return err;
  }
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

const getWalletWithPagination3 = async (req, res, next) => {
  const params = req.body;
  const { userId } = params;
  const orderByColumn = params.order_by_column || "created";
  const orderByDirection = params.order_by_direction || "desc";
  const page = params.page || 1;
  const limit = params.limit || 20;
  const where = {};

  if (params.status) {
    where.status = params.status;
  }
  if (params.userId) {
    where.userId = params.userId;
  }
  const images = await db.WalletTransaction.find()
    .where(where)
    .orderBy(orderByColumn, orderByDirection)
    .limit(limit)
    .offset((page - 1) * limit);

  res.status(200).json({ status: 200, data: images, message: suuccss });
};

const getAllData2 = async (req, res, next) => {
  //const _ispublished = req.body.published;
  const { userId } = req.body;
  const match = {};
  const sort = {};

  if (req.body.sortBy && req.body.orderBy) {
    sort[req.body.sortBy] = req.body.orderBy === "desc" ? -1 : 1;
  }

  try {
    await db.WalletTransaction.find({ userId })
      .sort(sort)
      .skip(parseInt(req.body.skip))
      .limit(parseInt(req.body.limit))
      .then((result) => {
        res.status(200).json({ status: 200, data: result, message: "success" });
      });
  } catch (error) {
    res.status(500).send(error);
  }
};

// exaple for sorting and pagination
//
//input : {
//   "query":{"name":"jo"}
//   "page":1,
//   "limit":3
// }

const getDataExample = async (req, res) => {
  try {
    const filter = req.body.query;
    let where = {};
    if (filter.name) {
      where.name = { $regex: filter.name, $options: "i" };
    }
    let query = User.find(where);
    const page = parseInt(req.body.page) || 1;
    const pageSize = parseInt(req.body.limit) || 10;
    const skip = (page - 1) * pageSize;
    const total = await User.countDocuments(where);
    const pages = Math.ceil(total / pageSize);

    if (page > pages) {
      return res.status(404).json({
        status: "fail",
        message: "No page found",
      });
    }
    result = await query.skip(skip).limit(pageSize);
    res.json({
      status: "success",
      filter,
      count: result.length,
      page,
      pages,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: "Server Error",
    });
  }
};

//working api
const getAllData = async (req, res, next) => {
  try {
    const filter = req.body;
    let where = {};
    const sort = {};

    if (req.body.sortBy && req.body.orderBy) {
      sort[req.body.sortBy] = req.body.orderBy === "desc" ? -1 : 1;
    }

    if (filter) {
      where.userId = filter.userId;
      where.name = {
        $regex: filter.name,
        $options: "i",
      };
    }

    let query = db.WalletTransaction.find(where);
    const page = parseInt(req.body.page) || 1;
    const pageSize = parseInt(req.body.limit) || 10;
    const skip = (page - 1) * pageSize;
    const total = await db.WalletTransaction.countDocuments(where);
    const pages = Math.ceil(total / pageSize);

    if (page > pages) {
      return res.status(404).json({
        status: 404,
        message: "No page found",
        data: "",
      });
    }
    result = await query.sort(sort).skip(skip).limit(pageSize);

    res.status(200).json({
      status: "200",
      message: "success",
      sort,
      filter,
      count: result.length,
      page,
      pages,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      data: "",
      status: 400,
      message: "Server Error",
    });
  }
};

const newGetData = async (req, res, next) => {
  try {
    const params = req.body;
    const filter = req.body;

    const where = {};
    const match = {};

    let searchObj = {};
    let searchKeyword = params.search;
    if (searchKeyword) {
      searchObj = /^(?:\d*\.\d{1,2}|\d+)$/.test(searchKeyword)
        ? {
            $or: [
              { statusOfWalletRequest: searchKeyword },
              { price: searchKeyword },
            ],
          }
        : {
            statusOfWalletRequest: new RegExp(
              `${searchKeyword.toString().trim()}`,
              "i"
            ),
          };
    }

    const orderByColumn = params.sortBy || "created";
    const orderByDirection = params.orderBy || "desc";
    const sort = {};
    if (orderByColumn && orderByDirection) {
      sort[orderByColumn] = orderByDirection === "desc" ? -1 : 1;
    }
    // tmpSearch = { name: new RegExp(search, 'i') }

    if (params.status) {
      where.status = params.status;
    }
    if (params.userId) {
      where.userId = params.userId;
    }

    if (params.startDate && params.endDate) {
      let created = {
        $gte: new Date(params.startDate),
        $lt: new Date(params.endDate),
      };
      where.created = created;
    }

    const total = await db.WalletTransaction.find(searchObj).countDocuments(
      where
    );
    const page = parseInt(params.page) || 1;
    const pageSize = parseInt(params.limit) || 10;
    const skip = (page - 1) * pageSize;
    const pages = Math.ceil(total / pageSize);

    await db.WalletTransaction.find(searchObj)
      .sort(sort)
      .where(where)
      .skip(skip)
      .limit(pageSize)
      .exec(function (err, result) {
        res.status(200).json({
          status: 200,
          message: "success",
          data: {
            sort,
            filter,
            count: result.length,
            page,
            pages,
            data: result,
            total,
          },
        });
      });
  } catch (error) {
    res.status(400).json({
      status: 400,
      message: "Server Error",
      data: error,
    });
  }
};

const walletListDataPageWise = async (req, res, next) => {
  try {
    const params = req.body;
    const filter = req.body;
    let match = {};

    let searchKeyword = params.search;
    if (searchKeyword) {
      match = {
        $or: [
          { walletTransactionId: { $regex: searchKeyword, $options: "i" } },
          { slipNo: { $regex: searchKeyword, $options: "i" } },
        ],
      };
    }

    const orderByColumn = params.sortBy || "created";
    const orderByDirection = params.orderBy || "desc";
    const sort = {};

    if (orderByColumn && orderByDirection) {
      sort[orderByColumn] = orderByDirection === "desc" ? -1 : 1;
    }

    if (params.status) {
      match.statusOfWalletRequest = params.status;
    }
    if (params.userId) {
      match.userId = mongoose.Types.ObjectId(params.userId);
    }
    if (params.startDate && params.endDate) {
      var startDate = new Date(params.startDate); // this is the starting date that looks like ISODate("2014-10-03T04:00:00.188Z")

      startDate.setSeconds(0);
      startDate.setHours(0);
      startDate.setMinutes(0);

      var endDate = new Date(params.endDate);

      endDate.setHours(23);
      endDate.setMinutes(59);
      endDate.setSeconds(59);
      let created = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
      match.created = created;
    }

    const total = await db.WalletTransaction.find().countDocuments(match);
    const page = parseInt(params.page) || 1;
    const pageSize = parseInt(params.limits) || 10;
    const skipNo = (page - 1) * pageSize;
    const pages = Math.ceil(total / pageSize);

    const aggregateRules = [
      {
        $match: match,
      },
      {
        $sort: sort,
      },
      { $skip: skipNo },
      { $limit: params.limits },
      // {
      //   $lookup: {
      //     from: "accounts",
      //     localField: "userId",
      //     foreignField: "_id",
      //     as: "userDetail",
      //   },
      // },
      // { $unwind: "$userDetail" },
      // {
      //   $lookup: {
      //     from: "paymentmodes",
      //     localField: "paymentType",
      //     foreignField: "_id",
      //     as: "paymentMode",
      //   },
      // },
      // { $unwind: "$paymentMode" },

      // {
      //   $lookup: {
      //     from: "transactions",
      //     localField: "transactionId",
      //     foreignField: "_id",
      //     as: "transactionData",
      //   },
      // },
      // { $unwind: "$transactionData" },
    ];

    console.log({ aggregateRules });

    await db.WalletTransaction.aggregate(aggregateRules).then((result) => {
      res.status(200).json({
        status: 200,
        message: "success",
        data: {
          sort,
          filter,
          count: result.length,
          page,
          pages,
          data: result,
          total,
        },
      });
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: "Server Error",
      data: error,
    });
  }
};

const queryBlogPostsByUser = async (req, res, next) => {
  try {
    const {
      userId,
      startRow,
      endRow,
      filter = {},
      limits,
      skip,
      page,

      sortBy,
      orderBy,
      search,
      startDate, //"10-15-2022",
      endDate,
    } = req.body;

    // if (!(userId instanceof mongoose.Types.ObjectId)) {
    //   throw new Error("userId must be ObjectId");
    // } else if (typeof startRow !== "number") {
    //   throw new Error("startRow must be number");
    // } else if (typeof endRow !== "number") {
    //   throw new Error("endRow must be number");
    // }

    const query = [
      // {
      //   $lookup: {
      //     from: "accounts",
      //     localField: "userId",
      //     foreignField: "_id",
      //     as: "userdetail",
      //   },
      // },
      // // each blog has a single user (author) so flatten it using $unwind
      // { $unwind: "$userdetail" },
      // filter the results by our userId
      // { $match: Object.assign({ "user._id": userId }, filter) },
    ];
    const orderByColumn = sortBy || "created";
    const orderByDirection = orderBy || "desc";
    const sort = {};
    if (orderByColumn && orderByDirection) {
      sort[orderByColumn] = orderByDirection === "desc" ? -1 : 1;
    }

    if (sort) {
      // maybe we want to sort by blog title or something
      query.push({ $sort: sort });
    }

    query.push(
      {
        $group: {
          _id: null,
          // get a count of every result that matches until now
          count: { $sum: 1 },
          // keep our results for the next operation
          results: { $push: "$$ROOT" },
        },
      },
      // and finally trim the results to within the range given by start/endRow
      {
        $project: {
          count: 1,
          // rows: { $slice: ["$results", startRow, endRow] },
        },
      }
    );

    await db.WalletTransaction.aggregate(query).then((result) => {
      res.status(200).json({ stats: 200, message: "success", data: result });
    });
    const skipNo = (page - 1) * limits;
    var pipeline = [
      {
        $match: {},
      },
      {
        $sort: {
          created: -1,
        },
      },
      // {
      //   $lookup: {
      //     from: "accounts",
      //     localField: "userId",
      //     foreignField: "_id",
      //     as: "userdetail",
      //   },
      // },
      // {
      //   $unwind: "$userdetail",
      // },
      {
        $limit: limits,
      },
      {
        $skip: skipNo,
      },
    ];

    // await db.WalletTransaction.aggregate(pipeline).then((result) => {
    //   res.status(200).json({ stats: 200, message: "success", data: result });
    // });
  } catch (err) {
    res.status(500).json({ stats: 500, message: "fail", data: err });
  }
};

const getByAggeration = (req, res, next) => {
  try {
    const params = req.body;
    const {
      userId,
      page,
      limits,
      sortBy,
      orderBy,
      skip,
      search,
      startDate, //"10-15-2022",
      endDate,
    } = params;

    const skipNo = (page - 1) * limits;

    const aggregateRules = [
      { $match: {} },
      {
        $sort: {
          created: -1,
        },
      },
      { $skip: skipNo },
      { $limit: limits },
      {
        $lookup: {
          from: "accounts",
          localField: "userId",
          foreignField: "_id",
          as: "userDetail",
        },
      },
      { $unwind: "$userDetail" },
      // {
      //   $lookup: {
      //     from: "PaymentMode",
      //     localField: "paymentType",
      //     foreignField: "_id",
      //     as: "paymentMode",
      //   },
      // },
      // { $unwind: "$paymentMode" },
    ];

    db.WalletTransaction.aggregate(aggregateRules).then((result) => {
      res.status(200).send({ result });
    });
  } catch (err) {
    res.json(500).json({ status: 500, message: "fail", data: err });
  }
};

const getAllDataByPaginate = (req, res, next) => {
  const { page, limits, title, active } = req.body;
  // query documents based on  condition
  let query = {};
  if (title) {
    query.title = { $regex: new RegExp(title), $options: "i" };
  }
  if (active) {
    query.active = { $regex: new RegExp(active), $options: "i" };
  }

  const { limit, offset } = getPagination(page - 1, limits);

  var options = {
    populate: ["userId", "approveBy", "creditAccount", "transactionId"],
    sort: { created: -1 },
  };

  db.WalletTransaction.paginate(query, { offset, limit, options })
    .then((data) => {
      res.status(200).send({
        data,
      });
    })
    .catch((err) => {
      res.status(500).send({
        status: 500,
        message:
          req.method + ": " + req.originalUrl + ", message: " + err.message,
        data: err,
      });
    });
};

const getPagination = (page, size) => {
  const limit = size ? +size : 3;
  const offset = page ? page * limit : 0;

  return { limit, offset };
};

module.exports = {
  createWallet,
  create2,
  update,
  getAll,
  getById,
  delete: _delete,
  updateExistingBalance,
  getTransctionByUserId,
  updateWalletStatus,
  getAllData,
  getAllData2,
  getWalletWithPagination3,

  newGetData,
  queryBlogPostsByUser,
  getByAggeration,

  getAllDataByPaginate,

  walletListDataPageWise,
};
