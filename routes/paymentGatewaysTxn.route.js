const Joi = require("joi");
const express = require("express");
const router = express.Router();
const authorize = require("../_middleware/authorize");
const paymentGatewayService = require("../controller/paymentGateway.service");
const validateRequest = require("../_middleware/validate-request");

const create = (req, res, next) => {
  paymentGatewayService
    .create(req.body)
    .then((service) =>
      res.json({ status: 200, data: service, message: "success" })
    )
    .catch(next);
};

const getById = (req, res, next) => {
  paymentGatewayService
    .getById(req.params.id)
    .then((service) =>
      res.json({ status: 200, data: service, message: "success" })
    )
    .catch(next);
};

const updateSchema = (req, res, next) => {
  const schemaRules = {
    apiName: Joi.string().empty(""),
    apiDetail: Joi.string().empty(""),
    apiImage: Joi.string().empty(""),
  };

  validateRequest(req, next, schemaRules);
};

const update = (req, res, next) => {
  paymentGatewayService
    .update(req.params.id, req.body)
    .then((service) =>
      res.json({ status: 200, data: service, message: "success" })
    )
    .catch(next);
};

const _delete = (req, res, next) => {
  paymentGatewayService
    .delete(req.params.id)
    .then(() =>
      res.json({
        status: 200,
        data: [],
        message: "Api deleted successfully",
      })
    )
    .catch(next);
};

const getAll = (req, res, next) => {
  paymentGatewayService
    .getAll(req.query)
    .then((service) =>
      res.json({ status: 200, data: service, message: "success" })
    )
    .catch(next);
};

router.get("/", getAll);
router.get("/:id", getById);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", _delete);

module.exports = router;
