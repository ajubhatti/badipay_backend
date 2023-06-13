const express = require("express");
const router = express.Router();
const authorize = require("../_middleware/authorize");
const opertorService = require("../controller/operator.service");

const create = (req, res, next) => {
  opertorService
    .create(req.body)
    .then((operator) =>
      res.json({
        status: 200,
        data: operator,
        message: "created successfully.",
      })
    )
    .catch(next);
};

const getById = (req, res, next) => {
  opertorService
    .getById(req.params.id)
    .then((operator) =>
      res.json({ status: 200, data: operator, message: "success" })
    )
    .catch(next);
};

const update = (req, res, next) => {
  opertorService
    .update(req.params.id, req.body)
    .then((operator) =>
      res.json({
        status: 200,
        data: operator,
        message: "Updated successfully.",
      })
    )
    .catch(next);
};

const _delete = (req, res, next) => {
  opertorService
    .delete(req.params.id)
    .then(() =>
      res.json({
        status: 200,
        data: [],
        message: "Operator deleted successfully.",
      })
    )
    .catch(next);
};

const getAllOperator = (req, res, next) => {
  opertorService
    .getAll(req.body)
    .then((operator) =>
      res.json({ status: 200, data: operator, message: "success" })
    )
    .catch(next);
};

const getOperator = (req, res, next) => {
  opertorService
    .getOperatorWithPagination(req.body)
    .then((operator) =>
      res.json({ status: 200, data: operator, message: "success" })
    )
    .catch(next);
};

router.post("/", getAllOperator);
router.get("/:id", getById);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", _delete);
router.post("/getOperator", getOperator);

module.exports = router;
