const Joi = require("joi");
const express = require("express");
const router = express.Router();
const authorize = require("../../_middleware/authorize");
const ambikaSlabService = require("./ambikaSlab.services");
const validateRequest = require("../../_middleware/validate-request");

const createSchema = (req, res, next) => {
  const schema = Joi.object({
    serviceProvider: Joi.string().required(),
    SPKey: Joi.string(),
    IsBilling: Joi.boolean(),
    serviceProviderType: Joi.string(),
  });
  validateRequest(req, next, schema);
};

const create = (req, res, next) => {
  ambikaSlabService
    .create(req.body)
    .then((service) =>
      res.json({ status: 200, data: service, message: "success" })
    )
    .catch(next);
};

const getById = (req, res, next) => {
  ambikaSlabService
    .getById(req.params.id)
    .then((service) =>
      res.json({ status: 200, data: service, message: "success" })
    )
    .catch(next);
};

const updateSchema = (req, res, next) => {
  const schemaRules = {
    serviceProvider: Joi.string().empty(""),
    SPKey: Joi.string().empty(""),
    IsBilling: Joi.boolean().empty(""),
  };

  validateRequest(req, next, schemaRules);
};

const update = (req, res, next) => {
  ambikaSlabService
    .update(req.params.id, req.body)
    .then((service) =>
      res.json({ status: 200, data: service, message: "success" })
    )
    .catch(next);
};

const _delete = (req, res, next) => {
  ambikaSlabService
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
  ambikaSlabService
    .getAll()
    .then((service) =>
      res.json({ status: 200, data: service, message: "success" })
    )
    .catch(next);
};

const getPlan = (req, res, next) => {
  ambikaSlabService.getPlan(req.body).then((service) => {
    res.json({ status: 200, data: service, message: "success" });
  });
};

const getProvider = (req, res, next) => {
  ambikaSlabService.getListByType(req.body).then((service) => {
    res.json({ status: 200, data: service, message: "success" });
  });
};

const ambikaRecharge = (req, res, next) => {
  ambikaSlabService.ambikaRecharge(req.body).then((service) => {
    res.json({ status: 200, data: service, message: "success" });
  });
};

router.get("/", getAll);
router.get("/:id", authorize(), getById);
router.post("/create", createSchema, create);
router.put("/:id", authorize(), updateSchema, update);
router.delete("/:id", authorize(), _delete);

router.post("/getPlan", getPlan);
router.post("/getProvider", getProvider);
router.post("/ambikaRecharge", ambikaRecharge);

module.exports = router;
