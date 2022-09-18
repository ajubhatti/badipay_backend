const Joi = require("joi");
const express = require("express");
const router = express.Router();
const authorize = require("../../_middleware/authorize");
const companyService = require("./company.service");
const validateRequest = require("../../_middleware/validate-request");

const createSchema = (req, res, next) => {
  const schema = Joi.object({
    companyName: Joi.string().required(),
    companyDetail: Joi.string(),
  });
  validateRequest(req, next, schema);
};

const create = (req, res, next) => {
  companyService
    .create(req.body)
    .then((company) =>
      res.json({ status: 200, data: company, message: "success" })
    )
    .catch(next);
};

const getById = (req, res, next) => {
  companyService
    .getById(req.params.id)
    .then((company) =>
      res.json({ status: 200, data: company, message: "success" })
    )
    .catch(next);
};

const updateSchema = (req, res, next) => {
  const schemaRules = {
    companyName: Joi.string().empty(""),
    companyDetail: Joi.string().empty(""),
    image: Joi.string().empty(""),
  };

  validateRequest(req, next, schemaRules);
};

const update = (req, res, next) => {
  companyService
    .update(req.params.id, req.body)
    .then((company) =>
      res.json({ status: 200, data: company, message: "success" })
    )
    .catch(next);
};

const _delete = (req, res, next) => {
  companyService
    .delete(req.params.id)
    .then(() =>
      res.json({
        status: 200,
        data: [],
        message: "company deleted successfully",
      })
    )
    .catch(next);
};

const getAll = (req, res, next) => {
  companyService
    .getAll(req.query)
    .then((company) =>
      res.json({ status: 200, data: company, message: "success" })
    )
    .catch(next);
};

router.get("/", getAll);
router.get("/:id", authorize(), getById);
router.post("/", createSchema, create);
router.put("/:id", authorize(), updateSchema, update);
router.delete("/:id", authorize(), _delete);

module.exports = router;
