const Joi = require("joi");
const express = require("express");
const router = express.Router();
const authorize = require("../_middleware/authorize");
const stateService = require("../controller/states.service");
const validateRequest = require("../_middleware/validate-request");

const createSchema = (req, res, next) => {
  const schema = Joi.object({
    stateName: Joi.string().required(),
    stateCode: Joi.string(),
  });
  validateRequest(req, next, schema);
};

const create = (req, res, next) => {
  stateService
    .create(req.body)
    .then((state) => res.json({ status: 200, data: state, message: "success" }))
    .catch(next);
};

const getById = (req, res, next) => {
  stateService
    .getById(req.params.id)
    .then((state) => res.json({ status: 200, data: state, message: "success" }))
    .catch(next);
};

const updateSchema = (req, res, next) => {
  const schemaRules = {
    stateName: Joi.string().required().empty(""),
    stateCode: Joi.string().empty(""),
  };
  validateRequest(req, next, schemaRules);
};

const update = (req, res, next) => {
  stateService
    .update(req.params.id, req.body)
    .then((state) => res.json({ status: 200, data: state, message: "success" }))
    .catch(next);
};

const _delete = (req, res, next) => {
  stateService
    .delete(req.params.id)
    .then(() =>
      res.json({ status: 200, data: [], message: "state deleted successfully" })
    )
    .catch(next);
};

const getAll = (req, res, next) => {
  stateService
    .getAll()
    .then((state) => res.json({ status: 200, data: state, message: "success" }))
    .catch(next);
};

router.get("/", getAll);
router.get("/:id", getById);
router.post("/", create);
router.put("/:id", updateSchema, update);
router.delete("/:id", _delete);

module.exports = router;
