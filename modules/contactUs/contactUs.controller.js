const Joi = require("joi");
const express = require("express");
const router = express.Router();
const authorize = require("../../_middleware/authorize");
const contactUsServices = require("./contactUs.service");

const create = (req, res, next) => {
  contactUsServices
    .create(req.body)
    .then((data) => res.json({ status: 200, data: data, message: "success" }))
    .catch(next);
};

const getById = (req, res, next) => {
  contactUsServices
    .getById(req.params.id)
    .then((data) => res.json({ status: 200, data: data, message: "success" }))
    .catch(next);
};

const update = (req, res, next) => {
  contactUsServices
    .update(req.params.id, req.body)
    .then((data) => res.json({ status: 200, data: data, message: "success" }))
    .catch(next);
};

const _delete = (req, res, next) => {
  contactUsServices
    .delete(req.params.id)
    .then(() =>
      res.json({ status: 200, data: [], message: "Bank deleted successfully" })
    )
    .catch(next);
};

const getAll = (req, res, next) => {
  contactUsServices
    .getAll()
    .then((data) => res.json({ status: 200, data: data, message: "success" }))
    .catch(next);
};

router.get("/", getAll);
router.get("/:id", authorize(), getById);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", authorize(), _delete);

module.exports = router;
