const Joi = require("joi");
const express = require("express");
const router = express.Router();
const authorize = require("../_middleware/authorize");
const validateRequest = require("../_middleware/validate-request");
const rechargeController = require("../controller/recharge.service");

const create = (req, res, next) => {
  rechargeController
    .create(req.body)
    .then((rechargeData) => {
      console.log({ rechargeData });
      res.json({ status: 200, data: rechargeData, message: "success" });
    })
    .catch(next);
};

const getById = (req, res, next) => {
  rechargeController
    .getById(req.params.id)
    .then((rechargeData) =>
      res.json({ status: 200, data: rechargeData, message: "success" })
    )
    .catch(next);
};

const update = (req, res, next) => {
  rechargeController
    .update(req.params.id, req.body)
    .then((rechargeData) =>
      res.json({ status: 200, data: rechargeData, message: "success" })
    )
    .catch(next);
};

const _delete = (req, res, next) => {
  rechargeController
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
  rechargeController
    .getAll()
    .then((rechargeData) =>
      res.json({ status: 200, data: rechargeData, message: "success" })
    )
    .catch(next);
};

router.get("/", getAll);
router.get("/:id", getById);
// router.post("/", create);
router.post("/", rechargeController.createRecharge);
router.put("/:id", update);
router.delete("/:id", _delete);

module.exports = router;
