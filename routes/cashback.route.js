const Joi = require("joi");
const express = require("express");
const router = express.Router();
const authorize = require("../_middleware/authorize");
const cashBackService = require("../controller/cashback.service");

const create = (req, res, next) => {
  cashBackService
    .create(req.body)
    .then((service) =>
      res.json({ status: 200, data: service, message: "success" })
    )
    .catch(next);
};

const getById = (req, res, next) => {
  cashBackService
    .getById(req.params.id)
    .then((service) =>
      res.json({ status: 200, data: service, message: "success" })
    )
    .catch(next);
};

const update = (req, res, next) => {
  cashBackService
    .update(req.params.id, req.body)
    .then((service) =>
      res.json({ status: 200, data: service, message: "success" })
    )
    .catch(next);
};

const _delete = (req, res, next) => {
  cashBackService
    .delete(req.params.id)
    .then(() =>
      res.json({
        status: 200,
        data: [],
        message: "cashback deleted successfully",
      })
    )
    .catch(next);
};

const getAll = (req, res, next) => {
  cashBackService
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
router.post("/getAll", cashBackService.getAll2);
router.post("/getForReport", cashBackService.getForReport);
router.post("/getReports", cashBackService.getTotalReports);
module.exports = router;
