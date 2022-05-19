const Joi = require("joi");
const express = require("express");
const router = express.Router();
const authorize = require("../../_middleware/authorize");
const bankAccountService = require("./bankAccounts.service");
const validateRequest = require("../../_middleware/validate-request");

const createSchema = (req, res, next) => {
  const schema = Joi.object({
    accountNo: Joi.string().required(),
    accountName: Joi.string().required(),
    accountDetail: Joi.string(),
    ifscCode: Joi.string().required(),
    bankId: Joi.string().required(),
    bankBranch: Joi.string(),
  });
  validateRequest(req, next, schema);
};

const create = (req, res, next) => {
  bankAccountService
    .create(req.body)
    .then((bankAccount) =>
      res.json({ status: 200, data: bankAccount, message: "success" })
    )
    .catch(next);
};

const getById = (req, res, next) => {
  bankAccountService
    .getById(req.params.id)
    .then((bankAccount) =>
      res.json({ status: 200, data: bankAccount, message: "success" })
    )
    .catch(next);
};

const updateSchema = (req, res, next) => {
  const schemaRules = {
    accountNo: Joi.string().unique().required(),
    accountName: Joi.string().required(),
    accountDetail: Joi.string(),
    ifscCode: Joi.string().required(),
    bankId: Joi.number().required(),
    bankBranch: Joi.string().required(),
    isActive: Joi.boolean(),
  };
  validateRequest(req, next, schemaRules);
};

const update = (req, res, next) => {
  bankAccountService
    .update(req.params.id, req.body)
    .then((bankAccount) =>
      res.json({ status: 200, data: bankAccount, message: "sucess" })
    )
    .catch(next);
};

const _delete = (req, res, next) => {
  bankAccountService
    .delete(req.params.id)
    .then(() =>
      res.json({
        status: 200,
        message: "Bank account deleted successfully",
        message: "success",
      })
    )
    .catch(next);
};

const getAll = (req, res, next) => {
  bankAccountService
    .getAll()
    .then((bankAccount) =>
      res.json({ status: 200, data: bankAccount, message: "success" })
    )
    .catch(next);
};

router.get("/", getAll);
router.get("/:id", authorize(), getById);
router.post("/", create);
router.put("/:id", authorize(), updateSchema, update);
router.delete("/:id", authorize(), _delete);

module.exports = router;
