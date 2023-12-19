const Joi = require("joi");
const express = require("express");
const router = express.Router();
const authorize = require("../_middleware/authorize");
const apisService = require("../controller/apiResponses.service");

const create = (req, res, next) => {
  apisService
    .create(req.body)
    .then((service) =>
      res.json({ status: 200, data: service, message: "success" })
    )
    .catch(next);
};

const getById = (req, res, next) => {
  apisService
    .getById(req.params.id)
    .then((service) =>
      res.json({ status: 200, data: service, message: "success" })
    )
    .catch(next);
};

const update = (req, res, next) => {
  apisService
    .update(req.params.id, req.body)
    .then((service) =>
      res.json({ status: 200, data: service, message: "success" })
    )
    .catch(next);
};

const _delete = (req, res, next) => {
  apisService
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
  apisService
    .getAll(req.query)
    .then((service) =>
      res.json({ status: 200, data: service, message: "success" })
    )
    .catch(next);
};

router.get("/", getAll);
// router.get("/", apisService.getWithPagination);
router.get("/:id", getById);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", _delete);

module.exports = router;
