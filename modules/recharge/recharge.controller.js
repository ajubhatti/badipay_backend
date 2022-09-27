const Joi = require("joi");
const express = require("express");
const router = express.Router();
const authorize = require("../../_middleware/authorize");
const rechargeService = require("./recharge.service");
const validateRequest = require("../../_middleware/validate-request");

const create = (req, res, next) => {
  rechargeService
    .create2(req.body)
    .then((rechargeData) =>
      res.json({ status: 200, data: rechargeData, message: "success" })
    )
    .catch(next);
};

const getById = (req, res, next) => {
  rechargeService
    .getById(req.params.id)
    .then((rechargeData) =>
      res.json({ status: 200, data: rechargeData, message: "success" })
    )
    .catch(next);
};

const update = (req, res, next) => {
  rechargeService
    .update(req.params.id, req.body)
    .then((rechargeData) =>
      res.json({ status: 200, data: rechargeData, message: "success" })
    )
    .catch(next);
};

const _delete = (req, res, next) => {
  rechargeService
    .delete(req.params.id)
    .then(() =>
      res.json({
        status: 200,
        data: [],
        message: "rechargeData deleted successfully",
      })
    )
    .catch(next);
};

const getAll = (req, res, next) => {
  rechargeService
    .getAll()
    .then((rechargeData) =>
      res.json({ status: 200, data: rechargeData, message: "success" })
    )
    .catch(next);
};

router.get("/", getAll);
router.get("/:id", getById);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", _delete);

module.exports = router;
