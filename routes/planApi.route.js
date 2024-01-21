const Joi = require("joi");
const express = require("express");
const router = express.Router();
const planApiService = require("../controller/planApi.service");

const create = (req, res, next) => {
  planApiService
    .create(req.body)
    .then((state) => res.json({ status: 200, data: state, message: "success" }))
    .catch(next);
};

const getById = (req, res, next) => {
  planApiService
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
  planApiService
    .update(req.params.id, req.body)
    .then((state) => res.json({ status: 200, data: state, message: "success" }))
    .catch(next);
};

const _delete = (req, res, next) => {
  planApiService
    .delete(req.params.id)
    .then(() =>
      res.json({ status: 200, data: [], message: "state deleted successfully" })
    )
    .catch(next);
};

const getAll = (req, res, next) => {
  planApiService
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
