const express = require("express");
const router = express.Router();
const Joi = require("joi");
const authorize = require("../_middleware/authorize");
const validateRequest = require("../_middleware/validate-request");
const transactionService = require("../controller/transaction.service");

const getAll = (req, res, next) => {
  transactionService
    .getAll(req.body)
    .then((transactions) =>
      res.status(200).json({
        type: "success",
        message: "transactions get successfully",
        data: transactions,
      })
    )
    .catch(next);
};

const create = (req, res, next) => {
  transactionService
    .create(req.body)
    .then((transactions) =>
      res.status(200).json({
        type: "success",
        message: "transactions data created succesfully",
        data: {
          transactions,
        },
      })
    )
    .catch(next);
};

const getById = (req, res, next) => {
  transactionService
    .getTrasactionById(req.params.id)
    .then((transactions) =>
      res.json({ status: 200, data: transactions, message: "success" })
    )
    .catch(next);
};

const getByUserId = (req, res, next) => {
  transactionService
    .transactionListWithPagination(req.body)
    .then((transactions) =>
      res.json({ status: 200, data: transactions, message: "success" })
    )
    .catch(next);
};

const updateById = (req, res, next) => {
  transactionService
    .updateTransactionById(req.params.id, req.body)
    .then((transactions) =>
      res.status(200).json({
        status: 200,
        message: "transactions updated successfully",
        data: {
          transactions,
        },
      })
    )
    .catch(next);
};

const deleteById = (req, res, next) => {
  transactionService
    .delete(req.params.id)
    .then((transactions) =>
      res.status(200).json({
        data: [],
        status: 200,
        message: "transactions transaction deleted successfully",
      })
    )
    .catch(next);
};

router.post("/getAll", getAll);
router.post("/", create);
router.get("/:id", getById);
router.post("/getByUserId", getByUserId);
// router.post("/getByUserId", transactionService.transactionListWithPagination);
router.put("/:id", updateById);
router.delete("/:id", deleteById);

module.exports = router;
