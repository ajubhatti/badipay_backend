const Joi = require("joi");
const express = require("express");
const router = express.Router();
const authorize = require("../_middleware/authorize");
const adminLoyaltyService = require("../controller/adminLoyalty.service");

const create = (req, res, next) => {
  adminLoyaltyService
    .create(req.body)
    .then((service) =>
      res.json({ status: 200, data: service, message: "success" })
    )
    .catch(next);
};

const getById = (req, res, next) => {
  adminLoyaltyService
    .getById(req.params.id)
    .then((service) =>
      res.json({ status: 200, data: service, message: "success" })
    )
    .catch(next);
};

const update = (req, res, next) => {
  adminLoyaltyService
    .update(req.params.id, req.body)
    .then((service) =>
      res.json({ status: 200, data: service, message: "success" })
    )
    .catch(next);
};

const _delete = (req, res, next) => {
  adminLoyaltyService
    .delete(req.params.id)
    .then(() =>
      res.json({
        status: 200,
        data: [],
        message: "admin loyalty deleted successfully",
      })
    )
    .catch(next);
};

const getAll = (req, res, next) => {
  adminLoyaltyService
    .getAll()
    .then((service) =>
      res.json({ status: 200, data: service, message: "success" })
    )
    .catch(next);
};

router.get("/", getAll);
router.get("/:id", getById);
router.post("/", create); 
router.put("/:id", update);
router.delete("/:id", authorize(), _delete);
router.post("/getAll", adminLoyaltyService.getAll2);
module.exports = router;
