const express = require("express");
const router = express.Router();
const Joi = require("joi");
const authorize = require("../../_middleware/authorize");
const validateRequest = require("../../_middleware/validate-request");
const walletTransaction = require("./walletTransaction.service");

const getAll = (req, res, next) => {
  walletTransaction
    .getAll(req.body)
    .then((wallets) =>
      res.status(200).json({
        type: "success",
        message: "wallets get successfully",
        data: {
          wallets,
        },
      })
    )
    .catch(next);
};

const createSchema = (req, res, next) => {
  const schema = Joi.object({
    userId: Joi.string().required(),
    requestAmount: Joi.number().required(),
    amount: Joi.number(),
    slipNo: Joi.string(),
    note: Joi.string(),
    remark: Joi.string(),
    paymentType: Joi.number(),
    bank: Joi.string(),
    referenceNo: Joi.string(),
    depositBank: Joi.string(),
    depositBranch: Joi.string(),
    debitAmount: Joi.number(),
    creditAmount: Joi.number(),
    finalWalletAmount: Joi.number(),

    amountType: Joi.string(),

    approveBy: Joi.string(),
    approveDate: Joi.date(),
    password: Joi.string(),
  });
  validateRequest(req, next, schema);
};

const create = (req, res, next) => {
  walletTransaction
    .create(req.body)
    .then((wallet) =>
      res.status(200).json({
        type: "success",
        message: "Wallet data created succesfully",
        data: {
          wallet,
        },
      })
    )
    .catch(next);
};

const getById = (req, res, next) => {
  walletTransaction
    .getById(req.params.id)
    .then((wallet) =>
      res.json({ status: 200, data: wallet, message: "success" })
    )
    .catch(next);
};

const getByUserId = (req, res, next) => {
  walletTransaction
    .getTransctionByUserId(req.body.userId)
    .then((wallet) =>
      res.json({ status: 200, data: wallet, message: "success" })
    )
    .catch(next);
};

const updateSchema = (req, res, next) => {
  const schema = Joi.object({
    userId: Joi.string().required(),
    requestAmount: Joi.number().required(),
    amount: Joi.number(),
    slipNo: Joi.string(),
    note: Joi.string(),
    remark: Joi.string(),
    paymentType: Joi.number(),
    bank: Joi.string(),
    referenceNo: Joi.string(),
    depositBank: Joi.string(),
    depositBranch: Joi.string(),
    debitAmount: Joi.number(),
    creditAmount: Joi.number(),
    finalWalletAmount: Joi.number(),
    amountType: Joi.string(),
    approveBy: Joi.string(),
    approveDate: Joi.date(),
    password: Joi.string(),
  });
  validateRequest(req, next, schema);
};

const updateById = (req, res, next) => {
  walletTransaction
    .update(req.params.id, req.body)
    .then((wallet) =>
      res.status(200).json({
        status: 200,
        message: "wallet updated successfully",
        data: {
          wallet,
        },
      })
    )
    .catch(next);
};

const deleteById = (req, res, next) => {
  walletTransaction
    .delete(req.params.id)
    .then((wallet) =>
      res.status(200).json({
        data: [],
        status: 200,
        message: "wallet transaction deleted successfully",
      })
    )
    .catch(next);
};

const updateExistingBalance = (req, res, next) => {
  walletTransaction
    .updateExistingBalance(req.body)
    .then((wallet) => {
      res.status(200).json({
        status: 200,
        message: "success",
        data: wallet,
      });
    })
    .catch(next);
};

router.post("/getAll", getAll);
router.post("/", create);
router.get("/:id", getById);
router.post("/getByUserId", getByUserId);
router.put("/:id", updateSchema, updateById);
router.delete("/:id", deleteById);
router.post("/updateBalance", updateExistingBalance);

module.exports = router;
