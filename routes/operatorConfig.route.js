const express = require("express");
const router = express.Router();
const authorize = require("../_middleware/authorize");
const operatorConfigService = require("../controller/operatorConfig.services");

const getById = (req, res, next) => {
  const { id } = req.body;
  operatorConfigService
    .getById(id)
    .then((operator) =>
      res.json({ status: 200, data: operator, message: "success" })
    )
    .catch(next);
};

const create = (req, res, next) => {
  operatorConfigService
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

const getAllWithPagination = (req, res, next) => {
  operatorConfigService
    .operatorConfigDataPageWise(req.body)
    .then((operator) =>
      res.json({ status: 200, data: operator, message: "success" })
    )
    .catch(next);
};

const getAll = (req, res, next) => {
  operatorConfigService
    .getAll(req.body)
    .then((operator) =>
      res.json({ status: 200, data: operator, message: "success" })
    )
    .catch(next);
};

const scanAndAdd = (req, res, next) => {
  operatorConfigService
    .scanAndAdd(req.body)
    .then((operator) =>
      res.json({ status: 200, data: operator, message: "success" })
    )
    .catch(next);
};

const updateConfig = (req, res, next) => {
  operatorConfigService
    .update(req.params.id, req.body)
    .then((operator) =>
      res.json({
        status: 200,
        data: operator,
        message: "updated successfully.",
      })
    )
    .catch(next);
};

const deleteConfig = (req, res, next) => {
  operatorConfigService
    .delete(req.body)
    .then((operator) =>
      res.json({
        status: 200,
        data: operator,
        message: "deleted successfully.",
      })
    )
    .catch(next);
};

router.post("/getWithPagination", getAllWithPagination);
router.post("/getAll", getAll);
router.get("/:id", getById);
router.post("/create", create);
router.post("/scanAndAdd", scanAndAdd); // mapping of all operator and api and add in database
router.put("/:id", updateConfig);
router.delete("/:id", deleteConfig);

module.exports = router;
