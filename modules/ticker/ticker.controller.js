const Joi = require("joi");
const express = require("express");
const router = express.Router();
const authorize = require("../../_middleware/authorize");
const validateRequest = require("../../_middleware/validate-request");

const db = require("../../_helpers/db");
const tickerService = require("./ticker.service");

const create = (req, res, next) => {
  tickerService
    .create(req.body)
    .then((ticker) =>
      res.json({ status: 200, data: ticker, message: "success" })
    )
    .catch(next);
};

const getById = (req, res, next) => {
  tickerService
    .getById(req.params.id)
    .then((ticker) =>
      res.json({ status: 200, data: ticker, message: "success" })
    )
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
  tickerService
    .update(req.params.id, req.body)
    .then((ticker) =>
      res.json({ status: 200, data: ticker, message: "success" })
    )
    .catch(next);
};

const _delete = (req, res, next) => {
  tickerService
    .delete(req.params.id)
    .then(() =>
      res.json({
        status: 200,
        data: [],
        message: "Ticker deleted successfully",
      })
    )
    .catch(next);
};

const getAll = (req, res, next) => {
  tickerService
    .getAll()
    .then((ticker) =>
      res.json({ status: 200, data: ticker, message: "success" })
    )
    .catch(next);
};

router.get("/", getAll);
router.get("/:id", getById);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", _delete);

module.exports = router;
