const Joi = require("joi");
const express = require("express");
const router = express.Router();
const authorize = require("../_middleware/authorize");
const validateRequest = require("../_middleware/validate-request");
const rechargeController = require("../controller/recharge.service");

const create = (req, res, next) => {
  rechargeController
    .createNewRecharge(req.body)
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
    .updateRechargeById(req.params.id, req.body)
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

const rechargeCallBack = (req, res, next) => {
  rechargeController
    .rechargeCallBack(req)
    .then((rechargeData) =>
      res.json({ status: 200, data: rechargeData, message: "success" })
    )
    .catch(next);
};

const updateComplaintsStatus = (req, res, next) => {
  rechargeController
    .updateComplaintsStatus(req)
    .then((rechargeData) =>
      res.json({ status: 200, data: rechargeData, message: "success" })
    )
    .catch(next);
};

router.get("/", getAll);
router.get("/:id", getById);
// router.post("/", create);
router.post("/", rechargeController.createNewRecharge);
router.put("/:id", update);
router.delete("/:id", _delete);
router.post("/getRecharges", rechargeController.rechargeListWithPagination);
router.post("/rechargeCallBack", rechargeCallBack);
router.post("/updateComplaintsStatus", updateComplaintsStatus);

module.exports = router;
