const Joi = require("joi");
const express = require("express");
const router = express.Router();
const apiConfigService = require("../controller/apiConfig.service");

const create = (req, res, next) => {
  apiConfigService
    .create(req.body)
    .then((service) =>
      res.json({ status: 200, data: service, message: "success" })
    )
    .catch(next);
};

const addApiConfigByScan = (req, res, next) => {
  apiConfigService
    .addApiConfigByScan(req.body)
    .then((service) =>
      res.json({ status: 200, data: service, message: "success" })
    )
    .catch(next);
};

const getById = (req, res, next) => {
  apiConfigService
    .getById(req.params.id)
    .then((service) =>
      res.json({ status: 200, data: service, message: "success" })
    )
    .catch(next);
};

const update = (req, res, next) => {
  apiConfigService
    .update(req.params.id, req.body)
    .then((service) =>
      res.json({ status: 200, data: service, message: "success" })
    )
    .catch(next);
};

const _delete = (req, res, next) => {
  apiConfigService
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
  apiConfigService
    .getAllApiConfigs(req.query)
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
router.post("/addByScan", addApiConfigByScan);

module.exports = router;
