const Joi = require("joi");
const express = require("express");
const router = express.Router();
const authorize = require("../../_middleware/authorize");
const bankService = require("./banks.service");
const validateRequest = require("../../_middleware/validate-request");

const createSchema = (req, res, next) => {
  const schema = Joi.object({
    bankName: Joi.string().required(),
    bankDetail: Joi.string(),
    bankBranch: Joi.string(),
  });
  validateRequest(req, next, schema);
};

const create = (req, res, next) => {
  bankService
    .create(req.body)
    .then((banks) => res.json(banks))
    .catch(next);
};

const getById = (req, res, next) => {
  bankService
    .getById(req.params.id)
    .then((banks) => (banks ? res.json(banks) : res.sendStatus(404)))
    .catch(next);
};

const updateSchema = (req, res, next) => {
  const schemaRules = {
    bankName: Joi.string().required().empty(""),
    bankDetail: Joi.string().empty(""),
    bankBranch: Joi.string().empty(""),
  };
  validateRequest(req, next, schemaRules);
};

const update = (req, res, next) => {
  bankService
    .update(req.params.id, req.body)
    .then((banks) => res.json(banks))
    .catch(next);
};

const _delete = (req, res, next) => {
  bankService
    .delete(req.params.id)
    .then(() => res.json({ message: "Bank deleted successfully" }))
    .catch(next);
};

const getAll = (req, res, next) => {
  bankService
    .getAll()
    .then((banks) => res.json(banks))
    .catch(next);
};

router.get("/", getAll);
router.get("/:id", authorize(), getById);
router.post("/", createSchema, create);
router.put("/:id", authorize(), updateSchema, update);
router.delete("/:id", authorize(), _delete);

module.exports = router;
