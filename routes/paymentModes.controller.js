const Joi = require("joi");
const express = require("express");
const router = express.Router();
const paymentModeService = require("../controller/paymentModes.service");

const create = (req, res, next) => {
  paymentModeService
    .create(req.body)
    .then((modes) => res.json({ status: 200, data: modes, message: "success" }))
    .catch(next);
};

const getById = (req, res, next) => {
  paymentModeService
    .getModeById(req.params.id)
    .then((modes) => res.json({ status: 200, data: modes, message: "success" }))
    .catch(next);
};

const update = (req, res, next) => {
  paymentModeService
    .update(req.params.id, req.body)
    .then((modes) => res.json({ status: 200, data: modes, message: "success" }))
    .catch(next);
};

const _delete = (req, res, next) => {
  paymentModeService
    .delete(req.params.id)
    .then(() =>
      res.json({ status: 200, data: {}, message: "Mode deleted successfully" })
    )
    .catch(next);
};

const getAll = (req, res, next) => {
  paymentModeService
    .getAll()
    .then((modes) => res.json({ status: 200, data: modes, message: "success" }))
    .catch(next);
};

router.get("/", getAll);
router.get("/:id", getById);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", _delete);

module.exports = router;
