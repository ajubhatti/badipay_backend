const Joi = require("joi");
const express = require("express");
const router = express.Router();
const authorize = require("../../_middleware/authorize");
const servicesService = require("./services.service");
const validateRequest = require("../../_middleware/validate-request");

const createSchema = (req, res, next) => {
  const schema = Joi.object({
    serviceName: Joi.string().required(),
    serviceDetail: Joi.string(),
  });
  validateRequest(req, next, schema);
};

const create = (req, res, next) => {
  servicesService
    .create(req.body)
    .then((service) =>
      res.json({ status: 200, data: service, message: "success" })
    )
    .catch(next);
};

const getById = (req, res, next) => {
  servicesService
    .getById(req.params.id)
    .then((service) =>
      res.json({ status: 200, data: service, message: "success" })
    )
    .catch(next);
};

const updateSchema = (req, res, next) => {
  const schemaRules = {
    serviceName: Joi.string().empty(""),
    serviceDetail: Joi.string().empty(""),
    serviceImage: Joi.string().empty(""),
  };

  validateRequest(req, next, schemaRules);
};

const update = (req, res, next) => {
  servicesService
    .update(req.params.id, req.body)
    .then((service) =>
      res.json({ status: 200, data: service, message: "success" })
    )
    .catch(next);
};

const _delete = (req, res, next) => {
  servicesService
    .delete(req.params.id)
    .then(() =>
      res.json({
        status: 200,
        data: [],
        message: "services deleted successfully",
      })
    )
    .catch(next);
};

const getAll = (req, res, next) => {
  servicesService
    .getAll()
    .then((service) =>
      res.json({ status: 200, data: service, message: "success" })
    )
    .catch(next);
};

const getPlan = (req, res, next) => {
  console.log("gete");
  servicesService.getPlan().then((service) => {
    console.log({ service });
    res.json({ status: 200, data: service, message: "success" });
  });
};

router.get("/", getAll);
router.get("/:id", authorize(), getById);
router.post("/", createSchema, create);
router.put("/:id", authorize(), updateSchema, update);
router.delete("/:id", authorize(), _delete);

router.post("/getPlan", getPlan);

module.exports = router;
