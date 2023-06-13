const express = require("express");
const router = express.Router();
const authorize = require("../_middleware/authorize");
const slabService = require("../controller/operatorSlabs.services");

const getById = (req, res, next) => {
  const { id } = req.body;
  slabService
    .getById(id)
    .then((operator) =>
      res.json({ status: 200, data: operator, message: "success" })
    )
    .catch(next);
};

const create = (req, res, next) => {
  slabService
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
  slabService
    .slabListDataPageWise(req.body)
    .then((operator) =>
      res.json({ status: 200, data: operator, message: "success" })
    )
    .catch(next);
};

const scanAndAdd = (req, res, next) => {
  slabService
    .scanAndAdd(req.body)
    .then((operator) =>
      res.json({ status: 200, data: operator, message: "success" })
    )
    .catch(next);
};

const updateConfig = (req, res, next) => {
  slabService
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
  slabService
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

router.post("/getAll", getAllWithPagination);
router.get("/:id", getById);
router.post("/create", create);
router.post("/scanAndAdd", scanAndAdd); // mapping of all operator and api and add in database
router.put("/:id", updateConfig);
router.delete("/:id", deleteConfig);

module.exports = router;
